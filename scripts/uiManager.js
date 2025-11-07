/**
 * UI管理器
 * 负责管理所有用户界面元素和交互
 */
class UIManager {
    constructor() {
        this.elements = {};
        this.isTyping = false;
        this.currentTextSegments = [];
        this.currentSegmentIndex = 0;
        this.typeTimeoutId = null; // 用于跟踪打字超时ID
        this.currentFullText = ''; // 存储当前完整文本
        this.currentTypeCallback = null; // 存储当前打字完成回调
        this.bindElements();
        this.bindEvents();
    }

    /**
     * 绑定DOM元素
     */
    bindElements() {
        this.elements = {
            // 主要容器
            gameContainer: document.getElementById('gameContainer'),
            background: document.getElementById('background'),
            npcCharacter: document.getElementById('npcCharacter'),
            siteName: document.getElementById('siteName'),
            
            // 屏幕
            startScreen: document.getElementById('startScreen'),
            gameScreen: document.getElementById('gameScreen'),
            
            // 按钮
            startGameButton: document.getElementById('startGameButton'),
            exitButton: document.getElementById('exitButton'),
            historyButton: document.getElementById('historyButton'),
            continueButton: document.getElementById('continueButton'),
            completeButton: document.getElementById('completeButton'),
            
            // 对话
            dialogueBox: document.getElementById('dialogueBox'),
            npcText: document.getElementById('npcText'),
            skipHint: document.getElementById('skipHint'),
            
            // 选项
            optionsOverlay: document.getElementById('optionsOverlay'),
            optionsContainer: document.getElementById('optionsContainer'),
            
            // 弹窗
            historyModal: document.getElementById('historyModal'),
            historyContent: document.getElementById('historyContent'),
            historyList: document.getElementById('historyList'),
            closeHistoryButton: document.getElementById('closeHistoryButton'),
            
            confirmModal: document.getElementById('confirmModal'),
            confirmText: document.getElementById('confirmText'),
            confirmYes: document.getElementById('confirmYes'),
            confirmNo: document.getElementById('confirmNo'),
            
            achievementModal: document.getElementById('achievementModal'),
            achievementText: document.getElementById('achievementText'),
            achievementConfirm: document.getElementById('achievementConfirm')
        };
    }

    /**
     * 绑定事件监听器
     */
    bindEvents() {
        // 阻止双击缩放
        document.addEventListener('touchstart', this.preventZoom.bind(this), { passive: false });
        
        // 阻止上下文菜单
        document.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // 历史对话按钮
        this.elements.closeHistoryButton.addEventListener('click', () => {
            this.hideHistoryModal();
        });
        
        // 点击历史弹窗外部关闭
        this.elements.historyModal.addEventListener('click', (e) => {
            if (e.target === this.elements.historyModal) {
                this.hideHistoryModal();
            }
        });
        
        // 点击选项遮罩外部不关闭（防止误触）
        this.elements.optionsOverlay.addEventListener('click', (e) => {
            if (e.target === this.elements.optionsOverlay) {
                // 可以选择不做任何操作，或者添加提示
            }
        });
        
        // 点击文本框跳过打字效果
        this.elements.npcText.addEventListener('click', () => {
            if (this.isTyping) {
                this.skipTyping();
            }
        });
        
        // 为文本框添加视觉反馈样式
        this.elements.npcText.addEventListener('mouseenter', () => {
            if (this.isTyping) {
                this.elements.npcText.style.cursor = 'pointer';
            }
        });
        
        this.elements.npcText.addEventListener('mouseleave', () => {
            this.elements.npcText.style.cursor = 'default';
        });
    }

    /**
     * 防止双击缩放
     */
    preventZoom(e) {
        if (e.touches.length > 1) {
            e.preventDefault();
        }
    }

    /**
     * 设置背景图片
     * @param {string} imagePath - 图片路径
     */
    setBackground(imagePath) {
        this.elements.background.style.backgroundImage = `url('${imagePath}')`;
    }

    /**
     * 切换背景图片（不带过渡效果）
     * @param {string|null} imagePath - 新的图片路径，null表示使用黑色背景
     */
    changeBackground(imagePath) {
        // 如果路径为null，设置为黑色背景
        if (imagePath === null) {
            this.elements.background.style.backgroundImage = 'none';
            this.elements.background.style.backgroundColor = '#000000';
            return;
        }

        // 如果新路径与当前路径相同，不进行切换
        const currentBg = this.elements.background.style.backgroundImage;
        const newBg = `url('${imagePath}')`;
        if (currentBg === newBg) {
            return;
        }

        // 预加载新图片以确保流畅切换
        const img = new Image();
        img.onload = () => {
            // 直接切换背景图片
            this.elements.background.style.backgroundColor = 'transparent';
            this.elements.background.style.backgroundImage = newBg;
        };
        
        img.onerror = () => {
            // 如果新图片加载失败，使用黑色背景
            console.warn(`背景图片加载失败: ${imagePath}`);
            this.elements.background.style.backgroundImage = 'none';
            this.elements.background.style.backgroundColor = '#000000';
        };
        
        img.src = imagePath;
    }

