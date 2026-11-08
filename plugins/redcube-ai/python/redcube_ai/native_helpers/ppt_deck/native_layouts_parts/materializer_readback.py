from redcube_ai.native_helpers.ppt_deck.native_hyperlinks import assert_hyperlink_readback
from redcube_ai.native_helpers.ppt_deck.native_layouts_parts.common import safe_list, safe_text

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
    assert_hyperlink_readback(native_shape.get('hyperlinks') or {}, materialized.get('hyperlinks') or {})
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
