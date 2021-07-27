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
//import {} from "@babylon/core/Events/keyboardEv";
import { StandardMaterial } from "@babylonjs/core/Materials";
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
var vehicle;
var vehicles = {};

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
  await SceneLoader.ImportMeshAsync("", "/assets/", "MT.glb", scene);
  await SceneLoader.ImportMeshAsync("", "/assets/", "Omni.glb", scene);
  await SceneLoader.ImportMeshAsync("", "/assets/", "Train.glb", scene);
  await SceneLoader.ImportMeshAsync("", "/assets/", "Tank.glb", scene);
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

  scene.ambientColor = new Color3(256, 0, 0);

  return scene;
};
class MT {
  constructor(scene,x,z) {
    this.scene = scene;
    this.attr = {
      speed: 10, torque: 10,
      wheelDiam: 5.5, wheelHeight: 1, wheelRestitution: 1, 
      bodyMass: 20, wheelFriction: 50
    };
    //the position offset can be added to these meshes, and should be added to the MOD meshes
    this.meshes = {
      body: BABYLON.MeshBuilder.CreateBox(null, {width: 15, depth:20, height:6}, scene),
      front: BABYLON.MeshBuilder.CreateBox(null, {width: 8, depth:20, height:6}, scene),
      wheel1: BABYLON.MeshBuilder.CreateCylinder(null, {diameter: this.attr.wheelDiam, height: this.attr.wheelHeight}, scene),
      wheel2: BABYLON.MeshBuilder.CreateCylinder(null, {diameter: this.attr.wheelDiam, height: this.attr.wheelHeight}, scene),
      b1: BABYLON.MeshBuilder.CreateBox(null, {size:2, height: 2.4}, scene),
      b2: BABYLON.MeshBuilder.CreateBox(null, {size:2, height: 2.4}, scene),
    };
    this.motors = [];
    //Offset
    this.meshes.body.position.x = x;
    this.meshes.body.position.z = z;
    //Body part
    this.attachBodyParts();
    //Wheel part
    this.attachWheels();
  }
  attachBodyParts()
  {
    let body = this.meshes.body;
    let front = this.meshes.front;
    let b1 = this.meshes.b1;
    let b2 = this.meshes.b2;
    //Moving body off ground a bit to avoid collisions with the ground
    body.position.y += 15;
    front.parent = this.meshes.body;
    front.position.y = 0;
    front.position.x = 10;
    front.setParent(null);
    //attaching MOD mesh to babylon mesh, creating a physics imposter for babylon mesh
    var mesh = this.scene.getMeshByName("MTBody");
    mesh.parent = body;
    //Positioning the MOD mesh relative to the babylon mesh
    mesh.position.y -=12;
    mesh.position.z -=13;
    mesh.position.x +=0;
    //Adding physics imposter to babylon mesh (the parent of the mod mesh)
    this.meshes.body.physicsImpostor = 
    new BABYLON.PhysicsImpostor(body, BABYLON.PhysicsImpostor.BoxImpostor,{mass:this.attr.bodyMass},this.scene);
    //creating box physics for front part
    front.physicsImpostor =
    new BABYLON.PhysicsImpostor(front, BABYLON.PhysicsImpostor.BoxImpostor,{mass:5},this.scene);
    var newJoint = new BABYLON.PhysicsJoint(BABYLON.PhysicsJoint.LockJoint,{});
    this.meshes.body.physicsImpostor.addJoint(front.physicsImpostor,newJoint);
    //bearings
    b1.parent = front;
    b1.position.y = -4;
    b1.position.x = 2;
    b1.position.z = 6.5;//width
    b1.setParent(null);
    b1.physicsImpostor = new BABYLON.PhysicsImpostor(b1, BABYLON.PhysicsImpostor.BoxImpostor,{friction: 0, mass:1},this.scene);
    front.physicsImpostor.addJoint(b1.physicsImpostor, newJoint);
    b2.parent = front;
    b2.position.y = -4;
    b2.position.x = 2;
    b2.position.z = -6.5;//width
    b2.setParent(null);
    b2.physicsImpostor = new BABYLON.PhysicsImpostor(b2, BABYLON.PhysicsImpostor.BoxImpostor,{friction: 0, mass:1},this.scene);
    front.physicsImpostor.addJoint(b2.physicsImpostor, newJoint);
  }