    /**
     * 设置NPC立绘
     * @param {string|null} imagePath - NPC立绘图片路径，null表示隐藏立绘
     */
    setNpcCharacter(imagePath) {
        // 如果路径为null，隐藏NPC立绘
        if (imagePath === null) {
            this.hideNpcCharacter();
            return;
        }

        // 预加载新图片以确保流畅切换
        const img = new Image();
        img.onload = () => {
            this.elements.npcCharacter.style.backgroundImage = `url('${imagePath}')`;
        };
        
        img.onerror = () => {
            console.warn(`NPC立绘加载失败: ${imagePath}`);
            // 加载失败则隐藏立绘
            this.hideNpcCharacter();
        };
        
        img.src = imagePath;
    }

    /**
     * 显示NPC立绘
     */
    showNpcCharacter() {
        this.elements.npcCharacter.style.display = 'block';
    }

    /**
     * 隐藏NPC立绘
     */
    hideNpcCharacter() {
        this.elements.npcCharacter.style.display = 'none';
    }

    /**
     * 设置景点名称
     * @param {string} name - 景点名称
     */
    setSiteName(name) {
        this.elements.siteName.textContent = name;
    }

    /**
     * 显示开始界面
     */
    showStartScreen() {
        this.elements.startScreen.style.display = 'flex';
        this.elements.gameScreen.style.display = 'none';
        this.elements.exitButton.style.display = 'none';
        this.elements.historyButton.style.display = 'none';
    }

    /**
     * 显示游戏界面
     */
    showGameScreen() {
        this.elements.startScreen.style.display = 'none';
        this.elements.gameScreen.style.display = 'block';
        this.elements.exitButton.style.display = 'block';
        this.elements.historyButton.style.display = 'block';
    }

    /**
     * 显示NPC文本
     * @param {string} text - 要显示的文本
     * @param {Function} onComplete - 完成回调
     * @param {string} buttonType - 按钮类型：'continue' 或 'complete'
     * @param {boolean} hasNpc - 是否有NPC立绘
     */
    showNpcText(text, onComplete, buttonType = 'continue', hasNpc = true) {
        // 只在有NPC立绘时显示（与对话框同步）
        if (hasNpc) {
            this.showNpcCharacter();
        } else {
            this.hideNpcCharacter();
        }
        
        // 分割文本（以双换行符分割）
        this.currentTextSegments = text.split('\n\n').filter(segment => segment.trim());
        this.currentSegmentIndex = 0;
        this.onTextComplete = onComplete;
        this.currentButtonType = buttonType;
        
        // 根据按钮类型显示对应的按钮并设为禁用状态
        if (buttonType === 'complete') {
            this.elements.continueButton.className = '';
            this.elements.completeButton.className = 'disabled';
        } else {
            this.elements.completeButton.className = '';
            this.elements.continueButton.className = 'disabled';
        }
        
        // 清空文本区域
        this.elements.npcText.innerHTML = '';
        
        // 显示第一段文本
        this.showNextTextSegment();
    }

    /**
     * 显示下一段文本
     */
    showNextTextSegment() {
        if (this.currentSegmentIndex >= this.currentTextSegments.length) {
            // 所有文本都显示完了
            this.onTextComplete && this.onTextComplete();
            return;
        }
        
        const segment = this.currentTextSegments[this.currentSegmentIndex];
        
        this.elements.npcText.innerHTML = '';
        
        // 逐字显示文本
        this.typeText(segment, () => {
            // 根据按钮类型启用相应的按钮
            if (this.currentButtonType === 'complete') {
                this.elements.completeButton.className = 'visible';
            } else {
                this.elements.continueButton.className = 'visible';
            }
        });
    }

