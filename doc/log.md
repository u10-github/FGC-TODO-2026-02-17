# 作業ログ

## 2026-02-17
- 要件を基にMVP実装を開始。
- UI / ドメイン / 永続化を分離する構成を採用 (`src/ui`, `src/core`)。
- `tasks.js` の純粋関数を先に実装し、要件ID付きでユニットテストを追加。
- `store.js` を依存注入可能にし、localStorage破損時フォールバックをテスト。
- `index.html` + `app.js` で最小UIを実装（タブ切替、追加、+1、リセット、完了、復活）。
- 影響範囲: 新規ファイル追加のみ。
- 次アクション: 手動受け入れテストを実施し、GitHub Pages向け利用手順をREADMEへ明文化。

## 2026-02-17 (UX/UI refinement)
- 完了タスクを常時表示しないよう、折りたたみアーカイブUIへ変更。
- タスク行を「タイトル/成功回数/操作」に再設計し、主操作を視覚強調。
- 破壊的操作（リセット・完了）に確認を追加。
- 完了後に取り消し可能なトースト（5秒）を追加。
- 空入力エラー表示、live region、aria-label、フォーカス可視化を追加。

## 2026-02-19 (Done task deletion)
- 完了タスクに `削除 | 復活` を追加し、削除前に確認ダイアログを表示するよう変更。
- `deleteTask` をコア関数として追加し、確認後は localStorage から永久削除される仕様を実装。
- `tests/tasks.test.js` に REQ-UC6 のユニットテストを追加。
- `tests/e2e/todo-ui.spec.js` に完了タスク削除のE2Eテストを追加。
- `README.md`, `doc/Requirements.md`, `doc/Todo.md` を最新仕様へ同期。

## 2026-02-19 (Branch workflow update)
- 開発フローを `develop` 先行（実装・検証）→ `main` 反映に変更。
- GitHub Pages の公開ブランチが `main` 固定であることを運用ルールとして明文化。
- `README.md`, `doc/Requirements.md`, `doc/Todo.md` にブランチ運用ルールを追記。

## 2026-02-19 (Task list switch planning)
- 1入力欄の自由記述でタスクリストを作成し、タスクリストを切替できる要件（REQ-UC7/REQ-UC8）を追加。
- `Task` に `listId` を持たせ、`lists` と `currentListId` を保存するデータ構造へ拡張する方針を定義。
- `README.md`, `doc/Requirements.md`, `doc/Todo.md` を先行更新して、次実装のトレーサビリティを準備。

## 2026-02-19 (Task list switch implementation)
- `store.js` を schemaVersion=2 に更新し、`lists` / `currentListId` / `task.listId` を保存。
- schemaVersion=1 から v2 への移行（既存タスクをデフォルトリストへ割当）を実装。
- UIにタスクリスト切替ボタンと管理シートを追加し、自由記述1入力欄で作成・切替可能にした。
- リスト名の空文字/重複をUIでバリデーションし、エラーメッセージ表示を追加。
- テストを TDD で追加更新（store/tasks unit + Playwright E2E）し、`npm test` / `npm run test:e2e` を通過。

## 2026-02-19 (Hamburger menu + backup)
- ヘッダー左のタイトルを廃止し、ハンバーガーメニューを追加。
- メニュー項目を `データをエクスポート` / `データをインポート` の2つに限定して実装。
- `store.js` にバックアップ用 `exportStateData` / `importStateData` を追加し、インポート時のスキーマ検証と v1->v2 移行を共通化。
- インポート前に追加確認ダイアログを表示し、成功/失敗を live region で通知。
- `tests/store.test.js` と `tests/e2e/todo-ui.spec.js` を更新し、バックアップ機能を検証。

## 2026-02-19 (Import append mode)
- インポート動作を「上書き」から「新しいタスクリストとして追加」に変更。
- 既存と同名のタスクリストがある場合、`(1)` 連番を付与して重複回避する仕様を実装。
- インポート後は追加したリスト（バックアップ内で選択されていたリスト）を表示するよう調整。

## 2026-02-19 (List row menu: rename/delete)
- タスクリスト行の右端に `...` メニューを追加し、`名前変更` / `削除` を実装。
- 名前変更は空文字/重複を禁止し、入力はトリムして保存する。
- リスト削除は確認ダイアログ付きにし、削除対象リストのタスクも同時削除。
- 最後の1件は削除不可とし、UIで削除ボタンを無効化。
- `src/core/lists.js` と `tests/lists.test.js` を追加し、リスト操作の純粋関数を単体検証。
- `tests/e2e/todo-ui.spec.js` に `...` メニュー経由の名前変更/削除のE2Eを追加。

## 2026-02-20 (Android表示ずれのSkill化)
- Android実機（本番）とローカル取得スクリーンショットの表示ずれを調査する手順を Skill として追加。
- `skills/android-layout-drift/SKILL.md` を新規作成し、切り分け順序を `viewport → DPR → フォント → safe-area/fixed → 配信差` に標準化。
- 証跡採取用の実機コンソールスニペットと、修正後検証手順（`npm test` / 必要時 `npm run test:e2e`）を明記。

## 2026-02-20 (Android: タブと順序入れ替えを同一行化)
- Android表示で `アクティブ/完了` と `順序入れ替え` が別行になる問題に対応。
- `reorder-toggle-btn` をヘッダーからタブナビゲーションへ移動し、`tabs` を左右配置レイアウトへ変更。
- E2Eに「モバイルでタブと順序入れ替えが同一行」を検証するテストを追加し、`npm test` / `npm run test:e2e` を通過。
- `artifacts/android-repro/local-android-pixel7-after-tabs-reorder-row.png` を再取得して表示を確認。
