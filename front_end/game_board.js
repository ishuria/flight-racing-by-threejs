import * as THREE from 'three';
import { Water } from 'three/addons/objects/Water.js';
import { Sky } from 'three/addons/objects/Sky.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { Plane, PlaneHolder } from './fighter.js';
import { Sea } from './sea.js';
import { Controls, GameMode, GameModeAI, GameModeDemo, MapSize, Scene, SetMyFighter, } from './consts.js';
import { BulletHolder } from './bullet.js';
import { reportPosition, uuid } from './websockets/websocket.js';

let water = null;

class GameBoard {
    constructor() {
        // build
        // Add a fog effect to the scene; same color as the
        // background color used in the style sheet
        // scene.fog = new THREE.Fog(0xf7d9aa, 100, 950);
        // Create the camera
        const aspectRatio = window.innerWidth / window.innerHeight;
        const fieldOfView = 75;
        const nearPlane = 1;
        const farPlane = 10000;
        const camera = new THREE.PerspectiveCamera(
            fieldOfView,
            aspectRatio,
            nearPlane,
            farPlane
        );
        this.camera = camera;
        this.water = null;

        // Create the renderer
        const renderer = new THREE.WebGLRenderer({
            // Allow transparency to show the gradient background
            // we defined in the CSS
            alpha: true,

            // Activate the anti-aliasing; this is less performant,
            // but, as our project is low-poly based, it should be fine :)
            antialias: true
        });
        this.renderer = renderer;

        if (GameMode === GameModeDemo) {
            this.build_demo_game_board();
        }
        if (GameMode === GameModeAI) {
            this.build_ai_game_board();
        }

        function animate() {
            requestAnimationFrame(animate);
            PlaneHolder.forEach(e => e.update());
            let needRemoveBullet = [];
            for (let index = 0; index < BulletHolder.length; index++) {
                const needRemove = BulletHolder[index].update();
                if (needRemove){
                    needRemoveBullet.push(index);
                }
            }
            for (var i = needRemoveBullet.length -1; i >= 0; i--) {
                BulletHolder.splice(needRemoveBullet[i],1);
              }
            if (water) {
                water.material.uniforms['time'].value += 1.0 / 60.0;
            }
            console.log("BulletHolder: " + BulletHolder.length);
            renderer.render(Scene, camera);
        }
        animate();
    }

