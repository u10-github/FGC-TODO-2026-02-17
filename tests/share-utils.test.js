import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSharePayload, resolveShareApiBaseUrl } from '../src/ui/share-utils.js';

const baseState = {
  schemaVersion: 2,
  currentListId: 'l1',
  lists: [
    { id: 'l1', name: 'Ryu Plan', createdAt: 10 },
    { id: 'l2', name: 'Ken Plan', createdAt: 20 },
  ],
  tasks: [
    { id: 't1', title: 'A', status: 'active', count: 2, listId: 'l1' },
    { id: 't2', title: 'B', status: 'done', count: 1, listId: 'l1' },
    { id: 't3', title: 'C', status: 'active', count: 3, listId: 'l2' },
  ],
};

test('resolveShareApiBaseUrl uses default when global variable is missing', () => {
  const url = resolveShareApiBaseUrl({});
  assert.equal(url, 'http://127.0.0.1:8787');
});

test('resolveShareApiBaseUrl trims trailing slash', () => {
  const url = resolveShareApiBaseUrl({ SHARE_API_BASE_URL: 'https://api.example.com/' });
  assert.equal(url, 'https://api.example.com');
});

test('buildSharePayload exports only selected list tasks', () => {
  const payload = buildSharePayload(baseState, {
    listId: 'l1',
    title: 'Ryu Public',
    gameKey: 'sf6',
    characterKey: 'ryu',
    versionText: 'v1',
    description: 'for training',
    turnstileToken: 'bypass-local',
    parentId: null,
  });

  assert.equal(payload.title, 'Ryu Public');
  assert.equal(payload.game_key, 'sf6');
  assert.equal(payload.character_key, 'ryu');
  assert.equal(payload.turnstile_token, 'bypass-local');

  const parsed = JSON.parse(payload.payload_json);
  assert.equal(parsed.lists.length, 1);
  assert.equal(parsed.lists[0].name, 'Ryu Public');
  assert.equal(parsed.tasks.length, 2);
  assert.equal(parsed.tasks.every((task) => task.listId === parsed.currentListId), true);
});
