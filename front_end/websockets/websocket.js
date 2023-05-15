
import { Scene } from "../consts";
import { Bullet, BulletHolder } from "../bullet";
import { Plane, PlaneHolder } from "../fighter";
import * as THREE from 'three';
import { game_board } from "../main";

let uuid = "";
let Socket = null;

function init_websocket() {
  // Create WebSocket connection.
  Socket = new WebSocket("ws://106.14.121.124/web3d/ws");

  // Connection opened
  Socket.addEventListener("open", (event) => {
    // socket.send("Hello Server!");
    document.querySelector('.semi-transparent-info').innerHTML = 'Connect server success';
    setTimeout(() => {
      document.querySelector('.semi-transparent-info').innerHTML = 'Waiting for dispatching uuid...';
    }, 1000);
  });

  // Listen for messages
  Socket.addEventListener("message", messageHandler);
}

let messageHandler = function (event) {
  // console.log("Message from server ", event);
  let data = JSON.parse(event.data)
  switch (data.message_type) {
    case 'ping':
      pingHandler(Socket, data)
      break;
    case 'uuid':
      uuidHandler(Socket, data)
      break;
    case 'bullet':
      bulletHandler(Socket, data)
      break;
    case 'player':
      playerHandler(Socket, data)
      break;
    default:
      console.log('unknown message type: ' + data.messageType);
  }
}

let pingHandler = function (socket, data) {
  socket.send(JSON.stringify({
    "message_type": "pong",
  }));
}

let uuidHandler = function (socket, data) {
  console.log('setting uuid: ' + data.uuid);
  uuid = data.uuid;
  game_board.build_multi_game_board();
  setTimeout(() => {
    document.querySelector('.semi-transparent-info').innerHTML = 'Successfully get uuid from server';
  }, 1000);
  setTimeout(() => {
    document.querySelector('.semi-transparent-info').innerHTML = '';
  }, 2000);
}

let bulletHandler = function (socket, data) {
    // 把服务器下发的玩家坐标列表和本地的对比
    let bullet = JSON.parse(data.text)
    if (bullet.uuid === uuid){
      // 是自己生成的子弹，不处理
      return;
    }
    let b = new Bullet(new THREE.Vector3( bullet.x, bullet.y, bullet.z ), new THREE.Vector3( bullet.direction_x, bullet.direction_y, bullet.direction_z ), bullet.uuid);
    Scene.add(b.mesh);
    BulletHolder.push(b);
}

let playerHandler = function (socket, data) {
  // 把服务器下发的玩家坐标列表和本地的对比
  let players = JSON.parse(data.text)
  // 找到我自己
  let myPlane = null;
  PlaneHolder.forEach(localPlayer => {
    if (localPlayer.uuid == uuid) {
      myPlane = localPlayer;
    }
  });
  // 我自己都没有，肯定有问题，直接返回
  if (myPlane === null) {
    return;
  }

  players.forEach(player => {
    // 自己的位置不用更新
    if (player.uuid === uuid) {
      return;
    }
    let isInPlaneHolder = false;
    PlaneHolder.forEach(localPlayer => {
      if (localPlayer.uuid === player.uuid) {
        isInPlaneHolder = true;
        // 更新位置
        localPlayer.mesh.position.set(player.x, localPlayer.obit_height, player.z);
        localPlayer.mesh.lookAt(player.look_at_x, player.look_at_y, player.look_at_z);
      }
    });
    if (!isInPlaneHolder) {
      let new_plane = new Plane(myPlane.scene, 100, false, myPlane.camera, false, player.x, player.z, player.uuid);
      PlaneHolder.push(new_plane);
      Scene.add(new_plane.mesh);
    }
  });

}

let reportPosition = function (x, y, z, look_at_x, look_at_y, look_at_z) {
  let message = {
    "message_type": "position",
    "uuid": uuid,
    "text": JSON.stringify({ "x": x, "y": y, "z": z, "look_at_x": look_at_x, "look_at_y": look_at_y, "look_at_z": look_at_z, "uuid": uuid }),
  }
  Socket.send(JSON.stringify(message))
}

let reportBullet = function (x, y, z, direction_x, direction_y, direction_z, bullet_uuid) {
  let message = {
    "message_type": "bullet",
    "uuid": uuid,
    "text": JSON.stringify({ "x": x, "y": y, "z": z, "direction_x": direction_x, "direction_y": direction_y, "direction_z": direction_z, "uuid": bullet_uuid }),
  }
  Socket.send(JSON.stringify(message))
}

export { init_websocket, reportPosition, uuid, reportBullet };