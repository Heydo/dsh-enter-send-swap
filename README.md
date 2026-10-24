# Composer Enter Swap

DSH Web 插件：交换输入框的发送 / 换行快捷键。

> DSH Web plugin: `Enter` inserts a line break, `Shift+Enter` sends the message.

| 按键 | 默认行为 | 安装本插件后 |
| --- | --- | --- |
| `Enter` | 发送消息 | 插入换行 |
| `Shift+Enter` | 插入换行 | 发送消息 |
| `Cmd/Ctrl+Enter` | 互补的 Queue／Steer 方式 | 不变 |

## 工作方式

- 仅 Client 侧插件（Host 半为空实现），把一个渲染为空元素的组件注册到
  `conversation.input.overlay` 槽位。
- 组件挂载后在该 composer 卡片上以捕获阶段监听 `keydown`：
  - `Shift+Enter` → 阻止默认行为并向编辑器重放一次普通 Enter 的 keydown，
    走官方提交管线（上传中提示、忙碌时 Queue/Steer、空草稿不发送等保护都在）。
  - `Enter` → 阻止默认行为并向编辑器重放一次 `Shift+Enter` 的 keydown，
    走编辑器自带的换行命令。
- 组合输入（IME）中、带 Alt/Ctrl/Cmd 修饰键、命令/引用菜单打开、
  输入框处于命令声明（非 plain）阶段时不会拦截，保持官方行为。

## 已知限制

DSH 内置的“快捷键”设置页与其他插件读取的是内置固定快捷键表，
`fixed.send = Enter` / `fixed.newline = Shift+Enter` 由官方包注册且不允许被替换，
因此设置页与相关提示文案仍会显示旧的按键含义，实际行为以本插件为准。

## 安装

从 GitHub 获取源码（或直接下载 [Releases](https://github.com/Heydo/dsh-enter-send-swap/releases) 里附带的 tgz）：

```bash
git clone https://github.com/Heydo/dsh-enter-send-swap.git
```

然后在 DSH 的 **设置 → 插件管理** 里选择以下任一方式：

1. **从本地目录安装（开发用，`link:` 方式）**：选择本插件源码目录（含
   `package.json` 的那一层），DSH 会读取其中的 `dsh.bundle.patch` 与
   `dsh.client` 字段。之后修改源码，刷新页面即可生效。
2. **从 tgz 安装（稳定版）**：使用 Release 附件里的
   `local-dsh-enter-send-swap-<version>.tgz`，安装后是拷贝副本，升级需重新安装。

安装完成后刷新 Web GUI 页面（Host 半的改动需重启 DSH）即可生效。
当前包名是 `@local/dsh-enter-send-swap`，`private: true`，仅用于本地安装。

## 卸载

**设置 → 插件管理** → 找到 `@local/dsh-enter-send-swap`（发送快捷键交换）→ 卸载。

## 开发与打包

- 纯 Client 侧插件：`client.js` 通过
  `window.__ModuleLoader__.load({ id: '@local/dsh-enter-send-swap', factory(require) { ... } })`
  注册组件；`index.js` 的 Host 半为空实现（仅导出 `apply()`）。
- 修改 `package.json` 的包名时，必须同步修改 `cordis.patch.yml` 中的
  `name` 与 `client.js` 里 `window.__ModuleLoader__.load({ id: ... })` 的模块 id，
  三者必须完全一致。
- 打包与校验：

  ```bash
  npm pack                            # 产物：local-dsh-enter-send-swap-<version>.tgz
  shasum -a 256 local-dsh-enter-send-swap-<version>.tgz > local-dsh-enter-send-swap-<version>.tgz.sha256
  shasum -a 256 -c local-dsh-enter-send-swap-<version>.tgz.sha256
  ```

## 许可

[MIT License](./LICENSE) © 2026 Heydo

