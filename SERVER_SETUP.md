# 服务器部署说明

## 概述

本系统已更新为使用 Node.js + Express 后端，上传的游戏压缩包会直接解压到服务器的 `game_assets/` 目录中。

## 安装步骤

### 1. 安装 Node.js

确保系统已安装 Node.js (建议版本 14.x 或更高)。

检查是否已安装：
```bash
node --version
npm --version
```

### 2. 安装依赖

在项目根目录执行：
```bash
npm install
```

这将安装以下依赖包：
- `express` - Web 服务器框架
- `multer` - 文件上传中间件
- `adm-zip` - ZIP 文件解压库
- `cors` - 跨域资源共享支持

### 3. 启动服务器

```bash
npm start
```

或者使用开发模式（自动重启）：
```bash
npm run dev
```

服务器将在 `http://localhost:3000` 启动。

## API 接口

### 1. 上传游戏
- **路径**: `POST /api/upload-game`
- **参数**: 
  - `gameName` (string) - 游戏名称（仅允许字母、数字、下划线）
  - `zipFile` (file) - ZIP 压缩包文件
- **返回**: 上传结果

### 2. 获取游戏列表
- **路径**: `GET /api/games`
- **返回**: 所有已上传的游戏列表

### 3. 删除游戏
- **路径**: `DELETE /api/games/:gameName`
- **返回**: 删除结果

### 4. 检查游戏是否存在
- **路径**: `GET /api/games/:gameName/check`
- **返回**: `{ exists: boolean }`

## 目录结构

```
project/
├── server.js              # Express 服务器
├── package.json          # 项目配置
├── game_assets/          # 游戏资源目录
│   ├── sample/          # 预设游戏（苏州双塔）
│   │   ├── game_script.json
│   │   └── assets/
│   │       ├── bg/
│   │       └── npc/
│   ├── [上传的游戏]/     # 用户上传的游戏会解压到这里
│   │   ├── game_script.json
│   │   └── assets/
│   │       ├── bg/
│   │       └── npc/
│   └── games.json       # 游戏列表信息
├── temp_uploads/         # 临时上传目录（自动创建）
├── scripts/             # 前端脚本
├── styles/              # 样式文件
└── *.html               # HTML 页面
```

## 游戏资源包格式

上传的 ZIP 压缩包应包含：

```
game.zip
├── game_script.json     # 必需：游戏脚本
└── assets/              # 资源目录
    ├── bg/              # 可选：背景图片目录
    │   ├── scene1.png
    │   └── ...
    └── npc/             # 可选：NPC 立绘目录
        ├── character1.png
        └── ...
```

## 注意事项

1. **游戏名称限制**：只能包含英文字母、数字和下划线
2. **文件大小限制**：默认最大 100MB
3. **必需文件**：ZIP 包必须包含 `game_script.json`
4. **端口配置**：默认使用 3000 端口，可在 `server.js` 中修改

## 访问地址

启动服务器后访问：
- 游戏上传页面: `http://localhost:3000/index.html`
- 游戏页面: `http://localhost:3000/game.html?site=游戏名称`

## 故障排除

### 1. 端口被占用
如果 3000 端口被占用，修改 `server.js` 中的 PORT 常量：
```javascript
const PORT = 3000; // 改为其他端口号
```

### 2. 文件上传失败
- 检查 `temp_uploads/` 目录权限
- 检查文件大小是否超过限制
- 确认 ZIP 文件格式正确

### 3. 游戏加载失败
- 确认 `game_assets/` 目录权限
- 检查浏览器控制台的错误信息
- 验证 `game_script.json` 格式是否正确
