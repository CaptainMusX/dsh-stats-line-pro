import { memo, useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import {
  calculateConversationCost,
  deriveStats,
  formatConversationLines,
  latestProviderOf,
  providerUsageView
} from './format.js'

const STYLE_ID = 'dsh-stats-line-pro/styles'
const EMPTY_MODEL_DIRECTORY = {
  getSnapshot: () => null,
  subscribe: () => () => {}
}
const CSS = `
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
`

function installStyles() {
  if (typeof document === 'undefined' || document.querySelector(`style[data-plugin-css="${STYLE_ID}"]`) !== null) return
  const style = document.createElement('style')
  style.dataset.plugin = 'dsh-stats-line-pro'
  style.dataset.pluginCss = STYLE_ID
  style.textContent = CSS
  document.head.appendChild(style)
}

function ClockIcon() {
  return jsxs('svg', {
    'aria-hidden': true,
    'data-stats-line-pro-clock': '',
    focusable: 'false',
    viewBox: '0 0 16 16',
    width: 11,
    height: 11,
    children: [
      jsx('circle', {
        cx: 8,
        cy: 8,
        r: 6.2,
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.6,
        key: 'circle'
      }),
      jsx('path', {
        d: 'M8 4.8V8l2.6 1.6',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.6,
        strokeLinecap: 'round',
        key: 'hands'
      })
    ]
  })
}

function ProviderUsageContent({ view }) {
  if (view.kind !== 'subscription') return view.text
  const children = []
  view.windows.forEach((window) => {
    children.push(jsx('span', {
      children: `${window.label}:${window.percent}% `,
      key: `${window.label}-head`
    }))
    children.push(jsx(ClockIcon, { key: `${window.label}-clock` }))
    children.push(jsx('span', {
      children: ` ${window.countdown} `,
      key: `${window.label}-countdown`
    }))
  })
  return children
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

async function fetchSessionHistoryPage(sessionId, beforeSeq, maxMessages, signal) {
  const id = rpcId()
  const payload = { sessionId, maxMessages }
  if (beforeSeq !== undefined) payload.beforeSeq = beforeSeq
  const response = await fetch('/api/session.history', {
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
      method: 'session.history',
      payload
    })
  })
  if (!response.ok) throw new Error(`history-http-${response.status}`)
  const body = await response.json()
  if (body?.rpcId !== id || body?.result?.ok !== true || typeof body.result.value !== 'object') throw new Error('history-rpc-invalid')
  return body.result.value
}

async function loadSessionEvents(sessionId, signal) {
  const pages = []
  let beforeSeq
  for (let pageNumber = 0; pageNumber < 1000; pageNumber += 1) {
    const page = await fetchSessionHistoryPage(sessionId, beforeSeq, HISTORY_PAGE_MESSAGES, signal)
    const events = (Array.isArray(page.events) ? page.events : [])
      .map((entry) => entry?.event)
      .filter((event) => event !== null && typeof event === 'object')
    if (events.length === 0) break
    pages.push(events)
    if (page.hasMore !== true) break
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

const StatsLinePro = memo(function StatsLinePro({ useSession, useProjection, sessionId, modelDirectory }) {
  const nodes = useSession((snapshot) => snapshot.chat.legacy.nodes)
  const running = useSession((snapshot) => snapshot.running)
  const sessionStats = useProjection('sessionStats')
  const tokenUsage = useProjection('tokenUsage')
  const liveTokenUsage = useProjection('liveTokenUsage')
  const directory = modelDirectory ?? EMPTY_MODEL_DIRECTORY
  const modelState = useSyncExternalStore(
    (listener) => directory.subscribe(listener),
    () => directory.getSnapshot(),
    () => directory.getSnapshot()
  )
  const identity = useMemo(() => {
    const selected = modelState?.current
    if (selected?.provider && selected?.model) return { provider: selected.provider, model: selected.model }
    return latestProviderOf(nodes)
  }, [modelState, nodes])
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
        if (alive) setProviderResult(value)
      } catch {
        if (alive) setProviderResult({ ok: false, status: 'error', provider })
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
          const page = await fetchSessionHistoryPage(sessionId, undefined, 1, controller.signal)
          const tail = (Array.isArray(page.events) ? page.events : [])
            .map((entry) => entry?.event)
            .filter((event) => event !== null && typeof event === 'object')
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

  const costOverride = costState.status === 'ready' ? costState : null
  const lines = useMemo(() => formatConversationLines(
    sessionStats ?? deriveStats(nodes),
    tokenUsage,
    liveTokenUsage,
    provider,
    identity?.model ?? '',
    new Date(now),
    costOverride
  ), [costOverride, identity?.model, liveTokenUsage, nodes, now, provider, sessionStats, tokenUsage])
  const providerView = provider.length > 0
    ? providerUsageView(provider, providerResult ?? { status: 'loading' }, now)
    : null
  if (lines.length === 0 && providerView === null) return null

  const children = []
  const appendGroup = (content, key, kind = 'conversation') => {
    if (children.length > 0) children.push(jsx('span', {
      'aria-hidden': true,
      'data-stats-line-pro-separator': '',
      children: ' | ',
      key: `${key}-separator`
    }))
    children.push(jsx('span', {
      'data-stats-line-pro-row': kind,
      children: content,
      key
    }))
  }
  lines.forEach((line, index) => appendGroup(line, `conversation-${index}`))
  if (providerView !== null) appendGroup(
    jsx(ProviderUsageContent, { view: providerView }),
    'provider',
    'provider'
  )
  return jsx('div', {
    'aria-label': '会话统计',
    'data-stats-line-pro': '',
    'data-stats-line-pro-cost-status': costState.status,
    'data-stats-line-pro-provider': provider || undefined,
    children
  })
})

const StatsLineProDockEntry = memo((props) => jsx(StatsLinePro, {
  modelDirectory: props.modelDirectory,
  sessionId: props.sessionId,
  useProjection: props.useProjection,
  useSession: props.useSession
}))

const inject = ['slots', 'modelDirectories']

function apply(ctx) {
  installStyles()
  ctx.inject(['slots', 'modelDirectories'], (scope) => {
    scope.slots.inject('conversation.composer.dock', () => scope.slots.register({
      name: 'conversation.composer.dock',
      id: 'stats-line-pro',
      order: 200,
      inject: (sessionId) => ({
        modelDirectory: sessionId === undefined ? undefined : scope.modelDirectories.directoryFor(sessionId).store
      })
    }, StatsLineProDockEntry))
  })
}

export { StatsLinePro, StatsLineProDockEntry, apply, inject }
