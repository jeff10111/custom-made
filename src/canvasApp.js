let vehicle;
let vehicles = {};
let keysPressed = { w: 0, a: 0, s: 0, d: 0 };
let startTime;
let endTime;
let bestLap;
let laps = [];

let powerUpHasBeenActivated = false;
let offroadSection = { min: [0, 0], max: [1, 1] };
let userHasRunRedLight = false;
let fourWheelDrivePassed;
var roadblockBottom = 0;
var roadblockTop = 6;
var roadblockSet = false;

var scene;
const frameRate = 1000;

import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import * as BABYLON from "babylonjs";
import { PhysicsImpostor } from "@babylonjs/core/Physics";
import * as Vehicles from "./Vehicles.js";
import { Hud } from "./gui";
import { AdvancedDynamicTexture } from "@babylonjs/gui/2D/";
import {
  Animation,
  ActionManager,
  Engine,
  ExecuteCodeAction,
  MeshBuilder,
  Quaternion,
  SceneLoader,
  Scene,
  Vector3,
} from "@babylonjs/core";
import { readCsv } from "@/utils/csvHelper.js";
window.CANNON = require("cannon");

function offroad(body) {
  return (
    body.position.x >= offroadSection.min[0] &&
    body.position.x <= offroadSection.max[0] &&
    body.position.y >= offroadSection.min[1] &&
    body.position.y <= offroadSection.max[1]
  );
}

function switchVehicle(vehicleName) {
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
      console.log("Set vehicle to tank");
      console.log(vehicle.attr);
      break;
  }
  var camera = new BABYLON.FollowCamera(
    "vehicleCam",
    new BABYLON.Vector3(0, 10, 10),
    scene,
    vehicle.meshes.body
  );
  camera.lowerRadiusLimit = 150;
  camera.lowerHeightOffsetLimit = 50;
  camera.maxCameraSpeed = 50;
  camera.rotationOffset = -90;
}

var addCollider = function(scene, thisMesh, visible = false, friction = 0.2) {
  try {
    thisMesh = scene.getMeshByName(thisMesh.name);
    thisMesh.scaling.x = Math.abs(thisMesh.scaling.x);
    thisMesh.scaling.y = Math.abs(thisMesh.scaling.y);
    thisMesh.scaling.z = Math.abs(thisMesh.scaling.z);

    var bb = thisMesh.getBoundingInfo().boundingBox;
    // Don't really know why I have to double the scale but it works
    var width = (bb.maximum.x - bb.minimum.x) * 2;
    var height = (bb.maximum.y - bb.minimum.y) * 2;
    var depth = (bb.maximum.z - bb.minimum.z) * 2;
    console.log(thisMesh.name + " " + width + " " + depth + " " + height);
    console.log(bb.centerWorld, bb.directions);

    var box = MeshBuilder.CreateBox(
      thisMesh.name + "_bb",
      { width: width, height: height, depth: depth },
      scene
    );
    if (!visible) {
      thisMesh.visibility = 0;
    }
    box.visibility = 0;

    box.physicsImpostor = new PhysicsImpostor(
      box,
      PhysicsImpostor.BoxImpostor,
      { mass: 0, restitution: 0, friction: friction },
      scene
    );
    console.log("Making bb of " + thisMesh.name);

    // box.showBoundingBox = true;
    box.position = bb.centerWorld;
    box.rotation = Vector3.TransformCoordinates(bb.centerWorld, bb.directions);
  } catch (e) {
    console.log(e);
  }
};

var startLap = function(gui) {
  gui.startTimer();
};

var stopLap = function(gui) {
  gui.stopTimer();
  if (!bestLap || gui.time < bestLap) {
    bestLap = gui.time;
  }
  laps.push([gui.time, vehicle]);

  console.log(bestLap);
  console.log(laps);
};

