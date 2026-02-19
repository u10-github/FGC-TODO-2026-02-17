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
