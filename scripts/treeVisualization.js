/**
 * 树状结构可视化管理器
 * 负责显示游戏剧情探索的树状结构图
 */

/**
 * 树节点类
 */
class TreeNode {
    constructor(sceneId, parentId = null) {
        this.sceneId = sceneId;
        this.parentId = parentId;
        this.children = [];
        this.status = 'unvisited'; // 'unvisited', 'visited', 'current'
        this.position = this.calculatePosition();
    }

    /**
     * 根据场景ID计算节点位置
     */
    calculatePosition() {
        const match = this.sceneId.match(/scene_(\d+)_(\d+)/);
        if (!match) return { x: 0, y: 0 };
        
        const level = parseInt(match[1]); // x值，决定垂直层级
        const index = parseInt(match[2]); // y值，决定同层水平位置
        
        // 预定义布局参数
        const levelSpacing = 60; // 层级间距
        const nodeSpacing = 50;  // 同层节点间距
        const startX = 30;       // 起始X位置
        const startY = 20;       // 起始Y位置
        
        return {
            x: startX + (level - 1) * levelSpacing,
            y: startY + (index - 1) * nodeSpacing
        };
    }

    /**
     * 添加子节点
     */
    addChild(childNode) {
        if (!this.children.includes(childNode)) {
            this.children.push(childNode);
        }
    }
}

/**
 * 树状结构可视化主类
 */
class TreeVisualization {
    constructor() {
        this.container = null;
        this.svg = null;
        this.nodes = new Map(); // sceneId -> TreeNode
        this.isVisible = false;
        this.currentSceneId = null;
        
        this.init();
    }

    /**
     * 初始化树可视化组件
     */
    init() {
        this.createContainer();
        this.createSVG();
        this.hide(); // 默认隐藏
    }

    /**
     * 创建容器元素
     */
    createContainer() {
        this.container = document.createElement('div');
        this.container.id = 'treeVisualization';
        this.container.className = 'tree-container';
        document.getElementById('gameContainer').appendChild(this.container);
    }

    /**
     * 创建SVG元素
     */
    createSVG() {
        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svg.setAttribute('width', '100%');
        this.svg.setAttribute('height', '100%');
        this.svg.setAttribute('viewBox', '0 0 300 400');
        this.container.appendChild(this.svg);
    }

    /**
     * 显示树可视化
     */
    show() {
        if (!this.isVisible) {
            this.container.style.display = 'block';
            this.isVisible = true;
        }
    }

    /**
     * 隐藏树可视化
     */
    hide() {
        if (this.isVisible) {
            this.container.style.display = 'none';
            this.isVisible = false;
        }
    }

    /**
     * 检查场景是否应该显示树
     */
    shouldShowTree(sceneId) {
        // 主剧情期间显示（scene_x_y, x > 0）
        const match = sceneId.match(/scene_(\d+)_(\d+)/);
        return match && parseInt(match[1]) > 0;
    }

    /**
     * 检查是否为结束场景
     */
    isEndingScene(sceneId) {
        return sceneId.startsWith('ending_');
    }

    /**
     * 更新当前场景
     */
    updateCurrentScene(sceneId, parentSceneId = null) {
        // 检查是否应该显示/隐藏树
        if (this.isEndingScene(sceneId)) {
            this.hide();
            return;
        }

        if (this.shouldShowTree(sceneId)) {
            this.show();
        } else {
            this.hide();
            return;
        }

        // 添加或更新节点
        this.addNode(sceneId, parentSceneId);
        
        // 更新当前节点状态
        this.setCurrentNode(sceneId);
        
        // 重新渲染
        this.render();
    }

    /**
     * 添加节点到树结构
     */
    addNode(sceneId, parentSceneId = null) {
        // 如果节点已存在，跳过
        if (this.nodes.has(sceneId)) {
            return;
        }

        // 创建新节点
        const node = new TreeNode(sceneId, parentSceneId);
        this.nodes.set(sceneId, node);

        // 建立父子关系
        if (parentSceneId && this.nodes.has(parentSceneId)) {
            const parentNode = this.nodes.get(parentSceneId);
            parentNode.addChild(node);
        }
    }

