import * as THREE from 'three';
import { Water } from 'three/addons/objects/Water.js';
import { Sky } from 'three/addons/objects/Sky.js';
import { Plane, PlaneHolder } from './fighter.js';
import { GameMode, GameModeAI, GameModeDemo, MapSize, Scene, SetMyFighter, } from './consts.js';
import { BulletHolder } from './bullet.js';
import { reportPosition, uuid } from './websockets/websocket.js';

// 水面的动态需要加入每一帧的渲染，因此需要有一个全局变量
let water = null;

/**
 * 游戏类
 */
class GameBoard {
    constructor() {
        // 创建摄像机
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

        // 创建渲染器
        const renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true
        });
        this.renderer = renderer;

        // 根据游戏模式创建不同的游戏面板
        if (GameMode === GameModeDemo) {
            this.build_demo_game_board();
        }
        if (GameMode === GameModeAI) {
            this.build_ai_game_board();
        }

        /**
         * 每一帧的渲染函数
         */
        function animate() {
            requestAnimationFrame(animate);
            // 渲染玩家的飞机
            PlaneHolder.forEach(e => e.update());
            // 处理超出地图边界需要移除的子弹
            let needRemoveBullet = [];
            for (let index = 0; index < BulletHolder.length; index++) {
                const needRemove = BulletHolder[index].update();
                if (needRemove) {
                    needRemoveBullet.push(index);
                }
            }
            for (var i = needRemoveBullet.length - 1; i >= 0; i--) {
                BulletHolder.splice(needRemoveBullet[i], 1);
            }
            // 渲染水面
            if (water) {
                water.material.uniforms['time'].value += 1.0 / 60.0;
            }
            renderer.render(Scene, camera);
        }
        animate();
    }

    /**
     * 创建一局演示用的游戏
     * 无玩家介入
     */
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


        const waterGeometry = new THREE.PlaneGeometry(MapSize, MapSize);

        // 添加水面纹理
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

        // 创建天空纹理
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

        // three.js的辅助函数，展示坐标轴等
        // const axisHelper = new THREE.AxesHelper(5000);
        // Scene.add(axisHelper);

        // const helper = new THREE.CameraHelper( camera );
        // scene.add( helper );
    }

    /**
     * 创建一局人机对战游戏
     */
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



        const waterGeometry = new THREE.PlaneGeometry(MapSize, MapSize);

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

    /**
     * 创建一局多人对战游戏
     */
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

        const waterGeometry = new THREE.PlaneGeometry(MapSize, MapSize);

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