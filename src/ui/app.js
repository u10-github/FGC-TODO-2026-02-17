import { addTask, completeTask, incCount, resetCount, restoreTask } from '../core/tasks.js';
import { loadState, saveState } from '../core/store.js';

const els = {
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
  toast: document.getElementById('toast'),
  liveRegion: document.getElementById('live-region'),
};

let state = loadState({ storage: window.localStorage });
let currentTab = 'active';
let toastTimer = null;

function commit(nextState) {
  state = nextState;
  saveState(state, { storage: window.localStorage });
  render();
}

function render() {
  const activeTasks = state.tasks.filter((task) => task.status === 'active');
  const doneTasks = state.tasks.filter((task) => task.status === 'done');

  els.activeList.innerHTML = activeTasks.map((task) => renderTask(task, false)).join('');
  els.doneList.innerHTML = doneTasks.map((task) => renderTask(task, true)).join('');

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
        <span class="count">成功回数: ${task.count}</span>
      </div>
      <div class="task-actions">
        ${done
          ? '<button data-action="restore">復活</button>'
          : `<div class="task-actions-primary"><button data-action="inc">+1</button></div>
             <div class="task-actions-secondary">
               <button data-action="complete">完了</button>
               <button data-action="reset">リセット</button>
             </div>`}
      </div>
    </li>
  `;
}

function applyActionLabels() {
  document.querySelectorAll('[data-task-id]').forEach((row) => {
    const task = state.tasks.find((item) => item.id === row.dataset.taskId);
    if (!task) return;

    row.querySelector('[data-action="inc"]')?.setAttribute('aria-label', `${task.title}の成功回数を1増やす`);
    row.querySelector('[data-action="reset"]')?.setAttribute('aria-label', `${task.title}の成功回数を0に戻す`);
    row.querySelector('[data-action="complete"]')?.setAttribute('aria-label', `${task.title}を完了にする`);
    row.querySelector('[data-action="restore"]')?.setAttribute('aria-label', `${task.title}を復活する`);
  });
}

function showSheet() {
  els.sheet.classList.remove('is-hidden');
  els.backdrop.classList.remove('is-hidden');
  els.sheetInput.focus();
}

function hideSheet() {
  els.sheet.classList.add('is-hidden');
  els.backdrop.classList.add('is-hidden');
  els.sheetInput.value = '';
  showSheetError(false);
}

function showSheetError(show) {
  els.sheetError.classList.toggle('is-hidden', !show);
}

function submitFromSheet() {
  const beforeCount = state.tasks.length;
  const nextState = addTask(state, els.sheetInput.value);
  if (nextState.tasks.length === beforeCount) {
    showSheetError(true);
    return;
  }
  commit(nextState);
  const addedTask = nextState.tasks[nextState.tasks.length - 1];
  announce(`タスク「${addedTask.title}」を追加しました。`);
  hideSheet();
}

function announce(message) {
  els.liveRegion.textContent = message;
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

document.body.addEventListener('click', (event) => {
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
});

render();
