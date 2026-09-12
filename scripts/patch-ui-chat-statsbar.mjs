#!/usr/bin/env node
// patch-ui-chat-statsbar.mjs
// Idempotent patch for @deepseek-ai/dsh-client-ui-chat StatsPills:
//  1. Card-fill styling for the composer stats row (matches the composer input
//     card: same --dsw-specific-input-major fill, 22px radius, soft elevation
//     shadow, no backdrop blur) plus a comfortable 10px gap below the card.
//  2. A conversation cost + provider balance pill fed by the plugin's
//     data-stats-cost-bridge, with a guarded JSON-to-render boundary.
// Run: node patch-ui-chat-statsbar.mjs [path-to-ui-chat-client.js]
// Safe to re-run: markers make it idempotent; first run backs up.

import { readFileSync, writeFileSync, existsSync, copyFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const DEFAULT_TARGET = join(HERE, 'ui-chat-client.js')
const TARGET = process.argv[2] || DEFAULT_TARGET

if (!existsSync(TARGET)) {
  console.error('target not found:', TARGET)
  process.exit(1)
}

let src = readFileSync(TARGET, 'utf8')

// ---------- 0. backup ----------
const BACKUP = TARGET + '.dsh-statsbar.bak'
if (!existsSync(BACKUP)) {
  copyFileSync(TARGET, BACKUP)
  console.log('backup written:', BACKUP)
}

// ---------- 1. CSS: card fill + spacing ----------
const CSS_MARKER = '/* dsh-statsbar-fill-v2 */'
const EXTRA_CSS =
  '/* dsh-statsbar-fill-v2 */' +
  '.bOPqQW_root{' +
  '--dsh-composer-accessory-bg:var(--dsw-specific-input-major,var(--dsw-alias-bg-layer-1));' +
  '--dsh-composer-accessory-radius:22px;' +
  '--dsh-composer-accessory-shadow:var(--dsw-elevation-soft);' +
  '--dsh-composer-accessory-blur:var(--dsh-input-card-blur,10px);' +
  '--dsh-composer-accessory-border:none;' +
  '--dsh-composer-accessory-color:var(--dsw-alias-label-tertiary);' +
  '--dsw-elevation-stroke-color:var(--dsw-alias-border-l2);' +
  'max-width:var(--dsh-composer-card-max-width,var(--dsh-chat-content-width));' +
  'margin:10px auto 0;' +
  'padding:6px 14px;' +
  'border-radius:22px;' +
  'flex-wrap:nowrap!important;' +
  'overflow-x:auto;' +
  'overflow-y:hidden;' +
  'scrollbar-width:none;' +
  'align-items:center}' +
  "div[data-slot='conversation.composer.dock'] > [data-composer-stats]{" +
  'width:100%!important;' +
  'max-width:var(--dsh-composer-card-max-width,var(--dsh-chat-content-width))!important;' +
  'flex:1 1 auto!important;' +
  'margin:10px auto 0!important;' +
  'padding:6px 14px 6px!important;' +
  'justify-content:center;' +
  'flex-wrap:nowrap!important;' +
  'overflow-x:auto;' +
  'overflow-y:hidden;' +
  'scrollbar-width:none}'

if (src.includes(CSS_MARKER)) {
  console.log('[css] already patched')
} else {
  const previousMarker = '/* dsh-statsbar-fill */'
  if (src.includes(previousMarker)) {
    src = src.replace(previousMarker, previousMarker + EXTRA_CSS)
    console.log('[css] upgraded (single-line compact layout)')
  } else {
  const ANCHOR = 'margin:0 6px}";'
  const at = src.indexOf(ANCHOR)
  if (at < 0) {
    console.error('[css] anchor not found (StatsPills css closing)')
    process.exit(1)
  }
  src = src.slice(0, at) + 'margin:0 6px}' + EXTRA_CSS + '";' + src.slice(at + ANCHOR.length)
  console.log('[css] patched (card fill + spacing)')
  }
}

// ---------- 2. JS: third pill ----------
const JS_MARKER = '/* dsh-statsbar-third-pill */'
const INJECTED = `
${JS_MARKER}
function QuotaPill({ t, dialog }) {
  const { open, setOpen, rootRef, panelRef, pos } = useStatDialog(dialog);
  const [data, setData] = (0, react.useState)(null);
  (0, react.useEffect)(() => {
    let previous;
    const refresh = () => {
      const dock = rootRef.current?.closest('[data-slot="conversation.composer.dock"]');
      const raw = dock?.querySelector('[data-stats-cost-bridge]')?.getAttribute('data-stats-cost-bridge') || null;
      if (raw === previous) return;
      previous = raw;
      try { setData(raw ? JSON.parse(raw) : null); } catch { setData(null); }
    };
    refresh();
    const timer = setInterval(refresh, 500);
    return () => clearInterval(timer);
  }, []);
  const label = data ? (data.compactSummary || "累计成本 暂无") + " · " + data.current : "累计成本读取中…";
  const rows = [];
  const row = (name, value, key) => {
    rows.push((0, react_jsx_runtime.jsx)("dt", { children: name, key: "t" + key }));
    rows.push((0, react_jsx_runtime.jsx)("dd", { children: value, key: "d" + key }));
  };
  row("累计成本（估算）", data?.summary || "读取中…", "total");
  (data?.rows || []).forEach((item, i) => row(item.label, item.value, "cost" + i));
  (data?.quotas || []).forEach((value, i) => {
    if (typeof value !== "string") return;
    const split = value.search(/[：:]/);
    row(split < 0 ? "供应商余量" : value.slice(0, split), split < 0 ? value : value.slice(split + 1), "quota" + i);
  });
  return (0, react_jsx_runtime.jsxs)("span", {
    ref: rootRef,
    className: StatsPills_module_css_default.anchor,
    children: [
      (0, react_jsx_runtime.jsxs)("button", {
        type: "button",
        className: StatsPills_module_css_default.pill,
        "aria-haspopup": "dialog",
        "aria-expanded": open,
        "aria-label": label,
        onClick: () => {
          setOpen(!open);
        },
        children: [
          (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconDatabaseOutline16, {}),
          (0, react_jsx_runtime.jsx)("span", {
            className: StatsPills_module_css_default.label,
            children: label
          })
        ]
      }),
      open && (0, react_dom.createPortal)((0, react_jsx_runtime.jsxs)("div", {
        ref: panelRef,
        className: stat_dialog_module_css_default.panel,
        role: "dialog",
        "aria-label": "累计成本与余额",
        style: pos ?? MEASURE_STYLE,
        children: [
          (0, react_jsx_runtime.jsx)("div", {
            className: stat_dialog_module_css_default.title,
            children: (0, react_jsx_runtime.jsxs)("span", {
              className: stat_dialog_module_css_default.titleLabel,
              children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconDatabaseOutline16, {}), "累计成本与余额"]
            })
          }),
          (0, react_jsx_runtime.jsx)("div", {
            className: stat_dialog_module_css_default.titleRule,
            "aria-hidden": true
          }),
          (0, react_jsx_runtime.jsxs)("dl", {
            className: stat_dialog_module_css_default.details,
            "data-session-stats-quota": true,
            children: rows
          })
        ]
      }), document.body)
    ]
  });
}
`

if (src.includes(JS_MARKER)) {
  const start = src.indexOf(JS_MARKER);
  const end = src.indexOf('const StatsPills = (0, react.memo)(function StatsPills', start);
  if (end < 0) throw new Error('StatsPills upgrade anchor missing');
  src = src.slice(0, start) + INJECTED.trimStart() + '\n' + src.slice(end);
  console.log('[js] conversation cost pill updated');
} else {
  const ANCHOR = 'const StatsPills = (0, react.memo)(function StatsPills({ useChat, useProjection, t }) {'
  const at = src.indexOf(ANCHOR)
  if (at < 0) {
    console.error('[js] StatsPills anchor not found')
    process.exit(1)
  }
  src = src.slice(0, at) + INJECTED + '\n' + src.slice(at)
  console.log('[js] third pill injected')
}

// ---------- 3. JS: render QuotaPill in StatsPills children ----------
if (src.includes('openPill === "quota"')) {
  console.log('[render] QuotaPill already rendered')
} else {
  const usageClose = src.indexOf('setOpenPill(open ? "usage" : null);')
  if (usageClose < 0) {
    console.error('[render] UsagePill dialog anchor not found')
    process.exit(1)
  }
  const childrenClose = src.indexOf('})]', usageClose)
  if (childrenClose < 0) {
    console.error('[render] StatsPills children close not found')
    process.exit(1)
  }
  const QUOTA_ENTRY = `}), (0, react_jsx_runtime.jsx)(QuotaPill, {
				t,
				dialog: {
					open: openPill === "quota",
					setOpen: (open) => {
						setOpenPill(open ? "quota" : null);
					}
				}
			})]`
  src = src.slice(0, childrenClose) + QUOTA_ENTRY + src.slice(childrenClose + '})]'.length)
  console.log('[render] QuotaPill added to the stats row')
}

writeFileSync(TARGET, src)
console.log('written:', TARGET, '(' + src.length + ' bytes)')
