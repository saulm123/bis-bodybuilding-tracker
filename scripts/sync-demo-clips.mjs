// Marks every exercise that has public/demos/<slug>/clip.mp4 as having a video
// in src/training/demos.ts. Run with `npm run demos` after adding clips.
import { existsSync, readFileSync, writeFileSync } from 'node:fs'

const file = 'src/training/demos.ts'
let src = readFileSync(file, 'utf8')
let count = 0
src = src.replace(/  d\('([a-z0-9-]+)', (\[[^\]]*\]), (\[[\s\S]*?\])(, true)?\),/g, (_m, slug, muscles, cues) => {
  const has = existsSync(`public/demos/${slug}/clip.mp4`)
  if (has) count++
  return `  d('${slug}', ${muscles}, ${cues}${has ? ', true' : ''}),`
})
writeFileSync(file, src)
console.log(`${count} exercises have video`)
