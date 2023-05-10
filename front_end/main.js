import { GameBoard } from "./game_board";
import * as THREE from 'three';
import { Controls, GameMode, GameModeMulti, SetGameMode } from "./consts";
import { init } from "./websockets/websocket";



// 展示demo内容
const game_board = new GameBoard();


function build_ai_game_board() {
  game_board.build_ai_game_board();
  // hide buttons
  document.querySelector('.semi-transparent-button-left').style.display = 'none';
  document.querySelector('.semi-transparent-button-right').style.display = 'none';
  document.querySelector('.semi-transparent-info').style.display = 'block';
}

function build_multi_game_board() {
  SetGameMode(GameModeMulti);
  // 连接websocket
  init();
  game_board.build_multi_game_board();
  // hide buttons
  document.querySelector('.semi-transparent-button-left').style.display = 'none';
  document.querySelector('.semi-transparent-button-right').style.display = 'none';
  document.querySelector('.semi-transparent-info').style.display = 'block';
}

document.querySelector('.semi-transparent-button-left').addEventListener('click', build_ai_game_board);
document.querySelector('.semi-transparent-button-right').addEventListener('click', build_multi_game_board);

window.addEventListener("keydown", onDocumentKeyDown, false);
function onDocumentKeyDown(event) {
  var keyCode = event.which;
  console.log(keyCode);
  if (keyCode == 87) {
    Controls.forward = true;
  } else if (keyCode == 83) {
    Controls.backward = true;
  } else if (keyCode == 65) {
    Controls.leftward = true;
  } else if (keyCode == 68) {
    Controls.rightward = true;
  } else if (keyCode == 74) {
    Controls.shoot = true;
  } else if (keyCode == 82) {
    game_board.build_demo_game_board();
    document.querySelector('.semi-transparent-button-left').style.display = 'block';
    document.querySelector('.semi-transparent-button-right').style.display = 'block';
    document.querySelector('.semi-transparent-info').style.display = 'none';
  }
};

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