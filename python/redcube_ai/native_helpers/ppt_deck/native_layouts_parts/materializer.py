import json
import shutil
import subprocess
from pathlib import Path

from redcube_ai.native_helpers.ppt_deck.native_layout_constants import SLIDE_HEIGHT_IN, SLIDE_WIDTH_IN
from redcube_ai.native_helpers.ppt_deck.native_manifest_qa import fail_closed_on_manifest_qa, manifest_qa_failures
from redcube_ai.native_helpers.ppt_deck.native_package import (
    copy_template_source,
    patch_chart_data,
    patch_custom_paths,
    read_pptx_package,
    template_preservation,
)
from redcube_ai.native_helpers.ppt_deck.native_layouts_parts.common import native_ai_design_shapes, safe_list, safe_text, shape_kind
from redcube_ai.native_helpers.ppt_deck.native_layouts_parts.geometry import ai_shape_bounds_in, pptx_geometry_audit, shape_rect_from_ai_bounds
from redcube_ai.native_helpers.ppt_deck.native_layouts_parts.officecli import (
    canonical_object_kind,
    native_shape_manifest_record,
    officecli_command_for_ai_shape,
)
from redcube_ai.native_helpers.ppt_deck.native_layouts_parts.slide_metadata import layout_family, primary_point_count, slide_title
from redcube_ai.native_helpers.ppt_deck.native_layouts_parts.style import resolve_color
from redcube_ai.native_helpers.ppt_deck.native_layouts_parts.svg_ir import render_slide_svg_ir
from redcube_ai.native_helpers.ppt_deck.native_layouts_parts.validation import validate_ai_first_design_plan

__all__ = [
    'parse_json_output',
    'issue_count',
    'materialize_native_pptx',
    'build_deck',
]


def parse_json_output(completed: subprocess.CompletedProcess):
    text = safe_text(completed.stdout)
    if not text:
        raise RuntimeError('officecli returned empty JSON output')
    try:
        payload = json.loads(text)
    except json.JSONDecodeError as exc:
        raise RuntimeError(
            'officecli returned invalid JSON: '
            + json.dumps({'stdout': text, 'stderr': safe_text(completed.stderr)}, ensure_ascii=False)
        ) from exc
    if not isinstance(payload, dict):
        raise RuntimeError(f'officecli returned invalid JSON envelope: expected object, got {type(payload).__name__}')
    if payload.get('success') is not True:
        raise RuntimeError(
            'officecli returned unsuccessful JSON envelope: '
            + json.dumps(payload, ensure_ascii=False, sort_keys=True)
        )
    args = [safe_text(value) for value in completed.args] if isinstance(completed.args, (list, tuple)) else []
    verb = args[1] if len(args) > 1 else ''
    view_mode = args[3] if verb == 'view' and len(args) > 3 else ''
    data = payload.get('data')
    if verb == 'view' and view_mode in {'issues', 'text'}:
        if not isinstance(data, dict):
            raise RuntimeError(f'officecli view {view_mode} JSON data must be an object')
    if verb == 'view' and view_mode == 'issues':
        issue_count(payload)
    if verb == 'validate' and data is None:
        raise RuntimeError('officecli validate JSON data is required')
    return payload


def issue_count(payload: dict) -> int:
    data = payload.get('data')
    if not isinstance(data, dict) or 'count' not in data:
        raise RuntimeError('officecli view issues JSON data.count is required')
    raw = data['count']
    if isinstance(raw, bool) or not isinstance(raw, int) or raw < 0:
        raise RuntimeError(f'officecli view issues JSON data.count must be a non-negative integer: {raw!r}')
    return raw


def _run_officecli(officecli: str, args, *, input_text: str | None = None) -> subprocess.CompletedProcess:
    completed = subprocess.run(
        [officecli, *args],
        text=True,
        input=input_text,
        capture_output=True,
        check=False,
    )
    if completed.returncode != 0:
        raise RuntimeError(
            'officecli materializer command failed: '
            + json.dumps({
                'args': args,
                'stdout': completed.stdout,
                'stderr': completed.stderr,
                'returncode': completed.returncode,
            }, ensure_ascii=False, sort_keys=True)
        )
    return completed


def _prop_args(props: dict) -> list[str]:
    args = []
    for key, value in props.items():
        if value is None:
            continue
        if isinstance(value, bool):
            value = 'true' if value else 'false'
        args.extend(['--prop', f'{key}={value}'])
    return args


def _object_path(slide_index: int, shape_spec: dict) -> str:
    kind = canonical_object_kind(shape_spec)
    name = safe_text(shape_spec.get('shape_id'))
    element = {
        'connector': 'connector',
        'line': 'connector',
        'picture': 'picture',
        'chart': 'chart',
        'table': 'table',
        'metric_grid': 'table',
        'group': 'group',
    }.get(kind, 'shape')
    return f'/slide[{slide_index}]/{element}[@name={name}]'


