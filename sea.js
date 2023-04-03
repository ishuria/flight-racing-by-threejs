import * as THREE from 'three';
import { Colors, MapSize } from './consts.js';

class Sea {
  constructor(height, width) {
    // create the geometry (shape) of the cylinder;
    // the parameters are: 
    // radius top, radius bottom, height, number of segments on the radius, number of segments vertically
    var geom = new THREE.PlaneGeometry( MapSize, MapSize );

    // rotate the geometry on the x axis
    geom.applyMatrix4(new THREE.Matrix4().makeRotationX(-Math.PI / 2));

    // create the material 
    var mat = new THREE.MeshPhongMaterial({
      color: Colors.blue,
      transparent: true,
      opacity: .6,
      shading: THREE.FlatShading,
    });

    // To create an object in Three.js, we have to create a mesh 
    // which is a combination of a geometry and some material
    this.mesh = new THREE.Mesh(geom, mat);

    // Allow the sea to receive shadows
    this.mesh.receiveShadow = true;
  }
  // Getter
  // get area() {
  //   return this.calcArea();
  // }
  // // Method
  // calcArea() {
  //   return this.height * this.width;
  // }
  // *getSides() {
  //   yield this.height;
  //   yield this.width;
  //   yield this.height;
  //   yield this.width;
  // }
}

export { Sea };