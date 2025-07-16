# 最もシンプルなベースイメージを使用し、Node.jsやアプリコードは含まない
FROM alpine:latest 

# 作業ディレクトリは必須ではないが、一応設定
WORKDIR /app

# 他のファイルやインストールは一切コピーしない・実行しない

ENV PORT 8080
EXPOSE 8080

# ★★★ NEW DEBUGGING CMD START ★★★
# 最もシンプルな無限ループで、ログを出し続けることを目的とする
# これでログが出なければ、CMDの実行かCloud Runのログ取り込みに根本問題がある
CMD ["sh", "-c", "i=0; while true; do echo \"Hello, Test Container! Count: $i\"; i=$((i+1)); sleep 5; done"]
# ★★★ NEW DEBUGGING CMD END ★★★