# 格闘ゲーム用タスク管理ツール (MVP)

Vanilla JS で実装した静的Webアプリです。GitHub Pages でそのまま公開できます。

## 実行方法（ローカル）
1. このリポジトリを取得
2. `index.html` をブラウザで開く
   - もしくは簡易サーバー: `python3 -m http.server 8000` → `http://localhost:8000`

## テスト実行方法
Node.js 18+ を想定。

```bash
node --test
```

### E2Eテスト（Playwright）
初回のみブラウザをインストール:

```bash
npm run pw:install
```

E2Eを実行:

```bash
npm run test:e2e
```

UIを表示しながら確認:

```bash
npm run test:e2e:headed
```

## GitHub Pages 配置時の注意
- 依存/ビルド不要のため、ルート配下の静的ファイルをそのまま配信可能。
- `localStorage` はブラウザごとに保持されるため、端末間同期はされません。

## UX/UIの現在仕様
- メイン表示はアクティブタスク中心（完了タスクは折りたたみアーカイブ）。
- 完了操作は確認後に実行され、5秒間「取り消し」できます。
- `+1` / `復活` を主操作として強調し、`リセット` / `完了` は誤操作防止の確認付き。
- 追加時の空入力はエラーメッセージを表示。
- アクセシビリティ: 明示フォーカス、live region、操作ボタンの `aria-label` を付与。

## 受け入れ条件の手動確認リスト
- [ ] タスクを追加するとアクティブ一覧に表示され、count=0
- [ ] `+1` でcountが増える（減算UIがない）
- [ ] `リセット` で対象タスクのみcount=0
- [ ] `完了` でアーカイブへ移動
- [ ] `復活` でアクティブへ戻り、count保持
- [ ] リロードしてもタスク/状態/countが保持

## 要件IDとテスト
- REQ-UC1: `tests/tasks.test.js` (addTask)
- REQ-UC2: `tests/tasks.test.js` (incCount)
- REQ-UC3: `tests/tasks.test.js` (resetCount)
- REQ-UC4: `tests/tasks.test.js` (completeTask)
- REQ-UC5: `tests/tasks.test.js` (restoreTask)
- REQ-PERSIST-01 / REQ-EX-01: `tests/store.test.js`
