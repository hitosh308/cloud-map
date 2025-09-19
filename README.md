# cloud-map

Google Cloud / Microsoft Azure / Amazon Web Services の主要サービスをカテゴリ別に整理した
サービスマップです。各クラウドごとに専用ページを用意し、カテゴリからサービスの概要
や代表的な特徴、公式ドキュメントへのリンクを確認できます。

## ページ構成

- `index.html` : Google Cloud 版サービスマップ
- `azure.html` : Microsoft Azure 版サービスマップ
- `aws.html` : Amazon Web Services 版サービスマップ

ページ上部のメニューからクラウドを切り替えられます。いずれのページも同じ UI で動作し
ており、カテゴリを選択するとサービスカードが表示され、カードをクリックまたは Enter /
Space キーで詳細を裏面に表示できます。

## データソース

各クラウドのサービス情報は `data/` ディレクトリの JSON ファイルで管理しています。

- `google-cloud-services.json`
- `azure-services.json`
- `aws-services.json`

JSON を編集することでカテゴリやサービスを更新できます。ページ読み込み時に JavaScript
から該当ファイルを読み込んで表示内容を生成します。
