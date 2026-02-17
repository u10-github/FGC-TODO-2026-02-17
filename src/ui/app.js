import { addTask, completeTask, incCount, resetCount, restoreTask } from '../core/tasks.js';
import { loadState, saveState } from '../core/store.js';

const els = {
  titleInput: document.getElementById('task-title'),
  addTaskBtn: document.getElementById('add-task-btn'),
  taskError: document.getElementById('task-error'),
  activeList: document.getElementById('active-list'),
  doneList: document.getElementById('done-list'),
  activeEmpty: document.getElementById('active-empty'),
  doneEmpty: document.getElementById('done-empty'),
  toggleDoneBtn: document.getElementById('toggle-done-btn'),
  doneRegion: document.getElementById('done-region'),
  toast: document.getElementById('toast'),
  liveRegion: document.getElementById('live-region'),
};

let state = loadState({ storage: window.localStorage });
let doneExpanded = false;
let toastTimer = null;

function commit(nextState) {
  state = nextState;
  saveState(state, { storage: window.localStorage });
  render();
}

function render() {
  const activeTasks = state.tasks.filter((task) => task.status === 'active');
  const doneTasks = state.tasks.filter((task) => task.status === 'done');

  els.activeList.innerHTML = activeTasks.map((task) => renderActiveTask(task)).join('');
  els.doneList.innerHTML = doneTasks.map((task) => renderDoneTask(task)).join('');

  els.activeEmpty.classList.toggle('is-hidden', activeTasks.length > 0);
  els.doneEmpty.classList.toggle('is-hidden', doneTasks.length > 0);

  els.toggleDoneBtn.textContent = `完了タスクを表示（${doneTasks.length}件）`;
  els.toggleDoneBtn.classList.toggle('is-hidden', doneTasks.length === 0);

  if (doneTasks.length === 0) {
    doneExpanded = false;
  }
  els.doneRegion.classList.toggle('is-hidden', !doneExpanded);
  els.toggleDoneBtn.setAttribute('aria-expanded', String(doneExpanded));

  applyActionLabels();
}

function renderActiveTask(task) {
  const countClass = task.count > 0 ? 'count-badge is-progress' : 'count-badge';

  return `
    <li class="task-item" data-task-id="${task.id}">
      <div class="task-main">
        <span class="task-title">${escapeHtml(task.title)}</span>
        <span class="${countClass}">成功回数: ${task.count}</span>
      </div>
      <div class="task-actions">
        <button data-action="inc">+1</button>
        <button data-action="reset">リセット</button>
        <button data-action="complete">完了</button>
      </div>
    </li>
  `;
}

function renderDoneTask(task) {
  const countClass = task.count > 0 ? 'count-badge is-progress' : 'count-badge';

  return `
    <li class="task-item" data-task-id="${task.id}">
      <div class="task-main">
        <span class="task-title">${escapeHtml(task.title)}</span>
        <span class="${countClass}">成功回数: ${task.count}</span>
      </div>
      <div class="task-actions">
        <button data-action="restore">復活</button>
      </div>
    </li>
  `;
}

function applyActionLabels() {
  document.querySelectorAll('[data-task-id]').forEach((row) => {
    const taskId = row.dataset.taskId;
    const task = state.tasks.find((item) => item.id === taskId);
    if (!task) return;

    row.querySelector('[data-action="inc"]')?.setAttribute('aria-label', `${task.title}の成功回数を1増やす`);
    row.querySelector('[data-action="reset"]')?.setAttribute('aria-label', `${task.title}の成功回数を0に戻す`);
    row.querySelector('[data-action="complete"]')?.setAttribute('aria-label', `${task.title}を完了にする`);
    row.querySelector('[data-action="restore"]')?.setAttribute('aria-label', `${task.title}をアクティブに復活する`);
  });
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function showError(show) {
  els.taskError.classList.toggle('is-hidden', !show);
}

function handleAddTask() {
  const beforeCount = state.tasks.length;
  const candidate = els.titleInput.value;
  const nextState = addTask(state, candidate);
  const added = nextState.tasks.length > beforeCount;

  if (!added) {
    showError(true);
    els.titleInput.focus();
    return;
  }

  showError(false);
  commit(nextState);
  const addedTask = nextState.tasks[nextState.tasks.length - 1];
  announce(`タスク「${addedTask.title}」を追加しました。`);
  els.titleInput.value = '';
  els.titleInput.focus();

  const row = document.querySelector(`[data-task-id="${addedTask.id}"]`);
  row?.classList.add('is-added');
}

function announce(message) {
  els.liveRegion.textContent = message;
}

function showUndoToast(taskId, taskTitle) {
  clearTimeout(toastTimer);
  els.toast.innerHTML = `
    <span>「${escapeHtml(taskTitle)}」を完了にしました。</span>
    <button type="button" data-action="undo-complete" data-task-id="${taskId}">取り消し</button>
  `;
  els.toast.classList.remove('is-hidden');

  toastTimer = window.setTimeout(() => {
    els.toast.classList.add('is-hidden');
    els.toast.innerHTML = '';
  }, 5000);
}

els.addTaskBtn.addEventListener('click', handleAddTask);

els.titleInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    handleAddTask();
  }
});

els.titleInput.addEventListener('input', () => {
  if (els.titleInput.value.trim()) {
    showError(false);
  }
});

els.toggleDoneBtn.addEventListener('click', () => {
  doneExpanded = !doneExpanded;
  render();
});

document.body.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;

  const action = button.dataset.action;

  if (action === 'undo-complete') {
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
    const confirmed = window.confirm(`「${task.title}」の成功回数を0に戻しますか？`);
    if (!confirmed) return;
    commit(resetCount(state, taskId));
    announce(`「${task.title}」の成功回数を0に戻しました。`);
  }

  if (action === 'complete') {
    const confirmed = window.confirm(`「${task.title}」を完了にしますか？`);
    if (!confirmed) return;
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