    /**
     * 逐字显示文本效果
     * @param {string} text - 要显示的文本
     * @param {Function} onComplete - 完成回调
     */
    typeText(text, onComplete) {
        this.isTyping = true;
        this.currentFullText = text;
        this.currentTypeCallback = onComplete;
        
        // 添加打字状态类并显示跳过提示
        this.elements.npcText.classList.add('typing');
        this.elements.skipHint.classList.add('visible');
        
        let index = 0;
        const speed = 50; // 打字速度（毫秒）
        
        const typeChar = () => {
            if (index < text.length) {
                this.elements.npcText.textContent += text.charAt(index);
                index++;
                // 自动滚动到末尾
                this.scrollToBottom();
                // 保存超时ID以便跳过时取消
                this.typeTimeoutId = setTimeout(typeChar, speed);
            } else {
                this.isTyping = false;
                this.typeTimeoutId = null;
                // 移除打字状态类并隐藏跳过提示
                this.elements.npcText.classList.remove('typing');
                this.elements.skipHint.classList.remove('visible');
                onComplete && onComplete();
            }
        };
        
        typeChar();
    }
    
    /**
     * 跳过打字效果，直接显示完整文本
     */
    skipTyping() {
        if (!this.isTyping) return;
        
        // 取消当前的打字超时
        if (this.typeTimeoutId) {
            clearTimeout(this.typeTimeoutId);
            this.typeTimeoutId = null;
        }
        
        // 直接显示完整文本
        this.elements.npcText.textContent = this.currentFullText;
        this.isTyping = false;
        
        // 移除打字状态类并隐藏跳过提示
        this.elements.npcText.classList.remove('typing');
        this.elements.skipHint.classList.remove('visible');
        
        // 滚动到底部
        this.scrollToBottom();
        
        // 执行完成回调
        if (this.currentTypeCallback) {
            this.currentTypeCallback();
        }
    }

    /**
     * 滚动到底部
     */
    scrollToBottom() {
        // 使用 requestAnimationFrame 确保在DOM更新后执行
        requestAnimationFrame(() => {
            const textElement = this.elements.npcText;
            // 强制滚动到最底部
            textElement.scrollTop = textElement.scrollHeight - textElement.clientHeight;
            
            // 如果一次不够，再次尝试（确保在复杂布局中也能正确滚动）
            setTimeout(() => {
                textElement.scrollTop = textElement.scrollHeight - textElement.clientHeight;
            }, 10);
        });
    }

    /**
     * 处理继续按钮点击
     * @param {Function} callback - 回调函数
     */
    onContinueClick(callback) {
        this.elements.continueButton.addEventListener('click', () => {
            this.handleTextContinue(callback);
        });
    }

    /**
     * 处理文本继续逻辑
     * @param {Function} callback - 完成回调函数
     */
    handleTextContinue(callback) {
        // 禁用按钮防止重复点击
        this.elements.continueButton.className = 'disabled';
        
        this.currentSegmentIndex++;
        
        if (this.currentSegmentIndex < this.currentTextSegments.length) {
            // 还有更多文本段落，继续显示
            this.showNextTextSegment();
        } else {
            // 所有文本显示完毕，隐藏继续按钮并执行回调
            this.elements.continueButton.className = '';
            callback && callback();
        }
    }

    /**
     * 显示选项
     * @param {Array} options - 选项列表
     * @param {Function} onOptionSelect - 选项选择回调
     */
    showOptions(options, onOptionSelect) {
        // 不再隐藏NPC立绘，让立绘与文本框完全同步
        
        this.elements.optionsContainer.innerHTML = '';
        
        options.forEach((option, index) => {
            const button = document.createElement('button');
            button.className = option.isBack ? 'option-button back-option' : 'option-button';
            button.textContent = option.user;
            
            button.addEventListener('click', () => {
                this.hideOptions();
                onOptionSelect && onOptionSelect(option, index);
            });
            
            this.elements.optionsContainer.appendChild(button);
        });
        
        this.elements.optionsOverlay.style.display = 'flex';
    }

    /**
     * 隐藏选项
     */
    hideOptions() {
        this.elements.optionsOverlay.style.display = 'none';
        // 注意：不在这里显示NPC立绘，让它由showNpcText方法控制
    }

    /**
     * 显示历史对话弹窗
     * @param {Array} history - 历史对话列表
     */
    showHistoryModal(history) {
        this.elements.historyList.innerHTML = '';
        
        history.forEach(item => {
            const div = document.createElement('div');
            div.className = 'history-item';
            
            if (item.startsWith('你：')) {
                div.innerHTML = `<span class="history-user">${item}</span>`;
            } else {
                div.innerHTML = `<span class="history-npc">${item}</span>`;
            }
            
            this.elements.historyList.appendChild(div);
        });
        
        this.elements.historyModal.style.display = 'flex';
        
        // 滚动到底部
        setTimeout(() => {
            this.elements.historyList.scrollTop = this.elements.historyList.scrollHeight;
        }, 100);
    }

    /**
     * 隐藏历史对话弹窗
     */
    hideHistoryModal() {
        this.elements.historyModal.style.display = 'none';
    }

