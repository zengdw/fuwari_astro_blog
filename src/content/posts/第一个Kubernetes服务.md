---
title: 第一个Kubernetes服务
published: 2021-09-16
description: ''
tags:
  - K8S
category: K8S
draft: false
---

# 第一个Kubernetes服务

## 创建 Deployment

nginx-deployment.yaml

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment # 表示Deployment的名字
  labels:
    app: nginx
spec:
  replicas: 3 # Pod副本个数
  selector: # selector 字段定义 Deployment 如何查找要管理的 Pods
    matchLabels: # 表示匹配labels key=app，value=ngix的Pod
      app: nginx
  template:
    metadata:
      labels: # Pod的标签，要与上面的selector.matchLabels的匹配，Deployment才能管理这个Pod
        app: nginx
    spec:
      containers: # 定义容器镜像
      - name: nginx
        image: nginx:1.14.2
        ports:
        - containerPort: 80
```

1、通过运行以下命令创建 Deployment：

`kubectl apply -f nginx-deployment.yaml --record` 

> **说明：** 你可以设置 `--record` 标志将所执行的命令写入资源注解 `kubernetes.io/change-cause` 中。 这对于以后的检查是有用的。例如，要查看针对每个 Deployment 修订版本所执行过的命令。

2、运行 `kubectl get deployments` 检查 Deployment 是否已创建。如果仍在创建 Deployment， 则输出类似于：

```bash
NAME               READY   UP-TO-DATE   AVAILABLE   AGE
nginx-deployment   0/3     3            0           41s
```

在检查集群中的 Deployment 时，所显示的字段有：

- `NAME` 列出了集群中 Deployment 的名称。
- `READY` 显示应用程序的可用的 *副本* 数。显示的模式是“就绪个数/期望个数”。
- `UP-TO-DATE` 显示为了达到期望状态已经更新的副本数。
- `AVAILABLE` 显示应用可供用户使用的副本数。
- `AGE` 显示应用程序运行的时间。

请注意期望副本数是根据 `.spec.replicas` 字段设置 3。

3、要查看 Deployment 上线状态，运行 `kubectl rollout status deployment/nginx-deployment`。

输出类似于：

```
Waiting for deployment "nginx-deployment" rollout to finish: 0 of 3 updated replicas are available...
```

4、几秒钟后再次运行 `kubectl get deployments`。输出类似于：

```bash
NAME               READY   UP-TO-DATE   AVAILABLE   AGE
nginx-deployment   3/3     3            3           9m18s
```

注意 Deployment 已创建全部三个副本，并且所有副本都是最新的（它们包含最新的 Pod 模板） 并且可用。

5、要查看 Deployment 创建的 ReplicaSet（`rs`），运行 `kubectl get rs`。 输出类似于：

```bash
NAME                          DESIRED   CURRENT   READY   AGE
nginx-deployment-66b6c48dd5   3         3         3       9m58s
```

ReplicaSet 输出中包含以下字段：

- `NAME` 列出名字空间中 ReplicaSet 的名称；
- `DESIRED` 显示应用的期望副本个数，即在创建 Deployment 时所定义的值。 此为期望状态；
- `CURRENT` 显示当前运行状态中的副本个数；
- `READY` 显示应用中有多少副本可以为用户提供服务；
- `AGE` 显示应用已经运行的时间长度。

注意 ReplicaSet 的名称始终被格式化为`[Deployment名称]-[随机字符串]`。 其中的随机字符串是使用 pod-template-hash 作为种子随机生成的。

## 更新Deployment

>**说明：** 仅当 Deployment Pod 模板（即 `.spec.template`）发生改变时，例如模板的标签或容器镜像被更新， 才会触发 Deployment 上线。 其他更新（如对 Deployment 执行扩缩容的操作）不会触发上线动作

1、把`nginx-deployment.yaml`中`spec.containers.image: nginx:1.14.2`改为`spec.containers.image: nginx:1.16.1`

2、重新执行`kubectl apply -f nginx-deployment.yaml --record` 

3、要查看上线状态，运行`kubectl rollout status deployment/nginx-deployment`, 输出类型于:

```bash
Waiting for deployment "nginx-deployment" rollout to finish: 1 out of 3 new replicas have been updated...
Waiting for deployment "nginx-deployment" rollout to finish: 1 out of 3 new replicas have been updated...
Waiting for deployment "nginx-deployment" rollout to finish: 1 out of 3 new replicas have been updated...
Waiting for deployment "nginx-deployment" rollout to finish: 2 out of 3 new replicas have been updated...
Waiting for deployment "nginx-deployment" rollout to finish: 2 out of 3 new replicas have been updated...
Waiting for deployment "nginx-deployment" rollout to finish: 2 out of 3 new replicas have been updated...
Waiting for deployment "nginx-deployment" rollout to finish: 1 old replicas are pending termination...
Waiting for deployment "nginx-deployment" rollout to finish: 1 old replicas are pending termination...
deployment "nginx-deployment" successfully rolled out
```

4、运行 `kubectl get rs` 查看 Deployment 通过创建新的 ReplicaSet 并将其扩容到 3 个副本并将旧 ReplicaSet 缩容到 0 个副本完成了 Pod 的更新操作：

```bash
NAME                          DESIRED   CURRENT   READY   AGE
nginx-deployment-559d658b74   3         3         3       5m41s
nginx-deployment-66b6c48dd5   0         0         0       20m
```

Deployment 可确保在更新时仅关闭一定数量的 Pod。默认情况下，它确保至少所需 Pods 75% 处于运行状态（最大不可用比例为 25%）。

Deployment 还确保仅所创建 Pod 数量只可能比期望 Pods 数高一点点。 默认情况下，它可确保启动的 Pod 个数比期望个数最多多出 25%（最大峰值 25%）。

例如，如果仔细查看上述 Deployment ，将看到它首先创建了一个新的 Pod，然后删除了一些旧的 Pods， 并创建了新的 Pods。它不会杀死老 Pods，直到有足够的数量新的 Pods 已经出现。 在足够数量的旧 Pods 被杀死前并没有创建新 Pods。它确保至少 2 个 Pod 可用，同时 最多总共 4 个 Pod 可用。

5、获取 Deployment 的更多信息，运行`kubectl describe deployments`，输出类型于：

```bash
Name:                   nginx-deployment
Namespace:              default
CreationTimestamp:      Thu, 16 Sep 2021 09:25:41 +0000
Labels:                 app=nginx
Annotations:            deployment.kubernetes.io/revision: 2
                        kubernetes.io/change-cause: kubectl apply --filename=nginx-deployment.yaml --record=true