    build_demo_game_board() {
        BulletHolder.length = 0;
        PlaneHolder.length = 0;
        while (Scene && Scene.children.length > 0) {
            Scene.remove(Scene.children[0]);
        }
        // Set the position of the camera
        this.camera.position.x = 0;
        this.camera.position.y = 1000;
        this.camera.position.z = 1000;
        this.camera.lookAt(0, 0, 0);

        // Define the size of the renderer; in this case,
        // it will fill the entire screen
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        // Enable shadow rendering
        this.renderer.shadowMap.enabled = true;

        let hemisphereLight, shadowLight;
        // A hemisphere light is a gradient colored light; 
        // the first parameter is the sky color, the second parameter is the ground color, 
        // the third parameter is the intensity of the light
        hemisphereLight = new THREE.HemisphereLight(0xaaaaaa, 0x000000, .9)

        // A directional light shines from a specific direction. 
        // It acts like the sun, that means that all the rays produced are parallel. 
        shadowLight = new THREE.DirectionalLight(0xffffff, .9);

        // Set the direction of the light  
        shadowLight.position.set(150, 350, 350);

        // Allow shadow casting 
        shadowLight.castShadow = true;

        // define the visible area of the projected shadow
        shadowLight.shadow.camera.left = -400;
        shadowLight.shadow.camera.right = 400;
        shadowLight.shadow.camera.top = 400;
        shadowLight.shadow.camera.bottom = -400;
        shadowLight.shadow.camera.near = 1;
        shadowLight.shadow.camera.far = 1000;

        // define the resolution of the shadow; the higher the better, 
        // but also the more expensive and less performant
        shadowLight.shadow.mapSize.width = 2048;
        shadowLight.shadow.mapSize.height = 2048;

        // to activate the lights, just add them to the scene
        Scene.add(hemisphereLight);
        Scene.add(shadowLight);


        const waterGeometry = new THREE.PlaneGeometry(10000, 10000);

        water = new Water(
            waterGeometry,
            {
                textureWidth: 512,
                textureHeight: 512,
                waterNormals: new THREE.TextureLoader().load('textures/waternormals.jpg', function (texture) {

                    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

                }),
                sunDirection: new THREE.Vector3(),
                sunColor: 0xffffff,
                waterColor: 0x001e0f,
                distortionScale: 3.7,
                fog: Scene.fog !== undefined
            }
        );

        water.rotation.x = - Math.PI / 2;

        Scene.add(water);

        const sky = new Sky();
        sky.scale.setScalar(10000);
        Scene.add(sky);

        const skyUniforms = sky.material.uniforms;

        skyUniforms['turbidity'].value = 10;
        skyUniforms['rayleigh'].value = 2;
        skyUniforms['mieCoefficient'].value = 0.005;
        skyUniforms['mieDirectionalG'].value = 0.8;

        const parameters = {
            elevation: 2,
            azimuth: 180
        };

        let sun = new THREE.Vector3();

        const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
        let renderTarget;

        function updateSun() {

            const phi = THREE.MathUtils.degToRad(90 - parameters.elevation);
            const theta = THREE.MathUtils.degToRad(parameters.azimuth);

            sun.setFromSphericalCoords(1, phi, theta);

            sky.material.uniforms['sunPosition'].value.copy(sun);
            water.material.uniforms['sunDirection'].value.copy(sun).normalize();

            if (renderTarget !== undefined) renderTarget.dispose();

            renderTarget = pmremGenerator.fromScene(sky);

            Scene.environment = renderTarget.texture;

        }

        updateSun();

        // 创建四个ai控制的，先随机乱飞
        for (let index = 0; index < 10; index++) {
            let x = Math.floor((Math.random() * (MapSize / 2)) + 1);
            let z = Math.floor((Math.random() * (MapSize / 2)) + 1);
            const ai_plane = new Plane(Scene, 100, false, this.camera, true, x, z, "ai_" + index);
            Scene.add(ai_plane.mesh);
        }

        // const axisHelper = new THREE.AxesHelper(5000);
        // Scene.add(axisHelper);

        // const helper = new THREE.CameraHelper( camera );
        // scene.add( helper );
    }

