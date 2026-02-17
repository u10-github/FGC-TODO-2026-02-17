export const REQ_IDS = {
  UC1: 'REQ-UC1',
  UC2: 'REQ-UC2',
  UC3: 'REQ-UC3',
  UC4: 'REQ-UC4',
  UC5: 'REQ-UC5',
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

export function addTask(state, title) {
  const normalizedTitle = title.trim();
  if (!normalizedTitle) return state;

  const task = {
    id: createId(),
    title: normalizedTitle,
    status: 'active',
    count: 0,
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
