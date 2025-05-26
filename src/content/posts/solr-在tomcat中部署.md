---
title: solr 在tomcat中部署
published: 2021-10-15T15:36:53.000Z
description: ''
tags:
  - solr
  - tomcat
category: 工具
draft: false
---

### 下载安装包

在[solr官网](https://solr.apache.org/downloads.html)下载安装包。solr有个3个独立的软件包：

1、solr-8.10.0-src.tgz：solr的源码包

2、solr-8.10.0.tgz：solr linux环境的安装包

3、solr-8.10.0.zip：solr window环境的安装包

### solr目录介绍

```
solr-8.10.0
├── bin                          solr的启动 停止脚本
├── CHANGES.txt
├── contrib                      包含solr的附加插件                  
├── dist                         包含solr的主要jar包
├── docs                         包括一个链接到在线 Javadocs
├── example                      几种类型的示例
├── licenses
├── LICENSE.txt
├── LUCENE_CHANGES.txt
├── NOTICE.txt
├── README.txt
└── server

server目录：
此目录是 Solr 应用程序的核心所在。此目录中的 README 提供了详细的概述，但以下是一些特点：
Solr 的 Admin UI（server/solr-webapp）
Jetty 库（server/lib）
日志文件（server/logs）和日志配置（server/resources）。有关如何自定义 Solr 的默认日志记录的详细信息，请参阅配置日志记录一节。
solr 的 core 主目录（server/solr）
示例配置（server/solr/configsets）
```

### 在tomcat中部署步骤：

1、复制 `solr/server/solr-webapp`下的`webapp`目录的所有内容到`tomcat/webapps`下，并改名为`solr`。

2、复制`solr/server/lib/ext`下的所有jar包到`tomcat-9/webapps/solr/WEB-INF/lib`下

3、复制`solr/server/lib`下`metrics-*`开头的jar到`tomcat-9/webapps/solr/WEB-INF/lib`下

4、复制`solr/dist`目录下的`solr-analy*`和`solr-dataimporthandler`到`tomcat-9/webapps/solr/WEB-INF/lib`下

5、在`tomcat-9/webapps/solr/WEB-INF/`下创建`classes`文件夹

6、复制`server/resources`下的`logfj2`配置文件到刚创建的`classes`文件夹中

7、复制`server/solr`目录到任意位置（这个是solr core的主目录）

8、修改`tomcat-9/webapps/solr/WEB-INF/web.xml`文件

```xml
<!-- 在web-app节点中加入 -->
<env-entry>
  <env-entry-name>solr/home</env-entry-name>
  <!-- 配置第6步solr core主目录的位置 -->
  <env-entry-value>/usr/local/solr</env-entry-value>
  <env-entry-type>java.lang.String</env-entry-type>
</env-entry>

<!-- 注释掉 security-constraint -->
<!-- Get rid of error message 
<security-constraint>
  <web-resource-collection>
    <web-resource-name>Disable TRACE</web-resource-name>
    <url-pattern>/</url-pattern>
    <http-method>TRACE</http-method>
  </web-resource-collection>
  <auth-constraint/>
</security-constraint>
<security-constraint>
  <web-resource-collection>
    <web-resource-name>Enable everything but TRACE</web-resource-name>
    <url-pattern>/</url-pattern>
    <http-method-omission>TRACE</http-method-omission>
  </web-resource-collection>
</security-constraint>
-->
```

9、启动tomcat,访问localhost:8080/solr即可

### 创建core

1、在solr core的主目录下创建test(core的名称)文件夹

2、在test下创建conf和data文件夹

3、复制`solr-8.10.0/example/example-DIH/solr/solr/conf`文件夹下的所有内容到刚创建的`conf`目录中

4、重启tomcat

![solr-add-core](https://blog-img.zengdw.com/solr-在tomcat中部署/solr-add-core.png)



