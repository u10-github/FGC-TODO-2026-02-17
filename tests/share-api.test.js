import test from 'node:test';
import assert from 'node:assert/strict';
import { createShareApiClient } from '../src/ui/share-api.js';

test('share api client uses configured base URL for all required endpoints', async () => {
  const calls = [];
  const fetchImpl = async (url, options = {}) => {
    calls.push({ url, options });
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  };
  const client = createShareApiClient({
    fetchImpl,
    baseUrl: 'https://fgc-todo-sharing.nextround.workers.dev/',
  });

  await client.listGames();
  await client.listCharacters('sf6');
  await client.searchLists({ gameKey: 'sf6', characterKey: 'ryu' });
  await client.createList({ title: 'list1' });
  await client.getList('abc');
  await client.markImported('abc');

  assert.deepEqual(
    calls.map((item) => item.url),
    [
      'https://fgc-todo-sharing.nextround.workers.dev/catalog/games',
      'https://fgc-todo-sharing.nextround.workers.dev/catalog/characters?game_key=sf6',
      'https://fgc-todo-sharing.nextround.workers.dev/search?game_key=sf6&character_key=ryu&sort=imports_desc',
      'https://fgc-todo-sharing.nextround.workers.dev/lists',
      'https://fgc-todo-sharing.nextround.workers.dev/lists/abc',
      'https://fgc-todo-sharing.nextround.workers.dev/lists/abc/imported',
    ],
  );
});