SUPPORTED_ANIMATION_TARGET_KINDS = {'text_box', 'shape', 'rect', 'rounded_rect', 'oval', 'path'}


def _animation_object_kind(shape: dict) -> str:
    try:
        return canonical_object_kind(shape)
    except ValueError:
        return shape_kind(shape)


def _animation_target_failures(slides: list[dict]) -> list[dict]:
    failures = []
    for slide_index, slide_data in enumerate(slides, 1):
        animations = [
            item for item in safe_list(slide_data.get('animation_timeline'))
            if isinstance(item, dict)
        ]
        if not animations:
            continue
        top_level_by_id = {
            safe_text(shape.get('shape_id')): shape
            for shape in native_ai_design_shapes(slide_data)
            if safe_text(shape.get('shape_id'))
        }
        group_children_by_id = {}

        def collect_group_children(shape: dict) -> None:
            kind = _animation_object_kind(shape)
            stable_drawing = kind in {'chart', 'table', 'metric_grid'} and safe_text(
                shape.get('materialization_intent'), 'native_data_object'
            ) == 'stable_drawingml'
            if kind != 'group' and not stable_drawing:
                return
            children = safe_list(shape.get('drawingml_shapes') or shape.get('children'))
            for child in [item for item in children if isinstance(item, dict)]:
                child_id = safe_text(child.get('shape_id'))
                if child_id:
                    group_children_by_id[child_id] = child
                collect_group_children(child)

        for shape in native_ai_design_shapes(slide_data):
            collect_group_children(shape)
        for animation in animations:
            target_id = safe_text(animation.get('target_shape_id') or animation.get('target_id'))
            target = top_level_by_id.get(target_id)
            if target is None:
                child = group_children_by_id.get(target_id)
                failures.append({
                    'slide_index': slide_index,
                    'slide_id': safe_text(slide_data.get('slide_id'), f'S{slide_index:02d}'),
                    'shape_id': target_id,
                    'kind': _animation_object_kind(child) if child is not None else '',
                    'materialization_intent': safe_text((child or {}).get('materialization_intent')),
                    'reason': 'animation_target_group_child' if child is not None else 'animation_target_missing',
                })
                continue
            kind = _animation_object_kind(target)
            intent = safe_text(target.get('materialization_intent'), 'native_data_object' if kind == 'chart' else '')
            if kind in SUPPORTED_ANIMATION_TARGET_KINDS or (kind == 'chart' and intent == 'native_data_object'):
                continue
            reason = (
                'animation_target_stable_drawingml_group_unsupported'
                if kind in {'chart', 'table', 'metric_grid'} and intent == 'stable_drawingml'
                else 'animation_target_kind_unsupported'
            )
            failures.append({
                'slide_index': slide_index,
                'slide_id': safe_text(slide_data.get('slide_id'), f'S{slide_index:02d}'),
                'shape_id': target_id,
                'kind': kind,
                'materialization_intent': intent,
                'reason': reason,
            })
    return failures


def _assert_animation_targets(slides: list[dict]) -> None:
    failures = _animation_target_failures(slides)
    if failures:
        raise ValueError(
            'native PPT animation target preflight failed: '
            + json.dumps(failures, ensure_ascii=False, sort_keys=True)
        )


def _children_for_group(shape_spec: dict, kind: str) -> list[dict]:
    key = 'drawingml_shapes' if kind in {'chart', 'table', 'metric_grid'} else 'children'
    children = [item for item in safe_list(shape_spec.get(key) or shape_spec.get('children')) if isinstance(item, dict)]
    if not children:
        raise ValueError(f"native PPT {kind} requires non-empty {key}: {safe_text(shape_spec.get('shape_id'), '<missing>')}")
    return children


def _collect_object_commands(slide_data: dict, slide_index: int):
    commands = []
    groups = []
    path_specs = []
    chart_specs = []
    flattened = []

    def collect(shape_spec: dict) -> None:
        kind = canonical_object_kind(shape_spec)
        stable_drawing = kind in {'chart', 'table', 'metric_grid'} and safe_text(
            shape_spec.get('materialization_intent'), 'native_data_object'
        ) == 'stable_drawingml'
        if kind == 'group' or stable_drawing:
            children = _children_for_group(shape_spec, kind)
            for child in children:
                collect(child)
            groups.append({
                'slide_index': slide_index,
                'shape_spec': shape_spec,
                'children': children,
            })
            flattened.append(shape_spec)
            return
        bounds_in = ai_shape_bounds_in(shape_spec)
        if bounds_in is None:
            raise ValueError(f"native PPT object has invalid bounds: {safe_text(shape_spec.get('shape_id'), '<missing>')}")
        bounds_px = shape_rect_from_ai_bounds(shape_spec)
        commands.append(officecli_command_for_ai_shape(shape_spec, slide_index, bounds_in, bounds_px))
        flattened.append(shape_spec)
        if kind == 'path':
            path_specs.append({'slide_index': slide_index, 'shape_spec': shape_spec})
        if kind == 'chart':
            chart_specs.append({'slide_index': slide_index, 'shape_spec': shape_spec})

    for shape_spec in native_ai_design_shapes(slide_data):
        collect(shape_spec)
    commands.sort(key=lambda command: command.get('type') == 'connector')
    return commands, groups, path_specs, chart_specs, flattened


