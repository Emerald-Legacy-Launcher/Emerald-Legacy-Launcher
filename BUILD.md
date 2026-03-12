# Building Emerald Launcher
## Requirements

- Node.js (and NPM)
- Rust
- WebKit2GTK-4.1 (GNU/Linux only)
- WebKit (macOS only, preinstalled)
- Microsoft Edge WebView2 Runtime (Windows only)
- PNPM (optional, but recommended)
- Windows, GNU/Linux or a macOS system.

## Building

```sh
pnpm install  # or npm
pnpm tauri build  # or npm
```

## Notes
On GNU/Linux, the build might fail due to missing logos (because still Alpha, contributions to fix this are welcome).
To fix that, build with this command instead:
```sh
pnpm tauri build --no-bundle
```