  attachWheels()
  {
    let w1 = this.meshes.wheel1;
    let w2 = this.meshes.wheel2;
    let body = this.meshes.body;
    w1.rotate(BABYLON.Axis.X, Math.PI/2, BABYLON.Space.LOCAL);
    w2.rotate(BABYLON.Axis.X, Math.PI/2, BABYLON.Space.LOCAL);
    this.wheelMeshParent(this.scene.getMeshByName("MTLeft"),w1,3.5,3,-9.5);
    this.wheelMeshParent(this.scene.getMeshByName("MTRight"),w2,3.5,22.7,-9.5);
    this.wheelPositioning(body,w1,-3.5,-2.5,10);
    this.wheelPositioning(body,w2,-3.5,-2.5,-10);
    this.wheelJoint(body,w1,-3.5,-2.5,10);
    this.wheelJoint(body, w2,-3.5,-2.5,-10);
  }

  wheelPositioning(body, wheel, x, y, z)
  {
    wheel.parent = body;
    wheel.position.y = y;
    wheel.position.z = z;//width
    wheel.position.x = x;
  }

  wheelMeshParent(mesh, parentMesh,x,y,z)
  {
    mesh.parent = parentMesh;
    mesh.rotate(BABYLON.Axis.X, Math.PI/2, BABYLON.Space.LOCAL);
    mesh.position.y = y;//width
    mesh.position.z = z;// y negative is up
    mesh.position.x = x;//forward/backward
  }

  wheelJoint(body, wheel, x, y, z)
  {
    wheel.setParent(null);
    wheel.physicsImpostor = new BABYLON.PhysicsImpostor(wheel, BABYLON.PhysicsImpostor.CylinderImpostor,{mass:1, friction: this.attr.wheelFriction, restitution: this.attr.wheelRestitution}, this.scene);
    var newJoint = new MotorEnabledJoint(PhysicsJoint.HingeJoint, {
        mainPivot: new Vector3(0, 0, 0), //Having these as zero means the pivot is in the wheel (good thing)
        connectedPivot: new Vector3(x,y,z), //(length,y,)
        mainAxis: new Vector3(0, -1, 0), //axis of rotation for body 1
        connectedAxis: new Vector3(0, 0, 1), //axis of rotation for body 2
      });
    wheel.physicsImpostor.addJoint(body.physicsImpostor, newJoint);
    this.motors.push(newJoint);
  }
  
  forwards() {
    this.motors.map((x) => x.setMotor(+this.attr.speed, this.attr.torque));
  }
  backwards() {
    this.motors.map((x) => x.setMotor(-this.attr.speed, this.attr.torque*1.5));
  }
  right() {
    this.motors[0].setMotor(this.attr.speed, this.attr.torque);
    this.motors[1].setMotor(-this.attr.speed, this.attr.torque);
  }
  left() {
    this.motors[0].setMotor(-this.attr.speed, this.attr.torque);
    this.motors[1].setMotor(this.attr.speed, this.attr.torque);
  }
  releaseDrive() {
    this.motors[0].setMotor(0, this.attr.torque / 3);
    this.motors[1].setMotor(0, this.attr.torque / 3);
  }
  releaseSteering() {
    this.motors[0].setMotor(0, this.attr.torque / 3);
    this.motors[1].setMotor(0, this.attr.torque / 3);
  }
}

class Omni 
{}

class Train {
  constructor(scene,x,z) {
    this.scene = scene;
    this.attr = {
      speed: 10, torque: 10,
      wheelDiam: 5.5, wheelHeight: 1, wheelRestitution: 1, 
      bodyMass: 20, wheelFriction: 50
    };
    this.meshes = {
      body: BABYLON.MeshBuilder.CreateBox(null, {width: 20, depth:15, height:6}, scene),
      front: BABYLON.MeshBuilder.CreateBox(null, {width: 8, depth:15, height:6}, scene),
      wheelL1: BABYLON.MeshBuilder.CreateCylinder(null, {diameter: this.attr.wheelDiam, height: this.attr.wheelHeight}, scene),
      wheelL2: BABYLON.MeshBuilder.CreateCylinder(null, {diameter: this.attr.wheelDiam, height: this.attr.wheelHeight}, scene),
      wheelL3: BABYLON.MeshBuilder.CreateCylinder(null, {diameter: this.attr.wheelDiam, height: this.attr.wheelHeight}, scene),
      wheelR1: BABYLON.MeshBuilder.CreateCylinder(null, {diameter: this.attr.wheelDiam, height: this.attr.wheelHeight}, scene),
      wheelR2: BABYLON.MeshBuilder.CreateCylinder(null, {diameter: this.attr.wheelDiam, height: this.attr.wheelHeight}, scene),
      wheelR3: BABYLON.MeshBuilder.CreateCylinder(null, {diameter: this.attr.wheelDiam, height: this.attr.wheelHeight}, scene),
    };
    this.motors = [];
    //Offset
    this.meshes.body.position.x = x;
    this.meshes.body.position.z = z;
    //Body positioning and physics
    this.attachBodyParts();
    //Wheel positioning and physics
    this.attachWheels();
    //Make all physics meshes invisible
  }

