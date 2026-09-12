const DEEPSEEK_PRICING_EFFECTIVE_AT = Date.UTC(2026, 7, 16, 16)
const OPENCODE_GO_PRICING_EFFECTIVE_AT = Date.UTC(2026, 7, 16, 16)

function rates(input, output, cacheRead, cacheWrite = 0) {
  return { input, output, cacheRead, cacheWrite }
}

const DEEPSEEK_FLASH_PRICES = {
  currency: 'CNY',
  legacy: rates(1, 2, 0.02, 1),
  peak: rates(3, 9, 0.1, 3),
  offpeak: rates(1.5, 4.5, 0.05, 1.5)
}
const DEEPSEEK_PRO_PRICES = {
  currency: 'CNY',
  legacy: rates(3, 6, 0.025, 3),
  peak: rates(9, 27, 0.3, 9),
  offpeak: rates(4.5, 13.5, 0.15, 4.5)
}
const DEEPSEEK_MODEL_PRICES = {
  'deepseek-v4-flash': DEEPSEEK_FLASH_PRICES,
  'deepseek-v4-flash-vision-exp': DEEPSEEK_FLASH_PRICES,
  'deepseek-v4-pro': DEEPSEEK_PRO_PRICES
}

const OPENCODE_GO_FLASH_PRICES = {
  currency: 'USD',
  legacy: rates(0.14, 0.28, 0.0028),
  peak: rates(0.44, 1.32, 0.014),
  offpeak: rates(0.22, 0.66, 0.007)
}
const OPENCODE_GO_PRO_PRICES = {
  currency: 'USD',
  legacy: rates(0.435, 0.87, 0.003625),
  peak: rates(1.32, 3.96, 0.044),
  offpeak: rates(0.66, 1.98, 0.022)
}

function openCodeGoPrice(input, output, cacheRead, cacheWrite = 0) {
  return { currency: 'USD', rates: rates(input, output, cacheRead, cacheWrite) }
}

function openCodeGoTieredPrice(tiers) {
  return { currency: 'USD', tiers }
}

/* Official OpenCode Go prices per 1M tokens, verified 2026-08-28. */
const OPENCODE_GO_MODEL_PRICES = {
  'deepseek-v4-flash': OPENCODE_GO_FLASH_PRICES,
  'deepseek-v4-flash-vision-exp': OPENCODE_GO_FLASH_PRICES,
  'deepseek-v4-pro': OPENCODE_GO_PRO_PRICES,
  'glm-5.3-flash': openCodeGoPrice(0.15, 0.5, 0.03),
  'glm-5.3': openCodeGoPrice(1.4, 4.4, 0.26),
  'glm-5.2': openCodeGoPrice(1.4, 4.4, 0.26),
  'glm-5.1': openCodeGoPrice(1.4, 4.4, 0.26),
  'kimi-k3': openCodeGoPrice(3, 15, 0.3),
  'kimi-k2.7-code': openCodeGoPrice(0.95, 4, 0.19),
  'kimi-k2.6': openCodeGoPrice(0.95, 4, 0.16),
  'longcat-2.0': openCodeGoPrice(0.3, 1.2, 0.006),
  'mimo-v2.5': openCodeGoPrice(0.14, 0.28, 0.0028),
  'mimo-v2.5-pro': openCodeGoPrice(0.435, 0.87, 0.003625),
  'minimax-m3': openCodeGoPrice(0.3, 1.2, 0.06),
  'minimax-m2.7': openCodeGoPrice(0.3, 1.2, 0.06, 0.375),
  'minimax-m2.5': openCodeGoPrice(0.3, 1.2, 0.06, 0.375),
  'muse-spark-1.2-contributor': openCodeGoPrice(0.1, 0.2, 0.002),
  'qwen3.8-max': openCodeGoPrice(2, 6, 0.25, 2.5),
  'qwen3.8-flash': openCodeGoPrice(0.15, 0.47, 0.016, 0.2),
  'qwen3.7-max': openCodeGoPrice(2.5, 7.5, 0.5, 3.125),
  'qwen3.7-plus': openCodeGoTieredPrice([
    { maxContextTokens: 256_000, rates: rates(0.4, 1.6, 0.04, 0.5) },
    { rates: rates(1.2, 4.8, 0.12, 1.5) }
  ]),
  'qwen3.6-plus': openCodeGoTieredPrice([
    { maxContextTokens: 256_000, rates: rates(0.5, 3, 0.05, 0.625) },
    { rates: rates(2, 6, 0.2, 2.5) }
  ]),
  'hy3': openCodeGoPrice(0.14, 0.58, 0.035),
  'grok-4.6': openCodeGoTieredPrice([
    { maxContextTokens: 200_000, rates: rates(2, 6, 0.5) },
    { rates: rates(4, 12, 1) }
  ]),
  'gpt-5.6-luna': openCodeGoTieredPrice([
    { maxContextTokens: 272_000, rates: rates(0.2, 1.2, 0.02, 0.25) },
    { rates: rates(0.4, 1.8, 0.04, 0.5) }
  ]),
  'big-pickle': openCodeGoPrice(0, 0, 0),
  'mimo-v2.5-free': openCodeGoPrice(0, 0, 0),
  'hy3-free': openCodeGoPrice(0, 0, 0),
  'nemotron-3-ultra-free': openCodeGoPrice(0, 0, 0),
  'nemotron-3.5-lightning-free': openCodeGoPrice(0, 0, 0),
  'muse-spark-1.2-contributor-free': openCodeGoPrice(0, 0, 0)
}

