# ベースイメージとしてNode.jsの軽量版を選択
FROM node:20-alpine

# 作業ディレクトリを設定
WORKDIR /app

# package.json と package-lock.json をコピーして依存関係をインストール
# これにより、依存関係に変更がない限り、イメージの再ビルドが高速化される
COPY package*.json ./
RUN npm install --production

# アプリケーションのソースコードをコピー
COPY . .

# アプリケーションがリッスンするポートを指定
# Cloud Run は PORT 環境変数を提供するため、それを使用する
ENV PORT 8080
EXPOSE 8080

# アプリケーションを起動するコマンド
CMD ["node", "server.js"]