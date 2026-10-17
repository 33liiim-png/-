import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateUsername,
  sanitizeMessage,
  formatArabicDateSeparator,
  getUserColor,
  getAvatarInitial,
  getExpireAtDate,
  TTL_MS,
} from './chatUtils.ts';

test('validateUsername accepts alphanumeric handles like user99 and ahmed33', () => {
  assert.equal(validateUsername('user99').valid, true);
  assert.equal(validateUsername('user99').cleaned, 'user99');
  assert.equal(validateUsername('User99').valid, true);
  assert.equal(validateUsername('User99').cleaned, 'user99');
  assert.equal(validateUsername('ahmed33').valid, true);
  assert.equal(validateUsername('ali_99').valid, true);
});

test('validateUsername rejects too short, too long or invalid characters', () => {
  assert.equal(validateUsername('').valid, false);
  assert.equal(validateUsername('ab').valid, false);
  assert.equal(validateUsername('a'.repeat(21)).valid, false);
  assert.equal(validateUsername('bad user!').valid, false);
  assert.equal(validateUsername('ahmed@33').valid, false);
});

test('sanitizeMessage enforces length and rejects empty messages', () => {
  assert.equal(sanitizeMessage('   ').valid, false);
  assert.equal(sanitizeMessage('مرحباً بالجميع').valid, true);
  assert.equal(sanitizeMessage('مرحباً بالجميع').cleaned, 'مرحباً بالجميع');
  assert.equal(sanitizeMessage('x'.repeat(2001)).valid, false);
  assert.equal(sanitizeMessage('x'.repeat(2000)).valid, true);
});

test('formatArabicDateSeparator returns اليوم for today and أمس for yesterday', () => {
  const now = new Date('2026-10-17T12:00:00Z');
  const today = new Date('2026-10-17T08:00:00Z');
  const yesterday = new Date('2026-10-16T15:00:00Z');
  const past = new Date('2026-10-10T10:00:00Z');

  assert.equal(formatArabicDateSeparator(today, now), 'اليوم');
  assert.equal(formatArabicDateSeparator(yesterday, now), 'أمس');
  const pastStr = formatArabicDateSeparator(past, now);
  assert.notEqual(pastStr, 'اليوم');
  assert.notEqual(pastStr, 'أمس');
});

test('getUserColor returns stable distinct colors for usernames', () => {
  const color1 = getUserColor('ahmed33');
  const color2 = getUserColor('ahmed33');
  const color3 = getUserColor('ali99');

  assert.deepEqual(color1, color2);
  assert.ok(color1.bg && color1.text && color1.nameColor);
  assert.ok(color3.bg);
});

test('getAvatarInitial extracts the first letter correctly', () => {
  assert.equal(getAvatarInitial('ahmed33'), 'A');
  assert.equal(getAvatarInitial('مجلس'), 'م');
  assert.equal(getAvatarInitial('   yousef'), 'Y');
  assert.equal(getAvatarInitial(''), 'م');
});

test('getExpireAtDate calculates exactly 14 days later', () => {
  const start = new Date(1700000000000);
  const end = getExpireAtDate(start);
  assert.equal(end.getTime() - start.getTime(), TTL_MS);
});
