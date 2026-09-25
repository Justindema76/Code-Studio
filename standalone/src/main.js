import { createClient } from '@supabase/supabase-js'
import './style.css'

const app = document.querySelector('#app')
const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
const db = url && key ? createClient(url, key) : null
const settings = {
  accent: '#3157DF',
  fonts: 'Oswald\nInter\nArial\nGeorgia\nImpact\nMontserrat\nRoboto\nOpen Sans\nPoppins\nLato\nBebas Neue\nAnton\nBarlow Condensed\nRoboto Condensed\nPlayfair Display\nMerriweather'
}
let currentUser = null

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

function login() {
  app.replaceChildren()
  const status = el('p', { class: 'status', role: 'status' })
  const email = el('input', { type: 'email', required: '', autocomplete: 'username', placeholder: 'Email' })
  const password = el('input', { type: 'password', required: '', autocomplete: 'current-password', placeholder: 'Password' })
  const button = el('button', { type: 'submit', text: 'Sign in' })
  const form = el('form', { class: 'login-card', onsubmit: async event => {
    event.preventDefault()
    button.disabled = true
    message(status, 'Signing in…')
    try {
      check(await db.auth.signInWithPassword({ email: email.value, password: password.value }))
      await start()
    } catch (error) { message(status, error.message, true) }
    finally { button.disabled = false }
  } }, [
    el('div', { class: 'eyebrow', text: 'JUSTINNOVATE' }),
    el('h1', { text: 'Code Studio' }),
    el('p', { text: 'Your banners, in one workspace.' }),
    el('label', { text: 'Email' }), email,
    el('label', { text: 'Password' }), password, button, status
  ])
  app.append(form)
}

