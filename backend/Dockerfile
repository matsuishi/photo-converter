# Stage 1: ビルドステージ - 開発ツールとnpm依存関係のインストール
# ここで全てのnpm依存関係とネイティブモジュールをビルドします
FROM node:20 AS builder

WORKDIR /app

# sharp が依存する libvips とその他のビルドツールをインストール (Debian/Ubuntu用)
# build-essential は gcc など基本的なビルドツールを含む
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
    # 最後にaptキャッシュをクリーンアップ
    && rm -rf /var/lib/apt/lists/*

# package.json と package-lock.json をコピーして依存関係をインストール
COPY package*.json ./
# npm install と npm rebuild を実行して、ネイティブモジュールを確実にビルド
RUN npm install --production && npm rebuild


# Stage 2: 最終ステージ - 最小限のランタイム環境
# 実行に必要なものだけを含む、より軽量なNode.jsイメージを使用
FROM node:20-slim # node:20 よりさらに軽量

# 作業ディレクトリを設定
WORKDIR /app

# ビルドステージから、コンパイル済みのnode_modules とアプリケーションのソースコードをコピー
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/. . # アプリケーションのソースコードをコピー

ENV PORT 8080
EXPOSE 8080

# アプリケーションを起動するコマンド
# これまでのデバッグログを維持しつつ、最終的なCMDに戻す
# もしこれでログが出れば、server.jsのコードが実行されます。
CMD ["node", "-e", "console.log('--- server.js script started execution (TOP OF FILE) ---'); require('./server.js');"]
# もし、このCMDでもログが出ない場合、以下のような究極のデバッグCMDを試す
# CMD ["node", "-e", "console.log('Node.js is running!'); setInterval(() => console.log('Still alive...'), 5000); require('http').createServer((req, res) => { console.log('Request received!'); res.end('Hello from test server'); }).listen(process.env.PORT || 8080, '0.0.0.0', () => console.log('Test server listening.'));"]