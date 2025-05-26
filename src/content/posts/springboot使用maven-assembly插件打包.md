---
title: springboot使用maven assembly插件打包
published: 2020-08-10
description: ''
tags:
  - maven
  - assembly
  - springboot
category: java
draft: false
---

### 1、pom.xml添加assembly插件

```xml
<!-- 指定启动类，将依赖打成外部jar包 -->
<!-- 这个也可以使用springboot默认的打包插件，不过最终依赖都在一个jar包里 -->
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-jar-plugin</artifactId>
    <version>3.2.0</version>
    <configuration>
        <archive>
            <!-- 生成的jar中，不要包含pom.xml和pom.properties这两个文件 -->
            <addMavenDescriptor>false</addMavenDescriptor>
            <manifest>
                <!-- 是否要把第三方jar加入到类构建路径 -->
                <addClasspath>true</addClasspath>
                <!-- 外部依赖jar包的最终位置 -->
                <!-- 因为我们将第三方jar和本项目jar放在同一个目录下，这里就使用./ -->
                <classpathPrefix>./</classpathPrefix>
                <!-- 项目启动类 -->
                <mainClass>com.zengdw.assembly.AssemblyApplication</mainClass>
            </manifest>
        </archive>
    </configuration>
</plugin>
<!-- assembly打包插件 -->
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-assembly-plugin</artifactId>
    <version>3.3.0</version>
    <executions>
        <execution>
            <id>make-assebly</id>
            <!-- 绑定到maven操作类型上 -->
            <phase>package</phase>
            <!-- 运行一次 -->
            <goals>
                <goal>single</goal>
            </goals>
            <configuration>
                <!-- 指定最后tar或者zip包的名字 -->
                <finalName>${project.name}-${project.version}</finalName>
                <!-- tar或者zip包的输出目录 -->
                <!-- ./ 是指当前项目的根目录 -->
                <outputDirectory>./target</outputDirectory>
                <!-- 打包后的包名是否包含assembly的id名 -->
                <appendAssemblyId>false</appendAssemblyId>
                <descriptors>
                    <!-- 具体的配置文件位置 -->
                    <descriptor>src/main/assembly/assembly.xml</descriptor>
                </descriptors>
            </configuration>
        </execution>
    </executions>
</plugin>
```

### 2、assembly.xml配置文件

```xml
<assembly>
    <!--
        必须写，否则打包时会有 assembly ID must be present and non-empty 错误
        如果pom.xml assembly插件配置的appendAssemblyId=true这个名字最终会追加到打包的名字的末尾，
		如项目的名字为 hangge-test-0.0.1-SNAPSHOT,
        则最终生成的包名为 hangge-test-0.0.1-SNAPSHOT-bin.zip
     -->
    <id>bin</id>
    <!-- 打包的类型，如果有N个，将会打N个类型的包 -->
    <formats>
        <!--<format>tar.gz</format>-->
        <format>zip</format>
    </formats>
    <!-- 禁止在归档文件中创建根目录的分发目录 -->
    <includeBaseDirectory>false</includeBaseDirectory>

    <!--第三方依赖设置-->
    <!-- 如果使用的是springboot默认的打包插件就不要配置这个了 -->
    <dependencySets>
        <dependencySet>
            <!-- 不使用项目的artifact，第三方jar不要解压，打包进zip文件的lib目录 -->
            <useProjectArtifact>false</useProjectArtifact>
            <outputDirectory>lib</outputDirectory>
            <unpack>false</unpack>
        </dependencySet>
    </dependencySets>

    <!--文件设置-->
    <fileSets>
        <!--
            0755->即用户具有读/写/执行权限，组用户和其它用户具有读写权限；
            0644->即用户具有读写权限，组用户和其它用户具有只读权限；
        -->
        <!-- 将src/main/assembly/bin目录下的所有文件输出到打包后的bin目录中 -->
        <fileSet>
            <directory>src/main/assembly/bin</directory>
            <outputDirectory>bin</outputDirectory>
            <fileMode>0755</fileMode>
            <!--如果是脚本，一定要改为unix.如果是在windows上面编码，会出现dos编写问题-->
            <lineEnding>unix</lineEnding>
            <!-- 是否进行属性替换 -->
            <filtered>true</filtered>
        </fileSet>
        <!-- 将src/main/assembly/config目录下的所有文件输出到打包后的config目录中 -->
        <fileSet>
            <directory>src/main/assembly/config</directory>
            <outputDirectory>config</outputDirectory>
            <fileMode>0644</fileMode>
        </fileSet>
        <!-- 将src/main/resources下配置文件打包到config目录 -->
        <fileSet>
            <directory>src/main/resources</directory>
            <outputDirectory>config</outputDirectory>
            <includes>
                <include>**/*.xml</include>
                <include>**/*.properties</include>
                <include>**/*.yml</include>
            </includes>
            <!-- 是否进行属性替换 -->
            <filtered>true</filtered>
        </fileSet>
        <!-- 将项目启动jar打包到lib目录中 -->
        <fileSet>
            <directory>target</directory>
            <outputDirectory>lib</outputDirectory>
            <includes>
                <include>*.jar</include>
            </includes>
        </fileSet>
        <!-- 将项目说明文档打包到docs目录中 -->
        <fileSet>
            <directory>src/main/docs</directory>
            <outputDirectory>docs</outputDirectory>
            <includes>
                <include>*.md</include>
            </includes>
            <fileMode>0644</fileMode>
        </fileSet>
    </fileSets>
</assembly>
```

