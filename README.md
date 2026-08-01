# Personal site

一个无构建依赖、可直接部署到 GitHub Pages 的 TXT / geometry 个人索引。

## 本地预览

```bash
python3 -m http.server 8000
```

打开 `http://localhost:8000`。

## 内容能力

- KaTeX 数学公式：正文默认使用块级 `$$...$$`
- 内容索引：通过 `data-type` 扩展和筛选 blogs、agenda、papers 及 misc
- 富媒体：详情页可以继续接入原生视频、音频或交互内容
- 完整响应式导航与移动端排版
