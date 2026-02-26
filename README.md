# NextRound Tasks

`NextRound` ブランドの「1日ひとつ強くなる」を担う、格闘ゲーム向け練習タスク管理アプリです。

## ブランドコンセプト

- 親ブランド: `NextRound`
- コンセプト: 格闘ゲームを続けるための基盤
- 目的:
  - 「情報がなくて止めた」を減らす
  - 「強くなれなくて止めた」を減らす
  - 結果として「格闘ゲームをやめないでほしい」
- 本アプリ: `NextRound Tasks`
  - 役割: 1日ひとつ強くなる（小さく積み上げて継続を支える）
  - 世界観コピー: 「少しずつ強くなっていく。それがいいんだ。」
- 関連アプリ: `NextRound Combos`
  - 役割: 情報を伝えあう（コンボ等のレシピ共有・発見・取り込みを促す）
  - 世界観コピー: 「もっと強くなれる。俺も、お前も。」

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
