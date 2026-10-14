import './style.css'

// Standalone Code Studio — opens straight in (no login). Projects are kept in this
// browser (localStorage). Use "Download backup" to move them to another computer.
const app = document.querySelector('#app')
const STORAGE_KEY = 'code-studio-projects-v1'
const settings = {
  accent: '#e53935',
  eyebrow_bg: '#e53935',
  button_bg: '#e53935',
  dash_color: '#e53935',
  fonts: 'Oswald\nInter\nArial\nGeorgia\nImpact\nMontserrat\nRoboto\nOpen Sans\nPoppins\nLato\nBebas Neue\nAnton\nBarlow\nBarlow Condensed\nRoboto Condensed\nPlayfair Display\nMerriweather'
}

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag)
  for (const [name, value] of Object.entries(attrs)) {
    if (name === 'text') node.textContent = value
    else if (name === 'class') node.className = value
    else if (name.startsWith('on')) node.addEventListener(name.slice(2), value)
    else node.setAttribute(name, value)
  }
  for (const child of children) node.append(child)
  return node
}
function message(target, text, error = false) {
  target.textContent = text
  target.classList.toggle('error', error)
}
function download(name, content) {
  const a = el('a', { href: URL.createObjectURL(new Blob([content], { type: 'application/json' })), download: name })
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}
function language(value) { return ['en', 'fr', 'us'].includes(value) ? value : 'en' }
function editorHref(id, lang = 'en') { return '#/edit/' + encodeURIComponent(id) + '/' + language(lang) }

// ---------- local project store ----------
function projects() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
}
function persist(rows) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(rows)) }
  catch { throw new Error('This browser is out of storage space. Use image links instead of uploads, or download a backup and delete old projects.') }
}
function addProject(fields) {
  const row = { id: crypto.randomUUID(), title: 'New Banner', en: [], fr: null, us: null, ...fields, updated_at: new Date().toISOString() }
  const rows = projects(); rows.push(row); persist(rows)
  return row
}
function updateProject(id, fields) {
  const rows = projects()
  const row = rows.find(item => item.id === id)
  if (!row) throw new Error('Project not found.')
  Object.assign(row, fields, { updated_at: new Date().toISOString() })
  persist(rows)
}
function deleteProject(id) { persist(projects().filter(item => item.id !== id)) }

async function seedSample() {
  if (localStorage.getItem(STORAGE_KEY) !== null) return
  try {
    const sample = await (await fetch(import.meta.env.BASE_URL + 'sample-project.json')).json()
    persist([])
    addProject({ title: sample.title, en: sample.en })
  } catch { persist([]) }
}

