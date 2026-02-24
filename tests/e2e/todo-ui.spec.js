import { expect, test } from '@playwright/test';

async function addTask(page, title) {
  await page.getByRole('button', { name: 'タスクを追加' }).click();
  await page.getByLabel('タスク名').fill(title);
  await page.getByRole('button', { name: '追加', exact: true }).click();
}

async function openListSheet(page) {
  await page.getByRole('button', { name: 'タスクリストを切り替え' }).click();
  await expect(page.locator('#list-sheet')).toBeVisible();
}

async function createTaskList(page, name) {
  await openListSheet(page);
  await page.getByLabel('リスト名').fill(name);
  await page.getByRole('button', { name: '作成', exact: true }).click();
}

function listRow(page, name) {
  return page.locator('.list-row').filter({ hasText: name });
}

test.beforeEach(async ({ page }) => {
  await page.goto('/index.html');
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
});

test('main task flow works and persists after reload', async ({ page }) => {
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

test('can import backup data from hamburger menu', async ({ page }) => {
  const raw = JSON.stringify({
    schemaVersion: 2,
    currentListId: 'l2',
    lists: [
      { id: 'default-list', name: 'タスクリスト', createdAt: 0 },
      { id: 'l2', name: 'SF6 / リュウ', createdAt: 1 },
    ],
    tasks: [
      { id: 't1', title: 'インポートされた課題', status: 'active', count: 0, listId: 'l2' },
    ],
  });

  await page.getByRole('button', { name: 'メニュー' }).click();
  await page.getByRole('menuitem', { name: 'データをインポート' }).click();
  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('#import-file-input').setInputFiles({
    name: 'backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from(raw),
  });

  await expect(page.locator('#list-switch-btn')).toHaveText('SF6 / リュウ');
  await expect(page.locator('#active-list .task-item', { hasText: 'インポートされた課題' })).toHaveCount(1);
});

test('import with duplicated list name appends as name(1)', async ({ page }) => {
  const raw = JSON.stringify({
    schemaVersion: 2,
    currentListId: 'l1',
    lists: [{ id: 'l1', name: 'タスクリスト', createdAt: 1 }],
    tasks: [{ id: 't1', title: '重複名タスク', status: 'active', count: 0, listId: 'l1' }],
  });

  await page.getByRole('button', { name: 'メニュー' }).click();
  await page.getByRole('menuitem', { name: 'データをインポート' }).click();
  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('#import-file-input').setInputFiles({
    name: 'backup-duplicate.json',
    mimeType: 'application/json',
    buffer: Buffer.from(raw),
  });

  await expect(page.locator('#list-switch-btn')).toHaveText('タスクリスト(1)');
  await expect(page.locator('#active-list .task-item', { hasText: '重複名タスク' })).toHaveCount(1);
});

test('list can be renamed from row menu', async ({ page }) => {
  const original = `元リスト-${Date.now()}`;
  const renamed = `変更後リスト-${Date.now()}`;

  await createTaskList(page, original);
  await openListSheet(page);

  const row = listRow(page, original);
  await row.locator('button[data-list-action="more"]').click();
  await expect(row.locator('.list-row-menu')).toBeVisible();
  page.once('dialog', (dialog) => dialog.accept(renamed));
  await row.locator('button[data-list-action="rename"]').click();

  await expect(page.locator('.list-item-btn', { hasText: renamed })).toHaveCount(1);
  await expect(page.locator('#list-switch-btn')).toHaveText(renamed);
});

test('list can be deleted from row menu and its tasks are removed', async ({ page }) => {
  const listName = `削除対象-${Date.now()}`;
  const taskName = `削除対象タスク-${Date.now()}`;

  await createTaskList(page, listName);
  await addTask(page, taskName);
  await expect(page.locator('#active-list .task-item', { hasText: taskName })).toHaveCount(1);

  await openListSheet(page);
  const row = listRow(page, listName);
  await row.locator('button[data-list-action="more"]').click();
  await expect(row.locator('.list-row-menu')).toBeVisible();
  page.once('dialog', (dialog) => dialog.accept());
  await row.locator('button[data-list-action="delete"]').click();

  await expect(page.locator('.list-item-btn', { hasText: listName })).toHaveCount(0);
  await expect(page.locator('#list-switch-btn')).not.toHaveText(listName);
  await expect(page.locator('#active-list .task-item', { hasText: taskName })).toHaveCount(0);
});

test('cannot delete the last remaining list', async ({ page }) => {
  await openListSheet(page);
  const row = listRow(page, 'タスクリスト');
  await row.locator('button[data-list-action="more"]').click();
  await expect(row.locator('button[data-list-action="delete"]')).toBeDisabled();
});

test('mobile layout keeps long task title readable', async ({ page }) => {
  await page.setViewportSize({ width: 412, height: 915 });
  const title = 'これはスマホ表示確認のための非常に長いタスク名です。操作ボタンに押し潰されず読み取れる必要があります。';
  await addTask(page, title);

  const row = page.locator('.task-item', { hasText: title }).first();
  await expect(row).toBeVisible();

  const metrics = await row.evaluate((el) => {
    const titleEl = el.querySelector('.task-title');
    const actionsEl = el.querySelector('.task-actions');
    if (!titleEl || !actionsEl) throw new Error('task row elements are missing');
    const titleRect = titleEl.getBoundingClientRect();
    const actionsRect = actionsEl.getBoundingClientRect();
    return {
      titleWidth: titleRect.width,
      titleTop: titleRect.top,
      actionsTop: actionsRect.top,
    };
  });

  expect(metrics.titleWidth).toBeGreaterThan(160);
  expect(metrics.actionsTop).toBeGreaterThan(metrics.titleTop + 20);
});

test('mobile layout places tabs and reorder button on one row', async ({ page }) => {
  await page.setViewportSize({ width: 412, height: 915 });

  const seeded = {
    schemaVersion: 2,
    currentListId: 'default-list',
    lists: [{ id: 'default-list', name: 'タスクリスト', createdAt: 0 }],
    tasks: [
      { id: 't1', title: 'タスクA', status: 'active', count: 0, listId: 'default-list' },
      { id: 't2', title: 'タスクB', status: 'active', count: 0, listId: 'default-list' },
    ],
  };
  await page.evaluate((payload) => window.localStorage.setItem('fg_task_manager_v1', JSON.stringify(payload)), seeded);
  await page.reload();

  const activeTab = page.locator('#tab-active');
  const reorderButton = page.locator('#reorder-toggle-btn');
  await expect(activeTab).toBeVisible();
  await expect(reorderButton).toBeVisible();
  await expect(reorderButton).toBeEnabled();

  const metrics = await page.evaluate(() => {
    const tab = document.getElementById('tab-active');
    const reorder = document.getElementById('reorder-toggle-btn');
    if (!tab || !reorder) throw new Error('tab or reorder button not found');
    const tabRect = tab.getBoundingClientRect();
    const reorderRect = reorder.getBoundingClientRect();
    return {
      topDiff: Math.abs(tabRect.top - reorderRect.top),
      tabRight: tabRect.right,
      reorderLeft: reorderRect.left,
    };
  });

  expect(metrics.topDiff).toBeLessThan(8);
  expect(metrics.reorderLeft).toBeGreaterThan(metrics.tabRight);
});

test('does not show 全文表示 when text is not actually clamped', async ({ page }) => {
  await page.setViewportSize({ width: 412, height: 915 });
  const title = '[22U後] 投げ>近H>溜め623H>近H (DA)>奥義';
  await addTask(page, title);

  const row = page.locator('.task-item', { hasText: title }).first();
  await expect(row).toBeVisible();
  await expect(row.locator('button[data-action="toggle-title"]')).toBeHidden();
});

test('footer links can reach terms/privacy and each page is directly accessible', async ({ page }) => {
  await page.goto('/index.html');

  await expect(page.getByRole('contentinfo')).toBeVisible();
  await expect(page.getByRole('link', { name: '利用規約' })).toHaveAttribute('href', './terms/');
  await expect(page.getByRole('link', { name: 'データの扱い' })).toHaveAttribute('href', './privacy/');

  await page.getByRole('link', { name: '利用規約' }).click();
  await expect(page).toHaveURL(/\/terms\/?$/);
  await expect(page.getByRole('heading', { name: '利用規約' })).toBeVisible();

  await page.goto('/privacy/');
  await expect(page).toHaveURL(/\/privacy\/?$/);
  await expect(page.getByRole('heading', { name: 'データの扱い（プライバシー説明）' })).toBeVisible();
  await expect(page.getByText('個人情報・機密情報は入力しないでください。')).toBeVisible();
});

test('active tasks can be reordered only in reorder mode and persist after reload', async ({ page }) => {
  await page.setViewportSize({ width: 412, height: 915 });

  const seeded = {
    schemaVersion: 2,
    currentListId: 'default-list',
    lists: [{ id: 'default-list', name: 'タスクリスト', createdAt: 0 }],
    tasks: [
      { id: 't1', title: 'タスクA', status: 'active', count: 0, listId: 'default-list' },
      { id: 't2', title: 'タスクB', status: 'active', count: 0, listId: 'default-list' },
      { id: 't3', title: 'タスクC', status: 'active', count: 0, listId: 'default-list' },
    ],
  };
  await page.evaluate((payload) => window.localStorage.setItem('fg_task_manager_v1', JSON.stringify(payload)), seeded);
  await page.reload();

  const rows = page.locator('#active-list .task-item');
  await expect(rows).toHaveCount(3);

  const mainSource = rows.nth(0).locator('.task-main');
  const mainTarget = rows.nth(2).locator('.task-main');
  const mainSourceBox = await mainSource.boundingBox();
  const mainTargetBox = await mainTarget.boundingBox();
  if (!mainSourceBox || !mainTargetBox) throw new Error('main drag target box not found');

  await page.mouse.move(mainSourceBox.x + 8, mainSourceBox.y + 8);
  await page.mouse.down();
  await page.mouse.move(mainTargetBox.x + 8, mainTargetBox.y + mainTargetBox.height - 6, { steps: 8 });
  await page.mouse.up();

  await expect(rows.nth(0).locator('.task-title')).toContainText('タスクA');
  await expect(rows.nth(1).locator('.task-title')).toContainText('タスクB');
  await expect(rows.nth(2).locator('.task-title')).toContainText('タスクC');

  await page.getByRole('button', { name: '順序入れ替え' }).click();
  await expect(page.locator('.task-drag-handle').first()).toBeVisible();

  const dragSource = rows.nth(0).locator('.task-drag-handle');
  const dragTarget = rows.nth(2).locator('.task-drag-handle');
  const sourceBox = await dragSource.boundingBox();
  const targetBox = await dragTarget.boundingBox();
  if (!sourceBox || !targetBox) throw new Error('drag handle box not found');

  await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, { steps: 8 });
  await page.mouse.up();

  await expect(rows.nth(0).locator('.task-title')).toContainText('タスクB');
  await expect(rows.nth(1).locator('.task-title')).toContainText('タスクC');
  await expect(rows.nth(2).locator('.task-title')).toContainText('タスクA');

  await page.getByRole('button', { name: '並び替え完了' }).click();
  await expect(page.locator('.task-drag-handle').first()).toBeHidden();

  await page.reload();
  const reloadedRows = page.locator('#active-list .task-item');
  await expect(reloadedRows.nth(0).locator('.task-title')).toContainText('タスクB');
  await expect(reloadedRows.nth(1).locator('.task-title')).toContainText('タスクC');
  await expect(reloadedRows.nth(2).locator('.task-title')).toContainText('タスクA');
});

test('selection mode can move and copy tasks to another list', async ({ page }) => {
  await page.setViewportSize({ width: 412, height: 915 });
  const base = Date.now();
  const listA = `選択元-${base}`;
  const listB = `選択先-${base}`;

  await createTaskList(page, listA);
  await addTask(page, `移動対象-${base}`);
  await addTask(page, `コピー対象-${base}`);

  await createTaskList(page, listB);
  await openListSheet(page);
  await page.getByRole('button', { name: listA, exact: true }).click();

  await page.getByRole('button', { name: 'タスク選択' }).click();
  await page.locator('#active-list .task-item').nth(0).locator('input[data-action="toggle-select"]').check();
  await page.getByRole('button', { name: '移動', exact: true }).click();
  await page.locator('#bulk-destination-list .list-item-btn', { hasText: listB }).click();

  await expect(page.locator('#active-list .task-item')).toHaveCount(1);

  await page.getByRole('button', { name: 'タスク選択' }).click();
  await page.locator('#active-list .task-item').nth(0).locator('input[data-action="toggle-select"]').check();
  await page.getByRole('button', { name: 'コピー', exact: true }).click();
  await page.locator('#bulk-destination-list .list-item-btn', { hasText: listB }).click();

  await openListSheet(page);
  await page.getByRole('button', { name: listB, exact: true }).click();
  await expect(page.locator('#active-list .task-item')).toHaveCount(2);
});

test('share UI supports publish, search, detail, import and derived transition', async ({ page }) => {
  const sharedPayload = JSON.stringify({
    schemaVersion: 2,
    currentListId: 'shared-list',
    lists: [{ id: 'shared-list', name: '公開リスト', createdAt: 1 }],
    tasks: [{ id: 'st1', title: '共有タスク', status: 'active', count: 0, listId: 'shared-list' }],
  });

  await page.route('http://127.0.0.1:8787/catalog/games', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{ game_key: 'sf6', game_name: 'Street Fighter 6' }]),
    });
  });

  await page.route('http://127.0.0.1:8787/catalog/characters?*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{ character_key: 'ryu', character_name: 'Ryu' }]),
    });
  });

  await page.route('http://127.0.0.1:8787/lists', async (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ id: 'public-1', share_url: 'http://127.0.0.1:8787/lists/public-1' }),
    });
  });

  await page.route('http://127.0.0.1:8787/search?*', async (route) => {
    const url = new URL(route.request().url());
    const parentId = url.searchParams.get('parent_id');
    const id = parentId ? 'child-1' : 'public-1';
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id,
          title: parentId ? '派生リスト' : '公開リスト',
          game_key: 'sf6',
          character_key: 'ryu',
          version_text: null,
          description_snippet: 'desc',
          imports_count: 3,
          created_at: '2026-02-24T00:00:00.000Z',
        },
      ]),
    });
  });

  await page.route('http://127.0.0.1:8787/lists/public-1', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'public-1',
        title: '公開リスト',
        game_key: 'sf6',
        character_key: 'ryu',
        version_text: null,
        description: '公開説明',
        payload_json: sharedPayload,
        imports_count: 3,
        parent_id: null,
        hidden: false,
        is_deleted: false,
        created_at: '2026-02-24T00:00:00.000Z',
      }),
    });
  });

  await page.route('http://127.0.0.1:8787/lists/public-1/imported', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ id: 'public-1', imports_count: 4 }),
    });
  });

  await addTask(page, `公開元-${Date.now()}`);

  await page.getByRole('button', { name: 'メニュー' }).click();
  await page.getByRole('menuitem', { name: 'このタスクリストを公開' }).click();

  await page.locator('#share-game-select').selectOption('sf6');
  await page.locator('#share-character-select').selectOption('ryu');
  await page.getByRole('button', { name: '公開URLを作成' }).click();
  await expect(page.locator('#share-created-row')).toBeVisible();
  await expect(page.locator('#share-created-url')).toHaveValue('http://127.0.0.1:8787/lists/public-1');

  await page.locator('#share-search-game-select').selectOption('sf6');
  await page.locator('#share-search-character-select').selectOption('ryu');
  await expect(page.locator('#share-search-results .list-item-btn', { hasText: '公開リスト' })).toHaveCount(1);

  const detailButton = page.locator('#share-search-results button[data-action="share-detail"]').first();
  await detailButton.scrollIntoViewIfNeeded();
  await detailButton.click();
  await expect(page.locator('#share-detail-section')).toBeVisible();
  await expect(page.locator('#share-detail-description')).toContainText('公開説明');

  await page.getByRole('button', { name: 'このリストをインポート' }).click();
  await expect(page.locator('#live-region')).toContainText('インポートしました');

  await page.getByRole('button', { name: 'このタスクリストからの派生' }).click();
  await expect(page.locator('#share-search-results .list-item-btn', { hasText: '派生リスト' })).toHaveCount(1);
});
