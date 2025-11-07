/**
 * 游戏状态管理器
 * 负责管理游戏进度、历史记录和玩家选择
 */
class GameState {
    constructor() {
        this.currentScene = null;
        this.visitedScenes = new Set();
        this.selectedOptions = new Set();
        this.dialogueHistory = [];
        this.navigationHistory = [];
        this.gameStarted = false;
        this.gameEnded = false;
    }

    /**
     * 重置游戏状态
     */
    reset() {
        this.currentScene = null;
        this.visitedScenes.clear();
        this.selectedOptions.clear();
        this.dialogueHistory = [];
        this.navigationHistory = [];
        this.gameStarted = false;
        this.gameEnded = false;
    }

    /**
     * 开始游戏
     */
    startGame() {
        this.gameStarted = true;
        this.currentScene = 'intro_0';
        this.visitScene(this.currentScene);
    }

    /**
     * 访问场景
     * @param {string} sceneId - 场景ID
     */
    visitScene(sceneId) {
        this.currentScene = sceneId;
        this.visitedScenes.add(sceneId);
        
        // 将当前场景添加到导航历史中
        this.navigationHistory.push(sceneId);
    }

    /**
     * 选择选项
     * @param {string} optionKey - 选项的唯一标识
     * @param {string} userText - 用户选择的文本
     * @param {string} nextScene - 下一个场景ID
     */
    selectOption(optionKey, userText, nextScene) {
        this.selectedOptions.add(optionKey);
        
        // 添加到对话历史
        this.addToHistory('user', userText);
        
        // 访问下一个场景
        if (nextScene) {
            this.visitScene(nextScene);
        }
    }

    /**
     * 添加到对话历史
     * @param {string} speaker - 发言者 ('user' 或 'npc')
     * @param {string} text - 对话内容
     * @param {string} npcName - NPC名称（可选）
     */
    addToHistory(speaker, text, npcName = null) {
        this.dialogueHistory.push({
            speaker: speaker,
            text: text,
            npcName: npcName,
            timestamp: Date.now()
        });
    }

    /**
     * 获取当前场景的未选择选项
     * @param {Array} options - 当前场景的所有选项
     * @returns {Array} 未选择的选项
     */
    getUnselectedOptions(options) {
        if (!options) return [];
        
        return options.filter(option => {
            const optionKey = `${this.currentScene}_${option.user}`;
            return !this.selectedOptions.has(optionKey);
        });
    }

    /**
     * 生成选项的唯一标识
     * @param {string} sceneId - 场景ID
     * @param {string} userText - 用户文本
     * @returns {string} 选项的唯一标识
     */
    generateOptionKey(sceneId, userText) {
        return `${sceneId}_${userText}`;
    }

    /**
     * 检查是否所有场景都已探索
     * @param {Array} allSceneIds - 所有场景ID
     * @returns {boolean} 是否所有场景都已探索
     */
    hasExploredAllScenes(allSceneIds) {
        // 排除结局场景
        const gameScenes = allSceneIds.filter(id => 
            !id.startsWith('ending_')
        );
        
        return gameScenes.every(sceneId => this.visitedScenes.has(sceneId));
    }

    /**
     * 获取对话历史的格式化文本
     * @returns {Array} 格式化的对话历史
     */
    getFormattedHistory() {
        return this.dialogueHistory.map(entry => {
            if (entry.speaker === 'user') {
                return `你：${entry.text}`;
            } else {
                const speakerName = entry.npcName || '角色';
                return `${speakerName}：${entry.text}`;
            }
        });
    }

    /**
     * 结束游戏
     * @param {string} endingType - 结局类型
     */
    endGame(endingType) {
        this.gameEnded = true;
        this.endingType = endingType;
    }

    /**
     * 获取导航历史
     * @returns {Array} 导航历史
     */
    getNavigationHistory() {
        return [...this.navigationHistory];
    }

    /**
     * 清空导航历史
     */
    clearNavigationHistory() {
        this.navigationHistory = [];
    }
}
