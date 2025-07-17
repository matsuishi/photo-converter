# Node.js 18 の軽量イメージをベースにする
FROM node:18-slim

# sharp が必要とするシステムライブラリをインストール
RUN apt-get update && apt-get install -y --no-install-recommends libvips-dev

# 作業ディレクトリを設定
WORKDIR /usr/src/app

# package.json と package-lock.json をコピー
COPY package*.json ./

# 本番用の依存関係をインストール
# --production フラグにより、devDependencies はインストールされません
RUN npm install --production

# アプリケーションのソースコードをコピー
COPY . .

# PORT 環境変数を設定
ENV PORT=8080

# アプリケーションを起動
CMD [ "node", "server.js" ]