---
draft: false
emoji: ✉️
title: メールの設定について（SPF、DKIM、DMARC）
slug: about-mail-settings-dkim-dmarc-spf
published_at: 2024-06-28 02:03:13
modified_at: 2024-07-11 21:32:10
tags:
  - Terraform
  - メール
  - AWS
preview: null
type: default
---

## この記事について

メールに関する技術であるSPF、DKIM、DMARCについて整理した記事です。

## SPFとは

SPFとはなりすましメールを防止するため、電子メールの送信元を認証するための技術です。

## DKIMとは

DKIMとは、電子メールの送信元ドメインを認証し、メッセージが改ざんされていないことを確認する技術です。

## DMARCとは

DMARCとは、フィッシング、スパム、なりすましメールなどの不正メールを防止するための技術です。SPFやDKIMと組み合わせて、送信元ドメインの認証を強化します。

## DNSレコードの例

以下はそれぞの技術のDNSレコードの例です。

### SPFレコード

```text
// [!code word:example.com]
// [!code word:127.0.0.1]

example.com. IN TXT "v=spf1 ip4:127.0.0.1 -all"
```

ドメイン名(`example.com`)、IPアドレス(`127.0.0.1`)の部分は任意の値に置き換えます。

| タグ名 | 説明                                     | 例              |
| ------ | ---------------------------------------- | --------------- |
| `v`    | バージョン                               | `v=spf1`        |
| `ip4`  | 許可されたIPアドレス範囲                 | `ip4:127.0.0.1` |
| `all`  | すべての受信メールが照合されることを指定 | `-all`          |

### DKIMレコード

```text
// [!code word:SELECTOR]
// [!code word:example.com]
// [!code word:MIIBIjANBgkq...]

SELECTOR._domainkey.example.com. IN TXT "v=DKIM1; k=rsa; p=MIIBIjANBgkq..."
```

セレクタ名(`SELECTOR`)、ドメイン名(`example.com`)、公開鍵(`MIIBIjANBgkq...`)の部分は任意の値に置き換えます。

| タグ名 | 説明       | 例                  |
| ------ | ---------- | ------------------- |
| `v`    | バージョン | `v=DKIM1`           |
| `k`    | 鍵の種類   | `k=rsa`             |
| `p`    | 公開鍵     | `p=MIIBIjANBgkq...` |

### DMARCレコード

```text
// [!code word:dmarc@example.com]
// [!code word:example.com]x

_dmarc.example.com. IN TXT "v=DMARC1;p=none;rua=mailto:dmarc@example.com"
```

ドメイン名(`example.com`)、メールアドレス(`dmarc@example.com`)の部分は任意の値に置き換えます。

| タグ名 | 説明                 | 例                      |
| ------ | -------------------- | ----------------------- |
| `v`    | バージョン           | `v=DMARC1`              |
| `p`    | ポリシー             | `p=none`                |
| `rua`  | 送信先の集計レポート | `rua=dmarc@example.com` |

## チェックツール

それぞれのDNSレコードを追加した後は以下のツールで正しく設定されているかチェックすることができます。

### SPFチェッカー

::link-card[https://dmarcly.com/tools/spf-record-checker]

### DKIMチェッカー

::link-card[https://dmarcly.com/tools/dkim-record-checker]

### DMARCチェッカー

::link-card[https://dmarcly.com/tools/dmarc-checker]

## Route53にDKIMのレコードを追加するときに `CharacterStringTooLong` というエラーになる場合

Route53のレコード追加では255文字までの制限があるため、それ以上の文字列を設定する場合に工夫が必要です。Terraformの定義にも工夫がいるため参考になるGitHubのIssueを紹介します。

::link-card[https://github.com/hashicorp/terraform-provider-aws/issues/14941]

上記のIssueで紹介されていたHCLは以下です。

```hcl
locals {
  dkim_record = "v=DKIM1; k=rsa; p=MIIBIjAN..."
  zone_id = "..."
  domain = "example.com"
}

resource "aws_route53_record" "this" {
  zone_id = local.zone_id
  name    = "selector._domainkey.${local.domain}"
  type    = "TXT"
  records = [
    join("\"\"", [
      substr(local.dkim_record, 0, 255),
      substr(local.dkim_record, 255, 255),
    ])
  ]
  ttl = "300"
}
```

Zennに詳しく解説されている記事もあります。

::link-card[https://zenn.dev/umeso/articles/270a891178c5a9]

## もっと詳しく知りたい

以下はそれぞれの技術について詳しく解説されているWEBサイトへのリンクです。

### SPF

::link-card[https://support.google.com/a/answer/10683907]

### DKIM

::link-card[https://blastengine.jp/blog_content/confirm-dkim/]

### DMARC

::link-card[https://support.google.com/a/answer/2466563]
