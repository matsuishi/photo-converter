# ベースイメージをnode:20（Debianベース）に変更
# これにより、Alpine特有の依存関係の問題を回避できる可能性が高い
FROM node:20 

# 作業ディレクトリを設定
WORKDIR /app

# このCMDテストの間は、以下のCOPYとRUN npm installはコメントアウトします。
# これにより、ビルドが速くなります。
# COPY package*.json ./
# RUN npm install --production && npm rebuild
# COPY . .

ENV PORT 8080
EXPOSE 8080

# ★★★ NEW DEBUGGING CMD START ★★★
# 非常にシンプルなNode.jsスクリプトを実行し、ログを出力し続ける。
# そして、簡易的なHTTPサーバーを起動して、Cloud Runがリクエストをルーティングできるか確認します。
CMD ["/bin/sh", "-c", "while true; do echo 'Hello from Docker CMD!'; sleep 5; done"]
# ★★★ NEW DEBUGGING CMD END ★★★