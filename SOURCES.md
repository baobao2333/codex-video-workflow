# 研究、事实与素材来源

核对日期：2026-09-27。

| 来源 | 本项目怎样使用 |
|---|---|
| [Lemo-Opuscar](https://github.com/lemomo-ai/lemo-opuscar) / [图鉴](https://lemomo-ai.github.io/lemo-opuscar/) | 研究导演/技术方法、Swiss Motion 和 Pictogram Motion 的风格语法；浏览 Swiss 样片画面和风格说明。没有把其影片、旁白或音乐剪入本片。没有据此声称完整试听其样片。 |
| [Swiss Motion STYLE.md](https://github.com/lemomo-ai/lemo-opuscar/blob/main/styles/swiss-motion/STYLE.md) | 网格、字号对比和节拍式到达。新构图、新文案、新代码。 |
| [Pictogram Motion STYLE.md](https://github.com/lemomo-ai/lemo-opuscar/blob/main/styles/pictogram-motion/STYLE.md) | 共享时间轴、遮罩转场与标题轨组织。没有使用赛事标志、运动员图案和活动文案。 |
| [awesome-opus-5-5-videos](https://github.com/athemeroy/awesome-opus-5-5-videos) | 用于辨别生产路线和证据等级，不当成受控模型评测。 |
| [生产路线指南](https://github.com/athemeroy/awesome-opus-5-5-videos/blob/main/docs/visual-effects-fit.md) | 选型和验收的研究参考。 |
| [OpenAI 官方文档](https://learn.chatgpt.com/docs/features) | Codex 的开发与工具工作流事实范围。片中是写代码、运行、迭代的创意表达，没有具体性能、速度或成功率数字。 |
| [What Ships](https://whatships.com/) | 核对其参考视频检索用途。本片不使用其媒体资产。 |
| [Remotion](https://www.remotion.dev/docs) | 核对 React 视频生产路线。 |
| [HyperFrames](https://github.com/heygen-com/hyperframes) | 核对 HTML 逐帧视频路线。 |
| [Motion Canvas](https://motioncanvas.io/docs/rendering/) | 核对替代渲染路线。 |
| [21st.dev](https://21st.dev/) | 核对 UI 组件资源定位，本片未引入组件。 |
| [Suno V6 发布说明](https://suno.com/release-notes/introducing-v6) | 核对 V6 及 V6-wild / mini 分工，实际生成型号由用户登录页面的 V6 标识确认。 |

## 公开实例的音乐

公开版本采用 `score.py` 的本地原创合成配乐：NumPy / SciPy 生成鼓、贝斯、键盘与编曲，不含外部音频采样、不调用音乐 API。`mix.py` 另做音效与母带。音源、随机种子和事件表见 `audio/music-edit.json`。

原始任务曾使用 Suno V6 探索配乐；公开仓库不含该账户的歌曲、会话截图或下载音频。用户可将自己的已授权音乐作为可选输入。参考链接不授予外部素材的使用许可。

## 字体、图形、商标与源代码

Inter 与 Noto Sans SC 来自工作区已有合法字体缓存；随附 SIL OFL 许可证。Noto 字重由现有可变字体静态实例化。本片没有照描官方字标文件，Codex 名称以 Inter 排版；钴蓝指向符是原创图形，不声称是官方标志。

Canvas 动画是为本片新编写的确定性代码。`render.mjs` 复用同一工作区已有 WinZip 视频的管线模式。公开工程已整理为独立重建目录。

`research/` 中保存供本任务研究的上游说明文件，原作者 Lemomo 的指南和风格文件依上游 CC BY 4.0 归属；公开打包版本以链接和本项目独立说明为主，不包含整份研究缓存。参考：[Lemo 许可证](https://github.com/lemomo-ai/lemo-opuscar/blob/main/LICENSE)。awesome 仓库文字与图表也有其独立署名条件；本项目仅作简要归纳并给出来源链接。

OpenAI / Codex 名称归其权利人。本片是独立概念作品，片尾已标注，未表示由官方委托或认可。
