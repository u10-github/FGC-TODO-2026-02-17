import { resolveShareApiBaseUrl } from './share-utils.js';

async function readResponseBody(response) {
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return response.json();
  }
  const text = await response.text();
  return text ? { error: text } : null;
}

export function createShareApiClient({
  fetchImpl = fetch,
  baseUrl = resolveShareApiBaseUrl(globalThis),
} = {}) {
  const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

  async function request(path, options = {}) {
    const response = await fetchImpl(`${normalizedBaseUrl}${path}`, options);
    const data = await readResponseBody(response);

    if (!response.ok) {
      const message = typeof data?.error === 'string' ? data.error : `Request failed (${response.status})`;
      const error = new Error(message);
      error.status = response.status;
      throw error;
    }

    return data;
  }

  return {
    listGames() {
      return request('/catalog/games');
    },
    listCharacters(gameKey) {
      const params = new URLSearchParams({ game_key: gameKey });
      return request(`/catalog/characters?${params.toString()}`);
    },
    searchLists({ gameKey, characterKey, sort = 'imports_desc', parentId }) {
      const params = new URLSearchParams({
        game_key: gameKey,
        character_key: characterKey,
        sort,
      });
      if (parentId) {
        params.set('parent_id', parentId);
      }
      return request(`/search?${params.toString()}`);
    },
    createList(payload) {
      return request('/lists', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
    },
    getList(id) {
      return request(`/lists/${encodeURIComponent(id)}`);
    },
    markImported(id) {
      return request(`/lists/${encodeURIComponent(id)}/imported`, { method: 'POST' });
    },
  };
}
