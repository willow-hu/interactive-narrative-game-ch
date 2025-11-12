/**
 * 游戏引擎
 * 负责游戏逻辑的核心控制
 */
class GameEngine {
    constructor(siteName = 'sample') {
        this.gameData = new GameData(siteName);
        this.gameState = new GameState();
        this.uiManager = new UIManager();
        this.navigationManager = null;
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

            // 预加载所有图片资源
            await this.preloadAssets();

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
     * 预加载所有图片资源
     */
    async preloadAssets() {
        const allSceneIds = this.gameData.getAllSceneIds();
        const imagesToLoad = [];
        const imageUrls = new Set();

        // 收集所有需要加载的图片URL
        allSceneIds.forEach(sceneId => {
            const bgPath = this.gameData.getSceneBackgroundPath(sceneId);
            const npcPath = this.gameData.getSceneNpcCharacterPath(sceneId);
            
            if (bgPath && !imageUrls.has(bgPath)) {
                imageUrls.add(bgPath);
                imagesToLoad.push(bgPath);
            }
            
            if (npcPath && !imageUrls.has(npcPath)) {
                imageUrls.add(npcPath);
                imagesToLoad.push(npcPath);
            }
        });

        if (imagesToLoad.length === 0) {
            return;
        }

        console.log(`开始预加载 ${imagesToLoad.length} 张图片...`);

        // 预加载所有图片
        const loadPromises = imagesToLoad.map(url => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => {
                    console.log(`图片加载成功: ${url.substring(0, 50)}...`);
                    resolve();
                };
                img.onerror = () => {
                    console.warn(`图片加载失败: ${url.substring(0, 50)}...`);
                    resolve(); // 即使失败也继续
                };
                img.src = url;
            });
        });

        await Promise.all(loadPromises);
        console.log('所有图片预加载完成');
    }

    /**
     * 设置UI
     */
    setupUI() {
        // 设置初始背景为黑色
        this.uiManager.changeBackground(null);
        
        // 隐藏NPC立绘
        this.uiManager.hideNpcCharacter();
        
        // 显示开始界面
        this.uiManager.showStartScreen();
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 开始游戏（观看教程）
        this.uiManager.onStartGame(() => {
            this.startGame();
        });

        // 跳过教程，直接进入游戏
        this.uiManager.onSkipTutorial(() => {
            this.startGameWithoutTutorial();
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
     * 开始游戏（包含教程）
     */
    startGame() {
        this.gameState.startGame();
        this.uiManager.showGameScreen();
        this.playCurrentScene();
    }

    /**
     * 开始游戏（跳过教程，直接进入主体部分）
     */
    startGameWithoutTutorial() {
        // 手动设置游戏开始状态
        this.gameState.gameStarted = true;
        this.gameState.visitScene('scene_1');
        this.uiManager.showGameScreen();
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

        // 更新背景图片和NPC立绘
        this.updateSceneAssets(currentSceneId);

        // 设置角色名称（只在主游戏场景显示，引导和结束场景不显示）
        const isIntroScene = this.gameData.isIntroScene(currentSceneId);
        const isEndingScene = this.gameData.isEndingScene(currentSceneId);
        if (!isIntroScene && !isEndingScene && scene.role) {
            this.uiManager.setRoleName(scene.role);
        } else {
            this.uiManager.hideRoleName();
        }

        // 添加NPC对话到历史记录
        this.gameState.addToHistory('npc', scene.content || scene.npc, scene.role);

        // 检查是否有NPC立绘
        const hasNpc = this.gameData.getSceneNpcCharacterPath(currentSceneId) !== null;

        // 显示NPC文本
        const buttonType = isEndingScene ? 'complete' : 'continue';
        
        // 如果是结局场景，标记游戏结束并禁用退出按钮
        if (isEndingScene) {
            this.gameState.endGame();
            this.uiManager.disableExitButton();
        }
        
        this.uiManager.showNpcText(scene.content || scene.npc, () => {
            // 文本显示完成后的处理
            if (!this.gameData.isEndingScene(currentSceneId) && (!scene.options || scene.options.length === 0)) {
                // 如果是叶子节点，自动进入返回逻辑
                this.handleLeafNode();
            }
            // 如果有选项，会在用户点击继续后显示
        }, buttonType, hasNpc);
    }

    /**
     * 更新场景资源（背景和NPC立绘）
     * @param {string} sceneId - 场景ID
     */
    updateSceneAssets(sceneId) {
        // 更新背景图片（null表示使用黑色背景）
        const newBackgroundPath = this.gameData.getSceneBackgroundPath(sceneId);
        this.uiManager.changeBackground(newBackgroundPath);
        
        // 更新NPC立绘（null表示隐藏立绘）
        const newNpcPath = this.gameData.getSceneNpcCharacterPath(sceneId);
        if (newNpcPath === null) {
            // 没有立绘则隐藏
            this.uiManager.hideNpcCharacter();
        } else {
            // 有立绘则设置并在显示文本时显示
            this.uiManager.setNpcCharacter(newNpcPath);
        }
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
            if (option.next === 'ending' || option.next.startsWith('ending_')) {
                // 进入结局场景
                this.gameState.visitScene(option.next);
                this.playCurrentScene();
            } else {
                // 返回到之前的场景
                this.navigationManager.handleBackNavigation(option.next);
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
     * 处理游戏完成（点击完成按钮时调用）
     */
    handleGameComplete() {
        // 返回到上传资料界面
        window.location.href = 'index.html';
    }

    /**
     * 返回开始界面
     */
    returnToStart() {
        this.gameState.reset();
        this.uiManager.reset();
        
        // 恢复黑色背景
        this.uiManager.changeBackground(null);
        
        this.uiManager.showStartScreen();
    }

    /**
     * 显示退出确认
     */
    showExitConfirmation() {
        this.uiManager.showConfirmModal(
            '确认要离开游戏吗？',
            () => {
                // 确认退出，进入结局场景
                this.gameState.visitScene('ending');
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

        return baseInfo;
    }
}
