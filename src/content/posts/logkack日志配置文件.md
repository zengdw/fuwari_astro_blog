---
title: logkack日志配置文件
published: 2021-03-23
description: ''
tags:
  - logback
category: java
draft: false
---

logback-spring.xml

``` xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>

  <!-- magenta:洋红 -->
  <!-- boldMagenta:粗红-->
  <!-- cyan:青色 -->
  <!-- white:白色 -->
  <!-- magenta:洋红 -->
  <springProperty name="LOG_PATH" source="logging.path" defaultValue="./logs" />
  <property name="CONSOLE_LOG_PATTERN" value="%yellow(%date{yyyy-MM-dd HH:mm:ss}) |%highlight(%thread %-5level) |%green(%logger:%line) |%highlight(%msg%n)"/>
  <property name="FILE_LOG_PATTERN" value="%date{yyyy-MM-dd HH:mm:ss} |%thread %-5level |%logger:%line |%msg%n"/>
  <!-- 模块名称， 影响日志配置名，日志文件名 -->
  <property name="log.base" value="${LOG_PATH}"/>

  <springProfile name="prod">
    <!--==================写入文件==================-->
    <appender name="logFile" class="ch.qos.logback.core.rolling.RollingFileAppender">
      <File>${log.base}/log/log.log</File>
      <filter class="ch.qos.logback.classic.filter.LevelFilter"><!-- 不接受ERROR日志 -->
        <level>ERROR</level>
        <onMatch>DENY</onMatch>
        <onMismatch>NEUTRAL</onMismatch>
      </filter>
      <filter class="ch.qos.logback.classic.filter.LevelFilter"><!-- 不接受DEBUG日志 -->
        <level>DEBUG</level>
        <onMatch>DENY</onMatch>
        <onMismatch>NEUTRAL</onMismatch>
      </filter>
      <encoder>
        <pattern>${FILE_LOG_PATTERN}</pattern>
        <charset>UTF-8</charset>
      </encoder>
      <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
        <!-- 按天回滚 daily -->
        <fileNamePattern>${log.base}/log/log-%d{yyyy-MM-dd}.%i.log</fileNamePattern>
        <!-- 日志最大的历史 30天 -->
        <maxHistory>30</maxHistory>
        <!--日志文件在大于100MB时会自动生成另一个文件-->
        <TimeBasedFileNamingAndTriggeringPolicy class="ch.qos.logback.core.rolling.SizeAndTimeBasedFNATP">
          <maxFileSize>100MB</maxFileSize>
        </TimeBasedFileNamingAndTriggeringPolicy>
      </rollingPolicy>
    </appender>
    <!--==================写入文件==================-->

    <!--==================异常日志==================-->
    <appender name="errorFile" class="ch.qos.logback.core.rolling.RollingFileAppender">
      <file>${log.base}/error/error.log</file>
      <!-- 只打印错误日志 -->
      <filter class="ch.qos.logback.classic.filter.LevelFilter">
        <level>ERROR</level>
        <onMatch>ACCEPT</onMatch>
        <onMismatch>DENY</onMismatch>
      </filter>
      <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
        <fileNamePattern>${log.base}/error/error-%d{yyyy-MM-dd}.%i.log</fileNamePattern>
        <maxHistory>30</maxHistory>
        <TimeBasedFileNamingAndTriggeringPolicy class="ch.qos.logback.core.rolling.SizeAndTimeBasedFNATP">
          <maxFileSize>100MB</maxFileSize>
        </TimeBasedFileNamingAndTriggeringPolicy>
      </rollingPolicy>
      <encoder>
        <pattern>${FILE_LOG_PATTERN}</pattern>
        <charset>UTF-8</charset>
      </encoder>
    </appender>
    <!--==================异常日志==================-->
  </springProfile>

  <springProfile name="dev">
    <!--==================控制台==================-->
    <appender name="stdout" class="ch.qos.logback.core.ConsoleAppender">
      <encoder>
        <pattern>${CONSOLE_LOG_PATTERN}</pattern>
      </encoder>
    </appender>
    <!--==================控制台==================-->
  </springProfile>

  <springProfile name="prod">
    <root level="INFO">
      <appender-ref ref="logFile"/>
      <appender-ref ref="errorFile"/>
    </root>
  </springProfile>

  <springProfile name="dev">
    <logger name="com.zengdw" level="debug" />
    <root level="INFO">
      <appender-ref ref="stdout"/>
    </root>
  </springProfile>
</configuration>
```

