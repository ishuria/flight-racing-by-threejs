

const model_manager = new ModelManager();

const mesh_holder = [];

class ModelManager {
    constructor() {
        // Load a glTF resource
        loader.load(
            // resource URL
            './assets/F-16.glb',
            // called when the resource is loaded
            function (gltf) {
                mesh_holder.push(gltf.scene.children[0]);
                // gltf.scene.position.x = 0;
                // gltf.scene.position.y = 100;
                // gltf.scene.position.z = 0;
                // gltf.scene.scale.set(10, 10, 10);
                fighter.scale.set(10, 10, 10);
                // 初始位置
                fighter.position.set(x, 100, z);
            },
            // called while loading is progressing
            function (xhr) {
                console.log((xhr.loaded / xhr.total * 100) + '% loaded');
            },
            // called when loading has errors
            function (error) {
                console.log('An error happened');
            }
        );

    }

    get_random_mesh() {
        if (mesh_holder.length <= 0){
            return null;
        }
        let rand_index = Math.floor((Math.random() * mesh_holder.length) + 1);
        return mesh_holder[rand_index];
    }
}

export { model_manager };