import './style.css'

const app = document.querySelector('#app')
const STORAGE_KEY = 'code-studio-projects-v1'
function projects() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] } }
function persist(rows) { localStorage.setItem(STORAGE_KEY, JSON.stringify(rows)) }
function saveProject(row) {
  const rows = projects()
  const index = rows.findIndex(item => item.id === row.id)
  if (index < 0) rows.push(row)
  else rows[index] = row
  persist(rows)
  return row
}
function imageStore() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('code-studio-images', 1)
    request.onupgradeneeded = () => request.result.createObjectStore('images')
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}
async function storeImage(image) {
  const database = await imageStore()
  const id = crypto.randomUUID()
  await new Promise((resolve, reject) => {
    const transaction = database.transaction('images', 'readwrite')
    transaction.objectStore('images').put(image, id)
    transaction.oncomplete = resolve
    transaction.onerror = () => reject(transaction.error)
  })
  return id
}
async function loadImage(id) {
  const database = await imageStore()
  return new Promise((resolve, reject) => {
    const request = database.transaction('images').objectStore('images').get(id)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}
const settings = {
  accent: '#e53935',
  eyebrow_bg: '#e53935',
  button_bg: '#e53935',
  dash_color: '#e53935',
  fonts: 'Oswald\nInter\nArial\nGeorgia\nImpact\nMontserrat\nRoboto\nOpen Sans\nPoppins\nLato\nBebas Neue\nAnton\nBarlow Condensed\nRoboto Condensed\nPlayfair Display\nMerriweather'
}
let currentUser = null
const imageUrls = new Map()
async function displayImages(value) {
  if (typeof value === 'string' && value.startsWith('code-studio-image:')) {
    const image = await loadImage(value.slice('code-studio-image:'.length))
    if (!image) return ''
    const objectUrl = URL.createObjectURL(image)
    imageUrls.set(objectUrl, value)
    return objectUrl
  }
  if (Array.isArray(value)) return Promise.all(value.map(displayImages))
  if (value && typeof value === 'object') {
    const entries = await Promise.all(Object.entries(value).map(async ([key, item]) => [key, await displayImages(item)]))
    return Object.fromEntries(entries)
  }
  return value
}
function savedImages(value) {
  if (typeof value === 'string') return imageUrls.get(value) || value
  if (Array.isArray(value)) return value.map(savedImages)
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, savedImages(item)]))
  return value
}
async function portableImages(value, importing = false) {
  if (typeof value === 'string') {
    if (!importing && value.startsWith('code-studio-image:')) {
      const blob = await loadImage(value.slice('code-studio-image:'.length))
      if (!blob) throw new Error('An image is missing from this browser.')
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.onerror = () => reject(reader.error)
        reader.readAsDataURL(blob)
      })
    }
    if (importing && /^data:image\/(png|jpeg|webp|gif);base64,/.test(value)) {
      const blob = await fetch(value).then(response => response.blob())
      return 'code-studio-image:' + await storeImage(blob)
    }
  }
  if (Array.isArray(value)) return Promise.all(value.map(item => portableImages(item, importing)))
  if (value && typeof value === 'object') {
    const entries = await Promise.all(Object.entries(value).map(async ([key, item]) => [key, await portableImages(item, importing)]))
    return Object.fromEntries(entries)
  }
  return value
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
function check({ data, error }) {
  if (error) throw error
  return data
}
function download(name, content) {
  const a = el('a', { href: URL.createObjectURL(new Blob([content], { type: 'application/json' })), download: name })
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}
function language(value) { return ['en', 'fr', 'us'].includes(value) ? value : 'en' }
function editorHref(id, lang = 'en') { return '#/edit/' + encodeURIComponent(id) + '/' + language(lang) }

async function translateToFrench(source) {
  if (!source.length) throw new Error('Save the English banner first.')
  const fields = ['eyebrow', 'heading', 'subheading', 'buttonText', 'altText']
  const translated = structuredClone(source)
  for (const slide of translated) {
    for (const field of fields) {
      if (!slide[field]?.trim()) continue
      const lines = slide[field].split('\n')
      for (let index = 0; index < lines.length; index++) {
        if (!lines[index].trim()) continue
        const query = new URLSearchParams({ q: lines[index], langpair: 'en|fr' })
        const response = await fetch('https://api.mymemory.translated.net/get?' + query)
        if (!response.ok) throw new Error('Translation service is unavailable (' + response.status + ').')
        const result = await response.json()
        if (result.responseStatus !== 200 || !result.responseData?.translatedText)
          throw new Error('Translation service could not translate the ' + field + ' text.')
        const decoder = document.createElement('textarea')
        decoder.innerHTML = result.responseData.translatedText
        lines[index] = decoder.value
      }
      slide[field] = lines.join('\n')
    }
  }
  return translated
}

