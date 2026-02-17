import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState, loadState, saveState, STORAGE_KEY } from '../src/core/store.js';

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

test('loadState falls back and warns when JSON is broken', () => {
  const storage = new InMemoryStorage({ [STORAGE_KEY]: '{oops' });
  let warned = false;
  const logger = { warn: () => { warned = true; } };

  const state = loadState({ storage, logger });

  assert.deepEqual(state, createInitialState());
  assert.equal(warned, true);
});

test('saveState writes schemaVersion and tasks', () => {
  const storage = new InMemoryStorage();
  saveState({ schemaVersion: 1, tasks: [{ id: '1', title: 'A', status: 'active', count: 1 }] }, { storage });

  const stored = JSON.parse(storage.getItem(STORAGE_KEY));
  assert.equal(stored.schemaVersion, 1);
  assert.equal(stored.tasks.length, 1);
});
