<template>
<div>
  <div>{{this.userSelection["body"]}} with {{this.userSelection.engine}} engine and {{this.userSelection.powerup}} powerup</div>
  <div><button @click="spinArm">Spin!</button></div>
  <canvas id="gameCanvas" width="1000px" height="600px"></canvas>
</div>
</template>

<script>
import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import "@babylonjs/loaders/glTF";
import {PhysicsImpostor} from "@babylonjs/core/Physics";
import "@babylonjs/core/Physics/Plugins/cannonJSPlugin";
import { Skeleton, Animation, SceneLoader, Engine, Scene, ArcRotateCamera, Vector3, Mesh, MeshBuilder, HemisphericLight, Color3 } from "@babylonjs/core";
window.CANNON = require('cannon');

var runningApp;

var createScene = async function (engine, canvas) {
  var scene = new Scene(engine);
  var camera =  new ArcRotateCamera("Camera", Math.PI / 2, Math.PI / 2, 2, Vector3.Zero(), scene);
  camera.attachControl(canvas, true);
  var light1 = new HemisphericLight("light1", new Vector3(1, 1, 0), scene);
  SceneLoader.ImportMeshAsync("", "/assets/", "dornaRigged.glb").then((result) => {
    console.log(result)
    for (var mesh in result.meshes) {
      var thisMesh = result.meshes[mesh]
      console.log(thisMesh.name)
      const rot = thisMesh.rotationQuaternion.toEulerAngles()
      // Quaternions must be reset on imported models otherwise they will not be able to be rotated
      thisMesh.rotationQuaternion = null;
      // But we still want them in the original positions
      const newRot = new Vector3(rot.x, rot.y, rot.z)
      thisMesh.rotation = newRot;
    }

    // Need to reset the rotation for the bones also for animations to work
    var boneList = ["ShoulderBone", "UpperarmBone", "ForearmBone", "HandBone"]
    for (var bone in boneList) {
      var sceneBone = runningApp.scene.getTransformNodeByName(boneList[bone])
      sceneBone.rotation = new Vector3(sceneBone.rotation.x, sceneBone.rotation.y, sceneBone.rotation.z);
    }


  });

  //Creating ground, sphere, cylinder
  var ground = MeshBuilder.CreateGround("ground", {width: 30, height: 30}, scene);
  var sphere = MeshBuilder.CreateSphere("sphere", {diameter: 3, segments: 32}, scene);
  var cylinder = MeshBuilder.CreateCylinder("cylinder", {height: 12, diameterTop: .5, diameterBottom: .1}, scene);
  var cube = MeshBuilder.CreateBox("cube", {height: 5, width: 5}, scene);
  //creating boundary boxes
  var left = MeshBuilder.CreateBox("left", {height: 7, width: 24}, scene);
  var right = MeshBuilder.CreateBox("right", {height: 7, width: 24}, scene);
  var top = MeshBuilder.CreateBox("top", {height: 7, width: 24}, scene);
  var bottom = MeshBuilder.CreateBox("bottom", {height: 7, width: 24}, scene);

  //Setting coordinates for the meshes and camera target/radius
  var wallY = 4;
  cube.position.y = 10;
  cylinder.position.y = 10;
  sphere.position.z = -.5;
  sphere.position.y = 5;
  cylinder.position.z = -10;
  camera.setTarget(cylinder);
  camera.radius *= 2;
  cylinder.rotation.x = 1;
  left.position.z = -13;
  right.position.z = 13;
  top.rotation.y = 1.57;
  bottom.rotation.y = 1.57;
  top.position.x = 13;
  bottom.position.x = -13;
  top.position.y = wallY;
  bottom.position.y = wallY;
  left.position.y = wallY;
  right.position.y = wallY;
 
  //Adding physics to objects
  scene.enablePhysics();
  //cylinder.physicsImpostor = new PhysicsImpostor(cylinder, PhysicsImpostor.BoxImpostor, { mass: 1, restitution: .9 }, scene)
  sphere.physicsImpostor = new PhysicsImpostor(sphere, PhysicsImpostor.SphereImpostor, { mass: 1, restitution: 0.9 }, scene);
  ground.physicsImpostor = new PhysicsImpostor(ground, PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 0.9 }, scene);
  cube.physicsImpostor = new PhysicsImpostor(cube, PhysicsImpostor.BoxImpostor, {mass: 1, restitution: 0.9}, scene);
  top.physicsImpostor = new PhysicsImpostor(top, PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 0.9 }, scene);
  bottom.physicsImpostor = new PhysicsImpostor(bottom, PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 0.9 }, scene);
  left.physicsImpostor = new PhysicsImpostor(left, PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 0.9 }, scene);
  right.physicsImpostor = new PhysicsImpostor(right, PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 0.9 }, scene);


  //Initial linear and angular velocity
  sphere.physicsImpostor.setLinearVelocity(new Vector3(0,7,10));
  sphere.physicsImpostor.setAngularVelocity(new Vector3(100,2,0));

  scene.ambientColor = new Color3(256,0,0);
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
          console.log(returnedScene);
          scene = returnedScene;
          this.scene = returnedScene;
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
  methods: {
    spinArm() {
      console.log(runningApp);
      console.log(runningApp.scene);
      console.log(runningApp.scene.getMeshByName("__root__"));
      // for (var mesh in result.meshes) {}

      // runningApp.scene.getSkeleton

      // Temp: reset all bone rotations so it doesn't fold up indefinitely
      var boneList = ["ShoulderBone", "UpperarmBone", "ForearmBone", "HandBone"]
      for (var bone in boneList) {
        var sceneBone = runningApp.scene.getTransformNodeByName(boneList[bone])
        sceneBone.rotation = new Vector3(0, 0, 0);
      }



      var forearmBone = runningApp.scene.getTransformNodeByName("ForearmBone");
      var upperarmBone = runningApp.scene.getTransformNodeByName("UpperarmBone");
      var shoulderBone = runningApp.scene.getTransformNodeByName("ShoulderBone");

      const frameRate = 10;
      const xRot = new Animation("xRot", "rotation.x", frameRate, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
      const keyFrames = [];
      keyFrames.push({
          frame: 0,
          value: forearmBone.rotation.x,
      });
      keyFrames.push({
          frame: frameRate,
          value: forearmBone.rotation.x + Math.PI/6,
      });
      keyFrames.push({
          frame: 2 * frameRate,
          value: forearmBone.rotation.x + Math.PI/6 * 2,
      });
      xRot.setKeys(keyFrames);

      const zRot = new Animation("zRot", "rotation.z", frameRate, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
      const keyFrames2 = [];
      keyFrames2.push({
          frame: 0,
          value: forearmBone.rotation.z,
      });
      keyFrames2.push({
          frame: frameRate,
          value: shoulderBone.rotation.z + Math.PI/8,
      });
      keyFrames2.push({
          frame: 2 * frameRate,
          value: forearmBone.rotation.z + Math.PI/8 * 2,
      });
      zRot.setKeys(keyFrames2);
      
      forearmBone.animations.push(xRot)
      runningApp.scene.beginAnimation(forearmBone, 0, 2*frameRate, false)

      
      upperarmBone.animations.push(xRot)
      runningApp.scene.beginAnimation(upperarmBone, 0, 2*frameRate, false)

      shoulderBone.animations.push(zRot)
      runningApp.scene.beginAnimation(shoulderBone, 0, 2*frameRate, false)


    }
  },
  data() {
    return {userSelection: {body: "", engine: "", powerup: ""}, mode: 0};
  },
  mounted() {
    this.userSelection["body"] = this.$route.query.body;
    this.userSelection["engine"] = this.$route.query.engine;
    this.userSelection["powerup"] = this.$route.query.powerup;
    let Application = new BabylonApp(this.$refs.canvas);
    runningApp = Application
  }
}
</script>
