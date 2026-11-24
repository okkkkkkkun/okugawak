# Portfolio Site - 奥川 航大（Kota Okugawa）

建築・デジタルデザインのポートフォリオです。

https://kota-okugawa.com

## 原稿の編集

本文の正本は [`data/site.json`](data/site.json) です。表示用の HTML はここから生成します。

```bash
python3 scripts/build.py
```

`【ここに…】` は原稿待ちの印です。ヒーロー、考え、仕事の外の短文もこのファイルで差し替えます。

ヒーローの確定文は `site.statement`（「つくりながら、考える。」 / `Make / Run / Rethink.`）です。英語行は等幅で、文字数ぶんだけタイプされます。英語の長さを変えたら、`assets/site.css` の `21` もその文字数に合わせてください。

いま書いていない、または草案の箇所:

| JSON | 欄 |
| --- | --- |
| `profile.intro` | 自己紹介 |
| `thoughts.lead` / `thoughts.items[].body` | 考え。ヒーローに合わせた草案 |
| `personal.gallery` | Personalの写真枠。空の `src` に写真のURLを入れる |
| `footballPhoto.when` | ガウルボードの時期 |
| `works[].addresses` | 同業者向けの一行。本文のない作品は印のまま |

経歴、作品本文、連絡先、Trip の写真（Russia / Europe）、ガウルボードの説明は、既存のページと公開リポジトリから入っています。画像の中身は [docs/photo-catalog.md](docs/photo-catalog.md)。

## ページ

| パス | 内容 |
| --- | --- |
| `index.html` | トップ。プロフィール、作品、考え、仕事の外、連絡 |
| `01_Profile/profile.html` | プロフィール |
| `02_Works/work.html` | 作品一覧 |
| `02_Works/linktoPage/` | 各作品 |
| `03_Trip/trip.html` | 旧 Trip。Football & Photo へ転送 |
| `04_Personal/index.html` | 仕事の外 |
| `05_Thoughts/index.html` | 考え |
| `04_Contact/contact.html` | 連絡先 |

## 公開

GitHub Pages が `main` ブランチのルートを、カスタムドメイン `kota-okugawa.com`（`CNAME`）で配信しています。`main` へマージすると、同じ設定のまま公開されます。ビルド用のサーバーは不要で、生成済みの HTML をそのまま置きます。

変更後は `python3 scripts/build.py` を実行し、生成された HTML も一緒にコミットします。GitHub Actions の `check` が、JSON と HTML のずれを見ます。