function finiteNonNegative(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0
}

function textNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

/** Match DSH's compact token notation: 517 / 12.2K / 517K / 1.2M. */
export function formatTokens(value) {
  const n = Math.max(0, Math.round(textNumber(value)))
  const scaled = (v) => v >= 100 ? String(Math.round(v)) : String(Math.round(v * 10) / 10)
  if (n < 1000) return String(n)
  if (n < 1e6) return `${scaled(n / 1e3)}K`
  return `${scaled(n / 1e6)}M`
}

/** Match DSH's compact duration notation. */
export function formatDuration(value) {
  const seconds = Math.max(0, textNumber(value)) / 1e3
  if (seconds < 60) return `${Math.round(seconds * 10) / 10}s`
  const whole = Math.round(seconds)
  return `${Math.floor(whole / 60)}m${whole % 60}s`
}

export function billedInputTokens(usage) {
  if (usage === null || typeof usage !== 'object') return 0
  return finiteNonNegative(usage.uncachedInputTokens) + finiteNonNegative(usage.cacheReadTokens) + finiteNonNegative(usage.cacheWriteTokens)
}

export function cacheHitPercent(usage) {
  const denominator = billedInputTokens(usage)
  if (denominator <= 0) return null
  const missed = finiteNonNegative(usage.uncachedInputTokens) + finiteNonNegative(usage.cacheWriteTokens)
  if (missed <= 0) return '100'
  const percent = Math.max(0, Math.min(100, finiteNonNegative(usage.cacheReadTokens) / denominator * 100))
  if (percent < 99.95) return String(Math.round(percent))
  return '99.9'
}

function isDeepSeekProvider(provider) {
  return typeof provider === 'string' && provider.includes('deepseek') && !provider.includes('opencode') && !provider.includes('packcode')
}

function asDate(value) {
  if (value instanceof Date) return value
  const date = new Date(value)
  return Number.isFinite(date.getTime()) ? date : new Date(0)
}

function isDeepSeekPeakHour(now) {
  const hour = (asDate(now).getUTCHours() + 8) % 24
  return (hour >= 9 && hour < 12) || (hour >= 14 && hour < 18)
}

function isOpenCodeGoProvider(provider) {
  return typeof provider === 'string' && (provider === 'opencode-go' || provider.startsWith('opencode-go-'))
}

function isOpenCodeGoPeakHour(now) {
  const date = asDate(now)
  const weekday = date.getUTCDay()
  if (weekday === 0 || weekday === 6) return false
  const minutes = date.getUTCHours() * 60 + date.getUTCMinutes()
  return (minutes >= 60 && minutes < 240) || (minutes >= 360 && minutes < 600)
}

function normalizedModelId(model) {
  const raw = typeof model === 'string' ? model.trim().toLowerCase() : ''
  const id = raw.includes('/') ? raw.slice(raw.lastIndexOf('/') + 1) : raw
  if (id === 'deepseek-chat' || id === 'deepseek-reasoner') return 'deepseek-v4-flash'
  return id
}

