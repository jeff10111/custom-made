<template>
  <div>
    <div>
      {{ this.userSelection["body"] }} with
      {{ this.userSelection.engine }} engine and
      {{ this.userSelection.powerup }} powerup
    </div>
    <div><button @click="spinArm">Spin!</button></div>
    <canvas id="gameCanvas" width="1000px" height="600px"></canvas>
  </div>
</template>

<script>
import * as BABYLON from 'babylonjs';
import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import "@babylonjs/loaders/glTF";
import {
  MotorEnabledJoint,
  PhysicsImpostor,
  PhysicsJoint,
} from "@babylonjs/core/Physics";
import { BoundingInfo, BoundingBox } from "@babylonjs/core/Culling";
//import {} from "@babylon/core/Events/keyboardEv";
import { StandardMaterial } from "@babylonjs/core/Materials";
import { NoiseProceduralTexture } from "@babylonjs/core/Materials/Textures/Procedurals";
import "@babylonjs/core/Physics/Plugins/cannonJSPlugin";
import {
  Skeleton,
  SceneLoader,
  Engine,
  Scene,
  ArcRotateCamera,
  Vector3,
  Mesh,
  MeshBuilder,
  HemisphericLight,
  Color3,
  DirectionalLight,
  FollowCamera,
} from "@babylonjs/core";
window.CANNON = require("cannon");
var runningApp;
var vehicle;

