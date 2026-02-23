# DoD: FGC-TODO-2026-02-17

## 対象範囲
- 最小コア: `doc/DoD.md` + `doc/evals.md` + `doc/runbook.md` + PRゲート。
- 現在のCI: `.github/workflows/ci.yml`（`test` / `build` / `e2e_optional`）。
- 本DoDは 2026-02-23 時点のリポジトリ実装を基準とする。

## 聖域（S1-S3）
- `S1`: タスクを追加できる
- `S2`: タスクの完了状態を切り替えできる
- `S3`: タスクを削除できる

## 合格条件（PRごと）
- [ ] PR本文にS1-S3への影響判定がある。
- [ ] 影響がある聖域のテストが追加/更新されている。
- [ ] テスト期待値が変わる場合、`doc/evals.md` が同期されている。
- [ ] 運用/復旧手順が変わる場合、`doc/runbook.md` が同期されている。
- [ ] PRのCI `test` ジョブが成功している（実体: `npm run test --if-present`）。
- [ ] `build` は `npm run build --if-present` のため、`build` scriptが存在する変更では成功証跡を残す。
- [ ] E2EはPR必須ではない。`test:e2e` を実行した場合は結果をPR本文に記載する。
- [ ] PR本文にロールバック手順がある。

## ガードレール
- [ ] S1-S3の挙動が不明な状態ではリリースしない。
- [ ] CI必須チェック（少なくとも `test`）が失敗中ならマージしない。
- [ ] runbook/evals更新前にインシデントをクローズしない。

## ローカル検証の既定順（存在するもののみ）
1. `lint`（現状 script 未定義）
2. `npm test`
3. `build`（現状 script 未定義）
