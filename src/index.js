import { credentialRef } from '@deepseek-ai/dsh-credentials'

const ROUTE_PATH = '/stats-line-pro/provider-usage'
const CACHE_MS = 30_000
const MAX_RESPONSE_BYTES = 1_024 * 1_024
const pending = new Map()
const cache = new Map()

function json(res, status, value) {
  const body = JSON.stringify(value)
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'content-length': Buffer.byteLength(body)
  })
  res.end(body)
}

function providerFromRequest(req) {
  try {
    const url = new URL(req.url ?? '', 'http://127.0.0.1')
    const provider = url.searchParams.get('provider')?.trim().toLowerCase() ?? ''
    return /^[a-z0-9][a-z0-9._-]{0,63}$/.test(provider) ? provider : null
  } catch {
    return null
  }
}

function providerKind(provider) {
  if (provider === 'deepseek-official' || provider === 'deepseek-vision') return 'deepseek-balance'
  if (provider === 'opencode-go' || provider.startsWith('opencode-go-')) return 'opencode-subscription'
  if (provider === 'r4coder') return 'r4-coder-plan'
  return 'unsupported'
}

function configuredProfile(ctx, provider, kind) {
  const settings = ctx.get('settings')
  if (settings === undefined) return {}
  if (kind === 'deepseek-balance') return settings.get('llm-deepseek') ?? {}
  return settings.get('llm-pi-ai')?.providers?.[provider] ?? {}
}

function credentialName(ctx, provider, kind) {
  const profile = configuredProfile(ctx, provider, kind)
  if (typeof profile.apiKeyEnv === 'string' && /^[A-Za-z_][A-Za-z0-9_]*$/.test(profile.apiKeyEnv)) return profile.apiKeyEnv
  if (kind === 'deepseek-balance') return 'DEEPSEEK_API_KEY'
  if (kind === 'opencode-subscription') return 'OPENCODE_GO_API_KEY'
  return 'R4CODER_API_KEY'
}

async function resolveCredential(ctx, reference) {
  const credentials = ctx.get('credentials')
  if (credentials !== undefined) {
    try {
      const result = await credentials.resolve(credentialRef(reference))
      if (typeof result?.value === 'string' && result.value.length > 0) return result.value
    } catch {
      return null
    }
  }
  const ambient = process.env[reference]
  return typeof ambient === 'string' && ambient.length > 0 ? ambient : null
}

async function fetchJson(url, key) {
  const response = await fetch(url, {
    headers: { accept: 'application/json', authorization: `Bearer ${key}` },
    signal: AbortSignal.timeout(15_000)
  })
  if (!response.ok) throw new Error(`upstream-http-${response.status}`)
  const text = await response.text()
  if (text.length > MAX_RESPONSE_BYTES) throw new Error('upstream-response-too-large')
  return JSON.parse(text)
}

function finiteMoney(value) {
  const amount = Number(value)
  return Number.isFinite(amount) ? Math.max(0, amount) : 0
}

function r4MetaUrl(ctx, provider) {
  const configured = configuredProfile(ctx, provider, 'r4-coder-plan')
  const source = typeof configured.baseURL === 'string' ? configured.baseURL : ''
  const base = new URL(source)
  if (base.protocol !== 'https:' || base.hostname !== 'api.r4.codes') throw new Error('r4-base-url-not-allowed')
  return new URL('/v1/cli/meta', base).toString()
}

function normalizeWindow(value) {
  if (value === null || typeof value !== 'object' || value.status !== 'ok') return null
  const percent = Number(value.percent)
  const resetsAt = typeof value.resetsAt === 'string' ? value.resetsAt : ''
  if (!Number.isFinite(percent) || !resetsAt || !Number.isFinite(new Date(resetsAt).getTime())) return null
  return { status: 'ok', percent: Math.max(0, Math.min(100, percent)), resetsAt }
}

