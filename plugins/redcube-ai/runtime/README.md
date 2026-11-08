# RCA Authority Boundary

Owner: RedCube AI
Purpose: 为标准 Agent pack 提供最小 authority-function source root。
State: active_descriptor_only
Machine boundary: 本目录不实现 scheduler、runner、session、workspace、review transport、native-helper envelope 或 package lifecycle。

具体声明见 `authority_functions/README.md`。运行实例、StageRun、Attempt、receipt、artifact body 与 workspace state 均由 OPL runtime / workspace owner 保存，不进入 repo source。
