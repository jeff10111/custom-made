var vehicle;
var vehicles = {};
let offroadSection = { min: [0, 0], max: [1, 1] };

import * as BABYLON from 'babylonjs';
import * as Vehicles from "./Vehicles.js";
import {
    SceneLoader,
    Engine,
    Scene,
  } from "@babylonjs/core";
window.CANNON = require("cannon");

function offroad(body) {
    return (body.position.x >= offroadSection.min[0] && body.position.x <= offroadSection.max[0]
        && body.position.y >= offroadSection.min[1] && body.position.y <= offroadSection.max[1]);
}

function switchVehicle(vehicleName)
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
          console.log("Set vehicle to tank");
          console.log(vehicle.attr);
          break;
      }
}

var createScene = async function (engine, canvas) {
    //Creating scene, camera and lighting
    var scene = new Scene(engine);
    scene.clearColor = BABYLON.Color3.Purple();
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
    await SceneLoader.ImportMeshAsync("","/assets/","track.glb")
    var track = scene.getMeshByName("Track");
    track.position = new BABYLON.Vector3(-125,-480,-760);
  
    //Creating the ground and enabling physics
    var ground = BABYLON.MeshBuilder.CreateGround(
      "ground",
      { width: 3000, height: 3000 },
      scene
    );
    var mat = new BABYLON.StandardMaterial("green", scene);
    mat.diffuseColor = new BABYLON.Color3.Green();
    ground.material = mat;
    scene.enablePhysics();
    ground.physicsImpostor = new BABYLON.PhysicsImpostor(
      ground,
      BABYLON.PhysicsImpostor.BoxImpostor,
      { mass: 0, restitution: 0 },
      scene
    );
  
    scene.ambientColor = new BABYLON.Color3(256, 0, 0);
  
    return scene;
  };

export class BabylonApp {
    constructor(vehicleName, engineName, powerupName) {
        this.powerUp = powerupName;
      // create the canvas html element and attach it to the webpage
      var canvas = document.getElementById("gameCanvas");
      var v = true;//visibility
      // initialize babylon scene and engine
      var engine = new Engine(canvas, true);
      var scene;
      var scenePromise = createScene(engine, canvas);
      scenePromise.then((returnedScene) => {
        scene = returnedScene;
        this.scene = returnedScene;
        vehicles = {MT: new Vehicles.MT(scene,50,0,engineName,v), Train: new Vehicles.Train(scene,50,50,engineName,v), Tank: new Vehicles.Tank(scene,50,-50,engineName, powerupName,v)}
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
  
      window.addEventListener("resize", function () {
        engine.resize();
      });
    }
    powerUpActivation()
    {
        console.log("Powerup call");
        switch(this.powerUp)
        {
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
  }