  attachBodyParts()
  {
    let body = this.meshes.body;
    let front = this.meshes.front;
    //pull body out of the ground
    body.position.y += 20;
    //positioning front part relative to main body mass then removing 
    front.parent = body;
    front.position.y = 0;
    front.position.x += 13;
    front.setParent(null);
    //Attaching mod mesh to babylon mesh
    var mesh = this.scene.getMeshByName("TrainBody");
    mesh.parent = body;
    //Positioning the MOD mesh relative to the babylon mesh
    mesh.position.y -= 8.2;
    mesh.position.z -= 19.5;
    mesh.position.x -= 2;
    //Adding physics imposter to body mesh (the parent of the mod mesh)
    this.meshes.body.physicsImpostor = 
    new BABYLON.PhysicsImpostor(body, BABYLON.PhysicsImpostor.BoxImpostor,{mass:this.attr.bodyMass},this.scene);
    //Adding physics to front part
    front.physicsImpostor =
    new BABYLON.PhysicsImpostor(front, BABYLON.PhysicsImpostor.BoxImpostor,{mass:1},this.scene);
    var newJoint = new BABYLON.PhysicsJoint(BABYLON.PhysicsJoint.LockJoint,{});
    this.meshes.body.physicsImpostor.addJoint(front.physicsImpostor,newJoint);
  }

  attachWheels()
  {
    let L1 = this.meshes.wheelL1;
    let L2 = this.meshes.wheelL2;
    let L3 = this.meshes.wheelL3;
    let R1 = this.meshes.wheelR1;
    let R2 = this.meshes.wheelR2;
    let R3 = this.meshes.wheelR3;
    let body = this.meshes.body;
    let wheelWidth = 8.5;
    let wheelHeight = -1.5;

    //Rotating all the wheels so the face is parralel with the ground
    L1.rotate(BABYLON.Axis.X, Math.PI/2, BABYLON.Space.LOCAL);
    L2.rotate(BABYLON.Axis.X, Math.PI/2, BABYLON.Space.LOCAL);
    L3.rotate(BABYLON.Axis.X, Math.PI/2, BABYLON.Space.LOCAL);
    R1.rotate(BABYLON.Axis.X, Math.PI/2, BABYLON.Space.LOCAL);
    R2.rotate(BABYLON.Axis.X, Math.PI/2, BABYLON.Space.LOCAL);
    R3.rotate(BABYLON.Axis.X, Math.PI/2, BABYLON.Space.LOCAL);
   
    //Adding cylinder parent for mod wheel mesh, positioning relatively
    this.wheelMeshParent(this.scene.getMeshByName("TL1"),L1,4,11.5,-7.1);
    this.wheelMeshParent(this.scene.getMeshByName("TL2"),L2,-2.3,11.5,-7.1);
    this.wheelMeshParent(this.scene.getMeshByName("TL3"),L3,-9,11.5,-7.1);
    this.wheelMeshParent(this.scene.getMeshByName("TR1"),R1,4,27.5,-7.1);
    this.wheelMeshParent(this.scene.getMeshByName("TR2"),R2,-2.3,27.5,-7.1);
    this.wheelMeshParent(this.scene.getMeshByName("TR3"),R3,-9,27.5,-7.1);

    //Positioning the babylon/parent meshes relative to the vehicle
    this.wheelPositioning(body, L1, -6,wheelHeight,wheelWidth);
    this.wheelPositioning(body, L2, 0.5,wheelHeight,wheelWidth);
    this.wheelPositioning(body, L3, 7,wheelHeight,wheelWidth);
    this.wheelPositioning(body, R1, -6,wheelHeight,-wheelWidth);
    this.wheelPositioning(body, R2, 0.5,wheelHeight,-wheelWidth);
    this.wheelPositioning(body, R3, 7,wheelHeight,-wheelWidth);

    //adding physics to wheel and attaching it to the body
    this.wheelJoint(body,L1, -6,wheelHeight,wheelWidth);
    this.wheelJoint(body,L2, 0.5,wheelHeight,wheelWidth);
    this.wheelJoint(body,L3, 7,wheelHeight,wheelWidth);
    this.wheelJoint(body,R1, -6,wheelHeight,-wheelWidth);
    this.wheelJoint(body,R2, 0.5,wheelHeight,-wheelWidth);
    this.wheelJoint(body,R3, 7,wheelHeight,-wheelWidth);

  }