var createScene = async function (engine, canvas, vehicle) {
  //Creating scene, camera and lighting
  var scene = new Scene(engine);
  scene.clearColor = Color3.Purple();
  var camera = new ArcRotateCamera(
    "Camera",
    Math.PI / 5,
    Math.PI / 3,
    250,
    Vector3.Zero(),
    scene
  );
  camera.useFramingBehavior = true;
  camera.attachControl(canvas, true);
  new HemisphericLight("light1", new Vector3(1, 1, 0), scene);

  //Importing assets
  switch (vehicle) {
    case "Car":
      await SceneLoader.ImportMeshAsync("", "/assets/", "MT.glb", scene);
      break;
    case "Spaceship":
      await SceneLoader.ImportMeshAsync("", "/assets/", "omni.glb", scene);
      break;
    case "Train":
      await SceneLoader.ImportMeshAsync("", "/assets/", "train.glb", scene);
      break;
    case "Tank":
      await SceneLoader.ImportMeshAsync("", "/assets/", "tank.glb", scene);
      break;
  }
  //importing track
  await SceneLoader.ImportMeshAsync("","/assets/","track.glb")
  var track = scene.getMeshByName("Track");
  track.position = new Vector3(-125,-480,-760);

  //Creating the ground and enabling physics
  var ground = MeshBuilder.CreateGround(
    "ground",
    { width: 3000, height: 3000 },
    scene
  );
  var mat = new StandardMaterial("green", scene);
  mat.diffuseColor = new Color3.Green();
  ground.material = mat;
  scene.enablePhysics();
  ground.physicsImpostor = new PhysicsImpostor(
    ground,
    PhysicsImpostor.BoxImpostor,
    { mass: 0, restitution: 0 },
    scene
  );

  //Test function
  scene.ambientColor = new Color3(256, 0, 0);

  return scene;
};
class MT {
  constructor(scene) {
    this.scene = scene;
    this.speed = 10;
    this.torque = 10;
    this.motors = [];
    this.wheelDiam = 5.5;
    this.wheelHeight = 1;
    this.wheelRestitution = 1;
    this.bodyMass = 20;
    this.wheelFriction = 50;
    this.body = BABYLON.MeshBuilder.CreateBox(this.body, {width: 15, depth:20, height:6}, scene);
    this.w1 = BABYLON.MeshBuilder.CreateCylinder(this.w1, {diameter: this.wheelDiam, height: this.wheelHeight}, scene);
    this.w2 = BABYLON.MeshBuilder.CreateCylinder(this.w2, {diameter: this.wheelDiam, height: this.wheelHeight}, scene);
    this.frontPart = BABYLON.MeshBuilder.CreateBox(this.body, {width: 8, depth:20, height:6}, scene);
    this.b1 = BABYLON.MeshBuilder.CreateBox(this.b1, {size:2, height: 2.4}, scene);
    this.b2 = BABYLON.MeshBuilder.CreateBox(this.b1, {size:2, height: 2.4}, scene);


    //Body positioning and physics
    this.bodyParts();
    
    //WHEEL PART
    this.positionWheels();
    this.attachWheels();
    this.body.visibility = false;
    this.frontPart.visibility = false;
    this.w1.visibility = false;
    this.w2.visibility = false;
  }
  bodyParts()
  {
    //Moving body off ground a bit to avoid collisions with the ground
    this.body.position.y += 15;
    this.frontPart.parent = this.body;
    this.frontPart.position.y = 0;//need to make this relative
    this.frontPart.position.x = 10;
    this.frontPart.setParent(null);
    //attaching MOD mesh to babylon mesh, creating a physics imposter for babylon mesh
    var mesh = this.scene.getMeshByName("MTBody");
    mesh.parent = this.body;
    //Adding physics imposter to babylon mesh (the parent of the mod mesh)
    this.body.physicsImpostor = new BABYLON.PhysicsImpostor(this.body, BABYLON.PhysicsImpostor.BoxImpostor,{mass:this.bodyMass},this.scene);
    //Positioning the MOD mesh relative to the babylon mesh
    mesh.position.y -=12;
    mesh.position.z -=13;
    mesh.position.x +=0;
    //creating box physics for front part
    this.frontPart.physicsImpostor = new BABYLON.PhysicsImpostor(this.frontPart, BABYLON.PhysicsImpostor.BoxImpostor,{mass:5},this.scene);
    var newJoint = new BABYLON.PhysicsJoint(BABYLON.PhysicsJoint.LockJoint,{});
    this.body.physicsImpostor.addJoint(this.frontPart.physicsImpostor,newJoint);
    //bearings
    this.b1.parent = this.frontPart;
    this.b1.position.y = -4;
    this.b1.position.x = 2;
    this.b1.position.z = 6.5;//width
    this.b1.setParent(null);
    this.b1.physicsImpostor = new BABYLON.PhysicsImpostor(this.b1, BABYLON.PhysicsImpostor.BoxImpostor,{friction: 0, mass:1},this.scene);
    this.frontPart.physicsImpostor.addJoint(this.b1.physicsImpostor, newJoint);
    this.b2.parent = this.frontPart;
    this.b2.position.y = -4;
    this.b2.position.x = 2;
    this.b2.position.z = -6.5;//width
    this.b2.setParent(null);
    this.b2.physicsImpostor = new BABYLON.PhysicsImpostor(this.b2, BABYLON.PhysicsImpostor.BoxImpostor,{friction: 0, mass:1},this.scene);
    this.frontPart.physicsImpostor.addJoint(this.b2.physicsImpostor, newJoint);
  }

  positionWheels()
  {
    this.w1.rotate(BABYLON.Axis.X, Math.PI/2, BABYLON.Space.LOCAL);
    this.w2.rotate(BABYLON.Axis.X, Math.PI/2, BABYLON.Space.LOCAL);
    this.w1.position.y += 35;

    //Adding cylinder parent for wheel mesh, positioning relatively
    var mesh = this.scene.getMeshByName("MTLeft");
    mesh.parent = this.w1;
    mesh.rotate(BABYLON.Axis.X, Math.PI/2, BABYLON.Space.LOCAL);
    mesh.position.y += 3;//width
    mesh.position.z -=9.5;//actually y negative is up
    mesh.position.x += 3.5;//forward/backward
    mesh = this.scene.getMeshByName("MTRight");
    mesh.parent = this.w2;
    mesh.rotate(BABYLON.Axis.X, Math.PI/2, BABYLON.Space.LOCAL);
    mesh.position.y += 22.5;//width
    mesh.position.z -=9.5;//actually y negative is up
    mesh.position.x += 3.5;//forward/backward
    //Positioning the cylinder relative to the vehicle body, have to associate it with body first
    this.w1.parent = this.body;
    this.w2.parent = this.body;
    //setting the position adequately avoids collisions when creating the hinge joint
    this.w1.position.x = -4;//forwards/backwards
    this.w1.position.y = +12;//higher/lower
    this.w1.position.z = 12//left/right
    this.w2.position.x = -4;
    this.w2.position.y = +12;
    this.w2.position.z = -12;
  }

