/**
 * 游戏引擎
 * 负责游戏逻辑的核心控制
 */
class GameEngine {
    constructor(siteName = 'twin_pagoda') {
        this.gameData = new GameData(siteName);
        this.gameState = new GameState();
        this.uiManager = new UIManager();
        this.navigationManager = null;
        // this.treeVisualizationManager = null; // 树可视化管理器 - 已禁用
        this.isInitialized = false;
        this.siteName = siteName;
    }

    /**
     * 初始化游戏
     */
    async init() {
        try {
            // 加载游戏数据
            const loadSuccess = await this.gameData.loadGameScript();
            if (!loadSuccess) {
                throw new Error('游戏数据加载失败');
            }

            // 初始化导航管理器
            this.navigationManager = new NavigationManager(this.gameData, this.gameState);

            // 初始化树可视化管理器 - 已禁用
            // this.treeVisualizationManager = new TreeVisualizationManager(this);

            // 设置UI
            this.setupUI();
            
            // 绑定事件
            this.bindEvents();
            
            this.isInitialized = true;
            console.log('游戏初始化完成');
            
        } catch (error) {
            console.error('游戏初始化失败:', error);
            alert('游戏加载失败，请刷新页面重试');
        }
    }

    /**
     * 设置UI
     */
    setupUI() {
        const metadata = this.gameData.getMetadata();
        
        // 设置背景和标题
        if (metadata) {
            this.uiManager.setBackground(this.gameData.getBackgroundPath());
            this.uiManager.setNpcCharacter(this.gameData.getNpcCharacterPath());
            this.uiManager.setSiteName(metadata.site_name || '景点');
        }
        
        // 显示开始界面
        this.uiManager.showStartScreen();
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 开始游戏
        this.uiManager.onStartGame(() => {
            this.startGame();
        });

        // 退出游戏
        this.uiManager.onExitGame(() => {
            this.showExitConfirmation();
        });

        // 显示历史
        this.uiManager.onShowHistory(() => {
            this.showHistory();
        });

        // 继续按钮
        this.uiManager.onContinueClick(() => {
            this.showCurrentSceneOptions();
        });

        // 完成按钮
        this.uiManager.onCompleteClick(() => {
            this.handleGameComplete();
        });
    }

    /**
     * 开始游戏
     */
    startGame() {
        this.gameState.startGame();
        this.uiManager.showGameScreen();
        
        // 通知树可视化管理器游戏开始 - 已禁用
        // if (this.treeVisualizationManager) {
        //     this.treeVisualizationManager.onGameStart(this.gameState.currentScene);
        // }
        
        this.playCurrentScene();
    }

    /**
     * 播放当前场景
     */
    playCurrentScene() {
        const currentSceneId = this.gameState.currentScene;
        const scene = this.gameData.getScene(currentSceneId);
        
        if (!scene) {
            console.error('场景不存在:', currentSceneId);
            return;
        }

        // 更新背景图片（如果需要）
        this.updateSceneBackground(currentSceneId);

        // 添加NPC对话到历史记录
        const metadata = this.gameData.getMetadata();
        const npcName = metadata ? metadata.role : 'NPC';
        this.gameState.addToHistory('npc', scene.npc, npcName);

        // 显示NPC文本（NPC立绘将在showNpcText方法中显示）
        const isEndingScene = this.gameData.isEndingScene(currentSceneId);
        const buttonType = isEndingScene ? 'complete' : 'continue';
        
        // 如果是结局场景，立即设置结局类型
        if (isEndingScene) {
            const endingType = this.gameData.getEndingType(currentSceneId);
            this.gameState.endGame(endingType);
            this.currentEndingType = endingType;
        }
        
        this.uiManager.showNpcText(scene.npc, () => {
            // 文本显示完成后的处理
            if (this.gameData.isEndingScene(currentSceneId)) {
                // 结局处理已经在上面完成，这里不需要再次调用
            } else if (!scene.options || scene.options.length === 0) {
                // 如果是叶子节点，自动进入返回逻辑
                this.handleLeafNode();
            }
            // 如果有选项，会在用户点击继续后显示
        }, buttonType);
    }

    /**
     * 更新场景背景图片
     * @param {string} sceneId - 场景ID
     */
    updateSceneBackground(sceneId) {
        const newBackgroundPath = this.gameData.getSceneBackgroundPath(sceneId);
        this.uiManager.changeBackground(newBackgroundPath);
    }

    /**
     * 显示当前场景的选项
     */
    showCurrentSceneOptions() {
        const currentSceneId = this.gameState.currentScene;
        const scene = this.gameData.getScene(currentSceneId);
        
        if (!scene || this.gameData.isEndingScene(currentSceneId)) {
            return;
        }

        // 获取包含返回选项的完整选项列表
        const options = this.navigationManager.getOptionsWithBack(scene.options);
        
        if (options.length > 0) {
            this.uiManager.showOptions(options, (selectedOption) => {
                this.handleOptionSelection(selectedOption);
            });
        } else {
            // 没有选项，自动进入返回逻辑
            this.handleLeafNode();
        }
    }

