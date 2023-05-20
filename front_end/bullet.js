import * as THREE from 'three';
import { Colors, GameMode, GameModeAI, GameModeMulti, MapSize, MyFighter, Scene, SetMyFighter } from './consts.js';
import { PlaneHolder } from './fighter.js';
import { reportPosition } from './websockets/websocket.js';

const BulletHolder = []

/**
 * 子弹类
 */
class Bullet {
  /**
   * 构造函数
   * @param {*} position 
   * @param {*} direction 
   * @param {*} uuid 这个子弹所属的飞机的uuid，用于判断命中用，自己的子弹不会命中自己
   */
  constructor(position, direction, uuid) {
    this.uuid = uuid;
    this.bullet_speed = 10;
    this.direction = direction;
    // 建模
    var geom = new THREE.BoxGeometry(20, 20, 20);
    var mat = new THREE.MeshPhongMaterial({
      color: Colors.white,
    });
    var mesh = new THREE.Mesh(geom, mat);
    // 设置位置
    mesh.position.set(position.x, position.y, position.z);
    mesh.rotation.z = Math.random() * Math.PI * 2;
    mesh.rotation.y = Math.random() * Math.PI * 2;
    // 大小
    var s = .5;
    mesh.scale.set(s, s, s);

    this.mesh = mesh;
  }

  /**
   * 每帧子弹信息更新函数
   * @returns 
   */
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
      // 如果命中，就移除ai的飞机
      for (var i = needRemoveIndex.length -1; i >= 0; i--) {
        PlaneHolder.splice(needRemoveIndex[i],1);
      }
    }
    return false;
  }
}

/**
 * 子弹命中后的效果处理函数
 * @param {*} count_down_seconds 
 * @returns 
 */
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