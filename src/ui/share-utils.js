export const DEFAULT_SHARE_API_BASE_URL = 'http://127.0.0.1:8787';

function trimTrailingSlash(value) {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

export function resolveShareApiBaseUrl(globalLike = globalThis) {
  const raw = typeof globalLike?.SHARE_API_BASE_URL === 'string'
    ? globalLike.SHARE_API_BASE_URL
    : '';
  const normalized = raw.trim();
  if (!normalized) return DEFAULT_SHARE_API_BASE_URL;
  return trimTrailingSlash(normalized);
}

function normalizeOptionalText(value) {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

export function buildSharePayload(state, {
  listId,
  title,
  gameKey,
  characterKey,
  versionText,
  description,
  turnstileToken,
  parentId,
}) {
  const targetList = state.lists.find((list) => list.id === listId);
  if (!targetList) {
    throw new Error('selected list was not found');
  }

  const exportListId = `share-${Date.now()}`;
  const exportedState = {
    schemaVersion: 2,
    currentListId: exportListId,
    lists: [{
      id: exportListId,
      name: title,
      createdAt: Date.now(),
    }],
    tasks: state.tasks
      .filter((task) => task.listId === listId)
      .map((task) => ({
        ...task,
        listId: exportListId,
      })),
  };

  return {
    title,
    game_key: gameKey,
    character_key: characterKey,
    payload_json: JSON.stringify(exportedState),
    turnstile_token: turnstileToken,
    version_text: normalizeOptionalText(versionText),
    description: normalizeOptionalText(description),
    parent_id: typeof parentId === 'string' && parentId.trim() ? parentId : null,
  };
}
