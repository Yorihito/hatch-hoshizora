# hatch-hoshizora — 星空マップ

自分の場所・日時から見える星空をシミュレーションできる Web アプリです。

## 機能

- 🌟 **恒星表示** — 実視等級に応じた大きさで 90 以上の明るい星を描画
- 🔗 **星座線** — 12 星座の結線と名前を表示
- 🪐 **惑星位置** — 水星・金星・火星・木星・土星のリアルタイム位置
- 🌙 **月の位置と満ち欠け** — 月齢・輝面比・月相名を表示
- 📍 **場所指定** — 主要都市プリセット / 緯度経度入力 / GPS 現在地取得
- 📅 **日時指定** — 任意の日時を指定してシミュレーション

## 公開 URL

main ブランチへの push 時に GitHub Actions が自動ビルド・デプロイします。

👉 https://yorihito.github.io/hatch-hoshizora/

> 初回は GitHub リポジトリの **Settings → Pages → Source** を **GitHub Actions** に設定してください。

## ローカルで動かす

```bash
npm install
npm run dev
```

http://localhost:3000 で開きます。

## スタック

- Next.js 15 (App Router) + TypeScript
- Canvas API による星空描画
- 外部ライブラリなし（天文計算はすべてゼロから実装）
- GitHub Actions + GitHub Pages で自動デプロイ

---

このリポジトリは [Hatch](https://hatch.nyoyapoya.cc/ideas/d03c52c4-e27b-4b8f-9aec-285bfe0d88f3) のアイデアから生成されました。
