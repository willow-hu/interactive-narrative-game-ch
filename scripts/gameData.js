/**
 * 游戏数据管理器
 * 负责加载和管理游戏脚本数据
 */
class GameData {
    constructor(siteName = 'sample') {
        this.introScript = null;
        this.mainScript = null;
        this.endingScript = null;
        this.siteName = siteName;
        this.uploadedGameData = null;
        this.db = null;
        this.DB_NAME = 'GameStorage';
        this.DB_VERSION = 1;
        this.STORE_NAME = 'gameFiles';
    }

    /**
     * 初始化 IndexedDB 连接
     */
    async initDB() {
        if (this.db) {
            return; // 已经初始化
        }
        
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
            
            request.onerror = () => {
                console.error('IndexedDB打开失败:', request.error);
                reject(request.error);
            };
            
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.STORE_NAME)) {
                    const objectStore = db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
                    objectStore.createIndex('gameName', 'gameName', { unique: false });
                }
            };
        });
    }

    /**
     * 从 IndexedDB 读取文件
     */
    async getFileFromDB(gameName, filePath) {
        if (!this.db) {
            await this.initDB();
        }
        
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
    async getAllGameFilesFromDB(gameName) {
        if (!this.db) {
            await this.initDB();
        }
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.STORE_NAME], 'readonly');
            const objectStore = transaction.objectStore(this.STORE_NAME);
            const index = objectStore.index('gameName');
            const request = index.getAll(gameName);
            
            request.onsuccess = () => {
                const files = {};
                request.result.forEach(file => {
                    files[file.path] = file;
                });
                resolve(files);
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    /**
     * 加载游戏脚本
     */
    async loadGameScript() {
        try {
            // 检查是否为用户上传的游戏
            const isUploadedGame = this.isUploadedGame(this.siteName);
            
            if (isUploadedGame) {
                // 从localStorage加载用户上传的游戏
                return await this.loadUploadedGameScript();
            } else {
                // 从服务器加载预设游戏
                return await this.loadPresetGameScript();
            }
        } catch (error) {
            console.error('加载游戏脚本失败:', error);
            return false;
        }
    }

    /**
     * 检查是否为上传的游戏
     */
    isUploadedGame(siteName) {
        // 检查游戏列表中是否存在
        const gamesJson = localStorage.getItem('uploadedGames');
        if (!gamesJson) return false;
        
        const games = JSON.parse(gamesJson);
        return games.some(g => g.name === siteName);
    }

    /**
     * 加载用户上传的游戏脚本
     */
    async loadUploadedGameScript() {
        // 初始化数据库连接
        await this.initDB();
        
        // 从 IndexedDB 加载游戏文件
        const gameData = await this.getAllGameFilesFromDB(this.siteName);
        
        if (Object.keys(gameData).length === 0) {
            throw new Error('游戏数据不存在');
        }
        
        // 加载 intro
        const introData = await this.loadFileFromStorage('./game_scripts/intro.json');
        this.introScript = JSON.parse(introData);
        
        // 加载主体脚本（从上传的数据中）
        if (!gameData['game_script.json']) {
            throw new Error('游戏资源包中缺少game_script.json');
        }
        
        // 从 Blob 读取文本内容
        const mainScriptBlob = gameData['game_script.json'].blob;
        const mainScriptContent = await mainScriptBlob.text();
        this.mainScript = JSON.parse(mainScriptContent);
        
        // 加载 ending
        const endingData = await this.loadFileFromStorage('./game_scripts/ending.json');
        this.endingScript = JSON.parse(endingData);
        
        // 保存游戏数据供后续使用
        this.uploadedGameData = gameData;
        
        return true;
    }

    /**
     * 从localStorage或服务器加载文件
     */
    async loadFileFromStorage(path) {
        try {
            const response = await fetch(path);
            if (!response.ok) {
                throw new Error(`加载失败: ${path}`);
            }
            return await response.text();
        } catch (error) {
            console.error('加载文件失败:', error);
            throw error;
        }
    }

    /**
     * 加载预设游戏脚本
     */
    async loadPresetGameScript() {
        // 加载 intro
        const introResponse = await fetch('./game_scripts/intro.json');
        if (!introResponse.ok) {
            throw new Error(`加载 intro 失败! status: ${introResponse.status}`);
        }
        this.introScript = await introResponse.json();
        
        // 加载主体脚本（从game_assets/siteName/game_script.json读取）
        const mainResponse = await fetch(`./game_assets/${this.siteName}/game_script.json`);
        if (!mainResponse.ok) {
            throw new Error(`加载主体脚本失败! status: ${mainResponse.status}`);
        }
        this.mainScript = await mainResponse.json();
        
        // 加载 ending
        const endingResponse = await fetch('./game_scripts/ending.json');
        if (!endingResponse.ok) {
            throw new Error(`加载 ending 失败! status: ${endingResponse.status}`);
        }
        this.endingScript = await endingResponse.json();
        
        return true;
    }

    /**
     * 获取场景数据
     * @param {string} sceneId - 场景ID
     * @returns {Object|null} 场景数据
     */
    getScene(sceneId) {
        // 首先在intro中查找
        if (this.introScript && this.introScript[sceneId]) {
            return this.introScript[sceneId];
        }
        
        // 然后在主体脚本中查找
        if (this.mainScript && this.mainScript[sceneId]) {
            return this.mainScript[sceneId];
        }
        
        // 最后在ending中查找
        if (this.endingScript && this.endingScript[sceneId]) {
            return this.endingScript[sceneId];
        }
        
        return null;
    }

    /**
     * 获取所有场景ID
     * @returns {Array} 所有场景ID的数组
     */
    getAllSceneIds() {
        const sceneIds = [];
        
        if (this.introScript) {
            sceneIds.push(...Object.keys(this.introScript));
        }
        
        if (this.mainScript) {
            sceneIds.push(...Object.keys(this.mainScript));
        }
        
        if (this.endingScript) {
            sceneIds.push(...Object.keys(this.endingScript));
        }
        
        return sceneIds;
    }

    /**
     * 获取特定场景的背景图片路径
     * @param {string} sceneId - 场景ID
     * @returns {string|null} 背景图片路径，如果不需要背景则返回null
     */
    getSceneBackgroundPath(sceneId) {
        // 引导语和结束语不显示背景
        if (this.isIntroScene(sceneId) || this.isEndingScene(sceneId)) {
            return null;
        }
        
        const scene = this.getScene(sceneId);
        
        if (scene && scene.bg) {
            // 检查是否为上传的游戏
            if (this.uploadedGameData) {
                return this.getUploadedImageDataUrl(`bg/${scene.bg}`);
            }
            return `./game_assets/${this.siteName}/bg/${scene.bg}`;
        }
        
        // 如果场景没有指定背景，返回null
        return null;
    }

    /**
     * 获取特定场景的NPC立绘路径
     * @param {string} sceneId - 场景ID
     * @returns {string|null} NPC立绘路径，如果不需要立绘则返回null
     */
    getSceneNpcCharacterPath(sceneId) {
        // 引导语和结束语不显示NPC立绘
        if (this.isIntroScene(sceneId) || this.isEndingScene(sceneId)) {
            return null;
        }
        
        const scene = this.getScene(sceneId);
        
        if (scene && scene.npc_pic) {
            // 检查是否为上传的游戏
            if (this.uploadedGameData) {
                return this.getUploadedImageDataUrl(`npc/${scene.npc_pic}`);
            }
            return `./game_assets/${this.siteName}/npc/${scene.npc_pic}`;
        }
        
        // 如果场景没有指定立绘，返回null
        return null;
    }

    /**
     * 从上传的游戏数据中获取图片的Data URL
     * @param {string} relativePath - 相对路径
     * @returns {string|null} Data URL或null
     */
    getUploadedImageDataUrl(relativePath) {
        if (!this.uploadedGameData || !this.uploadedGameData[relativePath]) {
            console.warn(`找不到上传的图片: ${relativePath}`);
            return null;
        }
        
        const fileData = this.uploadedGameData[relativePath];
        
        // 将 Blob 转换为 Object URL（更高效，不需要 base64 编码）
        if (fileData.blob) {
            return URL.createObjectURL(fileData.blob);
        }
        
        return null;
    }

    /**
     * 检查是否为引导语场景
     * @param {string} sceneId - 场景ID
     * @returns {boolean} 是否为引导语场景
     */
    isIntroScene(sceneId) {
        return this.introScript && this.introScript[sceneId];
    }

    /**
     * 检查是否为结局场景
     * @param {string} sceneId - 场景ID
     * @returns {boolean} 是否为结局场景
     */
    isEndingScene(sceneId) {
        return this.endingScript && this.endingScript[sceneId];
    }
}
