# Lyrics Card

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-orange.svg)](https://github.com/custom-components/hacs)

<img width="562" alt="2025-04-27 10 26 12" src="https://github.com/user-attachments/assets/9475b8dc-7f06-4faa-9c83-8f3c12a7d9aa" />

Home Assistant 音乐歌词显示卡片，支持智能搜索、卡拉OK效果和浮动歌词功能。

## 功能特点

- 🔍 **智能歌词搜索**：自动从音乐数据库中搜索当前播放歌曲的歌词
- 🎵 **歌词同步显示**：根据播放进度实时高亮当前歌词
- 🎤 **卡拉OK效果**：支持逐字显示的卡拉OK效果（卡拉OK效果）
- 🎯 **浮动歌词**：支持在任意位置拖拽显示的浮动歌词
- 🔄 **多种循环模式**：支持顺序播放、列表循环、单曲循环和随机播放
- 🎨 **自定义外观**：支持自定义字体、大小、颜色等样式设置
- 📱 **响应式设计**：在手机和桌面端都有良好的显示效果
- 🔄 **自动缓存**：智能缓存歌词以提高加载速度

## 安装

### 前置条件

- Home Assistant 2024.08 或更高版本
- [HACS](https://hacs.xyz/) (推荐)

### 使用 HACS 安装（推荐）

1. 打开 HACS
2. 点击 "自定义存储库"
3. 添加此存储库的 URL: `https://github.com/knoop7/lyrics-card`
4. 选择类别为 "集成"
5. 点击 "添加"
6. 在 HACS 存储库列表中找到 "Lyrics Card"
7. 点击 "下载"

### 手动安装（部分无法正常使用卡片）

1. 下载 `netease-lyrics-card.js` 文件
2. 将文件放置在你的 Home Assistant 配置文件夹的 `/www/` 目录中



## 设置与配置

### 安装配套集成

该卡片需要配合 Lyrics 集成使用，确保已安装并配置好该集成。

### 基本配置

在你的 Lovelace 视图中添加卡片:

```yaml
type: custom:netease-lyrics-card
entity: media_player.your_player
```

### 高级配置选项

```yaml
type: custom:netease-lyrics-card
entity: media_player.your_player
show_background: true      # 显示背景图片
show_header: true          # 显示标题栏
show_karaoke: true         # 启用卡拉OK效果
show_floating_lyrics: true # 启用浮动歌词
hide_lyrics_container: false # 隐藏固定歌词容器
```

## 自定义样式

浮动歌词支持样式自定义，双击浮动歌词窗口可以打开设置面板，调整:

- 字体大小
- 字体粗细
- 字体系列
- 描边颜色
- 文字颜色

## 使用说明

### 媒体控制

- 上一首/下一首：切换歌曲
- 播放/暂停：控制播放状态
- 循环模式：点击切换顺序播放、列表循环、单曲循环和随机播放

### 浮动歌词

- 拖拽：在屏幕上任意拖拽浮动歌词
- 双击：打开设置面板

## 常见问题

**Q: 为何无法搜索到某些歌曲的歌词?**  
A: 卡片会尝试多种搜索方式，但如果歌曲名称或艺术家信息与网易云音乐数据库中的不匹配，可能找不到歌词。尝试确保媒体播放器提供的歌曲信息准确无误。

**Q: 为什么歌词与音乐不同步?**  
A: 卡片使用媒体播放器提供的时间信息进行同步。确保你的媒体播放器正确报告播放位置和持续时间。

**Q: 如何在手机上使用浮动歌词?**  
A: 浮动歌词功能在移动设备上也能正常工作。你可以通过触摸拖动来移动歌词，双击打开设置。

## 自定义和开发

- **v1.2.0** - 新增单曲循环和随机播放功能，增强歌词搜索能力
- **v1.1.0** - 添加浮动歌词和样式自定义
- **v1.0.0** - 初始版本

## 贡献

欢迎贡献！请随时提交 issue 或 pull request。

---

如果你喜欢这个项目，请考虑给它一个 ⭐ 星标！
