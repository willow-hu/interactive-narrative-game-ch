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
        
        this.db = null;
        this.DB_NAME = 'GameStorage';
        this.DB_VERSION = 1;
        this.STORE_NAME = 'gameFiles';
        
        this.initDB().then(() => {
            this.bindEvents();
            this.loadExistingGames();
        });
    }

    /**
     * 初始化 IndexedDB
     */
    async initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
            
            request.onerror = () => {
                console.error('IndexedDB打开失败:', request.error);
                reject(request.error);
            };
            
            request.onsuccess = () => {
                this.db = request.result;
                console.log('IndexedDB初始化成功');
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // 创建对象存储（如果不存在）
                if (!db.objectStoreNames.contains(this.STORE_NAME)) {
                    const objectStore = db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
                    objectStore.createIndex('gameName', 'gameName', { unique: false });
                    console.log('创建对象存储:', this.STORE_NAME);
                }
            };
        });
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

        // 检查游戏名是否已存在
        const games = this.getStoredGames();
        if (games.some(g => g.name === gameName)) {
            this.showError('游戏名已存在，请使用其他名称');
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
     * 保存游戏文件到 IndexedDB
     */
    async saveGameFiles(gameName, zip) {
        const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
        const objectStore = transaction.objectStore(this.STORE_NAME);
        
        // 遍历ZIP中的所有文件
        const promises = [];
        let fileCount = 0;
        
        zip.forEach((relativePath, zipEntry) => {
            if (!zipEntry.dir) {
                fileCount++;
                promises.push(
                    zipEntry.async('blob').then(blob => {
                        // 存储为独立的记录
                        const fileData = {
                            id: `${gameName}/${relativePath}`,
                            gameName: gameName,
                            path: relativePath,
                            blob: blob,
                            type: this.getMimeType(relativePath)
                        };
                        
                        return new Promise((resolve, reject) => {
                            const request = objectStore.put(fileData);
                            request.onsuccess = () => resolve();
                            request.onerror = () => reject(request.error);
                        });
                    })
                );
            }
        });
        
        await Promise.all(promises);
        console.log(`已保存 ${fileCount} 个文件到 IndexedDB`);
        
        return new Promise((resolve, reject) => {
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    }

    /**
     * 根据文件扩展名获取MIME类型
     */
    getMimeType(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        const mimeTypes = {
            'json': 'application/json',
            'png': 'image/png',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'gif': 'image/gif',
            'webp': 'image/webp',
            'svg': 'image/svg+xml'
        };
        return mimeTypes[ext] || 'application/octet-stream';
    }

    /**
     * 从 IndexedDB 读取游戏文件
     */
    async getGameFile(gameName, filePath) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.STORE_NAME], 'readonly');
            const objectStore = transaction.objectStore(this.STORE_NAME);
            const request = objectStore.get(`${gameName}/${filePath}`);
            
            request.onsuccess = () => {
                resolve(request.result);
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    /**
     * 从 IndexedDB 读取游戏的所有文件
     */
    async getAllGameFiles(gameName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.STORE_NAME], 'readonly');
            const objectStore = transaction.objectStore(this.STORE_NAME);
            const index = objectStore.index('gameName');
            const request = index.getAll(gameName);
            
            request.onsuccess = () => {
                resolve(request.result);
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
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
    async deleteGame(gameName) {
        if (!confirm(`确定要删除游戏"${gameName}"吗？`)) {
            return;
        }
        
        try {
            // 从 IndexedDB 删除游戏的所有文件
            const files = await this.getAllGameFiles(gameName);
            const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
            const objectStore = transaction.objectStore(this.STORE_NAME);
            
            files.forEach(file => {
                objectStore.delete(file.id);
            });
            
            await new Promise((resolve, reject) => {
                transaction.oncomplete = () => resolve();
                transaction.onerror = () => reject(transaction.error);
            });
            
            // 从游戏列表中移除
            const games = this.getStoredGames();
            const filteredGames = games.filter(g => g.name !== gameName);
            localStorage.setItem('uploadedGames', JSON.stringify(filteredGames));
            
            // 重新加载游戏列表
            this.loadExistingGames();
            
            console.log(`游戏 ${gameName} 已删除`);
        } catch (error) {
            console.error('删除游戏失败:', error);
            this.showError('删除游戏失败: ' + error.message);
        }
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
