# iOS UDID 获取工具

一个简单高效的 Node.js 网站，帮助用户在没有 Xcode 的情况下快速获取 iPhone/iPad 的 UDID。

## ✨ 功能特点

- 🚀 **一键获取**：通过网页 + 描述文件的方式获取 iOS 设备的 UDID
- 📱 **无需工具**：无需 Xcode、iTunes 或其他复杂工具
- 🎯 **智能界面**：单页面设计，自动切换下载和结果显示
- 📋 **一键复制**：支持 UDID 一键复制到剪贴板
- 📊 **设备信息**：显示设备型号、系统版本和获取时间
- 🔒 **隐私安全**：不收集、不存储用户任何信息
- 📱 **响应式**：完美适配手机和桌面端

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/your-username/udid-server.git
cd udid-server
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置域名

编辑 `server.js` 文件，将第 9 行的 `DOMAIN` 修改为你的服务器域名或公网 IP：

```js
const DOMAIN = 'https://your-domain.com'; // 修改为你的域名或IP
```

⚠️ **重要提示**：
- 必须使用 HTTPS，iOS 只信任 HTTPS 回调
- 如果使用 IP 地址，需要有效的 SSL 证书
- 推荐使用域名 + Let's Encrypt 证书

### 4. 启动服务

**开发环境：**
```bash
npm start
# 或
node server.js
```

**生产环境（推荐使用 PM2）：**
```bash
# 安装 PM2
npm install -g pm2

# 启动服务
pm2 start server.js --name udid-server

# 查看状态
pm2 status

# 查看日志
pm2 logs udid-server
```

服务将在 3000 端口启动。

## 📱 使用方法

### 用户操作步骤：

1. **打开网站**：用 iPhone/iPad 的 Safari 浏览器打开你的网站
2. **点击按钮**：点击"获取 UDID"按钮下载描述文件
3. **安装描述文件**：
   - 系统会提示"此网站正尝试下载一个配置描述文件"
   - 点击"允许"
   - 前往"设置" → "通用" → "VPN与设备管理"
   - 点击下载的描述文件，选择"安装"
4. **查看结果**：安装完成后会自动跳转回网页并显示 UDID
5. **复制 UDID**：点击"复制UDID"按钮一键复制到剪贴板

### 管理员操作：

```bash
# 查看实时日志
pm2 logs udid-server --lines 50

# 重启服务
pm2 restart udid-server

# 停止服务
pm2 stop udid-server

# 删除服务
pm2 delete udid-server
```

## 🔧 部署配置

### Nginx 反向代理配置

```nginx
server {
    listen 80;
    listen 443 ssl;
    server_name your-domain.com;
    
    # SSL 配置
    ssl_certificate /path/to/your/cert.pem;
    ssl_certificate_key /path/to/your/key.pem;
    
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 确保转发 POST body
        proxy_pass_request_body on;
        proxy_pass_request_headers on;
        client_max_body_size 10m;
    }
}
```

### 防火墙配置

```bash
# 开放端口（如果使用 ufw）
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 3000  # 如果直接访问 Node.js
```

## ⚠️ 注意事项

### 必要条件：
- ✅ 必须使用 **Safari 浏览器**，其他浏览器无法安装描述文件
- ✅ 必须使用 **HTTPS**，iOS 不信任 HTTP 回调
- ✅ 服务器必须有**有效的 SSL 证书**
- ✅ 设备和服务器网络必须**互通**

### 常见问题：
- 📱 **安装失败**：检查是否使用 Safari 浏览器
- 🔒 **证书错误**：确保 SSL 证书有效且域名匹配
- 🌐 **网络问题**：确保设备能访问服务器地址
- 📋 **复制失败**：在不支持的浏览器中会提示手动选择复制

### 安全建议：
- 🔐 使用强密码保护服务器
- 🛡️ 定期更新依赖包
- 📊 监控服务器日志
- 🚫 不要在生产环境暴露调试信息

## 🔍 技术原理

1. **生成描述文件**：服务器生成包含回调地址的 iOS 描述文件（mobileconfig）
2. **设备安装**：用户在 iOS 设备上安装描述文件
3. **系统回调**：iOS 系统自动向回调地址发送包含 UDID 的 POST 请求
4. **解析数据**：服务器解析 PKCS#7 签名数据，提取设备信息
5. **重定向显示**：301 重定向到结果页面，展示 UDID 信息

## 📁 项目结构

```
udid-server/
├── public/
│   └── index.html      # 智能前端页面（下载+结果显示）
├── server.js           # 服务器主文件
├── package.json        # 项目配置和依赖
├── package-lock.json   # 依赖锁定文件
└── README.md          # 项目说明文档
```

## 🛠️ 开发说明

### 依赖包：
- `express` - Web 框架
- `body-parser` - 请求体解析
- `uuid` - 生成唯一标识符

### API 接口：
- `GET /` - 主页面（智能显示下载或结果）
- `GET /get-udid` - 生成并下载 mobileconfig 文件
- `POST /callback` - 处理 iOS 回调，解析设备信息

### 数据流：
```
用户访问 → 下载描述文件 → iOS 安装 → 系统回调 → 解析数据 → 重定向显示
```

## 📄 许可证

MIT License - 详见 LICENSE 文件

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

**⭐ 如果这个项目对你有帮助，请给个 Star 支持一下！**