async function dashboard() {
  app.replaceChildren()
  const status = el('p', { class: 'status', role: 'status' })
  const grid = el('div', { class: 'banner-grid' })
  const shell = el('div', { class: 'dashboard' }, [
    el('aside', { class: 'sidebar' }, [
      el('div', { class: 'brand', text: 'CODE STUDIO' }),
      el('div', { class: 'nav-active', text: 'Banners' }),
      el('div', { class: 'signed-in', text: 'Saved on this device · Download backups regularly' })
    ]),
    el('main', { class: 'content' }, [
      el('div', { class: 'heading', text: 'WORKSPACE' }),
      el('h1', { text: 'Banner projects' }),
      el('p', { text: 'Create, edit and export desktop and mobile banners. Projects are stored on this device.' }),
      el('div', { class: 'toolbar' }, [
        el('button', { text: '+ New banner', onclick: () => createBanner(status) }),
        el('button', { class: 'secondary', text: 'Import project JSON', onclick: () => importInput.click() }),
        el('button', { class: 'secondary', text: 'Download backup', onclick: () => exportBackup(status) })
      ]),
      status, grid
    ])
  ])
  const importInput = el('input', { type: 'file', accept: '.json,application/json', hidden: '', onchange: async () => {
    const file = importInput.files?.[0]
    if (!file) return
    try {
      const parsed = JSON.parse(await file.text())
      const projects = Array.isArray(parsed?.projects) ? parsed.projects : [parsed]
      for (const project of projects) {
        const en = Array.isArray(project) ? project : (project.en || project.slides || project.data)
        if (!Array.isArray(en) || !en.length) throw new Error('Expected project JSON with a nonempty slides array.')
        saveProject({
          id: crypto.randomUUID(), updated_at: new Date().toISOString(),
          title: String(project.title || file.name.replace(/\.json$/i, '')).slice(0, 200),
          en: await portableImages(en, true), fr: Array.isArray(project.fr) ? await portableImages(project.fr, true) : null,
          us: Array.isArray(project.us) ? await portableImages(project.us, true) : null
        })
      }
      await dashboard()
    } catch (error) { message(status, 'Import failed: ' + error.message, true) }
    importInput.value = ''
  } })
  shell.append(importInput)
  app.append(shell)
  try {
    const rows = projects().sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    if (!rows.length) grid.append(el('div', { class: 'empty', text: 'No banners yet. Create one or import a project JSON backup.' }))
    for (const row of rows) {
      const actions = el('div', { class: 'actions' })
      for (const [code, label] of [['en','Edit English'], ['fr','Edit French'], ['us','Edit USA']])
        actions.append(el('a', { href: editorHref(row.id, code), text: label, class: code === 'en' ? 'button' : 'button secondary' }))
      actions.append(
        el('button', { class: 'secondary', text: 'Duplicate', onclick: async () => {
          try {
            saveProject({ ...row, id: crypto.randomUUID(), title: row.title + ' Copy', updated_at: new Date().toISOString() })
            await dashboard()
          } catch (error) { message(status, error.message, true) }
        } }),
        el('button', { class: 'danger', text: 'Delete', onclick: async () => {
          if (!confirm('Delete this banner project? Download a backup first if you need one.')) return
          try { persist(projects().filter(item => item.id !== row.id)); await dashboard() }
          catch (error) { message(status, error.message, true) }
        } })
      )
      grid.append(el('article', { class: 'card' }, [
        el('h2', { text: row.title }),
        el('p', { text: 'Updated ' + new Date(row.updated_at).toLocaleString() }),
        el('div', { class: 'tags', text: 'EN' + (row.fr ? ' · FR' : '') + (row.us ? ' · USA' : '') }),
        actions
      ]))
    }
  } catch (error) { message(status, 'Could not load banners: ' + error.message, true) }
}

