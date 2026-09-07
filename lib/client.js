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
var DEEPSEEK_PRICING_EFFECTIVE_AT = Date.UTC(2026, 7, 16, 16);
var OPENCODE_GO_PRICING_EFFECTIVE_AT = Date.UTC(2026, 7, 16, 16);
function rates(input, output, cacheRead, cacheWrite = 0) {
  return { input, output, cacheRead, cacheWrite };
}
var DEEPSEEK_FLASH_PRICES = {
  currency: "CNY",
  legacy: rates(1, 2, 0.02, 1),
  peak: rates(3, 9, 0.1, 3),
  offpeak: rates(1.5, 4.5, 0.05, 1.5)
};
var DEEPSEEK_PRO_PRICES = {
  currency: "CNY",
  legacy: rates(3, 6, 0.025, 3),
  peak: rates(9, 27, 0.3, 9),
  offpeak: rates(4.5, 13.5, 0.15, 4.5)
};
var DEEPSEEK_MODEL_PRICES = {
  "deepseek-v4-flash": DEEPSEEK_FLASH_PRICES,
  "deepseek-v4-flash-vision-exp": DEEPSEEK_FLASH_PRICES,
  "deepseek-v4-pro": DEEPSEEK_PRO_PRICES
};
var OPENCODE_GO_FLASH_PRICES = {
  currency: "USD",
  legacy: rates(0.14, 0.28, 28e-4),
  peak: rates(0.44, 1.32, 0.014),
  offpeak: rates(0.22, 0.66, 7e-3)
};
var OPENCODE_GO_PRO_PRICES = {
  currency: "USD",
  legacy: rates(0.435, 0.87, 3625e-6),
  peak: rates(1.32, 3.96, 0.044),
  offpeak: rates(0.66, 1.98, 0.022)
};
function openCodeGoPrice(input, output, cacheRead, cacheWrite = 0) {
  return { currency: "USD", rates: rates(input, output, cacheRead, cacheWrite) };
}
function openCodeGoTieredPrice(tiers) {
  return { currency: "USD", tiers };
}
var OPENCODE_GO_MODEL_PRICES = {
  "deepseek-v4-flash": OPENCODE_GO_FLASH_PRICES,
  "deepseek-v4-flash-vision-exp": OPENCODE_GO_FLASH_PRICES,
  "deepseek-v4-pro": OPENCODE_GO_PRO_PRICES,
  "glm-5.3-flash": openCodeGoPrice(0.15, 0.5, 0.03),
  "glm-5.3": openCodeGoPrice(1.4, 4.4, 0.26),
  "glm-5.2": openCodeGoPrice(1.4, 4.4, 0.26),
  "glm-5.1": openCodeGoPrice(1.4, 4.4, 0.26),
  "kimi-k3": openCodeGoPrice(3, 15, 0.3),
  "kimi-k2.7-code": openCodeGoPrice(0.95, 4, 0.19),
  "kimi-k2.6": openCodeGoPrice(0.95, 4, 0.16),
  "longcat-2.0": openCodeGoPrice(0.3, 1.2, 6e-3),
  "mimo-v2.5": openCodeGoPrice(0.14, 0.28, 28e-4),
  "mimo-v2.5-pro": openCodeGoPrice(0.435, 0.87, 3625e-6),
  "minimax-m3": openCodeGoPrice(0.3, 1.2, 0.06),
  "minimax-m2.7": openCodeGoPrice(0.3, 1.2, 0.06, 0.375),
  "minimax-m2.5": openCodeGoPrice(0.3, 1.2, 0.06, 0.375),
  "muse-spark-1.2-contributor": openCodeGoPrice(0.1, 0.2, 2e-3),
  "qwen3.8-max": openCodeGoPrice(2, 6, 0.25, 2.5),
  "qwen3.8-flash": openCodeGoPrice(0.15, 0.47, 0.016, 0.2),
  "qwen3.7-max": openCodeGoPrice(2.5, 7.5, 0.5, 3.125),
  "qwen3.7-plus": openCodeGoTieredPrice([
    { maxContextTokens: 256e3, rates: rates(0.4, 1.6, 0.04, 0.5) },
    { rates: rates(1.2, 4.8, 0.12, 1.5) }
  ]),
  "qwen3.6-plus": openCodeGoTieredPrice([
    { maxContextTokens: 256e3, rates: rates(0.5, 3, 0.05, 0.625) },
    { rates: rates(2, 6, 0.2, 2.5) }
  ]),
  "hy3": openCodeGoPrice(0.14, 0.58, 0.035),
  "grok-4.6": openCodeGoTieredPrice([
    { maxContextTokens: 2e5, rates: rates(2, 6, 0.5) },
    { rates: rates(4, 12, 1) }
  ]),
  "gpt-5.6-luna": openCodeGoTieredPrice([
    { maxContextTokens: 272e3, rates: rates(0.2, 1.2, 0.02, 0.25) },
    { rates: rates(0.4, 1.8, 0.04, 0.5) }
  ]),
  "big-pickle": openCodeGoPrice(0, 0, 0),
  "mimo-v2.5-free": openCodeGoPrice(0, 0, 0),
  "hy3-free": openCodeGoPrice(0, 0, 0),
  "nemotron-3-ultra-free": openCodeGoPrice(0, 0, 0),
  "nemotron-3.5-lightning-free": openCodeGoPrice(0, 0, 0),
  "muse-spark-1.2-contributor-free": openCodeGoPrice(0, 0, 0)
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
function asDate(value) {
  if (value instanceof Date) return value;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : /* @__PURE__ */ new Date(0);
}
function isDeepSeekPeakHour(now) {
  const hour = (asDate(now).getUTCHours() + 8) % 24;
  return hour >= 9 && hour < 12 || hour >= 14 && hour < 18;
}
function isOpenCodeGoProvider(provider) {
  return typeof provider === "string" && (provider === "opencode-go" || provider.startsWith("opencode-go-"));
}
function isOpenCodeGoPeakHour(now) {
  const date = asDate(now);
  const weekday = date.getUTCDay();
  if (weekday === 0 || weekday === 6) return false;
  const minutes = date.getUTCHours() * 60 + date.getUTCMinutes();
  return minutes >= 60 && minutes < 240 || minutes >= 360 && minutes < 600;
}
function normalizedModelId(model) {
  const raw = typeof model === "string" ? model.trim().toLowerCase() : "";
  const id = raw.includes("/") ? raw.slice(raw.lastIndexOf("/") + 1) : raw;
  if (id === "deepseek-chat" || id === "deepseek-reasoner") return "deepseek-v4-flash";
  return id;
}
function billingUsage(usage) {
  if (usage === null || typeof usage !== "object" || Array.isArray(usage)) return null;
  const knownKeys = [
    "inputTokens",
    "uncachedInputTokens",
    "promptTokens",
    "outputTokens",
    "cacheReadTokens",
    "cacheRead",
    "cacheWriteTokens",
    "cacheWrite"
  ];
  if (!knownKeys.some((key) => Object.hasOwn(usage, key))) return null;
  const firstNumber = (...values) => values.find((value) => typeof value === "number" && Number.isFinite(value)) ?? 0;
  return {
    uncachedInputTokens: Math.max(0, firstNumber(usage.uncachedInputTokens, usage.inputTokens, usage.promptTokens)),
    outputTokens: Math.max(0, firstNumber(usage.outputTokens)),
    cacheReadTokens: Math.max(0, firstNumber(usage.cacheReadTokens, usage.cacheRead)),
    cacheWriteTokens: Math.max(0, firstNumber(usage.cacheWriteTokens, usage.cacheWrite))
  };
}
function selectRates(entry, at, usage, peakPredicate, effectiveAt) {
  if (Array.isArray(entry.tiers)) {
    const contextTokens = billedInputTokens(usage);
    return entry.tiers.find((tier) => tier.maxContextTokens === void 0 || contextTokens <= tier.maxContextTokens)?.rates ?? entry.tiers.at(-1).rates;
  }
  if (entry.peak !== void 0 && entry.offpeak !== void 0) {
    if (entry.legacy !== void 0 && at.getTime() < effectiveAt) return { ...entry.legacy, mode: "legacy" };
    return { ...peakPredicate(at) ? entry.peak : entry.offpeak, mode: peakPredicate(at) ? "peak" : "offpeak" };
  }
  return { ...entry.rates, mode: "standard" };
}
function pricingFor(provider, model, at = /* @__PURE__ */ new Date(), usage = null) {
  const modelId = normalizedModelId(model);
  const date = asDate(at);
  if (isOpenCodeGoProvider(provider)) {
    const entry = OPENCODE_GO_MODEL_PRICES[modelId];
    if (entry === void 0) return null;
    return {
      provider,
      model: modelId,
      currency: entry.currency,
      ...selectRates(entry, date, usage ?? {}, isOpenCodeGoPeakHour, OPENCODE_GO_PRICING_EFFECTIVE_AT)
    };
  }
  if (isDeepSeekProvider(provider)) {
    const entry = DEEPSEEK_MODEL_PRICES[modelId];
    if (entry === void 0) return null;
    return {
      provider,
      model: modelId,
      currency: entry.currency,
      ...selectRates(entry, date, usage ?? {}, isDeepSeekPeakHour, DEEPSEEK_PRICING_EFFECTIVE_AT)
    };
  }
  return null;
}
function estimateModelCost(usage, provider, model, at = /* @__PURE__ */ new Date()) {
  const normalized = billingUsage(usage);
  if (normalized === null) return null;
  const pricing = pricingFor(provider, model, at, normalized);
  if (pricing === null) return null;
  const amount = normalized.uncachedInputTokens / 1e6 * pricing.input + normalized.cacheReadTokens / 1e6 * pricing.cacheRead + normalized.cacheWriteTokens / 1e6 * pricing.cacheWrite + normalized.outputTokens / 1e6 * pricing.output;
  return {
    amount,
    currency: pricing.currency,
    mode: pricing.mode,
    provider: pricing.provider,
    model: pricing.model
  };
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
function identityFromEvent(event, context, fallback) {
  const source = event?.data?.message?.source;
  const candidates = [
    { provider: source?.provider, model: source?.model },
    { provider: event?.data?.provider, model: event?.data?.model },
    context,
    fallback
  ];
  for (const candidate of candidates) {
    const provider = typeof candidate?.provider === "string" && candidate.provider.length > 0 ? candidate.provider : "";
    const model = typeof candidate?.model === "string" && candidate.model.length > 0 ? candidate.model : "";
    if (provider && model) return { provider, model };
  }
  return null;
}
function stepKey(data) {
  return Number.isInteger(data?.turn) && Number.isInteger(data?.step) ? `${data.turn}:${data.step}` : null;
}
function eventDate(value, fallback) {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : fallback;
}
function calculateConversationCost(events = [], now = Date.now(), fallbackIdentity = null) {
  const referenceDate = eventDate(now, /* @__PURE__ */ new Date());
  const ordered = (Array.isArray(events) ? events : []).filter((event) => event !== null && typeof event === "object").slice().sort((left, right) => (left.seq ?? 0) - (right.seq ?? 0));
  const stepStarts = /* @__PURE__ */ new Map();
  const pending = /* @__PURE__ */ new Map();
  const totals = /* @__PURE__ */ new Map();
  const entries = [];
  let context = null;
  let pricedRequests = 0;
  let unpricedRequests = 0;
  let missingUsageRequests = 0;
  const addSample = (sample) => {
    const normalized = billingUsage(sample.usage);
    if (normalized === null) {
      missingUsageRequests += 1;
      return;
    }
    const identity = sample.identity ?? identityFromEvent(sample.event, context, fallbackIdentity);
    const cost = estimateModelCost(normalized, identity?.provider, identity?.model, sample.at);
    if (cost === null) {
      unpricedRequests += 1;
      return;
    }
    pricedRequests += 1;
    totals.set(cost.currency, (totals.get(cost.currency) ?? 0) + cost.amount);
    entries.push({
      seq: sample.event?.seq,
      turn: sample.event?.data?.turn,
      step: sample.event?.data?.step,
      at: sample.at.getTime(),
      provider: cost.provider,
      model: cost.model,
      currency: cost.currency,
      amount: cost.amount,
      mode: cost.mode
    });
  };
  const flushPending = (key) => {
    const sample = pending.get(key);
    if (sample === void 0) return;
    pending.delete(key);
    addSample(sample);
  };
  for (const event of ordered) {
    if (event.type === "request/context") {
      const provider = event.data?.provider;
      const model = event.data?.model;
      if (typeof provider === "string" && typeof model === "string" && provider && model) context = { provider, model };
      continue;
    }
    if (event.type === "step/start") {
      const key = stepKey(event.data);
      if (key !== null) stepStarts.set(key, eventDate(event.time, referenceDate));
      continue;
    }
    if (event.type === "assistant/chunk" && event.data?.chunk?.type === "usage") {
      const key = stepKey(event.data);
      if (key !== null) pending.set(key, {
        event,
        usage: event.data.chunk.usage,
        identity: identityFromEvent(event, context, fallbackIdentity),
        at: stepStarts.get(key) ?? eventDate(event.time, referenceDate)
      });
      continue;
    }
    if (event.type === "assistant/message") {
      const key = stepKey(event.data);
      const sample = key === null ? void 0 : pending.get(key);
      if (key !== null) pending.delete(key);
      const usage = event.data?.usage ?? sample?.usage;
      if (usage === void 0) {
        missingUsageRequests += 1;
        continue;
      }
      addSample({
        event,
        usage,
        identity: identityFromEvent(event, sample?.identity ?? context, fallbackIdentity),
        at: stepStarts.get(key) ?? sample?.at ?? eventDate(event.time, referenceDate)
      });
      continue;
    }
    if (event.type === "llm/retry" || event.type === "step/end") {
      const key = stepKey(event.data);
      if (key !== null) flushPending(key);
    }
  }
  for (const key of pending.keys()) flushPending(key);
  return {
    totals: [...totals.entries()].map(([currency, amount]) => ({ currency, amount })),
    entries,
    pricedRequests,
    unpricedRequests,
    missingUsageRequests,
    complete: unpricedRequests === 0 && missingUsageRequests === 0
  };
}
function currencyPrefix(currency) {
  if (currency === "USD") return "$";
  if (currency === "CNY") return "\xA5";
  return `${currency ?? ""} `;
}
function formatCostSummary(cost) {
  if (cost === null || typeof cost !== "object") return null;
  const totals = Array.isArray(cost.totals) ? cost.totals.filter((item) => item && typeof item.amount === "number" && Number.isFinite(item.amount)) : Number.isFinite(cost.amount) ? [{ currency: cost.currency, amount: cost.amount }] : [];
  const missing = Math.max(0, Number(cost.unpricedRequests) || 0) + Math.max(0, Number(cost.missingUsageRequests) || 0);
  if (totals.length === 0) return missing > 0 ? `\u82B1\u8D39\uFF1A${missing} \u6B21\u8BF7\u6C42\u672A\u8BA1\u4EF7` : null;
  const rendered = totals.map((item) => `${currencyPrefix(item.currency)}${item.amount.toFixed(2)}`).join(" + ");
  return `\u82B1\u8D39 ${rendered}${missing > 0 ? `\uFF08${missing} \u6B21\u672A\u8BA1\u4EF7\uFF09` : ""}`;
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
function subscriptionWindowsOf(payload, now) {
  const order = ["5h", "7d", "1m"];
  return order.map((label) => {
    const value = payload.windows?.[label];
    if (!value || value.status !== "ok") return null;
    return {
      label,
      percent: Number.isFinite(value.percent) ? value.percent : "?",
      countdown: formatCountdown(value.resetsAt, now)
    };
  }).filter(Boolean);
}
function providerUsageView(provider, payload, now = Date.now()) {
  const label = providerLabel(provider);
  if (payload === null || payload === void 0 || payload.status === "loading") {
    return { kind: "text", label, text: `${label}\uFF1A\u6B63\u5728\u8BFB\u53D6\u7528\u91CF\u2026` };
  }
  if (payload.ok !== true) {
    if (payload.status === "unconfigured") return { kind: "text", label, text: `${label}\uFF1A\u672A\u914D\u7F6E API \u5BC6\u94A5` };
    if (payload.status === "unsupported") return { kind: "text", label, text: `${label}\uFF1A\u6682\u65E0\u6807\u51C6\u4F59\u989D/\u8BA2\u9605\u63A5\u53E3` };
    return { kind: "text", label, text: `${label}\uFF1A\u7528\u91CF\u8BFB\u53D6\u5931\u8D25\uFF0C\u7A0D\u540E\u91CD\u8BD5` };
  }
  if (payload.kind === "subscription") {
    const windows = subscriptionWindowsOf(payload, now);
    return windows.length > 0 ? { kind: "subscription", label, windows } : { kind: "text", label, text: `${label}\uFF1A\u6682\u65E0\u7A97\u53E3\u7528\u91CF` };
  }
  if (payload.kind === "balance") {
    const balances = (Array.isArray(payload.balances) ? payload.balances : []).map((balance) => {
      const currency = typeof balance.currency === "string" && balance.currency.length > 0 ? balance.currency : "CNY";
      return `${currency} ${formatMoney(balance.totalBalance)}`;
    }).filter(Boolean);
    const suffix = payload.available === false ? "\uFF08\u5F53\u524D\u4E0D\u53EF\u7528\uFF09" : "";
    return balances.length > 0 ? { kind: "text", label, text: `${label}\u4F59\u989D\uFF1A${balances.join(" \xB7 ")}${suffix}` } : { kind: "text", label, text: `${label}\uFF1A\u672A\u8FD4\u56DE\u4F59\u989D` };
  }
  return { kind: "text", label, text: `${label}\uFF1A\u6682\u65E0\u53EF\u663E\u793A\u7684\u7528\u91CF` };
}
function formatConversationLines(statsInput, usageInput, liveUsageInput, provider, model, now = /* @__PURE__ */ new Date(), costOverride) {
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
      const cost = costOverride === void 0 ? estimateModelCost(usage, provider, model, now) : costOverride;
      const costText = formatCostSummary(cost);
      if (costText !== null) parts.push(costText);
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
  --dsh-stats-line-pro-color: #000;
  color: var(--dsh-stats-line-pro-color) !important;
  background: transparent !important;
  border: 0 !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  backdrop-filter: none !important;
  text-align: center;
  font-size: 12px;
  font-weight: 500;
  line-height: 20px;
  white-space: normal !important;
  overflow: visible !important;
  text-shadow: none !important;
}

html[data-dsh-skin] [data-slot="conversation.composer.dock"] > [data-stats-line-pro],
html[data-dsh-custom-theme]:not([data-dsh-skin]) [data-slot="conversation.composer.dock"] > [data-stats-line-pro],
html[data-dsh-wallpaper-active] [data-slot="conversation.composer.dock"] > [data-stats-line-pro] {
  --dsh-composer-accessory-bg: transparent;
  --dsh-composer-accessory-shadow: none;
  --dsh-composer-accessory-border: none;
  --dsh-composer-accessory-radius: 0;
  --dsh-composer-accessory-blur: 0;
  color: var(--dsh-stats-line-pro-color, #000) !important;
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

/* dsh-better-sidebar colors every active dock child with a higher-specificity
   rule; keep this plugin's theme-aware text color after that rule. */
html[data-dsh-skin] [data-phase="active"] [data-slot="conversation.composer.dock"] > [data-stats-line-pro],
html[data-dsh-custom-theme]:not([data-dsh-skin]) [data-phase="active"] [data-slot="conversation.composer.dock"] > [data-stats-line-pro],
html[data-dsh-wallpaper-active] [data-phase="active"] [data-slot="conversation.composer.dock"] > [data-stats-line-pro] {
  color: var(--dsh-stats-line-pro-color, #000) !important;
  background: transparent !important;
  border: 0 !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  backdrop-filter: none !important;
  text-shadow: none !important;
}

[data-stats-line-pro-row] {
  display: inline;
  max-width: 100%;
  overflow-wrap: anywhere;
  word-break: break-word;
}

[data-stats-line-pro-separator] {
  display: inline;
  color: var(--dsh-stats-line-pro-color, #000) !important;
  margin: 0 8px;
  white-space: pre;
}

[data-stats-line-pro-row="provider"] {
  color: var(--dsh-stats-line-pro-color, #000) !important;
  font-weight: inherit;
}

[data-stats-line-pro-provider-separator] {
  display: inline;
  color: var(--dsh-stats-line-pro-color, #000) !important;
  white-space: pre;
}

[data-stats-line-pro-clock] {
  display: inline-block;
  width: 11px;
  height: 11px;
  margin: 0;
  color: var(--dsh-stats-line-pro-color, #000) !important;
  vertical-align: -1px;
}

body[data-ds-dark-theme] [data-stats-line-pro],
html[data-theme="dark"] [data-stats-line-pro],
html[data-ds-theme="dark"] [data-stats-line-pro],
html.dark [data-stats-line-pro] {
  --dsh-stats-line-pro-color: var(--dsw-alias-label-primary, #fff) !important;
  color: var(--dsh-stats-line-pro-color, #fff) !important;
  text-shadow: none !important;
}

body[data-ds-dark-theme] [data-stats-line-pro-separator],
html[data-theme="dark"] [data-stats-line-pro-separator],
html[data-ds-theme="dark"] [data-stats-line-pro-separator],
html.dark [data-stats-line-pro-separator] {
  color: var(--dsh-stats-line-pro-color, #fff) !important;
}

@media (prefers-color-scheme: dark) {
  html:not([data-theme="light"]):not([data-ds-theme="light"]) [data-stats-line-pro] {
    --dsh-stats-line-pro-color: var(--dsw-alias-label-primary, #fff) !important;
    color: var(--dsh-stats-line-pro-color, #fff) !important;
    text-shadow: none !important;
  }
  html:not([data-theme="light"]):not([data-ds-theme="light"]) [data-stats-line-pro-row="provider"] {
    color: var(--dsh-stats-line-pro-color, #fff) !important;
  }
  html:not([data-theme="light"]):not([data-ds-theme="light"]) [data-stats-line-pro-separator] {
    color: var(--dsh-stats-line-pro-color, #fff) !important;
  }
  html:not([data-theme="light"]):not([data-ds-theme="light"]) [data-stats-line-pro-provider-separator],
  html:not([data-theme="light"]):not([data-ds-theme="light"]) [data-stats-line-pro-clock] {
    color: var(--dsh-stats-line-pro-color, #fff) !important;
  }
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
function ClockIcon() {
  return (0, import_jsx_runtime.jsxs)("svg", {
    "aria-hidden": true,
    "data-stats-line-pro-clock": "",
    focusable: "false",
    viewBox: "0 0 16 16",
    width: 11,
    height: 11,
    children: [
      (0, import_jsx_runtime.jsx)("circle", {
        cx: 8,
        cy: 8,
        r: 6.2,
        fill: "none",
        stroke: "currentColor",
        strokeWidth: 1.6,
        key: "circle"
      }),
      (0, import_jsx_runtime.jsx)("path", {
        d: "M8 4.8V8l2.6 1.6",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: 1.6,
        strokeLinecap: "round",
        key: "hands"
      })
    ]
  });
}
function ProviderUsageContent({ view }) {
  if (view.kind !== "subscription") return view.text;
  const children = [];
  view.windows.forEach((window) => {
    children.push((0, import_jsx_runtime.jsx)("span", {
      children: `${window.label}:${window.percent}% `,
      key: `${window.label}-head`
    }));
    children.push((0, import_jsx_runtime.jsx)(ClockIcon, { key: `${window.label}-clock` }));
    children.push((0, import_jsx_runtime.jsx)("span", {
      children: ` ${window.countdown} `,
      key: `${window.label}-countdown`
    }));
  });
  return children;
}
async function fetchProviderUsage(provider, signal) {
  const response = await fetch(`/stats-line-pro/provider-usage?provider=${encodeURIComponent(provider)}`, {
    cache: "no-store",
    signal
  });
  if (!response.ok) throw new Error(`usage-http-${response.status}`);
  return response.json();
}
var HISTORY_PAGE_MESSAGES = 50;
function rpcId() {
  const cryptoObject = typeof globalThis === "undefined" ? void 0 : globalThis.crypto;
  if (typeof cryptoObject?.randomUUID === "function") return cryptoObject.randomUUID();
  return `dsh-stats-line-pro-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
async function fetchSessionHistoryPage(sessionId, beforeSeq, maxMessages, signal) {
  const id = rpcId();
  const payload = { sessionId, maxMessages };
  if (beforeSeq !== void 0) payload.beforeSeq = beforeSeq;
  const response = await fetch("/api/session.history", {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json"
    },
    cache: "no-store",
    signal,
    body: JSON.stringify({
      type: "client-request",
      rpcId: id,
      method: "session.history",
      payload
    })
  });
  if (!response.ok) throw new Error(`history-http-${response.status}`);
  const body = await response.json();
  if (body?.rpcId !== id || body?.result?.ok !== true || typeof body.result.value !== "object") throw new Error("history-rpc-invalid");
  return body.result.value;
}
async function loadSessionEvents(sessionId, signal) {
  const pages = [];
  let beforeSeq;
  for (let pageNumber = 0; pageNumber < 1e3; pageNumber += 1) {
    const page = await fetchSessionHistoryPage(sessionId, beforeSeq, HISTORY_PAGE_MESSAGES, signal);
    const events = (Array.isArray(page.events) ? page.events : []).map((entry) => entry?.event).filter((event) => event !== null && typeof event === "object");
    if (events.length === 0) break;
    pages.push(events);
    if (page.hasMore !== true) break;
    const nextBeforeSeq = events[0]?.seq;
    if (!Number.isSafeInteger(nextBeforeSeq) || beforeSeq !== void 0 && nextBeforeSeq >= beforeSeq) throw new Error("history-pagination-invalid");
    beforeSeq = nextBeforeSeq;
    if (pageNumber === 999) throw new Error("history-too-many-pages");
  }
  return pages.reverse().flat();
}
function mergeHistoryTail(existing, incoming) {
  if (incoming.length === 0) return existing;
  if (existing.length === 0) return incoming;
  const firstSeq = incoming[0]?.seq;
  if (!Number.isSafeInteger(firstSeq)) return existing;
  let low = 0;
  let high = existing.length;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if ((existing[middle]?.seq ?? 0) < firstSeq) low = middle + 1;
    else high = middle;
  }
  if (low === existing.length) return existing.concat(incoming);
  if (existing[low]?.seq === firstSeq) return existing.slice(0, low).concat(incoming);
  const merged = new Map(existing.map((event) => [event.seq, event]));
  incoming.forEach((event) => merged.set(event.seq, event));
  return [...merged.values()].sort((left, right) => (left.seq ?? 0) - (right.seq ?? 0));
}
var StatsLinePro = (0, import_react.memo)(function StatsLinePro2({ useSession, useProjection, sessionId, modelDirectory }) {
  const nodes = useSession((snapshot) => snapshot.chat.legacy.nodes);
  const running = useSession((snapshot) => snapshot.running);
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
  const [costState, setCostState] = (0, import_react.useState)({ status: "loading" });
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
  (0, import_react.useEffect)(() => {
    if (typeof sessionId !== "string" || sessionId.length === 0) {
      setCostState({ status: "ready", ...calculateConversationCost([]) });
      return void 0;
    }
    let alive = true;
    let busy = false;
    let cachedEvents = null;
    const controller = new AbortController();
    const refresh = async (full) => {
      if (!alive || busy) return;
      busy = true;
      try {
        if (full || cachedEvents === null) cachedEvents = await loadSessionEvents(sessionId, controller.signal);
        else {
          const page = await fetchSessionHistoryPage(sessionId, void 0, 1, controller.signal);
          const tail = (Array.isArray(page.events) ? page.events : []).map((entry) => entry?.event).filter((event) => event !== null && typeof event === "object");
          cachedEvents = mergeHistoryTail(cachedEvents, tail);
        }
        if (alive) setCostState({ status: "ready", ...calculateConversationCost(cachedEvents, Date.now()) });
      } catch (error) {
        if (alive && error?.name !== "AbortError") setCostState({ status: "error" });
      } finally {
        busy = false;
      }
    };
    setCostState({ status: "loading" });
    void refresh(true);
    const timer = running ? setInterval(() => void refresh(false), 5e3) : void 0;
    return () => {
      alive = false;
      controller.abort();
      if (timer !== void 0) clearInterval(timer);
    };
  }, [running, sessionId]);
  const costOverride = costState.status === "ready" ? costState : null;
  const lines = (0, import_react.useMemo)(() => formatConversationLines(
    sessionStats ?? deriveStats(nodes),
    tokenUsage,
    liveTokenUsage,
    provider,
    identity?.model ?? "",
    new Date(now),
    costOverride
  ), [costOverride, identity?.model, liveTokenUsage, nodes, now, provider, sessionStats, tokenUsage]);
  const providerView = provider.length > 0 ? providerUsageView(provider, providerResult ?? { status: "loading" }, now) : null;
  if (lines.length === 0 && providerView === null) return null;
  const children = [];
  const appendGroup = (content, key, kind = "conversation") => {
    if (children.length > 0) children.push((0, import_jsx_runtime.jsx)("span", {
      "aria-hidden": true,
      "data-stats-line-pro-separator": "",
      children: " | ",
      key: `${key}-separator`
    }));
    children.push((0, import_jsx_runtime.jsx)("span", {
      "data-stats-line-pro-row": kind,
      children: content,
      key
    }));
  };
  lines.forEach((line, index) => appendGroup(line, `conversation-${index}`));
  if (providerView !== null) appendGroup(
    (0, import_jsx_runtime.jsx)(ProviderUsageContent, { view: providerView }),
    "provider",
    "provider"
  );
  return (0, import_jsx_runtime.jsx)("div", {
    "aria-label": "\u4F1A\u8BDD\u7EDF\u8BA1",
    "data-stats-line-pro": "",
    "data-stats-line-pro-cost-status": costState.status,
    "data-stats-line-pro-provider": provider || void 0,
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
