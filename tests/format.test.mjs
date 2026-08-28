import test from 'node:test'
import assert from 'node:assert/strict'
import {
  billedInputTokens,
  cacheHitPercent,
  formatConversationLines,
  formatDuration,
  formatProviderUsage,
  formatTokens,
  latestProviderOf
} from '../src/format.js'

test('compact formatting stays readable for large figures', () => {
  assert.equal(formatTokens(517), '517')
  assert.equal(formatTokens(12_200), '12.2K')
  assert.equal(formatTokens(1_200_000), '1.2M')
  assert.equal(formatDuration(162_000), '2m42s')
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
})

test('provider usage formatting distinguishes subscription and balance', () => {
  assert.match(formatProviderUsage('opencode-go', {
    ok: true,
    kind: 'subscription',
    windows: {
      '5h': { status: 'ok', percent: 0, resetsAt: '2026-08-28T12:00:00Z' },
      '7d': { status: 'ok', percent: 13, resetsAt: '2026-08-31T00:00:00Z' },
      '1m': null
    }
  }, Date.parse('2026-08-28T10:00:00Z')), /OpenCode Go用量：5h 0%/)
  assert.equal(formatProviderUsage('deepseek-official', {
    ok: true,
    kind: 'balance',
    available: true,
    balances: [{ currency: 'CNY', totalBalance: '110.00' }]
  }), 'DeepSeek余额：CNY 110')
})

test('latest provider comes from durable assistant provenance', () => {
  assert.deepEqual(latestProviderOf([
    { kind: 'user' },
    { kind: 'assistant', provenance: { provider: 'packcode-ds', model: 'deepseek-v4-pro' } }
  ]), { provider: 'packcode-ds', model: 'deepseek-v4-pro' })
})