async function createBanner(status) {
  try {
    const row = saveProject({ id: crypto.randomUUID(), title: 'New Banner', en: [], fr: null, us: null, updated_at: new Date().toISOString() })
    location.hash = editorHref(row.id).slice(1)
    if (!location.hash) await route()
  } catch (error) { message(status, error.message, true) }
}
async function exportBackup(status) {
  try {
    const rows = await portableImages(projects())
    download('code-studio-backup-' + new Date().toISOString().slice(0, 10) + '.json',
      JSON.stringify({ format: 'code-studio-backup-v1', projects: rows }, null, 2))
  } catch (error) { message(status, error.message, true) }
}

async function edit(id, lang) {
  app.replaceChildren(el('p', { class: 'loading', text: 'Opening banner…' }))
  try {
    const row = projects().find(item => item.id === id)
    if (!row) throw new Error('Project not found in this browser.')
    const slides = await displayImages(row[lang]?.length ? row[lang] : row.en)
    app.replaceChildren(el('div', { id: 'jcs-root' }))
    document.body.className = 'jcs-editor-body'
    if (!document.querySelector('#editor-css')) document.head.append(el('link', { id: 'editor-css', rel: 'stylesheet', href: import.meta.env.BASE_URL + 'editor.css?version=standalone-2' }))
    window.JCS_EDITOR_DATA = {
      postId: row.id, title: row.title, slides,
      language: lang, languageLabel: { en: 'English', fr: 'French', us: 'USA' }[lang],
      listUrl: '#/', englishUrl: editorHref(id, 'en'), frenchUrl: editorHref(id, 'fr'),
      usaUrl: editorHref(id, 'us'), settings,
      translate: async () => translateToFrench(row.en),
      save: async ({ title, data }) => {
        const cleanTitle = title.trim()
        if (!cleanTitle || cleanTitle.length > 200) throw new Error('Title must be 1–200 characters.')
        if (!Array.isArray(data) || !data.length) throw new Error('A banner needs at least one slide.')
        saveProject({ ...row, title: cleanTitle, [lang]: savedImages(data), updated_at: new Date().toISOString() })
      }
    }
    const old = document.getElementById('editor-js')
    if (old) old.remove()
    app.append(el('script', { id: 'editor-js', src: import.meta.env.BASE_URL + 'editor.js?version=standalone-2' }))
    const onLoad = () => addImageUploads(id)
    app.querySelector('#editor-js').addEventListener('load', onLoad, { once: true })
  } catch (error) {
    app.replaceChildren(el('div', { class: 'login-card' }, [
      el('h1', { text: 'Could not open banner' }),
      el('p', { text: error.message }),
      el('a', { href: '#/', text: 'Back to banners' })
    ]))
  }
}

function addImageUploads(id) {
  for (const inputId of ['fDeskImg', 'fMobImg', 'fOverlayImage']) {
    const input = document.getElementById(inputId)
    if (!input) continue
    const file = el('input', { type: 'file', accept: 'image/png,image/jpeg,image/webp,image/gif', hidden: '' })
    const button = el('button', { type: 'button', class: 'jcs-btn secondary', text: 'Upload image', onclick: () => file.click() })
    file.addEventListener('change', async () => {
      const image = file.files?.[0]
      if (!image) return
      if (image.size > 10 * 1024 * 1024) return alert('Maximum image size is 10 MB.')
      if (!['image/png','image/jpeg','image/webp','image/gif'].includes(image.type)) return alert('Choose a PNG, JPEG, WebP or GIF image.')
      button.disabled = true
      button.textContent = 'Uploading…'
      try {
        const imageId = await storeImage(image)
        const objectUrl = URL.createObjectURL(image)
        imageUrls.set(objectUrl, 'code-studio-image:' + imageId)
        input.value = objectUrl
        input.dispatchEvent(new Event('input', { bubbles: true }))
        input.dispatchEvent(new Event('change', { bubbles: true }))
      } catch (error) { alert('Image upload failed: ' + error.message) }
      finally { button.disabled = false; button.textContent = 'Upload image'; file.value = '' }
    })
    input.after(file, button)
  }
}

async function route() {
  document.body.className = ''
  const match = location.hash.match(/^#\/edit\/([0-9a-f-]{36})\/(en|fr|us)$/i)
  if (match) await edit(match[1], language(match[2]))
  else await dashboard()
}
async function start() { await route() }
window.addEventListener('hashchange', () => {
  // The original editor registers document-wide listeners. Reload between
  // projects/languages so a previous editor can never save stale slides.
  if (document.getElementById('editor-js')) location.reload()
  else route()
})
start()
