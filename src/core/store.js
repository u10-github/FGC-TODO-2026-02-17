export const STORAGE_KEY = 'fg_task_manager_v1';
export const SCHEMA_VERSION = 2;
export const DEFAULT_LIST_ID = 'default-list';
export const DEFAULT_LIST_NAME = 'タスクリスト';
export const ONBOARDING_LIST_ID = 'onboarding-list';
export const ONBOARDING_LIST_NAME = 'タスクリスト';

const ONBOARDING_TASK_TITLES = [
  '右下の＋ボタンでタスクを追加する',
  '右上の「タスクリスト」を押して新規タスクリストを追加する',
  '左上の☰メニューから「データをエクスポート」でデータをバックアップする',
  '左上の☰メニューから「このリストを公開する」で現在のタスクリストを公開する',
  '左上の☰メニューから「公開リストを探す」で他のタスクリストを検索してインポートする',
];

function createOnboardingInitialState() {
  return {
    schemaVersion: SCHEMA_VERSION,
    currentListId: ONBOARDING_LIST_ID,
    lists: [{ id: ONBOARDING_LIST_ID, name: ONBOARDING_LIST_NAME, description: '最初の操作ガイド', createdAt: 0 }],
    tasks: ONBOARDING_TASK_TITLES.map((title, index) => ({
      id: `onboarding-task-${index + 1}`,
      title,
      status: 'active',
      count: 0,
      listId: ONBOARDING_LIST_ID,
    })),
  };
}

export function createInitialState() {
  return createOnboardingInitialState();
}

function normalizeList(list) {
  return {
    ...list,
    description: typeof list?.description === 'string' ? list.description : '',
  };
}

function normalizeTask(task, { fallbackListId } = {}) {
  const source = task && typeof task === 'object' ? task : {};
  const { description: _ignored, ...rest } = source;
  const listId = typeof source.listId === 'string' && source.listId ? source.listId : fallbackListId;
  return {
    ...rest,
    listId,
  };
}

function migrateV1ToV2(stateV1) {
  const initial = createInitialState();
  return {
    ...initial,
    tasks: stateV1.tasks.map((task) => normalizeTask(task, { fallbackListId: initial.currentListId })),
  };
}

function isValidV2State(parsed) {
  if (parsed.schemaVersion !== SCHEMA_VERSION) return false;
  if (!Array.isArray(parsed.tasks) || !Array.isArray(parsed.lists)) return false;
  if (typeof parsed.currentListId !== 'string' || !parsed.currentListId) return false;
  const listIds = new Set(parsed.lists.map((list) => list?.id).filter(Boolean));
  if (!listIds.has(parsed.currentListId)) return false;
  const listsValid = parsed.lists.every((list) => (
    typeof list?.id === 'string'
    && list.id.length > 0
    && typeof list?.name === 'string'
    && list.name.length > 0
    && (typeof list?.description === 'string' || typeof list?.description === 'undefined')
  ));
  if (!listsValid) return false;
  return parsed.tasks.every((task) => (
    typeof task?.listId === 'string'
    && listIds.has(task.listId)
  ));
}

function isLegacyEmptyDefaultState(parsed) {
  if (!isValidV2State(parsed)) return false;
  if (parsed.tasks.length > 0) return false;
  if (parsed.currentListId !== DEFAULT_LIST_ID) return false;
  if (parsed.lists.length !== 1) return false;
  const [list] = parsed.lists;
  if (list?.id !== DEFAULT_LIST_ID) return false;
  return list?.name === DEFAULT_LIST_NAME;
}

