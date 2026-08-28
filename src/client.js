import { memo, useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import {
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
  color: #000 !important;
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
  color: #000 !important;
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
  display: inline;
  max-width: 100%;
  overflow-wrap: anywhere;
  word-break: break-word;
}

[data-stats-line-pro-separator] {
  display: inline;
  color: #000 !important;
  margin: 0 8px;
  white-space: pre;
}

[data-stats-line-pro-row="provider"] {
  color: #000 !important;
  font-weight: inherit;
}

[data-stats-line-pro-provider-separator] {
  display: inline;
  color: #000 !important;
  white-space: pre;
}

[data-stats-line-pro-clock] {
  display: inline-block;
  width: 11px;
  height: 11px;
  margin: 0 2px;
  color: #000 !important;
  vertical-align: -1px;
}

body[data-ds-dark-theme] [data-stats-line-pro],
html[data-theme="dark"] [data-stats-line-pro],
html[data-ds-theme="dark"] [data-stats-line-pro],
html.dark [data-stats-line-pro] {
  color: #000 !important;
  text-shadow: none !important;
}

body[data-ds-dark-theme] [data-stats-line-pro-separator],
html[data-theme="dark"] [data-stats-line-pro-separator],
html[data-ds-theme="dark"] [data-stats-line-pro-separator],
html.dark [data-stats-line-pro-separator] {
  color: #000 !important;
}

@media (prefers-color-scheme: dark) {
  [data-stats-line-pro] {
    color: #000 !important;
    text-shadow: none !important;
  }
  [data-stats-line-pro-row="provider"] {
    color: #000 !important;
  }
  [data-stats-line-pro-separator] {
    color: #000 !important;
  }
  [data-stats-line-pro-provider-separator],
  [data-stats-line-pro-clock] {
    color: #000 !important;
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
  view.windows.forEach((window, index) => {
    if (index > 0) children.push(jsx('span', {
      'aria-hidden': true,
      children: ' ',
      key: `${window.label}-gap`
    }))
    children.push(jsx('span', {
      children: `${window.label}:${window.percent}%`,
      key: `${window.label}-head`
    }))
    children.push(jsx(ClockIcon, { key: `${window.label}-clock` }))
    children.push(jsx('span', {
      children: window.countdown,
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

const StatsLinePro = memo(function StatsLinePro({ useSession, useProjection, sessionId, modelDirectory }) {
  const nodes = useSession((snapshot) => snapshot.chat.legacy.nodes)
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

  const lines = useMemo(() => formatConversationLines(
    sessionStats ?? deriveStats(nodes),
    tokenUsage,
    liveTokenUsage,
    provider,
    identity?.model ?? ''
  ), [identity?.model, liveTokenUsage, nodes, provider, sessionStats, tokenUsage])
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