  wheelPositioning(body, wheel, x, y, z)
  {
    wheel.parent = body;
    wheel.position.y = y;
    wheel.position.z = z;//width
    wheel.position.x = x;
  }

  wheelMeshParent(mesh, parentMesh,x,y,z)
  {
    mesh.parent = parentMesh;
    mesh.rotate(BABYLON.Axis.X, Math.PI/2, BABYLON.Space.LOCAL);
    mesh.position.y = y;//width
    mesh.position.z = z;// y negative is up
    mesh.position.x = x;//forward/backward
  }

  wheelJoint(body, wheel, x,y,z)
  {
    wheel.setParent(null);
    wheel.physicsImpostor = new BABYLON.PhysicsImpostor(wheel, BABYLON.PhysicsImpostor.CylinderImpostor,{mass:1, friction: this.attr.wheelFriction, restitution: this.attr.wheelRestitution}, this.scene);
    var newJoint = new MotorEnabledJoint(PhysicsJoint.HingeJoint, {
        mainPivot: new Vector3(0, 0, 0), //Having these as zero means the pivot is in the wheel (good thing)
        connectedPivot: new Vector3(x,y,z), //(length,y,)
        mainAxis: new Vector3(0, -1, 0), //axis of rotation for body 1
        connectedAxis: new Vector3(0, 0, 1), //axis of rotation for body 2
      });
    wheel.physicsImpostor.addJoint(body.physicsImpostor, newJoint);
    this.motors.push(newJoint);
  }

  forwards()
  {
    this.motors.map((x) => x.setMotor(+this.attr.speed, this.attr.torque));
  }

  backwards()
  {
    this.motors.map((x) => x.setMotor(-this.attr.speed, this.attr.torque*1.5));
  }

  left()
  {
    this.motors[0].setMotor(-this.attr.speed,this.attr.torque);
    this.motors[1].setMotor(-this.attr.speed,this.attr.torque);
    this.motors[2].setMotor(-this.attr.speed,this.attr.torque);
    this.motors[3].setMotor(this.attr.speed,this.attr.torque);
    this.motors[4].setMotor(this.attr.speed,this.attr.torque);
    this.motors[5].setMotor(this.attr.speed,this.attr.torque);
  }

  right()
  {
    this.motors[0].setMotor(this.attr.speed,this.attr.torque);
    this.motors[1].setMotor(this.attr.speed,this.attr.torque);
    this.motors[2].setMotor(this.attr.speed,this.attr.torque);
    this.motors[3].setMotor(-this.attr.speed,this.attr.torque);
    this.motors[4].setMotor(-this.attr.speed,this.attr.torque);
    this.motors[5].setMotor(-this.attr.speed,this.attr.torque);
  }

  releaseDrive()
  {
    this.motors.map((x) => x.setMotor(0, this.attr.torque/3));
  }

  releaseSteering()
  {
    this.motors.map((x) => x.setMotor(0, this.attr.torque/3));
  }

}

