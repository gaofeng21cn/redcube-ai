# xiaohongshu / render_html

将单篇策划与视觉导演稿正式落成 HTML。
要求：
- 3:4 画幅，无滚动，无外链图片
- slidesData 每页独立 content
- 不允许模板化渲染或历史成品拼装
- 每页至少提供 2 个语义化 `data-qa-block`，并至少标记 1 个 `data-primary-point="true"`，供截图质控读取
- 所有读者可见文字都必须被最近的语义化 `data-qa-block` 覆盖；底部收束句、署名、badge、编号说明、图标旁短句都算可审计正文
- 禁止输出 `<script>` / `<style>` block；样式只能写在元素 inline style 上
- 需要输出 HTML 生成说明与同构门禁留痕
- 版式与文案必须由 AI 直接创作，shell 只负责装配、审阅与持久化边界
- 生成的 audience-facing HTML 必须被视为当前 `authored_markup_registry` 的唯一合法来源；不得把 registry、模板名或内部制作痕迹写进画面
- 如果 `context.author_branding` 存在，封面或结尾至少一处显式露出署名显示，副标可做角标/页脚/收藏标签，图上露出要和文案署名一致
- 如果一页存在“大框里套多张子卡”的群组结构，必须把这个大框做成显式父容器并挂 `data-qa-block`；子卡全部放在父容器内，四周保留稳定内边距，不能让最低或最外侧子卡戳出父框
- 如果页面属于 `process_track`，轨道节点和连线必须避开正文；三张站牌卡要分布到上中下区，标题优先保证自然 1 到 2 行，底部不留明显大空白带
- 相邻读者可见 `data-qa-block`、主卡、步骤卡、底部收束条、署名块之间必须保留至少 6px 可见安全间距；视觉贴住、边缘几乎相接、靠坏断句硬塞都算失败
- render shell 已加载 Font Awesome Free；小红书可用 emoji 做补充，但同一页锚点风格必须统一
- 封面、峰值页和结尾页至少要有一个语义明确的视觉锚点；禁止用孤立单字贴纸、疑似内部标签或随机装饰充当锚点
- 视觉锚点、编号、短线和 badge 必须退到文字下层；不得压住标题、副句、正文或署名
- 父容器、组块边框、轨道框或虚线框一旦出现，就要承担真实收纳责任；不能只画一个框，再把子卡悬到框外
- 标题、正文、标签和短句都必须在自然语义处换行；如果一行能成立，就不要主动插入 `<br/>`
- 结尾页的收藏条、署名与副标必须形成稳定底部布局，保留清楚呼吸，不得互相挤压
- audience-facing HTML 只能出现给读者看的内容；备课备注、制作流程、内部标签和审稿术语全部留在画面外

## runtime_seed
```json
{
  "render_contract": {
    "render_strategy": "prompt_director_first",
    "shell_file": "render_shell.html",
    "recipe_registry": {
      "cover_note": "xhs.hero_note",
      "myth_compare": "xhs.split_contrast",
      "sequence_stack": "xhs.staggered_steps",
      "process_track": "xhs.track_rail",
      "evidence_strip": "xhs.evidence_bands",
      "action_checklist": "xhs.checklist_close",
      "default": "xhs.annotated_cards"
    },
    "shell_guards": [
      "保留 slide-display-area / prev-btn / next-btn / slidesData",
      "输出 render plan 供 review 与审计读取",
      "每页必须是 audience-facing 成品页，不得把内部提示、制作流程、模板注册表写进画面",
      "最终 audience-facing HTML 是当前 authored_markup_registry 的唯一合法来源；不得把 registry 名称、模板名或内部制作痕迹写进画面",
      "禁止输出 <script> / <style> block；如需视觉样式，直接写 inline style",
      "审阅依赖的根节点 metadata 由 runtime 注入，但 AI 仍需交付 review-ready 的 data-qa-block / data-primary-point 结构",
      "相邻读者可见 data-qa-block、主卡、步骤卡、底部收束条与署名块之间必须保留至少 6px 可见安全间距；视觉贴住按失败处理"
    ]
  }
}
```

## runtime_artifact
```json
{
  "render_markup_artifact": {
    "artifact_surface": "codex_cli_json_output",
    "binding_model": "slides_data_shell_only",
    "authored_markup_registry": {
      "xhs.hero_note": "slidesData[*].content",
      "xhs.split_contrast": "slidesData[*].content",
      "xhs.staggered_steps": "slidesData[*].content",
      "xhs.track_rail": "slidesData[*].content",
      "xhs.evidence_bands": "slidesData[*].content",
      "xhs.checklist_close": "slidesData[*].content",
      "xhs.annotated_cards": "slidesData[*].content"
    },
    "required_review_contract": [
      "slide_root",
      "data-qa-block",
      "data-primary-point",
      "visible_text_qa_coverage"
    ],
    "creative_authorship": "ai_first"
  }
}
```
