import * as THREE from 'three';
import { Colors, MapSize } from './consts.js';

const BulletHolder = []

class Bullet {
  constructor(position, direction, scene) {
    this.scene = scene;
    this.bullet_speed = 10;
    this.direction = direction;
    // create a cube geometry;
    // this shape will be duplicated to create the cloud
    var geom = new THREE.BoxGeometry(20, 20, 20);

    // create a material; a simple white material will do the trick
    var mat = new THREE.MeshPhongMaterial({
      color: Colors.brown,
    });
    // create the mesh by cloning the geometry
    var mesh = new THREE.Mesh(geom, mat);

    // set the position and the rotation of each cube randomly
		// set the position and the rotation of each cube randomly
		mesh.position.set(position.x,position.y,position.z);
		mesh.rotation.z = Math.random()*Math.PI*2;
		mesh.rotation.y = Math.random()*Math.PI*2;

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
    if (Math.abs(this.mesh.position.x) > MapSize / 2 || Math.abs(this.mesh.position.z) > MapSize / 2){
      this.scene.remove(this.mesh);
      this.mesh.geometry.dispose();
      this.mesh.material.dispose();
      var index = BulletHolder.indexOf(this.mesh);
      if (index > -1) {
        BulletHolder.splice(index, 1);
      }
    }
    // 子弹检测命中
    
  }
}

export {Bullet, BulletHolder};