class Tank {
  constructor(scene,x,z) {
    this.scene = scene;
    this.attr = {
      speed: 10, torque: 10,
      wheelDiam: 5.5, wheelHeight: 1, wheelRestitution: 1, 
      bodyMass: 0, wheelFriction: 50
    };
    this.meshes = {
      body: BABYLON.MeshBuilder.CreateBox(null, {width: 20, depth:15, height:6}, scene),
      wheelL1: BABYLON.MeshBuilder.CreateCylinder(null, {diameter: this.attr.wheelDiam, height: this.attr.wheelHeight}, scene),
      wheelL2: BABYLON.MeshBuilder.CreateCylinder(null, {diameter: this.attr.wheelDiam, height: this.attr.wheelHeight}, scene),
      wheelL3: BABYLON.MeshBuilder.CreateCylinder(null, {diameter: this.attr.wheelDiam, height: this.attr.wheelHeight}, scene),
      wheelL4: BABYLON.MeshBuilder.CreateCylinder(null, {diameter: this.attr.wheelDiam, height: this.attr.wheelHeight}, scene),
      wheelR1: BABYLON.MeshBuilder.CreateCylinder(null, {diameter: this.attr.wheelDiam, height: this.attr.wheelHeight}, scene),
      wheelR2: BABYLON.MeshBuilder.CreateCylinder(null, {diameter: this.attr.wheelDiam, height: this.attr.wheelHeight}, scene),
      wheelR3: BABYLON.MeshBuilder.CreateCylinder(null, {diameter: this.attr.wheelDiam, height: this.attr.wheelHeight}, scene),
      wheelR4: BABYLON.MeshBuilder.CreateCylinder(null, {diameter: this.attr.wheelDiam, height: this.attr.wheelHeight}, scene),
  };
    this.motors = [];
    //Offset
    this.meshes.body.position.x = x;
    this.meshes.body.position.z = z;
    //Body positioning and physics
    this.attachBodyParts();
    //Wheel positioning and physics
    this.attachWheels();
    //Make all physics meshes invisible
    
  }
  attachBodyParts()
  {
    let body = this.meshes.body;
    var mesh = this.scene.getMeshByName("TankBody");
    mesh.parent = body;
    //Positioning the MOD mesh relative to the babylon mesh
    mesh.position.y -= 8.2;
    mesh.position.z -= 19.5;
    mesh.position.x -= 2;
    //Adding physics imposter to body mesh (the parent of the mod mesh)
    this.meshes.body.physicsImpostor = 
    new BABYLON.PhysicsImpostor(body, BABYLON.PhysicsImpostor.BoxImpostor,{mass:this.attr.bodyMass},this.scene);
  }
  attachWheels()
  {

  }

  wheelPositioning(body, wheel, x, y, z)
  {
    wheel.parent = body;
    wheel.position.y = y;
    wheel.position.z = z;//width
    wheel.position.x = x;
  }

  wheelMeshParent(mesh, parentMesh,x,y,z)
  {
    mesh.parent = parentMesh;
    mesh.rotate(BABYLON.Axis.X, Math.PI/2, BABYLON.Space.LOCAL);
    mesh.position.y = y;//width
    mesh.position.z = z;// y negative is up
    mesh.position.x = x;//forward/backward
  }

  wheelJoint(body, wheel, x,y,z)
  {
    wheel.setParent(null);
    wheel.physicsImpostor = new BABYLON.PhysicsImpostor(wheel, BABYLON.PhysicsImpostor.CylinderImpostor,{mass:1, friction: this.attr.wheelFriction, restitution: this.attr.wheelRestitution}, this.scene);
    var newJoint = new MotorEnabledJoint(PhysicsJoint.HingeJoint, {
        mainPivot: new Vector3(0, 0, 0), //Having these as zero means the pivot is in the wheel (good thing)
        connectedPivot: new Vector3(x,y,z), //(length,y,)
        mainAxis: new Vector3(0, -1, 0), //axis of rotation for body 1
        connectedAxis: new Vector3(0, 0, 1), //axis of rotation for body 2
      });
    wheel.physicsImpostor.addJoint(body.physicsImpostor, newJoint);
    this.motors.push(newJoint);
  }

  forwards()
  {

  }
  backwards()
  {

  }
  left()
  {

  }
  right()
  {

  }
  releaseDrive()
  {

  }
  releaseSteering()
  {

  }
  
}

function switchVehicle(vehicleName, scene)
{
    switch (vehicleName) {
        case "Car":
          vehicle = vehicles.MT;
          break;
        case "Train":
          vehicle = vehicles.Train;
          break;
        case "Spaceship":
          vehicle = vehicles.Omni;
          break;
        case "Tank":
          vehicle = vehicles.Tank;
          break;
      }
}

class BabylonApp {
  constructor(vehicleName) {
    // create the canvas html element and attach it to the webpage
    var canvas = document.getElementById("gameCanvas");
    // initialize babylon scene and engine
    var engine = new Engine(canvas, true);
    var scene;
    var scenePromise = createScene(engine, canvas, vehicleName);
    scenePromise.then((returnedScene) => {
      scene = returnedScene;
      this.scene = returnedScene;
      vehicles = {MT: new MT(scene,50,0), Train: new Train(scene,50,50), Tank: new Tank(scene,50,100)}
      switchVehicle(vehicleName);  
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
  },
};
</script>
