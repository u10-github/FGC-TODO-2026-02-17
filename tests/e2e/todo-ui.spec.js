import { expect, test } from '@playwright/test';

async function addTask(page, title) {
  await page.getByRole('button', { name: 'タスクを追加' }).click();
  await page.getByLabel('タスク名').fill(title);
  await page.getByRole('button', { name: '追加', exact: true }).click();
}

test('main task flow works and persists after reload', async ({ page }) => {
  await page.goto('/index.html');

  const title = `E2E-${Date.now()}`;

  await addTask(page, title);

  const taskRow = page.locator('.task-item', { hasText: title });
  await expect(taskRow).toBeVisible();
  await expect(taskRow.getByText('成功回数: 0')).toBeVisible();

  await taskRow.locator('button[data-action="inc"]').click();
  await expect(taskRow.getByText('成功回数: 1')).toBeVisible();

  page.once('dialog', (dialog) => dialog.accept());
  await taskRow.locator('button[data-action="reset"]').click();
  await expect(taskRow.getByText('成功回数: 0')).toBeVisible();

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
  await expect(persistedRow.getByText('成功回数: 0')).toBeVisible();
});
