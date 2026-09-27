# Codex Video Workflow

把创作方向变成可播放、可修改、可重建的视频。中文流程、启动提示词，以及一套能独立运行的 40 秒实例。

**默认音乐由 Codex 编写代码，在本地作曲和合成。无需 Suno 会员、音乐 API 或云端生成服务。** Suno 是可选音乐来源。

[阅读完整流程](CODEX-VIDEO-WORKFLOW.md) · [复制启动提示词](PROMPT-TEMPLATE.md) · [音乐与回退](MUSIC.md) · [观看示例 MP4](dist/codex-preview.mp4)

![实际渲染的分镜](frames/storyboard.jpg)

## 用它制作你的视频

把 [流程](CODEX-VIDEO-WORKFLOW.md)、[启动模板](PROMPT-TEMPLATE.md)、1–2 个参考和产品真实素材交给 Codex。工作顺序：

1. 明确观众、主张和观看场景。
2. 将参考拆成构图、运动和节奏规则，选择合适的渲染器。
3. 比较三种叙事，选定贯穿全片的视觉机制。
4. 输出实际静帧，再验证最关键的连续运动片段。
5. 共用时间轴，制作画面、音乐与音效。
6. 用时间码修改，检查完整成片，交付源代码和 MP4。

流程不绑定 Remotion、HyperFrames、21st.dev 或某个音乐服务。具体例子采用 Canvas + FFmpeg；已有合适技术栈时优先复用。

## 重建随附实例

需要 **Node.js 20+、Python 3.11+**。建议建立 Python 虚拟环境。首次安装依赖需要联网；安装完成后，默认渲染和配乐均可本地运行。FFmpeg 由 `imageio-ffmpeg` 提供，字体已随仓库附带。

```bash
git clone https://github.com/baobao2333/codex-video-workflow.git
cd codex-video-workflow
npm ci
python -m pip install -r requirements.txt
python build.py
```

不同系统的 Python 命令可能是 `python3`；使用同一个 Python 环境安装和执行。以上依赖组合已在 Windows / Python 3.11 上验证；其他平台需要对应的 Canvas / FFmpeg 二进制 wheel。

产物：`dist/codex-make-it-happen.mp4`（1080p / 60 fps）、`dist/codex-preview.mp4`、实际静帧、标题轨、音频分轨和技术检查记录。

仅生成音乐：

```bash
python build.py --audio-only
```

使用已有配乐，包括自行下载的 Suno 音频：

```bash
python build.py --music auto --input path/to/music.wav
```

`auto` 在没有可用文件时回退到本地作曲，回退原因写入 `audio/music-edit.json`。需要严格使用指定文件时选择 `--music file`；无效输入将报错。`--music code` 强制本地作曲。

本地放映页：运行 `npm run review`，打开 `http://127.0.0.1:8765/`。

## 修改入口

| 文件 | 用途 |
|---|---|
| `CODEX-VIDEO-WORKFLOW.md` | 可复用的生产流程与工具选型 |
| `PROMPT-TEMPLATE.md` | 下一次制作的任务输入 |
| `MUSIC.md` | 程序配乐、外部音频与 Suno 回退规则 |
| `timeline.json` / `TREATMENT.md` | 实例时间轴与导演方案 |
| `film.mjs` | 实例逐帧画面 |
| `score.py` | 原创合成器、音符、节奏与配器 |
| `music.py` / `mix.py` | 音源选择、回退、剪辑、音效与母带 |
| `render.mjs` / `finish.py` | 编码、封装与技术检查 |
| `test_music.py` / `check.mjs` | 音乐回退与画面确定性检查 |

实例固定为 **40 秒、144 BPM、12 个场景**。改变片长或节奏时，需要重新编排画面和音乐，不能只修改 JSON 的片长。它是可读的实例工程，不是万能视频生成器。

## 对视觉质量的要求

这套流程保证可迭代和可重建，不保证一次生成就惊艳。初版 Codex 概念片仍有“大字＋图形＋切场”的演示文稿感。后续制作应优先解决贯穿主体、空间关系、镜头连续性和动作因果，先做 5–8 秒的关键片段，再扩展全片。不要把通过编码检查当作审美验收。

## 来源与许可

研究参考：[Lemo-Opuscar](https://github.com/lemomo-ai/lemo-opuscar)、[awesome-opus-5-5-videos](https://github.com/athemeroy/awesome-opus-5-5-videos)。具体参考范围见 [SOURCES.md](SOURCES.md)。

源代码与文档采用 [MIT](LICENSE)，字体保留各自 SIL OFL 许可证。默认音乐由随附代码合成，不包含原任务的 Suno 音频或账户内容。OpenAI / Codex 名称归其权利人；实例为独立概念作品。
