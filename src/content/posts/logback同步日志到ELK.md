---
title: logback同步日志到ELK
published: 2023-05-26
description: ''
image: /img/cover/11.jpg
tags:
  - ES
  - logback
category: ES
draft: false
---

### 使用docker-compose搭建ELK服务

```yaml
version: "2"
services:
  es:
    image: docker.elastic.co/elasticsearch/elasticsearch:7.17.10
    container_name: "es"
    environment:
      - node.name=es01
      - cluster.name=es-docker-cluster
      # - discovery.seed_hosts=es02,es03
      # - cluster.initial_master_nodes=es01,es02,es03
      - bootstrap.memory_lock=true
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
      - discovery.type=single-node
    volumes:
      - ./es/data:/usr/share/elasticsearch/data
      - ./es/plugins:/usr/share/elasticsearch/plugins
    ports:
      - "9200:9200"
      - "9300:9300"
    restart: always
  kibana:
    image: docker.elastic.co/kibana/kibana:7.17.10
    container_name: "kibana"
    restart: always
    ports:
      - "5601:5601"
    environment:
      - ELASTICSEARCH_HOSTS=http://es:9200
      - I18N_LOCALE=zh-CN
    # volumes:
    #   - ./kibana/kibana.yml:/usr/share/kibana/config/kibana.yml
    depends_on:
      - es
  logstash:
    image: docker.elastic.co/logstash/logstash:7.17.10
    container_name: logstash
    restart: always
    environment:
      - MONITORING_ELASTICSEARCH_HOSTS=http://es:9200
    volumes:
      - ./logstash/pipeline/:/usr/share/logstash/pipeline/
    ports:
      - 4567:4567
    depends_on:
      - es

```

### 添加logstash管道配置

```
input {
  tcp { // 启动tcp服务，监听4567端口，接收logback发送的日志信息
    mode => "server"
    host => "0.0.0.0"
    port => 4567
    codec => json_lines
  }
}

filter {
  json {
    source => "message"
  }
}

output {
  elasticsearch {
    hosts => ["http://es:9200"]
    index => "%{[appname]}-%{+YYYY.MM.dd}"
    action => "create"
    #user => "elastic"
    #password => "changeme"
  }
}

```

### springboot配置

**pom.xml**文件

```xml
<dependency>
    <groupId>net.logstash.logback</groupId>
    <artifactId>logstash-logback-encoder</artifactId>
    <version>7.3</version>
</dependency>
```

**logback-spring.xml**配置

```xml
<!-- 输出到logstash -->
<appender name="logstash" class="net.logstash.logback.appender.LogstashTcpSocketAppender">
    <!-- 上面logstash管道配置的端口 -->
    <destination>127.0.0.1:4567</destination>
    <encoder class="net.logstash.logback.encoder.LogstashEncoder">
        <!-- 添加自定义字段 json格式 -->
        <customFields>{"appname": "1110-server"}</customFields>
        <!-- 包含代码中通过MDC添加的字段 -->
        <includeMdc>true</includeMdc>
        <includeCallerData>true</includeCallerData>
    </encoder>
</appender>
```