var addTriggers = function(gui, scene, vehicle, powerup, app) {
  console.log(vehicle.name + "Body");
  var stopSignTrigger = scene.getMeshByName("Trigger_StopSign");
  stopSignTrigger.actionManager = new ActionManager(scene);
  stopSignTrigger.visibility = 0.1;
  stopSignTrigger.actionManager.registerAction(
    new ExecuteCodeAction(
      {
        trigger: ActionManager.OnIntersectionEnterTrigger,
        parameter: scene.getMeshByName(vehicle.name + "Body"),
      },
      () => {
        console.log("RedLightArea");
      }
    )
  );

  var fourWheelDriveTrigger = scene.getMeshByName("Trigger_4WDStart");
  fourWheelDriveTrigger.actionManager = new ActionManager(scene);
  fourWheelDriveTrigger.visibility = 0.1;
  fourWheelDriveTrigger.actionManager.registerAction(
    new ExecuteCodeAction(
      {
        trigger: ActionManager.OnIntersectionEnterTrigger,
        parameter: scene.getMeshByName(vehicle.name + "Body"),
      },
      () => {
        fourWheelDrivePassed = true;
        if (powerup != "Portal") {
          app.raiseBlock("RoadBlock2");
        }
      }
    )
  );

  var startTrigger = scene.getMeshByName("Trigger_Start");
  startTrigger.actionManager = new ActionManager(scene);
  startTrigger.visibility = 0.1;
  startTrigger.actionManager.registerAction(
    new ExecuteCodeAction(
      {
        trigger: ActionManager.OnIntersectionEnterTrigger,
        parameter: scene.getMeshByName(vehicle.name + "Body"),
      },
      () => {
        startLap(gui);
        fourWheelDrivePassed = false;
        app.raiseBlock("RoadBlock1");
      }
    )
  );

  var finishTrigger = scene.getMeshByName("Trigger_Finish");
  finishTrigger.actionManager = new ActionManager(scene);
  finishTrigger.visibility = 0.1;
  finishTrigger.actionManager.registerAction(
    new ExecuteCodeAction(
      {
        trigger: ActionManager.OnIntersectionEnterTrigger,
        parameter: scene.getMeshByName(vehicle.name + "Body"),
      },
      () => {
        if (fourWheelDrivePassed) {
          stopLap(gui);
          app.lowerBlocks();
        }
      }
    )
  );
};

