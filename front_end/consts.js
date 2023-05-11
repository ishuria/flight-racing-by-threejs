import * as THREE from 'three';

const Colors = {
	red: 0xf25346,
	white: 0xd8d0d1,
	brown: 0x59332e,
	pink: 0xF5986E,
	brownDark: 0x23190f,
	blue: 0x68c3c0,
};

const Controls = {
	forward: false,
	backward: false,
	leftward: false,
	rightward: false,
	shoot: false
}

const MapSize = 5000

let GameMode = "demo"
const GameModeDemo = "demo"
const GameModeAI = "ai"
const GameModeMulti = "multi"

function SetGameMode(val) {
	GameMode = val;
}

// 创建场景，全局唯一
const Scene = new THREE.Scene();

let MyFighter = null;
function SetMyFighter(newMyFighter) {
	MyFighter = newMyFighter;
}

function clear_info() {
	document.querySelector('.semi-transparent-info').innerHTML = '';
}

export {
	Colors, Controls, MapSize, GameMode, SetGameMode,
	GameModeDemo, GameModeAI, GameModeMulti, Scene,
	MyFighter, SetMyFighter,
	clear_info
};