function billingUsage(usage) {
  if (usage === null || typeof usage !== 'object' || Array.isArray(usage)) return null
  const knownKeys = [
    'inputTokens', 'uncachedInputTokens', 'promptTokens',
    'outputTokens', 'cacheReadTokens', 'cacheRead', 'cacheWriteTokens', 'cacheWrite'
  ]
  if (!knownKeys.some((key) => Object.hasOwn(usage, key))) return null
  const firstNumber = (...values) => values.find((value) => typeof value === 'number' && Number.isFinite(value)) ?? 0
  return {
    uncachedInputTokens: Math.max(0, firstNumber(usage.uncachedInputTokens, usage.inputTokens, usage.promptTokens)),
    outputTokens: Math.max(0, firstNumber(usage.outputTokens)),
    cacheReadTokens: Math.max(0, firstNumber(usage.cacheReadTokens, usage.cacheRead)),
    cacheWriteTokens: Math.max(0, firstNumber(usage.cacheWriteTokens, usage.cacheWrite))
  }
}

function selectRates(entry, at, usage, peakPredicate, effectiveAt) {
  if (Array.isArray(entry.tiers)) {
    const contextTokens = billedInputTokens(usage)
    return entry.tiers.find((tier) => tier.maxContextTokens === undefined || contextTokens <= tier.maxContextTokens)?.rates ?? entry.tiers.at(-1).rates
  }
  if (entry.peak !== undefined && entry.offpeak !== undefined) {
    if (entry.legacy !== undefined && at.getTime() < effectiveAt) return { ...entry.legacy, mode: 'legacy' }
    return { ...(peakPredicate(at) ? entry.peak : entry.offpeak), mode: peakPredicate(at) ? 'peak' : 'offpeak' }
  }
  return { ...entry.rates, mode: 'standard' }
}

/** Resolve the official price rule for one exact provider/model request. */
export function pricingFor(provider, model, at = new Date(), usage = null) {
  const modelId = normalizedModelId(model)
  const date = asDate(at)
  if (isOpenCodeGoProvider(provider)) {
    const entry = OPENCODE_GO_MODEL_PRICES[modelId]
    if (entry === undefined) return null
    return {
      provider,
      model: modelId,
      currency: entry.currency,
      ...selectRates(entry, date, usage ?? {}, isOpenCodeGoPeakHour, OPENCODE_GO_PRICING_EFFECTIVE_AT)
    }
  }
  if (isDeepSeekProvider(provider)) {
    const entry = DEEPSEEK_MODEL_PRICES[modelId]
    if (entry === undefined) return null
    return {
      provider,
      model: modelId,
      currency: entry.currency,
      ...selectRates(entry, date, usage ?? {}, isDeepSeekPeakHour, DEEPSEEK_PRICING_EFFECTIVE_AT)
    }
  }
  return null
}

/** Calculate one provider/model request cost from the provider-returned usage. */
export function estimateModelCost(usage, provider, model, at = new Date()) {
  const normalized = billingUsage(usage)
  if (normalized === null) return null
  const pricing = pricingFor(provider, model, at, normalized)
  if (pricing === null) return null
  const amount = (
    normalized.uncachedInputTokens / 1e6 * pricing.input
    + normalized.cacheReadTokens / 1e6 * pricing.cacheRead
    + normalized.cacheWriteTokens / 1e6 * pricing.cacheWrite
    + normalized.outputTokens / 1e6 * pricing.output
  )
  return {
    amount,
    currency: pricing.currency,
    mode: pricing.mode,
    provider: pricing.provider,
    model: pricing.model
  }
}

/** Backwards-compatible CNY helper for callers that only know the official DeepSeek route. */
export function estimateCostCny(usage, provider, now = new Date()) {
  const cost = estimateModelCost(usage, provider, 'deepseek-v4-flash', now)
  return cost?.currency === 'CNY' && cost.amount > 0 ? cost.amount : null
}

