<template>
  <div>
    <div>
      {{ this.userSelection["body"] }} with
      {{ this.userSelection.engine }} engine and
      {{ this.userSelection.powerup }} powerup
    </div>
    <div><button @click="spinArm">Activate Powerup!!</button></div>
    <canvas id="gameCanvas" width="1000px" height="600px"></canvas>
  </div>
</template>

<script>
import * as Vehicles from "../Vehicles.js";
import *  as CanvasApp from "../canvasApp.js"
import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import "@babylonjs/loaders/glTF";
import {
  PhysicsImpostor,
} from "@babylonjs/core/Physics";
//import {} from "@babylon/core/Events/keyboardEv";
import { StandardMaterial } from "@babylonjs/core/Materials";
import "@babylonjs/core/Physics/Plugins/cannonJSPlugin";
import {
  SceneLoader,
  Engine,
  Scene,
  ArcRotateCamera,
  Vector3,
  MeshBuilder,
  HemisphericLight,
  Color3,
  FollowCamera,
} from "@babylonjs/core";

window.CANNON = require("cannon");
var vehicle;
var vehicles = {};

var createScene = async function (engine, canvas) {
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

class Omni 
{}

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

class BabylonApp {
  constructor(vehicleName, engineName) {
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
      vehicles = {MT: new Vehicles.MT(scene,50,0,engineName,v), Train: new Vehicles.Train(scene,50,50,engineName,v), Tank: new Vehicles.Tank(scene,50,-50,engineName,v)}
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
    spinArm() {
      switch(this.userSelection["powerup"])
      {
        case "4 Wheel Drive":   
          //the noise is activated by area
          break;
        case "Emergency Siren": 
          //prevents penalty
          break;
        case "Portal":   
          //lowers wall       
          break;
        case "Speed Boost":
          console.log("Activating speed boost powerup");
          this.vehicle.attr.sbActivationTime = new Date().getTime();
          break;
      }
    },
  },
  data() {
    return { userSelection: { body: "", engine: "", powerup: "" }, mode: 0 };
  },
  mounted() {
    this.userSelection["body"] = this.$route.query.body;
    this.userSelection["engine"] = this.$route.query.engine;
    this.userSelection["powerup"] = this.$route.query.powerup;
    let Application = new BabylonApp(this.userSelection["body"], this.userSelection["engine"]);
    new CanvasApp.Test();
  },
};
</script>
