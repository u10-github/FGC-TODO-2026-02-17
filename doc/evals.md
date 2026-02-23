# evals: FGC-TODO-2026-02-17

## 目的
聖域（S1-S3）に対する最小の回帰チェックを管理する。

## 対応表
| Zone | Flow | 主な根拠テスト | コマンド / 手順 | Owner |
|---|---|---|---|---|
| S1 | タスクを追加できる | `tests/tasks.test.js` の `REQ-UC1`、`tests/e2e/todo-ui.spec.js` の追加フロー | 必須: `npm test` / 任意: `npm run test:e2e` | u10-github |
| S2 | タスクの完了状態を切り替えできる | `tests/tasks.test.js` の `REQ-UC4`,`REQ-UC5`、`tests/e2e/todo-ui.spec.js` の完了タブ遷移 | 必須: `npm test` / 任意: `npm run test:e2e` | u10-github |
| S3 | タスクを削除できる | `tests/tasks.test.js` の `REQ-UC6`、`tests/e2e/todo-ui.spec.js` の削除確認フロー | 必須: `npm test` / 任意: `npm run test:e2e` | u10-github |

## PR更新ルール
- S1-S3の挙動変更がある場合は、この表を同じPRで更新する。
- 表更新が不要な場合は、PR本文に理由を書く。

## 実行ルール（現状）
- CIの必須判定は `npm run test --if-present`（`.github/workflows/ci.yml` の `test` ジョブ）。
- `build` は `npm run build --if-present` のため、build script未定義時はスキップされる。
- E2Eは `e2e_optional` としてPRでは必須ではない。
- E2E実行時は事前に `npm run pw:install` でブラウザを用意する。

## インシデント再発防止ルール
- インシデントごとに最低1本の再発防止チェックを追加する。
- 追加したチェックをrunbookのエントリIDに関連付ける。