Selector:               app=nginx
Replicas:               3 desired | 3 updated | 3 total | 3 available | 0 unavailable
StrategyType:           RollingUpdate
MinReadySeconds:        0
RollingUpdateStrategy:  25% max unavailable, 25% max surge
Pod Template:
  Labels:  app=nginx
  Containers:
   nginx:
    Image:        nginx:1.16.1
    Port:         80/TCP
    Host Port:    0/TCP
    Environment:  <none>
    Mounts:       <none>
  Volumes:        <none>
Conditions:
  Type           Status  Reason
  ----           ------  ------
  Available      True    MinimumReplicasAvailable
  Progressing    True    NewReplicaSetAvailable
OldReplicaSets:  <none>
NewReplicaSet:   nginx-deployment-559d658b74 (3/3 replicas created)
Events:
  Type    Reason             Age    From                   Message
  ----    ------             ----   ----                   -------
  Normal  ScalingReplicaSet  21m    deployment-controller  Scaled up replica set nginx-deployment-66b6c48dd5 to 3
  Normal  ScalingReplicaSet  6m45s  deployment-controller  Scaled up replica set nginx-deployment-559d658b74 to 1
  Normal  ScalingReplicaSet  3m36s  deployment-controller  Scaled down replica set nginx-deployment-66b6c48dd5 to 2
  Normal  ScalingReplicaSet  3m36s  deployment-controller  Scaled up replica set nginx-deployment-559d658b74 to 2
  Normal  ScalingReplicaSet  3m34s  deployment-controller  Scaled down replica set nginx-deployment-66b6c48dd5 to 1
  Normal  ScalingReplicaSet  3m34s  deployment-controller  Scaled up replica set nginx-deployment-559d658b74 to 3
  Normal  ScalingReplicaSet  2m6s   deployment-controller  Scaled down replica set nginx-deployment-66b6c48dd5 to 0
