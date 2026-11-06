// Builds the INOVAT presentation: slides.md -> site/index.html (+ assets) and site/inovat-presentation.pdf.
// Run from the presentation/ folder:  npm run build
// Needs Node 18+ and a Chrome / Edge / Chromium for the PDF (set CHROME_PATH if it is not found).
import { spawnSync } from 'node:child_process'
import { cpSync, existsSync, readdirSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const site = join(root, 'site')
const dist = join(root, 'dist')

// 2. The theme with its fonts inlined (data URIs), so HTML and PDF never depend on font files.
try { rmSync(dist, { recursive: true, force: true }) } catch {}
mkdirSync(site, { recursive: true })
for (const f of readdirSync(site)) rmSync(join(site, f), { recursive: true, force: true })
mkdirSync(dist, { recursive: true })
mkdirSync(site, { recursive: true })
let css = readFileSync(join(root, 'theme/inovat.css'), 'utf8')
css = css.replace(/url\(fonts\/([^)]+)\)/g, (_, file) => {
  const data = readFileSync(join(root, 'theme/fonts', file)).toString('base64')
  const mime = file.endsWith('.woff2') ? 'font/woff2' : 'font/ttf'
  return `url(data:${mime};base64,${data})`
})
const theme = join(dist, 'inovat.css')
writeFileSync(theme, css)

// 3. Marp: HTML and PDF.
const marp = join(root, 'node_modules/@marp-team/marp-cli/marp-cli.js')
const common = ['slides.md', '--theme', theme, '--html', '--allow-local-files']
const env = { ...process.env }
if (process.env.CHROME_PATH) env.CHROME_PATH = process.env.CHROME_PATH
function run(args, soft = false) {
  const r = spawnSync(process.execPath, [marp, ...common, ...args], { cwd: root, stdio: ['ignore', 'inherit', 'inherit'], env })
  if (r.status !== 0 && !soft) process.exit(r.status ?? 1)
  return r.status === 0
}
run(['-o', join(site, 'index.html')])
// The assets the page links to, next to index.html (before the PDF, which loads them).
cpSync(join(root, 'assets'), join(site, 'assets'), { recursive: true })
writeFileSync(join(site, '.nojekyll'), '')
const pdf = join(site, 'inovat-presentation.pdf')
// PDF: the browser prints the built HTML itself (Marp's HTML already has one-slide-per-page print
// layout). This works the same on Windows (Edge/Chrome) and on GitHub's Ubuntu runner (Chrome).
if (process.env.SKIP_PDF) {
  console.log('SKIP_PDF set: no PDF')
} else {
  const candidates = [
    process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ].filter(Boolean)
  const browser = candidates.find((c) => existsSync(c))
  if (!browser) throw new Error('No Chrome or Edge found for the PDF (set CHROME_PATH)')
  console.log('Printing PDF with', browser)
  const profile = join(tmpdir(), 'inovat-pdf-profile')
  const page = 'file:///' + join(site, 'index.html').split(String.fromCharCode(92)).join('/').replace(/^\/+/, '')
  const flags = ['--headless=new', '--disable-gpu', '--no-pdf-header-footer', '--virtual-time-budget=20000', `--user-data-dir=${profile}`, `--print-to-pdf=${pdf}`]
  if (process.env.CI) flags.push('--no-sandbox')
  spawnSync(browser, [...flags, page], { stdio: 'inherit', timeout: 240000 })
  // Windows browsers return before the file is written: wait for it.
  for (let i = 0; i < 60 && !existsSync(pdf); i++) await new Promise((r) => setTimeout(r, 1000))
}


