import { BulletHolder } from "../bullet";
import { Plane, PlaneHolder } from "../fighter";

let uuid = "";
let Socket = null;

function init() {
  // Create WebSocket connection.
  Socket = new WebSocket("ws://localhost:8027/web3d/ws");

  // Connection opened
  Socket.addEventListener("open", (event) => {
    // socket.send("Hello Server!");
  });

  // Listen for messages
  Socket.addEventListener("message", messageHandler);
}

let messageHandler = function (event) {
  console.log("Message from server ", event);
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
}

let bulletHandler = function (socket, data) {
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
      myPlane.scene.add(new_plane.mesh);
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

export { init, reportPosition, uuid };