  attachWheels()
  {
    this.w1.setParent(null);
    //Adding physics to each wheel and attaching it
    this.w1.physicsImpostor = new BABYLON.PhysicsImpostor(this.w1, BABYLON.PhysicsImpostor.CylinderImpostor,{mass:1, friction: this.wheelFriction, restitution: this.wheelRestitution}, this.scene);
    var newJoint = new MotorEnabledJoint(PhysicsJoint.HingeJoint, {
        mainPivot: new Vector3(0, 0, 0), //Having these as zero means the pivot is in the wheel (good thing)
        connectedPivot: new Vector3(-3.5,-2.5,10), //(length,y,)
        mainAxis: new Vector3(0, -1, 0), //axis of rotation for body 1
        connectedAxis: new Vector3(0, 0, 1), //axis of rotation for body 2
      });
    this.w1.physicsImpostor.addJoint(this.body.physicsImpostor, newJoint);
    this.motors.push(newJoint);
    this.w2.setParent(null);
    this.w2.physicsImpostor = new BABYLON.PhysicsImpostor(this.w2, BABYLON.PhysicsImpostor.CylinderImpostor,{mass:1, friction:this.wheelFriction, restitution: this.wheelRestitution}, this.scene)
    newJoint = new MotorEnabledJoint(PhysicsJoint.HingeJoint, {
        mainPivot: new Vector3(0, 0, 0), //Having these as zero means the pivot is in the wheel (good thing)
        connectedPivot: new Vector3(-3.5,-2.5,-10), //(length,y,)
        mainAxis: new Vector3(0, -1, 0), //axis of rotation for body 1
        connectedAxis: new Vector3(0, 0, 1), //axis of rotation for body 2
      });
    this.w2.physicsImpostor.addJoint(this.body.physicsImpostor, newJoint);
    this.motors.push(newJoint);
  }
  
  forwards() {
    this.motors.map((x) => x.setMotor(+this.speed, this.torque*1.5));
  }
  backwards() {
    this.motors.map((x) => x.setMotor(-this.speed, this.torque*1.5));
  }
  right() {
    this.motors[0].setMotor(this.speed, this.torque);
    this.motors[1].setMotor(-this.speed, this.torque);
  }
  left() {
    this.motors[0].setMotor(-this.speed, this.torque);
    this.motors[1].setMotor(this.speed, this.torque);
  }
  releaseDrive() {
    this.motors[0].setMotor(0, this.torque / 3);
    this.motors[1].setMotor(0, this.torque / 3);
  }
  releaseSteering() {
    this.motors[0].setMotor(0, this.torque / 3);
    this.motors[1].setMotor(0, this.torque / 3);
  }
}

class TankPrototype {
  constructor(scene) {
    
  }

  forwards() {
    this.motors.map((x) => x.setMotor(-this.speed, this.torque));
  }
  backwards() {
    this.motors.map((x) => x.setMotor(this.speed, this.torque));
  }
  right() {
    this.motors[0].setMotor(this.speed, this.torque);
    this.motors[1].setMotor(-this.speed, this.torque);
  }
  left() {
    this.motors[0].setMotor(-this.speed, this.torque);
    this.motors[1].setMotor(this.speed, this.torque);
  }
  releaseDrive() {
    this.motors[0].setMotor(0, this.torque / 3);
    this.motors[1].setMotor(0, this.torque / 3);
  }
  releaseSteering() {
    this.motors[0].setMotor(0, this.torque / 3);
    this.motors[1].setMotor(0, this.torque / 3);
  }
}

