import { readFileSync, writeFileSync, copyFileSync, existsSync } from 'node:fs'
const target = process.argv[2]
let source = readFileSync(target, 'utf8')
const replacement = readFileSync(new URL('./wallpaper-boot-restore.js', import.meta.url), 'utf8').trim()
const from = source.indexOf('function installBootRestore(wallpaper) {')
const to = source.indexOf('\n\t\t//#endregion', from)
if (from < 0 || to < 0) throw new Error('Wallpaper boot anchors missing')
const backup = target + '.wallpaper-boot-retry.bak'
if (!existsSync(backup)) copyFileSync(target, backup)
source = source.slice(0, from) + replacement + source.slice(to)
source = source.replace('\t\t\tinstallBootRestore(wallpaper);', '\t\t\tctx.effect(() => installBootRestore(wallpaper), "ui-skin-center: boot restore retry");')
writeFileSync(target, source)
console.log('Wallpaper boot retry applied:', target)
