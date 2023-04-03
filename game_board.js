import * as THREE from 'three';
import { Plane, PlaneHolder } from './fighter.js';
import { Sea } from './sea.js';
import { Controls, } from './consts.js';
import { BulletHolder } from './bullet.js';

let animation_frame_id = 0;

class GameBoardOption {
    constructor(is_demo, is_play_with_ai, is_play_with_human, scene) {
        this.is_demo = is_demo
        this.is_play_with_ai = is_play_with_ai
        this.is_play_with_human = is_play_with_human
        this.scene = scene
    }
}

class GameBoard {
    constructor(option) {
        this.option = option
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

        if (this.option.is_demo) {
            this.build_demo_game_board();
        }
        if (this.option.is_play_with_ai) {
            this.build_ai_game_board();
        }

        const s = this.option.scene;
        function animate() {
            animation_frame_id = requestAnimationFrame(animate);
            PlaneHolder.forEach(e => e.update());
            BulletHolder.forEach(e => e.update());
            renderer.render(s, camera);
        }
        animate();
    }

    build_demo_game_board() {
        BulletHolder.length = 0;
        PlaneHolder.length = 0;
        while(this.option.scene && this.option.scene.children.length > 0){ 
            this.option.scene.remove(this.option.scene.children[0]); 
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
        this.option.scene.add(hemisphereLight);
        this.option.scene.add(shadowLight);


        const sea = new Sea();
        // push it a little bit at the bottom of the scene
        sea.mesh.position.x = 0;
        sea.mesh.position.y = 0;
        sea.mesh.position.z = 0;

        // add the mesh of the sea to the scene
        this.option.scene.add(sea.mesh);

        // 创建四个ai控制的，先随机乱飞
        for (let index = 0; index < 10; index++) {
            const ai_plane = new Plane(this.option.scene, 100, false, this.camera, true);
            this.option.scene.add(ai_plane.mesh);
        }

        const axisHelper = new THREE.AxesHelper(5000);
        this.option.scene.add(axisHelper);

        // const helper = new THREE.CameraHelper( camera );
        // scene.add( helper );
    }

    build_ai_game_board() {
        BulletHolder.length = 0;
        PlaneHolder.length = 0;
        while(this.option.scene && this.option.scene.children.length > 0){ 
            this.option.scene.remove(this.option.scene.children[0]); 
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
        this.option.scene.add(hemisphereLight);
        this.option.scene.add(shadowLight);


        const sea = new Sea();
        // push it a little bit at the bottom of the scene
        sea.mesh.position.x = 0;
        sea.mesh.position.y = 0;
        sea.mesh.position.z = 0;

        // add the mesh of the sea to the scene
        this.option.scene.add(sea.mesh);


        const fighter = new Plane(this.option.scene, 100, true, this.camera, false);
        // fighter.mesh.scale.set(.25,.25,.25);
        // fighter.mesh.position.x = 0;
        // fighter.mesh.position.y = 0;
        // fighter.mesh.position.z = 800;
        this.option.scene.add(fighter.mesh);

        // 创建四个ai控制的，先随机乱飞
        for (let index = 0; index < 4; index++) {
            const ai_plane = new Plane(this.option.scene, 100, false, this.camera, true);
            this.option.scene.add(ai_plane.mesh);
        }

        const axisHelper = new THREE.AxesHelper(5000);
        this.option.scene.add(axisHelper);

        // const helper = new THREE.CameraHelper( camera );
        // scene.add( helper );

        window.addEventListener("keydown", onDocumentKeyDown, false);
        function onDocumentKeyDown(event) {
            var keyCode = event.which;
            console.log(keyCode);
            if (keyCode == 87) {
                Controls.forward = true;
            } else if (keyCode == 83) {
                Controls.backward = true;
            } else if (keyCode == 65) {
                Controls.leftward = true;
            } else if (keyCode == 68) {
                Controls.rightward = true;
            } else if (keyCode == 74) {
                Controls.shoot = true;
            }
        };

        window.addEventListener("keyup", onDocumentKeyUp, false);
        function onDocumentKeyUp(event) {
            var keyCode = event.which;
            console.log(keyCode);
            if (keyCode == 87) {
                Controls.forward = false;
            } else if (keyCode == 83) {
                Controls.backward = false;
            } else if (keyCode == 65) {
                Controls.leftward = false;
            } else if (keyCode == 68) {
                Controls.rightward = false;
            } else if (keyCode == 74) {
                Controls.shoot = false;
            }
        };

    }
}

export { GameBoard, GameBoardOption };