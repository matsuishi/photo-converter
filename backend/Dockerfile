# Stage 1: ビルドステージ - 開発ツールとnpm依存関係のインストール
FROM node:20 AS builder

WORKDIR /app

# sharp が依存する libvips とその他のビルドツールをインストール (Debian/Ubuntu用)
# 各行の末尾に「\」があることを確認してください。これにより、次の行も同じRUNコマンドの一部とみなされます。
RUN apt-get update && apt-get install -y --no-install-recommends \
    libvips-dev \
    build-essential \
    git \
    libjpeg-dev \
    libpng-dev \
    librsvg2-dev \
    libwebp-dev \
    libopenjp2-7-dev \
    zlib1g-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# package.json と package-lock.json をコピーして依存関係をインストール
COPY package*.json ./
RUN npm install --production && npm rebuild


# Stage 2: 最終ステージ - 最小限のランタイム環境
FROM node:20-slim 

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/. .

ENV PORT 8080
EXPOSE 8080

# アプリケーションを起動するコマンド
CMD ["node", "server.js"]