function parseStatePayload(raw, { throwOnInvalid = false, logger = console } = {}) {
  try {
    const parsed = JSON.parse(raw);
    if (parsed.schemaVersion === 1 && Array.isArray(parsed.tasks)) {
      return migrateV1ToV2(parsed);
    }

    if (!isValidV2State(parsed)) {
      if (throwOnInvalid) throw new Error('Invalid backup schema');
      logger.warn('[store] Invalid schema. Fallback to initial state.');
      return createInitialState();
    }

    if (isLegacyEmptyDefaultState(parsed)) {
      return createInitialState();
    }

    return {
      schemaVersion: SCHEMA_VERSION,
      currentListId: parsed.currentListId,
      lists: parsed.lists.map((list) => normalizeList(list)),
      tasks: parsed.tasks.map((task) => normalizeTask(task)),
    };
  } catch (error) {
    if (throwOnInvalid) {
      throw new Error('Invalid backup data');
    }
    logger.warn('[store] Failed to load localStorage data. Fallback to initial state.', error); // arch-guard:allow
    return createInitialState();
  }
}

export function loadState({ storage, logger = console, key = STORAGE_KEY } = {}) {
  if (!storage) {
    throw new Error('storage is required');
  }

  try {
    const raw = storage.getItem(key);
    if (!raw) return createInitialState();
    return parseStatePayload(raw, { logger });
  } catch {
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
    lists: safeState.lists.map((list) => normalizeList(list)),
    tasks: safeState.tasks.map((task) => normalizeTask(task)),
  });

  storage.setItem(key, payload);
}

export function exportStateData(state) {
  const safeState = {
    ...createInitialState(),
    ...state,
  };

  return JSON.stringify({
    schemaVersion: SCHEMA_VERSION,
    currentListId: safeState.currentListId,
    lists: safeState.lists.map((list) => normalizeList(list)),
    tasks: safeState.tasks.map((task) => normalizeTask(task)),
  });
}

export function importStateData(raw) {
  return parseStatePayload(raw, { throwOnInvalid: true });
}

function createUniqueListName(baseName, usedNames) {
  const normalized = (baseName || '').trim() || 'インポート';
  if (!usedNames.has(normalized)) {
    usedNames.add(normalized);
    return normalized;
  }

  let i = 1;
  while (usedNames.has(`${normalized}(${i})`)) {
    i += 1;
  }
  const name = `${normalized}(${i})`;
  usedNames.add(name);
  return name;
}

function createUniqueId(prefix, usedIds, start = 0) {
  let i = start;
  let candidate = `${prefix}-${i}`;
  while (usedIds.has(candidate)) {
    i += 1;
    candidate = `${prefix}-${i}`;
  }
  usedIds.add(candidate);
  return candidate;
}

export function mergeImportedState(currentState, importedState) {
  const now = Date.now(); // arch-guard:allow
  const safeCurrent = {
    ...createInitialState(),
    ...currentState,
    lists: [...(currentState?.lists ?? createInitialState().lists)].map((list) => normalizeList(list)),
    tasks: [...(currentState?.tasks ?? [])].map((task) => normalizeTask(task)),
  };

  const usedNames = new Set(safeCurrent.lists.map((list) => list.name));
  const usedListIds = new Set(safeCurrent.lists.map((list) => list.id));
  const usedTaskIds = new Set(safeCurrent.tasks.map((task) => task.id));
  const importedListIdMap = new Map();

  const appendedLists = importedState.lists.map((list, index) => {
    const normalizedList = normalizeList(list);
    const listId = createUniqueId(`imp-list-${now}`, usedListIds, index);
    const listName = createUniqueListName(normalizedList.name, usedNames);
    importedListIdMap.set(list.id, listId);
    return {
      id: listId,
      name: listName,
      description: normalizedList.description,
      createdAt: now + index,
    };
  });

  const appendedTasks = importedState.tasks
    .filter((task) => importedListIdMap.has(task.listId))
    .map((task, index) => ({
      ...normalizeTask(task),
      id: createUniqueId(`imp-task-${now}`, usedTaskIds, index),
      listId: importedListIdMap.get(task.listId),
    }));

  const importedCurrentListId = importedListIdMap.get(importedState.currentListId);

  return {
    ...safeCurrent,
    currentListId: importedCurrentListId ?? appendedLists[0]?.id ?? safeCurrent.currentListId,
    lists: [...safeCurrent.lists, ...appendedLists],
    tasks: [...safeCurrent.tasks, ...appendedTasks],
  };
}
