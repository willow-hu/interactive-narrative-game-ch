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
    async loadExistingGames() {
        try {
            const response = await fetch('/api/games');
            const data = await response.json();
            let games = data.games || [];
            
            // 添加预设游戏到列表
            const presetGame = {
                name: 'sample',
                displayName: '苏州双塔（预设游戏）',
                createTime: '系统预设'
            };
            
            // 将预设游戏添加到列表开头
            games.unshift(presetGame);
            
            if (games.length > 0) {
                this.gameList.style.display = 'block';
                this.existingGames.innerHTML = '';
                
                games.forEach(game => {
                    const gameItem = document.createElement('div');
                    gameItem.className = 'game-item';
                    
                    // 预设游戏不显示删除按钮
                    const deleteButton = game.name === 'sample' ? '' : 
                        `<button class="game-button delete-button" onclick="uploadManager.deleteGame('${game.name}')">删除</button>`;
                    
                    gameItem.innerHTML = `
                        <div class="game-info">
                            <div class="game-name">${game.displayName || game.name}</div>
                            <div class="game-meta">创建时间: ${game.createTime}</div>
                        </div>
                        <div class="game-actions">
                            <button class="game-button play-button" onclick="uploadManager.playGame('${game.name}')">开始游戏</button>
                            ${deleteButton}
                        </div>
                    `;
                    
                    this.existingGames.appendChild(gameItem);
                });
            }
        } catch (error) {
            console.error('加载游戏列表失败:', error);
        }
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
            this.showProgress('正在上传文件...');
            
            // 创建 FormData 对象
            const formData = new FormData();
            formData.append('gameName', gameName);
            formData.append('zipFile', file);
            
            this.updateProgress(20, '正在上传到服务器...');
            
            // 上传到服务器
            const response = await fetch('/api/upload-game', {
                method: 'POST',
                body: formData
            });
            
            this.updateProgress(60, '正在解压文件...');
            
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || '上传失败');
            }
            
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
            const response = await fetch(`/api/games/${gameName}`, {
                method: 'DELETE'
            });
            
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || '删除失败');
            }
            
            // 重新加载游戏列表
            await this.loadExistingGames();
            
        } catch (error) {
            console.error('删除游戏失败:', error);
            alert('删除失败: ' + error.message);
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