def _apply_paragraph_and_run_formatting(officecli: str, output_pptx: Path, slide_index: int, shape_spec: dict) -> int:
    if canonical_object_kind(shape_spec) != 'text_box':
        return 0
    paragraphs = [item for item in safe_list(shape_spec.get('paragraphs')) if isinstance(item, dict)]
    if not paragraphs:
        return 0
    command_count = 0
    object_path = _object_path(slide_index, shape_spec)
    for paragraph_index, paragraph in enumerate(paragraphs, 1):
        paragraph_path = f'{object_path}/p[{paragraph_index}]'
        props = {}
        if paragraph.get('bullet') is True:
            props['list'] = 'bullet'
        if paragraph.get('level') not in (None, ''):
            props['level'] = paragraph.get('level')
        for key in ('align', 'size', 'bold', 'italic', 'color', 'lineSpacing'):
            if paragraph.get(key) not in (None, ''):
                props[key] = paragraph[key]
        if props:
            _run_officecli(officecli, ['set', str(output_pptx), paragraph_path, *_prop_args(props)])
            command_count += 1
        offset = 0
        for run in [item for item in safe_list(paragraph.get('runs')) if isinstance(item, dict)]:
            text = str(run.get('text') or '')
            end = offset + len(text)
            run_props = {'range': f'{offset}:{end}'}
            for key in ('font', 'size', 'bold', 'italic', 'color', 'underline'):
                if run.get(key) not in (None, ''):
                    run_props[key] = run[key]
            if text and len(run_props) > 1:
                _run_officecli(officecli, ['set', str(output_pptx), paragraph_path, *_prop_args(run_props)])
                command_count += 1
            offset = end
    return command_count


def _apply_table_formatting(officecli: str, output_pptx: Path, slide_index: int, shape_spec: dict) -> int:
    if canonical_object_kind(shape_spec) not in {'table', 'metric_grid'}:
        return 0
    data = safe_list(shape_spec.get('data'))
    if not data:
        return 0
    body_props = {}
    for source_key, target_key in [
        ('body_font', 'font'),
        ('body_font_size', 'size'),
        ('body_color', 'color'),
    ]:
        if shape_spec.get(source_key) not in (None, ''):
            body_props[target_key] = shape_spec[source_key]
    header_props = dict(body_props)
    for source_key, target_key in [
        ('header_font', 'font'),
        ('header_font_size', 'size'),
        ('header_color', 'color'),
    ]:
        if shape_spec.get(source_key) not in (None, ''):
            header_props[target_key] = shape_spec[source_key]
    if any(shape_spec.get(key) not in (None, '') for key in ('header_font', 'header_font_size', 'header_color')):
        header_props['bold'] = bool(shape_spec.get('header_bold', True))
    command_count = 0
    table_path = _object_path(slide_index, shape_spec)
    for row_index, row in enumerate(data, 1):
        props = header_props if row_index == 1 and shape_spec.get('first_row', True) else body_props
        if not props:
            continue
        for column_index in range(1, len(row) + 1):
            _run_officecli(
                officecli,
                [
                    'set',
                    str(output_pptx),
                    f'{table_path}/tr[{row_index}]/tc[{column_index}]',
                    *_prop_args(props),
                ],
            )
            command_count += 1
    return command_count


def _apply_groups(officecli: str, output_pptx: Path, groups: list[dict]) -> int:
    command_count = 0
    for group in groups:
        slide_index = group['slide_index']
        shape_spec = group['shape_spec']
        child_paths = [_object_path(slide_index, child) for child in group['children']]
        _run_officecli(officecli, [
            'add', str(output_pptx), f'/slide[{slide_index}]', '--type', 'group',
            '--prop', f"name={safe_text(shape_spec.get('shape_id'))}",
            '--prop', f"shapes={','.join(child_paths)}",
        ])
        command_count += 1
    return command_count


def _speaker_notes(slide_data: dict) -> str:
    notes = slide_data.get('speaker_notes') or slide_data.get('notes')
    if isinstance(notes, dict):
        notes = notes.get('text') or notes.get('speaker_notes')
    return safe_text(notes)


def _transition_props(slide_data: dict) -> dict:
    transition = slide_data.get('transition')
    if isinstance(transition, str):
        return {'transition': transition}
    if not isinstance(transition, dict) or not transition:
        return {}
    transition_type = safe_text(transition.get('type') or transition.get('transition'))
    if not transition_type:
        raise ValueError('native PPT transition requires type')
    direction = safe_text(transition.get('direction'))
    speed = safe_text(transition.get('speed'))
    duration = transition.get('duration_ms')
    suffix = direction or ''
    if duration not in (None, ''):
        suffix = f'{suffix}-{int(duration)}' if suffix else str(int(duration))
    elif speed:
        suffix = f'{suffix}-{speed}' if suffix else speed
    props = {'transition': f'{transition_type}-{suffix}' if suffix else transition_type}
    if transition.get('advance_time_ms') not in (None, ''):
        props['advanceTime'] = int(transition['advance_time_ms'])
    if transition.get('advance_click') is not None:
        props['advanceClick'] = bool(transition['advance_click'])
    return props


