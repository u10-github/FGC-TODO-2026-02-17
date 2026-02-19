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

### Agent Browser CLI
`agent-browser` は Playwright と別ツールなので、依存インストール後にそのまま使えます。

例:

```bash
npm run ab:open -- http://127.0.0.1:8000/index.html
npm run ab:snapshot
npm run ab:close
```

## GitHub Pages 配置時の注意
- 依存/ビルド不要のため、ルート配下の静的ファイルをそのまま配信可能。
- `localStorage` はブラウザごとに保持されるため、端末間同期はされません。
- GitHub Pages の公開ブランチは `main` 固定です。

## ブランチ運用ルール
1. 変更はまず `develop` ブランチで実装・検証する。
2. `develop` でレビュー/確認が完了した変更のみ `main` に反映する。
3. `main` は GitHub Pages 公開用ブランチとして扱い、直接の試行実装は行わない。

## UX/UIの現在仕様
- メイン表示はアクティブタスク中心（完了タスクは折りたたみアーカイブ）。
- 左上はハンバーガーメニューで、`データをエクスポート` / `データをインポート` を提供します。
- 上部に現在タスクリストを表示し、リスト作成/切替ができます（作成は自由記述1入力欄）。
- 完了操作は確認後に実行され、5秒間「取り消し」できます。
- 完了タスクは `削除 | 復活` を表示し、`削除` は確認後に永久削除されます。
- `+1` / `復活` を主操作として強調し、`リセット` / `完了` は誤操作防止の確認付き。
- 追加時の空入力はエラーメッセージを表示。
- アクセシビリティ: 明示フォーカス、live region、操作ボタンの `aria-label` を付与。

## 受け入れ条件の手動確認リスト
- [ ] ハンバーガーメニューからデータをエクスポートできる
- [ ] ハンバーガーメニューからデータをインポートでき、確認後に新しいタスクリストとして追加される
- [ ] インポート時に同名タスクリストがある場合、`(1)` 連番が付与される
- [ ] 自由記述1入力欄でタスクリストを作成できる（空文字/重複は不可）
- [ ] タスクリストを切替すると、タスク表示がリスト単位で分離される
- [ ] タスクを追加するとアクティブ一覧に表示され、count=0
- [ ] `+1` でcountが増える（減算UIがない）
- [ ] `リセット` で対象タスクのみcount=0
- [ ] `完了` でアーカイブへ移動
- [ ] `復活` でアクティブへ戻り、count保持
- [ ] 完了タスクの `削除` で確認後に一覧から消え、リロード後も復元されない
- [ ] リロードしてもタスク/状態/countが保持

## 要件IDとテスト
- REQ-UC1: `tests/tasks.test.js` (addTask)
- REQ-UC2: `tests/tasks.test.js` (incCount)
- REQ-UC3: `tests/tasks.test.js` (resetCount)
- REQ-UC4: `tests/tasks.test.js` (completeTask)
- REQ-UC5: `tests/tasks.test.js` (restoreTask)
- REQ-UC6: `tests/tasks.test.js` (deleteTask), `tests/e2e/todo-ui.spec.js`
- REQ-UC7: `tests/store.test.js`, `tests/e2e/todo-ui.spec.js`
- REQ-UC8: `tests/tasks.test.js`, `tests/e2e/todo-ui.spec.js`
- REQ-UC9: `tests/store.test.js`
- REQ-UC10: `tests/store.test.js`, `tests/e2e/todo-ui.spec.js`
- REQ-PERSIST-01 / REQ-EX-01: `tests/store.test.js`
