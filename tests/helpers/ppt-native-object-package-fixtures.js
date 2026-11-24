import { execFileSync, spawnSync } from 'node:child_process';
import path from 'node:path';
import { readFileSync, writeFileSync } from 'node:fs';
import {
  pythonTestEnv,
  resolveTestPythonCommand,
  writeTinyPng,
} from './ppt-native-python-layout-fixtures.js';
import { mkUserScopedTestWorkspace } from './test-workspace.js';

function runPython(script, args = []) {
  const python = resolveTestPythonCommand();
  return execFileSync(python.command, [...(python.args || []), '-c', script, ...args], {
    cwd: path.resolve('.'),
    env: pythonTestEnv(),
    encoding: 'utf-8',
  });
}

export function createNativeObjectWorkspace(prefix = 'redcube-native-object-package-') {
  const workspaceRoot = mkUserScopedTestWorkspace(prefix);
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
from redcube_ai.native_helpers.ppt_deck.native_layouts.materializer import materialize_native_pptx

payload = json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'))
result = materialize_native_pptx(
    payload['slides'],
    Path(sys.argv[2]),
    template_intake=payload.get('template_intake'),
    allow_quality_debt=payload.get('allow_quality_debt', False),
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
from redcube_ai.native_helpers.ppt_deck.native_layouts.materializer import materialize_native_pptx

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

export function createTemplatePptx(workspaceRoot, slideCount = 1) {
  const templateFile = path.join(workspaceRoot, 'template.pptx');
  const script = `
import sys
from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.util import Inches

template_file = sys.argv[1]
slide_count = int(sys.argv[2])
prs = Presentation()
prs.slide_width = Inches(16)
prs.slide_height = Inches(9)
title_layout = prs.slide_layouts[5]
for slide_index in range(1, slide_count + 1):
    slide = prs.slides.add_slide(title_layout)
    bg = slide.background.fill
    bg.solid()
    bg.fore_color.rgb = RGBColor.from_string('F4F7FB')
    if slide.shapes.title is not None:
        slide.shapes.title.name = f'TemplateTitle{"" if slide_index == 1 else slide_index}'
        slide.shapes.title.text = f'Template title placeholder {slide_index}'
    anchor = slide.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE,
        Inches(0.7),
        Inches(6.7),
        Inches(2.2),
        Inches(0.35),
    )
    anchor.name = f'TemplateAnchor{"" if slide_index == 1 else slide_index}'
    anchor.fill.solid()
    anchor.fill.fore_color.rgb = RGBColor.from_string('E2E8F0')
    anchor.line.fill.background()
prs.save(template_file)
`;
  runPython(script, [templateFile, String(slideCount)]);
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
