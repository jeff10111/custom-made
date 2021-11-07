let vehicle;
let userSelection = { "body": "", "powerup":"", "engine":""}
let vehicles = function(MT, Tank, Train, Omni){this.MT = MT; this.Tank = Tank, this.Train = Train, this.Omni = Omni};
let firstBuild = true;
let fourWheelDrivePassed;
let bestLap = 0;
let laps = [];
var originalPositionDict = {}


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
import { readCsv } from "@/utils/csvHelper.js";
window.CANNON = require("cannon");

//Used to switch the active vehicle and also the camera
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

// Add a collider to a mesh using its bounding box
var addCollider = function(scene, thisMesh, visible, friction) {
  try {
    thisMesh = scene.getMeshByName(thisMesh.name);
    var meshRot = thisMesh.rotation

    thisMesh.scaling.x = Math.abs(thisMesh.scaling.x);
    thisMesh.scaling.y = Math.abs(thisMesh.scaling.y);
    thisMesh.scaling.z = Math.abs(thisMesh.scaling.z);

    var bb = thisMesh.getBoundingInfo().boundingBox;
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
      thisMesh.rotation.y = numbers * Math.PI / 180
      box.rotation.y = (numbers * Math.PI / 180) * -1
    }


    box.physicsImpostor = new PhysicsImpostor(
      box,
      PhysicsImpostor.BoxImpostor,
      { mass: 0, restitution: 0 },
      scene
    );

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
  // Apply a penalty if the user did not stop for the red light
  if (userSelection.powerup != "Emergency Siren" && gui._redlightTime > 50) {
    bestLap += Math.floor((gui._redlightTime / 1000) * 1.5)
  }
  laps.push([gui.time, vehicle]);
};

var exitedAssembly = false;
var addTriggers = function(gui, scene, vehicleName, powerup, app) {

  // Must be a mesh, not a transform node
  var vehicleMesh = scene.getMeshByName(
    { Car: "Car_TopAttach", Train: "Train_TopAttach", Spaceship: "Spaceship_TopAttach", Tank: "Tank_TopAttach" }[
      vehicleName
    ]
  );
  if(vehicleMesh == undefined){
    console.log("VEHICLE MESH NOT DEFINED: " + vehicleName);
    return;
  }

  // Triggerable function for re-entering the assembly area
  var assemblyTrigger = scene.getMeshByName("Trigger_Assembly");
  assemblyTrigger.visibility = 0;
  assemblyTrigger.actionManager = new ActionManager(scene);
  assemblyTrigger.actionManager.registerAction(
    new ExecuteCodeAction(
      {
        trigger: ActionManager.OnIntersectionEnterTrigger,
        parameter: vehicleMesh,
      },
      () => {
        // Do not trigger on first touch - that is the vehicle exiting
        if (exitedAssembly) {
          exitedAssembly = false;
          app.disassembleVehicle();
        }

      }
    )
  )
  
  var stopSignTrigger = scene.getMeshByName("Trigger_StopSign");
  stopSignTrigger.actionManager = new ActionManager(scene);
  stopSignTrigger.visibility = 0.2;
  stopSignTrigger.actionManager.registerAction(
    new ExecuteCodeAction(
      {
        trigger: ActionManager.OnIntersectionEnterTrigger,
        parameter: vehicleMesh,
      },
      () => {
        if (powerup != "Emergency Siren") {
          gui.startRedlight();
        }
      }
    )
  );
  stopSignTrigger.actionManager.registerAction(
    new ExecuteCodeAction(
      {
        trigger: ActionManager.OnIntersectionExitTrigger,
        parameter: vehicleMesh,
      },
      () => {
        if (powerup != "Emergency Siren") {
          gui.stopRedlight();
        }
      }
    )
  );
  
  var fourWheelDriveTrigger = scene.getMeshByName("Trigger_4WDStart");
  fourWheelDriveTrigger.actionManager = new ActionManager(scene);
  fourWheelDriveTrigger.visibility = 0;
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
        // The portal powerup bypasses this blockade
        if (powerup != "Portal") {
          app.raiseBlock("RoadBlock2");
        }
        if (powerup != "4 Wheel Drive"){
          vehicle.prototype.offRoad = true;
        }
      }
    )
  );

  var startTrigger = scene.getMeshByName("Trigger_Start");
  startTrigger.actionManager = new ActionManager(scene);
  startTrigger.visibility = 0;
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
  finishTrigger.visibility = 0;
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

