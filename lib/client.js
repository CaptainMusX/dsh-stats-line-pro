window.__ModuleLoader__.load({
  id: "dsh-stats-line-pro",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client.js
var client_exports = {};
__export(client_exports, {
  StatsLinePro: () => StatsLinePro,
  StatsLineProDockEntry: () => StatsLineProDockEntry,
  apply: () => apply,
  inject: () => inject
});
module.exports = __toCommonJS(client_exports);
var import_react = require("react");
var import_jsx_runtime = require("react/jsx-runtime");

// src/format.js
var DEEPSEEK_PRICES = {
  peak: { cacheHit: 0.1, cacheMiss: 3, output: 9 },
  offpeak: { cacheHit: 0.05, cacheMiss: 1.5, output: 4.5 }
};
function finiteNonNegative(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : 0;
}
function textNumber(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}
function formatTokens(value) {
  const n = Math.max(0, Math.round(textNumber(value)));
  const scaled = (v) => v >= 100 ? String(Math.round(v)) : String(Math.round(v * 10) / 10);
  if (n < 1e3) return String(n);
  if (n < 1e6) return `${scaled(n / 1e3)}K`;
  return `${scaled(n / 1e6)}M`;
}
function formatDuration(value) {
  const seconds = Math.max(0, textNumber(value)) / 1e3;
  if (seconds < 60) return `${Math.round(seconds * 10) / 10}s`;
  const whole = Math.round(seconds);
  return `${Math.floor(whole / 60)}m${whole % 60}s`;
}
function billedInputTokens(usage) {
  if (usage === null || typeof usage !== "object") return 0;
  return finiteNonNegative(usage.uncachedInputTokens) + finiteNonNegative(usage.cacheReadTokens) + finiteNonNegative(usage.cacheWriteTokens);
}
function cacheHitPercent(usage) {
  const denominator = billedInputTokens(usage);
  if (denominator <= 0) return null;
  const missed = finiteNonNegative(usage.uncachedInputTokens) + finiteNonNegative(usage.cacheWriteTokens);
  if (missed <= 0) return "100";
  const percent = Math.max(0, Math.min(100, finiteNonNegative(usage.cacheReadTokens) / denominator * 100));
  if (percent < 99.95) return String(Math.round(percent));
  return "99.9";
}
function isDeepSeekProvider(provider) {
  return typeof provider === "string" && provider.includes("deepseek") && !provider.includes("opencode") && !provider.includes("packcode");
}
function isPeakHour(now) {
  const hour = (now.getUTCHours() + 8) % 24;
  return hour >= 9 && hour < 12 || hour >= 14 && hour < 18;
}
function estimateCostCny(usage, provider, now = /* @__PURE__ */ new Date()) {
  if (!isDeepSeekProvider(provider) || usage === null || typeof usage !== "object") return null;
  const prices = isPeakHour(now) ? DEEPSEEK_PRICES.peak : DEEPSEEK_PRICES.offpeak;
  const miss = (finiteNonNegative(usage.uncachedInputTokens) + finiteNonNegative(usage.cacheWriteTokens)) / 1e6 * prices.cacheMiss;
  const hit = finiteNonNegative(usage.cacheReadTokens) / 1e6 * prices.cacheHit;
  const output = finiteNonNegative(usage.outputTokens) / 1e6 * prices.output;
  const total = miss + hit + output;
  return total > 0 ? total : null;
}
function deriveStats(nodes = []) {
  const turns = /* @__PURE__ */ new Set();
  const steps = /* @__PURE__ */ new Set();
  let llmMs = 0;
  let toolMs = 0;
  let ttftMs = 0;
  let ttftSteps = 0;
  let decodeMs = 0;
  let decodeTokens = 0;
  for (const node of Array.isArray(nodes) ? nodes : []) {
    if (node?.kind === "assistant") {
      if (Number.isInteger(node.turn)) turns.add(node.turn);
      if (Number.isInteger(node.turn) && Number.isInteger(node.step)) steps.add(`${node.turn}/${node.step}`);
      const timing = node.timing;
      if (timing && Number.isFinite(timing.stepStartTime) && Number.isFinite(timing.completedTime)) {
        llmMs += Math.max(0, timing.completedTime - timing.stepStartTime);
      }
      if (timing && Number.isFinite(timing.stepStartTime) && Number.isFinite(timing.firstTokenTime)) {
        ttftMs += Math.max(0, timing.firstTokenTime - timing.stepStartTime);
        ttftSteps += 1;
        const outputTokens = finiteNonNegative(node.usage?.outputTokens);
        if (outputTokens > 0 && Number.isFinite(timing.completedTime)) {
          decodeMs += Math.max(0, timing.completedTime - timing.firstTokenTime);
          decodeTokens += outputTokens;
        }
      }
    } else if (node?.kind === "tool-result" && Number.isFinite(node.callTime) && Number.isFinite(node.time)) {
      toolMs += Math.max(0, node.time - node.callTime);
    }
  }
  return { turns: turns.size, steps: steps.size, llmMs, toolMs, ttftMs, ttftSteps, decodeMs, decodeTokens };
}
function latestProviderOf(nodes = []) {
  for (let index = Array.isArray(nodes) ? nodes.length - 1 : -1; index >= 0; index -= 1) {
    const node = nodes[index];
    if (node?.kind !== "assistant") continue;
    const provider = node.provenance?.provider ?? node.requestConfig?.provider;
    const model = node.provenance?.model ?? node.requestConfig?.model;
    if (typeof provider === "string" && provider.length > 0) return { provider, model: typeof model === "string" ? model : "" };
  }
  return null;
}
function providerLabel(provider) {
  if (typeof provider !== "string" || provider.length === 0) return "\u5F53\u524D\u4F9B\u5E94\u5546";
  if (provider.includes("opencode-go")) return "OpenCode Go";
  if (provider.includes("packcode")) return "PackCode DS";
  if (provider.includes("deepseek")) return "DeepSeek";
  return provider;
}
function formatMoney(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value ?? "");
  return n.toFixed(2).replace(/\.?(0+)$/, "");
}
function formatCountdown(iso, now) {
  const remaining = new Date(iso).getTime() - now;
  if (!Number.isFinite(remaining) || remaining <= 0) return "0m";
  const totalMinutes = Math.floor(remaining / 6e4);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor(totalMinutes % 1440 / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}d${hours}h`;
  if (hours > 0) return `${hours}h${minutes}m`;
  return `${minutes}m`;
}
function formatProviderUsage(provider, payload, now = Date.now()) {
  const label = providerLabel(provider);
  if (payload === null || payload === void 0 || payload.status === "loading") return `${label}\uFF1A\u6B63\u5728\u8BFB\u53D6\u7528\u91CF\u2026`;
  if (payload.ok !== true) {
    if (payload.status === "unconfigured") return `${label}\uFF1A\u672A\u914D\u7F6E API \u5BC6\u94A5`;
    if (payload.status === "unsupported") return `${label}\uFF1A\u6682\u65E0\u6807\u51C6\u4F59\u989D/\u8BA2\u9605\u63A5\u53E3`;
    return `${label}\uFF1A\u7528\u91CF\u8BFB\u53D6\u5931\u8D25\uFF0C\u7A0D\u540E\u91CD\u8BD5`;
  }
  if (payload.kind === "subscription") {
    const order = ["5h", "7d", "1m"];
    const windows = order.map((key) => {
      const value = payload.windows?.[key];
      if (!value || value.status !== "ok") return null;
      const percent = Number.isFinite(value.percent) ? value.percent : "?";
      return `${key} ${percent}% \xB7 \u91CD\u7F6E ${formatCountdown(value.resetsAt, now)}`;
    }).filter(Boolean);
    return windows.length > 0 ? `${label}\u7528\u91CF\uFF1A${windows.join(" | ")}` : `${label}\uFF1A\u6682\u65E0\u7A97\u53E3\u7528\u91CF`;
  }
  if (payload.kind === "balance") {
    const balances = (Array.isArray(payload.balances) ? payload.balances : []).map((balance) => {
      const currency = typeof balance.currency === "string" && balance.currency.length > 0 ? balance.currency : "CNY";
      return `${currency} ${formatMoney(balance.totalBalance)}`;
    }).filter(Boolean);
    const suffix = payload.available === false ? "\uFF08\u5F53\u524D\u4E0D\u53EF\u7528\uFF09" : "";
    return balances.length > 0 ? `${label}\u4F59\u989D\uFF1A${balances.join(" \xB7 ")}${suffix}` : `${label}\uFF1A\u672A\u8FD4\u56DE\u4F59\u989D`;
  }
  return `${label}\uFF1A\u6682\u65E0\u53EF\u663E\u793A\u7684\u7528\u91CF`;
}
function formatConversationLines(statsInput, usageInput, liveUsageInput, provider, model, now = /* @__PURE__ */ new Date()) {
  const stats = statsInput ?? deriveStats([]);
  const liveUsage = liveUsageInput ?? null;
  const usage = usageInput ?? liveUsage;
  const lines = [];
  const steps = finiteNonNegative(stats.steps);
  if (steps > 0) {
    const counts = `${finiteNonNegative(stats.turns)} \u8F6E \xB7 ${steps} \u6B65`;
    const durations = [];
    if (finiteNonNegative(stats.llmMs) > 0) durations.push(`LLM ${formatDuration(stats.llmMs)}`);
    if (finiteNonNegative(stats.toolMs) > 0) durations.push(`\u5DE5\u5177\u8C03\u7528 ${formatDuration(stats.toolMs)}`);
    lines.push([counts, durations.join(" \xB7 ")].filter(Boolean).join(" | "));
    const speeds = [];
    if (finiteNonNegative(stats.ttftSteps) > 0) speeds.push(`\u9996 token \u5E73\u5747 ${formatDuration(stats.ttftMs / stats.ttftSteps)}`);
    const tokensPerSecond = liveUsage?.tokensPerSecond ?? (stats.decodeMs > 0 ? stats.decodeTokens / (stats.decodeMs / 1e3) : 0);
    if (finiteNonNegative(tokensPerSecond) > 0) speeds.push(`${Math.round(tokensPerSecond * 10) / 10} tok/s`);
    if (speeds.length > 0) lines.push(speeds.join(" \xB7 "));
  }
  if (usage !== null && typeof usage === "object") {
    const inputTokens = billedInputTokens(usage);
    const outputTokens = finiteNonNegative(usage.outputTokens);
    if (inputTokens > 0 || outputTokens > 0) {
      const cache = cacheHitPercent(usage);
      const parts = [];
      if (cache !== null) parts.push(`\u7F13\u5B58\u547D\u4E2D ${cache}%`);
      parts.push(`\u8F93\u5165 ${formatTokens(inputTokens)} tok \xB7 \u8F93\u51FA ${formatTokens(outputTokens)} tok`);
      const cost = estimateCostCny(usage, provider, now);
      if (cost !== null) parts.push(`\u4F30\u7B97\u82B1\u8D39 \xA5${cost.toFixed(2)}`);
      lines.push(parts.join(" | "));
    }
  }
  return lines;
}

// src/client.js
var STYLE_ID = "dsh-stats-line-pro/styles";
var EMPTY_MODEL_DIRECTORY = {
  getSnapshot: () => null,
  subscribe: () => () => {
  }
};
var CSS = `
/* The shipped skin applies an accessory card to every direct dock child. */
/* dsh-live-stats >= 0.1.20 keeps its live TPS seat for projection support;
   this plugin renders that value in its own multiline row. */
div[data-slot="conversation.composer.dock"] > [data-dsh-live-tps] {
  display: none !important;
}

div[data-slot="conversation.composer.dock"]:has(> [data-dsh-live-tps]) {
  display: contents !important;
}

html[data-dsh-skin] [data-slot="conversation.composer.dock"] > [data-stats-line],
html[data-dsh-custom-theme]:not([data-dsh-skin]) [data-slot="conversation.composer.dock"] > [data-stats-line],
html[data-dsh-wallpaper-active] [data-slot="conversation.composer.dock"] > [data-stats-line] {
  display: none !important;
}

[data-stats-line-pro] {
  box-sizing: border-box;
  width: 100%;
  max-width: var(--dsh-chat-content-width, 748px);
  margin: 4px auto !important;
  padding: 0 !important;
  color: var(--dsw-alias-label-tertiary);
  background: transparent !important;
  border: 0 !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  backdrop-filter: none !important;
  text-align: center;
  font-size: 12px;
  line-height: 20px;
  white-space: normal !important;
  overflow: visible !important;
}

html[data-dsh-skin] [data-slot="conversation.composer.dock"] > [data-stats-line-pro],
html[data-dsh-custom-theme]:not([data-dsh-skin]) [data-slot="conversation.composer.dock"] > [data-stats-line-pro],
html[data-dsh-wallpaper-active] [data-slot="conversation.composer.dock"] > [data-stats-line-pro] {
  --dsh-composer-accessory-bg: transparent;
  --dsh-composer-accessory-shadow: none;
  --dsh-composer-accessory-border: none;
  --dsh-composer-accessory-radius: 0;
  --dsh-composer-accessory-blur: 0;
  background: transparent !important;
  border: 0 !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  backdrop-filter: none !important;
  display: block !important;
  width: 100% !important;
  max-width: var(--dsh-chat-content-width, 748px) !important;
  margin: 4px auto !important;
  white-space: normal !important;
}

[data-stats-line-pro-row] {
  display: block;
  max-width: 100%;
  overflow-wrap: anywhere;
  word-break: break-word;
}

[data-stats-line-pro-row="provider"] {
  color: var(--dsw-alias-label-secondary);
}
`;
function installStyles() {
  if (typeof document === "undefined" || document.querySelector(`style[data-plugin-css="${STYLE_ID}"]`) !== null) return;
  const style = document.createElement("style");
  style.dataset.plugin = "dsh-stats-line-pro";
  style.dataset.pluginCss = STYLE_ID;
  style.textContent = CSS;
  document.head.appendChild(style);
}
async function fetchProviderUsage(provider, signal) {
  const response = await fetch(`/stats-line-pro/provider-usage?provider=${encodeURIComponent(provider)}`, {
    cache: "no-store",
    signal
  });
  if (!response.ok) throw new Error(`usage-http-${response.status}`);
  return response.json();
}
var StatsLinePro = (0, import_react.memo)(function StatsLinePro2({ useSession, useProjection, sessionId, modelDirectory }) {
  const nodes = useSession((snapshot) => snapshot.chat.legacy.nodes);
  const sessionStats = useProjection("sessionStats");
  const tokenUsage = useProjection("tokenUsage");
  const liveTokenUsage = useProjection("liveTokenUsage");
  const directory = modelDirectory ?? EMPTY_MODEL_DIRECTORY;
  const modelState = (0, import_react.useSyncExternalStore)(
    (listener) => directory.subscribe(listener),
    () => directory.getSnapshot(),
    () => directory.getSnapshot()
  );
  const identity = (0, import_react.useMemo)(() => {
    const selected = modelState?.current;
    if (selected?.provider && selected?.model) return { provider: selected.provider, model: selected.model };
    return latestProviderOf(nodes);
  }, [modelState, nodes]);
  const provider = identity?.provider ?? "";
  const [providerResult, setProviderResult] = (0, import_react.useState)(null);
  const [now, setNow] = (0, import_react.useState)(() => Date.now());
  (0, import_react.useEffect)(() => {
    const timer = setInterval(() => setNow(Date.now()), 6e4);
    return () => clearInterval(timer);
  }, []);
  (0, import_react.useEffect)(() => {
    if (!provider) {
      setProviderResult(null);
      return void 0;
    }
    let alive = true;
    let timer;
    const controller = new AbortController();
    const refresh = async () => {
      if (alive) setProviderResult({ status: "loading" });
      try {
        const value = await fetchProviderUsage(provider, controller.signal);
        if (alive) setProviderResult(value);
      } catch {
        if (alive) setProviderResult({ ok: false, status: "error", provider });
      }
    };
    void refresh();
    timer = setInterval(() => void refresh(), 6e4);
    return () => {
      alive = false;
      controller.abort();
      clearInterval(timer);
    };
  }, [provider, sessionId]);
  const lines = (0, import_react.useMemo)(() => formatConversationLines(
    sessionStats ?? deriveStats(nodes),
    tokenUsage,
    liveTokenUsage,
    provider,
    identity?.model ?? ""
  ), [identity?.model, liveTokenUsage, nodes, provider, sessionStats, tokenUsage]);
  const providerLine = provider.length > 0 ? formatProviderUsage(provider, providerResult ?? { status: "loading" }, now) : null;
  if (lines.length === 0 && providerLine === null) return null;
  const children = lines.map((line, index) => (0, import_jsx_runtime.jsx)("div", {
    "data-stats-line-pro-row": "conversation",
    children: line,
    key: `conversation-${index}`
  }));
  if (providerLine !== null) children.push((0, import_jsx_runtime.jsx)("div", {
    "data-stats-line-pro-row": "provider",
    "data-provider": provider,
    children: providerLine,
    key: "provider"
  }));
  return (0, import_jsx_runtime.jsx)("div", {
    "aria-label": "\u4F1A\u8BDD\u7EDF\u8BA1",
    "data-stats-line-pro": "",
    children
  });
});
var StatsLineProDockEntry = (0, import_react.memo)((props) => (0, import_jsx_runtime.jsx)(StatsLinePro, {
  modelDirectory: props.modelDirectory,
  sessionId: props.sessionId,
  useProjection: props.useProjection,
  useSession: props.useSession
}));
var inject = ["slots", "modelDirectories"];
function apply(ctx) {
  installStyles();
  ctx.inject(["slots", "modelDirectories"], (scope) => {
    scope.slots.inject("conversation.composer.dock", () => scope.slots.register({
      name: "conversation.composer.dock",
      id: "stats-line-pro",
      order: 200,
      inject: (sessionId) => ({
        modelDirectory: sessionId === void 0 ? void 0 : scope.modelDirectories.directoryFor(sessionId).store
      })
    }, StatsLineProDockEntry));
  });
}

    return module.exports;
  }
});
