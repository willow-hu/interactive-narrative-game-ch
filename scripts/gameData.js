/**
 * 游戏数据管理器
 * 负责加载和管理游戏脚本数据
 */
class GameData {
    constructor(siteName = 'twin_pagoda') {
        this.introScript = null;
        this.mainScript = null;
        this.endingScript = null;
        this.siteName = siteName;
        this.uploadedGameData = null;
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
        return localStorage.getItem(`game_${siteName}`) !== null;
    }

    /**
     * 加载用户上传的游戏脚本
     */
    async loadUploadedGameScript() {
        const gameDataJson = localStorage.getItem(`game_${this.siteName}`);
        if (!gameDataJson) {
            throw new Error('游戏数据不存在');
        }
        
        const gameData = JSON.parse(gameDataJson);
        
        // 加载 intro
        const introData = await this.loadFileFromStorage('./game_scripts/intro.json');
        this.introScript = JSON.parse(introData);
        
        // 加载主体脚本（从上传的数据中）
        if (!gameData['script.json']) {
            throw new Error('游戏资源包中缺少script.json');
        }
        const mainScriptContent = atob(gameData['script.json']);
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
        
        // 加载主体脚本
        const mainResponse = await fetch('./game_scripts/sample.json');
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
        
        const base64Data = this.uploadedGameData[relativePath];
        const extension = relativePath.split('.').pop().toLowerCase();
        
        // 根据文件扩展名确定MIME类型
        let mimeType = 'image/png';
        if (extension === 'jpg' || extension === 'jpeg') {
            mimeType = 'image/jpeg';
        } else if (extension === 'gif') {
            mimeType = 'image/gif';
        } else if (extension === 'webp') {
            mimeType = 'image/webp';
        }
        
        return `data:${mimeType};base64,${base64Data}`;
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
