import test from 'node:test'
import assert from 'node:assert/strict'
import {
  billedInputTokens,
  cacheHitPercent,
  calculateConversationCost,
  conversationCostView,
  estimateModelCost,
  formatConversationLines,
  formatCostSummary,
  formatDuration,
  formatProviderUsage,
  formatTokens,
  latestProviderOf,
  pricingFor,
  providerUsageView,
  compactProviderUsage
} from '../src/format.js'

test('compact formatting stays readable for large figures', () => {
  assert.equal(formatTokens(517), '517')
  assert.equal(formatTokens(12_200), '12.2K')
  assert.equal(formatTokens(1_200_000), '1.2M')
  assert.equal(formatDuration(162_000), '2m42s')
})

test('R4 Coder compact balance is single-line and falls back to 暂无', () => {
  const payload = { ok: true, kind: 'r4-plan', isValid: true, planName: 'Pro', remaining: 29.9, total: 50, unit: 'USD' }
  assert.equal(compactProviderUsage('r4coder', payload), 'R4 Coder $29.90')
  assert.equal(compactProviderUsage('r4coder', null), 'R4 Coder 暂无')
  assert.equal(compactProviderUsage('r4coder', { ok: true, kind: 'r4-plan', isValid: false }), 'R4 Coder 暂无')
})

test('token buckets and cache ratio use the three billing buckets', () => {
  const usage = { uncachedInputTokens: 20, cacheReadTokens: 70, cacheWriteTokens: 10, outputTokens: 4 }
  assert.equal(billedInputTokens(usage), 100)
  assert.equal(cacheHitPercent(usage), '70')
})

test('conversation output is deliberately multi-line', () => {
  const lines = formatConversationLines(
    { turns: 16, steps: 345, llmMs: 4_377_000, toolMs: 2_337_000, ttftMs: 3_600, ttftSteps: 1, decodeMs: 3_000, decodeTokens: 288 },
    { uncachedInputTokens: 1_000_000, cacheReadTokens: 95_000_000, cacheWriteTokens: 600_000, outputTokens: 302_000 },
    { tokensPerSecond: 96 },
    'deepseek-official',
    'deepseek-v4-flash',
    new Date('2026-08-28T10:00:00Z')
  )
  assert.equal(lines.length, 3)
  assert.match(lines[0], /16 轮 · 345 步/)
  assert.match(lines[1], /tok\/s/)
  assert.match(lines[2], /输入/)
  assert.match(lines[2], /花费/)
})

test('provider usage formatting distinguishes subscription and balance', () => {
  const usage = {
    ok: true,
    kind: 'subscription',
    windows: {
      '5h': { status: 'ok', percent: 0, resetsAt: '2026-08-28T12:00:00Z' },
      '7d': { status: 'ok', percent: 13, resetsAt: '2026-08-31T00:00:00Z' },
      '1m': null
    }
  }
  const now = Date.parse('2026-08-28T10:00:00Z')
  assert.equal(formatProviderUsage('opencode-go', usage, now), '5h:0% 2h0m 7d:13% 2d14h')
  assert.deepEqual(providerUsageView('opencode-go', usage, now), {
    kind: 'subscription',
    label: 'OpenCode Go',
    windows: [
      { label: '5h', percent: 0, countdown: '2h0m' },
      { label: '7d', percent: 13, countdown: '2d14h' }
    ]
  })
  assert.equal(formatProviderUsage('deepseek-official', {
    ok: true,
    kind: 'balance',
    available: true,
    balances: [{ currency: 'CNY', totalBalance: '110.00' }]
  }), 'DeepSeek余额：CNY 110')
})

test('OpenCode Go uses model-specific peak and off-peak prices', () => {
  const usage = { inputTokens: 1_000_000, outputTokens: 1_000_000, cacheReadTokens: 0 }
  const peak = estimateModelCost(usage, 'opencode-go', 'deepseek-v4-flash', new Date('2026-08-17T02:00:00Z'))
  const offpeak = estimateModelCost(usage, 'opencode-go', 'deepseek-v4-pro', new Date('2026-08-17T05:00:00Z'))
  assert.deepEqual(peak, {
    amount: 1.76,
    currency: 'USD',
    mode: 'peak',
    provider: 'opencode-go',
    model: 'deepseek-v4-flash'
  })
  assert.deepEqual(offpeak, {
    amount: 2.64,
    currency: 'USD',
    mode: 'offpeak',
    provider: 'opencode-go',
    model: 'deepseek-v4-pro'
  })
  assert.equal(estimateModelCost({ inputTokens: 0, outputTokens: 0, cacheWriteTokens: 1_000_000 }, 'deepseek-official', 'deepseek-v4-flash', new Date('2026-08-17T05:00:00Z')).amount, 1.5)
  assert.equal(pricingFor('opencode-go', 'deepseek-v4-flash', new Date('2026-08-17T02:00:00Z'), usage).input, 0.44)
})

