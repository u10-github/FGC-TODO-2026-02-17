export const STORAGE_KEY = 'fg_task_manager_v1';
export const SCHEMA_VERSION = 2;
export const DEFAULT_LIST_ID = 'default-list';
export const DEFAULT_LIST_NAME = 'タスクリスト';

export function createInitialState() {
  return {
    schemaVersion: SCHEMA_VERSION,
    currentListId: DEFAULT_LIST_ID,
    lists: [{ id: DEFAULT_LIST_ID, name: DEFAULT_LIST_NAME, createdAt: 0 }],
    tasks: [],
  };
}

function migrateV1ToV2(stateV1) {
  const initial = createInitialState();
  return {
    ...initial,
    tasks: stateV1.tasks.map((task) => ({ ...task, listId: initial.currentListId })),
  };
}

function isValidV2State(parsed) {
  if (parsed.schemaVersion !== SCHEMA_VERSION) return false;
  if (!Array.isArray(parsed.tasks) || !Array.isArray(parsed.lists)) return false;
  if (typeof parsed.currentListId !== 'string' || !parsed.currentListId) return false;
  return parsed.lists.some((list) => list?.id === parsed.currentListId);
}

export function loadState({ storage, logger = console, key = STORAGE_KEY } = {}) {
  if (!storage) {
    throw new Error('storage is required');
  }

  try {
    const raw = storage.getItem(key);
    if (!raw) return createInitialState();

    const parsed = JSON.parse(raw);
    if (parsed.schemaVersion === 1 && Array.isArray(parsed.tasks)) {
      return migrateV1ToV2(parsed);
    }

    if (!isValidV2State(parsed)) {
      logger.warn('[store] Invalid schema. Fallback to initial state.');
      return createInitialState();
    }

    return {
      schemaVersion: SCHEMA_VERSION,
      currentListId: parsed.currentListId,
      lists: parsed.lists,
      tasks: parsed.tasks,
    };
  } catch (error) {
    logger.warn('[store] Failed to load localStorage data. Fallback to initial state.', error);
    return createInitialState();
  }
}

export function saveState(state, { storage, key = STORAGE_KEY } = {}) {
  if (!storage) {
    throw new Error('storage is required');
  }

  const safeState = {
    ...createInitialState(),
    ...state,
  };

  const payload = JSON.stringify({
    schemaVersion: SCHEMA_VERSION,
    currentListId: safeState.currentListId,
    lists: safeState.lists,
    tasks: safeState.tasks,
  });

  storage.setItem(key, payload);
}
