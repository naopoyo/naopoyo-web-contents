---
draft: false
emoji: 🏗️
title: TerraformでAWSにGitHub Actions用のOIDCプロバイダーを作成する
slug: create-an-oidc-provider-for-github-actions-in-aws-using-terraform
published_at: 2023-10-17 23:02:13
modified_at: 2023-10-17 23:02:13
tags:
    - AWS
    - Terraform
    - GitHub
preview: null
---

## 使用するモジュール

[terraform-aws-modules/iam/aws | Terraform Registry](https://registry.terraform.io/modules/terraform-aws-modules/iam/aws/latest)

## locals

```hcl
locals {
  github_oidc_role_name = "github-actions-role"
}
```

## OIDC Provider

```hcl
module "iam_github_oidc_provider" {
  source  = "terraform-aws-modules/iam/aws//modules/iam-github-oidc-provider"
  version = "5.17.0"
}
```

## Role

`subjects` は任意のGitHubリポジトリを設定します。

```hcl
module "iam_github_oidc_role" {
  source  = "terraform-aws-modules/iam/aws//modules/iam-github-oidc-role"
  version = "5.17.0"

  name = local.github_oidc_role_name

  subjects = [
    "example-org/example-repo:*",
  ]

  policies = {
    additional = aws_iam_policy.github_oidc_role_policy.arn
  }
}
```

## RoleのPolicy

**このサンプルは全て許可するポリシーになっているので、適宜修正する。**

```hcl
resource "aws_iam_policy" "github_oidc_role_policy" {
  name        = "${local.github_oidc_role_name}-policy"
  description = "GitHub actions policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        "Effect" : "Allow",
        "Action" : "*",
        "Resource" : "*"
      }
    ]
  })
}
```

## GitHub Actionsでの認証方法

```yaml
- name: Configure AWS Credentials
  uses: aws-actions/configure-aws-credentials@v2
  with:
    role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
    role-session-name: aws-role-session
    aws-region: ${{ vars.AWS_REGION }}
```
