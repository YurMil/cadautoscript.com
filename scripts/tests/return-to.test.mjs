import assert from 'node:assert/strict';
import {test} from 'node:test';

import {sanitizeReturnTo} from '../../src/utils/returnTo.ts';

const ORIGIN = 'https://cadautoscript.com';

test('keeps same-origin paths with query and hash', () => {
  assert.equal(sanitizeReturnTo(`${ORIGIN}/ru/utilities/pipe-cutter/?calc=abc#top`, ORIGIN), '/ru/utilities/pipe-cutter/?calc=abc#top');
});

test('rejects other origins', () => {
  assert.equal(sanitizeReturnTo('https://evil.example/phish', ORIGIN), '/');
  assert.equal(sanitizeReturnTo('//evil.example/phish', ORIGIN), '/');
});

test('never returns to the callback, which would replay a spent code', () => {
  assert.equal(sanitizeReturnTo(`${ORIGIN}/auth/callback/?code=spent`, ORIGIN), '/');
  assert.equal(sanitizeReturnTo(`${ORIGIN}/de/auth/callback?code=spent`, ORIGIN, '/de/'), '/de/');
});

test('falls back on empty or malformed values', () => {
  assert.equal(sanitizeReturnTo(null, ORIGIN), '/');
  assert.equal(sanitizeReturnTo('', ORIGIN, '/home/'), '/home/');
  assert.equal(sanitizeReturnTo('http://[::1', ORIGIN), '/');
});
