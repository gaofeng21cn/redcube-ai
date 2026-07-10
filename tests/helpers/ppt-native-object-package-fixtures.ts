// @ts-nocheck
import { execFileSync, spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import {
  pythonTestEnv,
  resolveTestPythonCommand,
  writeTinyPng,
} from './ppt-native-python-layout-fixtures.ts';

function runPython(script, args = []) {
  const python = resolveTestPythonCommand();
  return execFileSync(python.command, [...(python.args || []), '-c', script, ...args], {
    cwd: path.resolve('.'),
    env: pythonTestEnv(),
    encoding: 'utf-8',
  });
}

export function createNativeObjectWorkspace(prefix = 'redcube-native-object-package-') {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), prefix));
  const pictureFile = path.join(workspaceRoot, 'picture.png');
  writeTinyPng(pictureFile);
  const pictureDataUri = `data:image/png;base64,${readFileSync(pictureFile).toString('base64')}`;
  return { workspaceRoot, pictureFile, pictureDataUri };
}

export function writeObjectPayload(workspaceRoot, payload) {
  const inputFile = path.join(workspaceRoot, 'payload.json');
  writeFileSync(inputFile, `${JSON.stringify(payload, null, 2)}\n`);
  return inputFile;
}

export function runNativeObjectMaterializer({ workspaceRoot, payload, templateIntake = null }) {
  const inputFile = writeObjectPayload(workspaceRoot, payload);
  const outputPptx = path.join(workspaceRoot, 'native-objects.pptx');
  const script = `
import json
import sys
from pathlib import Path
from redcube_ai.native_helpers.ppt_deck.native_layouts_parts.materializer import materialize_native_pptx

payload = json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'))
result = materialize_native_pptx(
    payload['slides'],
    Path(sys.argv[2]),
    template_intake=payload.get('template_intake'),
)
print(json.dumps(result, ensure_ascii=False))
`;
  const stdout = runPython(script, [inputFile, outputPptx]);
  return { outputPptx, ...JSON.parse(stdout) };
}

export function runNativeObjectMaterializerFailure({ workspaceRoot, payload, outputPptx: requestedOutputPptx = null }) {
  const inputFile = writeObjectPayload(workspaceRoot, payload);
  const outputPptx = requestedOutputPptx || path.join(workspaceRoot, 'invalid-native-objects.pptx');
  const python = resolveTestPythonCommand();
  const script = `
import json
import sys
from pathlib import Path
from redcube_ai.native_helpers.ppt_deck.native_layouts_parts.materializer import materialize_native_pptx

payload = json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'))
materialize_native_pptx(
    payload['slides'],
    Path(sys.argv[2]),
    template_intake=payload.get('template_intake'),
)
`;
  return spawnSync(python.command, [...(python.args || []), '-c', script, inputFile, outputPptx], {
    cwd: path.resolve('.'),
    env: pythonTestEnv(),
    encoding: 'utf-8',
  });
}