var createScene = async function(engine, canvas) {
  //Creating scene, camera and lighting
  var scene = new Scene(engine);
  scene.debugLayer.show();

  scene.enablePhysics();
  console.log(scene.clearColor);
  // var camera = new BABYLON.ArcRotateCamera(
  //   "Camera",
  //   Math.PI / 5,
  //   Math.PI / 3,
  //   250,
  //   BABYLON.Vector3.Zero(),
  //   scene
  // );
  // camera.useFramingBehavior = true;
  // camera.attachControl(canvas, true);
  new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(1, 1, 0), scene);

  //Importing assets
  await SceneLoader.ImportMeshAsync("", "/assets/", "MT.glb", scene);
  await SceneLoader.ImportMeshAsync("", "/assets/", "Omni.glb", scene);
  await SceneLoader.ImportMeshAsync("", "/assets/", "Train.glb", scene);
  await SceneLoader.ImportMeshAsync("", "/assets/", "Tank.glb", scene);
  //importing track

  //Creating the ground and enabling physics

  var mat = new BABYLON.StandardMaterial("green", scene);
  mat.diffuseColor = new BABYLON.Color3.Green();
  scene.enablePhysics();

  await SceneLoader.ImportMeshAsync("", "/assets/", "track.glb").then(
    (result) => {
      console.log(result);

      console.log(scene.getTransformNodeByName("MainTrack").parent);
      var rootNode = scene.getTransformNodeByName("MainTrack").parent;

      var sphere = MeshBuilder.CreateSphere(
        "sphere",
        { diameter: 10, segments: 32 },
        scene
      );
      sphere.PhysicsImpostor = new PhysicsImpostor(
        sphere,
        PhysicsImpostor.SphereImpostor,
        { mass: 1, restitution: 0.1 },
        scene
      );
      sphere.position.y += 150;
      console.log(sphere.position);

      var impulseDirection = new Vector3(1, 1, 0);
      var impulseMagnitude = 5;
      var contactLocalRefPoint = Vector3.Zero();

      sphere.PhysicsImpostor.applyImpulse(
        impulseDirection.scale(impulseMagnitude),
        sphere.getAbsolutePosition().add(contactLocalRefPoint)
      );
      for (var mesh in result.meshes) {
        var thisMesh = result.meshes[mesh];
        console.log("Mesh " + thisMesh.name);
        if (
          thisMesh.name.startsWith("Dorna_") &&
          !thisMesh.name.includes("primitive")
        ) {
          console.log("Dorna part: " + thisMesh.name);
          const rot = thisMesh.rotationQuaternion.toEulerAngles();
          // Quaternions must be reset on imported models otherwise they will not be able to be rotated
          thisMesh.rotationQuaternion = null;
          // But we still want them in the original positions
          const newRot = new Vector3(rot.x, rot.y, rot.z);
          thisMesh.rotation = newRot;
        }

        if (thisMesh.name.startsWith("MapCollide")) {
          console.log("Collider: " + thisMesh.name);
          var friction = 0.01;
          if (thisMesh.name.includes("Ground")) {
            friction = 0.2;
          }
          if (thisMesh.name.includes("Visible")) {
            addCollider(scene, thisMesh, true, friction);
          } else {
            addCollider(scene, thisMesh, false, friction);
          }
        }
      }

      // Need to reset the rotation for the bones also for animations to work
      var boneList = [
        "ShoulderBone",
        "UpperarmBone",
        "ForearmBone",
        "HandBone",
      ];
      for (var bone in boneList) {
        var sceneBone = scene.getTransformNodeByName(boneList[bone]);
        console.log(
          sceneBone.name,
          sceneBone.rotation.x,
          sceneBone.rotation.y,
          sceneBone.rotation.z
        );
        sceneBone.rotation = new Vector3(0, 0, 0);
      }

      scene.getTransformNodeByName("ShoulderBone").rotation = new Vector3(
        4.71239,
        0,
        0
      );
    }
  );

  scene.ambientColor = new BABYLON.Color3(256, 0, 0);

  return scene;
};

