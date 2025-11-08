/**
 * 游戏主入口文件
 * 负责初始化和启动游戏
 */

// 全局游戏引擎实例
let gameEngine = null;

/**
 * 获取站点名称参数
 * 可以通过URL参数或默认值获取
 */
function getSiteName() {
    // 检查URL参数
    const urlParams = new URLSearchParams(window.location.search);
    const siteFromUrl = urlParams.get('site');
    if (siteFromUrl) {
        return siteFromUrl;
    }
    
    // 默认值
    return 'sample';
}

/**
 * 页面加载完成后初始化游戏
 */
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // 隐藏游戏容器
        const gameContainer = document.getElementById('gameContainer');
        if (gameContainer) {
            gameContainer.style.display = 'none';
        }
        
        // 显示加载提示
        showLoadingMessage();
        
        // 获取站点名称
        const siteName = getSiteName();
        console.log('正在加载站点:', siteName);
        
        // 创建游戏引擎实例
        gameEngine = new GameEngine(siteName);
        
        // 初始化游戏
        await gameEngine.init();
        
        // 隐藏加载提示
        hideLoadingMessage();
        
        // 显示游戏容器
        if (gameContainer) {
            gameContainer.style.display = 'block';
        }
        
        console.log('游戏准备就绪');
        
    } catch (error) {
        console.error('游戏启动失败:', error);
        showErrorMessage('游戏加载失败，请刷新页面重试');
    }
});

/**
 * 显示加载提示
 */
function showLoadingMessage() {
    const loadingDiv = document.getElementById('loadingMessage');
    if (loadingDiv) {
        loadingDiv.classList.add('visible');
    }
}

/**
 * 隐藏加载提示
 */
function hideLoadingMessage() {
    const loadingDiv = document.getElementById('loadingMessage');
    if (loadingDiv) {
        loadingDiv.classList.remove('visible');
    }
}

/**
 * 显示错误消息
 * @param {string} message - 错误消息
 */
function showErrorMessage(message) {
    hideLoadingMessage();
    
    const errorDiv = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    const reloadButton = document.getElementById('reloadButton');
    
    if (errorDiv && errorText) {
        errorText.textContent = message;
        errorDiv.classList.add('visible');
        
        if (reloadButton) {
            reloadButton.onclick = () => window.location.reload();
        }
    }
}

/**
 * 处理页面可见性变化
 * 当页面变为不可见时暂停，变为可见时恢复
 */
document.addEventListener('visibilitychange', () => {
    if (gameEngine && gameEngine.isReady()) {
        if (document.hidden) {
            // 页面隐藏时的处理（可以添加暂停逻辑）
            console.log('游戏暂停');
        } else {
            // 页面显示时的处理（可以添加恢复逻辑）
            console.log('游戏恢复');
        }
    }
});

/**
 * 处理页面尺寸变化
 */
window.addEventListener('resize', () => {
    // 在移动设备上，当虚拟键盘出现时可能需要调整布局
    // 这里可以添加相应的处理逻辑
});

/**
 * 处理页面卸载
 */
window.addEventListener('beforeunload', () => {
    // 可以在这里保存游戏状态到本地存储
    if (gameEngine && gameEngine.isReady()) {
        console.log('页面即将关闭，游戏状态:', gameEngine.getGameInfo());
    }
});

/**
 * 错误处理
 */
window.addEventListener('error', (event) => {
    console.error('全局错误:', event.error);
    
    // 如果是游戏运行时错误，显示友好的错误提示
    if (gameEngine) {
        showErrorMessage('游戏运行出现问题，请刷新页面重试');
    }
});

/**
 * Promise 错误处理
 */
window.addEventListener('unhandledrejection', (event) => {
    console.error('未处理的 Promise 错误:', event.reason);
    event.preventDefault(); // 阻止默认的错误提示
});

/**
 * 调试功能（仅在开发环境使用）
 */
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    // 添加调试快捷键
    document.addEventListener('keydown', (event) => {
        if (event.ctrlKey && event.shiftKey) {
            switch (event.key) {
                case 'D':
                    // Ctrl+Shift+D: 显示调试信息
                    if (gameEngine && gameEngine.isReady()) {
                        console.log('游戏调试信息:', gameEngine.getGameInfo());
                    }
                    break;
                case 'R':
                    // Ctrl+Shift+R: 重置游戏
                    if (gameEngine && gameEngine.isReady()) {
                        gameEngine.returnToStart();
                        console.log('游戏已重置');
                    }
                    break;
            }
        }
    });
    
    // 将游戏引擎暴露到全局作用域，方便调试
    window.debugGameEngine = () => gameEngine;
}

/**
 * 服务工作线程注册（用于离线支持，可选）
 */
if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            // 如果需要离线支持，可以注册 service worker
            // const registration = await navigator.serviceWorker.register('./sw.js');
            // console.log('ServiceWorker 注册成功:', registration);
        } catch (error) {
            console.log('ServiceWorker 注册失败:', error);
        }
    });
}
