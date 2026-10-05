/**
 * 游戏数据管理器
 * 负责加载和管理游戏脚本数据
 */
class GameData {
    constructor(siteName = 'twin_pagoda') {
        this.gameScript = null;
        this.metadata = null;
        this.siteName = siteName;
    }

    /**
     * 加载游戏脚本
     */
    async loadGameScript() {
        try {
            const response = await fetch(`./game_scripts/${this.siteName}.json`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.gameScript = await response.json();
            this.metadata = this.gameScript.metadata;
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
        if (this.gameScript.intro && this.gameScript.intro[sceneId]) {
            return this.gameScript.intro[sceneId];
        }
        
        // 然后在main_game中查找
        if (this.gameScript.main_game && this.gameScript.main_game[sceneId]) {
            return this.gameScript.main_game[sceneId];
        }
        
        // 最后在ending中查找
        if (this.gameScript.ending && this.gameScript.ending[sceneId]) {
            return this.gameScript.ending[sceneId];
        }
        
        return null;
    }

    /**
     * 获取所有场景ID
     * @returns {Array} 所有场景ID的数组
     */
    getAllSceneIds() {
        const sceneIds = [];
        
        if (this.gameScript.intro) {
            sceneIds.push(...Object.keys(this.gameScript.intro));
        }
        
        if (this.gameScript.main_game) {
            sceneIds.push(...Object.keys(this.gameScript.main_game));
        }
        
        if (this.gameScript.ending) {
            sceneIds.push(...Object.keys(this.gameScript.ending));
        }
        
        return sceneIds;
    }

    /**
     * 获取游戏元数据
     * @returns {Object} 元数据对象
     */
    getMetadata() {
        return this.metadata;
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
        return this.gameScript.ending && this.gameScript.ending[sceneId];
    }

    /**
     * 获取结局类型
     * @param {string} sceneId - 场景ID
     * @returns {string|null} 结局类型
     */
    getEndingType(sceneId) {
        if (sceneId === 'ending_complete') {
            return 'complete';
        } else if (sceneId === 'ending_normal') {
            return 'normal';
        }
        return null;
    }
}
