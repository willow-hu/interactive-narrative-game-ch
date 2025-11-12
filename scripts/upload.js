/**
 * 上传管理器
 * 处理游戏资源上传和解压
 */

class UploadManager {
    constructor() {
        this.gameNameInput = document.getElementById('gameName');
        this.zipFileInput = document.getElementById('zipFile');
        this.uploadButton = document.getElementById('uploadButton');
        this.uploadArea = document.getElementById('uploadArea');
        this.progressArea = document.getElementById('progressArea');
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        this.errorMessage = document.getElementById('errorMessage');
        this.gameList = document.getElementById('gameList');
        this.existingGames = document.getElementById('existingGames');
        
        this.bindEvents();
        this.loadExistingGames();
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 监听输入变化以启用/禁用上传按钮
        this.gameNameInput.addEventListener('input', () => this.validateForm());
        this.zipFileInput.addEventListener('change', () => this.validateForm());
        
        // 上传按钮点击
        this.uploadButton.addEventListener('click', () => this.handleUpload());
    }

    /**
     * 验证表单
     */
    validateForm() {
        const gameName = this.gameNameInput.value.trim();
        const hasFile = this.zipFileInput.files.length > 0;
        
        // 验证游戏名称（只允许英文字母、数字和下划线）
        const validName = /^[a-zA-Z0-9_]+$/.test(gameName);
        
        this.uploadButton.disabled = !(validName && hasFile);
    }

    /**
     * 加载已存在的游戏
     */
    loadExistingGames() {
        const games = this.getStoredGames();
        
        if (games.length > 0) {
            this.gameList.style.display = 'block';
            this.existingGames.innerHTML = '';
            
            games.forEach(game => {
                const gameItem = document.createElement('div');
                gameItem.className = 'game-item';
                
                gameItem.innerHTML = `
                    <div class="game-info">
                        <div class="game-name">${game.displayName || game.name}</div>
                        <div class="game-meta">创建时间: ${game.createTime}</div>
                    </div>
                    <div class="game-actions">
                        <button class="game-button play-button" onclick="uploadManager.playGame('${game.name}')">开始游戏</button>
                        <button class="game-button delete-button" onclick="uploadManager.deleteGame('${game.name}')">删除</button>
                    </div>
                `;
                
                this.existingGames.appendChild(gameItem);
            });
        }
    }

    /**
     * 获取存储的游戏列表
     */
    getStoredGames() {
        const gamesJson = localStorage.getItem('uploadedGames');
        return gamesJson ? JSON.parse(gamesJson) : [];
    }

    /**
     * 保存游戏到存储
     */
    saveGame(gameName, displayName) {
        const games = this.getStoredGames();
        
        // 检查是否已存在
        const existingIndex = games.findIndex(g => g.name === gameName);
        
        const gameInfo = {
            name: gameName,
            displayName: displayName || gameName,
            createTime: new Date().toLocaleString('zh-CN')
        };
        
        if (existingIndex >= 0) {
            games[existingIndex] = gameInfo;
        } else {
            games.push(gameInfo);
        }
        
        localStorage.setItem('uploadedGames', JSON.stringify(games));
    }

    /**
     * 处理上传
     */
    async handleUpload() {
        const gameName = this.gameNameInput.value.trim();
        const file = this.zipFileInput.files[0];
        
        if (!gameName || !file) {
            this.showError('请填写游戏名称并选择文件');
            return;
        }

        try {
            this.showProgress('正在读取文件...');
            
            // 读取ZIP文件
            const zip = await JSZip.loadAsync(file);
            
            this.updateProgress(30, '正在验证文件结构...');
            
            // 验证必需的文件
            if (!zip.file('game_script.json')) {
                throw new Error('ZIP文件中缺少game_script.json文件');
            }
            
            this.updateProgress(50, '正在保存游戏资源...');
            
            // 保存文件到localStorage（使用base64编码）
            await this.saveGameFiles(gameName, zip);
            
            this.updateProgress(80, '正在保存游戏信息...');
            
            // 保存游戏信息
            this.saveGame(gameName, gameName);
            
            this.updateProgress(100, '上传完成！');
            
            // 延迟后跳转
            setTimeout(() => {
                this.playGame(gameName);
            }, 500);
            
        } catch (error) {
            console.error('上传失败:', error);
            this.showError('上传失败: ' + error.message);
            this.hideProgress();
        }
    }

    /**
     * 保存游戏文件
     */
    async saveGameFiles(gameName, zip) {
        const gameData = {};
        
        // 遍历ZIP中的所有文件
        const promises = [];
        zip.forEach((relativePath, zipEntry) => {
            if (!zipEntry.dir) {
                promises.push(
                    zipEntry.async('base64').then(content => {
                        gameData[relativePath] = content;
                    })
                );
            }
        });
        
        await Promise.all(promises);
        
        // 保存到localStorage
        localStorage.setItem(`game_${gameName}`, JSON.stringify(gameData));
    }

    /**
     * 开始游戏
     */
    playGame(gameName) {
        // 跳转到游戏页面，传递游戏名称
        window.location.href = `game.html?site=${gameName}`;
    }

    /**
     * 删除游戏
     */
    deleteGame(gameName) {
        if (!confirm(`确定要删除游戏"${gameName}"吗？`)) {
            return;
        }
        
        // 从localStorage删除游戏数据
        localStorage.removeItem(`game_${gameName}`);
        
        // 从游戏列表中移除
        const games = this.getStoredGames();
        const filteredGames = games.filter(g => g.name !== gameName);
        localStorage.setItem('uploadedGames', JSON.stringify(filteredGames));
        
        // 重新加载游戏列表
        this.loadExistingGames();
    }

    /**
     * 显示进度
     */
    showProgress(text) {
        this.uploadArea.style.display = 'none';
        this.progressArea.style.display = 'block';
        this.progressText.textContent = text;
        this.progressFill.style.width = '0%';
        this.hideError();
    }

    /**
     * 更新进度
     */
    updateProgress(percent, text) {
        this.progressFill.style.width = percent + '%';
        if (text) {
            this.progressText.textContent = text;
        }
    }

    /**
     * 隐藏进度
     */
    hideProgress() {
        this.progressArea.style.display = 'none';
        this.uploadArea.style.display = 'block';
    }

    /**
     * 显示错误
     */
    showError(message) {
        this.errorMessage.textContent = message;
        this.errorMessage.style.display = 'block';
    }

    /**
     * 隐藏错误
     */
    hideError() {
        this.errorMessage.style.display = 'none';
    }
}

// 初始化上传管理器
let uploadManager;
document.addEventListener('DOMContentLoaded', () => {
    uploadManager = new UploadManager();
});
