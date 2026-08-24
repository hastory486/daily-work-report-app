import test from 'node:test';
import assert from 'node:assert/strict';
import { calculatePriority, completionRate, isDueToday } from '../src/priority.js';

test('중요도와 긴급도로 우선순위를 계산한다', () => {
  assert.equal(calculatePriority(3, 3).label, '최우선');
  assert.equal(calculatePriority(2, 2).label, '높음');
  assert.equal(calculatePriority(1, 2).label, '보통');
  assert.equal(calculatePriority(1, 1).label, '낮음');
});

test('완료율을 반올림하여 계산한다', () => {
  assert.equal(completionRate([{ completed: true }, { completed: false }, { completed: false }]), 33);
  assert.equal(completionRate([]), 0);
});

test('오늘 마감 여부를 비교한다', () => {
  assert.equal(isDueToday('2026-08-24', '2026-08-24'), true);
  assert.equal(isDueToday('2026-08-25', '2026-08-24'), false);
});
