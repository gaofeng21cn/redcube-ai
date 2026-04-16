# **任务：使用内嵌模版和文稿，生成Web演示应用**

## **角色**

你是一位精通前端开发、UI/UX设计和数据可视化的专家。

## **核心任务**

你的任务是基于以下核心输入材料——**1) 下文`[Web演示应用高级模版]`中提供的HTML代码**，**2) “PPT大纲与讲稿”**，以及 **3) 原始参考材料（可能包含一个或多个文件）**——来生成一个最终的、功能完整的单页HTML文件。

这份母版提示词只提供**AI-first 创作方法与视觉纪律**，不是要你机械套模板。真正的优先级始终是：

1. 当前任务的工作台文稿与视觉导演稿
2. 当前 deliverable 的 audience-facing / review contract
3. 本母版里仍然适用的方法论

如果本母版中的泛化规则，会把页面推向“字段填空”“模板凑满”“为了完整而加层”，必须以讲课目标为准做删减，而不是照抄。

## **执行步骤**

1. **加载模版：** 将下方`[Web演示应用高级模版]`区域提供的**完整HTML代码**作为你的基础。
    
2. **解析文稿：** 逐页阅读“PPT大纲与讲稿”的内容。
    
3. **丰富细节：** 对于每一页幻灯片，参考“原始参考材料”来获取并验证最精确的数据（如百分比、药物名称、时间范围等），并思考如何将“核心内容”部分视觉化。同时，为了达到最佳的呈现效果，你被授权在忠于事实的基础上，合理补充、调整或优化视觉构思，使最终成品比大纲更专业、更生动。
    
4. **填充模版：**
    
    - 将每一页幻灯片的内容，转化为包含HTML和Tailwind CSS类的代码字符串。
        
    - 将这些字符串，作为对象元素，准确地填充到模版`<script>`标签内的`const slidesData = []`数组中。
        
    - 根据第一张幻灯片的标题，更新HTML `<title>` 标签的内容。
        
5. **禁止修改模版核心：** **绝对不要**修改模版中的`<style>`块和`<script>`标签中`slidesData`数组之外的功能性JavaScript代码。你的任务是“填空”，而不是“重建”。

6. **页序严格对齐：** 只生成输入文稿中已经定义的页面，**严禁擅自新增章节过渡页、封底页、总结补页或模板占位页**。

7. **内容池而非槽位：** `title / core_sentence / page_core_content` 是内容池，不是“主标题 + 副标题 + 三张卡”的固定槽位。每页都要先判断“为了把这页讲清楚，最少需要几层文字”，再决定怎么摆。

8. **先删层，再做造型：** 如果某一层文字、chip、导语、栏目名、摘要句、来源胶囊、底栏说明，并不能直接帮助听众理解，就不要因为“版面完整”而保留。
    

## **视觉与内容呈现要求**

### **A. 核心布局原则 (不可违背)**

1. **内容完整性 (无滚动条):** 每一页幻灯片最终生成的HTML内容，在填充到模版后，其视觉呈现必须**严格**在16:9的区域内完整显示，**严禁出现任何方向的滚动条**。
    
2. **目标导向优先于填满页面：** 版面的首要目标是把这页讲清楚，而不是把空间尽量塞满。若一页只需要一个主命题加一个结构动作，**保留必要留白是允许且推荐的**；不要为了“显得完整”硬补副标题、第二卡组、底部说明条或来源胶囊。

3. **一页只保一个主结构动作：** 每页先决定听众第一眼应该看到什么，再围绕这个主动作组织层级。不要在同一页里并列制造两个同等强度的主峰，更不要把卡片里再塞卡片。

4. **多栏布局只在确有对照需求时启用：** 对于确实需要多列对比的内容，各列容器可以等高对齐，但**不是每页都要做成平权多栏卡片墙**。若一侧应更重，就要允许不对称构图。

5. **动态调整的优先顺序：** 当空间紧张时，优先执行以下动作，而不是继续加元素或缩字号硬塞：

    - 合并重复判断
    - 删除不承担教学作用的副标题/导语/chip
    - 把三组解释压成两组更强判断
    - 把卡中的小卡改写成短词、短句或直接移除
        
