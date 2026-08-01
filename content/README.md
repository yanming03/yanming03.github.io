# Content

```txt
content/
├── index.js
├── blogs/
├── agenda/
├── papers/
└── misc/
    └── hello-world/
        └── index.html
```

每项内容使用独立目录，例如：

```txt
misc/hello-world/
├── index.html
└── references.bib
```

新增内容后，在 `index.js` 追加索引数据。

首页是所有内容的统一目录；每个条目的 `href` 指向独立详情页。
