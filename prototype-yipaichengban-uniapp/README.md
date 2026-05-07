# 智存 - uni-app 应用骨架

这是“智存 / 一拍成办”真正的应用工程骨架，不是 Web demo。

## 目标

- 作为可打包 APK 的 uni-app 源码起点
- 保留三轴首页、私有沙盒、智能文件夹、异构瀑布流、语义搜索和详情页行动模块
- 后续接入 MediaProjection、悬浮窗和端侧大模型

## 目录

- `App.vue` - 全局样式与根壳
- `main.js` - uni-app 应用入口
- `pages/index/index.vue` - 首页和主流程
- `utils/` - 样例数据、本地存储、搜索与 AI 适配层
- `uni.scss` - 全局视觉系统

## 说明

当前仓库环境里没有做完整的 HBuilderX/uni-app 构建链配置，但这个目录的结构已经是应用工程，不是 Web 预览页。
如果要继续打包 APK，只需要把这个目录放进标准 uni-app 工程，再补齐对应的依赖与平台配置即可。
