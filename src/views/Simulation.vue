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
import {PhysicsImpostor, PhysicsJoint} from "@babylonjs/core/Physics";
//import {} from "@babylon/core/Events/keyboardEv";
import  {StandardMaterial} from "@babylonjs/core/Materials"
import {NoiseProceduralTexture} from "@babylonjs/core/Materials/Textures/Procedurals"
import "@babylonjs/core/Physics/Plugins/cannonJSPlugin";
import { Skeleton, SceneLoader, Engine, Scene, ArcRotateCamera, Vector3, Mesh, MeshBuilder, HemisphericLight, Color3, DirectionalLight } from "@babylonjs/core";

window.CANNON = require('cannon');

var runningApp;

function spinArm() {
  console.log(runningApp.scene);
}

var createScene = async function (engine, canvas) {
  var scene = new Scene(engine);
  scene.clearColor = Color3.Purple();
  var camera =  new ArcRotateCamera("Camera", Math.PI /5, Math.PI / 3, 240, Vector3.Zero(), scene);
  camera.useFramingBehavior = true;
  camera.attachControl(canvas, true);
  
  var light1 = new HemisphericLight("light1", new Vector3(1, 1, 0), scene);
  SceneLoader.ImportMeshAsync("", "/assets/", "dornaRigged.glb").then((result) => {
    console.log(result)
    for (var mesh in result.meshes) {
      var thisMesh = result.meshes[mesh]
      thisMesh.scaling.scaleInPlace(0.8);
      console.log(thisMesh.name)
      const rot = thisMesh.rotationQuaternion.toEulerAngles()
      // Quaternions must be reset on imported models otherwise they will not be able to be rotated
      thisMesh.rotationQuaternion = null;
      // But we still want them in the original positions
      const newRot = new Vector3(rot.x, rot.y, rot.z)
      thisMesh.rotation = newRot;
    }
    console.log(scene.getMeshByName("Arm_1"));
    scene.getMeshByName(
      "__root__"
    ).rotation = new Vector3(0,0.5,0);
  });
  var ground = MeshBuilder.CreateGround("ground", {width: 300, height: 300}, scene);
  var mat = new StandardMaterial("green", scene);
  mat.diffuseColor = new Color3.Gray();
  ground.material = mat;
  scene.enablePhysics();
  ground.physicsImpostor = new PhysicsImpostor(ground, PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 0 }, scene);
  //testing(scene, camera);
  hingeTest(scene, camera);

  //Initial linear and angular velocity
  //sphere.physicsImpostor.setLinearVelocity(new Vector3(0,7,10));
  //sphere.physicsImpostor.setAngularVelocity(new Vector3(100,2,0));

  scene.ambientColor = new Color3(256,0,0);
  return scene;
}
function hingeTest(scene, camera){

    var light1 = new DirectionalLight("light1", new Vector3(1, 1, 1), scene);
    var height = 14;
    light1.intensity = 0.5;

    var material = new StandardMaterial("material", scene);
    var texture = new NoiseProceduralTexture("perlin", 256, scene);
    material.diffuseTexture = texture;


    // Pivot
    var leftWheel = MeshBuilder.CreateCylinder("leftWheel", {diameter:7}, scene);
    var rightWheel = MeshBuilder.CreateCylinder("rightWheel", {diameter: 7}, scene);
    var centerWheel = MeshBuilder.CreateCylinder("centerWheel", {diameter: 7, height: 5}, scene);
    leftWheel.position = new Vector3(0,height,-6);
    rightWheel.position = new Vector3(0,height,6);
    centerWheel.position = new Vector3(15,height,0);
    var greenMat = new StandardMaterial("green", scene);
    greenMat.diffuseColor = new Color3.Green();
    leftWheel.material = greenMat;
    leftWheel.rotation.x = 1.57;
    rightWheel.rotation.x = 1.57;
    centerWheel.rotation.x = 1.57;
    leftWheel.material = rightWheel.material = centerWheel.material = material;
    
    //body
    var box = MeshBuilder.CreateBox("box", {size:3, width: 14, depth: 8}, scene);
    box.position = new Vector3(4.5, height, 0);
    var blueMat = new StandardMaterial("blue", scene);
    blueMat.diffuseColor = new Color3.Blue();
    box.material = blueMat;

    //ramp
    var ramp = MeshBuilder.CreateBox("ramp", {width: 4, depth: 40, height: 150}, scene);
    var ramp2 = MeshBuilder.CreateBox("ramp", {width: 4, depth: 40, height: 150}, scene);
    var ramp3 = MeshBuilder.CreateBox("ramp", {width: 4, depth: 40, height: 150}, scene);
    ramp.position = new Vector3(-70, 2, 0);
    ramp2.position = new Vector3(-100, 2, 0);
    ramp3.position = new Vector3(-140, 40, 0);
    ramp.rotation.z = 1.3;
    ramp2.rotation.z = 0.7;
   
    // Add Imposters
    var wheelDampening = 30;
    box.physicsImpostor = new PhysicsImpostor(box, PhysicsImpostor.BoxImpostor, { mass: 10, friction:0 }, scene);
    leftWheel.physicsImpostor = new PhysicsImpostor(leftWheel, PhysicsImpostor.CylinderImpostor, {damping: wheelDampening, mass: 10, restitution: 0}, scene);
    rightWheel.physicsImpostor = new PhysicsImpostor(rightWheel, PhysicsImpostor.CylinderImpostor, {damping: wheelDampening,  mass: 10, restitution: 0}, scene);
    centerWheel.physicsImpostor = new PhysicsImpostor(centerWheel, PhysicsImpostor.CylinderImpostor, {damping: wheelDampening, mass: 10, restitution: 0}, scene);
    ramp.physicsImpostor = new PhysicsImpostor(ramp, PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 1}, scene); 
    ramp2.physicsImpostor = new PhysicsImpostor(ramp2, PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 1}, scene); 
    ramp3.physicsImpostor = new PhysicsImpostor(ramp3, PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 1}, scene); 


   
    //Add Joint
    var leftJoint = new PhysicsJoint(PhysicsJoint.HingeJoint, {
		mainPivot: new Vector3(0, 6, 0),
        connectedPivot: new Vector3(-4.5, 0, 0),
        mainAxis: new Vector3(0, 1, 0),
        connectedAxis: new Vector3(0, 0, 1),
	}); 
  var rightJoint = new PhysicsJoint(PhysicsJoint.HingeJoint, {
		mainPivot: new Vector3(0, -6, 0),
        connectedPivot: new Vector3(-4.5, 0, 0),
        mainAxis: new Vector3(0, 1, 0),
        connectedAxis: new Vector3(0, 0, 1),
	}); 
  var centerJount = new PhysicsJoint(PhysicsJoint.HingeJoint, {
		mainPivot: new Vector3(0, 0, 0),
        connectedPivot: new Vector3(10.5, 0, 0),
        mainAxis: new Vector3(0, 1, 0),
        connectedAxis: new Vector3(0, 0, 1),
	}); 

  leftWheel.physicsImpostor.addJoint(box.physicsImpostor, leftJoint); 
  rightWheel.physicsImpostor.addJoint(box.physicsImpostor, rightJoint);
  centerWheel.physicsImpostor.addJoint(box.physicsImpostor, centerJount);
  
  var impulseDirection = new Vector3(1, 0, 0);
  var impulseMagnitude = -4500;
  var contactLocalRefPoint = new Vector3(0, 0, 0);
  box.physicsImpostor.applyImpulse(impulseDirection.scale(impulseMagnitude), box.getAbsolutePosition().add(contactLocalRefPoint));

  centerWheel.physicsImpostor.setAngularVelocity(new Vector3(0,0,10));
  leftWheel.physicsImpostor.setAngularVelocity(new Vector3(0,0,30));
  rightWheel.physicsImpostor.setAngularVelocity(new Vector3(0,0,30));
  //box.physicsImpostor.setAngularVelocity(new Vector3(0,0,45));
  

}

