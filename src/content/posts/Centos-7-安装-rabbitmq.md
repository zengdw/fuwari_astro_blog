---
title: Centos 7 安装 rabbitmq
published: 2022-08-25
description: ''
image: /img/cover/8.jpg
tags:
  - centos
  - rabbitmq
category: rabbitmq
draft: false
---
# Centos 7 安装 rabbitmq

*rabbitmq最新版本已不支持Centos 7*

1. 创建仓库

```sh
# In /etc/yum.repos.d/rabbitmq.repo

##
## Zero dependency Erlang
##

[rabbitmq_erlang]
name=rabbitmq_erlang
baseurl=https://packagecloud.io/rabbitmq/erlang/el/7/$basearch
repo_gpgcheck=1
gpgcheck=1
enabled=1
# PackageCloud's repository key and RabbitMQ package signing key
gpgkey=https://packagecloud.io/rabbitmq/erlang/gpgkey
       https://github.com/rabbitmq/signing-keys/releases/download/2.0/rabbitmq-release-signing-key.asc
sslverify=1
sslcacert=/etc/pki/tls/certs/ca-bundle.crt
metadata_expire=300

[rabbitmq_erlang-source]
name=rabbitmq_erlang-source
baseurl=https://packagecloud.io/rabbitmq/erlang/el/7/SRPMS
repo_gpgcheck=1
gpgcheck=0
enabled=1
gpgkey=https://packagecloud.io/rabbitmq/erlang/gpgkey
sslverify=1
sslcacert=/etc/pki/tls/certs/ca-bundle.crt
metadata_expire=300

##
## RabbitMQ server
##

[rabbitmq_server]
name=rabbitmq_server
baseurl=https://packagecloud.io/rabbitmq/rabbitmq-server/el/7/$basearch
repo_gpgcheck=1
gpgcheck=1
enabled=1
# PackageCloud's repository key and RabbitMQ package signing key
gpgkey=https://packagecloud.io/rabbitmq/rabbitmq-server/gpgkey
       https://github.com/rabbitmq/signing-keys/releases/download/2.0/rabbitmq-release-signing-key.asc
sslverify=1
sslcacert=/etc/pki/tls/certs/ca-bundle.crt
metadata_expire=300

[rabbitmq_server-source]
name=rabbitmq_server-source
baseurl=https://packagecloud.io/rabbitmq/rabbitmq-server/el/7/SRPMS
repo_gpgcheck=1
gpgcheck=0
enabled=1
gpgkey=https://packagecloud.io/rabbitmq/rabbitmq-server/gpgkey
sslverify=1
sslcacert=/etc/pki/tls/certs/ca-bundle.crt
metadata_expire=300
```

2. 进行安装

```sh
#更新yum源
yum update -y

#install these dependencies from standard OS repositories
yum install socat logrotate -y

#安装erlang和rabbitmq
yum install erlang rabbitmq-server -y
```

3. 基本操作

启动rabbitmq

> sudo systemctl start rabbitmq-server

设置开机启动

> sudo systemctl enable rabbitmq-server

安装web插件

> sudo rabbitmq-plugins enable rabbitmq_management

创建账号，设置权限（也可在web端添加）

> sudo rabbitmqctl add_user admin admin
sudo rabbitmqctl set_user_tags admin administrator
sudo rabbitmqctl set_permissions -p / admin '.*' '.*' '.*'
sudo rabbitmqctl list_permissions

修改配置文件。默认rabbitmq是没有创建它的配置文件的。它的默认位置是在/etc/rabbitmq。我们可以创建一个空的配置文件

> sudo vim /etc/rabbitmq/rabbitmq.conf

加入如下配置

> loopback_users.guest=false

重启你的rabbitmq服务。上面的配置是让guest账号可以远程登录
