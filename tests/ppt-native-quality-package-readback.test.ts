// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { resolveRedCubePythonCommand } from '../scripts/run-test-group-lib.ts';
import { pythonTestEnv } from './helpers/ppt-native-python-layout-fixtures.ts';

function buildSyntheticPackage(file) {
  const python = resolveRedCubePythonCommand();
  const script = `
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile
import sys

target = Path(sys.argv[1])
content_types = '''<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="png" ContentType="image/png"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  <Override PartName="/ppt/slides/slide9.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>
  <Override PartName="/ppt/slides/slide2.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>
  <Override PartName="/ppt/customCharts/data-part.xml" ContentType="application/vnd.openxmlformats-officedocument.drawingml.chart+xml"/>
  <Override PartName="/ppt/speakerNotes/misaligned-42.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.notesSlide+xml"/>
</Types>'''
root_rels = '''<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rIdDeck" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
</Relationships>'''
presentation = '''<p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <p:sldIdLst>
    <p:sldId id="256" r:id="rIdFirst"/>
    <p:sldId id="257" r:id="rIdSecond"/>
  </p:sldIdLst>
</p:presentation>'''
presentation_rels = '''<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rIdFirst" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide9.xml"/>
  <Relationship Id="rIdSecond" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide2.xml"/>
</Relationships>'''
slide1 = '''<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <p:cSld><p:spTree>
    <p:sp><p:nvSpPr><p:cNvPr id="2" name="D01-title"/><p:cNvSpPr txBox="1"/></p:nvSpPr><p:txBody><a:p><a:r><a:t>First</a:t></a:r></a:p></p:txBody></p:sp>
    <p:cxnSp><p:nvCxnSpPr><p:cNvPr id="3" name="D01-edge-a"/></p:nvCxnSpPr></p:cxnSp>
    <p:cxnSp><p:nvCxnSpPr><p:cNvPr id="4" name="D01-edge-b"/></p:nvCxnSpPr></p:cxnSp>
    <p:pic><p:nvPicPr><p:cNvPr id="5" name="D01-picture"/></p:nvPicPr><p:blipFill><a:blip r:embed="rIdImage"/></p:blipFill></p:pic>
    <p:graphicFrame><p:nvGraphicFramePr><p:cNvPr id="6" name="D01-chart"/></p:nvGraphicFramePr><a:graphic><a:graphicData uri="chart"><c:chart r:id="rIdChart"/></a:graphicData></a:graphic></p:graphicFrame>
    <p:graphicFrame><p:nvGraphicFramePr><p:cNvPr id="7" name="D01-table"/></p:nvGraphicFramePr><a:graphic><a:graphicData uri="table"><a:tbl/></a:graphicData></a:graphic></p:graphicFrame>
    <p:grpSp><p:nvGrpSpPr><p:cNvPr id="8" name="D01-group"/></p:nvGrpSpPr><p:sp><p:nvSpPr><p:cNvPr id="9" name="D01-path"/></p:nvSpPr><p:spPr><a:custGeom/></p:spPr></p:sp></p:grpSp>
  </p:spTree></p:cSld>
  <p:transition><p:fade/></p:transition>
  <p:timing><p:tnLst><p:par><p:cTn id="1" presetID="1"/></p:par></p:tnLst></p:timing>
</p:sld>'''
slide1_rels = '''<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rIdChart" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart" Target="../customCharts/data-part.xml"/>
  <Relationship Id="rIdImage" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../assets/evidence.png"/>
  <Relationship Id="rIdNotes" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/notesSlide" Target="../speakerNotes/misaligned-42.xml"/>
</Relationships>'''
slide2 = '''<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><p:cSld><p:spTree><p:sp><p:nvSpPr><p:cNvPr id="2" name="D02-title"/><p:cNvSpPr txBox="1"/></p:nvSpPr><p:txBody><a:p><a:r><a:t>Second</a:t></a:r></a:p></p:txBody></p:sp></p:spTree></p:cSld></p:sld>'''
notes = '''<p:notes xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><p:cSld><p:spTree><p:sp><p:nvSpPr><p:cNvPr id="2" name="Notes body"/><p:nvPr><p:ph type="body"/></p:nvPr></p:nvSpPr><p:txBody><a:p><a:r><a:t>Exact relationship-backed speaker note.</a:t></a:r></a:p></p:txBody></p:sp></p:spTree></p:cSld></p:notes>'''

with ZipFile(target, 'w', compression=ZIP_DEFLATED) as package:
    package.writestr('[Content_Types].xml', content_types)
    package.writestr('_rels/.rels', root_rels)
    package.writestr('ppt/presentation.xml', presentation)
    package.writestr('ppt/_rels/presentation.xml.rels', presentation_rels)
    package.writestr('ppt/slides/slide9.xml', slide1)
    package.writestr('ppt/slides/_rels/slide9.xml.rels', slide1_rels)
    package.writestr('ppt/slides/slide2.xml', slide2)
    package.writestr('ppt/customCharts/data-part.xml', '<c:chartSpace xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart"><c:chart><c:plotArea><c:lineChart/></c:plotArea></c:chart></c:chartSpace>')
    package.writestr('ppt/assets/evidence.png', b'png')
    package.writestr('ppt/speakerNotes/misaligned-42.xml', notes)
`;
  execFileSync(python.command, [...(python.args || []), '-c', script, file], {
    cwd: path.resolve('.'),
    env: pythonTestEnv(),
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

test('native PPT package reader resolves complex objects through OOXML relationships and content types', () => {
  const workspace = mkdtempSync(path.join(os.tmpdir(), 'redcube-native-package-readback-'));
  const pptxFile = path.join(workspace, 'complex.pptx');
  buildSyntheticPackage(pptxFile);

  const python = resolveRedCubePythonCommand();
  const stdout = execFileSync(python.command, [
    ...(python.args || []),
    '-m',
    'redcube_ai.native_helpers.ppt_deck.native_package',
    pptxFile,
    '--pretty',
  ], {
    cwd: path.resolve('.'),
    env: pythonTestEnv(),
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const readback = JSON.parse(stdout);

  assert.equal(readback.schema_version, 1);
  assert.equal(readback.evidence_source, 'pptx_package_readback');
  assert.match(readback.pptx_sha256, /^[a-f0-9]{64}$/);
  assert.equal(readback.slide_count, 2);
  assert.deepEqual(readback.slides.map((slide) => slide.slide_part), [
    'ppt/slides/slide9.xml',
    'ppt/slides/slide2.xml',
  ]);
  assert.deepEqual(readback.object_type_counts, {
    chart: 1,
    connector: 2,
    group: 1,
    path: 1,
    picture: 1,
    table: 1,
    text_box: 2,
  });
  assert.equal(readback.notes_slide_count, 1);
  assert.equal(readback.transition_count, 1);
  assert.equal(readback.animation_count, 1);
  assert.deepEqual(readback.part_counts, {
    chart: 1,
    media: 1,
    notes: 1,
    master: 0,
    layout: 0,
    theme: 0,
  });
  assert.deepEqual(readback.slides[0].object_names, [
    'D01-title',
    'D01-edge-a',
    'D01-edge-b',
    'D01-picture',
    'D01-chart',
    'D01-table',
    'D01-group',
    'D01-path',
  ]);
  const chart = readback.slides[0].objects.find((item) => item.name === 'D01-chart');
  const picture = readback.slides[0].objects.find((item) => item.name === 'D01-picture');
  assert.equal(chart.relationship_target, 'ppt/customCharts/data-part.xml');
  assert.equal(chart.relationship_resolved, true);
  assert.match(chart.content_type, /drawingml\.chart/);
  assert.equal(picture.relationship_target, 'ppt/assets/evidence.png');
  assert.equal(picture.relationship_resolved, true);
  assert.equal(picture.content_type, 'image/png');
  assert.equal(readback.slides[0].speaker_notes, 'Exact relationship-backed speaker note.');
  assert.equal(readback.slides[0].notes_part, 'ppt/speakerNotes/misaligned-42.xml');
  assert.equal(readback.slides[0].notes_relationship_resolved, true);
  assert.match(readback.slides[0].notes_content_type, /presentationml\.notesSlide/i);
  assert.equal(readback.slides[0].transition.type, 'fade');
});
