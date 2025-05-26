---
title: 修改powerDesigner生成mysql关键字默认双引号问题
published: 2020-09-23
description: ''
tags:
  - powerDesigner
  - mysql
category: 工具
draft: false
---

在powerDesigner中设计完数据表后，执行generate database时生成的sql中如果有表的字段是关键字时可能会出现双引号的问题。

![image-20200923105250753](https://blog-img.zengdw.com/修改powerDesigner生成mysql关键字默认双引号问题/image-20200923105250753.png)

只需修改下面这个地方，在生成sql时就是替换为反引号

![image-20200923105447615](https://blog-img.zengdw.com/修改powerDesigner生成mysql关键字默认双引号问题/image-20200923105447615.png)

