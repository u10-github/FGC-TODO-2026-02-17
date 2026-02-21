import {
  addTask,
  completeTask,
  deleteTask,
  getTasksByList,
  copyTasksToList,
  incCount,
  moveTasksToList,
  reorderActiveTask,
  resetCount,
  restoreTask,
} from '../core/tasks.js';
import { deleteList, renameList } from '../core/lists.js';
import { exportStateData, importStateData, loadState, mergeImportedState, saveState } from '../core/store.js';

const els = {
  menuBtn: document.getElementById('menu-btn'),
  menuPopover: document.getElementById('menu-popover'),
  exportBtn: document.getElementById('export-btn'),
  importBtn: document.getElementById('import-btn'),
  importFileInput: document.getElementById('import-file-input'),
  listSwitchBtn: document.getElementById('list-switch-btn'),
  tabActive: document.getElementById('tab-active'),
  tabDone: document.getElementById('tab-done'),
  selectionToggleBtn: document.getElementById('selection-toggle-btn'),
  reorderToggleBtn: document.getElementById('reorder-toggle-btn'),
  reorderHelp: document.getElementById('reorder-help'),
  selectionHelp: document.getElementById('selection-help'),
  panelActive: document.getElementById('panel-active'),
  panelDone: document.getElementById('panel-done'),
  activeList: document.getElementById('active-list'),
  doneList: document.getElementById('done-list'),
  activeEmpty: document.getElementById('active-empty'),
  doneEmpty: document.getElementById('done-empty'),
  fabAdd: document.getElementById('fab-add'),
  sheet: document.getElementById('add-sheet'),
  backdrop: document.getElementById('sheet-backdrop'),
  sheetInput: document.getElementById('sheet-task-title'),
  sheetError: document.getElementById('sheet-task-error'),
  sheetCancel: document.getElementById('sheet-cancel'),
  sheetSubmit: document.getElementById('sheet-submit'),
  listSheet: document.getElementById('list-sheet'),
  listInput: document.getElementById('list-name-input'),
  listCreateBtn: document.getElementById('list-create-btn'),
  listError: document.getElementById('list-error'),
  listItems: document.getElementById('list-items'),
  listSheetClose: document.getElementById('list-sheet-close'),
  bulkSheet: document.getElementById('bulk-sheet'),
  bulkSheetClose: document.getElementById('bulk-sheet-close'),
  bulkSheetTitle: document.getElementById('bulk-sheet-title'),
  bulkSheetDescription: document.getElementById('bulk-sheet-description'),
  bulkDestinationList: document.getElementById('bulk-destination-list'),
  selectionActionBar: document.getElementById('selection-action-bar'),
  selectionCount: document.getElementById('selection-count'),
  toast: document.getElementById('toast'),
  liveRegion: document.getElementById('live-region'),
};

let state = loadState({ storage: window.localStorage });
let currentTab = 'active';
let toastTimer = null;
let listMenuId = null;
const expandedTaskIds = new Set();
let reorderState = null;
let isReorderMode = false;
let isSelectionMode = false;
const selectedTaskIds = new Set();
let pendingBulkAction = null;

