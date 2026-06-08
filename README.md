# Portfolio Site - 奥川 航大（Kota Okugawa）

建築・デジタルデザイン分野のポートフォリオサイトです。

## URL

https://kota-okugawa.com

## セクション構成

| # | セクション | 内容 |
|---|-----------|------|
| 01 | Profile | 経歴・自己紹介 |
| 02 | Works | プロジェクト一覧 |
| 03 | Trip | 旅行記録 |
| 04 | Contact | 連絡先 |

## フォルダ構成

```
okugawak/
├── index.html                 # トップページ
├── CNAME                      # カスタムドメイン設定
├── okugawa_icon.png           # サイトアイコン
│
├── 01_Profile/                # プロフィールページ
│   ├── profile.html
│   ├── test.css / test.js
│   ├── hpb-carousel.css / hpb-carousel1.css
│   ├── jquery.bxslider.js     # スライダー
│   └── (プロフィール画像群)
│
├── 02_Works/                  # 作品一覧ページ
│   ├── work.html
│   ├── test.css / test.js
│   ├── image/                 # サムネイル画像
│   └── linktoPage/            # 各作品の詳細ページ
│       ├── aavs/             # AAVS Osaka 2019
│       ├── Aframe/           # Simple A
│       ├── apple/            # Apple peal
│       ├── Boxes/            # Boxes House
│       ├── Daiwa/            # 大和ハウス広島支店
│       ├── Drone/            # Net Shopping for 2045
│       ├── EMARF/            # EMARF学生アンバサダー
│       ├── Fes/              # Polygon Space
│       ├── Funline/          # FUN LINE
│       ├── Hexagon/          # Hexagon
│       ├── kenchikugakuseiWS/ # 建築学生WS 宮島 2022
│       ├── Sidetable/        # Side Table
│       ├── Stool/            # Laminate Stool
│       ├── teahouse/         # Origami Teahouse
│       ├── teahouse_Summit/  # Transition Teahouse
│       ├── VirtualHIT/       # バーチャル広工大
│       ├── Voronoiclock01/   # Voronoi Clock 01
│       ├── Voronoiclock02/   # Voronoi Clock 02
│       ├── yamanefukuoka/    # 山根木材 福岡支店
│       └── yamanefukuyama/   # 山根木材 福山支店
│
├── 03_Trip/                   # 旅行ページ
│   ├── trip.html
│   └── test.css / test.js
│
└── 04_Contact/                # 連絡先ページ
    ├── contact.html
    └── test.css / test.js
```

## ホスティング

- **サイト**: GitHub Pages（カスタムドメイン `kota-okugawa.com`）
- **画像**: Cloudflare R2 オブジェクトストレージ
