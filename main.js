import { GameBoard, GameBoardOption } from "./game_board";
import * as THREE from 'three';

// 创建场景，全局唯一
const scene = new THREE.Scene();
// 游戏选项
const game_board_option = new GameBoardOption(true, false, false, scene);
// 展示demo内容
const game_board = new GameBoard(game_board_option);


window.setTimeout(function(){
  game_board.build_ai_game_board();
}, 5000);