def _apply_notes_and_motion(officecli: str, output_pptx: Path, slides: list[dict], slide_indices: list[int], flattened: dict[int, list[dict]]) -> int:
    command_count = 0
    timing_used = False
    for slide_data, slide_index in zip(slides, slide_indices):
        notes = _speaker_notes(slide_data)
        if notes:
            _run_officecli(officecli, [
                'add', str(output_pptx), f'/slide[{slide_index}]', '--type', 'notes', '--prop', f'text={notes}',
            ])
            command_count += 1
        transition = _transition_props(slide_data)
        if transition:
            _run_officecli(officecli, ['set', str(output_pptx), f'/slide[{slide_index}]', *_prop_args(transition)])
            command_count += 1
            timing_used = True
        by_id = {safe_text(item.get('shape_id')): item for item in flattened.get(slide_index, [])}
        for animation in [item for item in safe_list(slide_data.get('animation_timeline')) if isinstance(item, dict)]:
            target_id = safe_text(animation.get('target_shape_id') or animation.get('target_id'))
            target = by_id.get(target_id)
            if target is None:
                raise ValueError(f'native PPT animation target not found: {target_id or "<missing>"}')
            target_kind = canonical_object_kind(target)
            if target_kind not in {'text_box', 'shape', 'rect', 'rounded_rect', 'oval', 'path', 'chart'}:
                raise ValueError(f'native PPT animation target kind is not supported by OfficeCLI: {target_kind}')
            props = {
                'effect': safe_text(animation.get('effect'), 'fade'),
                'class': safe_text(animation.get('class'), 'entrance'),
                'trigger': safe_text(animation.get('trigger'), 'onClick'),
            }
            for source_key, target_key in [
                ('duration_ms', 'duration'),
                ('delay_ms', 'delay'),
                ('direction', 'direction'),
                ('repeat', 'repeat'),
                ('restart', 'restart'),
                ('auto_reverse', 'autoReverse'),
                ('path', 'path'),
                ('path_data', 'd'),
                ('chart_build', 'chartBuild'),
            ]:
                if animation.get(source_key) not in (None, ''):
                    props[target_key] = animation[source_key]
            _run_officecli(officecli, [
                'add', str(output_pptx), _object_path(slide_index, target), '--type', 'animation', *_prop_args(props),
            ])
            command_count += 1
            timing_used = True
    if timing_used:
        _run_officecli(officecli, ['set', str(output_pptx), '/', '--prop', 'show.useTimings=true'])
        command_count += 1
    return command_count


def _template_mode(template_intake: dict | None) -> str:
    if not template_intake:
        return 'none'
    mode = safe_text(template_intake.get('mode'), 'replace_slides')
    if mode not in {'replace_slides', 'fill_existing'}:
        raise ValueError(f'unsupported native PPT template mode: {mode}')
    return mode


def _fill_existing_slide_indices(slides: list[dict], slide_count: int) -> list[int]:
    indices = []
    for index, slide_data in enumerate(slides, 1):
        binding = slide_data.get('template_layout_binding') if isinstance(slide_data.get('template_layout_binding'), dict) else {}
        target_slide_index = binding.get('target_slide_index')
        if target_slide_index in (None, ''):
            target_slide_index = index
        try:
            indices.append(int(target_slide_index))
        except (TypeError, ValueError) as exc:
            raise ValueError('native PPT fill_existing target_slide_index must be an integer') from exc
    expected = list(range(1, slide_count + 1))
    if sorted(indices) != expected:
        raise ValueError(
            'native PPT fill_existing requires unique complete target_slide_index coverage: '
            f'expected {expected}, got {indices}'
        )
    return indices