/** Small fallback for an old DSH deployment without the sessionStats unit. */
export function deriveStats(nodes = []) {
  const turns = new Set()
  const steps = new Set()
  let llmMs = 0
  let toolMs = 0
  let ttftMs = 0
  let ttftSteps = 0
  let decodeMs = 0
  let decodeTokens = 0

  for (const node of Array.isArray(nodes) ? nodes : []) {
    if (node?.kind === 'assistant') {
      if (Number.isInteger(node.turn)) turns.add(node.turn)
      if (Number.isInteger(node.turn) && Number.isInteger(node.step)) steps.add(`${node.turn}/${node.step}`)
      const timing = node.timing
      if (timing && Number.isFinite(timing.stepStartTime) && Number.isFinite(timing.completedTime)) {
        llmMs += Math.max(0, timing.completedTime - timing.stepStartTime)
      }
      if (timing && Number.isFinite(timing.stepStartTime) && Number.isFinite(timing.firstTokenTime)) {
        ttftMs += Math.max(0, timing.firstTokenTime - timing.stepStartTime)
        ttftSteps += 1
        const outputTokens = finiteNonNegative(node.usage?.outputTokens)
        if (outputTokens > 0 && Number.isFinite(timing.completedTime)) {
          decodeMs += Math.max(0, timing.completedTime - timing.firstTokenTime)
          decodeTokens += outputTokens
        }
      }
    } else if (node?.kind === 'tool-result' && Number.isFinite(node.callTime) && Number.isFinite(node.time)) {
      toolMs += Math.max(0, node.time - node.callTime)
    }
  }

  return { turns: turns.size, steps: steps.size, llmMs, toolMs, ttftMs, ttftSteps, decodeMs, decodeTokens }
}

/** Find the most recent durable assistant request's provider/model identity. */
export function latestProviderOf(nodes = []) {
  for (let index = Array.isArray(nodes) ? nodes.length - 1 : -1; index >= 0; index -= 1) {
    const node = nodes[index]
    if (node?.kind !== 'assistant') continue
    const provider = node.provenance?.provider ?? node.requestConfig?.provider
    const model = node.provenance?.model ?? node.requestConfig?.model
    if (typeof provider === 'string' && provider.length > 0) return { provider, model: typeof model === 'string' ? model : '' }
  }
  return null
}

export function providerLabel(provider) {
  if (typeof provider !== 'string' || provider.length === 0) return '当前供应商'
  if (provider.includes('opencode-go')) return 'OpenCode Go'
  if (provider.includes('packcode')) return 'PackCode DS'
  if (provider === 'r4coder') return 'R4 Coder'
  if (provider.includes('deepseek')) return 'DeepSeek'
  return provider
}

function formatMoney(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return String(value ?? '')
  return n.toFixed(2).replace(/\.?(0+)$/, '')
}

function identityFromEvent(event, context, fallback) {
  const source = event?.data?.message?.source
  const candidates = [
    { provider: source?.provider, model: source?.model },
    { provider: event?.data?.provider, model: event?.data?.model },
    context,
    fallback
  ]
  for (const candidate of candidates) {
    const provider = typeof candidate?.provider === 'string' && candidate.provider.length > 0 ? candidate.provider : ''
    const model = typeof candidate?.model === 'string' && candidate.model.length > 0 ? candidate.model : ''
    if (provider && model) return { provider, model }
  }
  return null
}

function stepKey(data) {
  return Number.isInteger(data?.turn) && Number.isInteger(data?.step) ? `${data.turn}:${data.step}` : null
}

function eventDate(value, fallback) {
  const date = new Date(value)
  return Number.isFinite(date.getTime()) ? date : fallback
}

/**
 * Sum every recorded model request in sequence order. Assistant message source
 * is preferred; request/context is the compatibility fallback for older logs.
 */
