<template>
<div>
  <div>{{this.userSelection["body"]}} with {{this.userSelection.engine}} engine and {{this.userSelection.powerup}} powerup</div>
  <canvas id="gameCanvas"></canvas>
</div>
</template>

<script>
import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import "@babylonjs/loaders/glTF";
import { Skeleton, SceneLoader, Engine, Scene, ArcRotateCamera, Vector3, Mesh, MeshBuilder, HemisphericLight } from "@babylonjs/core";
import Vue from 'vue'

var createScene = async function (engine, canvas) {
  var scene = new Scene(engine);
  var camera =  new ArcRotateCamera("Camera", Math.PI / 2, Math.PI / 2, 2, Vector3.Zero(), scene);
  camera.attachControl(canvas, true);
  var light1 = new HemisphericLight("light1", new Vector3(1, 1, 0), scene);
  // var box = MeshBuilder.CreateBox("box", { diameter: 1 }, scene);
  // const ground = MeshBuilder.CreateGround("ground", 1, 1, 1, scene, false);
  SceneLoader.ImportMeshAsync("", "/assets/", "dornaRigged.glb").then((result) => {
    console.log(result)
    for (var mesh in result.meshes) {
      var thisMesh = result.meshes[mesh]
      console.log(thisMesh.name)
      var rot = thisMesh.rotationQuaternion.toEulerAngles()
      // console.log(Math.round(rot.x * 2) / 2)
      // console.log(Math.round(rot.y * 2) / 2)
      // console.log(Math.round(rot.z * 2) / 2)
      // Quaternions must be reset on imported models otherwise they will not be able to be rotated
      thisMesh.rotationQuaternion = null;
      // But we still want them in the original positions
      thisMesh.rotation = Vector3((rot.x * 2) / 2, (rot.y * 2) / 2, (rot.z * 2) / 2)

    }

    console.log(scene.getMeshByName("Arm_1"));
    

    // result.meshes[0].scaling.scaleInPlace(0.8)
    // result.meshes[1].position.x = 20;
    // const dornaArm1 = scene.getMeshByName("Arm_1");
    // console.log(dornaArm1);


  });


  return scene;
}

class BabylonApp {
    constructor() {
        // create the canvas html element and attach it to the webpage
        var canvas = document.getElementById("gameCanvas");
        // initialize babylon scene and engine
        var engine = new Engine(canvas, true);
        var scene;
        var scenePromise = createScene(engine, canvas) 
        scenePromise.then(returnedScene => {
          scene = returnedScene;
        })

        window.addEventListener("keydown", (ev) => {
            // Shift+Ctrl+Alt+I
            if (ev.shiftKey && ev.ctrlKey && ev.altKey && ev.keyCode === 73) {
                if (scene.debugLayer.isVisible()) {
                    scene.debugLayer.hide();
                } else {
                    scene.debugLayer.show();
                }
            }
        });
        
        // run the main render loop
        engine.runRenderLoop(() => {
            scene.render();
        });

        // Watch for browser/canvas resize events
        window.addEventListener("resize", function () {
                engine.resize();
        });
    }
}

export default {
  name: 'Simulation',
  props: {
    test: {one:"a",two:"a"}//should be passing values as props but don't know how yet
  },
  data() {
    return {userSelection: {body: "", engine: "", powerup: ""}, mode: 0};
  },
  mounted() {
    this.userSelection["body"] = this.$route.query.body;
    this.userSelection["engine"] = this.$route.query.engine;
    this.userSelection["powerup"] = this.$route.query.powerup;

    let Application = new BabylonApp(this.$refs.canvas);
  }
}
</script>
