let vehicle;
let userSelection = { "body": "", "powerup":"", "engine":""}
let vehicles = function(MT, Tank, Train, Omni){this.MT = MT; this.Tank = Tank, this.Train = Train, this.Omni = Omni};
let powerUpHasBeenActivated = false;
let userHasRunRedLight = false;
let startTime;
let endTime;
let fourWheelDrivePassed;
let bestLap = 0;
let laps = [];
let sendLapToServer = true;
let timeStart;

var scene;
const frameRate = 1000;

import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import * as BABYLON from "babylonjs";
import { PhysicsImpostor } from "@babylonjs/core/Physics";
import * as Vehicles from "./Vehicles.js";
import * as HTTP from "./clientHttpRequests";
import { SceneLoader, Engine, Scene, ActionManager, ExecuteCodeAction } from "@babylonjs/core";
import { Animation, Vector3, Quaternion, MeshBuilder } from "@babylonjs/core";
import { Hud } from "./gui";
import { AdvancedDynamicTexture } from "@babylonjs/gui/2D/";
import { readCsv } from "@/utils/csvHelper.js";
window.CANNON = require("cannon");

function switchVehicle(vehicleName, scene) {
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
  scene.activeCamera = vehicle.camera;
  vehicle.camera.attachControl(document.getElementById("gameCanvas"), true);
}

