---
title: Ubuntu20.04 安装 Kubernetes 1.22
published: 2021-09-16
description: ''
tags:
  - K8S
category: K8S
draft: false
---

# Ubuntu20.04 安装 Kubernetes 1.22

## 1、基础条件

- 每台机器 2 GB 或更多的 RAM （如果少于这个数字将会影响你应用的运行内存)
- 2 CPU 核或更多
- 集群中的所有机器的网络彼此均能相互连接
- 节点之中不可以有重复的主机名、MAC 地址或 product_uuid
- 开启机器上的某些端口。请参见[这里](https://kubernetes.io/zh/docs/setup/production-environment/tools/kubeadm/install-kubeadm/#check-required-ports)
- 禁用交换分区。为了保证 kubelet 正常工作

机器信息:

| hostname | master        | node1         | node2         |
| -------- | ------------- | ------------- | ------------- |
| IP       | 192.168.5.200 | 192.168.5.201 | 192.168.5.202 |

## 2、更改iptables 配置

确保 `br_netfilter` 模块被加载。这一操作可以通过运行 `lsmod | grep br_netfilter` 来完成。若要显式加载该模块，可执行 `sudo modprobe br_netfilter`。

为了让你的 Linux 节点上的 iptables 能够正确地查看桥接流量，你需要确保在你的 `sysctl` 配置中将 `net.bridge.bridge-nf-call-iptables` 设置为 1。例如：

```bash
cat <<EOF | sudo tee /etc/modules-load.d/k8s.conf
br_netfilter
EOF

cat <<EOF | sudo tee /etc/sysctl.d/k8s.conf
net.bridge.bridge-nf-call-ip6tables = 1
net.bridge.bridge-nf-call-iptables = 1
EOF

sudo sysctl --system
```

**这一操作要在3台机器上都执行。**

## 3、禁用交换分区

```bash
swapoff -a

vim /etc/fstab 注释掉最后一行
```

## 4、修改hostname

在每个节点上执行`hostnamectl set-hostname 节点名称`

## 5、安装runtime

因为最终pod都是运行在容器中的，所以这里需要安装容器运行时。这里使用Docker容器 ，安装方法看[这里](https://docs.docker.com/engine/install/)。3台机器都安装好后配置docker镜像加速：

```bash
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json <<-'EOF'
{
  "registry-mirrors": ["https://5z8k6du2.mirror.aliyuncs.com"]
}
EOF
sudo systemctl daemon-reload
sudo systemctl restart docker
```

## 6、安装 kubeadm、kubelet 和 kubectl

因为Kubernetes 的资源都在google仓库，所以我们使用阿里的镜像安装

```bash
1.更新 apt 包索引并安装使用 Kubernetes apt 仓库所需要的包
apt update && apt install -y apt-transport-https

2.下载公开签名秘钥
curl https://mirrors.aliyun.com/kubernetes/apt/doc/apt-key.gpg | apt-key add - 

3.添加 Kubernetes apt 仓库
cat <<EOF >/etc/apt/sources.list.d/kubernetes.list
deb https://mirrors.aliyun.com/kubernetes/apt/ kubernetes-xenial main
EOF 

4.更新 apt 包索引，安装 kubelet、kubeadm 和 kubectl，并锁定其版本
apt update
apt install -y kubelet kubeadm kubectl
apt-mark hold kubelet kubeadm kubectl
```

**这一操作要在3台机器上都执行。**

## 7、配置Cgroup 驱动

1.配置 Docker 守护程序，尤其是使用 systemd 来管理容器的 cgroup。

```bash
sudo mkdir /etc/docker
cat <<EOF | sudo tee /etc/docker/daemon.json
{
  "exec-opts": ["native.cgroupdriver=systemd"],
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "100m"
  },
  "storage-driver": "overlay2"
}
EOF
```

2.重新启动 Docker 并在启动时启用

```bash
sudo systemctl enable docker
sudo systemctl daemon-reload
sudo systemctl restart docker
```

## 8、使用kubeadm创建集群

### 8.1 先看下Kubernetes 集群需要哪些镜像

```bash
kubeadm config images list
####################
k8s.gcr.io/kube-apiserver:v1.22.2
k8s.gcr.io/kube-controller-manager:v1.22.2
k8s.gcr.io/kube-scheduler:v1.22.2
k8s.gcr.io/kube-proxy:v1.22.2
k8s.gcr.io/pause:3.5
k8s.gcr.io/etcd:3.5.0-0
k8s.gcr.io/coredns/coredns:v1.8.4
####################
```

发现都在`k8s.gcr.io`这仓库里的，直接下是下不下来的。这里使用阿里的[容器镜像服务](https://cr.console.aliyun.com/cn-hangzhou/instances),先在镜像仓库中构建出我们需要的镜像，再从镜像仓库下到本地重新打tag就能得到所需要的镜像了。直接使用下面这个脚本下载下载需要的镜像。

```bash
docker pull registry.cn-hangzhou.aliyuncs.com/zengdw-k8s/kube-apiserver:v1.22.1
docker pull registry.cn-hangzhou.aliyuncs.com/zengdw-k8s/kube-controller-manager:v1.22.1
docker pull registry.cn-hangzhou.aliyuncs.com/zengdw-k8s/kube-scheduler:v1.22.1
docker pull registry.cn-hangzhou.aliyuncs.com/zengdw-k8s/kube-proxy:v1.22.1
docker pull registry.cn-hangzhou.aliyuncs.com/zengdw-k8s/pause:3.5
docker pull registry.cn-hangzhou.aliyuncs.com/zengdw-k8s/etcd:3.5.0-0
docker pull registry.cn-hangzhou.aliyuncs.com/zengdw-k8s/coredns:v1.8.4


docker tag registry.cn-hangzhou.aliyuncs.com/zengdw-k8s/kube-apiserver:v1.22.1 k8s.gcr.io/kube-apiserver:v1.22.1
docker tag registry.cn-hangzhou.aliyuncs.com/zengdw-k8s/kube-controller-manager:v1.22.1 k8s.gcr.io/kube-controller-manager:v1.22.1
docker tag registry.cn-hangzhou.aliyuncs.com/zengdw-k8s/kube-scheduler:v1.22.1 k8s.gcr.io/kube-scheduler:v1.22.1
docker tag registry.cn-hangzhou.aliyuncs.com/zengdw-k8s/kube-proxy:v1.22.1 k8s.gcr.io/kube-proxy:v1.22.1
docker tag registry.cn-hangzhou.aliyuncs.com/zengdw-k8s/pause:3.5 k8s.gcr.io/pause:3.5
docker tag registry.cn-hangzhou.aliyuncs.com/zengdw-k8s/etcd:3.5.0-0 k8s.gcr.io/etcd:3.5.0-0
docker tag registry.cn-hangzhou.aliyuncs.com/zengdw-k8s/coredns:v1.8.4 k8s.gcr.io/coredns/coredns:v1.8.4


docker rmi registry.cn-hangzhou.aliyuncs.com/zengdw-k8s/kube-apiserver:v1.22.1
docker rmi registry.cn-hangzhou.aliyuncs.com/zengdw-k8s/kube-controller-manager:v1.22.1
docker rmi registry.cn-hangzhou.aliyuncs.com/zengdw-k8s/kube-scheduler:v1.22.1
docker rmi registry.cn-hangzhou.aliyuncs.com/zengdw-k8s/kube-proxy:v1.22.1
docker rmi registry.cn-hangzhou.aliyuncs.com/zengdw-k8s/pause:3.5
docker rmi registry.cn-hangzhou.aliyuncs.com/zengdw-k8s/etcd:3.5.0-0
docker rmi registry.cn-hangzhou.aliyuncs.com/zengdw-k8s/coredns:v1.8.4
```

### 8.2 使用kubeadm init初始化集群

```bash
kubeadm init --pod-network-cidr=10.244.0.0/16 --kubernetes-version=v1.22.1 # 只需要在master节点执行
```

--pod-network-cidr：指定Pod网络插件使用的ip范围，注意Pod 网络不得与任何主机网络重叠。这里使用的是[flannel](https://github.com/flannel-io/flannel#flannel)

只要出现下面的日志就表示成功了：

```bash
Your Kubernetes control-plane has initialized successfully!

To start using your cluster, you need to run the following as a regular user:

  mkdir -p $HOME/.kube
  sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
  sudo chown $(id -u):$(id -g) $HOME/.kube/config

Alternatively, if you are the root user, you can run:

  export KUBECONFIG=/etc/kubernetes/admin.conf

You should now deploy a pod network to the cluster.
Run "kubectl apply -f [podnetwork].yaml" with one of the options listed at:
  https://kubernetes.io/docs/concepts/cluster-administration/addons/

Then you can join any number of worker nodes by running the following on each as root:

kubeadm join 192.168.5.200:6443 --token sg48lm.lnkyzrbek8nb63co \
	--discovery-token-ca-cert-hash sha256:dfe7d3ce8ac56f42862548c3b2290a70f0ffbbf2570789e648097dd0bd0fbc2a
```

非root用户执行：

```bash
mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config
```

root用户执行：

```bash
export KUBECONFIG=/etc/kubernetes/admin.conf
```

查看节点状态

```bash
kubectl get node
###########
NAME     STATUS     ROLES                  AGE   VERSION
ubuntu   NotReady   control-plane,master   24m   v1.22.1
```

可以看到现在节点`STATUS`还是`NotReady`。*ubuntu这个是前面我忘了改master节点的hostname了*

然后安装Pod网络插件，输出日志上也有提示`Run "kubectl apply -f [podnetwork].yaml"`

```bash
kubectl apply -f https://raw.githubusercontent.com/coreos/flannel/master/Documentation/kube-flannel.yml
```

安装好后，等一会就能看到节点状态变成`Ready`了

```bash
kubectl get node
###########
NAME     STATUS   ROLES                  AGE   VERSION
ubuntu   Ready    control-plane,master   25m   v1.22.1
```

在node1，node2上执行`kubeadm join 192.168.5.200:6443 --token sg48lm.lnkyzrbek8nb63co \
	--discovery-token-ca-cert-hash sha256:dfe7d3ce8ac56f42862548c3b2290a70f0ffbbf2570789e648097dd0bd0fbc2a`加入集群。

等一会后，查看node和pod的状态

```bash
kubectl get nodes
###########
NAME     STATUS   ROLES                  AGE     VERSION
node1    Ready    <none>                 4m57s   v1.22.1
node2    Ready    <none>                 4m45s   v1.22.1
ubuntu   Ready    control-plane,master   40m     v1.22.1
###########

kubectl get pod -n kube-system -o wide
###########
NAME                             READY   STATUS    RESTARTS   AGE     IP              NODE     NOMINATED NODE   READINESS GATES
coredns-78fcd69978-nvj8f         1/1     Running   0          40m     10.244.0.2      ubuntu   <none>           <none>
coredns-78fcd69978-vxds6         1/1     Running   0          40m     10.244.0.3      ubuntu   <none>           <none>
etcd-ubuntu                      1/1     Running   0          40m     192.168.5.200   ubuntu   <none>           <none>
kube-apiserver-ubuntu            1/1     Running   0          40m     192.168.5.200   ubuntu   <none>           <none>
kube-controller-manager-ubuntu   1/1     Running   0          40m     192.168.5.200   ubuntu   <none>           <none>
kube-flannel-ds-59m8w            1/1     Running   0          5m30s   192.168.5.201   node1    <none>           <none>
kube-flannel-ds-jcfwn            1/1     Running   0          5m18s   192.168.5.202   node2    <none>           <none>
kube-flannel-ds-qvsn8            1/1     Running   0          16m     192.168.5.200   ubuntu   <none>           <none>
kube-proxy-59zx2                 1/1     Running   0          5m30s   192.168.5.201   node1    <none>           <none>
kube-proxy-6dkwk                 1/1     Running   0          40m     192.168.5.200   ubuntu   <none>           <none>
kube-proxy-knn8c                 1/1     Running   0          5m18s   192.168.5.202   node2    <none>           <none>
kube-scheduler-ubuntu            1/1     Running   0          40m     192.168.5.200   ubuntu   <none>           <none>
###########
```

可以看到全都是Ready/Running状态了，至此我们的Kubernetes 集群就安装好了。