```

## 回滚 Deployment

在Deployment不稳定或出现异常时我们需要回滚Deployment。默认情况下，Deployment的所有上线记录都保存在服务器中，以便可以随时回滚。

> **说明：** Deployment 被触发上线时，系统就会创建 Deployment 的新的修订版本。 这意味着仅当 Deployment 的 Pod 模板（`.spec.template`）发生更改时，才会创建新修订版本 -- 例如，模板的标签或容器镜像发生变化。 其他更新，如 Deployment 的扩缩容操作不会创建 Deployment 修订版本。 这是为了方便同时执行手动缩放或自动缩放。 换言之，当你回滚到较早的修订版本时，只有 Deployment 的 Pod 模板部分会被回滚。

- 假设你在更新 Deployment 时犯了一个拼写错误，将镜像名称命名设置为 `nginx:1.161` 而不是 `nginx:1.16.1`：

- 查看所创建的 Pod，你会注意到新 ReplicaSet 所创建的 1 个 Pod 卡顿在镜像拉取循环中。

  ```bash
  watch kubectl get pods
  ######################
  Every 2.0s: kubectl get pods                                                                    ubuntu: Fri Sep 17 02:15:38 2021
  
  NAME                                READY   STATUS             RESTARTS      AGE
  nginx-deployment-559d658b74-5gmdf   1/1     Running            1 (50m ago)   16h
  nginx-deployment-559d658b74-9rv5c   1/1     Running            1 (50m ago)   16h
  nginx-deployment-559d658b74-l7dnt   1/1     Running            1 (50m ago)   16h
  nginx-deployment-66bc5d6c8-lqlrm    0/1     ImagePullBackOff   0             3m14s
  ```

  > **说明：** Deployment 控制器自动停止有问题的上线过程，并停止对新的 ReplicaSet 扩容。 这行为取决于所指定的 rollingUpdate 参数（具体为 `maxUnavailable`）。 默认情况下，Kubernetes 将此值设置为 25%。

- 你可以看到旧的副本有两个（`nginx-deployment-559d658b74` 和 `nginx-deployment-66b6c48dd5`）， 新的副本有 1 个（`nginx-deployment-66bc5d6c8`）：

  ```bash
  kubectl get rs
  ##############
  NAME                          DESIRED   CURRENT   READY   AGE
  nginx-deployment-559d658b74   3         3         3       16h
  nginx-deployment-66b6c48dd5   0         0         0       16h
  nginx-deployment-66bc5d6c8    1         1         0       4m46s
  ```

- 获取 Deployment 描述信息：

  ```bash
  kubectl describe deployment nginx-deployment
  ########################
  Name:                   nginx-deployment
  Namespace:              default
  CreationTimestamp:      Thu, 16 Sep 2021 09:25:41 +0000
  Labels:                 app=nginx
  Annotations:            deployment.kubernetes.io/revision: 3
  Selector:               app=nginx
  Replicas:               3 desired | 1 updated | 4 total | 3 available | 1 unavailable
  StrategyType:           RollingUpdate
  MinReadySeconds:        0
  RollingUpdateStrategy:  25% max unavailable, 25% max surge
  Pod Template:
    Labels:  app=nginx
    Containers:
     nginx:
      Image:        nginx:1.161
      Port:         80/TCP
      Host Port:    0/TCP
      Environment:  <none>
      Mounts:       <none>
    Volumes:        <none>
  Conditions:
    Type           Status  Reason
    ----           ------  ------
    Available      True    MinimumReplicasAvailable
    Progressing    True    ReplicaSetUpdated
  OldReplicaSets:  nginx-deployment-559d658b74 (3/3 replicas created)
  NewReplicaSet:   nginx-deployment-66bc5d6c8 (1/1 replicas created)
  Events:
    Type    Reason             Age    From                   Message
    ----    ------             ----   ----                   -------
    Normal  ScalingReplicaSet  16h    deployment-controller  Scaled up replica set nginx-deployment-66b6c48dd5 to 3
    Normal  ScalingReplicaSet  16h    deployment-controller  Scaled up replica set nginx-deployment-559d658b74 to 1
    Normal  ScalingReplicaSet  16h    deployment-controller  Scaled down replica set nginx-deployment-66b6c48dd5 to 2
    Normal  ScalingReplicaSet  16h    deployment-controller  Scaled up replica set nginx-deployment-559d658b74 to 2
    Normal  ScalingReplicaSet  16h    deployment-controller  Scaled down replica set nginx-deployment-66b6c48dd5 to 1
    Normal  ScalingReplicaSet  16h    deployment-controller  Scaled up replica set nginx-deployment-559d658b74 to 3
    Normal  ScalingReplicaSet  16h    deployment-controller  Scaled down replica set nginx-deployment-66b6c48dd5 to 0
    Normal  ScalingReplicaSet  8m25s  deployment-controller  Scaled up replica set nginx-deployment-66bc5d6c8 to 1
  ```

## 检查 Deployment 上线历史

按照如下步骤检查回滚历史：

1. 首先，检查 Deployment 修订历史：

   ```bash
   kubectl rollout history deployment nginx-deployment
   ##############################
   deployment.apps/nginx-deployment 
   REVISION  CHANGE-CAUSE
   1         <none>
   2         kubectl apply --filename=nginx-deployment.yaml --record=true
   3         kubectl apply --filename=nginx-deployment.yaml --record=true
   ```

2. 要查看修订历史的详细信息，运行：

   ```bash
   kubectl rollout history deployment nginx-deployment --revision=3
   #############################
   deployment.apps/nginx-deployment with revision #3
   Pod Template:
     Labels:	app=nginx
   	pod-template-hash=66bc5d6c8
     Annotations:	kubernetes.io/change-cause: kubectl apply --filename=nginx-deployment.yaml --record=true
     Containers:
      nginx:
       Image:	nginx:1.161
       Port:	80/TCP
       Host Port:	0/TCP
       Environment:	<none>
       Mounts:	<none>
     Volumes:	<none>
   ```

## 回滚到之前的修订版本

按照下面给出的步骤将 Deployment 从当前版本回滚到以前的版本（即版本 2）

1. 撤消当前上线并回滚到以前的修订版本：

   ```bash
   kubectl rollout undo deployment nginx-deployment
   ##################
   deployment.apps/nginx-deployment rolled back
   ```

   或者也可以使用`--to-revision`来回滚到特定版本：

   ``` bash
   kubectl rollout undo deployment nginx-deployment --to-revision=2
   ```

2. 检查回滚是否成功以及 Deployment 是否正在运行，运行：

   ```bash
   kubectl get deployment nginx-deployment
   ###################
   NAME               READY   UP-TO-DATE   AVAILABLE   AGE
   nginx-deployment   3/3     3            3           17h
   ###################
   
   kubectl get rs
   ###################
   NAME                          DESIRED   CURRENT   READY   AGE
   nginx-deployment-559d658b74   3         3         3       16h
   nginx-deployment-66b6c48dd5   0         0         0       17h
   nginx-deployment-66bc5d6c8    0         0         0       23m
   ```

3. 获取 Deployment 描述信息：

   ```bash
   kubectl describe deployment nginx-deployment
   ###################
   Name:                   nginx-deployment
   Namespace:              default
   CreationTimestamp:      Thu, 16 Sep 2021 09:25:41 +0000
   Labels:                 app=nginx
   Annotations:            deployment.kubernetes.io/revision: 4
                           kubernetes.io/change-cause: kubectl apply --filename=nginx-deployment.yaml --record=true
   Selector:               app=nginx
   Replicas:               3 desired | 3 updated | 3 total | 3 available | 0 unavailable
   StrategyType:           RollingUpdate
   MinReadySeconds:        0
   RollingUpdateStrategy:  25% max unavailable, 25% max surge
   Pod Template:
     Labels:  app=nginx
     Containers:
      nginx:
       Image:        nginx:1.16.1 # 可以看到版本又回到1.16.1了
       Port:         80/TCP
       Host Port:    0/TCP
       Environment:  <none>
       Mounts:       <none>
     Volumes:        <none>
   Conditions:
     Type           Status  Reason
     ----           ------  ------
     Available      True    MinimumReplicasAvailable
     Progressing    True    NewReplicaSetAvailable
   OldReplicaSets:  <none>
   NewReplicaSet:   nginx-deployment-559d658b74 (3/3 replicas created)
   Events:
     Type    Reason             Age   From                   Message
     ----    ------             ----  ----                   -------
     Normal  ScalingReplicaSet  24m   deployment-controller  Scaled up replica set nginx-deployment-66bc5d6c8 to 1
     Normal  ScalingReplicaSet  4m6s  deployment-controller  Scaled down replica set nginx-deployment-66bc5d6c8 to 0
   ```

## 集群缩放

你可以使用如下指令缩放 Deployment：

```bash
kubectl scale deployment/nginx-deployment --replicas=4
######################
deployment.apps/nginx-deployment scaled
```

使用命令`kubectl get pod`查看pod个数

```bash
nginx-deployment-559d658b74-2wdd4   1/1     Running   0          8m40s
nginx-deployment-559d658b74-d5sr4   1/1     Running   0          8m41s
nginx-deployment-559d658b74-pss2w   1/1     Running   0          45s
nginx-deployment-559d658b74-tcd7h   1/1     Running   0          8m43s
```

你可以使用下面的命令设置pod的自动缩放，并基于pods的CPU利用率选择要运行的Pods的个数

```bash
kubectl autoscale deployment/nginx-deployment --min=3 --max=10 --cpu-percent=80
#######################
horizontalpodautoscaler.autoscaling/nginx-deployment autoscaled
```

使用`kubectl get hpa`查看自动缩放设置

## 映射服务，让用户可以访问

```bash
kubectl expose deployment nginx-deployment --port=80 --name nginx-service --type=NodePort
```

命令行各参数含义：

- expose deployment：通过deployment暴露服务，后面跟deployment的名称
- --port：指定容器的端口
- --name：服务的名称
- --type：服务的类型：ClusterIP, NodePort, LoadBalancer, or ExternalName，默认是ClusterIP

输出：

```bash
service/nginx-service exposed
```

或者使用`nginx-service.yaml`配置文件创建

```yaml
apiVersion: v1
kind: Service
metadata:
  name: nginx-service
  labels:
    run: ngxin-service