export function calculateConversationCost(events = [], now = Date.now(), fallbackIdentity = null) {
  const referenceDate = eventDate(now, new Date())
  const ordered = (Array.isArray(events) ? events : [])
    .filter((event) => event !== null && typeof event === 'object')
    .slice()
    .sort((left, right) => (left.seq ?? 0) - (right.seq ?? 0))
  const stepStarts = new Map()
  const pending = new Map()
  const totals = new Map()
  const entries = []
  const unpricedEntries = []
  let context = null
  let pricedRequests = 0
  let unpricedRequests = 0
  let missingUsageRequests = 0

  const addSample = (sample) => {
    const identity = sample.identity ?? identityFromEvent(sample.event, context, fallbackIdentity)
    const normalized = billingUsage(sample.usage)
    if (normalized === null) {
      missingUsageRequests += 1
      unpricedEntries.push({ ...identity, reason: "missing-usage" })
      return
    }
    const cost = estimateModelCost(normalized, identity?.provider, identity?.model, sample.at)
    if (cost === null) {
      unpricedRequests += 1
      unpricedEntries.push({ ...identity, reason: "missing-price" })
      return
    }
    pricedRequests += 1
    totals.set(cost.currency, (totals.get(cost.currency) ?? 0) + cost.amount)
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
    })
  }

  const flushPending = (key) => {
    const sample = pending.get(key)
    if (sample === undefined) return
    pending.delete(key)
    addSample(sample)
  }

  for (const event of ordered) {
    if (event.type === 'request/context') {
      const provider = event.data?.provider
      const model = event.data?.model
      if (typeof provider === 'string' && typeof model === 'string' && provider && model) context = { provider, model }
      continue
    }

    if (event.type === 'step/start') {
      const key = stepKey(event.data)
      if (key !== null) stepStarts.set(key, eventDate(event.time, referenceDate))
      continue
    }

    if (event.type === 'assistant/chunk' && event.data?.chunk?.type === 'usage') {
      const key = stepKey(event.data)
      if (key !== null) pending.set(key, {
        event,
        usage: event.data.chunk.usage,
        identity: identityFromEvent(event, context, fallbackIdentity),
        at: stepStarts.get(key) ?? eventDate(event.time, referenceDate)
      })
      continue
    }

    if (event.type === 'assistant/message') {
      const key = stepKey(event.data)
      const sample = key === null ? undefined : pending.get(key)
      if (key !== null) pending.delete(key)
      const usage = event.data?.usage ?? sample?.usage
      if (usage === undefined) {
        missingUsageRequests += 1
        unpricedEntries.push({ ...identityFromEvent(event, context, fallbackIdentity), reason: "missing-usage" })
        continue
      }
      addSample({
        event,
        usage,
        identity: identityFromEvent(event, sample?.identity ?? context, fallbackIdentity),
        at: stepStarts.get(key) ?? sample?.at ?? eventDate(event.time, referenceDate)
      })
      continue
    }

    if (event.type === 'llm/retry' || event.type === 'step/end') {
      const key = stepKey(event.data)
      if (key !== null) flushPending(key)
    }
  }

  for (const key of pending.keys()) flushPending(key)

  return {
    totals: [...totals.entries()].map(([currency, amount]) => ({ currency, amount })),
    entries,
    unpricedEntries,
    pricedRequests,
    unpricedRequests,
    missingUsageRequests,
    complete: unpricedRequests === 0 && missingUsageRequests === 0
  }
}

function currencyPrefix(currency) {
  if (currency === 'USD') return '$'
  if (currency === 'CNY') return '¥'
  return `${currency ?? ''} `
}

/** Format one accumulated cost result, preserving separate currencies. */
export function formatCostSummary(cost) {
  if (cost === null || typeof cost !== 'object') return null
  const totals = Array.isArray(cost.totals)
    ? cost.totals.filter((item) => item && typeof item.amount === 'number' && Number.isFinite(item.amount))
    : Number.isFinite(cost.amount) ? [{ currency: cost.currency, amount: cost.amount }] : []
  const missing = Math.max(0, Number(cost.unpricedRequests) || 0) + Math.max(0, Number(cost.missingUsageRequests) || 0)
  if (totals.length === 0) return missing > 0 ? `花费：${missing} 次请求未计价` : null
  const rendered = totals.map((item) => `${currencyPrefix(item.currency)}${item.amount.toFixed(2)}`).join(' + ')
  return `花费 ${rendered}${missing > 0 ? `（${missing} 次未计价）` : ''}`
}

function formatCountdown(iso, now) {
  const remaining = new Date(iso).getTime() - now
  if (!Number.isFinite(remaining) || remaining <= 0) return '0m'
  const totalMinutes = Math.floor(remaining / 60000)
  const days = Math.floor(totalMinutes / 1440)
  const hours = Math.floor((totalMinutes % 1440) / 60)
  const minutes = totalMinutes % 60
  if (days > 0) return `${days}d${hours}h`
  if (hours > 0) return `${hours}h${minutes}m`
  return `${minutes}m`
}

function subscriptionWindowsOf(payload, now) {
  const order = ['5h', '7d', '1m']
  return order.map((label) => {
    const value = payload.windows?.[label]
    if (!value || value.status !== 'ok') return null
    return {
      label,
      percent: Number.isFinite(value.percent) ? value.percent : '?',
      countdown: formatCountdown(value.resetsAt, now)
    }
  }).filter(Boolean)
}

