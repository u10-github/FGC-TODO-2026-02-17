---
name: android-layout-drift
description: Android実機（本番）とローカル/CIのスクリーンショットで表示位置や改行がずれる問題を再現・切り分け・修正する。Playwright/agent-browserで取得した画像と実機スクリーンショットを比較し、viewport・DPR・フォント・safe-area・ブラウザUI差分を優先して診断するときに使う。
---

# Android Layout Drift Check

## 0. Scope
- 比較対象を明示する:
  - 実機: Android本番環境（端末名、OS、ブラウザ名/版）
  - ローカル: Playwright または agent-browser の画像
- ブラウザのURLバー等のUIを含む実機スクリーンショットは、ページ領域のみで比較する。

## 1. Fix Baseline
- 同一コミットで比較する（`git rev-parse --short HEAD` を記録）。
- 比較情報を記録する:
  - URL
  - viewport (CSS px)
  - `window.devicePixelRatio`
  - `navigator.userAgent`
  - 端末フォント設定（表示サイズ・アクセシビリティ拡大）
- キャッシュ差を排除する:
  - 強制リロード
  - Service Worker 未使用を確認

## 2. Capture Evidence
- ローカル確認（例）:
```bash
npm run test:e2e
```
- 実機で開き、以下をコンソールで採取する:
```js
({
  innerWidth: window.innerWidth,
  innerHeight: window.innerHeight,
  visualViewport: window.visualViewport
    ? {
        width: window.visualViewport.width,
        height: window.visualViewport.height,
        offsetTop: window.visualViewport.offsetTop,
      }
    : null,
  dpr: window.devicePixelRatio,
  ua: navigator.userAgent,
})
```
- 比較画像は `artifacts/` 以下に保存し、ファイル名に `prod-android` など識別子を入れる。

## 3. Diagnose in Order
- 1) `viewport` 差:
  - `meta viewport` と `innerWidth/innerHeight` が一致しているか確認する。
  - AndroidはブラウザUI表示/非表示で `visualViewport.height` が変化する前提で見る。
- 2) `DPR` 差:
  - 同一CSS幅でもDPR差で行折返しや境界線の見え方が変わる。
- 3) フォント差:
  - Roboto未搭載や日本語フォールバック差で文字幅が変わる。
  - 改行位置のずれはフォント差を最優先で疑う。
- 4) Safe Area / 固定配置差:
  - `100vh`/`100dvh`、`position: fixed`、`bottom` 指定（FAB/Toast/Sheet）を確認する。
- 5) 実装差:
  - 本番が古いCSS/JSを配信していないか（デプロイ遅延、キャッシュ）を確認する。

## 4. Typical Fixes
- `font-family` を明示し、必要ならWebフォントを導入する。
- 固定ボタンの下端は `env(safe-area-inset-bottom)` を加味する。
- `min-height: 100dvh` を優先し、必要に応じて `100vh` フォールバックを併記する。
- モバイル `@media` ではボタン最小幅/余白を固定し、文字折返しと競合させない。

## 5. Verify
- 修正後に次を実施する:
  - `npm test`
  - 必要に応じて `npm run test:e2e`
- 比較画像を再取得し、修正前後を同じ端末・同じ画面状態で比較する。
- PR本文に以下を残す:
  - 原因（1行）
  - 修正方針（1行）
  - 証跡（画像または再現手順）