spec:
  selector:
    app: nginx # 指定Pod的label
  type: NodePort
  ports:
  - targetPort: 80 # 容器的端口
    port: 80  

```

执行`kubectl apply -f nginx-service.yaml`创建service

使用`kubectl get svc`查看已暴露的服务

```bash
NAME            TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)        AGE
kubernetes      ClusterIP   10.96.0.1       <none>        443/TCP        18h
# nginx-service 服务已成功发布并将 80 端口映射为 32381
nginx-service   NodePort    10.103.31.252   <none>        80:32381/TCP   6s
```

## 查看服务详情

```bash
kubectl describe service nginx-service
#####################
Name:                     nginx-service
Namespace:                default
Labels:                   app=nginx
Annotations:              <none>
Selector:                 app=nginx
Type:                     NodePort
IP Family Policy:         SingleStack
IP Families:              IPv4
IP:                       10.103.31.252
IPs:                      10.103.31.252
Port:                     <unset>  80/TCP
TargetPort:               80/TCP
NodePort:                 <unset>  32381/TCP
Endpoints:                10.244.1.5:80,10.244.1.6:80,10.244.2.5:80
Session Affinity:         None
External Traffic Policy:  Cluster
Events:                   <none>
```

## 验证是否能访问

通过浏览器访问Master服务器`http://<Master IP>:32381/`

## 停止服务

```bash
kubectl delete service nginx-service

# 输出如下
service "nginx-service" deleted
```

