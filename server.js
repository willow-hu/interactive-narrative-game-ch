const express = require('express');
const multer = require('multer');
const AdmZip = require('adm-zip');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // 提供静态文件服务

// 配置 multer 用于文件上传
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const tempDir = path.join(__dirname, 'temp_uploads');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        cb(null, tempDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (path.extname(file.originalname).toLowerCase() === '.zip') {
            cb(null, true);
        } else {
            cb(new Error('只支持 .zip 文件'));
        }
    },
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB 限制
    }
});

/**
 * 上传并解压游戏资源
 */
app.post('/api/upload-game', upload.single('zipFile'), (req, res) => {
    try {
        const { gameName } = req.body;
        
        if (!gameName) {
            return res.status(400).json({ error: '缺少游戏名称' });
        }
        
        // 验证游戏名称格式
        if (!/^[a-zA-Z0-9_]+$/.test(gameName)) {
            return res.status(400).json({ error: '游戏名称只能包含英文字母、数字和下划线' });
        }
        
        if (!req.file) {
            return res.status(400).json({ error: '未上传文件' });
        }
        
        // 目标目录
        const targetDir = path.join(__dirname, 'game_assets', gameName);
        
        // 如果目录已存在，先删除
        if (fs.existsSync(targetDir)) {
            fs.rmSync(targetDir, { recursive: true, force: true });
        }
        
        // 创建目标目录
        fs.mkdirSync(targetDir, { recursive: true });
        
        // 解压 ZIP 文件
        const zip = new AdmZip(req.file.path);
        const zipEntries = zip.getEntries();
        
        // 验证必需的文件
        const hasGameScript = zipEntries.some(entry => 
            entry.entryName === 'game_script.json' || entry.entryName.endsWith('/game_script.json')
        );
        
        if (!hasGameScript) {
            // 清理文件
            fs.unlinkSync(req.file.path);
            fs.rmSync(targetDir, { recursive: true, force: true });
            return res.status(400).json({ error: 'ZIP 文件中缺少 game_script.json' });
        }
        
        // 解压所有文件到目标目录
        zip.extractAllTo(targetDir, true);
        
        // 删除临时上传的 ZIP 文件
        fs.unlinkSync(req.file.path);
        
        // 保存游戏信息
        saveGameInfo(gameName);
        
        res.json({
            success: true,
            message: '游戏上传成功',
            gameName: gameName,
            targetPath: targetDir
        });
        
    } catch (error) {
        console.error('上传失败:', error);
        
        // 清理临时文件
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        
        res.status(500).json({ error: '上传失败: ' + error.message });
    }
});

/**
 * 获取游戏列表
 */
app.get('/api/games', (req, res) => {
    try {
        const games = getGameList();
        res.json({ games });
    } catch (error) {
        console.error('获取游戏列表失败:', error);
        res.status(500).json({ error: '获取游戏列表失败' });
    }
});

/**
 * 删除游戏
 */
app.delete('/api/games/:gameName', (req, res) => {
    try {
        const { gameName } = req.params;
        
        // 验证游戏名称
        if (!/^[a-zA-Z0-9_]+$/.test(gameName)) {
            return res.status(400).json({ error: '无效的游戏名称' });
        }
        
        const gameDir = path.join(__dirname, 'game_assets', gameName);
        
        // 检查目录是否存在
        if (!fs.existsSync(gameDir)) {
            return res.status(404).json({ error: '游戏不存在' });
        }
        
        // 删除游戏目录
        fs.rmSync(gameDir, { recursive: true, force: true });
        
        // 更新游戏列表
        removeGameInfo(gameName);
        
        res.json({ success: true, message: '游戏删除成功' });
        
    } catch (error) {
        console.error('删除游戏失败:', error);
        res.status(500).json({ error: '删除游戏失败: ' + error.message });
    }
});

/**
 * 检查游戏是否存在
 */
app.get('/api/games/:gameName/check', (req, res) => {
    try {
        const { gameName } = req.params;
        const gameDir = path.join(__dirname, 'game_assets', gameName);
        const exists = fs.existsSync(gameDir);
        
        res.json({ exists });
    } catch (error) {
        res.status(500).json({ error: '检查失败' });
    }
});

/**
 * 保存游戏信息到 JSON 文件
 */
function saveGameInfo(gameName) {
    const gamesFile = path.join(__dirname, 'game_assets', 'games.json');
    let games = [];
    
    if (fs.existsSync(gamesFile)) {
        const content = fs.readFileSync(gamesFile, 'utf-8');
        games = JSON.parse(content);
    }
    
    // 检查是否已存在
    const existingIndex = games.findIndex(g => g.name === gameName);
    
    const gameInfo = {
        name: gameName,
        displayName: gameName,
        createTime: new Date().toLocaleString('zh-CN'),
        updateTime: new Date().toLocaleString('zh-CN')
    };
    
    if (existingIndex >= 0) {
        games[existingIndex] = gameInfo;
    } else {
        games.push(gameInfo);
    }
    
    fs.writeFileSync(gamesFile, JSON.stringify(games, null, 2));
}

/**
 * 从游戏信息文件中移除游戏
 */
function removeGameInfo(gameName) {
    const gamesFile = path.join(__dirname, 'game_assets', 'games.json');
    
    if (fs.existsSync(gamesFile)) {
        const content = fs.readFileSync(gamesFile, 'utf-8');
        let games = JSON.parse(content);
        games = games.filter(g => g.name !== gameName);
        fs.writeFileSync(gamesFile, JSON.stringify(games, null, 2));
    }
}

/**
 * 获取游戏列表
 */
function getGameList() {
    const gamesFile = path.join(__dirname, 'game_assets', 'games.json');
    
    if (fs.existsSync(gamesFile)) {
        const content = fs.readFileSync(gamesFile, 'utf-8');
        return JSON.parse(content);
    }
    
    return [];
}

// 启动服务器
app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
    console.log(`游戏上传页面: http://localhost:${PORT}/index.html`);
});