/** Build a provider usage view without exposing secrets to the browser. */
export function providerUsageView(provider, payload, now = Date.now()) {
  const label = providerLabel(provider)
  if (payload === null || payload === undefined || payload.status === 'loading') {
    return { kind: 'text', label, text: `${label}：正在读取用量…` }
  }
  if (payload.status === 'unsupported') return { kind: 'text', label, text: `${label}：暂无标准余额/订阅接口` }
  if (payload.ok !== true) {
    if (payload.status === 'unconfigured') return { kind: 'text', label, text: `${label}：未配置 API 密钥` }
    if (payload.status === 'unsupported') return { kind: 'text', label, text: `${label}：暂无标准余额/订阅接口` }
    return { kind: 'text', label, text: `${label}：用量读取失败，稍后重试` }
  }

  if (payload.kind === 'subscription') {
    const windows = subscriptionWindowsOf(payload, now)
    return windows.length > 0
      ? { kind: 'subscription', label, windows }
      : { kind: 'text', label, text: `${label}：暂无窗口用量` }
  }

  if (payload.kind === 'balance') {
    const balances = (Array.isArray(payload.balances) ? payload.balances : []).map((balance) => {
      const currency = typeof balance.currency === 'string' && balance.currency.length > 0 ? balance.currency : 'CNY'
      return `${currency} ${formatMoney(balance.totalBalance)}`
    }).filter(Boolean)
    const suffix = payload.available === false ? '（当前不可用）' : ''
    return balances.length > 0
      ? { kind: 'text', label, text: `${label}余额：${balances.join(' · ')}${suffix}` }
      : { kind: 'text', label, text: `${label}：未返回余额` }
  }

  if (payload.kind === 'r4-plan') {
    if (payload.isValid === false) return { kind: 'text', label, text: `${label}：暂无` }
    const remaining = Number(payload.remaining)
    return Number.isFinite(remaining)
      ? { kind: 'r4-plan', label, remaining, unit: payload.unit === 'USD' ? 'USD' : String(payload.unit ?? ''), planName: payload.planName, total: Number(payload.total), extra: payload.extra }
      : { kind: 'text', label, text: `${label}：暂无` }
  }

  return { kind: 'text', label, text: `${label}：暂无可显示的用量` }
}

/** Compact label used by the fixed-height composer statistics card. */
export function compactProviderUsage(provider, payload, now = Date.now()) {
  if (payload === null || payload === undefined || payload.status === 'loading' || payload.ok === false || payload.status === 'unsupported') {
    return `${providerLabel(provider)} 暂无`
  }
  const view = providerUsageView(provider, payload, now)
  if (view.kind === 'r4-plan') return `${view.label} $${view.remaining.toFixed(2)}`
  if (view.kind === 'subscription') {
    const best = view.windows.find((window) => Number.isFinite(window.percent))
    return best === undefined ? `${view.label} 暂无` : `${view.label} 剩余 ${Math.max(0, 100 - best.percent)}%`
  }
  if (view.kind === 'text') {
    const text = typeof view.text === 'string' ? view.text : ''
    const separator = Math.max(text.lastIndexOf('余额：'), text.lastIndexOf('：'))
    const value = separator < 0 ? '' : text.slice(separator + (text.startsWith('余额：', separator) ? 3 : 1))
    return `${view.label} ${value && !/正在读取|失败|未配置|暂无/u.test(value) ? value : '暂无'}`
  }
  return `${view.label} 暂无`
}

/** Every provider variant must produce text before crossing the JSON bridge. */
export function detailedProviderUsage(provider, payload, now = Date.now()) {
  const view = providerUsageView(provider, payload, now)
  if (view.kind === 'r4-plan') {
    const total = Number.isFinite(view.total) && view.total >= 0 ? ` / $${view.total.toFixed(2)}` : ''
    return `${view.label}：${view.planName || '套餐'} 剩余 $${view.remaining.toFixed(2)}${total}${view.extra ? ' · ' + view.extra : ''}`
  }
  if (view.kind === 'subscription') {
    return view.label + ' 订阅余量：' + view.windows.map(w => `${w.label} 剩余 ${Number.isFinite(w.percent) ? Math.max(0, 100 - w.percent) + '%' : '未知'}（${w.countdown} 后重置）`).join(' · ')
  }
  return typeof view.text === 'string' ? view.text : `${view.label}：暂无`
}