    /**
     * 处理选项选择
     * @param {Object} option - 选择的选项
     */
    handleOptionSelection(option) {
        if (option.isBack) {
            // 处理返回选项
            if (option.next.startsWith('ending_')) {
                // 进入结局
                this.gameState.visitScene(option.next);
                
                // 通知树可视化管理器场景切换 - 已禁用
                // if (this.treeVisualizationManager) {
                //     this.treeVisualizationManager.onSceneChange(option.next, false);
                // }
                
                this.playCurrentScene();
            } else {
                // 返回到之前的场景
                this.navigationManager.handleBackNavigation(option.next);
                
                // 通知树可视化管理器场景切换（回退） - 已禁用
                // if (this.treeVisualizationManager) {
                //     this.treeVisualizationManager.onSceneChange(this.gameState.currentScene, true);
                // }
                
                this.showCurrentSceneOptions();
            }
        } else {
            // 处理普通选项
            const optionKey = this.gameState.generateOptionKey(
                this.gameState.currentScene, 
                option.user
            );
            
            this.gameState.selectOption(optionKey, option.user, option.next);
            
            if (option.next) {
                // 通知树可视化管理器场景切换 - 已禁用
                // if (this.treeVisualizationManager) {
                //     this.treeVisualizationManager.onSceneChange(option.next, false);
                // }
                
                this.playCurrentScene();
            }
        }
    }

    /**
     * 处理叶子节点
     */
    handleLeafNode() {
        const backOption = this.navigationManager.getBackOption();
        
        if (backOption) {
            // 自动选择返回选项
            setTimeout(() => {
                this.handleOptionSelection(backOption);
            }, 1000);
        }
    }

    /**
     * 处理结局
     * @param {string} endingSceneId - 结局场景ID
     */
    handleEnding(endingSceneId) {
        const endingType = this.gameData.getEndingType(endingSceneId);
        this.gameState.endGame(endingType);
        
        // 存储结局类型，以便完成按钮点击时使用
        this.currentEndingType = endingType;
    }

    /**
     * 处理游戏完成（点击完成按钮时调用）
     */
    handleGameComplete() {
        this.handleEndingComplete(this.currentEndingType);
    }

    /**
     * 处理结局完成
     * @param {string} endingType - 结局类型
     */
    handleEndingComplete(endingType) {
        if (endingType === 'complete') {
            // 显示成就弹窗
            const metadata = this.gameData.getMetadata();
            const achievementName = metadata ? metadata.achievement : '特殊成就';
            
            this.uiManager.showAchievementModal(achievementName, () => {
                this.returnToStart();
            });
        } else {
            // 直接返回开始界面
            this.returnToStart();
        }
    }

    /**
     * 返回开始界面
     */
    returnToStart() {
        this.gameState.reset();
        this.uiManager.reset();
        
        // 恢复默认背景
        const defaultBackground = this.gameData.getBackgroundPath();
        this.uiManager.setBackground(defaultBackground);
        
        this.uiManager.showStartScreen();
        
        // 通知树可视化管理器游戏重置 - 已禁用
        // if (this.treeVisualizationManager) {
        //     this.treeVisualizationManager.onGameReset();
        // }
        
        // 清除结局类型
        this.currentEndingType = null;
    }

    /**
     * 显示退出确认
     */
    showExitConfirmation() {
        this.uiManager.showConfirmModal(
            '确认要离开游戏吗？',
            () => {
                // 确认退出，进入普通结局
                this.gameState.visitScene('ending_normal');
                this.playCurrentScene();
            },
            () => {
                // 取消，不做任何操作
            }
        );
    }

    /**
     * 显示历史对话
     */
    showHistory() {
        const history = this.gameState.getFormattedHistory();
        this.uiManager.showHistoryModal(history);
    }

    /**
     * 检查游戏是否已初始化
     * @returns {boolean} 是否已初始化
     */
    isReady() {
        return this.isInitialized;
    }

    /**
     * 获取游戏状态信息（用于调试）
     * @returns {Object} 游戏状态信息
     */
    getGameInfo() {
        const baseInfo = {
            currentScene: this.gameState.currentScene,
            visitedScenes: Array.from(this.gameState.visitedScenes),
            selectedOptions: Array.from(this.gameState.selectedOptions),
            dialogueHistory: this.gameState.dialogueHistory,
            navigationHistory: this.gameState.getNavigationHistory(),
            gameStarted: this.gameState.gameStarted,
            gameEnded: this.gameState.gameEnded
        };

        // 添加树可视化调试信息 - 已禁用
        // if (this.treeVisualizationManager) {
        //     baseInfo.treeVisualization = this.treeVisualizationManager.getDebugInfo();
        // }

        return baseInfo;
    }
}
