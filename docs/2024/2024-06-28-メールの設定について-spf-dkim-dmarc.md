---
draft: false
emoji: ✉️
title: メールの設定について（SPF、DKIM、DMARC）
slug: about-mail-settings-dkim-dmarc-spf
published_at: 2024-06-28 02:03:13
modified_at: 2024-06-28 02:03:13
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