async function readProviderUsage(ctx, provider) {
  const kind = providerKind(provider)
  if (kind === 'unsupported') return { ok: true, status: 'unsupported', provider }

  const reference = credentialName(ctx, provider, kind)
  const key = await resolveCredential(ctx, reference)
  if (key === null) return { ok: false, status: 'unconfigured', provider }

  try {
    if (kind === 'deepseek-balance') {
      const data = await fetchJson('https://api.deepseek.com/user/balance', key)
      const balances = (Array.isArray(data?.balance_infos) ? data.balance_infos : []).map((item) => ({
        currency: typeof item?.currency === 'string' ? item.currency : 'CNY',
        totalBalance: typeof item?.total_balance === 'string' || typeof item?.total_balance === 'number' ? String(item.total_balance) : '',
        grantedBalance: typeof item?.granted_balance === 'string' || typeof item?.granted_balance === 'number' ? String(item.granted_balance) : '',
        toppedUpBalance: typeof item?.topped_up_balance === 'string' || typeof item?.topped_up_balance === 'number' ? String(item.topped_up_balance) : ''
      })).filter((item) => item.totalBalance.length > 0)
      return { ok: true, provider, kind: 'balance', available: data?.is_available !== false, balances }
    }

    if (kind === 'r4-coder-plan') {
      const data = await fetchJson(r4MetaUrl(ctx, provider), key)
      const plan = data?.plan
      const wallet = data?.wallet
      if (plan === null || typeof plan !== 'object') {
        const remaining = finiteMoney(wallet?.balance_usd)
        return remaining > 0
          ? { ok: true, provider, kind: 'r4-plan', planName: '钱包', remaining, total: -1, unit: 'USD', extra: '' }
          : { ok: true, provider, kind: 'r4-plan', isValid: false, invalidMessage: '没有生效中的套餐或钱包余额', remaining: 0, unit: 'USD', extra: '' }
      }
      const remaining = finiteMoney(plan.remaining_usd)
      const total = finiteMoney(plan.total_usd)
      return {
        ok: true,
        provider,
        kind: 'r4-plan',
        isValid: true,
        planName: typeof plan.package_name === 'string' && plan.package_name ? plan.package_name : '套餐',
        remaining,
        total,
        used: Math.max(total - remaining, 0),
        unit: 'USD',
        extra: wallet === null || typeof wallet !== 'object' ? '' : `钱包 $${finiteMoney(wallet.balance_usd).toFixed(2)}`
      }
    }

    const data = await fetchJson('https://opencode.ai/zen/go/v1/usage', key)
    const usage = data?.usage ?? data
    return {
      ok: true,
      provider,
      kind: 'subscription',
      windows: {
        '5h': normalizeWindow(usage?.rolling),
        '7d': normalizeWindow(usage?.weekly),
        '1m': normalizeWindow(usage?.monthly)
      }
    }
  } catch {
    return { ok: false, status: 'error', provider }
  }
}

async function getProviderUsage(ctx, provider) {
  const at = Date.now()
  const hit = cache.get(provider)
  if (hit !== undefined && at - hit.at < CACHE_MS) return hit.value
  const running = pending.get(provider)
  if (running !== undefined) return running
  const work = readProviderUsage(ctx, provider).then((value) => {
    cache.set(provider, { at: Date.now(), value })
    return value
  }).finally(() => {
    pending.delete(provider)
  })
  pending.set(provider, work)
  return work
}

const inject = ['webServer']

function apply(ctx) {
  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: ROUTE_PATH,
    handler: async (req, res) => {
      if (req.method !== 'GET') {
        res.writeHead(405, { allow: 'GET' })
        res.end()
        return
      }
      const provider = providerFromRequest(req)
      if (provider === null) {
        json(res, 400, { ok: false, status: 'invalid-provider' })
        return
      }
      json(res, 200, await getProviderUsage(ctx, provider))
    }
  }), 'stats-line-pro: provider usage route')
}

export { ROUTE_PATH, apply, inject }