async function dashboard() {
  if (!currentUser) return login()
  app.replaceChildren()
  const status = el('p', { class: 'status', role: 'status' })
  const grid = el('div', { class: 'banner-grid' })
  const shell = el('div', { class: 'dashboard' }, [
    el('aside', { class: 'sidebar' }, [
      el('div', { class: 'brand', text: 'CODE STUDIO' }),
      el('div', { class: 'nav-active', text: 'Banners' }),
      el('div', { class: 'signed-in', text: currentUser.email }),
      el('button', { class: 'secondary', text: 'Sign out', onclick: async () => { await db.auth.signOut(); currentUser = null; login() } })
    ]),
    el('main', { class: 'content' }, [
      el('div', { class: 'heading', text: 'WORKSPACE' }),
      el('h1', { text: 'Banner projects' }),
      el('p', { text: 'Create, edit and export desktop and mobile banners.' }),
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
        check(await db.from('code_studio_banners').insert({
          owner_id: currentUser.id,
          title: String(project.title || file.name.replace(/\.json$/i, '')).slice(0, 200),
          en, fr: Array.isArray(project.fr) ? project.fr : null,
          us: Array.isArray(project.us) ? project.us : null
        }))
      }
      await dashboard()
    } catch (error) { message(status, 'Import failed: ' + error.message, true) }
    importInput.value = ''
  } })
  shell.append(importInput)
  app.append(shell)
  try {
    const rows = check(await db.from('code_studio_banners').select('id,title,en,fr,us,updated_at').order('updated_at', { ascending: false }))
    if (!rows.length) grid.append(el('div', { class: 'empty', text: 'No banners yet. Create one or import a project JSON backup.' }))
    for (const row of rows) {
      const actions = el('div', { class: 'actions' })
      for (const [code, label] of [['en','Edit English'], ['fr','Edit French'], ['us','Edit USA']])
        actions.append(el('a', { href: editorHref(row.id, code), text: label, class: code === 'en' ? 'button' : 'button secondary' }))
      actions.append(
        el('button', { class: 'secondary', text: 'Duplicate', onclick: async () => {
          try {
            check(await db.from('code_studio_banners').insert({
              owner_id: currentUser.id, title: row.title + ' Copy', en: row.en, fr: row.fr, us: row.us
            }))
            await dashboard()
          } catch (error) { message(status, error.message, true) }
        } }),
        el('button', { class: 'danger', text: 'Delete', onclick: async () => {
          if (!confirm('Delete this banner project? Download a backup first if you need one.')) return
          try { check(await db.from('code_studio_banners').delete().eq('id', row.id)); await dashboard() }
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
    const rows = check(await db.from('code_studio_banners')
      .insert({ owner_id: currentUser.id, title: 'New Banner', en: [] }).select('id'))
    location.hash = editorHref(rows[0].id).slice(1)
    if (!location.hash) await route()
  } catch (error) { message(status, error.message, true) }
}
async function exportBackup(status) {
  try {
    const rows = check(await db.from('code_studio_banners').select('title,en,fr,us'))
    download('code-studio-backup-' + new Date().toISOString().slice(0, 10) + '.json',
      JSON.stringify({ format: 'code-studio-backup-v1', projects: rows }, null, 2))
  } catch (error) { message(status, error.message, true) }
}

async function edit(id, lang) {
  if (!currentUser) return login()
  app.replaceChildren(el('p', { class: 'loading', text: 'Opening banner…' }))
  try {
    const row = check(await db.from('code_studio_banners')
      .select('id,title,en,fr,us').eq('id', id).single())
    const slides = row[lang]?.length ? row[lang] : row.en
    app.replaceChildren(el('div', { id: 'jcs-root' }))
    document.body.className = 'jcs-editor-body'
    if (!document.querySelector('#editor-css')) document.head.append(el('link', { id: 'editor-css', rel: 'stylesheet', href: import.meta.env.BASE_URL + 'editor.css' }))
    window.JCS_EDITOR_DATA = {
      postId: row.id, title: row.title, slides,
      language: lang, languageLabel: { en: 'English', fr: 'French', us: 'USA' }[lang],
      listUrl: '#/', englishUrl: editorHref(id, 'en'), frenchUrl: editorHref(id, 'fr'),
      usaUrl: editorHref(id, 'us'), settings,
      save: async ({ title, data }) => {
        const cleanTitle = title.trim()
        if (!cleanTitle || cleanTitle.length > 200) throw new Error('Title must be 1–200 characters.')
        if (!Array.isArray(data) || !data.length) throw new Error('A banner needs at least one slide.')
        const updated = check(await db.from('code_studio_banners')
          .update({ title: cleanTitle, [lang]: data, updated_at: new Date().toISOString() })
          .eq('id', id).select('id'))
        if (!updated.length) throw new Error('Banner was not saved. Check your account permissions.')
      }
    }
    const old = document.getElementById('editor-js')
    if (old) old.remove()
    app.append(el('script', { id: 'editor-js', src: import.meta.env.BASE_URL + 'editor.js?version=standalone-1' }))
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
        const extension = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif' }[image.type]
        const path = currentUser.id + '/' + id + '/' + crypto.randomUUID() + '.' + extension
        check(await db.storage.from('code-studio-images').upload(path, image, { contentType: image.type }))
        input.value = db.storage.from('code-studio-images').getPublicUrl(path).data.publicUrl
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
async function start() {
  if (!db) {
    app.replaceChildren(el('div', { class: 'login-card' }, [
      el('h1', { text: 'Code Studio needs its Supabase project' }),
      el('p', { text: 'Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to the dedicated project before deployment.' })
    ]))
    return
  }
  const { data: { user }, error } = await db.auth.getUser()
  if (error && error.name !== 'AuthSessionMissingError') console.error(error)
  currentUser = user
  if (!user) return login()
  await route()
}
window.addEventListener('hashchange', () => {
  // The original editor registers document-wide listeners. Reload between
  // projects/languages so a previous editor can never save stale slides.
  if (document.getElementById('editor-js')) location.reload()
  else route()
})
start()
