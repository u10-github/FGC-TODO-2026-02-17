# FGC TODO (格闘ゲーム用タスク管理ツール)

格闘ゲームの練習タスクを、リスト単位で管理するブラウザアプリです。

- タスクの追加 / 完了 / 復活 / 削除
- 成功回数カウント（+1）とリセット
- タスクリストの作成 / 切替 / 名前変更 / 削除
- タスク選択モードで複数タスクのコピー / 移動
- アクティブタスクの並び替え（順序入れ替えモード）
- localStorage 永続化
- JSON エクスポート / インポート
- 法務ページ（`/terms`, `/privacy`）

## 技術スタック

- フロントエンド: Vanilla JavaScript (ES Modules)
- テスト:
  - Unit: Node.js built-in test runner
  - E2E: Playwright
- 配置: 静的ファイル構成（GitHub Pages 配置を想定）

## セットアップ

前提:

- Node.js 20+
- npm

依存インストール:

```bash
npm install
```

## ローカル実行

簡易サーバーを起動してブラウザで確認します。

```bash
python3 -m http.server 4173
```

- アプリ: `http://127.0.0.1:4173/index.html`
- 利用規約: `http://127.0.0.1:4173/terms`
- データの扱い: `http://127.0.0.1:4173/privacy`

## テスト

ユニットテスト:

```bash
npm test
```

Playwright のブラウザをインストール:

```bash
npm run pw:install
```

E2E テスト:

```bash
npm run test:e2e
```

主な補助コマンド:

- `npm run test:e2e:headed`
- `npm run ab:open`
- `npm run ab:snapshot`
- `npm run ab:close`

## ディレクトリ構成（主要）

```text
.
├── index.html
├── style.css
├── privacy/index.html
├── terms/index.html
├── src
│   ├── core
│   │   ├── tasks.js
│   │   ├── lists.js
│   │   └── store.js
│   └── ui
│       └── app.js
├── tests
│   ├── e2e/todo-ui.spec.js
│   ├── tasks.test.js
│   ├── lists.test.js
│   └── store.test.js
└── doc
    ├── Requirements.md
    ├── Todo.md
    ├── DoD.md
    └── runbook.md
```

## 仕様・運用ドキュメント

- 要件: `doc/Requirements.md`
- タスク/トレーサビリティ: `doc/Todo.md`
- 完了条件: `doc/DoD.md`
- 運用手順: `doc/runbook.md`
- 作業ログ: `ops/skills-observability/logs/skill-runs.ndjson`

## データ保存について

- 保存先: ブラウザの `localStorage`
- キー: `fg_task_manager_v1`
- 保存形式: `schemaVersion=2` を含む JSON

ブラウザデータ削除や端末変更でデータは失われます。必要な場合はエクスポートを使ってバックアップしてください。
