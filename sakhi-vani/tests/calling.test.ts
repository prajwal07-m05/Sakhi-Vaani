import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fresh, CITIZEN, ASHA } from './helpers'
import { classifyIntent } from '../ai-services/orchestrator/orchestrator'

test('intent routing', () => {
  assert.equal(classifyIntent('I am pregnant. Are there any government schemes for me?'), 'scheme')
  assert.equal(classifyIntent('I want to speak to my ASHA worker'), 'asha_assistance')
  assert.equal(classifyIntent('How do I prepare for my next antenatal visit?'), 'maternal')
  assert.equal(classifyIntent('ನನಗೆ ಯಾವುದಾದರೂ ಸರ್ಕಾರಿ ಯೋಜನೆ ಇದೆಯೇ?'), 'scheme')
  assert.equal(classifyIntent('मुझे अपनी आशा कार्यकर्ता से बात करनी है'), 'asha_assistance')
  assert.equal(classifyIntent('there is bleeding'), 'emergency')
})

test('Demo Flow C: simulated call → eligibility → confirmed ASHA request → summary → ASHA notified', () => {
  const { svc, db } = fresh()
  let call = svc.startCall(CITIZEN)
  const say = (text: string) => (call = svc.callTurn(CITIZEN, { callId: call.id, text }))
  say('English')
  assert.equal(call.state, 'listening')
  say('I am pregnant. Are there any government schemes for me?')
  assert.equal(call.state, 'eligibility')
  assert.equal(call.pendingQuestionKey, 'state')
  let guard = 0
  while (call.state === 'eligibility' && guard++ < 12) {
    const k = call.pendingQuestionKey
    say(k === 'state' ? 'Karnataka' : k === 'age' ? '25' : k === 'pregnancyMonths' ? 'seven' : k === 'govtEmployee' ? 'no' : 'not sure')
  }
  assert.equal(call.state, 'confirm_request')
  assert.ok(call.assessmentId)
  assert.equal(db.requests.length, 0, 'no request before confirmation')
  say('yes')
  assert.ok(call.requestId)
  assert.equal(db.requests[0].createdVia, 'call')
  say('That is all')
  assert.equal(call.state, 'ended')
  const { summary } = svc.endCall(CITIZEN, { callId: call.id })
  assert.equal(summary.requestId, call.requestId)
  assert.equal(summary.transcriptRetained, false)
  assert.equal(db.calls.find((c) => c.id === call.id)!.transcript.length, 0, 'transcript purged by retention default')
  assert.ok(svc.listNotifications(ASHA).some((n) => n.title === 'New assistance request'))
})

test('call: declining the ASHA offer creates no request; Kannada flow works', () => {
  const { svc, db } = fresh()
  let call = svc.startCall(CITIZEN)
  const say = (text: string) => (call = svc.callTurn(CITIZEN, { callId: call.id, text }))
  say('ಕನ್ನಡ')
  assert.equal(call.language, 'kn')
  say('ನನ್ನ ಆಶಾ ಕಾರ್ಯಕರ್ತೆಯೊಂದಿಗೆ ಮಾತನಾಡಬೇಕು')
  assert.equal(call.state, 'confirm_request')
  say('ಇಲ್ಲ')
  assert.equal(db.requests.length, 0)
  assert.equal(call.state, 'listening')
})
