# ベースイメージはnode:20（Debianベース）に変更
FROM node:20 

# 作業ディレクトリを設定
WORKDIR /app

# これらの行は、このCMDテストの間はコメントアウトしたままにします。
# COPY package*.json ./
# RUN npm install --production && npm rebuild
# COPY . .

ENV PORT 8080
EXPOSE 8080

# ★★★ NEW DEBUGGING CMD START ★★★
# 非常にシンプルなNode.jsスクリプトを実行し、ログを出力し続ける。
# そして、簡易的なHTTPサーバーを起動して、Cloud Runがリクエストをルーティングできるか確認します。
CMD ["node", "-e", "console.log('Node.js is running!'); setInterval(() => console.log('Still alive...'), 5000); require('http').createServer((req, res) => { console.log('Request received!'); res.end('Hello from test server'); }).listen(process.env.PORT || 8080, '0.0.0.0', () => console.log('Test server listening.'));"]
# ★★★ NEW DEBUGGING CMD END ★★★