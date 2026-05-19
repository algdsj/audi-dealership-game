# 发布与包壳路线

当前推荐先走 **PWA + 腾讯云部署**，确认真实玩家体验和存档稳定后，再考虑桌面或移动端壳。

## 路线一：PWA + 腾讯云部署

适合先公开给玩家体验。

1. 本地验证：

   ```bash
   npm run lint
   npm test
   npm run build
   npm run test:ui
   ```

2. 将 `dist/` 部署到服务器站点目录。
3. Nginx 指向 `dist/index.html`，并确保这些文件可访问：
   - `/manifest.webmanifest`
   - `/sw.js`
   - `/favicon.svg`
   - `/icons/app-icon.svg`
4. 玩家通过浏览器打开后，可使用浏览器菜单安装到桌面或主屏幕。

注意事项：

- 存档保存在玩家本机 `localStorage`，不会随部署自动上传。
- `sw.js` 只缓存静态资源和应用壳，不缓存存档数据。
- 每次版本升级要同步更新 `public/sw.js` 的 `CACHE_VERSION`，避免旧缓存长期驻留。

## 路线二：Tauri 桌面壳

适合发布 Windows/macOS 桌面版。优点是包体小、系统资源占用低。

建议等 PWA 版本稳定后再初始化 Tauri：

```bash
npm run build
```

然后让 Tauri 读取 `dist/` 作为前端资源。桌面版仍可沿用浏览器本地存档逻辑，但发布前需要额外检查：

- 窗口最小尺寸
- 文件导入导出权限
- 本地存档路径和清理逻辑
- Windows/macOS 图标和签名

## 路线三：Capacitor iPad/移动端壳

适合 iPad 或 Android 平板。当前 UI 已偏桌面/iPad 方向，但真正上架前还需要：

- iPad 横竖屏检查
- 安全区和虚拟键盘检查
- 文件导入导出在 WebView 内的兼容性
- 应用图标、启动图和隐私说明

建议先用 PWA 在 iPad Safari 上验证体验，再决定是否包 Capacitor。

## 当前状态

- 已有 `manifest.webmanifest`。
- 已有基础 SVG 图标。
- 已有 `sw.js` 静态缓存。
- 设置页展示联网、离线缓存、窗口模式和安装状态。
- README 已说明系统设置、存档导入导出和发布前能力。
