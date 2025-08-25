/**
 * 树状结构可视化管理器
 * 负责显示游戏剧情探索的树状结构图
 * 
 * 注意：此功能已被禁用
 * 要重新启用，请：
 * 1. 在 index.html 中取消注释 <script src="scripts/treeVisualization.js"></script>
 * 2. 在 main.css 中取消注释树可视化相关样式
 * 3. 在 gameEngine.js 中取消注释树可视化相关代码
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
        this.depth = 0; // 实际访问深度
        this.indexInLevel = 0; // 在同层中的索引
        this.position = { x: 0, y: 0 }; // 位置将动态计算
    }

    /**
     * 添加子节点
     */
    addChild(childNode) {
        if (!this.children.includes(childNode)) {
            this.children.push(childNode);
            childNode.depth = this.depth + 1;
        }
    }

    /**
     * 设置在同层中的索引
     */
    setIndexInLevel(index) {
        this.indexInLevel = index;
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
        this.levelNodes = new Map(); // depth -> Array of nodes
        
        // 布局参数
        this.layoutConfig = {
            levelSpacing: 55,    // 层级间的垂直间距
            nodeSpacing: 45,     // 同层节点间的水平间距
            startX: 25,          // 起始X位置
            startY: 25,          // 起始Y位置
            nodeRadius: 8,       // 节点半径
            containerPadding: 15 // 容器内边距
        };
        
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
        // 初始viewBox，会根据实际内容动态调整
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

        // 建立父子关系并设置深度
        if (parentSceneId && this.nodes.has(parentSceneId)) {
            const parentNode = this.nodes.get(parentSceneId);
            parentNode.addChild(node);
        } else {
            // 根节点深度为0
            node.depth = 0;
        }

        // 更新层级节点映射
        this.updateLevelNodes();
        
        // 重新计算所有节点位置
        this.calculateLayout();
    }

    /**
     * 更新层级节点映射
     */
    updateLevelNodes() {
        this.levelNodes.clear();
        
        this.nodes.forEach(node => {
            if (!this.levelNodes.has(node.depth)) {
                this.levelNodes.set(node.depth, []);
            }
            this.levelNodes.get(node.depth).push(node);
        });

        // 为每层的节点按添加顺序设置索引
        this.levelNodes.forEach((nodesInLevel, depth) => {
            nodesInLevel.forEach((node, index) => {
                node.setIndexInLevel(index);
            });
        });
    }

    /**
     * 计算所有节点的布局位置
     */
    calculateLayout() {
        if (this.nodes.size === 0) return;

        const config = this.layoutConfig;
        
        this.levelNodes.forEach((nodesInLevel, depth) => {
            const levelWidth = (nodesInLevel.length - 1) * config.nodeSpacing;
            const startX = config.startX - levelWidth / 2; // 居中对齐
            
            nodesInLevel.forEach((node, index) => {
                node.position = {
                    x: startX + index * config.nodeSpacing,
                    y: config.startY + depth * config.levelSpacing
                };
            });
        });

        // 调整viewBox以适应内容
        this.adjustViewBox();
    }

    /**
     * 根据节点位置调整SVG的viewBox
     */
    adjustViewBox() {
        if (this.nodes.size === 0) return;

        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;

        this.nodes.forEach(node => {
            minX = Math.min(minX, node.position.x);
            maxX = Math.max(maxX, node.position.x);
            minY = Math.min(minY, node.position.y);
            maxY = Math.max(maxY, node.position.y);
        });

        // 添加边距
        const padding = this.layoutConfig.containerPadding;
        const nodeRadius = this.layoutConfig.nodeRadius;
        
        const viewBoxX = minX - nodeRadius - padding;
        const viewBoxY = minY - nodeRadius - padding;
        const viewBoxWidth = (maxX - minX) + 2 * nodeRadius + 2 * padding;
        const viewBoxHeight = (maxY - minY) + 2 * nodeRadius + 2 * padding;

        this.svg.setAttribute('viewBox', 
            `${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}`);
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
        circle.setAttribute('r', this.layoutConfig.nodeRadius); // 使用配置中的半径
        circle.setAttribute('class', `tree-node tree-node-${node.status}`);
        
        // 添加场景ID作为数据属性，便于调试
        circle.setAttribute('data-scene-id', node.sceneId);
        circle.setAttribute('data-depth', node.depth);
        circle.setAttribute('data-index', node.indexInLevel);
        
        this.svg.appendChild(circle);
    }

    /**
     * 重置树结构
     */
    reset() {
        this.nodes.clear();
        this.levelNodes.clear();
        this.currentSceneId = null;
        this.svg.innerHTML = '';
        // 重置viewBox
        this.svg.setAttribute('viewBox', '0 0 300 400');
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
            depth: node.depth,
            indexInLevel: node.indexInLevel,
            position: node.position,
            childCount: node.children.length
        }));

        const levelInfo = Array.from(this.levelNodes.entries()).map(([depth, nodes]) => ({
            depth,
            nodeCount: nodes.length,
            nodeIds: nodes.map(n => n.sceneId)
        }));

        return {
            isVisible: this.isVisible,
            currentScene: this.currentSceneId,
            totalNodes: this.nodes.size,
            totalLevels: this.levelNodes.size,
            layoutConfig: this.layoutConfig,
            nodes: nodeInfo,
            levels: levelInfo
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