def materialize_native_pptx(slides, output_pptx: Path, template_intake: dict | None = None) -> dict:
    _assert_animation_targets(slides)
    officecli = shutil.which('officecli')
    if not officecli:
        raise RuntimeError('native PPT officecli materializer requires officecli on PATH')
    output_pptx = Path(output_pptx)
    output_pptx.parent.mkdir(parents=True, exist_ok=True)
    mode = _template_mode(template_intake)
    template_before = None
    fill_existing_indices = []
    if mode == 'none':
        output_pptx.unlink(missing_ok=True)
        _run_officecli(officecli, ['create', str(output_pptx)])
    else:
        source_pptx = safe_text((template_intake or {}).get('source_pptx'))
        if not source_pptx:
            raise ValueError('native PPT template intake requires source_pptx')
        source_path = Path(source_pptx).resolve()
        if source_path == output_pptx.resolve():
            raise ValueError('native PPT template source_pptx and output_pptx must be different files')
        source_readback = read_pptx_package(source_path)
        if mode == 'fill_existing':
            fill_existing_indices = _fill_existing_slide_indices(
                slides,
                int(source_readback.get('slide_count') or 0),
            )
        output_pptx.unlink(missing_ok=True)
        template_before = copy_template_source(Path(source_pptx), output_pptx)

    commands = []
    groups = []
    path_specs = []
    chart_specs = []
    flattened = {}
    text_probe = []
    slide_indices = []
    _run_officecli(officecli, ['open', str(output_pptx)])
    try:
        if mode == 'none':
            _run_officecli(officecli, [
                'set', str(output_pptx), '/',
                '--prop', f'slideWidth={SLIDE_WIDTH_IN:g}in',
                '--prop', f'slideHeight={SLIDE_HEIGHT_IN:g}in',
            ])
        if mode == 'replace_slides':
            for slide_index in range(int(template_before.get('slide_count') or 0), 0, -1):
                _run_officecli(officecli, ['remove', str(output_pptx), f'/slide[{slide_index}]'])
        for index, slide_data in enumerate(slides, 1):
            if mode == 'fill_existing':
                slide_index = fill_existing_indices[index - 1]
                background = safe_text(slide_data.get('background'))
                if background:
                    commands.append({
                        'command': 'set',
                        'path': f'/slide[{slide_index}]',
                        'props': {'background': resolve_color(background, 'bg')},
                    })
            else:
                slide_index = index
                binding = slide_data.get('template_layout_binding') if isinstance(slide_data.get('template_layout_binding'), dict) else {}
                layout_name = safe_text(binding.get('layout_name') or binding.get('source_layout_name'), 'blank')
                commands.append({
                    'command': 'add',
                    'parent': '/',
                    'type': 'slide',
                    'props': {
                        'layout': layout_name,
                        'background': resolve_color(slide_data.get('background'), 'bg'),
                    },
                })
            slide_indices.append(slide_index)
            object_commands, object_groups, object_paths, object_charts, object_specs = _collect_object_commands(slide_data, slide_index)
            commands.extend(object_commands)
            groups.extend(object_groups)
            path_specs.extend(object_paths)
            chart_specs.extend(object_charts)
            flattened[slide_index] = object_specs
            text_probe.extend(
                safe_text(record.get('text'))
                for record in (native_shape_manifest_record(shape) for shape in native_ai_design_shapes(slide_data))
                if safe_text(record.get('text'))
            )
        _run_officecli(officecli, ['batch', str(output_pptx)], input_text=json.dumps(commands, ensure_ascii=False))
        post_command_count = 0
        for slide_index, object_specs in flattened.items():
            for shape_spec in object_specs:
                post_command_count += _apply_paragraph_and_run_formatting(officecli, output_pptx, slide_index, shape_spec)
                post_command_count += _apply_table_formatting(officecli, output_pptx, slide_index, shape_spec)
        post_command_count += _apply_groups(officecli, output_pptx, groups)
        post_command_count += _apply_notes_and_motion(officecli, output_pptx, slides, slide_indices, flattened)
        _run_officecli(officecli, ['save', str(output_pptx)])
    finally:
        _run_officecli(officecli, ['close', str(output_pptx)])

    patch_custom_paths(output_pptx, path_specs)
    patch_chart_data(output_pptx, chart_specs)
    _run_officecli(officecli, ['open', str(output_pptx)])
    try:
        validate = _run_officecli(officecli, ['validate', str(output_pptx), '--json'])
        issues = _run_officecli(officecli, ['view', str(output_pptx), 'issues', '--json'])
        text = _run_officecli(officecli, ['view', str(output_pptx), 'text', '--json'])
    finally:
        _run_officecli(officecli, ['close', str(output_pptx)])
    validate_payload = parse_json_output(validate)
    issues_payload = parse_json_output(issues)
    text_payload = parse_json_output(text)
    validate_count = 0
    issues_count = issue_count(issues_payload)
    if validate_count > 0 or issues_count > 0:
        raise RuntimeError(
            'native PPTX officecli quality gate failed: '
            + json.dumps({
                'validate_count': validate_count,
                'issues_count': issues_count,
                'validate': validate_payload,
                'view_issues': issues_payload,
            }, ensure_ascii=False, sort_keys=True)
        )
    package_readback = read_pptx_package(output_pptx)
    expected_canvas = (template_before or {}).get('canvas_in') or {
        'width': SLIDE_WIDTH_IN,
        'height': SLIDE_HEIGHT_IN,
    }
    geometry_audit = pptx_geometry_audit(
        output_pptx,
        expected_width_in=float(expected_canvas.get('width') or SLIDE_WIDTH_IN),
        expected_height_in=float(expected_canvas.get('height') or SLIDE_HEIGHT_IN),
    )
    if not geometry_audit['ok']:
        raise RuntimeError(
            'native PPTX geometry audit failed: '
            + json.dumps(geometry_audit, ensure_ascii=False, sort_keys=True)
        )
    return {
        'materializer': 'officecli_pptx_materializer',
        'command_count': len(commands) + post_command_count,
        'save_before_close': True,
        'validate': validate_payload,
        'view_issues': issues_payload,
        'view_text': text_payload,
        'expected_text_fragments': text_probe,
        'geometry_audit': geometry_audit,
        'package_readback': package_readback,
        'template_preservation': template_preservation(template_before, package_readback, mode),
        'plan_slide_indices': slide_indices,
    }


