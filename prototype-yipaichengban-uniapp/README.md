# 一拍成办 - uni-app 应用工程

这是把 `prototype-yipaichengban` 网页原型迁移到 uni-app 后的 APK 工程。

## 目标

- 作为可打包 APK 的 uni-app 源码起点
- 保留网页原型的“捕获 / 行动卡 / 知识库 / 隐私配置”主流程
- 支持 `uni.chooseImage` 主动导入截图，并生成可编辑行动卡
- 支持配置代理服务或 OpenAI-compatible API Key 进行真实大模型调用
- 未配置模型时回退本地 mock，方便无网络演示
- 后续可继续接入 MediaProjection、悬浮窗和端侧大模型
- 优先面向 Android / vivo 真机调试，保持竖屏移动端体验

## 目录

- `App.vue` - 全局样式与根壳
- `main.js` - uni-app 应用入口
- `pages/index/index.vue` - 网页原型迁移后的主流程
- `utils/` - 样例数据、本地存储与 AIAdapter
- `uni.scss` - 全局视觉系统
- `static/` - HBuilderX 静态资源目录占位

## HBuilderX 运行步骤

1. 打开 HBuilderX，选择“文件 / 导入 / 从本地目录导入”，目录选中 `prototype-yipaichengban-uniapp`。
2. 在 `manifest.json` 可视化页面里确认 AppID。当前占位为 `__UNI__ZHICUN001`，云打包前需要换成 DCloud 后台申请的正式 AppID。
3. 连接 vivo 手机，开启开发者选项和 USB 调试。
4. 选择“运行到手机或模拟器 / 运行到 Android App 基座”，先验证捕获、行动卡、知识库和模型配置流程。
5. 需要打包 APK 时，选择“发行 / 原生 App 云打包”，包名默认是 `com.yipaichengban.zhicun`，可按参赛要求调整。

## APK 打包辅助命令

```powershell
cd D:\文件\AIGC挑战赛\prototype-yipaichengban-uniapp
npm run apk:doctor
npm run apk:configure -- -DCloudAppId "__UNI__你的正式ID" -PackageName "com.yipaichengban.zhicun" -VersionName "0.1.0" -VersionCode 1
npm run apk:prepare
```

完整步骤见 `docs/apk-build.md`。

## 当前 App 端配置

- 已声明 Vue 3、竖屏、无原生标题栏、自绘状态栏安全区。
- 已预留 Android 权限：网络、悬浮窗、前台服务、媒体投影前台服务、通知、图片读取。
- 当前捕获能力是 `uni.chooseImage` 和样例数据；真正的跨 App 截屏需要下一阶段接 Android 原生插件或 uts 插件。
- 当前 AIAdapter 会优先调用右上角配置的代理服务或 OpenAI-compatible Responses 接口；未配置时使用本地 mock。
- 若使用代理服务，地址填写服务根路径即可，App 会请求 `/api/analyze-capture`。
- 若直连模型，请在 App 内填写 API Key、Base URL 和模型名。比赛演示建议使用自有代理，避免把 Key 固化进安装包。

## 说明

当前目录可以作为 HBuilderX uni-app 项目继续推进。仓库里的 `prototype-yipaichengban` 是网页原型来源，`prototype-yipaichengban/static-demo` 是早期 Web 预览。
