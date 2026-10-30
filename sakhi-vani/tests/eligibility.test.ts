import { test } from 'node:test'
import assert from 'node:assert/strict'
import { assessAll, assessScheme, nextQuestion, parseYesNo, parseNumber, parseState } from '../ai-services/eligibility/engine'
import { ELIGIBILITY_RULES } from '../database/demo-data/schemes'
import { fresh, CITIZEN } from './helpers'

const rule = (id: string) => ELIGIBILITY_RULES.find((r) => r.schemeId === id)!

test('PMSMA: pregnant + 7 months → potentially eligible; 2 months → not met; unknown month → more info', () => {
  assert.equal(assessScheme(rule('pmsma'), { pregnant: 'yes', pregnancyMonths: 7 }).status, 'potentially_eligible')
  assert.equal(assessScheme(rule('pmsma'), { pregnant: 'yes', pregnancyMonths: 2 }).status, 'criteria_not_met')
  assert.equal(assessScheme(rule('pmsma'), { pregnant: 'yes' }).status, 'more_info_required')
  assert.equal(assessScheme(rule('pmsma'), { pregnant: 'yes', pregnancyMonths: 'unsure' }).status, 'more_info_required')
})

test('JSY anyOf: BPL or SC/ST satisfies the category criterion', () => {
  const base = { pregnant: 'yes', age: 25, plansPublicFacility: 'yes' }
  assert.equal(assessScheme(rule('jsy'), { ...base, bplCard: 'no', scSt: 'yes' }).status, 'potentially_eligible')
  assert.equal(assessScheme(rule('jsy'), { ...base, bplCard: 'no', scSt: 'no' }).status, 'criteria_not_met')
  const unknown = assessScheme(rule('jsy'), { ...base, bplCard: 'no' })
  assert.equal(unknown.status, 'more_info_required')
  assert.deepEqual(unknown.missingKeys, ['scSt'])
})

test('PMMVY excludes regular government employees', () => {
  assert.equal(assessScheme(rule('pmmvy'), { pregnant: 'yes', govtEmployee: 'yes', bplCard: 'yes', firstChild: 'yes' }).status, 'criteria_not_met')
})

test('nextQuestion asks one question at a time and never re-asks unsure answers', () => {
  const q1 = nextQuestion({ pregnant: 'yes', state: 'karnataka', age: 25, pregnancyMonths: 7 })
  assert.equal(q1?.key, 'plansPublicFacility')
  const q2 = nextQuestion({ pregnant: 'yes', state: 'karnataka', age: 25, pregnancyMonths: 7, plansPublicFacility: 'unsure' })
  assert.notEqual(q2?.key, 'plansPublicFacility')
})

test('assessment is deterministic and persisted by the service', () => {
  const answers = { pregnant: 'yes', state: 'karnataka', age: 25, pregnancyMonths: 7 }
  assert.deepEqual(assessAll(answers), assessAll(answers))
  const { svc, db } = fresh()
  const a = svc.runEligibility(CITIZEN, { answers })
  assert.equal(db.assessments.length, 1)
  assert.equal(a.results.find((r) => r.schemeId === 'pmsma')!.status, 'potentially_eligible')
  assert.equal(a.results.find((r) => r.schemeId === 'abark')!.status, 'potentially_eligible')
  assert.ok(!JSON.stringify(a).toLowerCase().includes('approved'))
})

test('profile prefill uses the shared beneficiary data', () => {
  const { svc } = fresh()
  assert.deepEqual(svc.eligibilityPrefill(CITIZEN).answers, { state: 'karnataka', age: 25, pregnant: 'yes', pregnancyMonths: 7 })
})

test('answer parsing in English, Hindi and Kannada', () => {
  assert.equal(parseYesNo('Yes'), 'yes')
  assert.equal(parseYesNo('हाँ'), 'yes')
  assert.equal(parseYesNo('ಇಲ್ಲ'), 'no')
  assert.equal(parseYesNo('I am not sure'), 'unsure')
  assert.equal(parseYesNo('पता नहीं'), 'unsure')
  assert.equal(parseNumber('seven months'), 7)
  assert.equal(parseNumber('ಏಳು'), 7)
  assert.equal(parseState('ಕರ್ನಾಟಕ'), 'karnataka')
})