export class BabylonApp {
  constructor(vehicleName, engineName, powerupName) {
    this.powerUp = powerupName;
    this.engineType = engineName;
    // create the canvas html element and attach it to the webpage
    var canvas = document.getElementById("gameCanvas");
    var v = false; //visibility

    // initialize babylon scene and engine
    var engine = new Engine(canvas, true);
    var scenePromise = createScene(engine, canvas);
    scenePromise.then((returnedScene) => {
      scene = returnedScene;
      this.scene = returnedScene;

      vehicles = {
        MT: new Vehicles.MT(scene, 210, 20, engineName, v),
        Train: new Vehicles.Train(scene, 240, 20, engineName, v),
        Tank: new Vehicles.Tank(scene, 270, 20, engineName, powerupName, v),
        Omni: new Vehicles.Omni(scene, 300, 20, engineName, powerupName, v),
      };

      // GUI
      this.gui = new Hud(scene);

      switchVehicle(vehicleName);
      addTriggers(this.gui, scene, vehicle, this.powerUp, this);
      console.log(this);

      engine.runRenderLoop(() => {
        scene.render();
        vehicle.attr.offroad = offroad(vehicle.meshes.body);
        vehicle.userInput(keysPressed);
        // if (!this._ui.gamePaused) {
        this.gui.updateHud();
        // }
        //TODO check if the vehicle has passed the start/finish line
        //TODO check if the vehicle has ran a red light
      });
    });
    window.addEventListener("keydown", (ev) => {
      if (ev.shiftKey && ev.ctrlKey && ev.altKey && ev.keyCode === 73) {
        if (scene.debugLayer.isVisible()) {
          scene.debugLayer.hide();
        } else {
          scene.debugLayer.show();
        }
      } else if (ev.key == "ArrowUp" || ev.key == "w") {
        keysPressed["w"] = 1;
      } else if (ev.key == "ArrowDown" || ev.key == "s") {
        keysPressed["s"] = 1;
      } else if (ev.key == "ArrowRight" || ev.key == "d") {
        keysPressed["d"] = 1;
      } else if (ev.key == "ArrowLeft" || ev.key == "a") {
        keysPressed["a"] = 1;
      } else if (ev.key == "c") {
        new BABYLON.FollowCamera();
      }
    });

    window.addEventListener("keyup", (ev) => {
      if (ev.shiftKey && ev.ctrlKey && ev.altKey && ev.keyCode === 73) {
        if (scene.debugLayer.isVisible()) {
          scene.debugLayer.hide();
        } else {
          scene.debugLayer.show();
        }
      } else if (ev.key == "ArrowUp" || ev.key == "w") {
        keysPressed["w"] = 0;
      } else if (ev.key == "ArrowDown" || ev.key == "s") {
        keysPressed["s"] = 0;
      } else if (ev.key == "ArrowRight" || ev.key == "d") {
        keysPressed["d"] = 0;
      } else if (ev.key == "ArrowLeft" || ev.key == "a") {
        keysPressed["a"] = 0;
      }
      vehicle.userInput(keysPressed);
    });

    window.addEventListener("resize", function() {
      engine.resize();
    });
  }
  powerUpActivation() {
    if (powerUpHasBeenActivated) {
      return;
    }
    powerUpHasBeenActivated = true;
    switch (this.powerUp) {
      case "Speed Boost":
        //increases vehicle speed for a time duration
        vehicle.attr.sbActivationTime = new Date().getTime();
        console.log("Speed boost activated");
        break;
      case "4 Wheel Drive":
        //prevents noise through 4wd section
        console.log("4 Wheel Drive boost activated");
        break;
      case "Emergency Siren":
        //prevents losing points for not stopping at traffic lights
        //so this requires implementation of traffic lights first
        console.log("Emergency boost activated");
        break;
      case "Portal":
        //this changes the track rather than the vehicle
        console.log("Portal boost activated");
        break;
    }
  }

