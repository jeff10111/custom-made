<template>
<div>
  <div>{{this.userSelection["body"]}} with {{this.userSelection.engine}} engine and {{this.userSelection.powerup}} powerup</div>
  <div><button @click="spinArm">Spin!</button></div>
  <div><button @click="grabBox">grabBox!</button></div>
  <div><button @click="buildT">Build Model T!</button></div>
  <div><button @click="playCSV">Play CSV!</button></div>
  <canvas id="gameCanvas" width="1000px" height="600px"></canvas>
</div>
</template>

<script>
import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import "@babylonjs/loaders/glTF";
import {PhysicsImpostor} from "@babylonjs/core/Physics";
import "@babylonjs/core/Physics/Plugins/cannonJSPlugin";
import {readCsv} from '@/utils/csvHelper.js'
import { StandardMaterial, Animation, SceneLoader, Engine, Scene, ArcRotateCamera, Vector3, Mesh, MeshBuilder, HemisphericLight, Color3 } from "@babylonjs/core";
window.CANNON = require('cannon');

var runningApp;
const frameRate = 1000;

var createScene = async function (engine, canvas) {
  var scene = new Scene(engine);
  var camera =  new ArcRotateCamera("Camera", Math.PI / 2, Math.PI / 2, 2, Vector3.Zero(), scene);
  camera.attachControl(canvas, true);
  var light1 = new HemisphericLight("light1", new Vector3(1, 1, 0), scene);

  SceneLoader.ImportMeshAsync("", "/assets/", "track.glb").then((result) => {
    console.log(result)
    console.log("------------------------------")
    
    for (var mesh in result.meshes) {
      var thisMesh = result.meshes[mesh]
      if (thisMesh.name.startsWith("Dorna_") && !thisMesh.name.includes("primitive")) {
        console.log("Dorna part: " + thisMesh.name)
        const rot = thisMesh.rotationQuaternion.toEulerAngles()
        // Quaternions must be reset on imported models otherwise they will not be able to be rotated
        thisMesh.rotationQuaternion = null;
        // But we still want them in the original positions
        const newRot = new Vector3(rot.x, rot.y, rot.z)
        thisMesh.rotation = newRot;
      }
    }

        // Need to reset the rotation for the bones also for animations to work
    var boneList = ["ShoulderBone", "UpperarmBone", "ForearmBone", "HandBone"]
    for (var bone in boneList) {
      var sceneBone = runningApp.scene.getTransformNodeByName(boneList[bone])
      console.log(sceneBone.name, sceneBone.rotation.x, sceneBone.rotation.y, sceneBone.rotation.z)
      sceneBone.rotation = new Vector3(sceneBone.rotation.x, sceneBone.rotation.y, sceneBone.rotation.z);
      console.log("::", sceneBone.name, sceneBone.rotation.x, sceneBone.rotation.y, sceneBone.rotation.z)
    }
    console.log("!!!!",runningApp.scene.getTransformNodeByName("ShoulderBone").absoluteRotationQuaternion)
    runningApp.scene.getTransformNodeByName("ShoulderBone").absoluteRotationQuaternion = null


  });

  //Creating ground, sphere, cylinder
  // var groundMat = new StandardMaterial("groundMat", scene);
  // groundMat.diffuseColor = new Color3(1,0,0)
  // var ground = MeshBuilder.CreateGround("ground", {width: 30, height: 30}, scene);
  // ground.material = groundMat;
  // // var sphere = MeshBuilder.CreateSphere("sphere", {diameter: 3, segments: 32}, scene);
  // // var cylinder = MeshBuilder.CreateCylinder("cylinder", {height: 12, diameterTop: .5, diameterBottom: .1}, scene);
  // var cube = MeshBuilder.CreateBox("cube", {height: 2, width: 2, depth: 2}, scene);
  // var base = MeshBuilder.CreateBox("base", {height: 2, width: 2, depth: 2}, scene);
  // //creating boundary boxes
  // // var left = MeshBuilder.CreateBox("left", {height: 7, width: 24}, scene);
  // // var right = MeshBuilder.CreateBox("right", {height: 7, width: 24}, scene);
  // // var top = MeshBuilder.CreateBox("top", {height: 7, width: 24}, scene);
  // // var bottom = MeshBuilder.CreateBox("bottom", {height: 7, width: 24}, scene);

  // //Setting coordinates for the meshes and camera target/radius
  // cube.position = new Vector3(0,1,10)
  // base.position = new Vector3(10,1,0)

  // camera.setTarget(cylinder);
  camera.radius *= 2;

 
  //Adding physics to objects
  scene.enablePhysics();

  // ground.physicsImpostor = new PhysicsImpostor(ground, PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 0.9}, scene);
  // cube.physicsImpostor = new PhysicsImpostor(cube, PhysicsImpostor.BoxImpostor, {mass: 1, restitution: 0.1, ignoreParent: true }, scene);

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
    rotateToDegrees(boneName, attribute, valueTo, autoStart = true) {
      return this.rotateTo(boneName, attribute, valueTo*Math.PI/180, autoStart)
    },
    rotateTo(boneName, attribute, valueTo, autoStart = true) {
      // //TEMPLATE
      // this.rotateTo("ShoulderBone", "rotation.z", Math.PI/4);
      // this.rotateTo("UpperarmBone", "rotation.x", 1);
      // this.rotateTo("ForearmBone", "rotation.x", 6.8DEG = 0.118682RAD);
      // this.rotateTo("HandBone", "rotation.x", 0.118682);

      var thisBone = runningApp.scene.getTransformNodeByName(boneName);

      //Dynamically retrieve the selected value
      const splitAttr = attribute.split('.');
      var thisAttr = thisBone
      splitAttr.forEach(element => {
        thisAttr = thisAttr[element]
      });

      // console.log("Retrieved val: " + thisAttr)

      
      const thisAnim = new Animation(boneName + '_' + attribute, attribute, frameRate, Animation.ANIMATIONTYPE_FLOAT);
      thisAnim.onAnimationLoop = function(){console.error("HEYO")}
      const keyFrames = [];
      keyFrames.push({
          frame: 0,
          value: thisAttr,
      });
      keyFrames.push({
          frame: 2 * frameRate,
          value: valueTo,
      });
      thisAnim.setKeys(keyFrames);
      
      // If we need to customise the animation then we don't want to start yet
      // otherwise:
      if (autoStart) {
        thisBone.animations.push(thisAnim)
        var runAnim = runningApp.scene.beginAnimation(thisBone, 0, 2*frameRate, false)
        return runAnim.waitAsync()
      }
      return thisAnim;
      

    
    },
    spinArm() {
      var test = Math.floor(Math.random() * 10 -5)
      if (test == 0) {test = 1}
      console.log("Shoulder spin amt: " + test)

      this.rotateTo("ShoulderBone", "rotation.z", Math.PI/test);
      test = Math.floor(Math.random() * 20 -10)
      if (test == 0) {test = 1}
      console.log("Forearm spin amt: " + test)
      this.rotateTo("ForearmBone", "rotation.x", Math.PI/test);
      test = Math.floor(Math.random() * 20 -10)
      if (test == 0) {test = 1}
      console.log("Upperarm spin amt: " + test)
      this.rotateTo("UpperarmBone", "rotation.x", Math.PI/test);
      test = Math.floor(Math.random() * 20 -10)
      if (test == 0) {test = 1}
      console.log("Hand spin amt: " + test)
      this.rotateTo("HandBone", "rotation.x", Math.PI/test);


    },
    async grabBox() {
      // var cube = runningApp.scene.getMeshByName("cube")
      // cube.physicsImpostor.mass = 0
      this.rotateTo("ShoulderBone", "rotation.z", Math.PI/2);

      await this.rotateTo("UpperarmBone", "rotation.x", 0.698132);


      this.rotateTo("UpperarmBone", "rotation.x", 0.118682);

      this.rotateTo("ForearmBone", "rotation.x", -1.97222);
      await this.rotateTo("HandBone", "rotation.x", 0.226893);


      

      // cube.setParent(runningApp.scene.getTransformNodeByName("HandBone"))
      // cube.physicsImpostor.mass = 0
    },
    async buildT() {
      this.rotateToDegrees("ShoulderBone", "rotation.z", 50);
      this.rotateToDegrees("UpperarmBone", "rotation.x", 57);
      this.rotateToDegrees("ForearmBone", "rotation.x", 295);
      await this.rotateToDegrees("HandBone", "rotation.x", 8);

      this.rotateToDegrees("ShoulderBone", "rotation.z", 155);
      this.rotateToDegrees("UpperarmBone", "rotation.x", 140);



    },
    async playCSV(){
      console.log("Yo")
      var csv = readCsv('Tank_Assembly_J')
      var lastrow = csv[0]
      console.log(lastrow)
      var x = 0
      for (var row of csv) {

        // var row = csv[250]
        if (JSON.stringify(lastrow) !== JSON.stringify(row)) {
          x += 1
          console.log(x)
          if (x%10==0) {
            x=0
            console.log(row)
            lastrow = row
            for (var angle of row) {
              var anim
              // console.log("Shoulder Angle ", row[0], parseInt(row[0]) * (Math.PI/180))
              var animation = this.rotateTo("ShoulderBone", "rotation.z", parseInt(row[0]) * (Math.PI/180), false);
              var thisBone = runningApp.scene.getTransformNodeByName("ShoulderBone");
              thisBone.animations.push(animation)
              anim = runningApp.scene.beginAnimation(thisBone, 0, 2*frameRate, false)
              // console.log("Start Shoulder")
              await anim.waitAsync()
  
              // console.log("Upperarm Angle ", row[0], parseInt(row[0]) * (Math.PI/180))
              animation = this.rotateTo("UpperarmBone", "rotation.x", parseInt(row[1]) * (Math.PI/180), false);
              thisBone = runningApp.scene.getTransformNodeByName("UpperarmBone");
              thisBone.animations.push(animation)
              anim = runningApp.scene.beginAnimation(thisBone, 0, 2*frameRate, false)
              // console.log("Start Upperarm")
              // await anim.waitAsync()
  
              animation = this.rotateTo("ForearmBone", "rotation.x", parseInt(row[2]) * (Math.PI/180), false);
              thisBone = runningApp.scene.getTransformNodeByName("ForearmBone");
              thisBone.animations.push(animation)
              anim = runningApp.scene.beginAnimation(thisBone, 0, 2*frameRate, false)
              // console.log("Start Forearm")
              // await anim.waitAsync()
  
              // for (var anim of anims) {
              //   await anim.waitAsync();
              //   console.log("Fin")
              // }
            }
          }
        }
      }
    },
    dropBox() {
      var cube = runningApp.scene.getMeshByName("cube")
      cube.physicsImpostor.mass = 1
      cube.setParent(null);
    },
    async placeBox() {
      var cube = runningApp.scene.getMeshByName("cube")
      cube.physicsImpostor.mass = 0
      this.rotateTo("ShoulderBone", "rotation.z", 0);

      var animation = this.rotateTo("UpperarmBone", "rotation.x", 0.698132, false);
      var thisBone = runningApp.scene.getTransformNodeByName("UpperarmBone");
      thisBone.animations.push(animation)
      var anim = runningApp.scene.beginAnimation(thisBone, 0, 2*frameRate, false)
      console.log("Start")
      await anim.waitAsync();
      console.log("Fin")

      this.rotateTo("UpperarmBone", "rotation.x", 0.383972);

      this.rotateTo("ForearmBone", "rotation.x", -2.14675);
      animation = this.rotateTo("HandBone", "rotation.x", 0.139626, false);
      thisBone = runningApp.scene.getTransformNodeByName("HandBone");
      thisBone.animations.push(animation)
      anim = runningApp.scene.beginAnimation(thisBone, 0, 2*frameRate, false)
      console.log(typeof(anim))
      console.log("Start")
      await anim.waitAsync();
      console.log("Fin")

      

      cube.setParent(runningApp.scene.getMeshByName("base"))
      cube.physicsImpostor.mass = 0
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