6. **绝不伪造“可滚动”感：** 幻灯片是一次性静态画面，任何卡片内部都不得出现像滚动条、滚动柄、滚动轨道一样的竖条或 UI 残影。
        

### **B. 元素设计规范**

1. **文本元素:**
    
    - **风格:** 要点、列表或描述性短句应**避免使用句号“。”结尾**，以保持视觉上的简洁。

    - **audience-facing 纯度:** 任何会上屏的标题、说明、标签、角标，都必须像讲者真会对听众说的话。`先讲 / 再讲 / 最后讲 / 本页目标 / 过渡句 / 工作台 / 视觉导演稿 / 来源索引 / 内部资料 / 制作说明 / 公开可证 / 中心结论 / 带走点一二三` 这类 backstage 词句默认不得上屏
        
    - **来源标注规范 (面向听众):**
        
        - **引用原则:** 当关键数据或结论需要标注来源时，**必须**引用对听众有意义、可公开查证的文献，如**已发表的论文、书籍、临床指南、专家共识**等。
            
        - **禁止的引用:** **严禁**标注内部文件名（如 `xxx.pdf`）或任何对公众无意义的、无法追溯的来源。
            
        - **标注位置与格式:** 引用标注应以不影响主内容阅读为前提，放置在便利的位置，例如**页面的边角**或**所引用文本框的下方/旁边**。**必须**使用小号、浅色的文字。**推荐格式:** `数据来源: [指南名称或文献简称]` 或 `(Author et al., Journal, Year)`。
            
2. **视觉元素 (代码绘制):**
    
    - **类型:** 为了保证输出结果的稳定性，**必须优先**使用简单的信息图来呈现信息（如带图标的列表、简单的流程图、两到三列的对比框）。**避免**尝试绘制排版非常复杂、需要精确定位的示意图。
        
    - **图标:** **必须**从 **Font Awesome 的免费版本 (Free Set) 或 Emoji** 中选择，且在同一组视觉元素中（如一个列表），**要么所有同级条目都配图标，要么全都不配**，并保持风格统一。
        
    - **图表:** 当创建条形图（Bar Plot）等数据图表时，数值标签**必须**放置在条形的**外部**（例如顶部或右侧），绝不能放在条形内部。
        
3. **视觉元素 (图像占位符):**
    
    - **使用时机 (例外规则):** 此规则仅为**例外情况**。只有当原始材料中包含一个**现成的、无法用代码复现的复杂图或表**，且该图/表对理解核心内容**至关重要**时，才允许使用占位符。任何可以被简化或用示意图重构的内容，都**严禁**使用占位符。
        
    - **设计目的:** 占位框是为**制作者**提供清晰的图片替换指引，**绝非**给听众看。
        
    - **构成:** **必须**是带有虚线边框、浅灰背景、`fas fa-image`图标的`div`，并包含**内部指令式**的来源标注文字，格式为：“**来源：[文档名], 第X页, [图/表编号]**”。
        
    - **尺寸:** **必须**服从**核心布局原则**，优先缩小占位框，而不是挤压文字。
        

### **C. 整体演示风格**

1. **专业美学:** 所有页面都应采用统一的浅色背景与稳定字体系统，用有限的强调色组织重点。

2. **封面与收束页做减法:** 封面、结尾、边界页优先用“少而准”的结构建立记忆点，不要把介绍卡、流程概览、底部条带、功能 chip 一起塞上去。

3. **同一家族页面必须有差异:** 即使连续两页都属于对照/多区页，也要通过首眼抓手、重心位置和信息权重拉开差异，而不是简单复用上一页的卡片墙。
        

## **[Web演示应用高级模版]**

