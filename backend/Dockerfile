# Stage 1: ビルドステージ - 開発ツールとnpm依存関係のインストール
FROM node:20 AS builder

WORKDIR /app

# sharp が依存する libvips とその他のビルドツールをインストール (Debian/Ubuntu用)
# パッケージ名が正しくないためにエラーになっているので、より一般的なものを試す
RUN apt-get update && apt-get install -y --no-install-recommends \
    libvips-dev \             # libvipsの開発ファイル
    build-essential \         # gcc などの基本的なビルドツール
    git \
    libjpeg-dev \             # ★ libjpeg-turbo-dev の代わりに libjpeg-dev を試す
    libpng-dev \              # PNGサポート
    librsvg2-dev \            # ★ librsvg-dev の代わりに librsvg2-dev を試す (librsvg2-2 なども候補)
    libwebp-dev \             # WebPサポート
    libopenjp2-7-dev \        # ★ openjpeg-dev の代わりに libopenjp2-7-dev を試す
    zlib1g-dev \              # 圧縮ライブラリ
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install --production && npm rebuild

# Stage 2: 最終ステージ - 最小限のランタイム環境
FROM node:20-slim 

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/. .

ENV PORT 8080
EXPOSE 8080

CMD ["node", "server.js"]