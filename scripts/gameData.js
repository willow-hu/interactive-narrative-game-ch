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
    }

    /**
     * 加载游戏脚本
     */
    async loadGameScript() {
        try {
            // 加载 intro
            const introResponse = await fetch('./game_scripts/intro.json');
            if (!introResponse.ok) {
                throw new Error(`加载 intro 失败! status: ${introResponse.status}`);
            }
            this.introScript = await introResponse.json();
            
            // 加载主体脚本
            const mainResponse = await fetch(`./game_assets/${this.siteName}/script.json`);
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
        } catch (error) {
            console.error('加载游戏脚本失败:', error);
            return false;
        }
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
     * 获取背景图片路径
     * @returns {string} 背景图片路径
     */
    getBackgroundPath() {
        return `./imgs/${this.siteName}/bg.png`;
    }

    /**
     * 获取特定场景的背景图片路径
     * @param {string} sceneId - 场景ID
     * @returns {string} 背景图片路径
     */
    getSceneBackgroundPath(sceneId) {
        // 获取背景映射配置
        const config = window.GAME_CONFIG;
        if (!config || !config.backgroundMapping || !config.backgroundMapping[this.siteName]) {
            return `./imgs/${this.siteName}/bg.png`; // 返回默认背景
        }

        const mapping = config.backgroundMapping[this.siteName];
        
        // 遍历映射配置，查找场景对应的背景图
        for (const [backgroundFile, sceneList] of Object.entries(mapping)) {
            if (sceneList.includes(sceneId)) {
                return `./imgs/${this.siteName}/${backgroundFile}`;
            }
        }
        
        // 如果没有找到特定背景，返回默认背景
        return `./imgs/${this.siteName}/bg.png`;
    }

    /**
     * 获取NPC立绘路径
     * @returns {string} NPC立绘路径
     */
    getNpcCharacterPath() {
        return `./imgs/${this.siteName}/npc.png`;
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
