# Models

高质量模型放在此目录并自行托管。不要直接热链第三方 CDN。

推荐结构：

```text
models/
├── room/
├── music/
├── fitness/
├── reading/
├── research/
├── making/
├── photography/
└── shared/
```

命名使用小写英文、连字符和版本号，例如：

```text
gramophone-v2.glb
bookshelf-v1.glb
tea-set-v3.glb
```

要求：

- 运行时统一使用 glTF 2.0 / GLB；
- 单位为米；
- 导出前 Apply Rotation & Scale；
- 去除无用节点、品牌 Logo 和未授权封面；
- 普通资产尽量控制在 1–3 MB；
- 单个 GLB 不得超过 24 MiB，并需内嵌缓冲区与纹理；
- 普通纹理 512–1K，英雄资产 2K；
- 嵌入纹理使用 PNG、JPEG 或 WebP；
- 当前上传器与运行时不支持 Draco、Meshopt、BasisU / KTX2 或 AVIF；
- 每个文件登记到项目根目录 `ASSET_CREDITS.md`；
- 保留程序化模型作为加载失败 fallback；
- 修改二进制内容时更新版本文件名，便于长缓存。
