# dsh-stats-line-pro

一个面向 DeepSeek Harness Web 的统计条插件：

- 用独立的透明多行文字条替代易被皮肤覆盖的原生统计行；
- 保留当前会话的轮数、步骤、LLM/工具耗时、首 token、吞吐、缓存命中、输入/输出 token；
- DeepSeek 官方路由显示 `/user/balance` 余额；
- OpenCode Go 路由以旧版紧凑格式显示 5 小时、7 天、1 个月窗口用量和时钟图标倒计时（如 `5h:0% 2h0m 7d:13% 2d14h`）；
- 按完整会话历史中的每个 `assistant/message` 逐请求读取实际供应商、模型、时间和 token 用量，按对应官方价目表及峰谷规则计算后累计；OpenCode Go 显示美元用量，官方 DeepSeek 路由显示人民币用量，混用时分币种汇总；
- 对没有统一余额协议的代理只显示明确的“暂无标准接口”，不猜测余额；
- API 密钥只在 DSH 主机侧解析，浏览器只收到脱敏后的余额或窗口结果；
- 不依赖易变化的 CSS 类名，也不通过 MutationObserver 改写统计 DOM，降低皮肤和 DSH 更新造成回退的概率。

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

## 安全边界

插件只为 DeepSeek 官方和 OpenCode Go 两个固定上游注册查询适配器，并拒绝把任意 `baseURL` 当作可访问目标，避免把余额查询变成 SSRF 通道。供应商查询失败时只返回稳定状态，不把上游响应或密钥写进浏览器。

## 开发

```text
npm install
npm run check
```

`src/format.js` 是无 DOM 的格式化、官方价目和累计计费测试单元；`src/index.js` 是主机侧白名单查询路由；`src/client.js` 负责 DSH `conversation.composer.dock` 插槽、完整会话历史读取和透明多行渲染。构建产物在 `lib/`，可直接被 DSH 的插件加载器使用。
