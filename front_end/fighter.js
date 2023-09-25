import * as THREE from 'three';
import { Vector3 } from 'three';
import { Bullet, BulletHolder } from './bullet.js';
import { Colors, GameMode, GameModeMulti, MapSize } from './consts.js';
import { Controls } from './consts.js';
import { reportPosition, reportBullet } from './websockets/websocket.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

/**
 * GLTFLoader，加载外部模型用
 * 目前还用不上
 */
const gltfLoader = new GLTFLoader();

/**
 * 保存场景里所有飞机记录
 */
const PlaneHolder = []

/**
 * 飞机类
 */
class Plane {
  constructor(scene, obit_height, is_user_control, camera, is_ai_control, x, z, uuid) {
    // 是否被击中
    this.is_hit = false;
    // 标记飞机属于哪位玩家
    this.uuid = uuid;
    this.scene = scene;
    this.camera = camera;
    this.obit_height = obit_height;
    this.fighter_speed = 5;
    this.is_user_control = is_user_control;
    // 是否由电脑操作
    this.is_ai_control = is_ai_control;
    // 上次电脑操作改变飞行方向的时间戳
    // 避免电脑频繁改变方向影响游玩体验
    this.ai_last_move_timestamp = 0;
    // 定义电脑每次向某个方向飞行的时长
    this.ai_move_period_ms = 0;
    // 电脑操作时的控制状态
    this.ai_control = {
      forward: false,
      backward: false,
      leftward: false,
      rightward: false,
      shoot: false,
    };

    // 每秒最多发射的子弹数目
    this.shoot_cooldown = 0.1;
    // 上次按下射击按钮的时间戳，避免频繁射击，增强手感
    this.last_shoot_timestamp = 0;

    // 外部模型加载代码，目前还用不上，仅供参考
    // let fighter;
    // // Load a glTF resource
    // loader.load(
    //   // resource URL
    //   './assets/F-16.glb',
    //   // called when the resource is loaded
    //   function (gltf) {
    //     console.log(gltf)
    //     fighter = gltf.scene.children[0];
    //     // gltf.scene.position.x = 0;
    //     // gltf.scene.position.y = 100;
    //     // gltf.scene.position.z = 0;
    //     // gltf.scene.scale.set(10, 10, 10);
    //     fighter.scale.set(10, 10, 10);
    //     // 初始位置
    //     fighter.position.set(x, 100, z);
    //   },
    //   // called while loading is progressing
    //   function (xhr) {
    //     console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    //   },
    //   // called when loading has errors
    //   function (error) {
    //     console.log('An error happened');
    //   }
    // );
    // this.mesh = fighter;

    this.mesh = new THREE.Object3D();

    // 建模
    var geomCockpit = new THREE.BoxGeometry(60, 50, 50, 1, 1, 1);
    var matCockpit = new THREE.MeshPhongMaterial({ color: Colors.red, shading: THREE.FlatShading });
    var cockpit = new THREE.Mesh(geomCockpit, matCockpit);
    cockpit.castShadow = true;
    cockpit.receiveShadow = true;
    this.mesh.add(cockpit);

    var geomEngine = new THREE.BoxGeometry(20, 50, 50, 1, 1, 1);
    var matEngine = new THREE.MeshPhongMaterial({ color: Colors.white, shading: THREE.FlatShading });
    var engine = new THREE.Mesh(geomEngine, matEngine);
    engine.position.x = 40;
    engine.castShadow = true;
    engine.receiveShadow = true;
    this.mesh.add(engine);

    var geomTailPlane = new THREE.BoxGeometry(15, 20, 5, 1, 1, 1);
    var matTailPlane = new THREE.MeshPhongMaterial({ color: Colors.red, shading: THREE.FlatShading });
    var tailPlane = new THREE.Mesh(geomTailPlane, matTailPlane);
    tailPlane.position.set(-35, 25, 0);
    tailPlane.castShadow = true;
    tailPlane.receiveShadow = true;
    this.mesh.add(tailPlane);

    var geomSideWing = new THREE.BoxGeometry(40, 8, 150, 1, 1, 1);
    var matSideWing = new THREE.MeshPhongMaterial({ color: Colors.red, shading: THREE.FlatShading });
    var sideWing = new THREE.Mesh(geomSideWing, matSideWing);
    sideWing.castShadow = true;
    sideWing.receiveShadow = true;
    this.mesh.add(sideWing);

    var geomPropeller = new THREE.BoxGeometry(20, 10, 10, 1, 1, 1);
    var matPropeller = new THREE.MeshPhongMaterial({ color: Colors.brown, shading: THREE.FlatShading });
    this.propeller = new THREE.Mesh(geomPropeller, matPropeller);
    this.propeller.castShadow = true;
    this.propeller.receiveShadow = true;

    var geomBlade = new THREE.BoxGeometry(1, 100, 20, 1, 1, 1);
    var matBlade = new THREE.MeshPhongMaterial({ color: Colors.brownDark, shading: THREE.FlatShading });

    var blade = new THREE.Mesh(geomBlade, matBlade);
    blade.position.set(8, 0, 0);
    blade.castShadow = true;
    blade.receiveShadow = true;
    this.propeller.add(blade);
    this.propeller.position.set(50, 0, 0);
    this.mesh.add(this.propeller);

    this.mesh.scale.set(.25, .25, .25);

    // 初始位置
    this.mesh.position.set(x, this.obit_height, z);

    // 机身的相对朝向
    this.respective_look_at_direction = new Vector3(0, 0, -1);

    PlaneHolder.push(this);
  }

