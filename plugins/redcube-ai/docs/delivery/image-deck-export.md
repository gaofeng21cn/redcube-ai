# 整页图课件的真实导出与回读

`ppt_deck_export` 是既有 OPL native helper。生产输入使用明确页面清单，生成真实 PPTX/PDF，并读取实际文件核对页序、原始媒体、几何、裁剪、备注和隐藏状态。机械核对与 RCA 视觉审阅分别保留。

## 输入

清单使用 `schema_version: rca.image-deck-export.v1`，`expected_slide_count` 必须与 `pages` 一致。数组顺序就是最终页序；不从目录猜选稿，也不要求媒体总数等于页数。页ID唯一，文件引用相对 `--asset-root`（默认清单所在目录），每个文件必须匹配 SHA-256。底图须为完整16:9 PNG，不通过拉伸方形图凑比例。

下面是一页的输入形式，哈希需替换为实际文件哈希：

```json
{
  "schema_version": "rca.image-deck-export.v1",
  "expected_slide_count": 1,
  "pages": [{
    "slide_id": "clinical-evidence",
    "image_ref": "images/clinical-evidence.png",
    "sha256": "<base image sha256>",
    "notes": "讲者备注\n完整来源与实验条件",
    "overlays": [{
      "asset_id": "verified-scan",
      "kind": "medical_image",
      "image_ref": "assets/verified-scan.png",
      "sha256": "<original asset sha256>",
      "source_ref": "<authorized original evidence reference>",
      "box": [0.08, 0.25, 0.4, 0.45],
      "crop_ltrb": [0.1, 0, 0.1, 0]
    }, {
      "asset_id": "public-entry",
      "kind": "qr",
      "image_ref": "assets/public-entry.png",
      "sha256": "<original QR sha256>",
      "source_ref": "<verified public entry>",
      "expected_text": "https://example.org/entry",
      "box": [0.77, 0.58, 0.18, 0.32]
    }]
  }]
}
```

`box` 为 `[x,y,width,height]`，数值相对整张幻灯片；`crop_ltrb` 为源图左、上、右、下裁剪比例，默认全0。叠层按数组顺序从下到上放置。允许的 `kind` 为 `medical_image`、`qr`、`download`、`ui`、`paper`、`logo`。来源字段提供可追溯依据，AI 仍须核验对象、模态和实验含义；有来源字符串不自动等于证据真实。

二维码保留完整原图、静区和长宽比，填写预期解码文本。helper 复扫包内原始媒体与几何对应的最终合成画面；请求 PDF 时，还复扫实际 PDF 内的最终页面图片。回执只返回目标文本哈希。裁剪、失真、遮挡或解码不符均不能报告机械通过。原生 PowerPoint 屏幕上的可扫性仍需该实际使用面的证据。

真实影像、截图与二维码应在生成前预留空间。底图使用 PNG，独立原始资产支持 PNG/JPEG，在 PPTX 中保持原始媒体字节；PDF 是同一配方合成的栅格页面。普通字形、箭头和构图问题仍通过重绘修复，不能作为覆盖补丁加入此清单。

## 调用与输出

通过现有 OPL native-helper envelope 调用模块 `redcube_ai.native_helpers.ppt_deck.export`，模块参数为：

```text
--page-manifest <pages.json> --asset-root <authorized asset root>
--output-pptx <candidate.pptx> --output-pdf <candidate.pdf>
```

`--output-pdf` 可省略。`--expected-slide-count` 可额外约束页数。旧 `--screenshots-dir` 入口保留，采用自然数字排序并检查底图比例；它读取目录中的 PNG，不负责从批次、预览和失败稿中选稿，生产任务优先使用显式清单。

stdout 回执包含 `package_readback` 和可选 `pdf_readback`，绑定实际最终文件哈希。每页返回稳定ID、底图哈希、叠层来源/哈希/几何/裁剪、备注哈希及 `composition_sha256`。检查也覆盖 ZIP/XML、QName 前缀作用域、内部 relationships、整页几何、额外覆盖层、翻转、裁剪、隐藏页和实际 PDF 页面解码。

这些检查用于确认材料化正确。`status: verified` 不签发视觉通过或交付批准，`native_powerpoint_open` 保持 `unverified`，直至取得原生界面证据。

## 通过页与请求复用

若已审页面的完整配方保持一致，可以在该页输入增加：

```json
"review_binding": {
  "review_ref": "<existing RCA review reference>",
  "composition_sha256": "<composition hash from that reviewed export>"
}
```

回读返回 `review_binding_matches`；它确认当前底图、叠层顺序、裁剪、几何及备注与该配方一致。RCA 核对来源、画法要求和实际旧审阅后决定是否复用。变更后的配方不会继承旧审阅，未审新合成页需要读图。这样可保留通过图并减少重复灌图，不把哈希匹配当作审美判定。

`ppt_review_evidence` 在原清单上支持每次 generation 的可选 `request`：`prompt_ref/prompt_sha256`、`shared_style_ref/shared_style_sha256`、`style_profile_id/style_revision`，以及 `input_images`。每个实际输入图记录 role、allowed_borrowing、excluded_borrowing。文本和图像均按实际提交版本核对；后续编辑的 prompt 不能冒充历史请求。

页面同时填写 `selected_image_sha256` 与 `selected_attempt_id` 可唯一定位选中尝试，返回的 `selected_generation` 携带其请求，首轮观察继续保留。旧清单仍可只提供选图哈希；当多个尝试图像字节相同时，helper 不推断其中哪次被选中。

## `ppt_review_evidence` 审阅证据清单

`ppt_review_evidence` 是只读 OPL native helper，用于解码真实图像、核验声明哈希与来源集合、绑定首图观察并统计生成次数、耗时与已知成本，但不作内容、审美或 ready 判定；未审与未选保持 `null`，重复字节保留全部记录而不反推选中项。

清单使用 `schema_version: rca.ppt-review-evidence.v1`、`evidence_kind: rendered_images` 与非空 `pages` 数组（每页含 `slide_id`、`variant`、`source_page_ids`、`generations`、`references`、`first_review` 与可选 `selected_image_sha256`）。`references` 仅允许 `content`、`style`、`anatomy`、`verified_asset` 或 `neighbor`；首图必须在 `refinement` / `repair` 之前且 `first_review` 绑定该首图。通过 `opl pack native-helper run`（依据 `contracts/runtime-program/python-native-helper-catalog.json` 中的 `ppt_review_evidence`）传参 `--manifest <manifest.json> --asset-root <authorized evaluation asset root>`（及回读时的 `--expected-revision <revision>`）调用；共享 `rca.workspace.artifacts` 视图仍消费原任务产物定位，人类决策经 Framework 任务动作提交并回读。

## 验证与收口

developer image proof 只 mock 图片生成，使用此真实 exporter 输出、解析 PPTX/PDF。机械 proof 可以 `passed`，其视觉审阅为 `not_reviewed`，交付为 `candidate`。合成测试图只用于容器与接线，不证明初稿质量。

质量比较使用现有 workbench evaluation cases 和 `ppt_review_evidence`。对同源页面保留旧流程与候选流程首次实际输出、原始请求、输入图差异、耗时、调用次数和独立审阅；后续可用选稿不覆盖首轮记录。清理只在最终来源、选图、备注、真实层及必要回退依赖核对后进行，沿用既有 Framework 产物引用，不新增 RCA 队列或清理调度器。