// ---------- dashboard ----------
function dashboard() {
  document.body.className = ''
  app.replaceChildren()
  const status = el('p', { class: 'status', role: 'status' })
  const grid = el('div', { class: 'banner-grid' })
  const importInput = el('input', { type: 'file', accept: '.json,application/json', hidden: '', onchange: async () => {
    const file = importInput.files?.[0]
    if (!file) return
    try {
      const parsed = JSON.parse(await file.text())
      const list = Array.isArray(parsed?.projects) ? parsed.projects : [parsed]
      for (const project of list) {
        const en = Array.isArray(project) ? project : (project.en || project.slides || project.data)
        if (!Array.isArray(en) || !en.length) throw new Error('Expected project JSON with a nonempty slides array.')
        addProject({
          title: String(project.title || file.name.replace(/\.json$/i, '')).slice(0, 200),
          en, fr: Array.isArray(project.fr) ? project.fr : null, us: Array.isArray(project.us) ? project.us : null
        })
      }
      dashboard()
    } catch (error) { message(status, 'Import failed: ' + error.message, true) }
    importInput.value = ''
  } })
  app.append(el('div', { class: 'dashboard' }, [
    el('aside', { class: 'sidebar' }, [
      el('div', { class: 'brand', text: 'CODE STUDIO' }),
      el('div', { class: 'nav-active', text: 'Banners' }),
      el('div', { class: 'signed-in', text: 'Projects are saved in this browser' })
    ]),
    el('main', { class: 'content' }, [
      el('div', { class: 'heading', text: 'WORKSPACE' }),
      el('h1', { text: 'Banner projects' }),
      el('p', { text: 'Create, edit and export desktop and mobile banners.' }),
      el('div', { class: 'toolbar' }, [
        el('button', { text: '+ New banner', onclick: () => {
          try { location.hash = editorHref(addProject({}).id).slice(1) } catch (error) { message(status, error.message, true) }
        } }),
        el('button', { class: 'secondary', text: 'Import project JSON', onclick: () => importInput.click() }),
        el('button', { class: 'secondary', text: 'Download backup', onclick: () => {
          download('code-studio-backup-' + new Date().toISOString().slice(0, 10) + '.json',
            JSON.stringify({ format: 'code-studio-backup-v1', projects: projects().map(({ title, en, fr, us }) => ({ title, en, fr, us })) }, null, 2))
        } })
      ]),
      status, grid, importInput
    ])
  ]))
  const rows = projects().sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at)))
  if (!rows.length) grid.append(el('div', { class: 'empty', text: 'No banners yet. Create one or import a project JSON backup.' }))
  for (const row of rows) {
    const actions = el('div', { class: 'actions' })
    for (const [code, label] of [['en', 'Edit English'], ['fr', 'Edit French'], ['us', 'Edit USA']])
      actions.append(el('a', { href: editorHref(row.id, code), text: label, class: code === 'en' ? 'button' : 'button secondary' }))
    actions.append(
      el('button', { class: 'secondary', text: 'Duplicate', onclick: () => {
        try { addProject({ title: row.title + ' Copy', en: row.en, fr: row.fr, us: row.us }); dashboard() }
        catch (error) { message(status, error.message, true) }
      } }),
      el('button', { class: 'danger', text: 'Delete', onclick: () => {
        if (!confirm('Delete this banner project? Download a backup first if you need one.')) return
        deleteProject(row.id); dashboard()
      } })
    )
    grid.append(el('article', { class: 'card' }, [
      el('h2', { text: row.title }),
      el('p', { text: 'Updated ' + new Date(row.updated_at).toLocaleString() }),
      el('div', { class: 'tags', text: 'EN' + (row.fr ? ' · FR' : '') + (row.us ? ' · USA' : '') }),
      actions
    ]))
  }
}

// ---------- editor ----------
function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

function edit(id, lang) {
  const row = projects().find(item => item.id === id)
  if (!row) {
    app.replaceChildren(el('div', { class: 'login-card' }, [
      el('h1', { text: 'Banner not found' }),
      el('p', { text: 'It may have been deleted, or it was saved in a different browser.' }),
      el('a', { href: '#/', text: 'Back to banners' })
    ]))
    return
  }
  const slides = row[lang]?.length ? row[lang] : row.en
  app.replaceChildren(el('div', { id: 'jcs-root' }))
  document.body.className = 'jcs-editor-body'
  if (!document.querySelector('#editor-css')) document.head.append(el('link', { id: 'editor-css', rel: 'stylesheet', href: import.meta.env.BASE_URL + 'editor.css?version=redesign-2' }))
  window.JCS_EDITOR_DATA = {
    postId: row.id, title: row.title, slides: JSON.parse(JSON.stringify(slides || [])),
    language: lang, languageLabel: { en: 'English', fr: 'French', us: 'USA' }[lang],
    listUrl: '#/', englishUrl: editorHref(id, 'en'), frenchUrl: editorHref(id, 'fr'), usaUrl: editorHref(id, 'us'),
    settings,
    upload: async file => {
      if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.type)) throw new Error('Choose a PNG, JPEG, WebP or GIF image.')
      if (file.size > 2 * 1024 * 1024) throw new Error('Images saved in the browser must be under 2 MB. Use an image link for bigger pictures.')
      return readAsDataUrl(file)
    },
    save: async ({ title, data }) => {
      const cleanTitle = title.trim()
      if (!cleanTitle || cleanTitle.length > 200) throw new Error('Title must be 1–200 characters.')
      if (!Array.isArray(data) || !data.length) throw new Error('A banner needs at least one slide.')
      updateProject(id, { title: cleanTitle, [lang]: data })
    }
  }
  const old = document.getElementById('editor-js')
  if (old) old.remove()
  app.append(el('script', { id: 'editor-js', src: import.meta.env.BASE_URL + 'editor.js?version=redesign-2' }))
}

function route() {
  const match = location.hash.match(/^#\/edit\/([0-9a-f-]{36})\/(en|fr|us)$/i)
  if (match) edit(match[1], language(match[2]))
  else dashboard()
}
window.addEventListener('hashchange', () => {
  // The editor registers document-wide listeners. Reload between
  // projects/languages so a previous editor can never save stale slides.
  if (document.getElementById('editor-js')) location.reload()
  else route()
})
seedSample().then(route)
