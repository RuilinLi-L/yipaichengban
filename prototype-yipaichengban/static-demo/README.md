# 智存 - 静态 H5 原型

这是“碎片信息 AI 全能管家”的无构建静态原型，用来快速展示：

- 首页三轴 Dashboard：捕获端、知识金库、语义搜索
- 悬浮引擎模拟：开启后显示悬浮球，长按模拟截图，双击进入搜索
- AI 知识金库：智能文件夹 + 异构瀑布流
- 全局语义搜索：关键词 + 语义召回模拟
- 搜索状态保活：从详情返回后保留搜索词和结果位置
- 资产详情页：AI 提炼、标签、可选行动模块

## 运行方式

最简单方式：直接双击 `index.html`，或在浏览器打开：

```text
D:\文件\AIGC挑战赛\prototype-yipaichengban\static-demo\index.html
```

如果需要本地服务，可在该目录运行：

```powershell
python -m http.server 8088
```

然后访问：

```text
http://127.0.0.1:8088/
```

## 复赛迁移路线

当前原型使用 `localStorage` 模拟应用私有目录和轻量数据库。复赛 APK 版本建议替换为：

- Android 私有文件目录：保存截图和文本资产
- SQLite/KV：保存标签、摘要、向量索引和行动项
- MediaProjection：实现真实截图捕获
- Overlay Service：实现真实全局悬浮球
- AIAdapter：接入蓝心端侧模型、本地 OCR 或第三方大模型

## 当前环境说明

此仓库路径包含中文，当前 Windows 沙盒里 Vite/esbuild 和浏览器自动化均被 `spawn EPERM` 阻断。因此本交付采用无构建静态 H5，保证原型可以直接打开。
