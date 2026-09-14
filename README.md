# dsh-stats-line-pro

仅显示输入框下方带底色的一行。插件保留会话历史计费与供应商查询，使用同一 dock 内隐藏的数据节点将结果交给核心第三块，不再渲染纯文字统计条。

- 折叠：优先单行，只显示当前对话累计成本和当前供应商的简短余额，例如“累计成本 $0.30 · R4 Coder $29.90”；窄屏换行时不增加行间空白。
- 展开：按供应商/模型汇总成本，以及本对话实际使用过的供应商余额/订阅用量；订阅窗口显示已使用百分比，名称使用供应商名称。
- 未知价格或缺失用量不按零处理，未计价次数保留在展开明细，折叠只显示已计价金额；成本为现有价格表估算，不是账单扣款。
- R4 Coder 使用已配置的 `https://api.r4.codes/v1/cli/meta` 查询套餐或钱包余量；若无有效套餐、余额或查询失败，折叠处显示“R4 Coder 暂无”。接口主机固定为 `api.r4.codes`。
- OpenCode Go 配置中的 `deepseek-flash` 会映射到价格表的 DeepSeek V4 Flash，避免请求被错误标记为未计价。
- 核心配套补丁随插件一起发布于 `scripts/patch-ui-chat-statsbar.mjs`。升级核心包后重新应用；当前本地一键恢复脚本优先调用插件内的版本。

## 数据与显示

- 保留原生统计行底色、弹窗与主题样式，不再渲染额外的纯文字统计行；
- 保留当前会话的轮数、步骤、LLM/工具耗时、首 token、吞吐、缓存命中、输入/输出 token；
- DeepSeek 官方路由显示 `/user/balance` 余额；
- OpenCode Go 路由以旧版紧凑格式显示 5 小时、7 天、1 个月窗口用量和时钟图标倒计时（如 `5h:0% 2h0m 7d:13% 2d14h`）；
- 按完整会话历史中的每个 `assistant/message` 逐请求读取实际供应商、模型、时间和 token 用量，按对应官方价目表及峰谷规则计算后累计；OpenCode Go 显示美元用量，官方 DeepSeek 路由显示人民币用量，混用时分币种汇总；
- 对没有统一余额协议的代理只显示明确的“暂无标准接口”，不猜测余额；
- API 密钥只在 DSH 主机侧解析，浏览器只收到脱敏后的余额或窗口结果；
- 当前模型取自会话 `modelSelection.next` 投影；余额明细按供应商命名，模型仅用于成本明细。

价格快照依据 [OpenCode Go 官方价目与用量说明](https://dev.opencode.ai/docs/go/) 以及 [DeepSeek 官方模型价格页](https://api-docs.deepseek.com/zh-cn/quick_start/pricing/)。官方价格变更后应同步更新 `src/format.js` 中的价格表。

## 安装

GitHub 安装：

```text
dsh plugin --profile web add github:CaptainMusX/dsh-stats-line-pro
```

本地开发安装：

```text
# 当前 DSH/pnpm 在 Windows 下对 link:E:/... 的解析可能把盘符当成相对目录。
# 先创建一个明确的本地 junction，再把 junction 加入 profile：
New-Item -ItemType Junction -Path C:\Users\CaptainMus\source\dsh-stats-line-pro-e -Target E:\dsh-stats-line-pro
dsh plugin --profile web add link:C:/Users/CaptainMus/source/dsh-stats-line-pro-e
```

不要复用已有的 `C:\Users\CaptainMus\source\dsh-stats-line-pro` 链接；它可能指向另一份旧 checkout。生产使用优先选择上面的 GitHub 安装命令。

安装后重启 DSH。它可以与 `@linxin666/dsh-live-stats` 共存：后者继续提供 `liveTokenUsage` 投影，本插件负责稳定的显示层、完整历史计费和供应商用量层。

### 配套 UI 补丁

当前 DSH 原生统计行尚未提供第三块扩展接口，需在安装目录运行：

```text
node scripts/patch-ui-chat-statsbar.mjs <dsh-client-ui-chat>/lib/client.js
```

脚本兼容原版和已有补丁，自动备份。修改只在本地应用，GitHub 安装不会自动改写核心文件。当前用户的 `~/.dsh/apply-dsh-customizations.ps1` 步骤 16 已调用此脚本。

### 可选壁纸启动兼容修复

对于 `dsh-web-all` 首次请求壁纸目录失败后只能刷新恢复的问题：

```text
node scripts/patch-wallpaper-boot.mjs <dsh-web-all>/lib/client.js
```

失败后有限次数退避重试，仅成功匹配壁纸后标记完成，卸载时取消请求、计时器和订阅。当前本地恢复脚本步骤 17 已接入；Windows PowerShell 调用恢复脚本时须保留 UTF-8 BOM。

## 会话历史读取

计费需要完整会话历史。运行时只暴露生成式 Remote `session/page`（HTTP 通道 `/api`），
请求体为 `{ type: "client-request", rpcId, method: "session/page", payload: { args: { request } } }`，
`request = { address, throughSeq, maxMessages, beforeSeq? }`：

- `throughSeq` **不能超过会话游标**（超出会返回 `gateway/bad-request: past cursor <n>`）；
- 游标本身没有独立查询接口，客户端首次调用以 `Number.MAX_SAFE_INTEGER` 探测，
  从错误信息里解析真实游标并缓存，再按 `beforeSeq` 向前翻页直到 `hasMore:false`。

早期版本使用的 `/api/session.history` RPC 在当前运行时并不存在（404），已废弃。

## 安全边界

插件只为 DeepSeek 官方、OpenCode Go 和 R4 Coder 的指定上游注册查询适配器，并拒绝把任意 `baseURL` 当作可访问目标。供应商查询失败时只返回稳定状态，不把上游响应或密钥写进浏览器。

## 开发

```text
npm install
npm run check
```

`src/format.js` 负责格式化和累计计费；`src/index.js` 提供主机查询路由；`src/client.js` 读取会话投影及历史并发布统计数据。构建产物在 `lib/`。测试覆盖 R4 数据经过 JSON 再渲染完整第三块的路径，以及壁纸首次请求失败后的自动重试。
