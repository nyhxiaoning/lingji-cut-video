# 灵机剪影 - 环境搭建与启动指南

## 环境要求

| 依赖 | 最低版本 | 已验证版本 |
|------|---------|-----------|
| Node.js | ≥ 22 | v24.15.0 |
| npm | ≥ 10 | 11.12.1 |
| 操作系统 | macOS / Windows | macOS (Darwin) |
| 磁盘空间 | ≥ 2 GB | — |

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 启动开发环境
npm run dev
```

## 环境变量检查（重要）

在 IDE 内置终端（VS Code / Trae / Codex 等）中运行时，终端可能继承了 `ELECTRON_RUN_AS_NODE=1` 环境变量。这会导致 Electron 以纯 Node.js 模式运行，`require('electron')` 无法返回 Electron API，应用启动时会报 `Cannot read properties of undefined (reading 'getAppPath')` 等错误。

**检查是否受影响：**

```bash
echo $ELECTRON_RUN_AS_NODE
```

如果输出 `1`，说明该变量已被设置。

**临时解决：**

```bash
unset ELECTRON_RUN_AS_NODE
npm run dev
```

项目的 `dev` 脚本和 `scripts/dev-windows-utf8.cjs` 已内置清理该变量，正常情况下无需手动干预。如果仍遇到问题，在启动前手动 `unset` 即可。

## 安装依赖

```bash
npm install
```

此命令会：

- 根据 `package.json` 安装全部依赖到 `node_modules/`
- 生成 `package-lock.json`
- Electron 包的 `postinstall` 脚本会自动下载 Electron 二进制文件

### 关于 npm 镜像

项目 `.npmrc` 已配置 npmmirror.com 国内镜像，包括 Electron 二进制镜像。如果你在海外或镜像不可用，可临时删除 `.npmrc` 或注释其中各行。

### 常见安装问题

**Peer dependency 冲突**

如果 npm 11 报 `ERESOLVE` 错误（如 `@base-ui/react` 要求 `date-fns@^4.0.0`），可以手动升级对应依赖版本，或使用 `--legacy-peer-deps` 绕过：

```bash
npm install --legacy-peer-deps
```

**Electron 二进制下载失败**

`npm install` 完成后，如果 Electron 二进制未成功下载，运行 `npm run dev` 时会由 `scripts/ensure-electron-binary.cjs` 自动补下载。也可以手动触发：

```bash
node node_modules/electron/install.js
```

**npm 缓存权限错误**

如果 npm 报 `EACCES: permission denied` 访问 `~/.npm/_cacache`，说明缓存目录存在 root 权限文件。两种解决方式：

```bash
# 方式一：修复缓存目录权限（需要 sudo）
sudo chown -R $(id -u):$(id -g) ~/.npm

# 方式二：使用临时缓存目录
npm install --cache /tmp/npm-cache
```

**node-pty 编译失败**

`node-pty` 是原生模块，需要系统上有 C++ 编译工具链：

- macOS：确保 Xcode Command Line Tools 已安装（`xcode-select --install`）
- Windows：需要 `windows-build-tools` 或 Visual Studio Build Tools

## 启动开发环境

```bash
npm run dev
```

此命令执行两个步骤：

1. `scripts/ensure-electron-binary.cjs` — 检查 Electron 二进制是否存在，不存在则自动从镜像下载
2. `scripts/dev-windows-utf8.cjs` — 调用 `electron-vite dev --watch` 启动开发服务

启动后：

- **Vite dev server** 启动在 `http://localhost:5173/`
- Electron 窗口自动打开，加载 Renderer 页面
- 修改 `src/` 下代码会触发热更新（HMR）
- 修改 `electron/` 下主进程代码会触发 Electron 重启

### 端口冲突

如果 MCP server 端口（19820）被之前的进程占用，新进程会报 `EADDRINUSE` 错误并自动跳过，不影响核心功能。如需彻底清理：

```bash
lsof -ti:19820 | xargs kill -9
```

### 只启动前端（不启动 Electron）

如果只想调试 Renderer 页面（浏览器中打开），可以直接用 Vite：

```bash
npx vite --config electron.vite.config.ts
```

不过此方式下 Electron IPC 能力不可用，仅适合纯 UI 调试。

## 项目结构速览

```
lingji-cut-video/
├── electron/            # Electron 主进程 + preload
│   ├── main.ts          # 主进程入口
│   └── preload.ts       # preload 桥接
├── src/                 # Renderer（React）
│   ├── App.tsx          # 应用根组件
│   ├── pages/           # 页面组件
│   ├── store/           # Zustand 状态管理
│   ├── components/      # UI 组件
│   ├── lib/             # 工具库
│   └── ui/              # UI primitives / patterns
├── scripts/             # 构建 & 打包脚本
├── electron.vite.config.ts  # electron-vite 配置
├── index.html           # Renderer 入口 HTML
└── package.json
```

## 常用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发环境（Electron + Vite） |
| `npm run build` | 生产构建（含代码混淆 + Remotion 打包） |
| `npm test` | 运行 Vitest 测试（单次） |
| `npm run test:watch` | Vitest watch 模式 |
| `npm run dist:mac` | 构建 + 打包 macOS .app |
| `npm run dist:dmg:mac` | 构建 + 打包 macOS .dmg |
| `npm run package:mac` | 仅打包（需先 build） |

## 验证安装成功

```bash
# 1. 确认依赖安装完整
ls node_modules/electron/dist/Electron.app/Contents/MacOS/Electron

# 2. 确认构建工具可用
npx electron-vite --version

# 3. 运行测试
npm test
```

如果以上三步都通过，运行 `npm run dev` 即可启动应用。
