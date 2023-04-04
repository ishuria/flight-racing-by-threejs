import * as THREE from 'three';
import { Vector3 } from 'three';
import { Bullet, BulletHolder } from './bullet.js';
import { Colors, MapSize } from './consts.js';
import { Controls } from './consts.js';

/**
 * 保存场景里所有飞机记录
 */
const PlaneHolder = []



/**
 * 飞机
 * 用户控制的、ai控制的、其他用户控制的
 */
class Plane {
  constructor(scene, obit_height, is_user_control, camera, is_ai_control) {
    this.scene = scene;
    this.camera = camera;
    this.obit_height = obit_height;
    this.fighter_speed = 5;
    this.is_user_control = is_user_control;
    // ai参数
    this.is_ai_control = is_ai_control;
    // 上次ai改变方向的时间戳
    this.ai_last_move_timestamp = 0;
    // 需要飞多久
    this.ai_move_period_ms = 0;
    // ai控制器
    this.ai_control = {
      forward: false,
      backward: false,
      leftward: false,
      rightward: false,
      shoot:false,
    };



    // 每秒最多发射一枚子弹
    this.shoot_cooldown = 0.1;
    this.last_shoot_timestamp = 0;


    this.mesh = new THREE.Object3D();

    // Create the cabin
    var geomCockpit = new THREE.BoxGeometry(60, 50, 50, 1, 1, 1);
    var matCockpit = new THREE.MeshPhongMaterial({ color: Colors.red, shading: THREE.FlatShading });
    var cockpit = new THREE.Mesh(geomCockpit, matCockpit);
    cockpit.castShadow = true;
    cockpit.receiveShadow = true;
    this.mesh.add(cockpit);

    // Create the engine
    var geomEngine = new THREE.BoxGeometry(20, 50, 50, 1, 1, 1);
    var matEngine = new THREE.MeshPhongMaterial({ color: Colors.white, shading: THREE.FlatShading });
    var engine = new THREE.Mesh(geomEngine, matEngine);
    engine.position.x = 40;
    engine.castShadow = true;
    engine.receiveShadow = true;
    this.mesh.add(engine);

    // Create the tail
    var geomTailPlane = new THREE.BoxGeometry(15, 20, 5, 1, 1, 1);
    var matTailPlane = new THREE.MeshPhongMaterial({ color: Colors.red, shading: THREE.FlatShading });
    var tailPlane = new THREE.Mesh(geomTailPlane, matTailPlane);
    tailPlane.position.set(-35, 25, 0);
    tailPlane.castShadow = true;
    tailPlane.receiveShadow = true;
    this.mesh.add(tailPlane);

    // Create the wing
    var geomSideWing = new THREE.BoxGeometry(40, 8, 150, 1, 1, 1);
    var matSideWing = new THREE.MeshPhongMaterial({ color: Colors.red, shading: THREE.FlatShading });
    var sideWing = new THREE.Mesh(geomSideWing, matSideWing);
    sideWing.castShadow = true;
    sideWing.receiveShadow = true;
    this.mesh.add(sideWing);

    // propeller
    var geomPropeller = new THREE.BoxGeometry(20, 10, 10, 1, 1, 1);
    var matPropeller = new THREE.MeshPhongMaterial({ color: Colors.brown, shading: THREE.FlatShading });
    this.propeller = new THREE.Mesh(geomPropeller, matPropeller);
    this.propeller.castShadow = true;
    this.propeller.receiveShadow = true;

    // blades
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

    // 随机初始位置
    this.mesh.position.set(0, this.obit_height, 0);

    this.update();

    PlaneHolder.push(this);
  }

  update() {
    if (this.is_user_control) {
      this.update_user();
    }
    if (this.is_ai_control) {
      this.update_ai();
    }
  }

