# 奥迪4S店经营模拟 - 腾讯云轻量服务器部署手册

## 一、服务器环境准备

### 1. SSH 登录服务器
```bash
ssh root@你的服务器IP
```

### 2. 安装 Node.js（推荐 v22 LTS）
```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo bash -
sudo apt-get install -y nodejs
node -v   # 确认 v22.x
npm -v    # 确认 npm 可用
```

### 3. 安装 PM2（进程守护）
```bash
sudo npm install -g pm2
```

### 4. 安装 Nginx
```bash
sudo apt-get install -y nginx
```

---

## 二、上传代码

在本地电脑执行：
```bash
# 方式1：用 git（推荐）
cd /Users/zhoutong/WorkBuddy/2026-05-07-task-2/audi-dealership-game
git init && git add . && git commit -m "init"
# 推到你的 GitHub/Gitee 仓库后，在服务器上：
git clone https://你的仓库地址.git /opt/audi-game

# 方式2：用 scp 直接传
scp -r /Users/zhoutong/WorkBuddy/2026-05-07-task-2/audi-dealership-game root@服务器IP:/opt/audi-game
```

---

## 三、服务器上构建与配置

```bash
cd /opt/audi-game

# 1. 安装前端依赖 & 构建
npm install
npm run build    # 产物在 dist/ 目录

# 2. 安装后端依赖
cd server
npm install

# 3. 配置 .env（关键！）
cp .env.example .env   # 如果有 .env.example
nano .env
```

### .env 内容（填入你的腾讯云密钥）：
```
TENCENT_SECRET_ID=AKIDxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TENCENT_SECRET_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
PORT=3001
```

**获取密钥**：腾讯云控制台 → 访问管理 → API密钥管理 → 新建密钥

---

## 四、启动后端服务

```bash
cd /opt/audi-game/server

# 用 PM2 启动，崩溃自动重启
pm2 start index.js --name "audi-game-api"

# 查看状态
pm2 status

# 查看日志
pm2 logs audi-game-api

# 设置开机自启
pm2 startup
pm2 save
```

---

## 五、配置 Nginx 反向代理

```bash
sudo nano /etc/nginx/sites-available/audi-game
```

粘贴以下内容（把 `你的域名或IP` 替换掉）：

```nginx
server {
    listen 80;
    server_name 你的域名或IP;

    # 前端静态文件
    location / {
        root /opt/audi-game/dist;
        index index.html;
        try_files $uri $uri/ /index.html;  # SPA 路由回退
    }

    # 后端 API 代理
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 30s;  # AI 生成可能较慢
    }
}
```

启用配置：
```bash
sudo ln -s /etc/nginx/sites-available/audi-game /etc/nginx/sites-enabled/
sudo nginx -t          # 检查语法
sudo systemctl reload nginx
```

---

## 六、开放防火墙端口

腾讯云轻量服务器控制台 → 防火墙 → 添加规则：

| 协议 | 端口 | 说明 |
|------|------|------|
| TCP | 80 | HTTP 访问 |
| TCP | 443 | HTTPS（后续加SSL） |
| TCP | 22 | SSH 登录 |

---

## 七、验证

浏览器打开 `http://你的服务器IP`，应该能看到游戏界面。

点"返利考核"tab → 点"免费咨询建议"按钮，如果 AI 返回了毒舌建议，说明后端 + 混元 API 跑通了。

---

## 八、后续优化（可选）

### 配置 HTTPS（推荐）
```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d 你的域名
```

### 更新代码后重新部署
```bash
cd /opt/audi-game
git pull
npm run build
cd server && npm install
pm2 restart audi-game-api
```

---

## 常见问题

**Q: AI 建议返回"网络拥堵"**
A: 检查 server/.env 的密钥是否正确；检查服务器能否访问 hunyuan.tencentcloudapi.com

**Q: 页面空白**
A: 确认 npm run build 成功；检查 Nginx root 指向 /opt/audi-game/dist

**Q: 404 刷新页面报错**
A: Nginx 缺少 `try_files $uri $uri/ /index.html;` 这行
