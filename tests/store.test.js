import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createInitialState,
  exportStateData,
  importStateData,
  loadState,
  saveState,
  STORAGE_KEY,
} from '../src/core/store.js';

class InMemoryStorage {
  constructor(seed = {}) {
    this.map = new Map(Object.entries(seed));
  }
  getItem(key) {
    return this.map.has(key) ? this.map.get(key) : null;
  }
  setItem(key, value) {
    this.map.set(key, value);
  }
}

test('loadState returns initial state when empty', () => {
  const storage = new InMemoryStorage();
  const state = loadState({ storage });
  assert.deepEqual(state, createInitialState());
});

test('loadState migrates schemaVersion=1 data into default task list', () => {
  const storage = new InMemoryStorage({
    [STORAGE_KEY]: JSON.stringify({
      schemaVersion: 1,
      tasks: [{ id: '1', title: 'A', status: 'active', count: 2 }],
    }),
  });

  const state = loadState({ storage });
  assert.equal(state.schemaVersion, 2);
  assert.equal(state.lists.length, 1);
  assert.equal(state.currentListId, state.lists[0].id);
  assert.equal(state.tasks.length, 1);
  assert.equal(state.tasks[0].listId, state.currentListId);
});

test('loadState falls back and warns when JSON is broken', () => {
  const storage = new InMemoryStorage({ [STORAGE_KEY]: '{oops' });
  let warned = false;
  const logger = { warn: () => { warned = true; } };

  const state = loadState({ storage, logger });

  assert.deepEqual(state, createInitialState());
  assert.equal(warned, true);
});

test('saveState writes schemaVersion=2 payload including list data', () => {
  const storage = new InMemoryStorage();
  const state = {
    schemaVersion: 2,
    currentListId: 'l1',
    lists: [{ id: 'l1', name: 'タスクリスト', createdAt: 1 }],
    tasks: [{ id: '1', title: 'A', status: 'active', count: 1, listId: 'l1' }],
  };
  saveState(state, { storage });

  const stored = JSON.parse(storage.getItem(STORAGE_KEY));
  assert.equal(stored.schemaVersion, 2);
  assert.equal(stored.currentListId, 'l1');
  assert.equal(stored.lists.length, 1);
  assert.equal(stored.tasks.length, 1);
  assert.equal(stored.tasks[0].listId, 'l1');
});

test('exportStateData serializes current v2 state', () => {
  const state = {
    schemaVersion: 2,
    currentListId: 'l1',
    lists: [{ id: 'l1', name: 'タスクリスト', createdAt: 1 }],
    tasks: [{ id: '1', title: 'A', status: 'active', count: 1, listId: 'l1' }],
  };

  const raw = exportStateData(state);
  const parsed = JSON.parse(raw);
  assert.equal(parsed.schemaVersion, 2);
  assert.equal(parsed.currentListId, 'l1');
  assert.equal(parsed.lists.length, 1);
  assert.equal(parsed.tasks.length, 1);
});

test('importStateData accepts v2 backup payload', () => {
  const raw = JSON.stringify({
    schemaVersion: 2,
    currentListId: 'l1',
    lists: [{ id: 'l1', name: 'A', createdAt: 1 }],
    tasks: [{ id: 't1', title: 'Task', status: 'active', count: 0, listId: 'l1' }],
  });

  const state = importStateData(raw);
  assert.equal(state.schemaVersion, 2);
  assert.equal(state.currentListId, 'l1');
  assert.equal(state.tasks[0].listId, 'l1');
});

test('importStateData migrates v1 payload to v2', () => {
  const raw = JSON.stringify({
    schemaVersion: 1,
    tasks: [{ id: 't1', title: 'Task', status: 'active', count: 3 }],
  });

  const state = importStateData(raw);
  assert.equal(state.schemaVersion, 2);
  assert.equal(state.lists.length, 1);
  assert.equal(state.tasks[0].listId, state.currentListId);
});

test('importStateData throws for invalid payload', () => {
  assert.throws(() => importStateData('{"schemaVersion":2,"tasks":[]}'));
});
