# Stage 1: ビルドステージ - 開発ツールとnpm依存関係のインストール
FROM node:20 AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libvips-dev \
    build-essential \
    git \
    libjpeg-turbo-dev \
    libpng-dev \
    librsvg-dev \
    libwebp-dev \
    openjpeg-dev \
    zlib1g-dev \
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

# ★★★ CMDを元の server.js の実行に戻す ★★★
# アプリケーションを起動するコマンド
CMD ["node", "server.js"] # ★この行を以前のデバッグCMDから戻す