    build_ai_game_board() {
        BulletHolder.length = 0;
        PlaneHolder.length = 0;
        while (Scene && Scene.children.length > 0) {
            Scene.remove(Scene.children[0]);
        }
        let x = Math.floor((Math.random() * MapSize / 2) + 1);
        let z = Math.floor((Math.random() * MapSize / 2) + 1);
        // Set the position of the camera
        this.camera.position.x = 200;
        this.camera.position.y = 200;
        this.camera.position.z = 200;
        this.camera.lookAt(0, 0, 0);

        // Define the size of the renderer; in this case,
        // it will fill the entire screen
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        // Enable shadow rendering
        this.renderer.shadowMap.enabled = true;

        let hemisphereLight, shadowLight;
        // A hemisphere light is a gradient colored light; 
        // the first parameter is the sky color, the second parameter is the ground color, 
        // the third parameter is the intensity of the light
        hemisphereLight = new THREE.HemisphereLight(0xaaaaaa, 0x000000, .9)

        // A directional light shines from a specific direction. 
        // It acts like the sun, that means that all the rays produced are parallel. 
        shadowLight = new THREE.DirectionalLight(0xffffff, .9);

        // Set the direction of the light  
        shadowLight.position.set(150, 350, 350);

        // Allow shadow casting 
        shadowLight.castShadow = true;

        // define the visible area of the projected shadow
        shadowLight.shadow.camera.left = -400;
        shadowLight.shadow.camera.right = 400;
        shadowLight.shadow.camera.top = 400;
        shadowLight.shadow.camera.bottom = -400;
        shadowLight.shadow.camera.near = 1;
        shadowLight.shadow.camera.far = 1000;

        // define the resolution of the shadow; the higher the better, 
        // but also the more expensive and less performant
        shadowLight.shadow.mapSize.width = 2048;
        shadowLight.shadow.mapSize.height = 2048;

        // to activate the lights, just add them to the scene
        Scene.add(hemisphereLight);
        Scene.add(shadowLight);



        const waterGeometry = new THREE.PlaneGeometry(10000, 10000);

        water = new Water(
            waterGeometry,
            {
                textureWidth: 512,
                textureHeight: 512,
                waterNormals: new THREE.TextureLoader().load('textures/waternormals.jpg', function (texture) {

                    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

                }),
                sunDirection: new THREE.Vector3(),
                sunColor: 0xffffff,
                waterColor: 0x001e0f,
                distortionScale: 3.7,
                fog: Scene.fog !== undefined
            }
        );

        water.rotation.x = - Math.PI / 2;

        Scene.add(water);

        const sky = new Sky();
        sky.scale.setScalar(10000);
        Scene.add(sky);

        const skyUniforms = sky.material.uniforms;

        skyUniforms['turbidity'].value = 10;
        skyUniforms['rayleigh'].value = 2;
        skyUniforms['mieCoefficient'].value = 0.005;
        skyUniforms['mieDirectionalG'].value = 0.8;

        const parameters = {
            elevation: 2,
            azimuth: 180
        };

        let sun = new THREE.Vector3();

        const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
        let renderTarget;

        function updateSun() {

            const phi = THREE.MathUtils.degToRad(90 - parameters.elevation);
            const theta = THREE.MathUtils.degToRad(parameters.azimuth);

            sun.setFromSphericalCoords(1, phi, theta);

            sky.material.uniforms['sunPosition'].value.copy(sun);
            water.material.uniforms['sunDirection'].value.copy(sun).normalize();

            if (renderTarget !== undefined) renderTarget.dispose();

            renderTarget = pmremGenerator.fromScene(sky);

            Scene.environment = renderTarget.texture;

        }

        updateSun();


        // const gui = new GUI();

        // const folderSky = gui.addFolder('Sky');
        // folderSky.add(parameters, 'elevation', 0, 90, 0.1).onChange(updateSun);
        // folderSky.add(parameters, 'azimuth', - 180, 180, 0.1).onChange(updateSun);
        // folderSky.open();

        // const waterUniforms = water.material.uniforms;

        // const folderWater = gui.addFolder('Water');
        // folderWater.add(waterUniforms.distortionScale, 'value', 0, 8, 0.1).name('distortionScale');
        // folderWater.add(waterUniforms.size, 'value', 0.1, 10, 0.1).name('size');
        // folderWater.open();


        const fighter = new Plane(Scene, 100, true, this.camera, false, x, z, "ai_self");
        // fighter.mesh.scale.set(.25,.25,.25);
        // fighter.mesh.position.x = 0;
        // fighter.mesh.position.y = 0;
        // fighter.mesh.position.z = 800;
        Scene.add(fighter.mesh);

        SetMyFighter(fighter);


        // 创建四个ai控制的，先随机乱飞
        for (let index = 0; index < 10; index++) {
            let x = Math.floor((Math.random() * (MapSize / 2)) + 1);
            let z = Math.floor((Math.random() * (MapSize / 2)) + 1);
            const ai_plane = new Plane(Scene, 100, false, this.camera, true, x, z, "ai_" + index);
            Scene.add(ai_plane.mesh);
        }

        // const axisHelper = new THREE.AxesHelper(5000);
        // Scene.add(axisHelper);

        // const helper = new THREE.CameraHelper( camera );
        // scene.add( helper );
    }