class Omni 
{}

class Train {
  constructor(scene) {
  }
  
  forwards() {
    this.motors.map((x) => x.setMotor(-this.speed, this.torque));
  }
  backwards() {
    this.motors.map((x) => x.setMotor(this.speed, this.torque));
  }
  right() {
    this.motors[0].setMotor(this.speed, this.torque);
    this.motors[1].setMotor(-this.speed, this.torque);
  }
  left() {
    this.motors[0].setMotor(-this.speed, this.torque);
    this.motors[1].setMotor(this.speed, this.torque);
  }
  releaseDrive() {
    this.motors[0].setMotor(0, this.torque / 3);
    this.motors[1].setMotor(0, this.torque / 3);
  }
  releaseSteering() {
    this.motors[0].setMotor(0, this.torque / 3);
    this.motors[1].setMotor(0, this.torque / 3);
  }
}

class Tank {
  constructor(scene) {
    
  }

  
}

class BabylonApp {
  constructor(vehicleName) {
    this.vehicles = ["MT", "Train", "Omni", "Tank"];
    this.vi = 1;
    // create the canvas html element and attach it to the webpage
    var canvas = document.getElementById("gameCanvas");
    // initialize babylon scene and engine
    var engine = new Engine(canvas, true);
    var scene;
    var scenePromise = createScene(engine, canvas, vehicleName);
    scenePromise.then((returnedScene) => {
      scene = returnedScene;
      this.scene = returnedScene;

      switch (vehicleName) {
        case "Car":
          vehicle = new MT(scene);
          break;
        case "Train":
          vehicle = new Train(scene);
          break;
        case "Spaceship":
          vehicle = new Omni(scene);
          break;
        case "Tank":
          vehicle = new Tank(scene);
          break;
      }
      engine.runRenderLoop(() => {
        scene.render();
      });
    });

    window.addEventListener("keydown", (ev) => {
      // Shift+Ctrl+Alt+I
      if (ev.shiftKey && ev.ctrlKey && ev.altKey && ev.keyCode === 73) {
        if (scene.debugLayer.isVisible()) {
          scene.debugLayer.hide();
        } else {
          scene.debugLayer.show();
        }
      } else if (ev.key == "ArrowUp" || ev.key == "w") {
        vehicle.forwards();
      } else if (ev.key == "ArrowDown" || ev.key == "s") {
        vehicle.backwards();
      } else if (ev.key == "ArrowRight" || ev.key == "d") {
        vehicle.right();
      } else if (ev.key == "ArrowLeft" || ev.key == "a") {
        vehicle.left();
      } else if (ev.key == "c") {
        new FollowCamera();
      }
    });

    window.addEventListener("keyup", (ev) => {
      if (
        ev.key == "ArrowUp" ||
        ev.key == "w" ||
        ev.key == "ArrowDown" ||
        ev.key == "s"
      ) {
        vehicle.releaseDrive();
      } else if (
        ev.key == "ArrowRight" ||
        ev.key == "d" ||
        ev.key == "ArrowLeft" ||
        ev.key == "a"
      ) {
        vehicle.releaseSteering();
      }
    });

    window.addEventListener("resize", function () {
      engine.resize();
    });
  }
}

export default {
  name: "Simulation",
  props: {
    test: { one: "a", two: "a" }, //should be passing values as props but don't know how yet
  },
  methods: {
    spinArm() {},
  },
  data() {
    return { userSelection: { body: "", engine: "", powerup: "" }, mode: 0 };
  },
  mounted() {
    this.userSelection["body"] = this.$route.query.body;
    this.userSelection["engine"] = this.$route.query.engine;
    this.userSelection["powerup"] = this.$route.query.powerup;
    let Application = new BabylonApp(this.userSelection["body"]);
    runningApp = Application;
  },
};
</script>
