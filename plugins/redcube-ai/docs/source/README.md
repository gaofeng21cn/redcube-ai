# Source

Owner: OPL Framework（intake transport）/ RedCube AI（source-readiness semantics）
Purpose: 说明 source input 的 transport 与 domain decision 边界。
State: active
Machine boundary: workspace/source locator 归 OPL；RCA source-readiness prompt、gate 与 returned refs 归 declarative pack。

OPL 负责 workspace binding、source locator、materialization、hash/currentness 与 input artifact transport。RCA 不维护 source-intake service、workspace store 或 augmentation executor。

RCA 负责判断视觉交付所需信息是否足够、哪些 claim/asset/brand constraint 可用、哪些缺口需要 human gate 或 quality debt，并把判断作为当前 StageRun 的 artifact/decision refs 返回。

真实 source body 不进入 repo contracts；contracts 只保存 vocabulary、schema、policy 与 body-free refs。
