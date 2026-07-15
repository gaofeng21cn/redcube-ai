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