def _expected_materialized_kinds(native_shape: dict) -> set[str]:
    semantic_kind = safe_text(native_shape.get('semantic_kind') or native_shape.get('kind'))
    if semantic_kind in {'line', 'connector'}:
        return {'connector'}
    if semantic_kind in {'chart', 'table', 'metric_grid'}:
        if safe_text(native_shape.get('materialization_intent')) == 'stable_drawingml':
            return {'group'}
        return {'chart' if semantic_kind == 'chart' else 'table'}
    if semantic_kind == 'group':
        return {'group'}
    if semantic_kind == 'shape':
        return {'shape', 'rect', 'rounded_rect', 'oval'}
    return {semantic_kind}


def _assert_package_object_evidence(native_shape: dict, materialized: dict) -> None:
    shape_id = safe_text(native_shape.get('shape_id'))
    actual_kind = safe_text(materialized.get('kind'))
    expected_kinds = _expected_materialized_kinds(native_shape)
    if actual_kind not in expected_kinds:
        raise RuntimeError(
            f'native PPT package object kind mismatch for {shape_id}: '
            f'expected {sorted(expected_kinds)}, got {actual_kind or "<missing>"}'
        )
    if actual_kind == 'chart':
        if (
            not materialized.get('relationship_resolved')
            or 'drawingml.chart' not in safe_text(materialized.get('content_type'))
        ):
            raise RuntimeError(f'native PPT chart structured readback/content type missing: {shape_id}')
    if actual_kind == 'picture':
        if (
            not materialized.get('relationship_resolved')
            or not safe_text(materialized.get('content_type')).startswith('image/')
        ):
            raise RuntimeError(f'native PPT picture structured readback/content type missing: {shape_id}')
    if actual_kind == 'chart':
        expected_chart_type = safe_text(native_shape.get('chart_type') or native_shape.get('chartType'))
        if not expected_chart_type:
            raise RuntimeError(f'native PPT chart type evidence missing for {shape_id}')
        actual_chart_type = safe_text(materialized.get('chart_type'))
        if actual_chart_type != expected_chart_type:
            raise RuntimeError(
                f'native PPT chart type mismatch for {shape_id}: '
                f'expected {expected_chart_type!r}, got {actual_chart_type!r}'
            )
        expected_categories = [str(value) for value in safe_list(native_shape.get('categories'))]
        actual_categories_raw = (
            safe_text(materialized.get('categories_raw'))
            if 'categories_raw' in materialized
            else ','.join(str(value) for value in safe_list(materialized.get('categories')))
        )
        if actual_categories_raw != ','.join(expected_categories):
            raise RuntimeError(
                f'native PPT chart categories mismatch for {shape_id}: '
                f'expected {expected_categories!r}, got {actual_categories_raw!r}'
            )
        expected_series = [
            {
                'name': safe_text(item.get('name'), f'Series {index}'),
                'values': safe_list(item.get('values')),
            }
            for index, item in enumerate(safe_list(native_shape.get('series')), 1)
            if isinstance(item, dict)
        ]
        actual_series = [
            {
                'name': safe_text(item.get('name')),
                'values': safe_list(item.get('values')),
            }
            for item in safe_list(materialized.get('series'))
            if isinstance(item, dict)
        ]
        if actual_series != expected_series:
            raise RuntimeError(
                f'native PPT chart series mismatch for {shape_id}: '
                f'expected {expected_series!r}, got {actual_series!r}'
            )
    if actual_kind == 'table':
        expected_data = [
            [str(value) for value in row]
            for row in safe_list(native_shape.get('data'))
            if isinstance(row, list)
        ]
        actual_data = [
            [str(value) for value in row]
            for row in safe_list(materialized.get('data'))
            if isinstance(row, list)
        ]
        if actual_data != expected_data:
            raise RuntimeError(
                f'native PPT table data mismatch for {shape_id}: '
                f'expected {expected_data!r}, got {actual_data!r}'
            )
        cells = [cell for cell in safe_list(materialized.get('cells')) if isinstance(cell, dict)]
        first_row = native_shape.get('first_row', True) is not False
        header_cells = [cell for cell in cells if int(cell.get('row') or 0) == 1] if first_row else []
        body_cells = [cell for cell in cells if not first_row or int(cell.get('row') or 0) > 1]
        style_checks = [
            ('header_fill', 'table header fill', header_cells, 'fill'),
            ('header_color', 'table header color', header_cells, 'color'),
            ('header_font', 'table header font', header_cells, 'font'),
            ('header_font_size', 'table header font size', header_cells, 'font_size_pt'),
            ('body_font', 'table body font', body_cells, 'font'),
            ('body_font_size', 'table body font size', body_cells, 'font_size_pt'),
            ('body_color', 'table body color', body_cells, 'color'),
        ]
        for source_key, label, selected_cells, target_key in style_checks:
            expected = native_shape.get(source_key)
            if expected in (None, ''):
                continue
            actual = [cell.get(target_key) for cell in selected_cells]
            if not selected_cells or any(value != expected for value in actual):
                raise RuntimeError(
                    f'native PPT {label} mismatch for {shape_id}: expected {expected!r}, got {actual!r}'
                )
    if actual_kind == 'picture':
        expected_payload_sha = safe_text(native_shape.get('source_payload_sha256'))
        if not expected_payload_sha:
            raise RuntimeError(f'native PPT picture source payload SHA evidence missing for {shape_id}')
        actual_payload_sha = safe_text(materialized.get('embedded_sha256'))
        if actual_payload_sha != expected_payload_sha:
            raise RuntimeError(
                f'native PPT picture source payload SHA mismatch for {shape_id}: '
                f'expected {expected_payload_sha!r}, got {actual_payload_sha!r}'
            )
        expected_alt = safe_text(native_shape.get('alt'))
        actual_alt = safe_text(materialized.get('alt'))
        if actual_alt != expected_alt:
            raise RuntimeError(
                f'native PPT picture alt mismatch for {shape_id}: expected {expected_alt!r}, got {actual_alt!r}'
            )
        expected_crop = native_shape.get('crop')
        if isinstance(expected_crop, dict) and materialized.get('crop') != expected_crop:
            raise RuntimeError(
                f'native PPT picture crop mismatch for {shape_id}: '
                f'expected {expected_crop!r}, got {materialized.get("crop")!r}'
            )
    if actual_kind == 'group':
        expected_children = [item for item in safe_list(native_shape.get('children')) if isinstance(item, dict)]
        actual_children = [item for item in safe_list(materialized.get('children')) if isinstance(item, dict)]
        if not expected_children:
            raise RuntimeError(f'native PPT group child semantic records missing for {shape_id}')
        if len(actual_children) != len(expected_children):
            raise RuntimeError(
                f'native PPT group child count mismatch for {shape_id}: '
                f'expected {len(expected_children)}, got {len(actual_children)}'
            )
        for index, (expected_child, actual_child) in enumerate(zip(expected_children, actual_children), 1):
            expected_child_id = safe_text(expected_child.get('shape_id'))
            actual_child_id = safe_text(actual_child.get('name'))
            if actual_child_id != expected_child_id:
                raise RuntimeError(
                    f'native PPT group child identity mismatch for {shape_id} at position {index}: '
                    f'expected {expected_child_id!r}, got {actual_child_id!r}'
                )
            expected_child_kinds = _expected_materialized_kinds(expected_child)
            actual_child_kind = safe_text(actual_child.get('kind'))
            if actual_child_kind not in expected_child_kinds:
                raise RuntimeError(
                    f'native PPT group child kind mismatch for {shape_id}/{expected_child_id}: '
                    f'expected {sorted(expected_child_kinds)}, got {actual_child_kind or "<missing>"}'
                )
            if actual_child_kind != 'group':
                expected_child_text = safe_text(expected_child.get('text'))
                actual_child_text = safe_text(actual_child.get('text'))
                if actual_child_text != expected_child_text:
                    raise RuntimeError(
                        f'native PPT group child text semantic mismatch for {shape_id}/{expected_child_id}: '
                        f'expected {expected_child_text!r}, got {actual_child_text!r}'
                    )
            _assert_package_object_evidence(expected_child, actual_child)


