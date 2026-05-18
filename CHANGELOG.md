# Changelog

## [Unreleased]

### Added
- **Edge TTS 免费语音合成**: 在 TTS 设置页新增服务商选择器，支持在 MiniMax 和 Edge TTS（免费）之间切换。
  - Edge TTS 使用微软在线 TTS 服务，无需 API Key，无需选择模型
  - 内置 30+ 种音色选择（中文普通话、粤语、英语、日语、韩语等）
  - 支持语速（0.5-2.0x）和音调（-12~12）调节
  - 字幕基于 WordBoundary 事件精确生成 SRT

### Changed
- `AISettings` 类型新增 `ttsProvider` 和 `edgeTtsVoice` 字段
- `generate-tts` IPC 处理程序支持根据 `ttsProvider` 分支处理
- 设置页默认值、迁移路径补齐新字段
- API Key 前置检查仅在 MiniMax 模式下触发，Edge TTS 模式跳过

### Technical
- 新增 `electron/edge-tts.ts` 后端模块
- 依赖：`edge-tts-universal` (^1.4.0)
