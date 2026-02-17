export const STORAGE_KEY = 'fg_task_manager_v1';
export const SCHEMA_VERSION = 1;

export function createInitialState() {
  return {
    schemaVersion: SCHEMA_VERSION,
    tasks: [],
  };
}

export function loadState({ storage, logger = console, key = STORAGE_KEY } = {}) {
  if (!storage) {
    throw new Error('storage is required');
  }

  try {
    const raw = storage.getItem(key);
    if (!raw) return createInitialState();

    const parsed = JSON.parse(raw);
    if (
      parsed.schemaVersion !== SCHEMA_VERSION ||
      !Array.isArray(parsed.tasks)
    ) {
      logger.warn('[store] Invalid schema. Fallback to initial state.');
      return createInitialState();
    }

    return {
      schemaVersion: SCHEMA_VERSION,
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

  const payload = JSON.stringify({
    schemaVersion: SCHEMA_VERSION,
    tasks: state.tasks,
  });

  storage.setItem(key, payload);
}
