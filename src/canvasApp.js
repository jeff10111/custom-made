var vehicle;
var vehicles = {};
let offroadSection = { min: [0, 0], max: [1, 1] };

var scene;
const frameRate = 1000;

import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import * as BABYLON from "babylonjs";
import { PhysicsImpostor } from "@babylonjs/core/Physics";
import * as Vehicles from "./Vehicles.js";
import { SceneLoader, Engine, Scene } from "@babylonjs/core";
import { Animation, Vector3, Quaternion, MeshBuilder } from "@babylonjs/core";
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
}

var addCollider = function(scene, thisMesh, visible = false) {
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
    box.visibility = 0.01;

    box.physicsImpostor = new PhysicsImpostor(
      box,
      PhysicsImpostor.BoxImpostor,
      { mass: 0, restitution: 0 },
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

var createScene = async function(engine, canvas) {
  //Creating scene, camera and lighting
  var scene = new Scene(engine);
  scene.debugLayer.show();

  scene.enablePhysics();
  console.log(scene.clearColor);
  var camera = new BABYLON.ArcRotateCamera(
    "Camera",
    Math.PI / 5,
    Math.PI / 3,
    250,
    BABYLON.Vector3.Zero(),
    scene
  );
  camera.useFramingBehavior = true;
  camera.attachControl(canvas, true);
  new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(1, 1, 0), scene);

  //Importing assets
  await SceneLoader.ImportMeshAsync("", "/assets/", "MT.glb", scene);
  await SceneLoader.ImportMeshAsync("", "/assets/", "Omni.glb", scene);
  await SceneLoader.ImportMeshAsync("", "/assets/", "Train.glb", scene);
  await SceneLoader.ImportMeshAsync("", "/assets/", "Tank.glb", scene);
  //importing track

  // var track = scene.getMeshByName("Track");
  // track.position = new BABYLON.Vector3(-125, -480, -760);

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
        if (
          thisMesh.name.startsWith("MapCollide") &&
          !thisMesh.name.includes("Support")
        ) {
          console.log("Collider: " + thisMesh.name);
          if (thisMesh.name.includes("Visible")) {
            addCollider(scene, thisMesh, true);
          } else {
            addCollider(scene, thisMesh);
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
    // create the canvas html element and attach it to the webpage
    var canvas = document.getElementById("gameCanvas");
    var v = true; //visibility
    // initialize babylon scene and engine
    var engine = new Engine(canvas, true);
    var scenePromise = createScene(engine, canvas);
    scenePromise.then((returnedScene) => {
      scene = returnedScene;
      this.scene = returnedScene;
      vehicles = {
        MT: new Vehicles.MT(scene, 50, 0, engineName, v),
        Train: new Vehicles.Train(scene, 50, 50, engineName, v),
        Tank: new Vehicles.Tank(scene, 50, -50, engineName, powerupName, v),
      };
      switchVehicle(vehicleName);
      engine.runRenderLoop(() => {
        scene.render();
        vehicle.attr.offroad = offroad(vehicle.meshes.body);
        //TODO check if the vehicle has passed the start/finish line
        //TODO check if the vehicle has ran a red light
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
        new BABYLON.FollowCamera();
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

    window.addEventListener("resize", function() {
      engine.resize();
    });
  }
  powerUpActivation() {
    console.log("Powerup call");
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
  async buildT() {
    var engine = scene.getMeshByName("Engine_PetrolEngine1");
    var powerup = scene.getMeshByName("Powerup_SpeedBoost1");

    // this.neutralPose() or something like that for the reset
    this.rotateToDegrees("ShoulderBone", "rotation.z", 155);
    await this.rotateToDegrees("UpperarmBone", "rotation.x", 140);

    this.rotateToDegrees("ShoulderBone", "rotation.z", 50);
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

    this.rotateToDegrees("ShoulderBone", "rotation.z", 350);
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
    var roadblock1 = scene.getMeshByName("RoadBlock1");
    var roadblock2 = scene.getMeshByName("RoadBlock2");

    if (scene.getMeshByName(roadblock1.name + "_bb")) {
      scene.getMeshByName(roadblock1.name + "_bb").dispose();
    }

    if (scene.getMeshByName(roadblock2.name + "_bb")) {
      scene.getMeshByName(roadblock2.name + "_bb").dispose();
    }

    // Set the default position
    if (!roadblockSet) {
      roadblockBottom = roadblock1.position.y;
      roadblockSet = true;
    }

    Promise.all([
      this.moveMesh(
        "RoadBlock1",
        "position.y",
        roadblock1.position.y,
        roadblockTop
      ),
      this.moveMesh(
        "RoadBlock2",
        "position.y",
        roadblock2.position.y,
        roadblockTop
      ),
    ]).then((vals) => {
      addCollider(scene, roadblock1, true);
      addCollider(scene, roadblock2, true);
    });
  }
  lowerBlocks() {
    var roadblock1 = scene.getMeshByName("RoadBlock1");
    var roadblock2 = scene.getMeshByName("RoadBlock2");

    if (scene.getMeshByName(roadblock1.name + "_bb")) {
      scene.getMeshByName(roadblock1.name + "_bb").dispose();
    }

    if (scene.getMeshByName(roadblock2.name + "_bb")) {
      scene.getMeshByName(roadblock2.name + "_bb").dispose();
    }

    // Set the default position
    if (!roadblockSet) {
      roadblockBottom = roadblock1.position.y;
      roadblockSet = true;
    }

    this.moveMesh(
      "RoadBlock1",
      "position.y",
      roadblock1.position.y,
      roadblockBottom
    );
    this.moveMesh(
      "RoadBlock2",
      "position.y",
      roadblock2.position.y,
      roadblockBottom
    );
  }
}

var roadblockBottom = 0;
var roadblockTop = 5;
var roadblockSet = false;

export default {
  name: "Simulation",
  props: {
    test: { one: "a", two: "a" }, //should be passing values as props but don't know how yet
  },
  methods: {},
};
