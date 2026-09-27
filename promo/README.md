# Video Workflow · 让想法，开拍

宣传本仓库流程的 40 秒短片。Three.js 构建精密卷片装置，以“显影机器”隐喻参考、分镜、动画、修改、音乐和输出。它不是实际硬件或软件界面。主体、美术、建模、动画、声音均为本片编写。

- `dist/video-workflow.mp4`：1080p / 30 fps。
- `dist/workflow-preview.mp4`：720p 预览。
- `TREATMENT.md`：三种创意及选定方案。
- `../REFERENCE-STUDY.md`：参考案例研究与初版复盘。

## 重建

先按仓库根目录安装 Python 依赖，然后在本目录：

```bash
npm ci
npx playwright-core install chromium
npm run stills
npm run proof
python finish.py --proof
npm run build
```

首次下载 Chromium 需要联网；之后画面和音乐均在本机生成。可用 `CHROME_BIN` 指定已有的兼容 Chromium 可执行文件。Windows 默认使用 ANGLE D3D11；显卡不兼容时设置 `ANGLE_BACKEND=swiftshader` 使用较慢的软件渲染。`PYTHON` 可指定 Python 可执行文件。

`npm run proof` 只生成 12–20 秒画面，`python finish.py --proof` 加入对应音乐；修改后需重新运行。不要把旧片段当成最新源码的验证。

## 修改

- `scene.js`：几何结构、材质、镜头、动作、画面事件和时间。
- `index.html`：文案、中文排版、片尾与留白。
- `render.mjs`：确定性截图和 FFmpeg 编码。
- `finish.py`：复用根目录 `score.py`，另配机械音效、混音和验收。

本片没有外部摄影素材、视频素材、Suno 音频或下载采样。Three.js、Playwright 依赖保留各自许可证，字体沿用根目录 `assets/` 的 OFL。

当前验证为确定性寻址、实际静帧/动作抽帧和完整文件解码、响度测量；不能据此声称审美已经超过参考或完成了人类听感评审。