function testing(scene, camera){
    //Creating ground, sphere, cylinder
  
  var sphere = MeshBuilder.CreateSphere("sphere", {diameter: 3, segments: 32}, scene);
  var cylinder = MeshBuilder.CreateCylinder("cylinder", {height: 12, diameterTop: .5, diameterBottom: .1}, scene);
  var cube = MeshBuilder.CreateBox("cube", {height: 5, width: 5}, scene);
  //creating boundary boxes
  var left = MeshBuilder.CreateBox("left", {height: 7, width: 24}, scene);
  var right = MeshBuilder.CreateBox("right", {height: 7, width: 24}, scene);
  var top = MeshBuilder.CreateBox("top", {height: 7, width: 24}, scene);
  var bottom = MeshBuilder.CreateBox("bottom", {height: 7, width: 24}, scene);

  //adding colours


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
  //cylinder.physicsImpostor = new PhysicsImpostor(cylinder, PhysicsImpostor.BoxImpostor, { mass: 1, restitution: .9 }, scene)
  sphere.physicsImpostor = new PhysicsImpostor(sphere, PhysicsImpostor.SphereImpostor, { mass: 0, restitution: 0.9 }, scene);
  cube.physicsImpostor = new PhysicsImpostor(cube, PhysicsImpostor.BoxImpostor, {mass: 1, restitution: 0.9}, scene);
  top.physicsImpostor = new PhysicsImpostor(top, PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 0.9 }, scene);
  bottom.physicsImpostor = new PhysicsImpostor(bottom, PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 0.9 }, scene);
  left.physicsImpostor = new PhysicsImpostor(left, PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 0.9 }, scene);
  right.physicsImpostor = new PhysicsImpostor(right, PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 0.9 }, scene);

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
      runningApp.scene.getMeshByName("__root__").rotation = new Vector3(0,runningApp.scene.getMeshByName("__root__").rotation.y + 1,0);
    },
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