    build_multi_game_board() {
        // 清空地图
        BulletHolder.length = 0;
        PlaneHolder.length = 0;

        // 随机一个坐标
        let x = Math.floor((Math.random() * MapSize / 2) + 1);
        let z = Math.floor((Math.random() * MapSize / 2) + 1);

        // Set the position of the camera
        this.camera.position.x = 200;
        this.camera.position.y = 200;
        this.camera.position.z = 200;
        this.camera.lookAt(0, 0, 0);

        // Define the size of the renderer; in this case,
        // it will fill the entire screen
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        // Enable shadow rendering
        this.renderer.shadowMap.enabled = true;

        let hemisphereLight, shadowLight;
        // A hemisphere light is a gradient colored light; 
        // the first parameter is the sky color, the second parameter is the ground color, 
        // the third parameter is the intensity of the light
        hemisphereLight = new THREE.HemisphereLight(0xaaaaaa, 0x000000, .9)

        // A directional light shines from a specific direction. 
        // It acts like the sun, that means that all the rays produced are parallel. 
        shadowLight = new THREE.DirectionalLight(0xffffff, .9);

        // Set the direction of the light  
        shadowLight.position.set(150, 350, 350);

        // Allow shadow casting 
        shadowLight.castShadow = true;

        // define the visible area of the projected shadow
        shadowLight.shadow.camera.left = -400;
        shadowLight.shadow.camera.right = 400;
        shadowLight.shadow.camera.top = 400;
        shadowLight.shadow.camera.bottom = -400;
        shadowLight.shadow.camera.near = 1;
        shadowLight.shadow.camera.far = 1000;

        // define the resolution of the shadow; the higher the better, 
        // but also the more expensive and less performant
        shadowLight.shadow.mapSize.width = 2048;
        shadowLight.shadow.mapSize.height = 2048;

        // to activate the lights, just add them to the scene
        Scene.add(hemisphereLight);
        Scene.add(shadowLight);


        // const sea = new Sea();
        // // push it a little bit at the bottom of the scene
        // sea.mesh.position.x = 0;
        // sea.mesh.position.y = 0;
        // sea.mesh.position.z = 0;

        // // add the mesh of the sea to the scene
        // Scene.add(sea.mesh);

        const waterGeometry = new THREE.PlaneGeometry(MapSize * 100, MapSize * 100);

        water = new Water(
            waterGeometry,
            {
                textureWidth: 512,
                textureHeight: 512,
                waterNormals: new THREE.TextureLoader().load('textures/waternormals.jpg', function (texture) {

                    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

                }),
                sunDirection: new THREE.Vector3(),
                sunColor: 0xffffff,
                waterColor: 0x001e0f,
                distortionScale: 3.7,
                fog: Scene.fog !== undefined
            }
        );

        water.rotation.x = - Math.PI / 2;

        Scene.add(water);

        const sky = new Sky();
        sky.scale.setScalar(10000);
        Scene.add(sky);

        const skyUniforms = sky.material.uniforms;

        skyUniforms['turbidity'].value = 10;
        skyUniforms['rayleigh'].value = 2;
        skyUniforms['mieCoefficient'].value = 0.005;
        skyUniforms['mieDirectionalG'].value = 0.8;

        const parameters = {
            elevation: 2,
            azimuth: 180
        };

        let sun = new THREE.Vector3();

        const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
        let renderTarget;

        function updateSun() {

            const phi = THREE.MathUtils.degToRad(90 - parameters.elevation);
            const theta = THREE.MathUtils.degToRad(parameters.azimuth);

            sun.setFromSphericalCoords(1, phi, theta);

            sky.material.uniforms['sunPosition'].value.copy(sun);
            water.material.uniforms['sunDirection'].value.copy(sun).normalize();

            if (renderTarget !== undefined) renderTarget.dispose();

            renderTarget = pmremGenerator.fromScene(sky);

            Scene.environment = renderTarget.texture;

        }

        updateSun();


        // const gui = new GUI();

        // const folderSky = gui.addFolder('Sky');
        // folderSky.add(parameters, 'elevation', 0, 90, 0.1).onChange(updateSun);
        // folderSky.add(parameters, 'azimuth', - 180, 180, 0.1).onChange(updateSun);
        // folderSky.open();

        // const waterUniforms = water.material.uniforms;

        // const folderWater = gui.addFolder('Water');
        // folderWater.add(waterUniforms.distortionScale, 'value', 0, 8, 0.1).name('distortionScale');
        // folderWater.add(waterUniforms.size, 'value', 0.1, 10, 0.1).name('size');
        // folderWater.open();


        const fighter = new Plane(Scene, 100, true, this.camera, false, x, z, uuid);
        // fighter.mesh.scale.set(.25,.25,.25);
        // fighter.mesh.position.x = 0;
        // fighter.mesh.position.y = 0;
        // fighter.mesh.position.z = 800;
        Scene.add(fighter.mesh);

        SetMyFighter(fighter);

        let look_at_position = fighter.mesh.position.clone().add(new THREE.Vector3(1, 0, 0));
        reportPosition(fighter.mesh.position.x, fighter.mesh.position.y, fighter.mesh.position.z, look_at_position.x, look_at_position.y, look_at_position.z);

        // const axisHelper = new THREE.AxesHelper(5000);
        // Scene.add(axisHelper);

        // const helper = new THREE.CameraHelper( camera );
        // scene.add( helper );
    }
}


export { GameBoard };