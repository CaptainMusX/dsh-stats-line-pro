import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import { detailedProviderUsage, compactCostSummary } from '../src/format.js'

test('R4 plan survives JSON bridge and renders without crashing the whole stats row', () => {
  const detail = detailedProviderUsage('r4coder', { ok: true, kind: 'r4-plan', remaining: 29.89678, total: 30, planName: 'Code Mini', unit: 'USD', extra: '钱包 $5.00' })
  assert.equal(detail, 'R4 Coder：Code Mini 剩余 $29.90 / $30.00 · 钱包 $5.00')
  const compactSummary = compactCostSummary({ status: 'ready', totals: [{ currency: 'USD', amount: .2972 }], unpricedRequests: 146 })
  assert.equal(compactSummary, '累计成本 $0.30')
  const bridge = JSON.parse(JSON.stringify({ compactSummary, summary: '累计成本 $0.30（146 次未计价）', current: 'R4 Coder $29.90', quotas: [null, detail] }))
  const script = readFileSync(new URL('../scripts/patch-ui-chat-statsbar.mjs', import.meta.url), 'utf8')
  const injected = script.split('const INJECTED = `')[1].split('\n`')[0].replace('${JS_MARKER}', '')
  const element = (tag, props) => ({ tag, ...props })
  const context = vm.createContext({
    react: { useState: () => [bridge, () => {}], useEffect: () => {} },
    react_jsx_runtime: { jsx: element, jsxs: element },
    useStatDialog: () => ({ open: true, setOpen() {}, rootRef: {}, panelRef: {}, pos: {} }),
    StatsPills_module_css_default: {}, stat_dialog_module_css_default: {},
    _deepseek_ai_dsh_client_ui_primitives: {},
    react_dom: { createPortal: node => node }, document: { body: {} }, MEASURE_STYLE: {}
  })
  const result = vm.runInContext(injected + '\nQuotaPill({})', context)
  assert.equal(result.children[0]['aria-label'], '累计成本 $0.30 · R4 Coder $29.90')
  assert.match(JSON.stringify(result), /Code Mini/)
})