def _bind_manifest_to_package(manifest_slides: list[dict], package_readback: dict, slide_indices: list[int]) -> None:
    slides_by_index = {int(slide['slide_index']): slide for slide in safe_list(package_readback.get('slides'))}
    for manifest_slide, slide_index in zip(manifest_slides, slide_indices):
        package_slide = slides_by_index.get(slide_index)
        if package_slide is None:
            raise RuntimeError(f'native PPT package readback missing slide index: {slide_index}')
        objects_by_name = {
            safe_text(item.get('name')): item
            for item in safe_list(package_slide.get('objects'))
            if safe_text(item.get('name'))
        }
        for native_shape in manifest_slide['native_shapes']:
            shape_id = safe_text(native_shape.get('shape_id'))
            materialized = objects_by_name.get(shape_id)
            if materialized is None:
                raise RuntimeError(f'native PPT package readback missing object: {shape_id}')
            _assert_package_object_evidence(native_shape, materialized)
            semantic_kind = native_shape.get('semantic_kind') or native_shape.get('kind')
            native_shape.update({
                'kind': materialized.get('kind'),
                'semantic_kind': semantic_kind,
                'materialized_kind': materialized.get('kind'),
                'materialized_object_id': materialized.get('object_id'),
                'materialized_geometry': materialized.get('geometry'),
                'relationship_id': materialized.get('relationship_id'),
                'relationship_type': materialized.get('relationship_type'),
                'relationship_target': materialized.get('relationship_target'),
                'relationship_resolved': materialized.get('relationship_resolved'),
                'content_type': materialized.get('content_type'),
                'package_readback_verified': True,
            })
        manifest_slide['package_readback'] = package_slide
        manifest_slide['shape_count'] = len(safe_list(package_slide.get('objects')))
        manifest_slide['text_box_count'] = int((package_slide.get('object_counts') or {}).get('text_box') or 0)