  update_user() {
    if (Controls.forward) {
      this.mesh.position.z -= this.fighter_speed;
    }
    if (Controls.backward) {
      this.mesh.position.z += this.fighter_speed;
    }
    if (Controls.leftward) {
      this.mesh.position.x -= this.fighter_speed;
    }
    if (Controls.rightward) {
      this.mesh.position.x += this.fighter_speed;
    }
    let look_point = get_look_at_direction(Controls, this.mesh.position);
    if (look_point) {
      this.mesh.lookAt(look_point.x,look_point.y,look_point.z);
    }
    

    if (Controls.shoot) {
      const currentDate = new Date();
      const timestamp = currentDate.getTime();
      if (this.last_shoot_timestamp == 0 || timestamp - this.last_shoot_timestamp >= this.shoot_cooldown * 1000) {
        let b = new Bullet(this.mesh.position, get_shoot_direction(Controls), this.scene);
        this.scene.add(b.mesh);
        BulletHolder.push(b);
        this.last_shoot_timestamp = timestamp;
      }
    }
    // this.mesh.position.x += 1;
    this.propeller.rotation.x += 0.3;

    this.camera.position.x = this.mesh.position.x;
    this.camera.position.y = this.mesh.position.y + 200;
    this.camera.position.z = this.mesh.position.z + 200;
    this.camera.lookAt(this.mesh.position);
  }

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
    if (this.ai_control.shoot) {
      const currentDate = new Date();
      const timestamp = currentDate.getTime();
      if (this.last_shoot_timestamp == 0 || timestamp - this.last_shoot_timestamp >= this.shoot_cooldown * 1000) {
        let b = new Bullet(this.mesh.position, get_shoot_direction(this.ai_control), this.scene);
        this.scene.add(b.mesh);
        BulletHolder.push(b);
        this.last_shoot_timestamp = timestamp;
      }
    }

    let look_point = get_look_at_direction(this.ai_control, this.mesh.position);
    if (look_point) {
      this.mesh.lookAt(look_point.x,look_point.y,look_point.z);
    }

    this.propeller.rotation.x += 0.3;
  }

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
function get_shoot_direction(controls) {
  if (controls.forward && controls.leftward) {
    return new THREE.Vector4(-0.7, 0, -0.7)
  }
  if (controls.forward && controls.rightward) {
    return new THREE.Vector4(0.7, 0, -0.7)
  }
  if (controls.forward) {
    return new THREE.Vector4(0, 0, -1)
  }
  if (controls.backward && controls.leftward) {
    return new THREE.Vector4(-0.7, 0, 0.7)
  }
  if (controls.backward && controls.rightward) {
    return new THREE.Vector4(0.7, 0, 0.7)
  }
  if (controls.backward) {
    return new THREE.Vector4(0, 0, 1)
  }
  if (controls.leftward) {
    return new THREE.Vector4(-1, 0, 0)
  }
  if (controls.rightward) {
    return new THREE.Vector4(1, 0, 0)
  }
  return new THREE.Vector4(0, 0, -1)
}


/**
 * 根据飞机的移动方向决定飞机朝向
 * @returns 
 */
function get_look_at_direction(controls, position) {
  if (controls.forward && controls.leftward) {
    return position.clone().add(new Vector3(1,0,-1));
  }
  if (controls.forward && controls.rightward) {
    return position.clone().add(new Vector3(1,0,1));
  }
  if (controls.forward) {
    return position.clone().add(new Vector3(1,0,0));
  }
  if (controls.backward && controls.leftward) {
    return position.clone().add(new Vector3(-1,0,-1));
  }
  if (controls.backward && controls.rightward) {
    return position.clone().add(new Vector3(-1,0,1));
  }
  if (controls.backward) {
    return position.clone().add(new Vector3(-1,0,0));
  }
  if (controls.leftward) {
    return position.clone().add(new Vector3(0,0,-1));
  }
  if (controls.rightward) {
    return position.clone().add(new Vector3(0,0,1));
  }
  return null
}


function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

export { Plane, PlaneHolder };