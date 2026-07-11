# 私有作者身份配置

Owner: `RedCube AI`
Purpose: `private_profile_setup_guide`
State: `active_support`
Machine boundary: 人读 workspace 配置指南。机器真相归 workspace `.redcube/identity.json` 与运行时行为。

小红书作者身份只使用当前 workspace 的 `.redcube/identity.json`。`source intake` / `source research` 首次 bootstrap 时会生成通用 `RedCube AI` 占位；不同项目各自维护，不再叠加 repo、用户、local、workspace 多层配置。

```json
{
  "defaultProfileId": "redcube_author",
  "routing": {
    "medicalProfileId": "redcube_author",
    "generalProfileId": "redcube_author"
  },
  "profiles": {
    "redcube_author": {
      "displayName": "你的账号名",
      "signatureDisplay": "你的署名",
      "signatureSubtitle": "你的品牌副标"
    }
  }
}
```

临时进程级覆盖仅支持：

- `REDCUBE_AUTHOR_PROFILE_ID`
- `REDCUBE_SIGNATURE_DISPLAY`
- `REDCUBE_SIGNATURE_SUBTITLE`

作者身份只补充署名和品牌显示，不能覆盖 source truth、视觉判断、review/export verdict、artifact authority 或 owner receipt。缺少关键品牌素材时仍应返回 material gap 或 typed blocker。
