# 智存 - uni-app 应用工程骨架

这是“智存 / 一拍成办”真正的应用工程骨架，不是 Web demo。

## 目标

- 作为可打包 APK 的 uni-app 源码起点
- 保留三轴首页、私有沙盒、智能文件夹、异构瀑布流、语义搜索和详情页行动模块
- 后续接入 MediaProjection、悬浮窗和端侧大模型
- 优先面向 Android / vivo 真机调试，保持竖屏移动端体验

## 目录

- `App.vue` - 全局样式与根壳
- `main.js` - uni-app 应用入口
- `pages/index/index.vue` - 首页和主流程
- `utils/` - 样例数据、本地存储、搜索与 AI 适配层
- `uni.scss` - 全局视觉系统
- `static/` - HBuilderX 静态资源目录占位

## HBuilderX 运行步骤

1. 打开 HBuilderX，选择“文件 / 导入 / 从本地目录导入”，目录选中 `prototype-yipaichengban-uniapp`。
2. 在 `manifest.json` 可视化页面里确认 AppID。当前占位为 `__UNI__ZHICUN001`，云打包前需要换成 DCloud 后台申请的正式 AppID。
3. 连接 vivo 手机，开启开发者选项和 USB 调试。
4. 选择“运行到手机或模拟器 / 运行到 Android App 基座”，先验证首页、金库、搜索、捕获样例和详情页流程。
5. 需要打包 APK 时，选择“发行 / 原生 App 云打包”，包名默认是 `com.yipaichengban.zhicun`，可按参赛要求调整。

## 当前 App 端配置

- 已声明 Vue 3、竖屏、无原生标题栏、自绘状态栏安全区。
- 已预留 Android 权限：网络、悬浮窗、前台服务、媒体投影前台服务、通知、图片读取。
- 当前捕获能力仍是 `uni.chooseImage` 和样例数据模拟；真正的跨 App 截屏需要下一阶段接 Android 原生插件或 uts 插件。
- 当前 AI 能力是本地 mock 搜索与打标适配层；接蓝心端侧能力或 OCR 时优先替换 `utils/ai.js` 的输出协议。

## 说明

当前目录可以作为 HBuilderX uni-app 项目继续推进。仓库里的 `prototype-yipaichengban/static-demo` 是早期 Web 预览，可先忽略。
