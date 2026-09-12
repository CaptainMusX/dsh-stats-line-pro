import { memo, useEffect, useMemo, useState } from 'react'
import { jsx } from 'react/jsx-runtime'
import {
  calculateConversationCost,
  compactProviderUsage,
  compactCostSummary,
  detailedProviderUsage,
  conversationCostView,
  latestProviderOf
} from './format.js'

const STYLE_ID = 'dsh-stats-line-pro/styles'
const CSS = `
html body [data-slot="conversation.composer.dock"] > [data-composer-stats] {
  column-gap: 4px !important;
  row-gap: 0 !important;
  padding: 4px 10px !important;
  flex-wrap: wrap !important;
}
[data-composer-stats] > span { margin: 0 !important; }
[data-composer-stats] button { line-height: 20px; padding: 1px 6px; }
[data-slot="conversation.composer.dock"] > [data-dsh-live-tps],
[data-slot="conversation.composer.dock"] > [data-stats-line],
[data-slot="conversation.composer.dock"] > [data-stats-cost-bridge] {
  display: none !important;
}
`

function installStyles() {
  if (typeof document === 'undefined' || document.querySelector(`style[data-plugin-css="${STYLE_ID}"]`) !== null) return
  const style = document.createElement('style')
  style.dataset.plugin = 'dsh-stats-line-pro'
  style.dataset.pluginCss = STYLE_ID
  style.textContent = CSS
  document.head.appendChild(style)
}

async function fetchProviderUsage(provider, signal) {
  const response = await fetch(`/stats-line-pro/provider-usage?provider=${encodeURIComponent(provider)}`, {
    cache: 'no-store',
    signal
  })
  if (!response.ok) throw new Error(`usage-http-${response.status}`)
  return response.json()
}

const HISTORY_PAGE_MESSAGES = 50

