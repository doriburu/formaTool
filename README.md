# IM-FormaDesigner スクリプト一括取得ツール

## 概要
intra-mart Accel Platform スクリプト開発で作成ツール

IM-FormaDesigner アプリケーションにてデザイナ上で設定するクライアントサイドJavaScriptをまとめて１つのzipファイルにする
取得対象は以下のとおり
■画面アイテム内スクリプト
■アクション処理
・初期表示イベント カスタムスクリプト
・アイテムイベント カスタムスクリプト
・明細テーブルイベント カスタムスクリプト

## 使い方
プロジェクトのプログラムをeBuilderで展開。もしくはresin内に直接配置する

ブラウザで下記URLに飛ぶとしばらくしてzipファイルがダウンロードされる

[intra-martベースURL]/tool/getFormaScript

例：

http://localhost:8080/imart/tool/getFormaScript

zipファイル内のファイル名がUTF-8エンコーディングなのでzipファイル解凍時に対応ソフトがないと文字化けするので注意