test('OpenCode Go configured deepseek-flash alias is priced as DeepSeek V4 Flash', () => {
  const cost = estimateModelCost(
    { inputTokens: 1_000_000, outputTokens: 1_000_000, cacheReadTokens: 0 },
    'opencode-go',
    'deepseek-flash',
    new Date('2026-08-17T02:00:00Z')
  )
  assert.equal(cost?.model, 'deepseek-v4-flash')
  assert.equal(cost?.currency, 'USD')
  assert.equal(cost?.amount, 1.76)
})

test('conversation cost follows each assistant source and accumulates currencies separately', () => {
  const events = [
    { type: 'request/context', seq: 1, time: Date.parse('2026-08-17T01:59:00Z'), data: { provider: 'opencode-go', model: 'deepseek-v4-flash' } },
    { type: 'step/start', seq: 2, time: Date.parse('2026-08-17T02:00:00Z'), data: { turn: 1, step: 1 } },
    {
      type: 'assistant/message',
      seq: 3,
      time: Date.parse('2026-08-17T02:00:10Z'),
      data: {
        turn: 1,
        step: 1,
        message: { source: { kind: 'model', provider: 'opencode-go', model: 'deepseek-v4-flash' } },
        usage: { inputTokens: 1_000_000, outputTokens: 1_000_000, cacheReadTokens: 0 }
      }
    },
    { type: 'request/context', seq: 4, time: Date.parse('2026-08-17T04:59:00Z'), data: { provider: 'opencode-go', model: 'deepseek-v4-pro' } },
    { type: 'step/start', seq: 5, time: Date.parse('2026-08-17T05:00:00Z'), data: { turn: 1, step: 2 } },
    {
      type: 'assistant/message',
      seq: 6,
      time: Date.parse('2026-08-17T05:00:10Z'),
      data: {
        turn: 1,
        step: 2,
        message: { source: { kind: 'model', provider: 'opencode-go', model: 'deepseek-v4-pro' } },
        usage: { inputTokens: 1_000_000, outputTokens: 1_000_000, cacheReadTokens: 0 }
      }
    }
  ]
  const cost = calculateConversationCost(events)
  assert.equal(cost.pricedRequests, 2)
  assert.equal(cost.complete, true)
  assert.deepEqual(cost.totals, [{ currency: 'USD', amount: 4.4 }])
  assert.deepEqual(cost.entries.map(({ model, mode, amount }) => ({ model, mode, amount })), [
    { model: 'deepseek-v4-flash', mode: 'peak', amount: 1.76 },
    { model: 'deepseek-v4-pro', mode: 'offpeak', amount: 2.64 }
  ])
  assert.equal(formatCostSummary(cost), '花费 $4.40')
})

test('latest provider comes from durable assistant provenance', () => {
  assert.deepEqual(latestProviderOf([
    { kind: 'user' },
    { kind: 'assistant', provenance: { provider: 'packcode-ds', model: 'deepseek-v4-pro' } }
  ]), { provider: 'packcode-ds', model: 'deepseek-v4-pro' })
})
test('cost detail groups models, keeps currencies and includes unpriced providers', () => {
  const view = conversationCostView({ status: 'ready', totals: [{ currency: 'CNY', amount: 3 }, { currency: 'USD', amount: 4 }], entries: [
    { provider: 'deepseek', model: 'flash', currency: 'CNY', amount: 1 },
    { provider: 'deepseek', model: 'flash', currency: 'CNY', amount: 2 },
    { provider: 'opencode-go', model: 'pro', currency: 'USD', amount: 4 }
  ], unpricedEntries: [{ provider: 'other', model: 'unknown' }], unpricedRequests: 1 })
  assert.equal(view.summary, '累计成本 ¥3.00 + $4.00（1 次未计价）')
  assert.deepEqual(view.rows.map(r => r.value), ['¥3.0000', '$4.0000', '1 次未计价'])
  assert.deepEqual(view.providers, ['deepseek', 'opencode-go', 'other'])
  assert.equal(conversationCostView({ status: 'error' }).summary, '成本读取失败')
})