function rpcId() {
  const cryptoObject = typeof globalThis === 'undefined' ? undefined : globalThis.crypto
  if (typeof cryptoObject?.randomUUID === 'function') return cryptoObject.randomUUID()
  return `dsh-stats-line-pro-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

/* The runtime serves Session history through the generated `session/page` Remote
   (channel `/api`, method `session/page`, payload `{ args: { request } }`).
   `throughSeq` must not pass the session cursor, and the only way to learn the
   cursor without opening a stream is the rejection message itself, so the first
   call probes past the cursor and retries with the reported value. */
const HISTORY_CURSOR_PATTERN = /past cursor\s+(\d+)/u
const sessionCursors = new Map()

function cursorFromMessage(message) {
  const match = HISTORY_CURSOR_PATTERN.exec(typeof message === 'string' ? message : '')
  if (match === null) return null
  const cursor = Number(match[1])
  return Number.isSafeInteger(cursor) && cursor >= 0 ? cursor : null
}

async function callSessionPage(sessionId, request, signal) {
  const id = rpcId()
  const response = await fetch('/api/session/page', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json'
    },
    cache: 'no-store',
    signal,
    body: JSON.stringify({
      type: 'client-request',
      rpcId: id,
      method: 'session/page',
      payload: { args: { request } }
    })
  })
  if (!response.ok) throw new Error(`history-http-${response.status}`)
  const body = await response.json()
  if (body?.rpcId !== id || typeof body.result !== 'object' || body.result === null) throw new Error('history-rpc-invalid')
  if (body.result.ok !== true) {
    const message = body.result.error?.message
    return { ok: false, message: typeof message === 'string' ? message : 'history-rpc-failed' }
  }
  const value = body.result.value
  if (typeof value !== 'object' || value === null) throw new Error('history-rpc-invalid')
  return { ok: true, value }
}

async function resolveSessionCursor(sessionId, signal, fresh) {
  const cached = sessionCursors.get(sessionId)
  if (!fresh && Number.isSafeInteger(cached)) return cached
  const address = { kind: 'session', sessionId }
  const probe = await callSessionPage(sessionId, { address, throughSeq: Number.MAX_SAFE_INTEGER, maxMessages: 1 }, signal)
  if (probe.ok) {
    const seq = probe.value.records?.[probe.value.records.length - 1]?.event?.seq
    const cursor = Number.isSafeInteger(seq) ? seq : 0
    sessionCursors.set(sessionId, cursor)
    return cursor
  }
  const cursor = cursorFromMessage(probe.message)
  if (cursor === null) throw new Error(`history-rpc-failed:${probe.message}`)
  sessionCursors.set(sessionId, cursor)
  return cursor
}

async function fetchSessionHistoryPage(sessionId, beforeSeq, maxMessages, signal, fresh) {
  const address = { kind: 'session', sessionId }
  const throughSeq = await resolveSessionCursor(sessionId, signal, fresh)
  const request = { address, throughSeq, maxMessages }
  if (beforeSeq !== undefined) request.beforeSeq = beforeSeq
  const attempt = await callSessionPage(sessionId, request, signal)
  if (!attempt.ok) throw new Error(`history-rpc-failed:${attempt.message}`)
  const records = Array.isArray(attempt.value.records) ? attempt.value.records : []
  const events = records
    .map((entry) => entry?.event)
    .filter((event) => event !== null && typeof event === 'object')
  return { events, hasMore: attempt.value.hasMore === true }
}

async function loadSessionEvents(sessionId, signal, afterSeq) {
  const pages = []
  let beforeSeq
  for (let pageNumber = 0; pageNumber < 1000; pageNumber += 1) {
    const page = await fetchSessionHistoryPage(sessionId, beforeSeq, HISTORY_PAGE_MESSAGES, signal, pageNumber === 0)
    const events = page.events
    if (events.length === 0) break
    pages.push(events)
    if (page.hasMore !== true || (Number.isSafeInteger(afterSeq) && events[0]?.seq <= afterSeq)) break
    const nextBeforeSeq = events[0]?.seq
    if (!Number.isSafeInteger(nextBeforeSeq) || (beforeSeq !== undefined && nextBeforeSeq >= beforeSeq)) throw new Error('history-pagination-invalid')
    beforeSeq = nextBeforeSeq
    if (pageNumber === 999) throw new Error('history-too-many-pages')
  }
  return pages.reverse().flat()
}

function mergeHistoryTail(existing, incoming) {
  if (incoming.length === 0) return existing
  if (existing.length === 0) return incoming
  const firstSeq = incoming[0]?.seq
  if (!Number.isSafeInteger(firstSeq)) return existing
  let low = 0
  let high = existing.length
  while (low < high) {
    const middle = Math.floor((low + high) / 2)
    if ((existing[middle]?.seq ?? 0) < firstSeq) low = middle + 1
    else high = middle
  }
  if (low === existing.length) return existing.concat(incoming)
  if (existing[low]?.seq === firstSeq) return existing.slice(0, low).concat(incoming)
  const merged = new Map(existing.map((event) => [event.seq, event]))
  incoming.forEach((event) => merged.set(event.seq, event))
  return [...merged.values()].sort((left, right) => (left.seq ?? 0) - (right.seq ?? 0))
}

const StatsLinePro = memo(function StatsLinePro({ useSession, useProjection, sessionId }) {
  const nodes = useSession((snapshot) => snapshot?.chat?.legacy?.nodes ?? snapshot?.legacy?.nodes ?? [])
  const running = useSession((snapshot) => snapshot?.running ?? false)
  const selected = useProjection('modelSelection')
  const identity = useMemo(() => selected?.next?.provider ? selected.next : selected?.provider ? selected : latestProviderOf(nodes), [nodes, selected])
  const provider = identity?.provider ?? ''
  const [providerResult, setProviderResult] = useState(null)
  const [costState, setCostState] = useState({ status: 'loading' })
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!provider) {
      setProviderResult(null)
      return undefined
    }
    let alive = true
    let timer
    const controller = new AbortController()
    const refresh = async () => {
      if (alive) setProviderResult({ status: 'loading' })
      try {
        const value = await fetchProviderUsage(provider, controller.signal)
        if (alive) setProviderResult({ forProvider: provider, payload: value })
      } catch {
        if (alive) setProviderResult({ forProvider: provider, payload: { ok: false, status: 'error' } })
      }
    }
    void refresh()
    timer = setInterval(() => void refresh(), 60_000)
    return () => {
      alive = false
      controller.abort()
      clearInterval(timer)
    }
  }, [provider, sessionId])

  useEffect(() => {
    if (typeof sessionId !== 'string' || sessionId.length === 0) {
      setCostState({ status: 'ready', ...calculateConversationCost([]) })
      return undefined
    }
    let alive = true
    let busy = false
    let cachedEvents = null
    const controller = new AbortController()
    const refresh = async (full) => {
      if (!alive || busy) return
      busy = true
      try {
        if (full || cachedEvents === null) cachedEvents = await loadSessionEvents(sessionId, controller.signal)
        else {
          // Page backward to the prior tail so no intervening messages are skipped.
          const tail = await loadSessionEvents(sessionId, controller.signal, cachedEvents.at(-1)?.seq)
          cachedEvents = mergeHistoryTail(cachedEvents, tail)
        }
        if (alive) setCostState({ status: 'ready', ...calculateConversationCost(cachedEvents, Date.now()) })
      } catch (error) {
        if (alive && error?.name !== 'AbortError') setCostState({ status: 'error' })
      } finally {
        busy = false
      }
    }
    setCostState({ status: 'loading' })
    void refresh(true)
    const timer = running ? setInterval(() => void refresh(false), 5_000) : undefined
    return () => {
      alive = false
      controller.abort()
      if (timer !== undefined) clearInterval(timer)
    }
  }, [running, sessionId])

  const costView = useMemo(() => conversationCostView(costState), [costState])
  const [usedResults, setUsedResults] = useState({})
  const usedKey = JSON.stringify(costView.providers)
  useEffect(() => {
    const controller = new AbortController()
    let alive = true
    const refresh = async () => {
      const results = await Promise.all(JSON.parse(usedKey).map(async id => {
        try { return [id, await fetchProviderUsage(id, controller.signal)] }
        catch { return [id, { status: 'error' }] }
      }))
      if (alive) setUsedResults(Object.fromEntries(results))
    }
    void refresh()
    const timer = setInterval(() => void refresh(), 60000)
    return () => { alive = false; controller.abort(); clearInterval(timer) }
  }, [usedKey, sessionId])
  const currentResult = providerResult?.forProvider === provider ? providerResult.payload : null
  const data = {
    summary: costView.summary,
    compactSummary: compactCostSummary(costState),
    current: provider ? compactProviderUsage(provider, currentResult, now) : '当前供应商 暂无',
    rows: costView.rows,
    quotas: costView.providers.map(id => detailedProviderUsage(id, id === provider ? currentResult : usedResults[id], now))
  }
  return jsx('span', {
    hidden: true,
    style: { display: 'none' },
    'data-stats-cost-bridge': JSON.stringify(data),
    'data-stats-line-pro-cost-status': costState.status
  })
})

const StatsLineProDockEntry = memo((props) => jsx(StatsLinePro, {
  key: props.sessionId,
  sessionId: props.sessionId,
  useProjection: props.useProjection,
  useSession: props.useSession
}))

const inject = ['slots']

function apply(ctx) {
  installStyles()
  ctx.inject(['slots'], (scope) => {
    scope.slots.inject('conversation.composer.dock', () => scope.slots.register({
      name: 'conversation.composer.dock',
      id: 'stats-line-pro',
      order: 200,
      inject: () => ({})
    }, StatsLineProDockEntry))
  })
}

export { StatsLinePro, StatsLineProDockEntry, apply, inject }
