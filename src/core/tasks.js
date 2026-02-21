export const REQ_IDS = {
  UC1: 'REQ-UC1',
  UC2: 'REQ-UC2',
  UC3: 'REQ-UC3',
  UC4: 'REQ-UC4',
  UC5: 'REQ-UC5',
  UC6: 'REQ-UC6',
  UC7: 'REQ-UC7',
  UC8: 'REQ-UC8',
};

function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

function updateTask(state, id, updater) {
  return {
    ...state,
    tasks: state.tasks.map((task) => (task.id === id ? updater(task) : task)),
  };
}

export function addTask(state, title, listId = state.currentListId) {
  const normalizedTitle = title.trim();
  if (!normalizedTitle) return state;
  if (!listId) return state;

  const task = {
    id: createId(),
    title: normalizedTitle,
    status: 'active',
    count: 0,
    listId,
  };

  return { ...state, tasks: [...state.tasks, task] };
}

export function incCount(state, id) {
  return updateTask(state, id, (task) => ({ ...task, count: task.count + 1 }));
}

export function resetCount(state, id) {
  return updateTask(state, id, (task) => ({ ...task, count: 0 }));
}

export function completeTask(state, id) {
  return updateTask(state, id, (task) => ({ ...task, status: 'done' }));
}

export function restoreTask(state, id) {
  return updateTask(state, id, (task) => ({ ...task, status: 'active' }));
}

export function deleteTask(state, id) {
  return {
    ...state,
    tasks: state.tasks.filter((task) => task.id !== id),
  };
}

export function getTasksByList(state, listId) {
  return state.tasks.filter((task) => task.listId === listId);
}

export function reorderActiveTask(state, listId, taskId, toIndex) {
  const activeIds = state.tasks
    .filter((task) => task.listId === listId && task.status === 'active')
    .map((task) => task.id);
  const fromIndex = activeIds.indexOf(taskId);
  if (fromIndex < 0) return state;

  const safeToIndex = Math.max(0, Math.min(toIndex, activeIds.length - 1));
  if (fromIndex === safeToIndex) return state;

  const reorderedIds = [...activeIds];
  const [movedId] = reorderedIds.splice(fromIndex, 1);
  reorderedIds.splice(safeToIndex, 0, movedId);

  const activeById = new Map(
    state.tasks
      .filter((task) => task.listId === listId && task.status === 'active')
      .map((task) => [task.id, task]),
  );
  let cursor = 0;

  return {
    ...state,
    tasks: state.tasks.map((task) => {
      if (task.listId !== listId || task.status !== 'active') return task;
      const reorderedTask = activeById.get(reorderedIds[cursor]);
      cursor += 1;
      return reorderedTask ?? task;
    }),
  };
}

export function copyTasksToList(state, taskIds, destinationListId) {
  if (!destinationListId || !Array.isArray(taskIds) || taskIds.length === 0) return state;
  const targetIds = [...new Set(taskIds)];
  const tasksToCopy = state.tasks.filter((task) => targetIds.includes(task.id));
  if (!tasksToCopy.length) return state;

  const copiedTasks = tasksToCopy.map((task) => ({
    ...task,
    id: createId(),
    listId: destinationListId,
  }));

  return {
    ...state,
    tasks: [...state.tasks, ...copiedTasks],
  };
}

export function moveTasksToList(state, taskIds, destinationListId) {
  if (!destinationListId || !Array.isArray(taskIds) || taskIds.length === 0) return state;
  const targetIds = new Set(taskIds);

  return {
    ...state,
    tasks: state.tasks.map((task) => (targetIds.has(task.id) ? { ...task, listId: destinationListId } : task)),
  };
}
