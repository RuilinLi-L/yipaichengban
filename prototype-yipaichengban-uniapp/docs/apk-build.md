# APK 打包说明

这个目录是 `uni-app` 版本，APK 应从这里打包：

```powershell
cd D:\文件\AIGC挑战赛\prototype-yipaichengban-uniapp
```

## 1. 检查打包条件

```powershell
npm run apk:doctor
```

检查项包括：

- `manifest.json` 是否存在
- DCloud AppID 是否仍是占位值
- Android 包名是否合法
- 版本号是否完整
- Android 权限是否声明
- 本机是否能找到 HBuilderX

## 2. 配置正式 AppID

先到 DCloud 后台创建应用，拿到正式 AppID，然后执行：

```powershell
npm run apk:configure -- -DCloudAppId "__UNI__你的正式ID" -PackageName "com.yipaichengban.zhicun" -VersionName "0.1.0" -VersionCode 1
```

如果只想改其中一项，也可以只传对应参数。

## 3. 打开 HBuilderX

```powershell
npm run apk:open
```

如果脚本找不到 HBuilderX，可以先设置路径：

```powershell
$env:HBUILDERX_PATH = "C:\Program Files\HBuilderX\HBuilderX.exe"
npm run apk:open
```

## 4. 云打包 APK

在 HBuilderX 里：

1. 登录 DCloud 账号。
2. 打开 `manifest.json`，确认 AppID、应用名称、包名、版本号。
3. 选择“发行 / 原生 App 云打包”。
4. 平台选择 Android。
5. 调试安装可先使用公共测试证书；正式提交或分发建议使用自有 Android 证书。
6. 开始打包，等待云端完成后下载 `.apk`。

## 一键准备入口

配置完成后，可以运行：

```powershell
npm run apk:prepare
```

它会先做环境检查，通过后自动打开 HBuilderX，并在终端打印下一步操作。

## 当前限制

仓库目前没有提交 Android Gradle 原生工程，也没有本机 Android SDK/JDK 配置，所以不是 `npm run build` 直接产出 APK 的模式。当前可落地路径是 HBuilderX 的 uni-app Android 云打包。
