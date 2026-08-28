const DEEPSEEK_PRICES = {
  peak: { cacheHit: 0.1, cacheMiss: 3, output: 9 },
  offpeak: { cacheHit: 0.05, cacheMiss: 1.5, output: 4.5 }
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

function isPeakHour(now) {
  const hour = (now.getUTCHours() + 8) % 24
  return (hour >= 9 && hour < 12) || (hour >= 14 && hour < 18)
}

/**
 * Keep the previous DeepSeek cost indicator, but only show it for a provider
 * whose price basis is known. Third-party gateways must not be mislabeled with
 * DeepSeek's prices.
 */
export function estimateCostCny(usage, provider, now = new Date()) {
  if (!isDeepSeekProvider(provider) || usage === null || typeof usage !== 'object') return null
  const prices = isPeakHour(now) ? DEEPSEEK_PRICES.peak : DEEPSEEK_PRICES.offpeak
  const miss = (finiteNonNegative(usage.uncachedInputTokens) + finiteNonNegative(usage.cacheWriteTokens)) / 1e6 * prices.cacheMiss
  const hit = finiteNonNegative(usage.cacheReadTokens) / 1e6 * prices.cacheHit
  const output = finiteNonNegative(usage.outputTokens) / 1e6 * prices.output
  const total = miss + hit + output
  return total > 0 ? total : null
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
  if (provider.includes('deepseek')) return 'DeepSeek'
  return provider
}

function formatMoney(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return String(value ?? '')
  return n.toFixed(2).replace(/\.?(0+)$/, '')
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

/** Format the provider-side balance/subscription response without exposing secrets. */
export function formatProviderUsage(provider, payload, now = Date.now()) {
  const label = providerLabel(provider)
  if (payload === null || payload === undefined || payload.status === 'loading') return `${label}：正在读取用量…`
  if (payload.ok !== true) {
    if (payload.status === 'unconfigured') return `${label}：未配置 API 密钥`
    if (payload.status === 'unsupported') return `${label}：暂无标准余额/订阅接口`
    return `${label}：用量读取失败，稍后重试`
  }

  if (payload.kind === 'subscription') {
    const order = ['5h', '7d', '1m']
    const windows = order.map((key) => {
      const value = payload.windows?.[key]
      if (!value || value.status !== 'ok') return null
      const percent = Number.isFinite(value.percent) ? value.percent : '?'
      return `${key} ${percent}% · 重置 ${formatCountdown(value.resetsAt, now)}`
    }).filter(Boolean)
    return windows.length > 0 ? `${label}用量：${windows.join(' | ')}` : `${label}：暂无窗口用量`
  }

  if (payload.kind === 'balance') {
    const balances = (Array.isArray(payload.balances) ? payload.balances : []).map((balance) => {
      const currency = typeof balance.currency === 'string' && balance.currency.length > 0 ? balance.currency : 'CNY'
      return `${currency} ${formatMoney(balance.totalBalance)}`
    }).filter(Boolean)
    const suffix = payload.available === false ? '（当前不可用）' : ''
    return balances.length > 0 ? `${label}余额：${balances.join(' · ')}${suffix}` : `${label}：未返回余额`
  }

  return `${label}：暂无可显示的用量`
}

/** Build intentionally multi-line groups so narrow windows never ellipsize the whole bar. */
export function formatConversationLines(statsInput, usageInput, liveUsageInput, provider, model, now = new Date()) {
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
      const cost = estimateCostCny(usage, provider, now)
      if (cost !== null) parts.push(`估算花费 ¥${cost.toFixed(2)}`)
      lines.push(parts.join(' | '))
    }
  }
  return lines
}
