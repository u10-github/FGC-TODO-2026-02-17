import { addTask, completeTask, deleteTask, getTasksByList, incCount, resetCount, restoreTask } from '../core/tasks.js';
import { exportStateData, importStateData, loadState, saveState } from '../core/store.js';

const els = {
  menuBtn: document.getElementById('menu-btn'),
  menuPopover: document.getElementById('menu-popover'),
  exportBtn: document.getElementById('export-btn'),
  importBtn: document.getElementById('import-btn'),
  importFileInput: document.getElementById('import-file-input'),
  listSwitchBtn: document.getElementById('list-switch-btn'),
  tabActive: document.getElementById('tab-active'),
  tabDone: document.getElementById('tab-done'),
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
  toast: document.getElementById('toast'),
  liveRegion: document.getElementById('live-region'),
};

let state = loadState({ storage: window.localStorage });
let currentTab = 'active';
let toastTimer = null;

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
      (list) =>
        `<li><button class="list-item-btn${list.id === currentList.id ? ' is-current' : ''}" type="button" data-list-id="${list.id}">${escapeHtml(list.name)}</button></li>`,
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

  applyActionLabels();
}

function renderTask(task, done) {
  return `
    <li class="task-item" data-task-id="${task.id}">
      <div class="task-main">
        <span class="task-title">${escapeHtml(task.title)}</span>
      </div>
      <div class="task-actions">
        ${done
          ? `<div class="task-actions-done">
               <button data-action="delete">削除</button>
               <span class="task-action-separator" aria-hidden="true">|</span>
               <button data-action="restore">復活</button>
             </div>`
          : `<div class="task-actions-secondary">
               <button data-action="complete">完了</button>
               <button data-action="reset">リセット</button>
             </div>
             <div class="task-actions-primary"><button data-action="inc">${formatSuccessLabel(task.count)}</button></div>
             `
          }
      </div>
    </li>
  `;
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
  });
}

function showSheet() {
  showMenu(false);
  els.sheet.classList.remove('is-hidden');
  els.listSheet.classList.add('is-hidden');
  els.backdrop.classList.remove('is-hidden');
  els.sheetInput.focus();
}

function hideSheet() {
  els.sheet.classList.add('is-hidden');
  els.listSheet.classList.add('is-hidden');
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
  const confirmed = window.confirm('現在のデータを上書きします。続行しますか？');
  if (!confirmed) return;

  try {
    const raw = await file.text();
    const nextState = importStateData(raw);
    commit(nextState);
    announce('インポートが完了しました。');
  } catch {
    announce('インポートに失敗しました。JSON形式を確認してください。');
  } finally {
    els.importFileInput.value = '';
  }
}

function showUndoToast(taskId, title) {
  clearTimeout(toastTimer);
  els.toast.innerHTML = `<span>「${escapeHtml(title)}」を完了にしました。</span><button type="button" data-action="undo" data-task-id="${taskId}">取り消し</button>`;
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
els.listInput.addEventListener('input', () => {
  if (els.listInput.value.trim()) showListError(false, '');
});
els.listItems.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-list-id]');
  if (!button) return;
  const nextListId = button.dataset.listId;
  if (!nextListId || nextListId === state.currentListId) {
    hideSheet();
    return;
  }
  commit({ ...state, currentListId: nextListId });
  announce(`リストを切り替えました。`);
  hideSheet();
});

document.body.addEventListener('click', (event) => {
  if (!event.target.closest('#menu-btn') && !event.target.closest('#menu-popover')) {
    showMenu(false);
  }

  const button = event.target.closest('button[data-action]');
  if (!button) return;

  const action = button.dataset.action;

  if (action === 'undo') {
    const taskId = button.dataset.taskId;
    if (!taskId) return;
    commit(restoreTask(state, taskId));
    announce('完了を取り消しました。');
    els.toast.classList.add('is-hidden');
    els.toast.innerHTML = '';
    return;
  }

  const row = button.closest('[data-task-id]');
  if (!row) return;

  const taskId = row.dataset.taskId;
  const task = state.tasks.find((item) => item.id === taskId);
  if (!task) return;

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
    showUndoToast(taskId, task.title);
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
