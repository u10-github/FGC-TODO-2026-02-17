export const DEFAULT_SHARE_API_BASE_URL = 'https://fgc-todo-sharing.nextround.workers.dev';
export const DEFAULT_SHARE_APP_BASE_URL = 'https://fgc-todo-sharing.nextround.workers.dev';

function trimTrailingSlash(value) {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

function normalizeConfiguredUrl(value) {
  if (typeof value !== 'string') return '';
  return value.trim();
}

function resolveBuildEnv(globalLike = globalThis) {
  const processEnv = globalLike?.process?.env;
  const importMetaEnv = import.meta?.env;
  return {
    VITE_API_BASE_URL: normalizeConfiguredUrl(importMetaEnv?.VITE_API_BASE_URL) || normalizeConfiguredUrl(processEnv?.VITE_API_BASE_URL),
    API_BASE_URL: normalizeConfiguredUrl(importMetaEnv?.API_BASE_URL) || normalizeConfiguredUrl(processEnv?.API_BASE_URL),
    VITE_SHARE_API_BASE_URL: normalizeConfiguredUrl(importMetaEnv?.VITE_SHARE_API_BASE_URL) || normalizeConfiguredUrl(processEnv?.VITE_SHARE_API_BASE_URL),
    SHARE_API_BASE_URL: normalizeConfiguredUrl(processEnv?.SHARE_API_BASE_URL),
    VITE_SHARE_APP_BASE_URL: normalizeConfiguredUrl(importMetaEnv?.VITE_SHARE_APP_BASE_URL) || normalizeConfiguredUrl(processEnv?.VITE_SHARE_APP_BASE_URL),
    SHARE_APP_BASE_URL: normalizeConfiguredUrl(processEnv?.SHARE_APP_BASE_URL),
  };
}

export function resolveShareApiBaseUrl(globalLike = globalThis) {
  const runtimeValue = normalizeConfiguredUrl(globalLike?.__APP_CONFIG__?.API_BASE_URL);
  if (runtimeValue) return trimTrailingSlash(runtimeValue);

  const env = resolveBuildEnv(globalLike);
  const legacyGlobalValue = normalizeConfiguredUrl(globalLike?.SHARE_API_BASE_URL);
  const normalized = env.VITE_API_BASE_URL
    || env.API_BASE_URL
    || env.VITE_SHARE_API_BASE_URL
    || env.SHARE_API_BASE_URL
    || legacyGlobalValue;
  if (!normalized) return DEFAULT_SHARE_API_BASE_URL;
  return trimTrailingSlash(normalized);
}

export function resolveShareAppBaseUrl(globalLike = globalThis) {
  const runtimeValue = normalizeConfiguredUrl(globalLike?.__APP_CONFIG__?.SHARE_APP_BASE_URL);
  if (runtimeValue) return trimTrailingSlash(runtimeValue);

  const env = resolveBuildEnv(globalLike);
  const legacyGlobalValue = normalizeConfiguredUrl(globalLike?.SHARE_APP_BASE_URL);
  const normalized = env.VITE_SHARE_APP_BASE_URL
    || env.SHARE_APP_BASE_URL
    || env.VITE_API_BASE_URL
    || env.API_BASE_URL
    || legacyGlobalValue;
  if (!normalized) return DEFAULT_SHARE_APP_BASE_URL;
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

function buildShareUrl(path, {
  shareAppBaseUrl,
  returnTo,
  payloadJson,
  title,
}) {
  const baseUrl = trimTrailingSlash(shareAppBaseUrl);
  const params = new URLSearchParams();
  if (typeof title === 'string' && title.length > 0) {
    params.set('title', title);
  }
  if (typeof payloadJson === 'string' && payloadJson.length > 0) {
    params.set('payload_json', payloadJson);
  }
  if (typeof returnTo === 'string' && returnTo.length > 0) {
    params.set('return_to', returnTo);
  }
  const query = params.toString();
  return query ? `${baseUrl}${path}?${query}` : `${baseUrl}${path}`;
}

export function buildSharePublishUrl({
  shareAppBaseUrl,
  returnTo,
  payloadJson,
  title,
}) {
  return buildShareUrl('/ui/publish', { shareAppBaseUrl, returnTo, payloadJson, title });
}

export function buildShareSearchUrl({ shareAppBaseUrl, returnTo }) {
  return buildShareUrl('/ui/search', { shareAppBaseUrl, returnTo });
}

export function shouldShowImportSuccess(search) {
  const params = new URLSearchParams(search);
  return params.get('imported') === '1';
}