### 3、启动文件 

#### 3.1 start.bat

```bash
echo off

set APP_NAME=${project.build.finalName}.jar
set LOG_IMPL_FILE=logback-spring.xml
set LOGGING_CONFIG=
if exist ../config/%LOG_IMPL_FILE% (
    set LOGGING_CONFIG=-Dlogging.config=../config/%LOG_IMPL_FILE%
)
set CONFIG= -Dlogging.path=../logs %LOGGING_CONFIG% -Dspring.config.location=../config/

echo "Starting the %APP_NAME%"
java -Xms512m -Xmx512m %CONFIG% -jar ../lib/%APP_NAME%
echo "java -Xms512m -Xmx512m %CONFIG% -jar ../lib/%APP_NAME%"
goto end

:end
pause
```

#### 3.2 start.sh

```bash
#!/bin/bash

# 项目名称
SERVER_NAME="${project.artifactId}"

# jar名称
JAR_NAME="${project.build.finalName}.jar"

# 进入bin目录
cd `dirname $0`
# bin目录绝对路径
BIN_DIR=`pwd`
# 返回到上一级项目根目录路径
cd ..
# 打印项目根目录绝对路径
# `pwd` 执行系统命令并获得结果
DEPLOY_DIR=`pwd`

# 外部配置文件绝对目录,如果是目录需要/结尾，也可以直接指定文件
# 如果指定的是目录,spring则会读取目录中的所有配置文件
CONF_DIR=$DEPLOY_DIR/config

PIDS=`ps -f | grep "$JAR_NAME" | grep -v grep |awk '{print $2}'`
if [ "$1" = "status" ]; then
    if [ -n "$PIDS" ]; then
        echo "The $SERVER_NAME is running...!"
        echo "PID: $PIDS"
        exit 0
    else
        echo "The $SERVER_NAME is stopped"
        exit 0
    fi
fi

if [ -n "$PIDS" ]; then
    echo "ERROR: The $SERVER_NAME already started!"
    echo "PID: $PIDS"
    exit 1
fi

# 项目日志输出绝对路径
LOGS_DIR=$DEPLOY_DIR/logs
# 如果logs文件夹不存在,则创建文件夹
if [ ! -d $LOGS_DIR ]; then
    mkdir $LOGS_DIR
fi
STDOUT_FILE=$LOGS_DIR/catalina.log

# 加载外部log4j2文件的配置
LOG_IMPL_FILE=logback-spring.xml
LOGGING_CONFIG=""
if [ -f "$CONF_DIR/$LOG_IMPL_FILE" ]
then
    LOGGING_CONFIG="-Dlogging.config=$CONF_DIR/$LOG_IMPL_FILE"
fi
CONFIG_FILES=" -Dlogging.path=$LOGS_DIR $LOGGING_CONFIG -Dspring.config.location=$CONF_DIR/ "
echo -e "Starting the $SERVER_NAME ..."
nohup java $CONFIG_FILES -jar $DEPLOY_DIR/lib/$JAR_NAME > $STDOUT_FILE 2>&1 &

COUNT=0
while [ $COUNT -lt 1 ]; do
    echo -e ".\c"
    sleep 1
    COUNT=`ps -f | grep java | grep "$DEPLOY_DIR" | awk '{print $2}' | wc -l`
    if [ $COUNT -gt 0 ]; then
        break
    fi
done


echo -e "\nOK!"
PIDS=`ps -f | grep java | grep "$DEPLOY_DIR" | awk '{print $2}'`
echo "PID: $PIDS"
echo "STDOUT: $STDOUT_FILE"
```

#### 3.3 stop.sh

``` bash
#!/bin/bash

# 项目名称
APPLICATION="${project.artifactId}"

# 项目启动jar包名称
APPLICATION_JAR="${project.build.finalName}.jar"

# 通过项目名称查找到PI，然后kill -9 pid
PID=$(ps -ef | grep "${APPLICATION_JAR}" | grep -v grep | awk '{ print $2 }')
if [[ -z "$PID" ]]
then
    echo ${APPLICATION} is already stopped
else
    echo kill  ${PID}
    kill -15 ${PID}
    echo ${APPLICATION} stopped successfully
fi
```

