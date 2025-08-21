/**
 * Safari浏览器兼容性脚本
 * 解决Safari中viewport高度的问题
 */

(function() {
    'use strict';
    
    // 检测是否为Safari浏览器
    function isSafari() {
        return /Safari/.test(navigator.userAgent) && /Apple Computer/.test(navigator.vendor);
    }
    
    // 检测是否为iOS设备
    function isIOS() {
        return /iPad|iPhone|iPod/.test(navigator.userAgent);
    }
    
    // 设置CSS自定义属性来处理viewport高度
    function setViewportHeight() {
        // 获取实际的viewport高度
        const vh = window.innerHeight * 0.01;
        // 设置CSS自定义属性
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }
    
    // 防止iOS Safari的橡皮筋效果
    function preventBounce() {
        if (isIOS()) {
            document.addEventListener('touchmove', function(event) {
                // 检查是否为游戏容器内的滚动
                const gameContainer = document.getElementById('gameContainer');
                const target = event.target;
                
                // 如果不是在可滚动元素内，阻止默认行为
                if (!target.closest('#npcText') && 
                    !target.closest('#historyList') && 
                    !target.closest('#optionsContainer')) {
                    event.preventDefault();
                }
            }, { passive: false });
        }
    }
    
    // 处理Safari地址栏隐藏/显示
    function handleSafariResize() {
        if (isSafari() || isIOS()) {
            let resizeTimer;
            
            function handleResize() {
                clearTimeout(resizeTimer);
                resizeTimer = setTimeout(() => {
                    setViewportHeight();
                    
                    // 强制重新渲染游戏容器
                    const gameContainer = document.getElementById('gameContainer');
                    if (gameContainer) {
                        gameContainer.style.height = `${window.innerHeight}px`;
                    }
                }, 100);
            }
            
            window.addEventListener('resize', handleResize);
            window.addEventListener('orientationchange', () => {
                setTimeout(handleResize, 500);
            });
        }
    }
    
    // 初始化函数
    function init() {
        setViewportHeight();
        preventBounce();
        handleSafariResize();
        
        // 页面加载完成后再次设置高度
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', setViewportHeight);
        }
        
        // 页面完全加载后再次检查
        window.addEventListener('load', () => {
            setTimeout(setViewportHeight, 100);
        });
    }
    
    // 如果是Safari或iOS，执行初始化
    if (isSafari() || isIOS()) {
        init();
    }
    
})();
