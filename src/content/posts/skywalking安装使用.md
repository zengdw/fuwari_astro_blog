---
title: skywalking安装使用
published: 2020-09-21T16:54:44.000Z
description: ''
tags:
  - skywalking
category: 工具
draft: false
---

## skywalking简介

> 分布式系统的应用程序性能监视工具，专为微服务、云原生架构和基于容器（Docker、K8s、Mesos）架构而设计。

[skywalking官网](http://skywalking.apache.org/zh/)     [sklwalking下载地址](http://skywalking.apache.org/zh/downloads/)

## 环境搭建

###  1、下载解压后的文件结构：

![image-20200922155624650](https://blog-img.zengdw.com/skywalking安装使用/image-20200922155624650.png)

### 2、修改后端配置文件

`apache-skywalking-apm-bin\config\application.yml`

启动方式，默认单机启动

![image-20200922161543029](https://blog-img.zengdw.com/skywalking安装使用/image-20200922161543029.png)

HTTP和RPC地址和端口

![image-20200922161820052](https://blog-img.zengdw.com/skywalking安装使用/image-20200922161820052.png)

数据存储位置，默认H2。可选es，es7，mysql

![image-20200922161919461](https://blog-img.zengdw.com/skywalking安装使用/image-20200922161919461.png)

### 3、UI项目配置文件

`apache-skywalking-apm-bin\webapp\webapp.yml`

![image-20200922162750191](https://blog-img.zengdw.com/skywalking安装使用/image-20200922162750191.png)

### 4、启动skywalking

进入`apache-skywalking-apm-bin\bin`文件夹

![image-20200922162129431](https://blog-img.zengdw.com/skywalking安装使用/image-20200922162129431.png)

至此skywalking环境就搭建成功。在浏览器输入`http://127.0.0.1:8080`地址后就能看到UI界面



## 探针配置文件

探针配置文件`apache-skywalking-apm-bin\agent\config\agent.config`

```
# The agent namespace
# agent.namespace=${SW_AGENT_NAMESPACE:default-namespace}

# The service name in UI
# 在UI界面显示的应用名字, 可以在配置文件中修改 Your_ApplicationName 为每个应用的名称
# 但在配置文件中修改就需要 agent 文件夹每个应用要复制一份
agent.service_name=${SW_AGENT_NAME:Your_ApplicationName}

# Backend service addresses.
# 探针数字上传地址，为上面后端配置文件中的RPC地址
collector.backend_service=${SW_AGENT_COLLECTOR_BACKEND_SERVICES:127.0.0.1:11800}
```

只需确保这2个配置就行，其余可以默认

### 配置覆盖

前面在配置应用名称时是直接修改的配置文件，但是每个应用都需要复制一份`agent`文件，这显然不可取。可以使用skywalking提供的配置覆盖功能通过启动命令动态指定要修改的配置，这样`agent`就只需要一份。

#### 系统配置

使用`skywalking`+配置文件中的配置名来作为系统配置项来进行覆盖

案例：

```
-Dskywalking.agent.service_name=app_name
```

#### 探针配置

通过在探针路径后添加参数来覆盖

```
-javaagent:/path/apache-skywalking-apm-bin/agent/skywalking-agent.jar=[option1]=[value1],[option2]=[value2]
```

案例

```
-javaagent:/path/apache-skywalking-apm-bin/agent/skywalking-agent.jar=agent.service_name=app_name
```

如果配置中包含分隔符，则需要用引号包裹

```
-javaagent:/path/apache-skywalking-apm-bin/agent/skywalking-agent.jar=agent.service_name=app_name,agent.ignore_suffix=‘.jpg,.jpeg’
```

#### 系统环境变量配置

由于配置项的取值规则如下

```
# The service name in UI
agent.service_name=${SW_AGENT_NAME:Your_ApplicationName}
```

则可以在系统环境变量中配置`SW_AGENT_NAME`的值来指定应用名

#### 覆盖优先级

探针配置 > 系统配置 > 系统环境变量配置 > 配置文件

## 使用

### 在IDEA中使用

![image-20200922170014378](https://blog-img.zengdw.com/skywalking安装使用/image-20200922170014378.png)

### linux下在tomcat中使用

编辑`apache-tomcat-8.5.42\bin\catalina.sh`文件，在文件顶部添加

```
CATALINA_OPTS="CATALINA_OPTS -javaagent:/path/apache-skywalking-apm-bin/agent/skywalking-agent.jar=agent.service_name=app_name";
export CATALINA_OPTS
```

### springboot项目使用

```
java -javaagent:/path/apache-skywalking-apm-bin/agent/skywalking-agent.jar -Dskywalking.agent.service_name=app_name -jar app.jar
```