//Create the main canvas scene
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

        // Store the original positions of each mesh so they can be reset
        var rot = thisMesh.rotation.clone()
        if (thisMesh.rotationQuaternion != undefined) {
          rot = thisMesh.rotationQuaternion.toEulerAngles()
        }

        if (thisMesh.position != undefined) {
          originalPositionDict[thisMesh.name] = [thisMesh.parent, thisMesh.position.clone(), rot]
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
      for (var bone of boneList) {
        var sceneBone = scene.getTransformNodeByName(bone);
        sceneBone.rotation = new Vector3(0, 0, 0);
      }

      for (var shellName of ["CarTop", "SpaceshipTop", "TrainTop", "TankTop"]) {
        var shell = scene.getTransformNodeByName(shellName);
        originalPositionDict[shell.name] = [shell.parent, shell.position.clone(), shell.rotationQuaternion.toEulerAngles()]
      }

      scene.getTransformNodeByName("ShoulderBone").rotation = new Vector3(
        4.71239,
        0,
        0
      );
    }
  );
  scene.ambientColor = new BABYLON.Color3.White();

  return scene;
};

/*
* Represents the entire canvas application
* Called from simulation.vue
*/
export class BabylonApp {
  constructor(simulationWrapper) {
    this.simulationWrapper = simulationWrapper;
    this.powerupName;
    this.engineType;
    this.vehicleName;
    //keysPressed are written to by the keyboard or joystick, and read by the active vehicle
    this.keysPressed = function(){ this.w = 0, this.a = 0, this.s = 0, this.d = 0 , this.radian = 0};
    // create the canvas html element and attach it to the webpage
    var canvas = document.getElementById("gameCanvas");
    var v = false; // Vehicle physics boxes visibility

    // initialize babylon scene and engine
    var engine = new Engine(canvas, true);
    var scenePromise = createScene(engine, canvas);
    scenePromise.then((returnedScene) => {
      scene = returnedScene;
      this.scene = returnedScene;
      vehicles = new vehicles(
      new Vehicles.MT(scene, 451, -2, "Steam", "4 Wheel Drive", v, new Quaternion(0, 0.819152, 0, 0.5735764)),
      new Vehicles.Tank(scene, 418, -1, "Steam", "4 Wheel Drive", v, new Quaternion(0, 0.5735764, 0, 0.819152)),
      new Vehicles.Train(scene, 483, -19, "Steam", "4 Wheel Drive", v, new Quaternion(0, 0.9659258, 0, 0.258819)),
      new Vehicles.Omni(scene, 390, -20, "Steam", "4 Wheel Drive", v, new Quaternion(0, 0.8660254, 0, 0.5))); 

      scene.getMeshByName("TrainBodyBox").scaling.z = -1

      //Bring up the vehicle selection interface on start
      document.getElementById("vehicleSelection").style.display = "block";
      this.gui = new Hud(scene, this);

      //Main loop of the application
      engine.runRenderLoop(() => {
        scene.render();
        if(vehicle != undefined && vehicle.physicsEnabled)
          vehicle.userInput(this.keysPressed);//send activated keys to vehicle
          this.gui.updateHud();
      });
    });
    //Catch keypress input
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

  // Helper function for rotating the different joints in the arm
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

    const thisAnim = new Animation(
      boneName + "_" + attribute,
      attribute,
      frameRate,
      Animation.ANIMATIONTYPE_FLOAT
    );

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

  // Helper function to move a mesh from a position t oanother
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

    const thisAnim = new Animation(
      meshName + "_" + attribute,
      attribute,
      frameRate,
      Animation.ANIMATIONTYPE_FLOAT,
      Animation.ANIMATIONLOOPMODE_CYCLE
    );

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

  //Debug function to randomly spin the dorna arm
  spinArm() {
    var test = Math.floor(Math.random() * 10 - 5);
    if (test == 0) {
      test = 1;
    }

    this.rotateTo("ShoulderBone", "rotation.z", Math.PI / test);
    test = Math.floor(Math.random() * 20 - 10);
    if (test == 0) {
      test = 1;
    }
    this.rotateTo("ForearmBone", "rotation.x", Math.PI / test);
    test = Math.floor(Math.random() * 20 - 10);
    if (test == 0) {
      test = 1;
    }
    this.rotateTo("UpperarmBone", "rotation.x", Math.PI / test);
    test = Math.floor(Math.random() * 20 - 10);
    if (test == 0) {
      test = 1;
    }
    this.rotateTo("HandBone", "rotation.x", Math.PI / test);
  }

  // Attach a mesh (attachable) to a different mesh (attachPoint), matching
  // position and rotation
  async attachTo(attachable, attachPoint, offsetx=0, offsety=0, offsetz=0) {
    var currentParent = attachPoint.parent
    attachPoint.setParent(null);
    attachable.setParent(null);
    var matrix = attachPoint.computeWorldMatrix(true);  // force calculation of world matrix
    var local_pos = new BABYLON.Vector3(offsetx, offsety, offsetz); //relative position to parent obj
    var global_pos = BABYLON.Vector3.TransformCoordinates(local_pos, matrix); //calculate world position
    attachable.position = global_pos; //position attachment relative to world
    attachable.setParent(currentParent)
    attachPoint.setParent(currentParent)
  }

  // Drive the vehicle to its respective platform and disassemble it
  async disassembleVehicle() {
    var currentRad = scene.activeCamera.radius
    scene.activeCamera.radius = 150
    var currentRotOffset = scene.activeCamera.rotationOffset
    var dornaHand = scene.getTransformNodeByName("HandBone");
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
    vehicle.disablePhysics()

    var moveRot = vehicle.meshes.body.rotation
    var shell;
    var shellAngle = 0;
    var enginePlaceAngle;
    var powerupPlaceAngle;
    var assemblyPosition;
    var assemblyRotation;

    switch (userSelection.body) {
      case "Car":
        shellAngle = -20;
        moveRot.y = this.rad(110)
        assemblyPosition = new BABYLON.Vector3(451, -25, -2)
        assemblyRotation = BABYLON.Quaternion.RotationYawPitchRoll(moveRot.y, moveRot.x, moveRot.z)
        enginePlaceAngle = 152;
        powerupPlaceAngle = 168;
        scene.activeCamera.rotationOffset = 240
        break;
      case "Train":
        moveRot.y = this.rad(150)
        assemblyPosition = new BABYLON.Vector3(483, -25, -19)
        assemblyRotation = BABYLON.Quaternion.RotationYawPitchRoll(moveRot.y, moveRot.x, moveRot.z)
        shellAngle = -60;
        enginePlaceAngle = 120;
        powerupPlaceAngle = 120;
        scene.activeCamera.rotationOffset = 200
        break;
      case "Spaceship": 
        moveRot.y = this.rad(120)
        assemblyPosition = new BABYLON.Vector3(390, -25, -20)
        assemblyRotation = BABYLON.Quaternion.RotationYawPitchRoll(moveRot.y, moveRot.x, moveRot.z)
        shellAngle = 60;
        enginePlaceAngle = 245;
        powerupPlaceAngle = 235;
        break;
      case "Tank":
        moveRot = vehicle.meshes.body.rotation
        moveRot.y = this.rad(70)
        assemblyPosition = new BABYLON.Vector3(418, -25, -1)
        assemblyRotation = BABYLON.Quaternion.RotationYawPitchRoll(moveRot.y, moveRot.x, moveRot.z)
        shellAngle = 20;
        enginePlaceAngle = 192.5;
        powerupPlaceAngle = 208;
        scene.activeCamera.rotationOffset = 240
        break;
    }

    await vehicle.animate(
      new BABYLON.Vector3(vehicle.meshes.body.position.x, vehicle.meshes.body.position.y, vehicle.meshes.body.position.z), 
      BABYLON.Quaternion.RotationYawPitchRoll(0,
      vehicle.meshes.body.rotation.x, vehicle.meshes.body.rotation.z)
    )

    var segments = 3;
    var targetX = vehicle.meshes.body.position.x - assemblyPosition.x;
    var difference = targetX / segments

    for (var i = 0; i < segments; i++) {
      await vehicle.animate(
        new BABYLON.Vector3(vehicle.meshes.body.position.x - difference, vehicle.meshes.body.position.y, vehicle.meshes.body.position.z), 
        BABYLON.Quaternion.RotationYawPitchRoll(vehicle.meshes.body.rotation.y,
        vehicle.meshes.body.rotation.x, vehicle.meshes.body.rotation.z)
      )
    }

    await vehicle.animate(
      new BABYLON.Vector3(vehicle.meshes.body.position.x, vehicle.meshes.body.position.y, vehicle.meshes.body.position.z), 
      BABYLON.Quaternion.RotationYawPitchRoll(this.rad(90),
      vehicle.meshes.body.rotation.x, vehicle.meshes.body.rotation.z)
    )

    await vehicle.animate(assemblyPosition, BABYLON.Quaternion.RotationYawPitchRoll(this.rad(90),
      vehicle.meshes.body.rotation.x, vehicle.meshes.body.rotation.z))

    await vehicle.animate(assemblyPosition, assemblyRotation)

    shell = scene.getTransformNodeByName(userSelection.body+"Top");

    // RESET
    await this.playRow([155,140,,], 1)

    await this.playRow([powerupPlaceAngle,140,,], 1)
    if (userSelection.body != "Train") {
      await this.playRow([, 10, -115, 103.5])
    } else {
      await this.playRow([, 10, -20, -5])
    }
    powerup.setParent(dornaHand);

    // RESET
    await this.playRow([155,140,,], 1)

    // POWERUP DISASSEMBLY
    await this.playRow([powerupAngle, 57, -65, 8])

    const powerupOriginalParent = originalPositionDict[powerup.name][0];
    powerup.parent = powerupOriginalParent
    const powerupOriginalPos = originalPositionDict[powerup.name][1]
    powerup.position = new BABYLON.Vector3(powerupOriginalPos.x, powerupOriginalPos.y, powerupOriginalPos.z)
    const powerupOriginalRotation = originalPositionDict[powerup.name][2]
    powerup.rotation = new BABYLON.Vector3(powerupOriginalRotation.x, powerupOriginalRotation.y, powerupOriginalRotation.z)
    powerup.scaling = new BABYLON.Vector3(1,1,1)

    // RESET
    await this.playRow([155,140,,], 1)

    await this.playRow([enginePlaceAngle, 10, -115, 103.5])

    engine.setParent(dornaHand);
    await this.playRow([155, 140,,], 1)
    await this.playRow([engineAngle, 57, -65, 8])

    const engineOriginalParent = originalPositionDict[engine.name][0];
    engine.parent = engineOriginalParent
    const engineOriginalPosition = originalPositionDict[engine.name][1]
    engine.position = new BABYLON.Vector3(engineOriginalPosition.x, engineOriginalPosition.y, engineOriginalPosition.z)
    const engineOriginalRotation = originalPositionDict[engine.name][2]
    engine.rotation = new BABYLON.Vector3(engineOriginalRotation.x, engineOriginalRotation.y, engineOriginalRotation.z)
    engine.scaling = new BABYLON.Vector3(1,1,1)

    await this.playRow([155,140,,], 1)

    await this.playRow([shellAngle+180,140,,], 1)

    await this.playRow([,25,-106,81.5])

    shell.setParent(dornaHand);
    await this.playRow([shellAngle,140,,], 1)
    await this.playRow([,0,-120,120])

    var shellOriginalParent = originalPositionDict[shell.name][0]
    shell.parent = shellOriginalParent
    var shellOriginalPos = originalPositionDict[shell.name][1]
    shell.position = new BABYLON.Vector3(shellOriginalPos.x, shellOriginalPos.y, shellOriginalPos.z)
    var rot = originalPositionDict[shell.name][2]
    shell.rotation = new BABYLON.Vector3(rot.x, rot.y, rot.z)
    shell.scaling = new BABYLON.Vector3(1,1,1)

    scene.activeCamera.radius = currentRad 
    scene.activeCamera.rotationOffset = currentRotOffset

    this.simulationWrapper.openVehicleSelection();

  }

  // Move the vehicle to the start line, in case it flips or is stuck
  async resetVehicle() {
    if (exitedAssembly) {
      vehicle.disablePhysics();
        await vehicle.animate(
        new BABYLON.Vector3(230, -25, 80), 
        BABYLON.Quaternion.RotationYawPitchRoll(this.rad(180), 0, 0))
      vehicle.startPhysics();
    }
  }

  async buildVehicle() {

    var currentRad = scene.activeCamera.radius
    scene.activeCamera.radius = 150
    var currentRotOffset = scene.activeCamera.rotationOffset
    scene.activeCamera.rotationOffset = 200

    exitedAssembly = false;
    var dornaHand = scene.getTransformNodeByName("HandBone");  
    
    var engine;
    var engineAngle;
    vehicle.disablePhysics()

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

    var moveRot = vehicle.meshes.body.rotation
    var shell;
    var shellAngle = 0;
    var enginePlaceAngle;
    var powerupPlaceAngle;
    var assemblyPosition;
    var assemblyRotation;

    switch (userSelection.body) {
      case "Car":
        shellAngle = -20;
        moveRot.y = this.rad(110)
        assemblyPosition = new BABYLON.Vector3(451, -25, -2)
        assemblyRotation = BABYLON.Quaternion.RotationYawPitchRoll(moveRot.y, moveRot.x, moveRot.z)
        enginePlaceAngle = 152;
        powerupPlaceAngle = 168;
        scene.activeCamera.rotationOffset = 240
        break;
      case "Train":
        moveRot.y = this.rad(150)
        assemblyPosition = new BABYLON.Vector3(483, -25, -19)
        assemblyRotation = BABYLON.Quaternion.RotationYawPitchRoll(moveRot.y, moveRot.x, moveRot.z)
        shellAngle = -60;
        enginePlaceAngle = 120;
        powerupPlaceAngle = 120;
        scene.activeCamera.rotationOffset = 200
        break;
      case "Spaceship": 
        moveRot.y = this.rad(120)
        assemblyPosition = new BABYLON.Vector3(390, -25, -20)
        assemblyRotation = BABYLON.Quaternion.RotationYawPitchRoll(moveRot.y, moveRot.x, moveRot.z)
        shellAngle = 60;
        enginePlaceAngle = 245;
        powerupPlaceAngle = 235;
        break;
      case "Tank":
        moveRot = vehicle.meshes.body.rotation
        moveRot.y = this.rad(70)
        assemblyPosition = new BABYLON.Vector3(418, -25, -1)
        assemblyRotation = BABYLON.Quaternion.RotationYawPitchRoll(moveRot.y, moveRot.x, moveRot.z)
        shellAngle = 20;
        enginePlaceAngle = 192.5;
        powerupPlaceAngle = 208;
        scene.activeCamera.rotationOffset = 240
        break;
    }

    await vehicle.animate(assemblyPosition, assemblyRotation)

    shell = scene.getTransformNodeByName(userSelection.body+"Top");

    // CHASSIS ASSEMBLY
    await this.playRow([shellAngle,140,,], 1)

    await this.playRow([,0,-120,120])
    shell.setParent(dornaHand);

    await this.playRow([shellAngle+180,140,,], 1)

    await this.playRow([,25,-106,81.5])
    
    var topAttachpoint = scene.getMeshByName(userSelection.body + "_TopAttach");
    this.attachTo(shell, topAttachpoint, 0,0,0)

    shell.rotation = new BABYLON.Vector3(0, 0, 0)
    shell.scaling =  new BABYLON.Vector3(1,1,1)
    shell.scaling.z = -1
    await this.playRow([155,140,,], 1)

    // ENGINE ASSEMBLY
    await this.playRow([engineAngle, 57, -65, 8])
    engine.setParent(dornaHand);

    await this.playRow([155, 140,,], 1)

    await this.playRow([enginePlaceAngle, 10, -115, 103.5])

    var engineAttach = scene.getMeshByName(userSelection.body+"_EngineAttach");
    this.attachTo(engine, engineAttach, 0,0.5,0)

    engine.rotation = new BABYLON.Vector3(0, this.rad(90), 0)
    engine.scaling = new BABYLON.Vector3(1,1,1)

    await this.playRow([155,140,,], 1)

    // POWERUP ASSEMBLY
    await this.playRow([powerupAngle, 57, -65, 8])
    powerup.setParent(dornaHand);

    await this.playRow([powerupPlaceAngle,140,,], 1)
    if (userSelection.body != "Train") {
      await this.playRow([, 10, -115, 103.5])
    } else {
      await this.playRow([, 10, -20, -5])
    }

    var powerupAttach = scene.getMeshByName(userSelection.body+"_PowerupAttach");
    this.attachTo(powerup, powerupAttach, 0,0.5,0)

    powerup.rotation = new BABYLON.Vector3(0, this.rad(90), 0)
    powerup.scaling = new BABYLON.Vector3(1,1,1)

    // RESET
    await this.playRow([155,140,,], 1)

    moveRot = vehicle.meshes.body.rotation
    moveRot.y = this.rad(90)

    await vehicle.animate(
      new BABYLON.Vector3(vehicle.meshes.body.position.x - 5, vehicle.meshes.body.position.y, vehicle.meshes.body.position.z), 
      BABYLON.Quaternion.RotationYawPitchRoll(this.rad(90),
       vehicle.meshes.body.rotation.x, vehicle.meshes.body.rotation.z)
    )

    scene.activeCamera.radius = currentRad
    scene.activeCamera.rotationOffset = currentRotOffset

    var difference = (vehicle.meshes.body.position.z - 80)
    await vehicle.animate(
      new BABYLON.Vector3(vehicle.meshes.body.position.x, -25, 80), 
      BABYLON.Quaternion.RotationYawPitchRoll(this.rad(90),
       vehicle.meshes.body.rotation.x, vehicle.meshes.body.rotation.z)
    )

    await vehicle.animate(
      new BABYLON.Vector3(vehicle.meshes.body.position.x, -25, 80), 
      BABYLON.Quaternion.RotationYawPitchRoll(this.rad(90),
       vehicle.meshes.body.rotation.x, vehicle.meshes.body.rotation.z)
    )

    await vehicle.animate(
      new BABYLON.Vector3(vehicle.meshes.body.position.x, vehicle.meshes.body.position.y, vehicle.meshes.body.position.z), 
      BABYLON.Quaternion.RotationYawPitchRoll(this.rad(180),
       vehicle.meshes.body.rotation.x, vehicle.meshes.body.rotation.z)
    )

    var segments = 4;
    var targetX = vehicle.meshes.body.position.x - 215;
    difference = targetX / segments

    for (var i = 0; i < segments; i++) {
      await vehicle.animate(
        new BABYLON.Vector3(vehicle.meshes.body.position.x - difference, vehicle.meshes.body.position.y, vehicle.meshes.body.position.z), 
        BABYLON.Quaternion.RotationYawPitchRoll(this.rad(180),
        vehicle.meshes.body.rotation.x, vehicle.meshes.body.rotation.z)
      )
    }

    // Block off the assembly area
    this.raiseBlock("RoadBlock1");

    await vehicle.animate(
      new BABYLON.Vector3(vehicle.meshes.body.position.x, vehicle.meshes.body.position.y, vehicle.meshes.body.position.z), 
      BABYLON.Quaternion.RotationYawPitchRoll(this.rad(140),
      vehicle.meshes.body.rotation.x, vehicle.meshes.body.rotation.z)
    )

    exitedAssembly = true;
    firstBuild = false;

    // Give control to the player
    vehicle.startPhysics()
  }

  // Helper to convert degrees to radians
  rad(degrees) {
    return degrees * Math.PI / 180
  }

  // Play a "row" of dorna arm positions, matches the CSV dorna output format
  // arrayOfPositions = [Shoulder.z, Upper.x, Fore.x, Hand.x]
  // awaitIndex: which animation is async awaitable, the rest will be played concurrently
  // Defaults to the dorna hand
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
  }

