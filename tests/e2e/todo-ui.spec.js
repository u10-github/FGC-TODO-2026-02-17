import { expect, test } from '@playwright/test';

async function addTask(page, title) {
  await page.getByRole('button', { name: 'タスクを追加' }).click();
  await page.getByLabel('タスク名').fill(title);
  await page.getByRole('button', { name: '追加', exact: true }).click();
}

async function openListSheet(page) {
  await page.getByRole('button', { name: 'タスクリストを切り替え' }).click();
}

async function createTaskList(page, name) {
  await openListSheet(page);
  await page.getByLabel('リスト名').fill(name);
  await page.getByRole('button', { name: '作成', exact: true }).click();
}

test('main task flow works and persists after reload', async ({ page }) => {
  await page.goto('/index.html');

  const title = `E2E-${Date.now()}`;

  await addTask(page, title);

  const taskRow = page.locator('.task-item', { hasText: title });
  await expect(taskRow).toBeVisible();
  await expect(taskRow.locator('button[data-action="inc"]')).toHaveText('成功！');

  await taskRow.locator('button[data-action="inc"]').click();
  await expect(taskRow.locator('button[data-action="inc"]')).toHaveText('1回');

  page.once('dialog', (dialog) => dialog.accept());
  await taskRow.locator('button[data-action="reset"]').click();
  await expect(taskRow.locator('button[data-action="inc"]')).toHaveText('成功！');

  page.once('dialog', (dialog) => dialog.accept());
  await taskRow.locator('button[data-action="complete"]').click();

  await expect(page.locator('#active-list .task-item', { hasText: title })).toHaveCount(0);
  await expect(page.locator('#done-list .task-item', { hasText: title })).toHaveCount(1);
  await expect(page.getByRole('button', { name: '取り消し' })).toBeVisible();

  await page.getByRole('button', { name: '取り消し' }).click();
  const restoredRow = page.locator('.task-item', { hasText: title });
  await expect(restoredRow).toBeVisible();

  await page.reload();
  const persistedRow = page.locator('.task-item', { hasText: title });
  await expect(persistedRow).toBeVisible();
  await expect(persistedRow.locator('button[data-action="inc"]')).toHaveText('成功！');
});

test('task lists can be created and switched with isolated tasks', async ({ page }) => {
  await page.goto('/index.html');

  const listA = `ListA-${Date.now()}`;
  const listB = `ListB-${Date.now()}`;
  const taskA = `TaskA-${Date.now()}`;
  const taskB = `TaskB-${Date.now()}`;

  await createTaskList(page, listA);
  await addTask(page, taskA);
  await expect(page.locator('#active-list .task-item', { hasText: taskA })).toHaveCount(1);

  await createTaskList(page, listB);
  await expect(page.locator('#active-list .task-item', { hasText: taskA })).toHaveCount(0);
  await addTask(page, taskB);
  await expect(page.locator('#active-list .task-item', { hasText: taskB })).toHaveCount(1);

  await openListSheet(page);
  await page.getByRole('button', { name: listA, exact: true }).click();
  await expect(page.locator('#active-list .task-item', { hasText: taskA })).toHaveCount(1);
  await expect(page.locator('#active-list .task-item', { hasText: taskB })).toHaveCount(0);
});

test('done task can be deleted permanently with confirmation', async ({ page }) => {
  await page.goto('/index.html');

  const title = `DEL-${Date.now()}`;
  await addTask(page, title);

  const activeRow = page.locator('#active-list .task-item', { hasText: title });
  page.once('dialog', (dialog) => dialog.accept());
  await activeRow.locator('button[data-action="complete"]').click();

  await page.getByRole('button', { name: '完了' }).click();
  const doneRow = page.locator('#done-list .task-item', { hasText: title });
  await expect(doneRow).toBeVisible();

  page.once('dialog', (dialog) => dialog.accept());
  await doneRow.locator('button[data-action="delete"]').click();
  await expect(page.locator('#done-list .task-item', { hasText: title })).toHaveCount(0);

  await page.reload();
  await page.getByRole('button', { name: '完了' }).click();
  await expect(page.locator('#done-list .task-item', { hasText: title })).toHaveCount(0);
});
