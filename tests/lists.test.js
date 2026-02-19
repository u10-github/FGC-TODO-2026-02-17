import test from 'node:test';
import assert from 'node:assert/strict';
import { deleteList, renameList } from '../src/core/lists.js';

function baseState() {
  return {
    schemaVersion: 2,
    currentListId: 'l1',
    lists: [
      { id: 'l1', name: 'タスクリスト', createdAt: 1 },
      { id: 'l2', name: 'GGST/INO', createdAt: 2 },
    ],
    tasks: [
      { id: 't1', title: 'A', status: 'active', count: 0, listId: 'l1' },
      { id: 't2', title: 'B', status: 'active', count: 0, listId: 'l2' },
    ],
  };
}

test('REQ-UC11 renameList renames list with trimmed value', () => {
  const state = renameList(baseState(), 'l2', '  SF6/リュウ  ');
  assert.equal(state.lists[1].name, 'SF6/リュウ');
});

test('REQ-UC11 renameList ignores duplicated name', () => {
  const state = renameList(baseState(), 'l2', 'タスクリスト');
  assert.equal(state.lists[1].name, 'GGST/INO');
});

test('REQ-UC12 deleteList removes list tasks and updates current list', () => {
  const state = deleteList(baseState(), 'l1');
  assert.equal(state.lists.length, 1);
  assert.equal(state.lists[0].id, 'l2');
  assert.equal(state.currentListId, 'l2');
  assert.equal(state.tasks.length, 1);
  assert.equal(state.tasks[0].listId, 'l2');
});

test('REQ-UC12 deleteList keeps single list', () => {
  const single = {
    schemaVersion: 2,
    currentListId: 'l1',
    lists: [{ id: 'l1', name: 'タスクリスト', createdAt: 1 }],
    tasks: [{ id: 't1', title: 'A', status: 'active', count: 0, listId: 'l1' }],
  };
  const state = deleteList(single, 'l1');
  assert.equal(state.lists.length, 1);
  assert.equal(state.tasks.length, 1);
});