export function relocateRelationshipBackedParts(pptxFile) {
  const script = String.raw`
import posixpath
import sys
import tempfile
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

REL_NS = 'http://schemas.openxmlformats.org/package/2006/relationships'
CT_NS = 'http://schemas.openxmlformats.org/package/2006/content-types'

def relationship_part(source):
    directory, filename = posixpath.split(source)
    return posixpath.join(directory, '_rels', filename + '.rels')

def resolve_target(source, target):
    if target.startswith('/'):
        return target.lstrip('/')
    return posixpath.normpath(posixpath.join(posixpath.dirname(source), target))

def relationships(payloads, source):
    part = relationship_part(source)
    if part not in payloads:
        return []
    return list(ET.fromstring(payloads[part]))

pptx = Path(sys.argv[1])
with zipfile.ZipFile(pptx, 'r') as archive:
    payloads = {name: archive.read(name) for name in archive.namelist()}

presentation = 'ppt/presentation.xml'
slide_rel = next(rel for rel in relationships(payloads, presentation) if rel.get('Type', '').endswith('/slide'))
slide_part = resolve_target(presentation, slide_rel.get('Target', ''))
slide_rels = relationships(payloads, slide_part)

def related_part(suffix):
    rel = next(item for item in slide_rels if item.get('Type', '').endswith(suffix))
    return resolve_target(slide_part, rel.get('Target', ''))

chart_part = related_part('/chart')
picture_part = related_part('/image')
notes_part = related_part('/notesSlide')
mapping = {
    slide_part: 'ppt/scenes/semantic-slide.xml',
    chart_part: 'ppt/dataObjects/semantic-chart.xml',
    picture_part: 'ppt/assets/semantic-picture' + posixpath.splitext(picture_part)[1],
    notes_part: 'ppt/speakerNotes/semantic-notes.xml',
}
for source, target in list(mapping.items()):
    source_rels = relationship_part(source)
    if source_rels in payloads:
        mapping[source_rels] = relationship_part(target)

for source in [presentation, slide_part, chart_part, notes_part]:
    rel_part = relationship_part(source)
    if rel_part not in payloads:
        continue
    root = ET.fromstring(payloads[rel_part])
    target_source = mapping.get(source, source)
    for rel in list(root):
        if rel.get('TargetMode') == 'External':
            continue
        old_target = resolve_target(source, rel.get('Target', ''))
        new_target = mapping.get(old_target, old_target)
        rel.set('Target', posixpath.relpath(new_target, posixpath.dirname(target_source)))
    ET.register_namespace('', REL_NS)
    payloads[rel_part] = ET.tostring(root, encoding='utf-8', xml_declaration=True)

content_types = ET.fromstring(payloads['[Content_Types].xml'])
for override in content_types.findall(f'{{{CT_NS}}}Override'):
    old_part = override.get('PartName', '').lstrip('/')
    if old_part in mapping:
        override.set('PartName', '/' + mapping[old_part])
ET.register_namespace('', CT_NS)
payloads['[Content_Types].xml'] = ET.tostring(content_types, encoding='utf-8', xml_declaration=True)

with tempfile.NamedTemporaryFile(dir=pptx.parent, suffix='.pptx', delete=False) as handle:
    temp_file = Path(handle.name)
try:
    with zipfile.ZipFile(temp_file, 'w', compression=zipfile.ZIP_DEFLATED) as archive:
        for name, payload in payloads.items():
            archive.writestr(mapping.get(name, name), payload)
    temp_file.replace(pptx)
finally:
    temp_file.unlink(missing_ok=True)
`;
  runPython(script, [pptxFile]);
}

export function runPackageReadback(pptxFile) {
  const python = resolveTestPythonCommand();
  const stdout = execFileSync(python.command, [
    ...(python.args || []),
    '-m',
    'redcube_ai.native_helpers.ppt_deck.native_package',
    pptxFile,
  ], {
    cwd: path.resolve('.'),
    env: pythonTestEnv(),
    encoding: 'utf-8',
  });
  return JSON.parse(stdout);
}

export function validatePptx(pptxFile) {
  const officecli = process.env.OFFICECLI || 'officecli';
  return JSON.parse(execFileSync(officecli, ['validate', pptxFile, '--json'], { encoding: 'utf-8' }));
}

export function createTemplatePptx(workspaceRoot, slideCount = 1) {
  const templateFile = path.join(workspaceRoot, 'template.pptx');
  const officecli = process.env.OFFICECLI || 'officecli';
  const run = (args) => execFileSync(officecli, args, { encoding: 'utf-8' });
  run(['create', templateFile]);
  run(['open', templateFile]);
  try {
    for (let slideIndex = 1; slideIndex <= slideCount; slideIndex += 1) {
      run(['add', templateFile, '/', '--type', 'slide', '--prop', 'layout=blank', '--prop', 'background=F4F7FB']);
      run([
        'add', templateFile, `/slide[${slideIndex}]`, '--type', 'placeholder',
        '--prop', 'phType=title', '--prop', `name=TemplateTitle${slideIndex === 1 ? '' : slideIndex}`,
        '--prop', `text=Template title placeholder ${slideIndex}`,
      ]);
      run([
        'add', templateFile, `/slide[${slideIndex}]`, '--type', 'shape',
        '--prop', `name=TemplateAnchor${slideIndex === 1 ? '' : slideIndex}`, '--prop', 'preset=roundRect', '--prop', 'fill=E2E8F0',
        '--prop', 'x=0.7in', '--prop', 'y=6.7in', '--prop', 'width=2.2in', '--prop', 'height=0.35in',
      ]);
    }
    run(['save', templateFile]);
  } finally {
    run(['close', templateFile]);
  }
  return templateFile;
}

export function shape(shapeId, kind, bounds, extra = {}) {
  return {
    shape_id: shapeId,
    kind,
    role: extra.role || `${kind}_proof`,
    quality_role: extra.quality_role || 'structural',
    layout_zone_id: extra.layout_zone_id || 'proof_zone',
    bounds,
    ...extra,
  };
}

export function bounds(left_in, top_in, width_in, height_in) {
  return { left_in, top_in, width_in, height_in };
}
