import * as THREE from 'three';
import { Plane, PlaneHolder } from './fighter.js';
import { Sea } from './sea.js';
import { Controls, GameMode, GameModeAI, GameModeDemo, Scene, } from './consts.js';
import { BulletHolder } from './bullet.js';
import { reportPosition,  uuid } from './websockets/websocket.js';

let animation_frame_id = 0;

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
            animation_frame_id = requestAnimationFrame(animate);
            PlaneHolder.forEach(e => e.update());
            BulletHolder.forEach(e => e.update());
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


        const sea = new Sea();
        // push it a little bit at the bottom of the scene
        sea.mesh.position.x = 0;
        sea.mesh.position.y = 0;
        sea.mesh.position.z = 0;

        // add the mesh of the sea to the scene
        Scene.add(sea.mesh);

        // 创建四个ai控制的，先随机乱飞
        for (let index = 0; index < 10; index++) {
            const ai_plane = new Plane(Scene, 100, false, this.camera, true);
            Scene.add(ai_plane.mesh);
        }

        const axisHelper = new THREE.AxesHelper(5000);
        Scene.add(axisHelper);

        // const helper = new THREE.CameraHelper( camera );
        // scene.add( helper );
    }

    build_ai_game_board() {
        BulletHolder.length = 0;
        PlaneHolder.length = 0;
        while (Scene && Scene.children.length > 0) {
            Scene.remove(Scene.children[0]);
        }
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


        const sea = new Sea();
        // push it a little bit at the bottom of the scene
        sea.mesh.position.x = 0;
        sea.mesh.position.y = 0;
        sea.mesh.position.z = 0;

        // add the mesh of the sea to the scene
        Scene.add(sea.mesh);


        const fighter = new Plane(Scene, 100, true, this.camera, false);
        // fighter.mesh.scale.set(.25,.25,.25);
        // fighter.mesh.position.x = 0;
        // fighter.mesh.position.y = 0;
        // fighter.mesh.position.z = 800;
        Scene.add(fighter.mesh);

        // 创建四个ai控制的，先随机乱飞
        for (let index = 0; index < 4; index++) {
            const ai_plane = new Plane(Scene, 100, false, this.camera, true);
            Scene.add(ai_plane.mesh);
        }

        const axisHelper = new THREE.AxesHelper(5000);
        Scene.add(axisHelper);

        // const helper = new THREE.CameraHelper( camera );
        // scene.add( helper );
    }

    async build_multi_game_board() {
        // 清空地图
        BulletHolder.length = 0;
        PlaneHolder.length = 0;

        await sleep(3000);

        // 随机一个坐标
        let x = Math.floor((Math.random() * 100) + 1);
        let z = Math.floor((Math.random() * 100) + 1);
        reportPosition(x, z);

        while (Scene && Scene.children.length > 0) {
            Scene.remove(Scene.children[0]);
        }
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


        const sea = new Sea();
        // push it a little bit at the bottom of the scene
        sea.mesh.position.x = 0;
        sea.mesh.position.y = 0;
        sea.mesh.position.z = 0;

        // add the mesh of the sea to the scene
        Scene.add(sea.mesh);


        const fighter = new Plane(Scene, 100, true, this.camera, false, x, z, uuid);
        // fighter.mesh.scale.set(.25,.25,.25);
        // fighter.mesh.position.x = 0;
        // fighter.mesh.position.y = 0;
        // fighter.mesh.position.z = 800;
        Scene.add(fighter.mesh);

        // 向服务器请求当前玩家列表
        // requestMultiPlayers();
        // for (let index = 0; index < 4; index++) {
        //     const ai_plane = new Plane(Scene, 100, false, this.camera, true);
        //     Scene.add(ai_plane.mesh);
        // }

        const axisHelper = new THREE.AxesHelper(5000);
        Scene.add(axisHelper);

        // const helper = new THREE.CameraHelper( camera );
        // scene.add( helper );
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export { GameBoard };