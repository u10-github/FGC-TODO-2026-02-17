# Todo

## ブランチ運用
- `develop` で計画・実装・検証を行う。
- 完了後、`main` に反映する。
- GitHub Pages 公開は `main` 固定のため、`main` は常に公開可能状態を維持する。

## 要件ID一覧
- REQ-UC1: タスク作成（status=active / count=0）
- REQ-UC2: `+1`で成功回数を増加（減算なし）
- REQ-UC3: 個別リセット（対象タスクのみcount=0）
- REQ-UC4: 完了で`done`へ（アクティブから非表示化）
- REQ-UC5: 復活で`active`へ（count保持）
- REQ-UC6: 完了タスクを確認後に永久削除
- REQ-UC7: 自由記述1入力欄でタスクリスト作成（空/重複不可）
- REQ-UC8: タスクリスト切替（表示分離 + 選択状態保持）
- REQ-UC9: データをJSONでエクスポート
- REQ-UC10: データを確認後にJSONインポート（新規タスクリスト追加、重複名は連番）
- REQ-UC11: タスクリスト名変更（空/重複不可）
- REQ-UC12: タスクリスト削除（確認あり、最後の1件は不可）
- REQ-PERSIST-01: localStorage保持（リロード後も維持）
- REQ-EX-01: localStorage破損時にフォールバック+警告

## 実装タスク
- [x] IMP-CORE-01 (`REQ-UC1`,`REQ-UC2`,`REQ-UC3`,`REQ-UC4`,`REQ-UC5`)
  - `src/core/tasks.js` に純粋関数を実装
- [x] IMP-STORE-01 (`REQ-PERSIST-01`,`REQ-EX-01`)
  - `src/core/store.js` に load/save と schemaVersion 管理を実装
- [x] IMP-UI-01 (`REQ-UC1`〜`REQ-UC5`,`REQ-PERSIST-01`)
  - `src/ui/app.js` と `index.html` でDOM操作とイベントハンドリングを実装
- [x] IMP-UI-02 (`REQ-UC6`)
  - 完了タスクに `削除` を追加し、確認後の永久削除を実装
- [x] IMP-STORE-02 (`REQ-UC7`,`REQ-UC8`,`REQ-PERSIST-01`)
  - `src/core/store.js` を schemaVersion=2 に拡張（lists/currentListId）
- [x] IMP-CORE-02 (`REQ-UC1`〜`REQ-UC6`,`REQ-UC8`)
  - `src/core/tasks.js` を listId 前提に更新
- [x] IMP-UI-03 (`REQ-UC7`,`REQ-UC8`)
  - リスト作成/切替UI（1入力欄）を実装
- [x] IMP-STORE-03 (`REQ-UC9`,`REQ-UC10`)
  - `src/core/store.js` にエクスポート/インポート処理を追加
- [x] IMP-UI-04 (`REQ-UC9`,`REQ-UC10`)
  - ハンバーガーメニューと export/import 操作を実装
- [x] IMP-CORE-03 (`REQ-UC11`,`REQ-UC12`)
  - `src/core/lists.js` にリスト名変更/削除の純粋関数を実装
- [x] IMP-UI-05 (`REQ-UC11`,`REQ-UC12`)
  - タスクリスト行の `...` メニュー（名前変更/削除）を実装
- [x] IMP-STYLE-01
  - `style.css` で最小可読性を担保

## テストタスク（TDDトレース）
- [x] TEST-UC1-01 (`REQ-UC1`) `tests/tasks.test.js`
- [x] TEST-UC2-01 (`REQ-UC2`) `tests/tasks.test.js`
- [x] TEST-UC3-01 (`REQ-UC3`) `tests/tasks.test.js`
- [x] TEST-UC4-01 (`REQ-UC4`) `tests/tasks.test.js`
- [x] TEST-UC5-01 (`REQ-UC5`) `tests/tasks.test.js`
- [x] TEST-UC6-01 (`REQ-UC6`) `tests/tasks.test.js`, `tests/e2e/todo-ui.spec.js`
- [x] TEST-UC7-01 (`REQ-UC7`) `tests/store.test.js`, `tests/e2e/todo-ui.spec.js`
- [x] TEST-UC8-01 (`REQ-UC8`) `tests/tasks.test.js`, `tests/e2e/todo-ui.spec.js`
- [x] TEST-UC9-01 (`REQ-UC9`) `tests/store.test.js`
- [x] TEST-UC10-01 (`REQ-UC10`) `tests/store.test.js`, `tests/e2e/todo-ui.spec.js`
- [x] TEST-UC11-01 (`REQ-UC11`) `tests/lists.test.js`, `tests/e2e/todo-ui.spec.js`
- [x] TEST-UC12-01 (`REQ-UC12`) `tests/lists.test.js`, `tests/e2e/todo-ui.spec.js`
- [x] TEST-PERSIST-01 (`REQ-PERSIST-01`,`REQ-EX-01`) `tests/store.test.js`

## トレーサビリティ表
| Requirement | Implementation | Test |
|---|---|---|
| REQ-UC1 | IMP-CORE-01, IMP-UI-01 | TEST-UC1-01 |
| REQ-UC2 | IMP-CORE-01, IMP-UI-01 | TEST-UC2-01 |
| REQ-UC3 | IMP-CORE-01, IMP-UI-01 | TEST-UC3-01 |
| REQ-UC4 | IMP-CORE-01, IMP-UI-01 | TEST-UC4-01 |
| REQ-UC5 | IMP-CORE-01, IMP-UI-01 | TEST-UC5-01 |
| REQ-UC6 | IMP-CORE-01, IMP-UI-02 | TEST-UC6-01 |
| REQ-UC7 | IMP-STORE-02, IMP-UI-03 | TEST-UC7-01 |
| REQ-UC8 | IMP-STORE-02, IMP-CORE-02, IMP-UI-03 | TEST-UC8-01 |
| REQ-UC9 | IMP-STORE-03, IMP-UI-04 | TEST-UC9-01 |
| REQ-UC10 | IMP-STORE-03, IMP-UI-04 | TEST-UC10-01 |
| REQ-UC11 | IMP-CORE-03, IMP-UI-05 | TEST-UC11-01 |
| REQ-UC12 | IMP-CORE-03, IMP-UI-05 | TEST-UC12-01 |
| REQ-PERSIST-01 | IMP-STORE-01, IMP-UI-01 | TEST-PERSIST-01 |
| REQ-EX-01 | IMP-STORE-01 | TEST-PERSIST-01 |