var addCollider = function(scene, thisMesh, visible, friction) {
  try {
    thisMesh = scene.getMeshByName(thisMesh.name);
    var meshRot = thisMesh.rotation

    // meshRot = new BABYLON.Vector3(0,0,0)
    thisMesh.scaling.x = Math.abs(thisMesh.scaling.x);
    thisMesh.scaling.y = Math.abs(thisMesh.scaling.y);
    thisMesh.scaling.z = Math.abs(thisMesh.scaling.z);

    var bb = thisMesh.getBoundingInfo().boundingBox;
    // Don't really know why I have to double the scale but it works
    var width = (bb.maximum.x - bb.minimum.x);
    var height = (bb.maximum.y - bb.minimum.y);
    var depth = (bb.maximum.z - bb.minimum.z);
    thisMesh.rotation = meshRot

    var box = MeshBuilder.CreateBox(
      thisMesh.name + "_bb",
      { width: width, height: height, depth: depth, friction: friction },
      scene
    );
    if (!visible) {
      thisMesh.visibility = 0;
    }
    box.visibility = 0;

    if (thisMesh.name.includes("_rot")) {
      var numbers = parseFloat(thisMesh.name.slice(thisMesh.name.lastIndexOf("_rot") + 4))
      console.log("Rot: " + numbers)
      thisMesh.rotation.y = numbers * Math.PI / 180
      box.rotation.y = (numbers * Math.PI / 180) * -1
    }


    box.physicsImpostor = new PhysicsImpostor(
      box,
      PhysicsImpostor.BoxImpostor,
      { mass: 0, restitution: 0 },
      scene
    );
    //console.log("Making bb of " + thisMesh.name);


    box.showBoundingBox = true;
    box.position = bb.centerWorld;

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
  HTTP.stopRecording();
  console.log(bestLap);
  console.log(laps);
};

var addTriggers = function(gui, scene, vehicleName, powerup, app) {
  var vehicleMesh = scene.getMeshByName(
    { Car: "MTLeft", Train: "TL1", Spaceship: "Omni", Tank: "TankL1" }[
      vehicleName
    ]
  );
  if(vehicleMesh == undefined){
    console.log("VEHICLE MESH NOT DEFINED: " + vehicleName);
    return;
  }
  var stopSignTrigger = scene.getMeshByName("Trigger_StopSign");
  stopSignTrigger.actionManager = new ActionManager(scene);
  stopSignTrigger.visibility = 0.1;
  stopSignTrigger.actionManager.registerAction(
    new ExecuteCodeAction(
      {
        trigger: ActionManager.OnIntersectionEnterTrigger,
        parameter: vehicleMesh,
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
        parameter: vehicleMesh,
      },
      () => {
        vehicle.cameras[0].radius = 150;
        vehicle.cameras[0].heightOffset = 200;
        fourWheelDrivePassed = true;
        if (powerup != "Portal") {
          app.raiseBlock("RoadBlock2");
        }
        if (powerup != "4 Wheel Drive"){
          console.log("setting vehicle offroad");
          vehicle.prototype.offRoad = true;
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
        parameter: vehicleMesh,
      },
      () => {
        vehicle.cameras[0].radius = 130;
        vehicle.cameras[0].heightOffset = 70;
        startLap(gui);
        fourWheelDrivePassed = false;
        vehicle.prototype.offRoad = false;
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
        parameter: vehicleMesh,
      },
      () => {
        vehicle.cameras[0].radius = 100;
        vehicle.cameras[0].heightOffset = 70;
        if (fourWheelDrivePassed) {
          stopLap(gui);
          document.getElementById("bestScore").innerText = `Current Best Score: ${app.calculateScore(bestLap)}`;
          app.lowerBlocks();
        }
        fourWheelDrivePassed = false;
        vehicle.prototype.offRoad = false;
      }
    )
  );
};

var createScene = async function (engine, canvas) {
  //Creating scene, camera and lighting
  var scene = new Scene(engine);

  scene.enablePhysics(new BABYLON.Vector3(0, -50.8, 0));
  new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(1, 1, 0), scene);

  //Importing assets
  await SceneLoader.ImportMeshAsync("", "/assets/", "MT.glb", scene);
  await SceneLoader.ImportMeshAsync("", "/assets/", "Omni.glb", scene);
  await SceneLoader.ImportMeshAsync("", "/assets/", "Train.glb", scene);
  await SceneLoader.ImportMeshAsync("", "/assets/", "Tank.glb", scene);

  var mat = new BABYLON.StandardMaterial("green", scene);
  mat.diffuseColor = new BABYLON.Color3.Green();
  scene.enablePhysics(new BABYLON.Vector3(10, -9.8, 0));

  await SceneLoader.ImportMeshAsync("", "/assets/", "track.glb").then(
    (result) => {
      for (var mesh in result.meshes) {
        var thisMesh = result.meshes[mesh];
        if (
          thisMesh.name.startsWith("Dorna_") &&
          !thisMesh.name.includes("primitive")
        ) {
          const rot = thisMesh.rotationQuaternion.toEulerAngles();
          // Quaternions must be reset on imported models otherwise they will not be able to be rotated
          thisMesh.rotationQuaternion = null;
          // But we still want them in the original positions
          const newRot = new Vector3(rot.x, rot.y, rot.z);
          thisMesh.rotation = newRot;
        }

        if (thisMesh.name.startsWith("MapCollide")) {
          var friction = 100;
          if (thisMesh.name.includes("Ground")) {
            friction = 100;
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
  constructor() {
    this.powerupName;
    this.engineType;
    this.vehicleName;
    this.keysPressed = function(){ this.w = 0, this.a = 0, this.s = 0, this.d = 0 , this.radian = 0};
    //this.leftJoystick = new BABYLON.VirtualJoystick(true);
    // create the canvas html element and attach it to the webpage
    var canvas = document.getElementById("gameCanvas");
    // this.leftJoystick.canvas = canvas;
    // this.leftJoystick.containerSize = 5;
    var v = false; // Vehicle physics boxes visibility
    // initialize babylon scene and engine
    var engine = new Engine(canvas, true);
    var scenePromise = createScene(engine, canvas);
    scenePromise.then((returnedScene) => {
      scene = returnedScene;
      this.scene = returnedScene;
      vehicles = new vehicles(
      new Vehicles.MT(scene, 230, 20, "Steam", "4 Wheel Drive", v, new Quaternion(0,0.7,0,0.7)),
      new Vehicles.Tank(scene, 290, 20, "Steam", "4 Wheel Drive", v, new Quaternion(0,0.7,0,0.7)),
      new Vehicles.Train(scene, 260, 20, "Steam", "4 Wheel Drive", v, new Quaternion(0,0.7,0,0.7)),
      new Vehicles.Omni(scene, 320, 20, "Steam", "4 Wheel Drive", v, new Quaternion(0,0.7,0,0.7))); 

      // sendScoreToServer("Athena", 55, "Car", "Emergency Siren", "Nuclear Fusion")
      // sendScoreToServer("Bella", 999, "Spaceship", "Portal", "Jet")
      // sendScoreToServer("Cara", 34, "Tank", "Speed Boost", "Petrol")
      // sendScoreToServer("Diana", 45, "Car", "4 Wheel Drive", "Steam")
      // sendScoreToServer("Emilia", 12, "Train", "Emergency Siren", "Nuclear Fusion")
      // sendScoreToServer("Felicia", 11, "Spaceship", "Emergency Siren", "Steam")
      // sendScoreToServer("Gloria", 90, "Tank", "Speed Boost", "Nuclear Fusion")
      // sendScoreToServer("Hadria", 66, "Tank", "Portal", "Nuclear Fusion")
      // sendScoreToServer("Nelia", 32, "Spaceship", "Portal", "Nuclear Fusion")
      // sendScoreToServer("Octavia", 19, "Train", "4 Wheel Drive","Nuclear Fusion")

      document.getElementById("vehicleSelection").style.display = "block";
      this.gui = new Hud(scene, this);

      engine.runRenderLoop(() => {
        scene.render();
        if(vehicle != undefined && vehicle.physicsEnabled)
          vehicle.userInput(this.keysPressed);
          this.gui.updateHud();
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
        this.keysPressed["w"] = 1;
      } else if (ev.key == "ArrowDown" || ev.key == "s") {
        this.keysPressed["s"] = 1;
      } else if (ev.key == "ArrowRight" || ev.key == "d") {
        this.keysPressed["d"] = 1;
      } else if (ev.key == "ArrowLeft" || ev.key == "a") {
        this.keysPressed["a"] = 1;
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
        this.keysPressed["w"] = 0;
      } else if (ev.key == "ArrowDown" || ev.key == "s") {
        this.keysPressed["s"] = 0;
      } else if (ev.key == "ArrowRight" || ev.key == "d") {
        this.keysPressed["d"] = 0;
      } else if (ev.key == "ArrowLeft" || ev.key == "a") {
        this.keysPressed["a"] = 0;
      }
      console.log("key pressed. Vehicle: " + vehicle);
    });

    window.addEventListener("resize", function() {
      engine.resize();
    });
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
    //console.log(vehicle.meshes.body.position);
    var test = Math.floor(Math.random() * 10 - 5);
    if (test == 0) {
      test = 1;
    }
    //console.log("Shoulder spin amt: " + test);

    this.rotateTo("ShoulderBone", "rotation.z", Math.PI / test);
    test = Math.floor(Math.random() * 20 - 10);
    if (test == 0) {
      test = 1;
    }
    //console.log("Forearm spin amt: " + test);
    this.rotateTo("ForearmBone", "rotation.x", Math.PI / test);
    test = Math.floor(Math.random() * 20 - 10);
    if (test == 0) {
      test = 1;
    }
    //console.log("Upperarm spin amt: " + test);
    this.rotateTo("UpperarmBone", "rotation.x", Math.PI / test);
    test = Math.floor(Math.random() * 20 - 10);
    if (test == 0) {
      test = 1;
    }
    //console.log("Hand spin amt: " + test);
    this.rotateTo("HandBone", "rotation.x", Math.PI / test);
  }

  attachTo(attachable, attachPoint, offsetx=0, offsety=0, offsetz=0) {
    var currentParent = attachPoint.parent
    attachPoint.setParent(null);
    attachable.setParent(null);
    var matrix = attachPoint.computeWorldMatrix(true);  // force calculation of world matrix
    var local_pos = new BABYLON.Vector3(offsetx, offsety, offsetz); //top middle of box relative to box
    var global_pos = BABYLON.Vector3.TransformCoordinates(local_pos, matrix); //calculate world position
    attachable.position = global_pos; //position sphere relative to world
    attachable.setParent(currentParent)
    attachPoint.setParent(currentParent)
  }

  async buildVehicle() {
    var moveRot = vehicle.meshes.body.rotation
    moveRot.y = this.rad(70)
    
    vehicle.move(new BABYLON.Vector3(418, -25, -1), BABYLON.Quaternion.RotationYawPitchRoll(moveRot.y, moveRot.x, moveRot.z),false)
    // vehicle.meshes.body.rotation.y = 

    var dornaHand = scene.getTransformNodeByName("HandBone");

    console.log(userSelection.body, userSelection.engine, userSelection.powerup);
    
    var engine;
    var engineAngle;

    switch (userSelection.engine) {
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

    switch (userSelection.powerup) {
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
      case "Portal":
        powerup = scene.getMeshByName("Powerup_Portal1");
        powerupAngle = 290;
        break;
      default:
        powerup = scene.getMeshByName("Powerup_SpeedBoost1");
        powerupAngle = 350;
        break;
    }

    var vehicleChassis = vehicle.meshes.body;
    var shell;
    var shellAngle = 0;
    switch (userSelection.body) {
      case "Car":
      case "Train":
      case "Spaceship":
      case "Tank":
        shell = scene.getTransformNodeByName("TankTop.1");
        shellAngle = 20;
        break;
    }

    // CHASSIS ASSEMBLY
    await this.playRow([shellAngle,140,,], 1)

    await this.playRow([,0,-120,120])
    shell.setParent(dornaHand);

    await this.playRow([shellAngle+180,140,,], 1)

    await this.playRow([,25,-106,81.5])
    
    var topAttachpoint = scene.getMeshByName("Tank_TopAttach");
    this.attachTo(shell, topAttachpoint, 0,0,0)
    shell.rotation = new BABYLON.Vector3(0, this.rad(180), this.rad(180))

    await this.playRow([155,140,,], 1)

    // ENGINE ASSEMBLY

    await this.playRow([engineAngle, 57, -65, 8])
    engine.setParent(dornaHand);

    await this.playRow([155, 140,,], 1)

    // Model T await this.playRow([155, 20.4, -75, 47.5])
    await this.playRow([192.5, 10, -115, 103.5])
    var engineAttach = scene.getMeshByName("Tank_EngineAttach");
    this.attachTo(engine, engineAttach, 0,0.5,0)
    engine.rotation = new BABYLON.Vector3(0, this.rad(90), this.rad(180))


    

    await this.playRow([155,140,,], 1)

    // POWERUP ASSEMBLY

    await this.playRow([powerupAngle, 57, -65, 8])
    powerup.setParent(dornaHand);

    // Model T await this.playRow([165,140,,], 1), this.playRow([165,20.4,-75,47.5]
    
    await this.playRow([208,140,,], 1)
    await this.playRow([208, 10, -115, 103.5])
    var powerupAttach = scene.getMeshByName("Tank_PowerupAttach");
    this.attachTo(powerup, powerupAttach, 0,0.5,0)
    powerup.rotation = new BABYLON.Vector3(0, this.rad(90), this.rad(180))

    // RESET
    await this.playRow([155,140,,], 1)

    vehicle.startPhysics()

  }

  rad(degrees) {
    return degrees * Math.PI / 180
  }

  // arrayOfPositions = [Shoulder.z, Upper.x, Fore.x, Hand.x]
  async playRow(arrayOfPositions, awaitIndex = 3) {
    var shoulder = parseInt(arrayOfPositions[0])
    if (!isNaN(shoulder)) {
      if (awaitIndex == 0) {
        await this.rotateToDegrees("ShoulderBone", "rotation.z", shoulder);
      } else {
        this.rotateToDegrees("ShoulderBone", "rotation.z", shoulder);
      }
    }

    var upper = parseInt(arrayOfPositions[1])
    if (!isNaN(upper)) {
      if (awaitIndex == 1) {
        await this.rotateToDegrees("UpperarmBone", "rotation.x", upper);
      } else {
        this.rotateToDegrees("UpperarmBone", "rotation.x", upper);
      }
    }

    var fore = parseInt(arrayOfPositions[2])
    if (!isNaN(fore)) {
      if (awaitIndex == 2) {
        this.rotateToDegrees("ForearmBone", "rotation.x", fore);
      } else {
        this.rotateToDegrees("ForearmBone", "rotation.x", fore);
      }
    }
    
    var hand = parseInt(arrayOfPositions[3])
    if (!isNaN(hand)) {
      if (awaitIndex == 3) {
        await this.rotateToDegrees("HandBone", "rotation.x", hand);
      } else {
        this.rotateToDegrees("HandBone", "rotation.x", hand);
      }
    }
    console.log(shoulder,upper,fore,hand)

  }

  async playCSV() {
    var csv = readCsv("Tank_Assembly_J");
    var lastrow = csv[0];
    var x = 0;
    for (var row of csv) {
      // var row = csv[250]
      if (JSON.stringify(lastrow) !== JSON.stringify(row)) {
        x += 1;
        if (x % 10 == 0) {
          x = 0;
          lastrow = row;

          this.rotateToDegrees("ShoulderBone", "rotation.z", parseInt(row[0]));
          this.rotateToDegrees("UpperarmBone", "rotation.x", parseInt(row[1]));
          this.rotateToDegrees("ForearmBone", "rotation.x", parseInt(row[2]));
          await this.rotateToDegrees(
            "HandBone",
            "rotation.x",
            parseInt(row[3])
          );
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
      roadblockTop = roadblockBottom + roadblockOffset;
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
      addCollider(scene, roadblock, true, 100);
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
      roadblockTop = roadblockBottom + roadblockOffset;
      roadblockSet = true;
    }

    this.moveMesh(
      blockname,
      "position.y",
      roadblock.position.y,
      roadblockBottom
    );
  }

  something()
  {
    console.log("test");
    //vehicle.switchCamera();
    //scene.activeCamera = vehicle.camera;
    vehicle.cameras[0].radius+=10;
    console.log(`Radius: ${vehicle.cameras[0].radius}, height: ${vehicle.cameras[0].heightOffset}, rotation: ${vehicle.cameras[0].rotationOffset}`);
  }

  restartSimulation(body,powerup, engine){
    userSelection.body = body || "Car";
    userSelection.engine = engine || "Steam";
    userSelection.powerup = powerup || "4 Wheel Drive";
    //move all vehicles back to starting positions
    Object.keys(vehicles).map(x => vehicles[x].resetPosition());
    //Switch vehicle
    switchVehicle(body, this.scene);
    //Switch powerup and engines 
    vehicle.prototype.torque = Vehicles.engine(engine) * vehicle.prototype.originalTorque;
    vehicle.prototype.powerupName = powerup;
    //Start physics
    vehicle.startPhysics();
    //Stop timer and reset score
    bestLap = 0;
    stopLap(this.gui);
    document.getElementById("bestScore").innerText = `Current Best Score: 0`
    //add triggers
    addTriggers(this.gui, scene, body, this.powerupName, this)
    //Add vehicle to gui
    this.gui.speedBoostButton.deactivateButton();
    if(powerup == "Speed Boost")
    {
      this.gui.speedBoostButton.activateButton();
    } 

  }

  submitScore(name){
    if(bestLap == 0)
      return;
      HTTP.sendScoreToServer(name || "unknown", this.calculateScore(), this.vehicleName, this.powerupName, this.engineType);
  }

  calculateScore() {
    return (bestLap == undefined || bestLap == 0) ? 0 : 50000 - (bestLap*111);
  }

  buttonPressed(name) {
    if(name == "speedBoost")
    {
      vehicle.prototype.sbActivationTime = new Date().getTime();
      this.gui.speedBoostButton.startTimer();
      console.log("Speed Boost button pressed");
    }
  }
}

var roadblockOffset = 13;
var roadblockBottom = 0;
var roadblockTop = 0;
var roadblockSet = false;

export default {
  name: "Simulation",
  props: {
    test: { one: "a", two: "a" },
  },
  methods: {},
};