  /**
   * 每帧更新飞机信息
   * @returns 
   */
  update() {
    if (this.is_user_control) {
      this.update_user();
      return;
    }
    if (this.is_ai_control) {
      this.update_ai();
      return;
    }
    this.update_multi();
  }

  /**
   * 更新用户自己的飞机信息
   * @returns 
   */
  update_user() {
    if (this.is_hit) {
      return;
    }
    // 记录下位置是否有变更
    let is_position_changed = false;
    if (Controls.forward) {
      this.mesh.position.z -= this.fighter_speed;
      is_position_changed = true;
    }
    if (Controls.backward) {
      this.mesh.position.z += this.fighter_speed;
      is_position_changed = true;
    }
    if (Controls.leftward) {
      this.mesh.position.x -= this.fighter_speed;
      is_position_changed = true;
    }
    if (Controls.rightward) {
      this.mesh.position.x += this.fighter_speed;
      is_position_changed = true;
    }
    // 计算飞机朝向
    this.respective_look_at_direction = get_shoot_direction(Controls, this.respective_look_at_direction);
    let look_at_direction = get_look_at_direction(Controls, this.mesh.position, this.respective_look_at_direction);
    this.mesh.lookAt(look_at_direction.x, look_at_direction.y, look_at_direction.z);

    // 处理射击事件
    if (Controls.shoot) {
      const currentDate = new Date();
      const timestamp = currentDate.getTime();
      if (this.last_shoot_timestamp == 0 || timestamp - this.last_shoot_timestamp >= this.shoot_cooldown * 1000) {
        let b = new Bullet(this.mesh.position, this.respective_look_at_direction, this.uuid);
        this.scene.add(b.mesh);
        BulletHolder.push(b);
        this.last_shoot_timestamp = timestamp;
        if (GameMode === GameModeMulti) {
          reportBullet(this.mesh.position.x, this.mesh.position.y, this.mesh.position.z,
            this.respective_look_at_direction.x, this.respective_look_at_direction.y, this.respective_look_at_direction.z,
            this.uuid);
        }
      }
    }
    // 处理螺旋桨旋转
    this.propeller.rotation.x += 0.3;

    this.camera.position.x = this.mesh.position.x;
    this.camera.position.y = this.mesh.position.y + 200;
    this.camera.position.z = this.mesh.position.z + 200;
    this.camera.lookAt(this.mesh.position);

    if (GameMode === GameModeMulti && is_position_changed) {
      reportPosition(this.mesh.position.x, this.mesh.position.y, this.mesh.position.z, look_at_direction.x, look_at_direction.y, look_at_direction.z);
    }
  }

