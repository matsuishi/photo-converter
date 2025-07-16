# 最もシンプルなベースイメージを使用し、Node.jsやアプリコードは含まない
FROM alpine:latest 

# 作業ディレクトリは必須ではないが、一応設定
WORKDIR /app

# Node.js やアプリケーションコードは一切含めない
# COPY package*.json ./
# RUN npm install --production && npm rebuild
# COPY . .

ENV PORT 8080
EXPOSE 8080

# ★★★ NEW DEBUGGING CMD START ★★★
# 最もシンプルなシェルコマンドを実行し、ログを出し続けることを目的とする
# date コマンドのために coreutils をインストールする
CMD ["/bin/sh", "-c", "apk add --no-cache coreutils; while true; do date '+%Y-%m-%d %H:%M:%S - Hello, Test Container!'; sleep 5; done"]
# ★★★ NEW DEBUGGING CMD END ★★★