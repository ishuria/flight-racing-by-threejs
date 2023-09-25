import * as THREE from 'three';

/**
 * 常数定义
 */

/**
 * 预定义颜色
 */
const Colors = {
	red: 0xf25346,
	white: 0xd8d0d1,
	brown: 0x59332e,
	pink: 0xF5986E,
	brownDark: 0x23190f,
	blue: 0x68c3c0,
};

/**
 * 全局唯一的游戏控制器
 * 代表用户在某时刻的控制状态
 */
const Controls = {
	forward: false,
	backward: false,
	leftward: false,
	rightward: false,
	shoot: false
}

/**
 * 地图是一个正方形区域
 * 这里定义了正方形区域的边长
 */
const MapSize = 10000

// 游戏模式
let GameMode = "demo"
// 演示模式
const GameModeDemo = "demo"
// 人机对战模式
const GameModeAI = "ai"
// 联机对战模式
const GameModeMulti = "multi"

/**
 * 设置游戏模式
 * @param {*} val 
 */
function SetGameMode(val) {
	GameMode = val;
}

/**
 * three.js用的场景变量
 * 全局唯一
 */
const Scene = new THREE.Scene();

/**
 * 用户控制的飞机
 * 全局唯一
 */
let MyFighter = null;

/**
 * 设置自机
 * @param {*} newMyFighter 
 */
function SetMyFighter(newMyFighter) {
	MyFighter = newMyFighter;
}

/**
 * 清除提示信息
 */
function clearInfo() {
	document.querySelector('.semi-transparent-info').innerHTML = '';
}

export {
	Colors, Controls, MapSize, GameMode, SetGameMode,
	GameModeDemo, GameModeAI, GameModeMulti, Scene,
	MyFighter, SetMyFighter,
	clearInfo
};
