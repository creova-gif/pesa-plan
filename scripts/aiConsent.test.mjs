import assert from 'node:assert/strict';
import test from 'node:test';
import { aiConsentCopy, readAiConsent, writeAiConsent } from '../src/lib/aiConsent.mjs';

function memoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
}

test('consent copy tells the user which financial data is sent', () => {
  for (const lang of ['en', 'sw', 'fr', 'ar', 'pt']) {
    const copy = aiConsentCopy(lang);
    assert.ok(copy.title.length > 0);
    assert.ok(copy.body.length > 20);
    assert.ok(copy.grant.length > 0);
    assert.ok(copy.deny.length > 0);
  }
  const english = aiConsentCopy('en');
  assert.match(english.body, /balances/i);
  assert.match(english.body, /loans/i);
  assert.match(english.body, /net worth/i);
  assert.match(english.body, /receipt/i);
});

test('consent defaults to unset and only stores an explicit choice', () => {
  const storage = memoryStorage();
  assert.equal(readAiConsent(storage), 'unset');
  assert.equal(readAiConsent(null), 'unset');
  writeAiConsent(storage, 'granted');
  assert.equal(readAiConsent(storage), 'granted');
  writeAiConsent(storage, 'maybe');
  assert.equal(readAiConsent(storage), 'granted');
  writeAiConsent(storage, 'denied');
  assert.equal(readAiConsent(storage), 'denied');
});
