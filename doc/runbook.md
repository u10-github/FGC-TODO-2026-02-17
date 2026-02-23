# runbook: FGC-TODO-2026-02-17

## サービス概要
- デプロイ: GitHub Pages（`main` ブランチ）
- 本番URL: `https://u10-github.github.io/FGC-TODO-2026-02-17/`
- 法務ページ:
  - `https://u10-github.github.io/FGC-TODO-2026-02-17/terms/`
  - `https://u10-github.github.io/FGC-TODO-2026-02-17/privacy/`
- 実装構成: 静的HTML + Vanilla JS + localStorage
- オーナー: u10-github

## 初動トリアージ
- 対象事象の分類:
  - [ ] 画面表示/UI不整合（例: リンク404、ボタン反応なし）
  - [ ] データ不整合（例: タスク消失、list切替異常）
  - [ ] テスト/CI失敗（`test` / `build` / `e2e_optional`）
- 最初の確認:
  - [ ] GitHub Actions の最新失敗ジョブとログ
  - [ ] 直近で `main` に入ったコミット/PR
  - [ ] 再現URLが project path 配下か（`/FGC-TODO-2026-02-17/`）
  - [ ] 影響範囲（S1/S2/S3 or その他）を特定

## 標準確認コマンド
1. 依存インストール
   - `npm ci`
2. 単体テスト（必須）
   - `npm test`
3. E2E（任意）
   - `npm run pw:install`
   - `npm run test:e2e`
4. アーキガード
   - `./codex-web-recommended-pack/scripts/arch_guard.sh`

## 典型インシデント別チェック
### 1) GitHub Pagesで404が出る
- [ ] URLが `https://u10-github.github.io/FGC-TODO-2026-02-17/...` か確認
- [ ] ルート絶対パス（`/terms`, `/privacy` など）を使っていないか確認
- [ ] `index.html`, `terms/index.html`, `privacy/index.html` のリンクが相対パスか確認

### 2) タスク操作結果が反映されない
- [ ] ブラウザConsoleにエラーがないか確認
- [ ] `npm test` の `REQ-UC1`〜`REQ-UC6` 系テスト結果を確認
- [ ] `localStorage` の `fg_task_manager_v1` が破損していないか確認

### 3) CI失敗
- [ ] `test` ジョブ失敗時: まず `npm test` をローカル再現
- [ ] `build` ジョブ失敗時: `build` script追加/変更有無を確認
- [ ] `e2e_optional` 失敗時: ブラウザ依存要因と環境差分を確認

## 更新ポリシー
- runbook + evals更新前にインシデントをクローズしない。
- 記録は短く保つ: 症状 -> 確認 -> 対処 -> 恒久対応。

## インシデント記録テンプレート
### ID: RB-YYYYMMDD-N
- 発生日:
- 症状:
- 影響範囲:
- 再現手順:
- 原因:
- 応急対応:
- 恒久対応:
- 検証証跡:
  - [ ] `npm test` 結果
  - [ ] 必要なら `npm run test:e2e` 結果
  - [ ] 必要なら本番URL確認
- 関連eval:
- 関連PR:
