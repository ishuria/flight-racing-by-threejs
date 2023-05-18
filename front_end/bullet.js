import * as THREE from 'three';
import { Colors, GameMode, GameModeAI, GameModeMulti, MapSize, MyFighter, Scene, SetMyFighter } from './consts.js';
import { PlaneHolder } from './fighter.js';
import { reportPosition } from './websockets/websocket.js';

const BulletHolder = []

class Bullet {
  constructor(position, direction, uuid) {
    this.uuid = uuid;
    this.bullet_speed = 10;
    this.direction = direction;
    // create a cube geometry;
    // this shape will be duplicated to create the cloud
    var geom = new THREE.BoxGeometry(20, 20, 20);

    // create a material; a simple white material will do the trick
    var mat = new THREE.MeshPhongMaterial({
      color: Colors.white,
    });
    // create the mesh by cloning the geometry
    var mesh = new THREE.Mesh(geom, mat);

    // set the position and the rotation of each cube randomly
    // set the position and the rotation of each cube randomly
    mesh.position.set(position.x, position.y, position.z);
    mesh.rotation.z = Math.random() * Math.PI * 2;
    mesh.rotation.y = Math.random() * Math.PI * 2;

    // set the size of the cube randomly
    var s = .5;
    mesh.scale.set(s, s, s);

    // allow each cube to cast and to receive shadows
    // mesh.castShadow = true;
    // mesh.receiveShadow = true;
    this.mesh = mesh;
  }
  update() {
    this.mesh.position.x += this.direction.x * this.bullet_speed;
    this.mesh.position.y += this.direction.y * this.bullet_speed;
    this.mesh.position.z += this.direction.z * this.bullet_speed;
    // 子弹越界后从内存中消除
    if (Math.abs(this.mesh.position.x) > MapSize / 2 || Math.abs(this.mesh.position.z) > MapSize / 2) {
      Scene.remove(this.mesh);
      this.mesh.geometry.dispose();
      this.mesh.material.dispose();
      return true;
    }
    // 子弹检测命中
    // 检测自机与子弹的碰撞
    if (MyFighter && !MyFighter.is_hit && MyFighter.mesh.position.distanceTo(this.mesh.position) <= 25 && this.uuid != MyFighter.uuid) {
      console.log('you were hit');
      // document.querySelector('.semi-transparent-info')
      post_hit(3);
      MyFighter.is_hit = true;
      // remove mesh from scene
      Scene.remove(MyFighter.mesh);
    }
    // 检测ai游戏中，自机子弹是否命中ai
    if (GameMode === GameModeAI){
      let needRemoveIndex = [];
      for (let fighterIndex = 0; fighterIndex < PlaneHolder.length; fighterIndex++) {
        const fighter = PlaneHolder[fighterIndex];
        if (fighter && !fighter.is_hit && fighter.mesh.position.distanceTo(this.mesh.position) <= 25 && this.uuid != fighter.uuid) {
          fighter.is_hit = true;
          Scene.remove(fighter.mesh);
          needRemoveIndex.push(fighterIndex);
        }
      }
      for (var i = needRemoveIndex.length -1; i >= 0; i--) {
        PlaneHolder.splice(needRemoveIndex[i],1);
      }
    }
    return false;
  }
}

function post_hit(count_down_seconds) {
  document.querySelector('.semi-transparent-info').innerHTML = 'You were hit. Wait for ' + count_down_seconds + ' seconds to rejoin the game.';
  if (count_down_seconds === 0) {
    document.querySelector('.semi-transparent-info').innerHTML = '';
    // 重建自机
    MyFighter.is_hit = false;
    let x = Math.floor((Math.random() * (MapSize / 2)) + 1);
    let z = Math.floor((Math.random() * (MapSize / 2)) + 1);
    MyFighter.mesh.position.x = x;
    MyFighter.mesh.position.z = z;
    Scene.add(MyFighter.mesh);

    if (GameMode === GameModeMulti) {
      let look_at = MyFighter.mesh.position.clone().add(new THREE.Vector3(1, 0, 0))
      reportPosition(MyFighter.mesh.position.x, MyFighter.mesh.position.y, MyFighter.mesh.position.z,
        look_at.x, look_at.y, look_at.z);
    }

    return;
  }
  setTimeout(post_hit.bind(null, count_down_seconds - 1), 1000);
}

export { Bullet, BulletHolder };