export function compactCostSummary(cost) {
  if (cost?.status !== 'ready') return '累计成本 暂无'
  const totals = (cost.totals ?? []).filter(item => Number.isFinite(item.amount))
  if (totals.length === 0) return (cost.unpricedRequests || cost.missingUsageRequests) ? '累计成本 暂无' : '累计成本 $0.00'
  return '累计成本 ' + totals.map(item => `${currencyPrefix(item.currency)}${item.amount.toFixed(2)}`).join(' + ')
}

/** Format the compact legacy provider usage text used by the composer line. */
export function formatProviderUsage(provider, payload, now = Date.now()) {
  const view = providerUsageView(provider, payload, now)
  if (view.kind === 'subscription') {
    return view.windows.map(({ label, percent, countdown }) => `${label}:${percent}% ${countdown}`).join(' ')
  }
  return view.text
}

/** Build intentionally multi-line groups so narrow windows never ellipsize the whole bar. */
export function formatConversationLines(statsInput, usageInput, liveUsageInput, provider, model, now = new Date(), costOverride) {
  const stats = statsInput ?? deriveStats([])
  const liveUsage = liveUsageInput ?? null
  const usage = usageInput ?? liveUsage
  const lines = []
  const steps = finiteNonNegative(stats.steps)
  if (steps > 0) {
    const counts = `${finiteNonNegative(stats.turns)} 轮 · ${steps} 步`
    const durations = []
    if (finiteNonNegative(stats.llmMs) > 0) durations.push(`LLM ${formatDuration(stats.llmMs)}`)
    if (finiteNonNegative(stats.toolMs) > 0) durations.push(`工具调用 ${formatDuration(stats.toolMs)}`)
    lines.push([counts, durations.join(' · ')].filter(Boolean).join(' | '))

    const speeds = []
    if (finiteNonNegative(stats.ttftSteps) > 0) speeds.push(`首 token 平均 ${formatDuration(stats.ttftMs / stats.ttftSteps)}`)
    const tokensPerSecond = liveUsage?.tokensPerSecond ?? (stats.decodeMs > 0 ? stats.decodeTokens / (stats.decodeMs / 1e3) : 0)
    if (finiteNonNegative(tokensPerSecond) > 0) speeds.push(`${Math.round(tokensPerSecond * 10) / 10} tok/s`)
    if (speeds.length > 0) lines.push(speeds.join(' · '))
  }

  if (usage !== null && typeof usage === 'object') {
    const inputTokens = billedInputTokens(usage)
    const outputTokens = finiteNonNegative(usage.outputTokens)
    if (inputTokens > 0 || outputTokens > 0) {
      const cache = cacheHitPercent(usage)
      const parts = []
      if (cache !== null) parts.push(`缓存命中 ${cache}%`)
      parts.push(`输入 ${formatTokens(inputTokens)} tok · 输出 ${formatTokens(outputTokens)} tok`)
      const cost = costOverride === undefined ? estimateModelCost(usage, provider, model, now) : costOverride
      const costText = formatCostSummary(cost)
      if (costText !== null) parts.push(costText)
      lines.push(parts.join(' | '))
    }
  }
  return lines
}

/** Conversation-only breakdown; preserve exact provider IDs and currencies. */
export function conversationCostView(cost) {
  if (cost?.status !== 'ready') return { summary: cost?.status === 'error' ? '成本读取失败' : '成本读取中…', rows: [], providers: [] }
  const groups = new Map()
  for (const entry of [...(cost.entries ?? []), ...(cost.unpricedEntries ?? [])]) {
    const key = JSON.stringify([entry.provider, entry.model, entry.currency])
    const group = groups.get(key) ?? { provider: entry.provider, model: entry.model, currency: entry.currency, amount: 0, missing: 0 }
    if (Number.isFinite(entry.amount)) group.amount += entry.amount
    else group.missing += 1
    groups.set(key, group)
  }
  return {
    summary: (formatCostSummary(cost) ?? '花费 0').replace(/^花费[： ]?/, '累计成本 '),
    rows: [...groups.values()].map(g => ({ label: `${providerLabel(g.provider)} / ${g.model || '未知模型'}`, value: g.missing ? `${g.missing} 次未计价` : `${currencyPrefix(g.currency)}${g.amount.toFixed(4)}` })),
    providers: [...new Set([...groups.values()].map(g => g.provider).filter(Boolean))]
  }
}
