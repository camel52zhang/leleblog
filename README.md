# leleblog
一个专注于记录技术成长、分享生活瞬间的纯粹空间，一键可部署的blog

预览：https://blog.cnw.ccwu.cc/

![image-20260314171844153](https://storage.7306923.xyz/image-20260314171844153.png)

服务器或者群晖/飞牛OS利用docker compose一键部署，命令如下

~~~
services:
  leleblog-api:
    image: camel52zhang/leleblog-api:latest
    container_name: leleblog-api
    ports:
      - "7070:7070"
    volumes:
      - ./data:/data       # 持久化挂载目录，冒号: 前可自定义
    environment:
      - GIN_MODE=release
      - DB_PATH=/data/leleblog.db
    restart: always
    networks:
      - leleblog-net

  leleblog-web:
    image: camel52zhang/leleblog-web:latest
    container_name: leleblog-web
    ports:
      - "4000:4000"
    depends_on:
      - leleblog-api
    restart: always
    networks:
      - leleblog-net

networks:
  leleblog-net:
    driver: bridge
~~~

## 默认地址

http://yourip:4000

或

http://yourdomain.com:4000

## 后台地址

http://yourip:4000/admin

或

http://yourdomain.com:4000/admin

## 默认用户名/密码：admin/admin

> ***登录后请立即修改密码，修改后的密码注意保存***
