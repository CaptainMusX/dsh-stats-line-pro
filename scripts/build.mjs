import { copyFile, mkdir, writeFile } from 'node:fs/promises'
import { build } from 'esbuild'

await mkdir('lib', { recursive: true })
await copyFile('src/index.js', 'lib/index.js')
await copyFile('src/format.js', 'lib/format.js')

const result = await build({
  entryPoints: ['src/client.js'],
  bundle: true,
  format: 'cjs',
  platform: 'browser',
  target: ['es2022'],
  external: ['react', 'react/jsx-runtime'],
  legalComments: 'none',
  sourcemap: false,
  write: false
})
const body = result.outputFiles[0].text
const wrapper = `window.__ModuleLoader__.load({\n  id: "dsh-stats-line-pro",\n  factory: (require) => {\n    var module = { exports: {} };\n    var exports = module.exports;\n${body}\n    return module.exports;\n  }\n});\n`
await writeFile('lib/client.js', wrapper, 'utf8')