  rotateToDegrees(boneName, attribute, valueTo, autoStart = true) {
    return this.rotateTo(
      boneName,
      attribute,
      (valueTo * Math.PI) / 180,
      autoStart
    );
  }
  rotateTo(boneName, attribute, valueTo, autoStart = true) {
    // //TEMPLATE
    // this.rotateTo("ShoulderBone", "rotation.z", Math.PI/4);
    // this.rotateTo("UpperarmBone", "rotation.x", 1);
    // this.rotateTo("ForearmBone", "rotation.x", 6.8DEG = 0.118682RAD);
    // this.rotateTo("HandBone", "rotation.x", 0.118682);

    var thisBone = scene.getTransformNodeByName(boneName);

    //Dynamically retrieve the selected value
    const splitAttr = attribute.split(".");
    var thisAttr = thisBone;
    splitAttr.forEach((element) => {
      thisAttr = thisAttr[element];
    });

    // console.log("Retrieved val: " + thisAttr)

    const thisAnim = new Animation(
      boneName + "_" + attribute,
      attribute,
      frameRate,
      Animation.ANIMATIONTYPE_FLOAT
    );
    thisAnim.onAnimationLoop = function() {
      console.error("HEYO");
    };
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
      thisBone.animations.push(thisAnim);
      var runAnim = scene.beginAnimation(thisBone, 0, 2 * frameRate, false);
      return runAnim.waitAsync();
    }
    return thisAnim;
  }
  moveMesh(meshName, attribute, valueFrom, valueTo, autoStart = true) {
    // //TEMPLATE
    // this.moveMesh("RoadBlock1", "position.y", -30, 30);

    var thisMesh = scene.getMeshByName(meshName);

    //Dynamically retrieve the selected value
    const splitAttr = attribute.split(".");
    var thisAttr = thisMesh;
    splitAttr.forEach((element) => {
      thisAttr = thisAttr[element];
    });

    // console.log("Retrieved val: " + thisAttr)

    const thisAnim = new Animation(
      meshName + "_" + attribute,
      attribute,
      frameRate,
      Animation.ANIMATIONTYPE_FLOAT,
      Animation.ANIMATIONLOOPMODE_CYCLE
    );
    thisAnim.onAnimationLoop = function() {
      console.error("HEYO");
    };
    const keyFrames = [];
    keyFrames.push({
      frame: 0,
      value: valueFrom,
    });
    keyFrames.push({
      frame: 2 * frameRate,
      value: valueTo,
    });
    thisAnim.setKeys(keyFrames);

    // If we need to customise the animation then we don't want to start yet
    // otherwise:
    if (autoStart) {
      thisMesh.animations.push(thisAnim);
      var runAnim = scene.beginAnimation(thisMesh, 0, 2 * frameRate, false);
      return runAnim.waitAsync();
    }
    return thisAnim;
  }
  spinArm() {
    console.log(vehicle.meshes.body.position);
    var test = Math.floor(Math.random() * 10 - 5);
    if (test == 0) {
      test = 1;
    }
    console.log("Shoulder spin amt: " + test);

    this.rotateTo("ShoulderBone", "rotation.z", Math.PI / test);
    test = Math.floor(Math.random() * 20 - 10);
    if (test == 0) {
      test = 1;
    }
    console.log("Forearm spin amt: " + test);
    this.rotateTo("ForearmBone", "rotation.x", Math.PI / test);
    test = Math.floor(Math.random() * 20 - 10);
    if (test == 0) {
      test = 1;
    }
    console.log("Upperarm spin amt: " + test);
    this.rotateTo("UpperarmBone", "rotation.x", Math.PI / test);
    test = Math.floor(Math.random() * 20 - 10);
    if (test == 0) {
      test = 1;
    }
    console.log("Hand spin amt: " + test);
    this.rotateTo("HandBone", "rotation.x", Math.PI / test);
  }
  async buildVehicle() {
    var engine;
    var engineAngle;

    console.log(this.engineType);

    switch (this.engineType) {
      case "Nuclear Fusion":
        engine = scene.getMeshByName("Engine_NuclearFusion1");
        engineAngle = 10;
        break;
      case "Jet":
        engine = scene.getMeshByName("Engine_JetEngine1");
        engineAngle = 30;
        break;
      case "Petrol":
        engine = scene.getMeshByName("Engine_PetrolEngine1");
        engineAngle = 50;
        break;
      case "Steam":
      default:
        engine = scene.getMeshByName("Engine_SteamEngine1");
        engineAngle = 70;
        break;
    }

    var powerup;
    var powerupAngle;

    switch (this.powerUp) {
      case "Speed Boost":
        powerup = scene.getMeshByName("Powerup_SpeedBoost1");
        powerupAngle = 350;
        break;
      case "Emergency Siren":
        powerup = scene.getMeshByName("Powerup_EmergencySiren1");
        powerupAngle = 330;
        break;
      case "4 Wheel Drive":
        powerup = scene.getMeshByName("Powerup_4WheelDrive1");
        powerupAngle = 310;
        break;
      // case "Portal":
      //   powerup = scene.getMeshByName("Powerup_Portal1");
      //   powerupAngle = 290;
      default:
        powerup = scene.getMeshByName("Powerup_SpeedBoost1");
        powerupAngle = 350;
        break;
    }
    console.log(engine.name, engineAngle, powerup, powerupAngle);

    // this.neutralPose() or something like that for the reset
    this.rotateToDegrees("ShoulderBone", "rotation.z", 155);
    await this.rotateToDegrees("UpperarmBone", "rotation.x", 140);

    this.rotateToDegrees("ShoulderBone", "rotation.z", engineAngle);
    this.rotateToDegrees("UpperarmBone", "rotation.x", 57);
    this.rotateToDegrees("ForearmBone", "rotation.x", -65);
    await this.rotateToDegrees("HandBone", "rotation.x", 8);
    engine.setParent(scene.getTransformNodeByName("HandBone"));

    this.rotateToDegrees("ShoulderBone", "rotation.z", 155);
    await this.rotateToDegrees("UpperarmBone", "rotation.x", 140);

    this.rotateToDegrees("UpperarmBone", "rotation.x", 20.4);
    this.rotateToDegrees("ForearmBone", "rotation.x", -75);
    await this.rotateToDegrees("HandBone", "rotation.x", 47.5);
    engine.setParent(null);

    this.rotateToDegrees("UpperarmBone", "rotation.x", 140);
    await this.rotateToDegrees("ShoulderBone", "rotation.z", 155);

    this.rotateToDegrees("ShoulderBone", "rotation.z", powerupAngle);
    this.rotateToDegrees("UpperarmBone", "rotation.x", 57);
    this.rotateToDegrees("ForearmBone", "rotation.x", -65);
    await this.rotateToDegrees("HandBone", "rotation.x", 8);
    powerup.setParent(scene.getTransformNodeByName("HandBone"));

    this.rotateToDegrees("ShoulderBone", "rotation.z", 165);
    await this.rotateToDegrees("UpperarmBone", "rotation.x", 140);

    this.rotateToDegrees("UpperarmBone", "rotation.x", 20.4);
    this.rotateToDegrees("ForearmBone", "rotation.x", -75);
    await this.rotateToDegrees("HandBone", "rotation.x", 47.5);
    powerup.setParent(null);

    this.rotateToDegrees("ShoulderBone", "rotation.z", 155);
    await this.rotateToDegrees("UpperarmBone", "rotation.x", 140);
  }
  async playCSV() {
    console.log("Yo");
    var csv = readCsv("Tank_Assembly_J");
    var lastrow = csv[0];
    console.log(lastrow);
    var x = 0;
    for (var row of csv) {
      // var row = csv[250]
      if (JSON.stringify(lastrow) !== JSON.stringify(row)) {
        x += 1;
        console.log(x);
        if (x % 10 == 0) {
          x = 0;
          console.log(row);
          lastrow = row;

          this.rotateToDegrees("ShoulderBone", "rotation.z", parseInt(row[0]));
          this.rotateToDegrees("UpperarmBone", "rotation.x", parseInt(row[1]));
          this.rotateToDegrees("ForearmBone", "rotation.x", parseInt(row[2]));
          await this.rotateToDegrees(
            "HandBone",
            "rotation.x",
            parseInt(row[3])
          );
          console.log("Hey");
          console.log("Yo");
        }
      }
    }
  }
  raiseBlocks() {
    this.raiseBlock("RoadBlock1");
    this.raiseBlock("RoadBlock2");
  }

  raiseBlock(blockname) {
    var roadblock = scene.getMeshByName(blockname);

    if (scene.getMeshByName(roadblock.name + "_bb")) {
      scene.getMeshByName(roadblock.name + "_bb").dispose();
    }

    // Set the default position
    if (!roadblockSet) {
      roadblockBottom = roadblock.position.y;
      roadblockSet = true;
    }

    Promise.all([
      this.moveMesh(
        blockname,
        "position.y",
        roadblock.position.y,
        roadblockTop
      ),
    ]).then((vals) => {
      addCollider(scene, roadblock, true);
    });
  }

  lowerBlocks() {
    this.lowerBlock("RoadBlock1");
    this.lowerBlock("RoadBlock2");
  }

  lowerBlock(blockname) {
    var roadblock = scene.getMeshByName(blockname);

    if (scene.getMeshByName(roadblock.name + "_bb")) {
      scene.getMeshByName(roadblock.name + "_bb").dispose();
    }

    // Set the default position
    if (!roadblockSet) {
      roadblockBottom = roadblock.position.y;
      roadblockSet = true;
    }

    this.moveMesh(
      blockname,
      "position.y",
      roadblock.position.y,
      roadblockBottom
    );
  }
}

export default {
  name: "Simulation",
  props: {
    test: { one: "a", two: "a" }, //should be passing values as props but don't know how yet
  },
  methods: {},
};
