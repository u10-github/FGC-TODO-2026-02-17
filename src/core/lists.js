export function renameList(state, listId, candidateName) {
  const nextName = candidateName.trim();
  if (!nextName) return state;

  const duplicated = state.lists.some((list) => list.id !== listId && list.name === nextName);
  if (duplicated) return state;

  return {
    ...state,
    lists: state.lists.map((list) => (list.id === listId ? { ...list, name: nextName } : list)),
  };
}

export function deleteList(state, listId) {
  if (state.lists.length <= 1) return state;
  if (!state.lists.some((list) => list.id === listId)) return state;

  const lists = state.lists.filter((list) => list.id !== listId);
  const tasks = state.tasks.filter((task) => task.listId !== listId);
  const currentListId = state.currentListId === listId ? lists[0].id : state.currentListId;

  return {
    ...state,
    currentListId,
    lists,
    tasks,
  };
}
