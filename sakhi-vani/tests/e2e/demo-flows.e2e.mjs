// Browser end-to-end run of Demo Flows A, B and C against the mobile client (stand-alone demo mode).
// Usage: npm i -D puppeteer-core ; set CHROME_PATH to Chrome/Chromium ; start-mobile.bat ; node tests/e2e/demo-flows.e2e.mjs
import fs from 'node:fs'; fs.mkdirSync('./e2e-shots', { recursive: true })
import puppeteer from 'puppeteer-core'
const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/chromium', args: ['--no-sandbox', '--disable-dev-shm-usage'], headless: true })
const page = await browser.newPage()
await page.setViewport({ width: 412, height: 880, deviceScaleFactor: 1 })
const errors = []
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
page.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('fonts.g')) errors.push('console: ' + m.text()) })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const has = (t) => page.evaluate((t) => document.body.innerText.toLowerCase().includes(t.toLowerCase()), t)
async function waitText(t, ms = 6000) { const s = Date.now(); while (Date.now() - s < ms) { if (await has(t)) return true; await sleep(100) } throw new Error('Timeout waiting for: ' + t) }
async function click(t, { exact = false } = {}) {
  const ok = await page.evaluate((t, exact) => {
    const els = [...document.querySelectorAll('button, a, [role=radio]')].filter((e) => e.offsetParent !== null || e.getClientRects().length)
    const el = els.find((e) => (exact ? e.innerText.trim() === t : e.innerText.trim().includes(t)) && !e.disabled)
    if (el) { el.click(); return true } return false
  }, t, exact)
  if (!ok) throw new Error('No clickable: ' + t)
  await sleep(350)
}
const shot = (n) => page.screenshot({ path: `./e2e-shots/${n}.png` })
const step = (s) => console.log('✓', s)

await page.goto(process.env.E2E_URL || 'http://localhost:5173/', { waitUntil: 'networkidle0' })
await page.evaluate(() => localStorage.clear()); await page.reload({ waitUntil: 'networkidle0' })
await waitText('Continue as ASHA Worker'); await shot('01-splash'); step('splash with two entry cards')
await click('ಕನ್ನಡ'); await waitText('ಆಶಾ ಕಾರ್ಯಕರ್ತೆ'); await shot('01b-splash-kn'); await click('English'); step('language switch (Kannada)')

// ---- Flow A ----
await click('Continue as ASHA Worker'); await click('Use demo account'); await click('Log in', { exact: true })
await waitText('Namaskara, Meera'); await sleep(500); await shot('02-asha-dashboard'); step('ASHA login + dashboard')
await page.type('input[aria-label="Search beneficiary by name or ID"]', 'SYN-001'); await waitText('Lakshmi'); await click('Lakshmi')
await waitText("Speak About Today's Visit"); await shot('03-profile'); step('search SYN-001 → profile')
await click('Open Beneficiary Records'); await waitText('Village Health Register'); await shot('04-vhr')
await click('ASHA Diary'); await waitText('Antenatal home visit'); await click('Maternal Health'); await waitText('Not measured'); await shot('05-maternal'); step('VHR, Diary, Maternal records')
await page.evaluate(() => document.querySelector('button[aria-label="Back"]').click()); await sleep(300)
await click("Speak About Today's Visit"); await waitText('Use demo transcription'); await click('Use demo transcription'); await waitText('SIMULATED speech')
await click('Process transcript'); await waitText('Review extracted details'); await waitText('BP measurement has not been provided'); await shot('06-review'); step('extraction + missing info shown')
const approveDisabled = await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.innerText.includes('Approve and save')).disabled)
if (!approveDisabled) throw new Error('Approve should be disabled before confirmation')
await page.evaluate(() => document.querySelectorAll('input[aria-label="Include Next visit date"]').forEach((c) => { if (!c.checked) c.click() }))
await page.evaluate(() => { const cbs = [...document.querySelectorAll('input[type=checkbox]')]; cbs[cbs.length - 1].click() })
await sleep(200); await click('Approve and save'); await waitText('reviewed field(s) saved'); await waitText('Follow-up created'); await shot('07-saved'); step('human approval → saved + follow-up')
await click('View notifications'); await waitText('Follow-up scheduled: Lakshmi'); await shot('08-asha-alerts'); step('follow-up notification')
await click('More', { exact: true }); await click('Settings', { exact: true }); await click('Log out')