```
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Web演示应用模版</title>
    
    <!-- 依赖库 -->
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html-to-image/1.11.11/html-to-image.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Noto+Sans+SC:wght@400;500;700&display=swap" rel="stylesheet">
    
    <!-- 核心样式 -->
    <style>
        body { font-family: 'Noto Sans SC', 'Inter', sans-serif; }
    </style>

</head>
<body class="bg-slate-100 flex flex-col items-center justify-center min-h-screen p-4">

    <div id="app-container" class="w-full max-w-6xl">
        <div id="slide-display-area" class="w-full bg-white rounded-xl shadow-2xl aspect-[16/9] relative overflow-hidden flex justify-center items-center">
            <!-- 幻灯片内容将由JS动态注入 -->
        </div>

        <div id="control-panel" class="w-full max-w-4xl mx-auto mt-4 p-2 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg flex items-center justify-between">
            <button id="prev-btn" class="px-6 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                上一页
            </button>
            
            <div id="progress-indicator" class="text-xl font-semibold text-slate-700 w-48 text-center"></div>
            
            <div class="flex items-center gap-3">
                 <button id="export-png-btn" title="导出当前页为PNG" class="flex items-center justify-center w-12 h-12 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors">
                    <i class="fas fa-camera fa-lg"></i>
                </button>
                 <button id="export-pdf-btn" title="导出为PDF" class="flex items-center justify-center w-12 h-12 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                    <i class="fas fa-file-pdf fa-lg"></i>
                </button>
                 <button id="export-pptx-btn" title="导出为PPTX" class="flex items-center justify-center w-12 h-12 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
                    <i class="fas fa-file-powerpoint fa-lg"></i>
                 </button>
                <button id="next-btn" class="px-6 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    下一页
                </button>
            </div>
        </div>
    </div>

    <!-- 核心脚本 -->
    <script>
        document.addEventListener('DOMContentLoaded', () => {
            const slidesData = [
                // AI填充区域
            ];
            
            const slideDisplayArea = document.getElementById('slide-display-area');
            const prevBtn = document.getElementById('prev-btn');
            const nextBtn = document.getElementById('next-btn');
            const progressIndicator = document.getElementById('progress-indicator');
            const exportPngBtn = document.getElementById('export-png-btn');
            const exportPdfBtn = document.getElementById('export-pdf-btn');
            const exportPptxBtn = document.getElementById('export-pptx-btn');
            
            let currentSlide = 0;
            const totalSlides = slidesData.length;

            if (totalSlides === 0) {
                slideDisplayArea.innerHTML = `<div class="text-center text-slate-500 p-8"><p class="text-2xl">内容待填充</p></div>`;
                setControlsDisabled(true, true);
                return;
            }

            function setControlsDisabled(disabled, all = false) {
                const buttons = [prevBtn, nextBtn, exportPngBtn, exportPdfBtn, exportPptxBtn];
                buttons.forEach(btn => btn.disabled = disabled);
                if (all) {
                    prevBtn.disabled = true;
                    nextBtn.disabled = true;
                }
            }
            
            function setupSlides() {
                slideDisplayArea.innerHTML = '';
                slidesData.forEach((slide) => {
                    const slideElement = document.createElement('div');
                    slideElement.className = 'slide w-full h-full absolute top-0 left-0 transition-opacity duration-300 ease-in-out flex justify-center items-center opacity-0 invisible';
                    slideElement.innerHTML = `<div class="slide-content-wrapper flex flex-col" style="width: 1152px; height: 648px; overflow: hidden; font-family: 'Noto Sans SC', 'Inter', sans-serif;">${slide.content}</div>`;
                    slideDisplayArea.appendChild(slideElement);
                });
            }
            
            function updateView() {
                const slides = document.querySelectorAll('.slide');
                slides.forEach((slide, index) => {
                    if (index === currentSlide) {
                        slide.classList.remove('opacity-0', 'invisible');
                    } else {
                        slide.classList.add('opacity-0', 'invisible');
                    }
                });
                progressIndicator.textContent = `${currentSlide + 1} / ${totalSlides}`;
                prevBtn.disabled = currentSlide === 0;
                nextBtn.disabled = currentSlide === totalSlides - 1;
            }

            function showStatus(message) {
                progressIndicator.textContent = message;
            }

            function hideStatus() {
                updateView();
            }
            
            async function captureNodeAsPng(node) {
                 // 使用最稳定可靠的参数组合
                return await window.htmlToImage.toPng(node, {
                    quality: 0.98,
                    pixelRatio: 2,
                    cacheBust: true,
                });
            }

            async function processAllSlides() {
                const imageDataArray = [];
                const originalSlideIdx = currentSlide;

                try {
                    for (let i = 0; i < totalSlides; i++) {
                        showStatus(`处理中: ${i + 1}/${totalSlides}`);
                        currentSlide = i;
                        updateView();
                        await new Promise(resolve => setTimeout(resolve, 350));
                        
                        const nodeToCapture = document.querySelector('.slide:not(.invisible) .slide-content-wrapper');
                        if (!nodeToCapture) throw new Error(`找不到第 ${i+1} 页`);
                        
                        const data = await captureNodeAsPng(nodeToCapture);
                        imageDataArray.push(data);
                    }
                } finally {
                    currentSlide = originalSlideIdx;
                    updateView();
                }
                
                return imageDataArray;
            }

            async function exportCurrentPng() {
                setControlsDisabled(true);
                try {
                    showStatus('处理当前页...');
                    const nodeToCapture = document.querySelector('.slide:not(.invisible) .slide-content-wrapper');
                    if (!nodeToCapture) throw new Error('找不到可见幻灯片');
                    const imgData = await captureNodeAsPng(nodeToCapture);
                    const link = document.createElement('a');
                    link.download = `${document.title || 'slide'}-第${currentSlide + 1}页.png`;
                    link.href = imgData;
                    link.click();
                } catch (error) {
                    console.error('PNG导出失败:', error);
                    showStatus(`失败: ${error.message.substring(0, 20)}...`);
                } finally {
                    setTimeout(() => { hideStatus(); setControlsDisabled(false); }, 2000);
                }
            }
            
            async function exportPdf() {
                setControlsDisabled(true);
                try {
                    const imageDataArray = await processAllSlides();
                    showStatus('生成PDF...');
                    
                    const { jsPDF } = window.jspdf;
                    const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [1152, 648] });

                    imageDataArray.forEach((imgData, index) => {
                        if (index > 0) pdf.addPage([1152, 648], 'landscape');
                        pdf.addImage(imgData, 'PNG', 0, 0, 1152, 648, undefined, 'FAST');
                    });

                    await Promise.resolve(pdf.save(`${document.title || 'presentation'}.pdf`));
                    showStatus('导出完成！');

                } catch (error) {
                    console.error('PDF导出失败:', error);
                    showStatus(`失败: ${error.message.substring(0, 20)}...`);
                } finally {
                    setTimeout(() => { hideStatus(); setControlsDisabled(false); }, 3000);
                }
            }
            
            async function exportPptx() {
                setControlsDisabled(true);
                try {
                    const imageDataArray = await processAllSlides();
                    showStatus('生成PPTX...');

                    const pptx = new window.PptxGenJS();
                    pptx.layout = 'LAYOUT_WIDE';
                    imageDataArray.forEach(imgData => {
                        const slide = pptx.addSlide();
                        slide.addImage({ data: imgData, x: 0, y: 0, w: '100%', h: '100%' });
                    });
                    
                    await pptx.writeFile({ fileName: `${document.title || 'presentation'}.pptx` });
                    showStatus('导出完成！');
                } catch (error) {
                    console.error('PPTX导出失败:', error);
                    showStatus(`失败: ${error.message.substring(0, 20)}...`);
                } finally {
                    setTimeout(() => { hideStatus(); setControlsDisabled(false); }, 3000);
                }
            }

            exportPngBtn.addEventListener('click', exportCurrentPng);
            exportPdfBtn.addEventListener('click', exportPdf);
            exportPptxBtn.addEventListener('click', exportPptx);
            
            nextBtn.addEventListener('click', () => { if (currentSlide < totalSlides - 1) { currentSlide++; updateView(); } });
            prevBtn.addEventListener('click', () => { if (currentSlide > 0) { currentSlide--; updateView(); } });
            document.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') nextBtn.click(); else if (e.key === 'ArrowLeft') prevBtn.click(); });
            
            setupSlides();
            updateView();
        });
    </script>
</body>
</html>