def build_deck(
    slides,
    output_pptx: Path,
    svg_ir_dir: Path,
    repaired_slide_ids,
    evaluate_native_slide_quality,
    template_intake=None,
    allow_quality_debt: bool = False,
):
    _assert_animation_targets(slides)
    manifest_slides = []
    for index, slide_data in enumerate(slides, 1):
        slide_id = safe_text(slide_data.get('slide_id'), f'S{index:02d}')
        failures = validate_ai_first_design_plan(slide_data)
        if failures and not allow_quality_debt:
            raise RuntimeError(
                'native PPT AI-first editable_shape_plan failed: '
                + json.dumps(failures, ensure_ascii=False, sort_keys=True)
            )
        try:
            svg_ir = render_slide_svg_ir(slide_data, index, len(slides), svg_ir_dir, slide_id in repaired_slide_ids)
        except ValueError as exc:
            raise RuntimeError(str(exc)) from exc
        ai_shapes = native_ai_design_shapes(slide_data)
        native_shapes = [native_shape_manifest_record(shape_spec) for shape_spec in ai_shapes]
        quality = evaluate_native_slide_quality(native_shapes, primary_point_count(ai_shapes))
        title_sizes = [
            shape['font_size'] for shape in native_shapes
            if shape['role'] == 'title' and shape['font_size'] > 0
        ]
        manifest_slides.append({
            'slide_id': slide_id,
            '_deck_layout_rhythm': slide_data.get('_deck_layout_rhythm') if isinstance(slide_data.get('_deck_layout_rhythm'), dict) else {},
            'title': slide_title(slide_data, index),
            'layout_family': layout_family(slide_data),
            'layout_writer': 'officecli_pptx_materializer',
            'ai_first_spatial_plan': {
                'required': True,
                'materialized': True,
                'helper_template_layout_used': False,
                'materializer': 'officecli_pptx_materializer',
                'shape_count': len(ai_shapes),
            },
            'title_font_size': max(title_sizes, default=0),
            'shape_count': len(native_shapes),
            'text_box_count': sum(1 for shape in native_shapes if shape['kind'] == 'text_box'),
            'redcube_svg_ir_file': svg_ir['file'],
            'redcube_svg_ir_sha256': svg_ir['sha256'],
            'redcube_svg_ir_preflight': svg_ir['preflight'],
            'redcube_svg_ir': svg_ir,
            'preview_screenshot_file': '',
            'preview_screenshot_sha256': '',
            'preview_screenshot_dimensions': None,
            'render_proof_source': '',
            'synthetic_preview': False,
            'native_shapes': native_shapes,
            'checks': quality['checks'],
            'metrics': quality['metrics'],
            'issues': quality['issues'],
            'shape_plan_quality_debt': [
                *safe_list(slide_data.get('_plan_quality_debt')),
                *failures,
            ],
            'repaired': slide_id in repaired_slide_ids,
        })
    qa_failures = manifest_qa_failures(manifest_slides)
    if not allow_quality_debt:
        fail_closed_on_manifest_qa(manifest_slides)
    for slide in manifest_slides:
        slide.pop('_deck_layout_rhythm', None)
    officecli_gate = materialize_native_pptx(slides, output_pptx, template_intake=template_intake)
    _bind_manifest_to_package(
        manifest_slides,
        officecli_gate['package_readback'],
        officecli_gate['plan_slide_indices'],
    )
    return {
        'slides': manifest_slides,
        'officecli_gate': officecli_gate,
        'package_readback': officecli_gate['package_readback'],
        'template_preservation': officecli_gate['template_preservation'],
        'quality_debt': {
            'status': 'recorded_non_blocking',
            'shape_plan_failures': [
                {
                    'slide_id': slide.get('slide_id'),
                    'failures': slide.get('shape_plan_quality_debt'),
                }
                for slide in manifest_slides
                if slide.get('shape_plan_quality_debt')
            ],
            'manifest_qa_failures': qa_failures,
            'blocks_materialization': False,
        } if allow_quality_debt and (
            qa_failures or any(slide.get('shape_plan_quality_debt') for slide in manifest_slides)
        ) else None,
    }