  /**
   * ai的处理函数
   */
  update_ai() {
    const currentDate = new Date();
    const timestamp = currentDate.getTime();
    // 随机方向，ai的飞行模式应该具有一定连续性，不能每一帧都变化，至少保持
    if (timestamp - this.ai_last_move_timestamp > this.ai_move_period_ms) {
      this.ai_control = {
        forward: Math.random() < 0.5,
        backward: Math.random() < 0.5,
        leftward: Math.random() < 0.5,
        rightward: Math.random() < 0.5,
      }
      this.ai_last_move_timestamp = timestamp;
      this.ai_move_period_ms = getRandomInt(3000);
      if (this.ai_move_period_ms < 1000) {
        this.ai_move_period_ms = 1000;
      }
    }
    this.ai_control.shoot = Math.random() < 0.5

    if (this.ai_control.forward) {
      this.mesh.position.z -= this.fighter_speed;
      this.check_border();
    }
    if (this.ai_control.backward) {
      this.mesh.position.z += this.fighter_speed;
      this.check_border();
    }
    if (this.ai_control.leftward) {
      this.mesh.position.x -= this.fighter_speed;
      this.check_border();
    }
    if (this.ai_control.rightward) {
      this.mesh.position.x += this.fighter_speed;
      this.check_border();
    }
    // 处理ai射击事件
    if (this.ai_control.shoot) {
      const currentDate = new Date();
      const timestamp = currentDate.getTime();
      if (this.last_shoot_timestamp == 0 || timestamp - this.last_shoot_timestamp >= this.shoot_cooldown * 1000) {
        let b = new Bullet(this.mesh.position, get_shoot_direction(this.ai_control, this.respective_look_at_direction), this.uuid);
        this.scene.add(b.mesh);
        BulletHolder.push(b);
        this.last_shoot_timestamp = timestamp;
      }
    }

    let look_point = get_look_at_direction(this.ai_control, this.mesh.position, this.respective_look_at_direction);
    if (look_point) {
      this.mesh.lookAt(look_point.x, look_point.y, look_point.z);
    }

    this.propeller.rotation.x += 0.3;
  }

  /**
   * 更新多人游戏中，其他玩家飞机螺旋桨旋转
   */
  update_multi() {
    this.propeller.rotation.x += 0.3;
  }

  /**
   * 检查用户是否超出了地图大小限制
   */
  check_border() {
    if (this.mesh.position.x > MapSize / 2) {
      this.mesh.position.x = MapSize / 2;
    }
    if (this.mesh.position.x < -MapSize / 2) {
      this.mesh.position.x = -MapSize / 2;
    }
    if (this.mesh.position.z > MapSize / 2) {
      this.mesh.position.z = MapSize / 2;
    }
    if (this.mesh.position.z < -MapSize / 2) {
      this.mesh.position.z = -MapSize / 2;
    }
  }
}

/**
 * 根据飞机的移动方向决定子弹发射方向
 * @returns 
 */
function get_shoot_direction(controls, respective_look_at_direction) {
  if (controls.forward && controls.leftward) {
    return new THREE.Vector3(-0.7, 0, -0.7)
  }
  if (controls.forward && controls.rightward) {
    return new THREE.Vector3(0.7, 0, -0.7)
  }
  if (controls.forward) {
    return new THREE.Vector3(0, 0, -1)
  }
  if (controls.backward && controls.leftward) {
    return new THREE.Vector3(-0.7, 0, 0.7)
  }
  if (controls.backward && controls.rightward) {
    return new THREE.Vector3(0.7, 0, 0.7)
  }
  if (controls.backward) {
    return new THREE.Vector3(0, 0, 1)
  }
  if (controls.leftward) {
    return new THREE.Vector3(-1, 0, 0)
  }
  if (controls.rightward) {
    return new THREE.Vector3(1, 0, 0)
  }
  return respective_look_at_direction;
}


/**
 * 根据飞机的移动方向决定飞机朝向
 * @returns 
 */
function get_look_at_direction(controls, position, respective_look_at_direction) {
  if (controls.forward && controls.leftward) {
    return position.clone().add(new Vector3(1, 0, -1));
  }
  if (controls.forward && controls.rightward) {
    return position.clone().add(new Vector3(1, 0, 1));
  }
  if (controls.forward) {
    return position.clone().add(new Vector3(1, 0, 0));
  }
  if (controls.backward && controls.leftward) {
    return position.clone().add(new Vector3(-1, 0, -1));
  }
  if (controls.backward && controls.rightward) {
    return position.clone().add(new Vector3(-1, 0, 1));
  }
  if (controls.backward) {
    return position.clone().add(new Vector3(-1, 0, 0));
  }
  if (controls.leftward) {
    return position.clone().add(new Vector3(0, 0, -1));
  }
  if (controls.rightward) {
    return position.clone().add(new Vector3(0, 0, 1));
  }
  var axis = new THREE.Vector3(0, 1, 0);
  var angle = -Math.PI / 2;
  let dump = respective_look_at_direction.clone()
  dump.applyAxisAngle(axis, angle);
  return position.clone().add(dump);
}

/**
 * 随机飞机出生点用的随机函数
 * @param {*} max 
 * @returns 
 */
function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

export { Plane, PlaneHolder };