    /**
     * 设置当前节点
     */
    setCurrentNode(sceneId) {
        // 将之前的当前节点设为已访问
        if (this.currentSceneId && this.nodes.has(this.currentSceneId)) {
            this.nodes.get(this.currentSceneId).status = 'visited';
        }

        // 设置新的当前节点
        this.currentSceneId = sceneId;
        if (this.nodes.has(sceneId)) {
            this.nodes.get(sceneId).status = 'current';
        }
    }

    /**
     * 渲染整个树结构
     */
    render() {
        // 清空SVG
        this.svg.innerHTML = '';

        // 渲染连接线
        this.renderEdges();
        
        // 渲染节点
        this.renderNodes();
    }

    /**
     * 渲染连接线
     */
    renderEdges() {
        this.nodes.forEach(node => {
            if (node.parentId && this.nodes.has(node.parentId)) {
                const parentNode = this.nodes.get(node.parentId);
                this.createEdge(parentNode.position, node.position);
            }
        });
    }

    /**
     * 创建连接线
     */
    createEdge(fromPos, toPos) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', fromPos.x);
        line.setAttribute('y1', fromPos.y);
        line.setAttribute('x2', toPos.x);
        line.setAttribute('y2', toPos.y);
        line.setAttribute('class', 'tree-edge');
        this.svg.appendChild(line);
    }

    /**
     * 渲染节点
     */
    renderNodes() {
        this.nodes.forEach(node => {
            this.createNode(node);
        });
    }

    /**
     * 创建节点元素
     */
    createNode(node) {
        // 创建圆形节点
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', node.position.x);
        circle.setAttribute('cy', node.position.y);
        circle.setAttribute('r', '8'); // 节点半径
        circle.setAttribute('class', `tree-node tree-node-${node.status}`);
        
        // 添加场景ID作为数据属性，便于调试
        circle.setAttribute('data-scene-id', node.sceneId);
        
        this.svg.appendChild(circle);
    }

    /**
     * 重置树结构
     */
    reset() {
        this.nodes.clear();
        this.currentSceneId = null;
        this.svg.innerHTML = '';
        this.hide();
    }

    /**
     * 获取树的调试信息
     */
    getDebugInfo() {
        const nodeInfo = Array.from(this.nodes.entries()).map(([sceneId, node]) => ({
            sceneId,
            parentId: node.parentId,
            status: node.status,
            position: node.position,
            childCount: node.children.length
        }));

        return {
            isVisible: this.isVisible,
            currentScene: this.currentSceneId,
            totalNodes: this.nodes.size,
            nodes: nodeInfo
        };
    }
}

/**
 * 树可视化管理器
 * 负责协调树可视化与游戏状态的同步
 */
class TreeVisualizationManager {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.treeViz = new TreeVisualization();
        this.navigationHistory = []; // 记录导航历史以建立父子关系
    }

    /**
     * 场景切换时的处理
     */
    onSceneChange(newSceneId, isBack = false) {
        let parentSceneId = null;

        if (!isBack && this.navigationHistory.length > 0) {
            // 前进时，父节点是当前场景
            parentSceneId = this.navigationHistory[this.navigationHistory.length - 1];
        }

        // 更新导航历史
        if (isBack) {
            // 回退时，移除历史中当前场景之后的记录
            const targetIndex = this.navigationHistory.indexOf(newSceneId);
            if (targetIndex !== -1) {
                this.navigationHistory = this.navigationHistory.slice(0, targetIndex + 1);
            }
        } else {
            // 前进时，添加新场景到历史
            if (!this.navigationHistory.includes(newSceneId)) {
                this.navigationHistory.push(newSceneId);
            }
        }

        // 更新树可视化
        this.treeViz.updateCurrentScene(newSceneId, parentSceneId);
    }

    /**
     * 游戏开始时的处理
     */
    onGameStart(startSceneId) {
        this.navigationHistory = [startSceneId];
        this.treeViz.updateCurrentScene(startSceneId);
    }

    /**
     * 游戏重置时的处理
     */
    onGameReset() {
        this.navigationHistory = [];
        this.treeViz.reset();
    }

    /**
     * 获取调试信息
     */
    getDebugInfo() {
        return {
            navigationHistory: this.navigationHistory,
            treeInfo: this.treeViz.getDebugInfo()
        };
    }
}