    /**
     * 显示确认对话框
     * @param {string} message - 确认消息
     * @param {Function} onConfirm - 确认回调
     * @param {Function} onCancel - 取消回调
     */
    showConfirmModal(message, onConfirm, onCancel) {
        this.elements.confirmText.textContent = message;
        this.elements.confirmModal.style.display = 'flex';
        
        // 移除之前的事件监听器
        const newYesButton = this.elements.confirmYes.cloneNode(true);
        const newNoButton = this.elements.confirmNo.cloneNode(true);
        this.elements.confirmYes.parentNode.replaceChild(newYesButton, this.elements.confirmYes);
        this.elements.confirmNo.parentNode.replaceChild(newNoButton, this.elements.confirmNo);
        this.elements.confirmYes = newYesButton;
        this.elements.confirmNo = newNoButton;
        
        this.elements.confirmYes.addEventListener('click', () => {
            this.hideConfirmModal();
            onConfirm && onConfirm();
        });
        
        this.elements.confirmNo.addEventListener('click', () => {
            this.hideConfirmModal();
            onCancel && onCancel();
        });
    }

    /**
     * 隐藏确认对话框
     */
    hideConfirmModal() {
        this.elements.confirmModal.style.display = 'none';
    }

    /**
     * 显示成就弹窗
     * @param {string} achievementName - 成就名称
     * @param {Function} onConfirm - 确认回调
     */
    showAchievementModal(achievementName, onConfirm) {
        this.elements.achievementText.textContent = `恭喜您解锁成就！\n【${achievementName}】`;
        this.elements.achievementModal.style.display = 'flex';
        
        // 移除之前的事件监听器
        const newConfirmButton = this.elements.achievementConfirm.cloneNode(true);
        this.elements.achievementConfirm.parentNode.replaceChild(newConfirmButton, this.elements.achievementConfirm);
        this.elements.achievementConfirm = newConfirmButton;
        
        this.elements.achievementConfirm.addEventListener('click', () => {
            this.hideAchievementModal();
            onConfirm && onConfirm();
        });
    }

    /**
     * 隐藏成就弹窗
     */
    hideAchievementModal() {
        this.elements.achievementModal.style.display = 'none';
    }

    /**
     * 绑定开始游戏按钮
     * @param {Function} callback - 回调函数
     */
    onStartGame(callback) {
        this.elements.startGameButton.addEventListener('click', callback);
    }

    /**
     * 绑定退出按钮
     * @param {Function} callback - 回调函数
     */
    onExitGame(callback) {
        this.elements.exitButton.addEventListener('click', callback);
    }

    /**
     * 绑定历史按钮
     * @param {Function} callback - 回调函数
     */
    onShowHistory(callback) {
        this.elements.historyButton.addEventListener('click', callback);
    }

    /**
     * 绑定完成按钮
     * @param {Function} callback - 回调函数
     */
    onCompleteClick(callback) {
        this.elements.completeButton.addEventListener('click', () => {
            this.handleTextComplete(callback);
        });
    }

    /**
     * 处理完成按钮的文本继续逻辑
     * @param {Function} callback - 完成回调函数
     */
    handleTextComplete(callback) {
        // 禁用按钮防止重复点击
        this.elements.completeButton.className = 'disabled';
        
        this.currentSegmentIndex++;
        
        if (this.currentSegmentIndex < this.currentTextSegments.length) {
            // 还有更多文本段落，继续显示
            this.showNextTextSegment();
        } else {
            // 所有文本显示完毕，隐藏完成按钮并执行回调
            this.elements.completeButton.className = '';
            callback && callback();
        }
    }

    /**
     * 重置UI状态
     */
    reset() {
        this.hideOptions();
        this.hideHistoryModal();
        this.hideConfirmModal();
        this.hideAchievementModal();
        this.hideNpcCharacter(); // 重置时隐藏NPC立绘，游戏开始时会重新显示
        this.elements.continueButton.className = '';
        this.elements.completeButton.className = '';
        this.elements.npcText.innerHTML = '';
        this.currentTextSegments = [];
        this.currentSegmentIndex = 0;
        this.currentButtonType = 'continue';
        this.isTyping = false;
        
        // 清理打字相关状态
        if (this.typeTimeoutId) {
            clearTimeout(this.typeTimeoutId);
            this.typeTimeoutId = null;
        }
        this.currentFullText = '';
        this.currentTypeCallback = null;
        this.elements.npcText.style.cursor = 'default';
        this.elements.npcText.classList.remove('typing');
        this.elements.skipHint.classList.remove('visible');
    }
}