  // Plays a CSV in the format of Shoulder Angle, Uppearm, Forearm, Hand
  async playCSV(fileName = "Tank_Assembly_J") {
    var csv = readCsv(fileName);
    var lastrow = csv[0];
    var x = 0;
    for (var row of csv) {
      if (JSON.stringify(lastrow) !== JSON.stringify(row)) {
        lastrow = row;
        this.playRow([parseInt(row[0]),parseInt(row[1]),parseInt(row[2]),parseInt(row[3])], 3)
      }
    }
  }

  // Debug method to raise all blocks on the track
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

  //used during testing, attached to button
  something()
  {
    vehicle.move(new Vector3(vehicle.meshes.body.position.x,vehicle.meshes.body.position.y+60,vehicle.meshes.body.position.z),
    vehicle.meshes.body.rotationQuaternion, true);
  }

  //Used to start over with a new vehicle build
  restartSimulation(body,powerup, engine){
    firstBuild = true;
    userSelection.body = body || "Car";
    userSelection.engine = engine || "Steam";
    userSelection.powerup = powerup || "4 Wheel Drive";
    //move all vehicles back to starting positions
    Object.keys(vehicles).map(x => vehicles[x].resetPosition());
    //Switch vehicle
    switchVehicle(body, this.scene);
    addTriggers(this.gui, scene, body, userSelection.powerup, this)
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
    //addTriggers(this.gui, scene, body, this.powerupName, this)
    //Add vehicle to gui
    this.gui.speedBoostButton.deactivateButton();
    if(powerup == "Speed Boost")
    {
      this.gui.speedBoostButton.activateButton();
    } 
    this.buildVehicle();

  }

  //Used for user submitting score
  submitScore(name){
    if(bestLap == 0)
      return;
      HTTP.sendScoreToServer(name || "unknown", this.calculateScore(), this.vehicleName, this.powerupName, this.engineType);
  }

  //Used to calc score
  calculateScore() {
    return (bestLap == undefined || bestLap == 0) ? 0 : 50000 - (bestLap*111);
  }

  //Used for speed boost button, can be extended to support more canvas buttons
  buttonPressed(name) {
    if(name == "speedBoost")
    {
      vehicle.prototype.sbActivationTime = new Date().getTime();
      this.gui.speedBoostButton.startTimer();
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
