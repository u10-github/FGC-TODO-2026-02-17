import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildSharePayload,
  buildSharePublishUrl,
  buildShareSearchUrl,
  resolveShareApiBaseUrl,
  resolveShareAppBaseUrl,
  shouldShowImportSuccess,
} from '../src/ui/share-utils.js';

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
  assert.equal(url, 'https://fgc-todo-sharing.nextround.workers.dev');
});

test('resolveShareApiBaseUrl prioritizes window.__APP_CONFIG__.API_BASE_URL', () => {
  const url = resolveShareApiBaseUrl({
    __APP_CONFIG__: { API_BASE_URL: 'https://runtime-config.example.com/' },
    SHARE_API_BASE_URL: 'https://legacy-global.example.com',
    process: { env: { VITE_API_BASE_URL: 'https://env.example.com' } },
  });
  assert.equal(url, 'https://runtime-config.example.com');
});

test('resolveShareApiBaseUrl falls back to VITE_API_BASE_URL when runtime config is missing', () => {
  const url = resolveShareApiBaseUrl({
    process: { env: { VITE_API_BASE_URL: 'https://env.example.com/' } },
  });
  assert.equal(url, 'https://env.example.com');
});

test('resolveShareApiBaseUrl trims trailing slash', () => {
  const url = resolveShareApiBaseUrl({ SHARE_API_BASE_URL: 'https://api.example.com/' });
  assert.equal(url, 'https://api.example.com');
});

test('resolveShareAppBaseUrl uses default when global variable is missing', () => {
  const url = resolveShareAppBaseUrl({});
  assert.equal(url, 'https://fgc-todo-sharing.nextround.workers.dev');
});

test('buildSharePublishUrl includes title, payload_json and return_to query', () => {
  const url = buildSharePublishUrl({
    shareAppBaseUrl: 'https://sharing.example.com',
    title: 'Ryu Public',
    payloadJson: '{"foo":1}',
    returnTo: 'https://todo.example.com/index.html?from=share',
  });
  assert.equal(
    url,
    'https://sharing.example.com/ui/publish?title=Ryu+Public&payload_json=%7B%22foo%22%3A1%7D&return_to=https%3A%2F%2Ftodo.example.com%2Findex.html%3Ffrom%3Dshare',
  );
});

test('buildShareSearchUrl includes return_to query', () => {
  const url = buildShareSearchUrl({
    shareAppBaseUrl: 'https://sharing.example.com/',
    returnTo: 'https://todo.example.com/index.html',
  });
  assert.equal(url, 'https://sharing.example.com/ui/search?return_to=https%3A%2F%2Ftodo.example.com%2Findex.html');
});

test('shouldShowImportSuccess detects imported status in query parameters', () => {
  assert.equal(shouldShowImportSuccess('?imported=1'), true);
  assert.equal(shouldShowImportSuccess('?imported=0'), false);
  assert.equal(shouldShowImportSuccess('?share_imported=1'), false);
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
