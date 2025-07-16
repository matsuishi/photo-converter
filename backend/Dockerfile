# ベースイメージとしてNode.jsの軽量版を選択
FROM node:20-alpine

# ★追加: sharp が依存する libvips とその他のビルドツールをインストール
# Cloud Runのベストプラクティスに従い、ビルド時に必要なものをインストールし、最終イメージで削除するマルチステージビルドを推奨
# しかし、シンプルさのため、一時的に単一ステージで試す

# libvipsの依存関係をインストール
RUN apk add --no-cache libvips-dev build-base gcc autoconf automake zlib-dev nasm git

# 作業ディレクトリを設定
WORKDIR /app

# package.json と package-lock.json をコピーして依存関係をインストール
# これにより、依存関係に変更がない限り、イメージの再ビルドが高速化される
COPY package*.json ./
# sharp が適切にインストールされるよう、npm install --production の前に --unsafe-perm を使う場合があります
# あるいは、RUN npm install の前に、sharpをインストールするために必要なシステムパッケージをインストールします。
# 上記のapk addはsharpのビルドに必要なシステム依存関係も提供します。
RUN npm install --production

# アプリケーションのソースコードをコピー
COPY . .

# アプリケーションがリッスンするポートを指定
# Cloud Run は PORT 環境変数を提供するため、それを使用する
ENV PORT 8080
EXPOSE 8080

# アプリケーションを起動するコマンド
CMD ["node", "server.js"]