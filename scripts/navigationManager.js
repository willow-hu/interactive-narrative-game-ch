/**
 * 导航管理器
 * 负责处理游戏中的返回功能和分支导航
 */
class NavigationManager {
    constructor(gameData, gameState) {
        this.gameData = gameData;
        this.gameState = gameState;
    }

    /**
     * 获取返回选项
     * 返回到最近的包含未选分支的父节点
     * @returns {Object|null} 返回选项对象，如果没有可返回的节点则返回null
     */
    getBackOption() {
        const navigationHistory = this.gameState.getNavigationHistory();
        
        // 从当前位置开始向前查找，但不能回到引导语部分
        for (let i = navigationHistory.length - 2; i >= 0; i--) {
            const sceneId = navigationHistory[i];
            
            // 如果回溯到了引导语部分，停止回溯
            if (this.isIntroScene(sceneId)) {
                break;
            }
            
            // 如果回溯到了正式剧情的根节点（第一个主场景），且它没有未探索选项，
            // 则说明所有分支都已探索完毕
            if (sceneId === 'scene_1') {
                const scene = this.gameData.getScene(sceneId);
                if (scene && scene.options) {
                    // 只获取原始选项，不包含任何系统添加的返回选项
                    const unselectedOptions = this.getUnselectedOriginalOptions(sceneId, scene.options);
                    if (unselectedOptions.length === 0) {
                        // 所有分支都已探索，返回结局选项
                        return {
                            user: "谢谢您的讲解",
                            next: this.shouldShowCompleteEnding() ? "ending_complete" : "ending_normal",
                            isBack: true
                        };
                    } else {
                        // 还有未探索的分支，返回到根节点
                        return {
                            user: "换个话题",
                            next: sceneId,
                            isBack: true
                        };
                    }
                }
            }
            
            const scene = this.gameData.getScene(sceneId);
            if (!scene || !scene.options) continue;
            
            // 检查这个场景是否有未探索的原始选项（不包含系统添加的返回选项）
            const unselectedOptions = this.getUnselectedOriginalOptions(sceneId, scene.options);
            
            if (unselectedOptions.length > 0) {
                return {
                    user: "换个话题",
                    next: sceneId,
                    isBack: true
                };
            }
        }
        
        // 如果没有找到未探索的分支，返回结局选项
        return {
            user: "谢谢您的讲解",
            next: this.shouldShowCompleteEnding() ? "ending_complete" : "ending_normal",
            isBack: true
        };
    }

    /**
     * 判断是否应该显示完整结局
     * @returns {boolean} 是否显示完整结局
     */
    shouldShowCompleteEnding() {
        const allSceneIds = this.gameData.getAllSceneIds();
        return this.gameState.hasExploredAllScenes(allSceneIds);
    }

    /**
     * 处理返回操作
     * @param {string} targetSceneId - 目标场景ID
     */
    handleBackNavigation(targetSceneId) {
        // 如果是返回到之前的场景，需要清理导航历史
        const navigationHistory = this.gameState.getNavigationHistory();
        const targetIndex = navigationHistory.lastIndexOf(targetSceneId);
        
        if (targetIndex !== -1) {
            // 保留到目标场景为止的历史记录
            this.gameState.navigationHistory = navigationHistory.slice(0, targetIndex + 1);
        }
        
        // 设置当前场景
        this.gameState.currentScene = targetSceneId;
    }

    /**
     * 检查场景是否有可用的选项（包括返回选项）
     * @param {string} sceneId - 场景ID
     * @returns {boolean} 是否有可用选项
     */
    hasAvailableOptions(sceneId) {
        const scene = this.gameData.getScene(sceneId);
        
        if (!scene || !scene.options) {
            return false;
        }
        
        // 检查是否有未选择的选项
        const unselectedOptions = this.gameState.getUnselectedOptions(scene.options);
        
        // 如果有未选择的选项，或者可以生成返回选项，则认为有可用选项
        return unselectedOptions.length > 0 || this.canGenerateBackOption();
    }

    /**
     * 检查是否可以生成返回选项
     * @returns {boolean} 是否可以生成返回选项
     */
    canGenerateBackOption() {
        const navigationHistory = this.gameState.getNavigationHistory();
        
        // 如果历史记录少于2个，无法返回
        if (navigationHistory.length < 2) {
            return false;
        }
        
        // 检查是否有可以返回的场景，但不能回到引导语部分
        for (let i = navigationHistory.length - 2; i >= 0; i--) {
            const sceneId = navigationHistory[i];
            
            // 如果回溯到了引导语部分，停止检查
            if (this.isIntroScene(sceneId)) {
                break;
            }
            
            const scene = this.gameData.getScene(sceneId);
            if (!scene || !scene.options) continue;
            
            // 检查是否有未探索的原始选项
            const unselectedOptions = this.getUnselectedOriginalOptions(sceneId, scene.options);
            if (unselectedOptions.length > 0) {
                return true;
            }
        }
        
        // 总是可以返回到结局
        return true;
    }

    /**
     * 获取包含返回选项的完整选项列表
     * @param {Array} originalOptions - 原始选项列表
     * @returns {Array} 包含返回选项的选项列表
     */
    getOptionsWithBack(originalOptions) {
        // 只获取未选择的原始选项，不包含系统添加的返回选项
        const unselectedOptions = this.getUnselectedOriginalOptions(this.gameState.currentScene, originalOptions || []);
        const result = [...unselectedOptions];
        
        // 检查当前场景是否为引导语部分（scene_0_x格式）
        const currentSceneId = this.gameState.currentScene;
        const isIntroScene = this.isIntroScene(currentSceneId);
        
        // 如果不是引导语部分，才添加返回选项
        if (!isIntroScene) {
            const backOption = this.getBackOption();
            if (backOption) {
                result.push(backOption);
            }
        }
        
        return result;
    }

    /**
     * 获取未选择的原始选项（不包含系统添加的返回选项）
     * @param {string} sceneId - 场景ID
     * @param {Array} options - 原始选项列表
     * @returns {Array} 未选择的原始选项
     */
    getUnselectedOriginalOptions(sceneId, options) {
        if (!options) return [];
        
        return options.filter(option => {
            // 跳过系统添加的返回选项
            if (option.isBack) {
                return false;
            }
            
            const optionKey = this.gameState.generateOptionKey(sceneId, option.user);
            return !this.gameState.selectedOptions.has(optionKey);
        });
    }

    /**
     * 检查场景是否为引导语部分
     * @param {string} sceneId - 场景ID
     * @returns {boolean} 是否为引导语场景
     */
    isIntroScene(sceneId) {
        // 引导语场景格式为 intro_n
        return sceneId.startsWith('intro_');
    }

    /**
     * 检查是否为叶子节点（没有选项的节点）
     * @param {string} sceneId - 场景ID
     * @returns {boolean} 是否为叶子节点
     */
    isLeafNode(sceneId) {
        const scene = this.gameData.getScene(sceneId);
        return !scene || !scene.options || scene.options.length === 0;
    }

    /**
     * 获取下一个推荐场景
     * 用于自动导航到结局或其他逻辑
     * @returns {string|null} 下一个推荐场景ID
     */
    getRecommendedNextScene() {
        // 如果当前是叶子节点，尝试返回或进入结局
        if (this.isLeafNode(this.gameState.currentScene)) {
            const backOption = this.getBackOption();
            return backOption ? backOption.next : null;
        }
        
        return null;
    }
}