// 5. Small additions to the browser version: a PDF link, a key hint, and the trailer playing
//    itself (with sound) when its slide opens and pausing when it closes.
const extra = `
<style>
.inovat-tools{position:fixed;top:10px;right:12px;z-index:20;display:flex;gap:8px;font:600 13px/1 'Be Vietnam Pro',system-ui,sans-serif;opacity:0;transition:opacity .25s}
body:hover .inovat-tools,.inovat-tools:focus-within{opacity:.92}
.inovat-tools a{background:rgba(21,17,13,.82);color:#F6E3A8;border:1px solid rgba(198,161,91,.7);border-radius:999px;padding:8px 14px;text-decoration:none;letter-spacing:.04em}
.inovat-tools a:hover{background:#15110d;color:#fff}
.inovat-tools .hint{background:rgba(21,17,13,.6);color:rgba(243,235,221,.85);border-radius:999px;padding:8px 12px;border:1px solid rgba(198,161,91,.35)}
.inovat-zone{position:fixed;top:0;bottom:0;width:50%;z-index:5;pointer-events:none}
.inovat-zone.l{left:0;cursor:w-resize}.inovat-zone.r{right:0;cursor:e-resize}
@media print{.inovat-tools,.inovat-zone{display:none}}
:root{--marp-bespoke-transition-animation-duration:.45s}
::view-transition-group(*){animation-timing-function:cubic-bezier(.65,0,.25,1)}
</style>
<div class="inovat-tools"><span class="hint">Bấm bên phải: tiếp · bên trái: lùi · F: toàn màn hình · P: ghi chú</span><a href="script.html" target="_blank">Kịch bản</a><a href="inovat-presentation.pdf" download>Tải bản PDF</a></div>
<script>
(function(){
  function sync(){
    document.querySelectorAll('video[data-autoplay]').forEach(function(v){
      var s=v.closest('section');
      var active=s&&s.classList.contains('bespoke-marp-active');
      if(active&&!v.dataset.played){v.dataset.played='1';v.currentTime=0;v.play().catch(function(){});}
      if(!active&&v.dataset.played){v.pause();delete v.dataset.played;}
    });
  }
  new MutationObserver(sync).observe(document.body,{attributes:true,subtree:true,attributeFilter:['class']});
  sync();
  // Click the right half of the screen for the next slide, the left half for the previous one.
  document.addEventListener('click',function(e){
    if(e.target.closest('video,a,button,input,.inovat-tools,.bespoke-marp-osc'))return;
    var b=document.querySelector('[data-bespoke-marp-osc="'+(e.clientX>window.innerWidth/2?'next':'prev')+'"]');
    if(b)b.click();
  });
  document.addEventListener('mousemove',function(e){
    document.body.style.cursor=e.clientX>window.innerWidth/2?'e-resize':'w-resize';
  });
})();
</script>`
// Plain pages for the script and the Q&A bank, readable on a phone.
function mdToHtml(md) {
  const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const inline = (t) => esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/`([^`]+)`/g, '<code>$1</code>')
  return md.split(/\r?\n/).map((l) => {
    if (/^---+$/.test(l)) return '<hr>'
    const h = l.match(/^(#{1,3}) (.*)/)
    if (h) return `<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`
    if (/^- /.test(l)) return `<li>${inline(l.slice(2))}</li>`
    return l.trim() ? `<p>${inline(l)}</p>` : ''
  }).join('\n')
}
for (const [file, name, title] of [['speaking-script.md', 'script.html', 'Kịch bản nói INOVAT'], ['qa-bank.md', 'qa.html', 'Ngân hàng câu hỏi INOVAT']]) {
  const body = mdToHtml(readFileSync(join(root, 'notes', file), 'utf8'))
  writeFileSync(join(site, name), `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>body{font:20px/1.6 'Segoe UI',system-ui,sans-serif;max-width:760px;margin:0 auto;padding:20px 18px 80px;background:#F3EBDD;color:#332D27}h1{font-family:Georgia,serif;font-size:30px}h2{font-family:Georgia,serif;font-size:24px;margin-top:34px;color:#702F35;border-top:2px solid #C6A15B;padding-top:14px}p{margin:10px 0}code{background:#E9DFC9;padding:1px 5px;border-radius:3px}a{color:#702F35}</style></head><body><p><a href="./">← Về bài thuyết trình</a></p>${body}</body></html>`)
}
const indexPath = join(site, 'index.html')
let html = readFileSync(indexPath, 'utf8')
html = html.replace('</body>', extra + '</body>')
writeFileSync(indexPath, html)
if (!process.env.SKIP_PDF && !existsSync(join(site, 'inovat-presentation.pdf'))) throw new Error('PDF was not produced')
console.log('Built presentation/site')
