import { GameBoard } from "./game_board";
import { Controls, GameModeAI, GameModeMulti, Scene, SetGameMode } from "./consts";
import { init_websocket } from "./websockets/websocket";

// 游戏面板实例
const game_board = new GameBoard();

/**
 * 创建AI对战界面
 */
function build_ai_game_board() {
  game_board.build_ai_game_board();
  SetGameMode(GameModeAI);
  // 隐藏按键及提示框
  document.querySelector('.semi-transparent-button-left').style.display = 'none';
  document.querySelector('.semi-transparent-button-right').style.display = 'none';
  document.querySelector('.semi-transparent-hint').style.display = 'block';
}

/**
 * 创建联机对战界面
 */
function build_multi_game_board() {
  while (Scene && Scene.children.length > 0) {
    Scene.remove(Scene.children[0]);
  }
  SetGameMode(GameModeMulti);
  // 隐藏按键及提示框
  document.querySelector('.semi-transparent-button-left').style.display = 'none';
  document.querySelector('.semi-transparent-button-right').style.display = 'none';
  document.querySelector('.semi-transparent-hint').style.display = 'block';
  document.querySelector('.semi-transparent-info').innerHTML = 'Connecting Server...';
  // 连接websocket
  init_websocket(game_board);
}

document.querySelector('.semi-transparent-button-left').addEventListener('click', build_ai_game_board);
document.querySelector('.semi-transparent-button-right').addEventListener('click', build_multi_game_board);

// 添加键盘按下事件
window.addEventListener("keydown", onDocumentKeyDown, false);
function onDocumentKeyDown(event) {
  var keyCode = event.which;
  console.log(keyCode);
  if (keyCode == 87) { // 前
    Controls.forward = true;
  } else if (keyCode == 83) { // 后
    Controls.backward = true;
  } else if (keyCode == 65) { // 左
    Controls.leftward = true;
  } else if (keyCode == 68) { // 右
    Controls.rightward = true;
  } else if (keyCode == 74) { // 射击
    Controls.shoot = true;
  } else if (keyCode == 82) { // R
    game_board.build_demo_game_board();
    document.querySelector('.semi-transparent-button-left').style.display = 'block';
    document.querySelector('.semi-transparent-button-right').style.display = 'block';
    document.querySelector('.semi-transparent-hint').style.display = 'none';
  }
};

// 添加键盘抬起事件
window.addEventListener("keyup", onDocumentKeyUp, false);
function onDocumentKeyUp(event) {
  var keyCode = event.which;
  console.log(keyCode);
  if (keyCode == 87) {
    Controls.forward = false;
  } else if (keyCode == 83) {
    Controls.backward = false;
  } else if (keyCode == 65) {
    Controls.leftward = false;
  } else if (keyCode == 68) {
    Controls.rightward = false;
  } else if (keyCode == 74) {
    Controls.shoot = false;
  } else if (keyCode == 82) {

  }
};

export { game_board }