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
    this.meshNames = [
      "MTL1",
      "MTL2",
      "MTR1",
      "MTR2",
      "MTNoWheels",
      "MTLB",
      "MTRB",
    ];
    this.meshNames.map((x) => (scene.getMeshByName(x).parent = null));
    this.body = scene.getMeshByName("MTNoWheels");
    this.wheels = [];
    this.motors = [];
    this.wheelMass = 1;
    this.bodyMass = 100;
    this.torque = 100;
    this.speed = 10;
    this.friction = 50;
    this.body.physicsImpostor = new PhysicsImpostor(
      this.body,
      PhysicsImpostor.BoxImpostor,
      { mass: this.bodyMass },
      scene
    );
    this.attachWheel(0, -7, -6.5, -9, scene, true);
    this.attachWheel(2, -7, -6.5, 9, scene, true);
    this.attachWheel(1, 8, -6, -9, scene, false);
    this.attachWheel(3, 8, -6, 9, scene, false);
    scene.getMeshByName("MTL2").physicsImpostor.friction = 5;
    scene.getMeshByName("MTR2").physicsImpostor.friction = 5;
    this.attachBearing(5, 0, -0.9, 0, scene);
    this.attachBearing(6, 0, -0.9, 0, scene);
  }
  attachWheel(index, x, y, z, scene, motor) {
    var mesh = scene.getMeshByName(this.meshNames[index]);
    var newJoint;
    mesh.physicsImpostor = new PhysicsImpostor(
      mesh,
      PhysicsImpostor.SphereImpostor,
      { mass: this.wheelMass, friction: this.friction },
      scene
    );
    if (motor) {
      newJoint = new MotorEnabledJoint(PhysicsJoint.HingeJoint, {
        mainPivot: new Vector3(0, 0, 0), //Having these as zero means the pivot is in the wheel (good thing)
        connectedPivot: new Vector3(
          this.body.position.x + x,
          y,
          this.body.position.z + z
        ), //(length,y,)
        mainAxis: new Vector3(0, 0, 1), //axis of rotation for body 1
        connectedAxis: new Vector3(0, 0, 1), //axis of rotation for body 2
      });
      mesh.physicsImpostor.addJoint(this.body.physicsImpostor, newJoint);
      this.motors.push(newJoint);
    } else {
      newJoint = new PhysicsJoint(PhysicsJoint.HingeJoint, {
        mainPivot: new Vector3(0, 0, 0), //Having these as zero means the pivot is in the wheel (good thing)
        connectedPivot: new Vector3(
          this.body.position.x + x,
          y,
          this.body.position.z + z
        ), //(length,y,)
        mainAxis: new Vector3(0, 0, 1), //axis of rotation for body 1
        connectedAxis: new Vector3(0, 0, 1), //axis of rotation for body 2
      });
      mesh.physicsImpostor.addJoint(this.body.physicsImpostor, newJoint);
    }
  }
  attachBearing(index, x, y, z, scene) {
    var mesh = scene.getMeshByName(this.meshNames[index]);
    var newJoint;
    mesh.position = new Vector3(x, y, z);
    mesh.physicsImpostor = new PhysicsImpostor(
      mesh,
      PhysicsImpostor.BoxImpostor,
      { mass: 50, friction: 0 },
      scene
    );
    newJoint = new PhysicsJoint(PhysicsJoint.LockJoint, {});
    mesh.physicsImpostor.addJoint(this.body.physicsImpostor, newJoint);
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

class TankPrototype {
  constructor(scene) {
    this.wheels = [];
    this.joints = [];
    this.wheelMass = 1;
    this.wheelFriction = 50;
    this.height = 10;
    this.mass = 1500;
    this.torque = 15;
    this.maxSpeed = 100;
    this.wheelDamping = 100;

    this.tankBody = MeshBuilder.CreateBox(
      "tankBody",
      { width: 22.5, depth: 3, height: 10 },
      scene
    );
    this.tankBody.position = new Vector3(0, this.height, 0);
    this.tankBody.rotation = new Vector3(1.57, 0, 0);
    this.tankBody.physicsImpostor = new PhysicsImpostor(
      this.tankBody,
      PhysicsImpostor.BoxImpostor,
      { mass: this.mass, friction: 10 },
      scene
    );

    this.buildWheels(scene);
    this.addJoints();
    this.colours();
  }

  buildWheels(scene) {
    var wheelLength = 6; //Where wheels start from, front to back
    var wheelWidth = -6; //wheel width from body
    var wheelSpace = 4; //space between each wheel
    var wheelHeight = this.height - 8;

    for (var m = 0, newWheel; m < 4; m += 1) {
      newWheel = MeshBuilder.CreateCylinder(
        "",
        { height: 1, diameter: 3 },
        this.scene
      );
      newWheel.showBoundingBox = true;
      newWheel.rotation = new Vector3(Math.PI / 2, 0, 0);
      newWheel.position = new Vector3(
        wheelLength - wheelSpace * m,
        wheelHeight,
        wheelWidth
      );
      newWheel.physicsImpostor = new PhysicsImpostor(
        newWheel,
        PhysicsImpostor.CylinderImpostor,
        {
          mass: this.wheelMass,
          friction: this.wheelFriction,
          damping: this.wheelDamping,
        },
        scene
      );
      this.wheels.push(newWheel);
    }
    for (m = 0, wheelWidth = 6; m < 4; m += 1) {
      newWheel = MeshBuilder.CreateCylinder(
        "",
        { height: 1, diameter: 3 },
        this.scene
      );
      newWheel.showBoundingBox = true;
      newWheel.rotation = new Vector3(Math.PI / 2, 0, 0);
      newWheel.position = new Vector3(
        wheelLength - wheelSpace * m,
        wheelHeight,
        wheelWidth
      );
      newWheel.physicsImpostor = new PhysicsImpostor(
        newWheel,
        PhysicsImpostor.CylinderImpostor,
        {
          mass: this.wheelMass,
          friction: this.wheelFriction,
          damping: this.wheelDamping,
        },
        scene
      );
      this.wheels.push(newWheel);
    }
  }

  colours(scene) {
    var blueMat = new StandardMaterial("blue", scene);
    this.tankBody.material = blueMat;
    blueMat.diffuseColor = new Color3.Blue();

    var material = new StandardMaterial("material", scene);
    var texture = new NoiseProceduralTexture("perlin", 256, scene);
    material.diffuseTexture = texture;
    for (var x in this.wheels) {
      this.wheels[x].material = material;
    }
  }

  addJoints() {
    var wheelSpace = 4; //space between each wheel in a row
    var wheelLength = 6; //starting distance from front of vehicle
    var newJoint;
    var m;
    for (m = 0; m < 4; m += 1) {
      newJoint = new MotorEnabledJoint(PhysicsJoint.HingeJoint, {
        mainPivot: new Vector3(0, 0, 0), //Having these as zero means the pivot is in the wheel (good thing)
        connectedPivot: new Vector3(wheelLength - wheelSpace * m, -6, 5), //(front/back,???,ride height of vehcicle)
        mainAxis: new Vector3(0, 1, 0), //axis of rotation for body 1
        connectedAxis: new Vector3(0, 1, 0), //axis of rotation for body 2
      });
      this.wheels[m].physicsImpostor.addJoint(
        this.tankBody.physicsImpostor,
        newJoint
      );
      this.joints.push(newJoint);
    }
    for (m = 0; m < 4; m += 1) {
      newJoint = new MotorEnabledJoint(PhysicsJoint.HingeJoint, {
        mainPivot: new Vector3(0, 0, 0), //Having these as zero means the pivot is in the wheel (good thing)
        connectedPivot: new Vector3(wheelLength - wheelSpace * m, 6, 5), //(front/back,???,ride height of vehcicle)
        mainAxis: new Vector3(0, 1, 0), //axis of rotation for body 1
        connectedAxis: new Vector3(0, 1, 0), //axis of rotation for body 2
      });
      this.wheels[m + 4].physicsImpostor.addJoint(
        this.tankBody.physicsImpostor,
        newJoint
      );
      this.joints.push(newJoint);
    }
  }

  forwards() {
    for (var x in this.joints) {
      this.joints[x].setMotor(this.maxSpeed, this.torque);
    }
  }

  backwards() {
    for (var x in this.joints) {
      this.joints[x].setMotor(-this.maxSpeed, this.torque);
    }
  }

  left() {
    for (var x in this.joints) {
      x < 4
        ? this.joints[x].setMotor(-this.maxSpeed, this.torque)
        : this.joints[x].setMotor(this.maxSpeed, this.torque);
    }
  }

  right() {
    for (var x in this.joints) {
      x > 4
        ? this.joints[x].setMotor(-this.maxSpeed, this.torque)
        : this.joints[x].setMotor(this.maxSpeed, this.torque);
    }
  }

  releaseDrive() {
    this.release();
  }
  releaseSteering() {
    this.release();
  }
  release() {
    for (var x in this.joints) {
      this.joints[x].setMotor(0, 1);
    }
  }
}

class CarPrototype {
  constructor(scene) {
    this.frontWheels = false;
    this.wheels = [];
    this.joints = [];
    this.steeringJoints = [];
    this.steeringBoxes = [];
    this.wheelFriction = 100;
    this.height = 10;
    this.mass = 1;
    this.wheelMass = 1;
    this.pivotMass = 1;
    this.torque = (this.mass + this.pivotMass * 2 + this.wheelMass * 4) * 0.2; //Suggested values are 1/100 to 1/10 times the mass
    this.maxSpeed = 100;
    this.steeringTorque = 100;
    this.restitution = 1;
    this.wheelDiameter = 6;
    this.connector;

    this.body = MeshBuilder.CreateBox(
      "body",
      { width: 22.5, depth: 3, height: 10 },
      scene
    );
    this.body.position = new Vector3(0, this.height, 0);
    this.body.rotation = new Vector3(1.57, 0, 0);
    this.body.physicsImpostor = new PhysicsImpostor(
      this.body,
      PhysicsImpostor.BoxImpostor,
      { mass: this.mass, friction: 10 },
      scene
    );

    this.buildWheels(scene);
    this.addJoints();
    this.colours();
    //this.releaseSteering();
  }

  buildWheels(scene) {
    let wheelWidth = 8;
    let height = this.body.position.y - 2;
    {
      //Build wheels
      var newWheel = MeshBuilder.CreateCylinder(
        "",
        { height: 1, diameter: this.wheelDiameter },
        this.scene
      );
      newWheel.showBoundingBox = true;
      newWheel.rotation = new Vector3(Math.PI / 2, 0, 0);
      newWheel.position = new Vector3(
        this.body.position.x + 8,
        height,
        wheelWidth
      );
      newWheel.physicsImpostor = new PhysicsImpostor(
        newWheel,
        PhysicsImpostor.CylinderImpostor,
        {
          mass: this.wheelMass,
          friction: this.wheelFriction,
          restitution: this.restitution,
        },
        scene
      );
      this.wheels.push(newWheel);

      newWheel = MeshBuilder.CreateCylinder(
        "",
        { height: 1, diameter: this.wheelDiameter },
        this.scene
      );
      newWheel.showBoundingBox = true;
      newWheel.rotation = new Vector3(Math.PI / 2, 0, 0);
      newWheel.position = new Vector3(
        this.body.position.x + 8,
        height,
        -wheelWidth
      );
      newWheel.physicsImpostor = new PhysicsImpostor(
        newWheel,
        PhysicsImpostor.CylinderImpostor,
        {
          mass: this.wheelMass,
          friction: this.wheelFriction,
          restitution: this.restitution,
        },
        scene
      );
      this.wheels.push(newWheel);

      newWheel = MeshBuilder.CreateCylinder(
        "",
        { height: 1, diameter: this.wheelDiameter },
        this.scene
      );
      newWheel.showBoundingBox = true;
      newWheel.rotation = new Vector3(Math.PI / 2, 0, 0);
      newWheel.position = new Vector3(
        this.body.position.x - 8,
        height,
        wheelWidth
      );
      newWheel.physicsImpostor = new PhysicsImpostor(
        newWheel,
        PhysicsImpostor.CylinderImpostor,
        {
          mass: this.wheelMass,
          friction: this.wheelFriction,
          restitution: this.restitution,
        },
        scene
      );
      this.wheels.push(newWheel);

      newWheel = MeshBuilder.CreateCylinder(
        "",
        { height: 1, diameter: this.wheelDiameter },
        this.scene
      );
      newWheel.showBoundingBox = true;
      newWheel.rotation = new Vector3(Math.PI / 2, 0, 0);
      newWheel.position = new Vector3(
        this.body.position.x - 8,
        height,
        -wheelWidth
      );
      newWheel.physicsImpostor = new PhysicsImpostor(
        newWheel,
        PhysicsImpostor.CylinderImpostor,
        {
          mass: this.wheelMass,
          friction: this.wheelFriction,
          restitution: this.restitution,
        },
        scene
      );
      this.wheels.push(newWheel);
    }
    {
      //Build steering boxes
      var steeringBox = MeshBuilder.CreateBox(
        "",
        { depth: 0.2, width: 4, height: 3 },
        this.scene
      );
      steeringBox.position = new Vector3(
        this.body.position.x + 8,
        this.height - 5,
        wheelWidth - 2
      );
      steeringBox.physicsImpostor = new PhysicsImpostor(
        steeringBox,
        PhysicsImpostor.BoxImpostor,
        { mass: this.pivotMass },
        scene
      );
      this.steeringBoxes.push(steeringBox);
      steeringBox = MeshBuilder.CreateBox(
        "",
        { depth: 0.2, width: 4, height: 3 },
        this.scene
      );
      steeringBox.position = new Vector3(
        this.body.position.x + 8,
        this.height - 5,
        -wheelWidth + 2
      );
      steeringBox.physicsImpostor = new PhysicsImpostor(
        steeringBox,
        PhysicsImpostor.BoxImpostor,
        { mass: this.pivotMass },
        scene
      );
      this.steeringBoxes.push(steeringBox);
    }
    {
      //Build connector
      this.connector = MeshBuilder.CreateBox(
        "",
        { width: 0.25, height: 0.25, depth: 12 },
        this.scene
      );
      this.connector.position = new Vector3(6, 7, 0);
      this.connector.physicsImpostor = new PhysicsImpostor(
        this.connector,
        PhysicsImpostor.BoxImpostor,
        { mass: 1 },
        scene
      );
    }
  }

  addJoints() {
    //Add rear wheels as normal
    let wheelWidth = 8;
    var newJoint = new MotorEnabledJoint(PhysicsJoint.HingeJoint, {
      mainPivot: new Vector3(0, 0, 0), //Having these as zero means the pivot is in the wheel (good thing)
      connectedPivot: new Vector3(this.body.position.x - 8, wheelWidth, 2), //(front/back,???,ride height of vehcicle)
      mainAxis: new Vector3(0, 1, 0), //axis of rotation for body 1
      connectedAxis: new Vector3(0, 1, 0), //axis of rotation for body 2
    });
    this.wheels[2].physicsImpostor.addJoint(
      this.body.physicsImpostor,
      newJoint
    );
    this.joints.push(newJoint);
    newJoint = new MotorEnabledJoint(PhysicsJoint.HingeJoint, {
      mainPivot: new Vector3(0, 0, 0), //Having these as zero means the pivot is in the wheel (good thing)
      connectedPivot: new Vector3(this.body.position.x - 8, -wheelWidth, 2), //(front/back,???,ride height of vehcicle)
      mainAxis: new Vector3(0, 1, 0), //axis of rotation for body 1
      connectedAxis: new Vector3(0, 1, 0), //axis of rotation for body 2
    });
    this.wheels[3].physicsImpostor.addJoint(
      this.body.physicsImpostor,
      newJoint
    );
    this.joints.push(newJoint);

    //Add pivot to body
    newJoint = new MotorEnabledJoint(PhysicsJoint.HingeJoint, {
      mainPivot: new Vector3(0, 0, 0),
      connectedPivot: new Vector3(this.body.position.x + 8, wheelWidth - 2, 2),
      mainAxis: new Vector3(0, 1, 0), //axis of rotation for body 1
      connectedAxis: new Vector3(0, 0, 1), //axis of rotation for body 2
    });
    this.steeringBoxes[0].physicsImpostor.addJoint(
      this.body.physicsImpostor,
      newJoint
    );
    this.steeringJoints.push(newJoint);
    //newJoint.setMotor(0.1,10);
    newJoint = new MotorEnabledJoint(PhysicsJoint.HingeJoint, {
      mainPivot: new Vector3(0, 0, 0),
      connectedPivot: new Vector3(this.body.position.x + 8, -wheelWidth + 2, 2),
      mainAxis: new Vector3(0, 1, 0), //axis of rotation for body 1
      connectedAxis: new Vector3(0, 0, 1), //axis of rotation for body 2
    });
    this.steeringBoxes[1].physicsImpostor.addJoint(
      this.body.physicsImpostor,
      newJoint
    );
    this.steeringJoints.push(newJoint);
    //newJoint.setMotor(0.1,10);

    //Add front wheels to pivot
    newJoint = new MotorEnabledJoint(PhysicsJoint.HingeJoint, {
      mainPivot: new Vector3(0, 0, 0), //Having these as zero means the pivot is in the wheel (good thing)
      connectedPivot: new Vector3(0, 0, 2), //(front/back,y,width)
      mainAxis: new Vector3(0, 1, 0), //axis of rotation for body 1
      connectedAxis: new Vector3(0, 0, 1), //axis of rotation for body 2
    });
    this.wheels[0].physicsImpostor.addJoint(
      this.steeringBoxes[0].physicsImpostor,
      newJoint
    );
    //newJoint.setMotor(-1,1);
    newJoint = new MotorEnabledJoint(PhysicsJoint.HingeJoint, {
      mainPivot: new Vector3(0, 0, 0),
      connectedPivot: new Vector3(0, 0, -2),
      mainAxis: new Vector3(0, 1, 0), //axis of rotation for body 1
      connectedAxis: new Vector3(0, 0, 1), //axis of rotation for body 2
    });
    this.wheels[1].physicsImpostor.addJoint(
      this.steeringBoxes[1].physicsImpostor,
      newJoint
    );
    //newJoint.setMotor(-1,1);

    //Add connector joints
    newJoint = new MotorEnabledJoint(PhysicsJoint.HingeJoint, {
      mainPivot: new Vector3(0, 0, -6),
      connectedPivot: new Vector3(-2, 0, 0),
      mainAxis: new Vector3(0, 1, 0), //axis of rotation for body 1
      connectedAxis: new Vector3(0, 1, 0), //axis of rotation for body 2
    });
    this.connector.physicsImpostor.addJoint(
      this.steeringBoxes[1].physicsImpostor,
      newJoint
    );
    //side 2
    newJoint = new MotorEnabledJoint(PhysicsJoint.HingeJoint, {
      mainPivot: new Vector3(0, 0, 6),
      connectedPivot: new Vector3(-2, 0, 0),
      mainAxis: new Vector3(0, 1, 0), //axis of rotation for body 1
      connectedAxis: new Vector3(0, 1, 0), //axis of rotation for body 2
    });
    this.connector.physicsImpostor.addJoint(
      this.steeringBoxes[0].physicsImpostor,
      newJoint
    );

    //newJoint.setMotor(1,1);
  }

  forwards() {
    this.joints[0].setMotor(-10, this.torque);
    this.joints[1].setMotor(-10, this.torque);
  }

  releaseDrive() {
    this.joints[0].setMotor(0, this.torque);
    this.joints[1].setMotor(0, this.torque);
  }

  releaseSteering() {
    this.steeringJoints[0].setMotor(0, this.steeringTorque);
    this.steeringJoints[1].setMotor(0, this.steeringTorque);
  }

  backwards() {
    this.joints[0].setMotor(10, this.torque);
    this.joints[1].setMotor(10, this.torque);
  }

  left() {
    this.steeringJoints.map((x) => x.setMotor(-1, this.steeringTorque));
    console.log("steering leftt");
  }

  right() {
    this.steeringJoints.map((x) => x.setMotor(1, this.steeringTorque));
  }

  colours(scene) {
    var blueMat = new StandardMaterial("blue", scene);
    this.body.material = blueMat;
    blueMat.diffuseColor = new Color3.Blue();

    var redMat = new StandardMaterial("red", scene);
    this.connector.material = redMat;
    redMat.diffuseColor - new Color3.Red();

    var material = new StandardMaterial("material", scene);
    var texture = new NoiseProceduralTexture("perlin", 256, scene);
    material.diffuseTexture = texture;
    for (var x in this.wheels) {
      this.wheels[x].material = material;
    }
  }
}

class Omni {}

class Train {
  constructor(scene) {
    this.meshNames = [
      "TrainNoWheels",
      "TL1",
      "TL2",
      "TL3",
      "TR1",
      "TR2",
      "TR3",
    ];
    this.meshNames.map((x) => (scene.getMeshByName(x).parent = null));
    this.wheels = [];
    this.motors = [];
    this.body = scene.getMeshByName("TrainNoWheels");
    this.wheelMass = 1;
    this.bodyMass = 100;
    this.torque = 10;
    this.speed = 10;
    this.friction = 50;

    var box = MeshBuilder.CreateBox("box", {}, scene);
    box.position = new Vector3(this.body.x, 0, this.body.z);

    //Creating physics imposter, joint and then adding the joint, one by one, to avoid collisions.
    this.body.physicsImpostor = new PhysicsImpostor(
      this.body,
      PhysicsImpostor.BoxImpostor,
      { mass: this.bodyMass, friction: 0 },
      scene
    );

    this.attachWheel(1, -10, -7, 8, scene);
    this.attachWheel(2, -3.5, -7, 8, scene);
    this.attachWheel(3, 3, -7, 8, scene);
    this.attachWheel(4, -10, -7, -8, scene);
    this.attachWheel(5, -3.5, -7, -8, scene);
    this.attachWheel(6, 3, -7, -8, scene);
    //this.motors.map(x => x.setMotor(-10,100));
  }
  attachWheel(index, x, y, z, scene) {
    var mesh = scene.getMeshByName(this.meshNames[index]);
    mesh.physicsImpostor = new PhysicsImpostor(
      mesh,
      PhysicsImpostor.SphereImpostor,
      { mass: this.wheelMass, friction: this.friction },
      scene
    );
    this.wheels.push(mesh);
    var newJoint = new MotorEnabledJoint(PhysicsJoint.HingeJoint, {
      mainPivot: new Vector3(0, 0, 0), //Having these as zero means the pivot is in the wheel (good thing)
      connectedPivot: new Vector3(
        this.body.position.x + x,
        y,
        this.body.position.z + z
      ), //(length,y,)
      mainAxis: new Vector3(0, 0, 1), //axis of rotation for body 1
      connectedAxis: new Vector3(0, 0, 1), //axis of rotation for body 2
    });
    mesh.physicsImpostor.addJoint(this.body.physicsImpostor, newJoint);
    this.motors.push(newJoint);
  }
  forwards() {
    this.motors.map((x) => x.setMotor(-this.speed, this.torque));
  }
  left() {
    for (var x = 0; x < 6; x += 1) {
      x < 3
        ? this.motors[x].setMotor(this.speed, this.torque)
        : this.motors[x].setMotor(-this.speed, this.torque);
    }
  }
  right() {
    for (var x = 0; x < 6; x += 1) {
      x > 2
        ? this.motors[x].setMotor(this.speed, this.torque)
        : this.motors[x].setMotor(-this.speed, this.torque);
    }
  }
  backwards() {
    this.motors.map((x) => x.setMotor(this.speed, this.torque));
  }
  releaseSteering() {
    this.motors.map((x) => x.setMotor(0, 5));
  }
  releaseDrive() {
    this.motors.map((x) => x.setMotor(0, 5));
  }
}

class Tank {
  constructor(scene) {
    this.meshNames = [
      "TankNoWheels",
      "LS1",
      "LS2",
      "LS3",
      "RS1",
      "RS2",
      "RS3",
      "RF",
      "LF",
      "RR",
      "LR",
    ];
    this.meshNames.map((x) => (scene.getMeshByName(x).parent = null));
    this.wheels = [];
    this.motors = [];
    this.body = scene.getMeshByName("TankNoWheels");
    this.wheelMass = 1;
    this.bodyMass = 100;
    this.torque = 10;
    this.speed = 10;
    this.friction = 50;
    this.body.physicsImpostor = new PhysicsImpostor(
      this.body,
      PhysicsImpostor.BoxImpostor,
      { mass: this.bodyMass },
      scene
    );
  }

  attachWheel(index, x, y, z, scene) {
    var mesh = scene.getMeshByName(this.meshNames[index]);
    mesh.physicsImpostor = new PhysicsImpostor(
      mesh,
      PhysicsImpostor.SphereImpostor,
      { mass: this.wheelMass, friction: this.friction },
      scene
    );
    this.wheels.push(mesh);
    var newJoint = new MotorEnabledJoint(PhysicsJoint.HingeJoint, {
      mainPivot: new Vector3(0, 0, 0), //Having these as zero means the pivot is in the wheel (good thing)
      connectedPivot: new Vector3(
        this.body.position.x + x,
        y,
        this.body.position.z + z
      ), //(length,y,)
      mainAxis: new Vector3(0, 0, 1), //axis of rotation for body 1
      connectedAxis: new Vector3(0, 0, 1), //axis of rotation for body 2
    });
    mesh.physicsImpostor.addJoint(this.body.physicsImpostor, newJoint);
    this.motors.push(newJoint);
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
