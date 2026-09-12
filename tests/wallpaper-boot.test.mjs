import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'

test('cold-start inventory failure retries without refresh and stops after disposal', async () => {
  let calls = 0
  let applied = null
  let subscriber
  const timers = new Map()
  let sequence = 0
  const wallpaper = { selection: () => 'scene', sync: value => { applied = value }, subscribe: fn => { subscriber = fn; return () => { subscriber = null } } }
  const context = vm.createContext({
    wallpaper, AbortController, AbortSignal,
    resolveSelection: (items, id) => items.find(item => item.id === id),
    setTimeout: fn => { timers.set(++sequence, fn); return sequence },
    clearTimeout: id => timers.delete(id),
    fetch: async () => { calls++; return calls === 1 ? { ok: false } : { ok: true, json: async () => ({ ok: true, wallpapers: [{ id: 'scene' }] }) } }
  })
  const script = readFileSync(new URL('../scripts/wallpaper-boot-restore.js', import.meta.url), 'utf8')
  const dispose = vm.runInContext(script + '\ninstallBootRestore(wallpaper)', context)
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(applied, null)
  assert.equal(timers.size, 1)
  const callback = [...timers.values()][0]; timers.clear(); callback()
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(applied.id, 'scene')
  assert.equal(calls, 2)
  subscriber()
  assert.equal(calls, 2)
  dispose()
  assert.equal(subscriber, null)
  assert.equal(timers.size, 0)
})