// ---- Flow B ----
await waitText('Continue as Citizen'); await click('Continue as Citizen'); await click('Use demo account'); await click('Log in', { exact: true })
await waitText('Namaskara, Lakshmi'); await sleep(600); await shot('09-citizen-home'); step('citizen login + home')
await click('Profile', { exact: true }); await waitText('What you share'); await shot('10-profile'); step('health profile')
await click('Schemes', { exact: true }); await waitText('May be relevant to you'); await shot('11-schemes')
await click('PMSMA —'); await waitText('How to apply'); await shot('12-scheme-detail'); step('scheme list + detail')
await click('Check my eligibility for PMSMA'); await sleep(800)
await page.evaluate(() => history.back && null)
await page.evaluate(() => document.querySelector('button[aria-label="Back"]').click()); await sleep(300)
await page.evaluate(() => document.querySelector('button[aria-label="Back"]').click()); await sleep(300)
await click('Check My Eligibility'); await sleep(800)
for (let i = 0; i < 12 && !(await has('Thank you.')); i++) {
  if (await page.$('input[placeholder="Type a number"]')) { await page.type('input[placeholder="Type a number"]', '25'); await click('OK', { exact: true }) }
  else if (await has('Which state')) await click('Karnataka', { exact: true })
  else await click(i === 0 ? 'Yes' : 'Not sure', { exact: true })
  await sleep(400)
}
await waitText('Potentially eligible'); await waitText('Still needed'); await shot('13-eligibility-results'); step('conversational eligibility → results')
await click('Request ASHA help', { exact: false }); await waitText('Request ASHA Assistance')
await page.evaluate(() => { const cbs = [...document.querySelectorAll('input[type=checkbox]')]; cbs[cbs.length - 1].click() }); await sleep(200)
await click('Continue', { exact: true }); await waitText('Send this request?'); await click('Yes, send'); await waitText('My assistance requests'); await shot('14-request-sent'); step('confirmed assistance request')

// ---- Flow C ----
await click('Home', { exact: true }); await sleep(500); await click('Call SAKHI VANI'); await waitText('DEMO CALL SIMULATOR'); await shot('15-call-start')
await click('Start simulated call'); await waitText('How can I help'); await click('I am pregnant. Are there any government schemes for me?')
for (let i = 0; i < 12 && !(await has('Would you like me to create a request')); i++) {
  if (await has('Which state do you live in?') && !(await has('Karnataka\n'))) {}
  const chips = await page.evaluate(() => [...document.querySelectorAll('button')].map((b) => b.innerText.trim()))
  if (chips.includes('Karnataka')) await click('Karnataka', { exact: true })
  else if (chips.includes('25')) await click('25', { exact: true })
  else if (chips.includes('7')) await click('7', { exact: true })
  else await click('Not sure', { exact: true })
  await sleep(300)
}
await waitText('This is not an approval'); await shot('16-call-result'); await click('Yes', { exact: true }); await waitText('Your request has been created')
await click('That is all', { exact: true }); await waitText('Call summary'); await shot('17-call-summary'); step('simulated call → request → summary')
await click('Close'); await sleep(300)
await click('Profile', { exact: true }); await click('Settings', { exact: true }); await click('Log out')

// ---- ASHA receives + updates ----
await click('Continue as ASHA Worker'); await click('Use demo account'); await click('Log in', { exact: true }); await waitText('Namaskara, Meera')
await waitText('New assistance requests'); await sleep(600); await shot('18-asha-new-requests')
await click('More', { exact: true }); await click('Assistance requests'); await waitText('Call assistant follow-up'); await click('Update status'); await click('Save', { exact: true }); await waitText('ASSIGNED'); await shot('19-asha-request-updated'); step('ASHA sees both requests, updates status')
await click('More', { exact: true }); await click('Settings', { exact: true }); await click('Log out')
await click('Continue as Citizen'); await click('Use demo account'); await click('Log in', { exact: true }); await waitText('Namaskara, Lakshmi')
await click('Profile', { exact: true }); await click('My assistance requests'); await waitText('ASSIGNED'); await shot('20-citizen-status'); step('citizen sees updated status')
// Access control in UI: newborn/elderly record selection
await click('Profile', { exact: true }); await click('Settings', { exact: true }); await click('Log out')
await click('Continue as ASHA Worker'); await click('Use demo account'); await click('Log in', { exact: true }); await waitText('Namaskara, Meera')
await page.type('input[aria-label="Search beneficiary by name or ID"]', 'SYN-003'); await waitText('Baby of Kavya'); await click('Baby of Kavya'); await click('Open Beneficiary Records'); await waitText('HBNC'); await shot('21-hbnc'); step('newborn → HBNC record')
console.log('ERRORS:', errors.length ? errors : 'none')
await browser.close()
