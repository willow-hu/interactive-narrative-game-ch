/**
 * 游戏配置文件
 * 可以在这里设置当前要加载的站点
 */

// 方式1: 设置全局配置
window.GAME_CONFIG = {
    siteName: 'twin_pagoda',  // 可以改为其他站点名称
    
    // 背景图切换映射配置
    // 格式: 背景图文件名 -> 对应的场景列表
    backgroundMapping: {
        'twin_pagoda': {

            'ruin.png': ['scene_3_1', 'scene_6_1'],
            'pagoda.png': ['scene_4_1', 'scene_4_4', 'scene_7_1', 'scene_9_1', 'scene_9_2'],
            'columns.png': ['scene_6_2', 'scene_10_1', 'scene_10_2'],
            'iron_top.png': ['scene_4_3', 'scene_8_1']
        }
        // 其他站点的背景映射可以在这里添加
        // 'other_site': {
        //     'special_bg.png': ['scene_1_1', 'scene_2_1']
        // }
    }
};

// 方式2: 也可以通过URL参数设置
// 例如: index.html?site=twin_pagoda

/**
 * 站点配置说明：
 * 
 * 要添加新站点，需要：
 * 1. 在 game_scripts/ 文件夹中添加 {站点名}.json 脚本文件
 * 2. 在 imgs/ 文件夹中创建 {站点名}/ 文件夹
 * 3. 在站点文件夹中放入 bg.png 和 npc.png 图片
 * 4. 修改此文件中的 siteName 或使用URL参数
 * 
 * 例如添加新站点 'temple':
 * - game_scripts/temple.json
 * - imgs/temple/bg.png
 * - imgs/temple/npc.png
 * - 设置 siteName: 'temple'
 */