function createListId() {
  return `list-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function getCurrentList() {
  return state.lists.find((list) => list.id === state.currentListId) ?? state.lists[0];
}

function commit(nextState) {
  state = nextState;
  saveState(state, { storage: window.localStorage });
  render();
}

function cancelReorderInteraction() {
  reorderState = null;
  clearReorderStyles();
}

function exitSelectionMode() {
  isSelectionMode = false;
  selectedTaskIds.clear();
  pendingBulkAction = null;
}

function closeBulkSheet() {
  pendingBulkAction = null;
  els.bulkSheet.classList.add('is-hidden');
  els.bulkDestinationList.innerHTML = '';
  els.bulkSheetDescription.textContent = '';
  if (els.sheet.classList.contains('is-hidden') && els.listSheet.classList.contains('is-hidden')) {
    els.backdrop.classList.add('is-hidden');
  }
}

function openBulkSheet(action) {
  pendingBulkAction = action;
  els.sheet.classList.add('is-hidden');
  els.listSheet.classList.add('is-hidden');
  els.bulkSheet.classList.remove('is-hidden');
  els.backdrop.classList.remove('is-hidden');

  const selectedCount = selectedTaskIds.size;
  const actionLabel = action === 'move' ? '移動' : 'コピー';
  els.bulkSheetTitle.textContent = `${actionLabel}先を選択`;
  els.bulkSheetDescription.textContent = `${selectedCount}件のタスクを${actionLabel}します。`;

  const currentList = getCurrentList();
  const destinations = state.lists.filter((list) => list.id !== currentList.id);
  if (destinations.length < 1) {
    els.bulkSheetDescription.textContent = '移動先/コピー先リストがありません。先にリストを作成してください。';
    els.bulkDestinationList.innerHTML = '';
    return;
  }
  els.bulkDestinationList.innerHTML = destinations
    .map(
      (list) => `<li class="list-row">
        <button class="list-item-btn" type="button" data-action="bulk-destination" data-list-id="${list.id}">${escapeHtml(list.name)}</button>
      </li>`,
    )
    .join('');
}

function runBulkAction(destinationListId) {
  if (!pendingBulkAction || !destinationListId || selectedTaskIds.size < 1) return;

  const action = pendingBulkAction;
  const nextState = action === 'move'
    ? moveTasksToList(state, [...selectedTaskIds], destinationListId)
    : copyTasksToList(state, [...selectedTaskIds], destinationListId);
  const destination = state.lists.find((list) => list.id === destinationListId);
  commit(nextState);
  const count = selectedTaskIds.size;
  announce(`${count}件のタスクを${action === 'move' ? '移動' : 'コピー'}しました。`);
  closeBulkSheet();
  exitSelectionMode();
  render();
  if (destination) {
    showUndoToast('', `${count}件を「${destination.name}」へ${action === 'move' ? '移動' : 'コピー'}しました。`, { withUndo: false });
  }
}

function clearReorderStyles() {
  els.activeList.querySelectorAll('.task-item').forEach((row) => {
    row.classList.remove('is-reordering', 'is-drop-target');
  });
  document.body.classList.remove('is-reordering');
}

function getActiveTaskRows() {
  return [...els.activeList.querySelectorAll('.task-item[data-task-id]')];
}

function resolveDropIndex(pointerY) {
  const rows = getActiveTaskRows();
  if (!rows.length) return 0;

  for (let i = 0; i < rows.length; i += 1) {
    const rect = rows[i].getBoundingClientRect();
    if (pointerY < rect.top + rect.height / 2) return i;
  }

  return rows.length - 1;
}

function beginReorder(taskId, pointerId, pointerY) {
  if (currentTab !== 'active' || !isReorderMode) return;

  const activeTasks = getTasksByList(state, state.currentListId).filter((task) => task.status === 'active');
  const fromIndex = activeTasks.findIndex((task) => task.id === taskId);
  if (fromIndex < 0) return;

  reorderState = {
    pointerId,
    taskId,
    fromIndex,
    toIndex: fromIndex,
  };

  clearReorderStyles();
  document.body.classList.add('is-reordering');
  const rows = getActiveTaskRows();
  rows[fromIndex]?.classList.add('is-reordering');

  const targetIndex = resolveDropIndex(pointerY);
  reorderState.toIndex = targetIndex;
  rows[targetIndex]?.classList.add('is-drop-target');
}

function updateReorder(pointerY) {
  if (!reorderState) return;

  const nextIndex = resolveDropIndex(pointerY);
  if (nextIndex === reorderState.toIndex) return;
  reorderState.toIndex = nextIndex;

  const rows = getActiveTaskRows();
  rows.forEach((row) => row.classList.remove('is-drop-target'));
  rows[nextIndex]?.classList.add('is-drop-target');
}

function finishReorder() {
  if (!reorderState) return;

  const { taskId, fromIndex, toIndex } = reorderState;
  reorderState = null;
  clearReorderStyles();

  if (fromIndex === toIndex) return;

  commit(reorderActiveTask(state, state.currentListId, taskId, toIndex));
  announce('タスク順を並び替えました。');
}

function showMenu(show) {
  els.menuPopover.classList.toggle('is-hidden', !show);
  els.menuBtn.setAttribute('aria-expanded', String(show));
}

function render() {
  const currentList = getCurrentList();
  const listTasks = getTasksByList(state, currentList.id);
  const activeTasks = listTasks.filter((task) => task.status === 'active');
  const doneTasks = listTasks.filter((task) => task.status === 'done');

  els.activeList.innerHTML = activeTasks.map((task) => renderTask(task, false)).join('');
  els.doneList.innerHTML = doneTasks.map((task) => renderTask(task, true)).join('');
  els.listSwitchBtn.textContent = currentList.name;
  els.listItems.innerHTML = state.lists
    .map(
      (list) => {
        const isCurrent = list.id === currentList.id;
        const isMenuOpen = list.id === listMenuId;
        return `<li class="list-row">
          <button class="list-item-btn${isCurrent ? ' is-current' : ''}" type="button" data-list-action="switch" data-list-id="${list.id}">${escapeHtml(list.name)}</button>
          <button class="list-more-btn" type="button" data-list-action="more" data-list-id="${list.id}" aria-label="${escapeHtml(list.name)}の操作を開く" aria-expanded="${String(isMenuOpen)}">...</button>
          <div class="list-row-menu${isMenuOpen ? '' : ' is-hidden'}">
            <button class="list-row-menu-btn" type="button" data-list-action="rename" data-list-id="${list.id}">名前変更</button>
            <button class="list-row-menu-btn is-danger" type="button" data-list-action="delete" data-list-id="${list.id}" ${state.lists.length <= 1 ? 'disabled' : ''}>削除</button>
          </div>
        </li>`;
      },
    )
    .join('');

  els.activeEmpty.classList.toggle('is-hidden', activeTasks.length > 0);
  els.doneEmpty.classList.toggle('is-hidden', doneTasks.length > 0);

  const isActiveTab = currentTab === 'active';
  els.tabActive.classList.toggle('is-active', isActiveTab);
  els.tabDone.classList.toggle('is-active', !isActiveTab);
  els.tabActive.setAttribute('aria-selected', String(isActiveTab));
  els.tabDone.setAttribute('aria-selected', String(!isActiveTab));
  els.panelActive.classList.toggle('is-hidden', !isActiveTab);
  els.panelDone.classList.toggle('is-hidden', isActiveTab);

  const canSelect = isActiveTab && activeTasks.length > 0;
  const canReorder = isActiveTab && activeTasks.length > 1 && !isSelectionMode;
  if ((!canSelect || !isActiveTab) && isSelectionMode) {
    exitSelectionMode();
  }
  if (!canReorder && isReorderMode) {
    isReorderMode = false;
    cancelReorderInteraction();
  }

  els.selectionToggleBtn.disabled = !canSelect;
  els.selectionToggleBtn.classList.toggle('is-active', isSelectionMode);
  els.selectionToggleBtn.setAttribute('aria-pressed', String(isSelectionMode));
  const selectionLabel = isSelectionMode ? '選択完了' : 'タスク選択';
  els.selectionToggleBtn.textContent = selectionLabel;
  els.selectionToggleBtn.setAttribute('aria-label', selectionLabel);

  els.reorderToggleBtn.disabled = !canReorder;
  els.reorderToggleBtn.classList.toggle('is-active', isReorderMode);
  els.reorderToggleBtn.setAttribute('aria-pressed', String(isReorderMode));
  const reorderToggleLabel = isReorderMode ? '並び替え完了' : '順序入れ替え';
  els.reorderToggleBtn.textContent = reorderToggleLabel;
  els.reorderToggleBtn.setAttribute('aria-label', reorderToggleLabel);
  els.reorderHelp.classList.toggle('is-hidden', !isReorderMode);
  els.selectionHelp.classList.toggle('is-hidden', !isSelectionMode);
  els.selectionActionBar.classList.toggle('is-hidden', !isSelectionMode);
  els.selectionCount.textContent = `${selectedTaskIds.size}件選択中`;

  document.body.classList.toggle('is-reorder-mode', isReorderMode);
  document.body.classList.toggle('is-selection-mode', isSelectionMode);

  syncTitleToggleVisibility();
  applyActionLabels();
}

function renderTask(task, done) {
  const expanded = expandedTaskIds.has(task.id);
  const disabledAttr = !done && (isReorderMode || isSelectionMode) ? 'disabled' : '';
  const checked = selectedTaskIds.has(task.id);

  return `
    <li class="task-item" data-task-id="${task.id}">
      ${!done && isSelectionMode
        ? `<label class="task-select-control"><input type="checkbox" data-action="toggle-select" ${checked ? 'checked' : ''} aria-label="${escapeHtml(task.title)}を選択" /><span>選択</span></label>`
        : ''}
      ${done
        ? ''
        : `<button class="task-drag-handle${isReorderMode ? '' : ' is-hidden'}" data-action="drag-handle" aria-label="${escapeHtml(task.title)}をドラッグして並び替え" title="ドラッグで並び替え" type="button">≡</button>`}
      <div class="task-main">
        <span class="task-title ${expanded ? '' : 'is-clamped'}">${escapeHtml(task.title)}</span>
        <button type="button" class="title-toggle is-hidden" data-action="toggle-title" ${!done && (isReorderMode || isSelectionMode) ? 'disabled' : ''}>全文表示</button>
      </div>
      <div class="task-actions">
        ${done
          ? `<div class="task-actions-done">
               <button data-action="delete">削除</button>
               <span class="task-action-separator" aria-hidden="true">|</span>
               <button data-action="restore">復活</button>
             </div>`
          : `<div class="task-actions-secondary">
               <button data-action="complete" ${disabledAttr}>完了</button>
               <button data-action="reset" ${disabledAttr}>リセット</button>
             </div>
             <div class="task-actions-primary"><button data-action="inc" ${disabledAttr}>${formatSuccessLabel(task.count)}</button></div>`
          }
      </div>
    </li>
  `;
}

function syncTitleToggleVisibility() {
  document.querySelectorAll('[data-task-id]').forEach((row) => {
    const taskId = row.dataset.taskId;
    if (!taskId) return;

    const titleEl = row.querySelector('.task-title');
    const toggleEl = row.querySelector('[data-action="toggle-title"]');
    if (!titleEl || !toggleEl) return;

    const expanded = expandedTaskIds.has(taskId);
    titleEl.classList.toggle('is-clamped', !expanded);

    titleEl.classList.add('is-clamped');
    const canCollapse = titleEl.scrollHeight > titleEl.clientHeight + 1;
    titleEl.classList.toggle('is-clamped', !expanded);

    if (!canCollapse) {
      expandedTaskIds.delete(taskId);
      toggleEl.classList.add('is-hidden');
      return;
    }

    toggleEl.classList.remove('is-hidden');
    toggleEl.textContent = expanded ? 'たたむ' : '全文表示';
  });
}

function formatSuccessLabel(count) {
  return count < 1 ? '成功！' : `${count}回`;
}

function applyActionLabels() {
  document.querySelectorAll('[data-task-id]').forEach((row) => {
    const task = state.tasks.find((item) => item.id === row.dataset.taskId);
    if (!task) return;

    row.querySelector('[data-action="inc"]')?.setAttribute(
      'aria-label',
      `${task.title}の成功回数は現在${task.count}回。1増やす`,
    );
    row.querySelector('[data-action="reset"]')?.setAttribute('aria-label', `${task.title}の成功回数を0に戻す`);
    row.querySelector('[data-action="complete"]')?.setAttribute('aria-label', `${task.title}を完了にする`);
    row.querySelector('[data-action="delete"]')?.setAttribute('aria-label', `${task.title}を削除する`);
    row.querySelector('[data-action="restore"]')?.setAttribute('aria-label', `${task.title}を復活する`);
    row.querySelector('[data-action="toggle-title"]')?.setAttribute('aria-label', `${task.title}の表示を切り替える`);
  });
}

function showSheet() {
  showMenu(false);
  listMenuId = null;
  els.sheet.classList.remove('is-hidden');
  els.listSheet.classList.add('is-hidden');
  els.backdrop.classList.remove('is-hidden');
  els.sheetInput.focus();
}

function hideSheet() {
  listMenuId = null;
  els.sheet.classList.add('is-hidden');
  els.listSheet.classList.add('is-hidden');
  closeBulkSheet();
  els.backdrop.classList.add('is-hidden');
  els.sheetInput.value = '';
  els.listInput.value = '';
  showSheetError(false);
  showListError(false, '');
}

function showSheetError(show) {
  els.sheetError.classList.toggle('is-hidden', !show);
}

function submitFromSheet() {
  const beforeCount = state.tasks.length;
  const nextState = addTask(state, els.sheetInput.value, state.currentListId);
  if (nextState.tasks.length === beforeCount) {
    showSheetError(true);
    return;
  }
  commit(nextState);
  const addedTask = nextState.tasks[nextState.tasks.length - 1];
  announce(`タスク「${addedTask.title}」を追加しました。`);
  hideSheet();
}

function showListSheet() {
  showMenu(false);
  listMenuId = null;
  els.listSheet.classList.remove('is-hidden');
  els.sheet.classList.add('is-hidden');
  els.backdrop.classList.remove('is-hidden');
  els.listInput.focus();
}

function showListError(show, message) {
  els.listError.classList.toggle('is-hidden', !show);
  if (show) {
    els.listError.textContent = message;
  }
}

function createTaskList() {
  const normalizedName = els.listInput.value.trim();
  if (!normalizedName) {
    showListError(true, 'リスト名を入力してください。');
    return;
  }

  const exists = state.lists.some((list) => list.name === normalizedName);
  if (exists) {
    showListError(true, '同名のリストは作成できません。');
    return;
  }

  const list = {
    id: createListId(),
    name: normalizedName,
    createdAt: Date.now(),
  };

  commit({
    ...state,
    currentListId: list.id,
    lists: [...state.lists, list],
  });
  announce(`リスト「${list.name}」を作成しました。`);
  hideSheet();
}

function announce(message) {
  els.liveRegion.textContent = message;
}

function exportBackup() {
  const raw = exportStateData(state);
  const blob = new Blob([raw], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const now = new Date();
  const pad = (v) => String(v).padStart(2, '0');
  const filename = `fgc-task-backup-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}.json`;
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  announce('バックアップを保存しました。');
  showMenu(false);
}

function triggerImport() {
  showMenu(false);
  els.importFileInput.click();
}

async function handleImportFile(file) {
  if (!file) return;
  const confirmed = window.confirm('インポートしたデータを新しいタスクリストとして追加します。続行しますか？');
  if (!confirmed) return;

  try {
    const raw = await file.text();
    const importedState = importStateData(raw);
    const nextState = mergeImportedState(state, importedState);
    commit(nextState);
    announce('インポートが完了しました。新しいタスクリストを追加しました。');
  } catch {
    announce('インポートに失敗しました。JSON形式を確認してください。');
  } finally {
    els.importFileInput.value = '';
  }
}

function showUndoToast(taskId, title, { withUndo = true } = {}) {
  clearTimeout(toastTimer);
  const undoHtml = withUndo
    ? `<button type="button" data-action="undo" data-task-id="${taskId}">取り消し</button>`
    : '';
  els.toast.innerHTML = `<span>${escapeHtml(title)}</span>${undoHtml}`;
  els.toast.classList.remove('is-hidden');
  toastTimer = window.setTimeout(() => {
    els.toast.classList.add('is-hidden');
    els.toast.innerHTML = '';
  }, 5000);
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

els.tabActive.addEventListener('click', () => {
  currentTab = 'active';
  render();
});

els.tabDone.addEventListener('click', () => {
  currentTab = 'done';
  if (isSelectionMode) {
    exitSelectionMode();
  }
  if (isReorderMode) {
    isReorderMode = false;
    cancelReorderInteraction();
  }
  render();
});

els.selectionToggleBtn.addEventListener('click', () => {
  if (els.selectionToggleBtn.disabled) return;
  isSelectionMode = !isSelectionMode;
  if (isSelectionMode) {
    isReorderMode = false;
    cancelReorderInteraction();
    announce('タスク選択モードを開始しました。');
  } else {
    selectedTaskIds.clear();
    announce('タスク選択モードを終了しました。');
  }
  render();
});

els.reorderToggleBtn.addEventListener('click', () => {
  if (els.reorderToggleBtn.disabled) return;
  isReorderMode = !isReorderMode;
  if (isReorderMode && isSelectionMode) {
    exitSelectionMode();
  }
  cancelReorderInteraction();
  announce(isReorderMode ? '順序入れ替えモードを開始しました。' : '順序入れ替えモードを終了しました。');
  render();
});

els.menuBtn.addEventListener('click', () => {
  const willOpen = els.menuPopover.classList.contains('is-hidden');
  showMenu(willOpen);
});
els.exportBtn.addEventListener('click', exportBackup);
els.importBtn.addEventListener('click', triggerImport);
els.importFileInput.addEventListener('change', (event) => {
  const file = event.target.files?.[0];
  handleImportFile(file);
});
els.listSwitchBtn.addEventListener('click', showListSheet);
els.fabAdd.addEventListener('click', showSheet);
els.backdrop.addEventListener('click', hideSheet);
els.sheetCancel.addEventListener('click', hideSheet);
els.sheetSubmit.addEventListener('click', submitFromSheet);
els.sheetInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') submitFromSheet();
  if (event.key === 'Escape') hideSheet();
});
els.sheetInput.addEventListener('input', () => {
  if (els.sheetInput.value.trim()) showSheetError(false);
});
els.listCreateBtn.addEventListener('click', createTaskList);
els.listInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') createTaskList();
  if (event.key === 'Escape') hideSheet();
});
els.listSheetClose?.addEventListener('click', hideSheet);
els.bulkSheetClose?.addEventListener('click', hideSheet);
els.listInput.addEventListener('input', () => {
  if (els.listInput.value.trim()) showListError(false, '');
});
els.listItems.addEventListener('click', (event) => {
  event.stopPropagation();
  const button = event.target.closest('button[data-list-action]');
  if (!button) return;
  const listId = button.dataset.listId;
  if (!listId) return;
  const action = button.dataset.listAction;
  const list = state.lists.find((item) => item.id === listId);
  if (!list) return;

  if (action === 'switch') {
    if (listId === state.currentListId) {
      hideSheet();
      return;
    }
    listMenuId = null;
    commit({ ...state, currentListId: listId });
    announce(`リストを切り替えました。`);
    hideSheet();
    return;
  }

  if (action === 'more') {
    listMenuId = listMenuId === listId ? null : listId;
    render();
    return;
  }

  if (action === 'rename') {
    const candidate = window.prompt('新しいリスト名を入力してください。', list.name);
    if (candidate === null) return;
    const normalizedName = candidate.trim();
    if (!normalizedName) {
      showListError(true, 'リスト名を入力してください。');
      return;
    }
    if (state.lists.some((item) => item.id !== listId && item.name === normalizedName)) {
      showListError(true, '同名のリストは作成できません。');
      return;
    }
    listMenuId = null;
    commit(renameList(state, listId, normalizedName));
    announce(`リスト名を変更しました。`);
    return;
  }

  if (action === 'delete') {
    if (state.lists.length <= 1) {
      showListError(true, '最後の1件は削除できません。');
      return;
    }
    if (!window.confirm(`「${list.name}」を削除しますか？このリストのタスクも削除されます。`)) return;
    listMenuId = null;
    commit(deleteList(state, listId));
    announce(`リスト「${list.name}」を削除しました。`);
  }
});

els.activeList.addEventListener('pointerdown', (event) => {
  if (currentTab !== 'active' || !isReorderMode) return;
  if (event.button !== 0) return;

  const row = event.target.closest('.task-item[data-task-id]');
  const handle = event.target.closest('[data-action="drag-handle"]');
  if (!row || !handle) return;

  const taskId = row.dataset.taskId;
  if (!taskId) return;

  beginReorder(taskId, event.pointerId, event.clientY);
});

document.addEventListener('pointermove', (event) => {
  if (!reorderState || event.pointerId !== reorderState.pointerId) return;
  event.preventDefault();
  updateReorder(event.clientY);
});

document.addEventListener('pointerup', (event) => {
  if (!reorderState || event.pointerId !== reorderState.pointerId) return;
  finishReorder();
});

document.addEventListener('pointercancel', (event) => {
  if (reorderState && event.pointerId === reorderState.pointerId) {
    cancelReorderInteraction();
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !els.listSheet.classList.contains('is-hidden')) {
    hideSheet();
  }
});

document.body.addEventListener('click', (event) => {
  if (!event.target.closest('#menu-btn') && !event.target.closest('#menu-popover')) {
    showMenu(false);
  }
  if (listMenuId && !event.target.closest('#list-items')) {
    listMenuId = null;
    render();
  }
  const control = event.target.closest('[data-action]');
  if (!control) return;

  const action = control.dataset.action;

  if (action === 'undo') {
    const taskId = control.dataset.taskId;
    if (!taskId) return;
    commit(restoreTask(state, taskId));
    announce('完了を取り消しました。');
    els.toast.classList.add('is-hidden');
    els.toast.innerHTML = '';
    return;
  }

  if (action === 'selection-cancel') {
    exitSelectionMode();
    render();
    return;
  }

  if (action === 'selection-select-all') {
    const currentListId = state.currentListId;
    const activeIds = state.tasks
      .filter((task) => task.listId === currentListId && task.status === 'active')
      .map((task) => task.id);
    if (selectedTaskIds.size === activeIds.length) {
      selectedTaskIds.clear();
    } else {
      activeIds.forEach((id) => selectedTaskIds.add(id));
    }
    render();
    return;
  }

  if (action === 'selection-copy' || action === 'selection-move') {
    if (selectedTaskIds.size < 1) {
      announce('タスクを1件以上選択してください。');
      return;
    }
    openBulkSheet(action === 'selection-move' ? 'move' : 'copy');
    return;
  }

  if (action === 'bulk-destination') {
    const destinationListId = control.dataset.listId;
    runBulkAction(destinationListId);
    return;
  }

  const row = control.closest('[data-task-id]');
  if (!row) return;

  const taskId = row.dataset.taskId;
  const task = state.tasks.find((item) => item.id === taskId);
  if (!task) return;

  if (action === 'toggle-title') {
    if (expandedTaskIds.has(taskId)) {
      expandedTaskIds.delete(taskId);
    } else {
      expandedTaskIds.add(taskId);
    }
    render();
    return;
  }

  if (action === 'toggle-select') {
    if (selectedTaskIds.has(taskId)) {
      selectedTaskIds.delete(taskId);
    } else {
      selectedTaskIds.add(taskId);
    }
    render();
    return;
  }

  if (action === 'inc') {
    commit(incCount(state, taskId));
    announce(`「${task.title}」の成功回数を増やしました。`);
  }

  if (action === 'reset') {
    if (!window.confirm(`「${task.title}」の成功回数を0に戻しますか？`)) return;
    commit(resetCount(state, taskId));
    announce(`「${task.title}」をリセットしました。`);
  }

  if (action === 'complete') {
    if (!window.confirm(`「${task.title}」を完了にしますか？`)) return;
    commit(completeTask(state, taskId));
    announce(`「${task.title}」を完了にしました。`);
    showUndoToast(taskId, `「${task.title}」を完了にしました。`);
  }

  if (action === 'restore') {
    commit(restoreTask(state, taskId));
    announce(`「${task.title}」を復活しました。`);
  }

  if (action === 'delete') {
    if (!window.confirm(`「${task.title}」を削除しますか？この操作は取り消せません。`)) return;
    commit(deleteTask(state, taskId));
    announce(`「${task.title}」を削除しました。`);
  }
});

render();
