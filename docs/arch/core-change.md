# Core Change Log

## 2026-02-27: タスクリスト説明（description）へ移行

### 理由（変更した契約 / 不変条件）
- `Task.description` を廃止し、`TaskList.description: string` に集約した。
- 旧データ互換のため、`lists[].description` 欠落時は空文字へ正規化する不変条件を追加した。

### 影響範囲
- Core: `src/core/tasks.js`, `src/core/store.js`
- UI: `index.html`, `src/ui/app.js`, `style.css`
- Share: `src/ui/share-utils.js`
- Tests: `tests/tasks.test.js`, `tests/store.test.js`, `tests/share-utils.test.js`, `tests/e2e/todo-ui.spec.js`

### 契約テストの更新
- `tests/store.test.js` に `lists[].description` の正規化・マージ保持テストを更新。
- `tests/share-utils.test.js` に共有payloadの `lists[].description` 同梱テストを更新。
- `tests/e2e/todo-ui.spec.js` にリスト説明の表示/永続・インポート確認を更新。

### 回帰実行の証跡
- `npm test`: pass (36/36)
- `npm run test:e2e -- --grep "list description is shown and persists after reload|can import backup data from hamburger menu"`: pass (2/2)

### 補足
- 画面入力は「タスク追加シート」から除外し、メイン画面下部の「タスクリスト説明」欄で編集する形に変更した。
- 「タスクリスト管理」モーダルからは説明入力・説明変更操作を撤去した。

## 2026-02-27: タスク説明（description）追加

### 理由（変更した契約 / 不変条件）
- `Task` に `description: string` を追加した。
- 旧データ互換のため、`description` 欠落時は空文字へ正規化する不変条件を追加した。

### 影響範囲
- Core: `src/core/tasks.js`, `src/core/store.js`
- UI: `index.html`, `src/ui/app.js`, `style.css`
- Tests: `tests/tasks.test.js`, `tests/store.test.js`, `tests/share-utils.test.js`, `tests/e2e/todo-ui.spec.js`

### 契約テストの更新
- `tests/tasks.test.js` に `addTask` の `description` 保存テストを追加。
- `tests/store.test.js` に v1/v2 import 時の `description` 正規化テストを追加。
- `tests/share-utils.test.js` に共有payloadへの `description` 同梱テストを追加。

### 回帰実行の証跡
- `npm test`: pass (37/37)
- `npm run test:e2e -- --grep "task description is shown and persists after reload|can import backup data from hamburger menu"`: pass (2/2)

### 補足
- `arch_guard` の既存許容箇所（`Date.now`, `Math.random`, `logger.warn`）に `arch-guard:allow` を明記した。
