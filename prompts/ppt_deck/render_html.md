# ppt_deck / render_html

目标：基于 slide_blueprint + visual_direction 生成单文件 HTML deck。

必须保留：
- #slide-display-area
- #prev-btn
- #next-btn
- slidesData = [{ content: `...` }]

硬约束：
- 没有 visual_direction 不得继续
- 每页在 slidesData 中独立 content
- 16:9 / 1152x648 / 无滚动 / 无明显溢出
- 禁止 renderSlide / layoutByType / cardsGrid / pageType
- 必须落实视觉导演稿中的节奏曲线、峰值页、页面家族上限、禁退化语法
- 复杂结构页必须显式网格 / 轨道 / 锚点
