import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addTask,
  completeTask,
  incCount,
  resetCount,
  restoreTask,
} from '../src/core/tasks.js';

function baseState() {
  return { schemaVersion: 1, tasks: [] };
}

test('REQ-UC1 addTask: task is active with count=0', () => {
  const state = addTask(baseState(), ' 対空練習 ');
  assert.equal(state.tasks.length, 1);
  assert.equal(state.tasks[0].title, '対空練習');
  assert.equal(state.tasks[0].status, 'active');
  assert.equal(state.tasks[0].count, 0);
});

test('REQ-UC1 addTask: empty title is ignored', () => {
  const state = addTask(baseState(), '   ');
  assert.equal(state.tasks.length, 0);
});

test('REQ-UC2 incCount increments only', () => {
  const seeded = { schemaVersion: 1, tasks: [{ id: '1', title: 'A', status: 'active', count: 0 }] };
  const state = incCount(seeded, '1');
  assert.equal(state.tasks[0].count, 1);
});

test('REQ-UC3 resetCount resets only selected task', () => {
  const seeded = {
    schemaVersion: 1,
    tasks: [
      { id: '1', title: 'A', status: 'active', count: 4 },
      { id: '2', title: 'B', status: 'active', count: 2 },
    ],
  };
  const state = resetCount(seeded, '1');
  assert.equal(state.tasks[0].count, 0);
  assert.equal(state.tasks[1].count, 2);
});

test('REQ-UC4 completeTask moves task to done status', () => {
  const seeded = { schemaVersion: 1, tasks: [{ id: '1', title: 'A', status: 'active', count: 5 }] };
  const state = completeTask(seeded, '1');
  assert.equal(state.tasks[0].status, 'done');
  assert.equal(state.tasks[0].count, 5);
});

test('REQ-UC5 restoreTask returns to active and preserves count', () => {
  const seeded = { schemaVersion: 1, tasks: [{ id: '1', title: 'A', status: 'done', count: 8 }] };
  const state = restoreTask(seeded, '1');
  assert.equal(state.tasks[0].status, 'active');
  assert.equal(state.tasks[0].count, 8);
});
