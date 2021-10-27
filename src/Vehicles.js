import * as BABYLON from 'babylonjs';
import {Vector3, Quaternion} from "@babylonjs/core";
import { _ } from 'core-js';
import { Box } from 'cannon';
let sbDuration = 10000;//10 second power up duration
let sbMultiplier = 1.3;
let sbAvailable = true;

//determines the correct torque for the vehicle
export function engine(e) {
    switch (e) {
        case "Steam":
            return 0.5;
        case "Petrol":
            return 0.7;
        case "Jet":
            return 0.9;
        case "Nuclear Fusion":
            return 1.1;
        default:
            return 0;
    }
}

//prototypical function to call vehicle movement functions from user input
let userInput = function(keys)
{
    if(!this.physicsEnabled){
        return; 
    }
    //Getting the multi if speed boost is enabled.
    var multi = 1;
    let timeLeft = new Date().getTime() - this.prototype.sbActivationTime;
    if(sbAvailable && (timeLeft < sbDuration))
    {
        multi = sbMultiplier;
        if(timeLeft > sbDuration)
            sbAvailable = false;
    } 
    //Function to add randomness when vehicle is offroad without offroad powerup
    if (this.prototype.offRoad && this.prototype.powerupName != "4 Wheel Drive" && Math.random() > 0.85) {
        console.log("Driving offRoad");
    switch (Math.floor(Math.random() * 8))
    {
        case 0:
            this.forwards(multi);
            break;
        case 1:
            this.backwards(multi);
            break;
        case 2:
            this.left(multi);
            break;
        case 3:
            this.right(multi);
            break;
        case 4:
            this.forwardsLeft(multi);
            break;
        case 5:
            this.forwardsRight(multi);
            break;
        case 6:
            this.backwardsLeft(multi);
            break;
        case 7:
            this.backwardsRight(multi);
            break;
    }
    return;
    }
    //Normal use
    else if (keys["w"]) {
        this.camera.maxCameraSpeed = 15;
        if(keys["a"])
        {
            this.forwardsLeft(multi);
        } else if (keys["d"])
        {
            this.forwardsRight(multi);
        } else {
        this.forwards(multi);
        }
    }
    else if (keys["s"]) {
        this.camera.maxCameraSpeed = 15;
        if(keys["a"])
        {
            this.backwardsLeft(multi);
        } else if (keys["d"])
        {
            this.backwardsRight(multi);
        } else {
            this.backwards(multi);
        }
    } else if (keys["d"]) {
        this.right(multi);
        this.camera.maxCameraSpeed = 2;
    } else if (keys["a"]) {
        this.left(multi);
        this.camera.maxCameraSpeed = 2;
    } else {
        this.releaseDrive();
        this.camera.maxCameraSpeed = 2;
    }
}

//prototypical function to disable physics
let disablePhysics = function(){
    if(!this.physicsEnabled)
    return;
    for(var key in this.meshes)
    {
        this.meshes[key].physicsImpostor.dispose();
        this.meshes[key].physicsImpostor = null;
    }
    this.wheels.map(x => this.meshes[x].setParent(this.meshes.body));
    this.physicsEnabled = false;
    this.motors = [];       
}

//Moving vehicle using coordinate and quaternion rotation
let move = function(coordinates, rotation, reenablePhysics){
    this.physicsEnabled && this.disablePhysics();
    this.meshes.body.position = coordinates;
    //Copy the values, not the object
    this.meshes.body.rotationQuaternion.x = rotation.x; 
    this.meshes.body.rotationQuaternion.y = rotation.y; 
    this.meshes.body.rotationQuaternion.z = rotation.z; 
    this.meshes.body.rotationQuaternion.w = rotation.w; 
    console.log(`Setting quaternion to: ${rotation}. Result is: ${this.meshes.body.rotationQuaternion}`)
    reenablePhysics && this.startPhysics();
}

//for playback, probably won't be finished
let animate = function(quaternions,vector3s, steps)
{
    var v3 = new BABYLON.Animation("v3", "position", 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
    BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE); 
    var q = new BABYLON.Animation("q", "rotationQuaternion", 30, BABYLON.Animation.ANIMATIONTYPE_QUATERNION,
    BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);  
    let keyFramesV = [];
    let keyFramesQ = [];
    steps.forEach((x,i) =>{
        keyFramesV.push({value:vector3s[i],frame:x});
        keyFramesQ.push({value:quaternions[i],frame:x});
    })
    this.meshes.body.animations.push(v3);
    this.meshes.body.animations.push(q);
}

//prototypical function for positioning wheels relative to body
let wheelPositioning = function(body, wheel, x, y, z) {
    wheel.parent = body;
    wheel.position.y = y;
    wheel.position.z = z;//width
    wheel.position.x = x;
}

//prototypical function for attaching MOD wheel mesh to physics wheel
let wheelMeshParent = function(mesh, parentMesh, x, y, z) {
    parentMesh.setParent(null);
    mesh.parent = parentMesh;
    mesh.rotate(BABYLON.Axis.X, Math.PI / 2, BABYLON.Space.LOCAL);
    mesh.position.y = y;//width
    mesh.position.z = z;// y negative is up
    mesh.position.x = x;//forward/backward
}

//Used for attaching a wheel to a body using a motor joint
let wheelJoint = function(body, wheel, x, y, z) {
    var newJoint = new BABYLON.MotorEnabledJoint(BABYLON.PhysicsJoint.HingeJoint, {
        mainPivot: new BABYLON.Vector3(0, 0, 0), //0,0,0 means pivot is in center of wheel
        connectedPivot: new BABYLON.Vector3(x, y, z),//pivot of body
        mainAxis: new BABYLON.Vector3(0, -1, 0), //axis of rotation for body 1
        connectedAxis: new BABYLON.Vector3(0, 0, 1), //axis of rotation for body 2
    });
    wheel.physicsImpostor.addJoint(body.physicsImpostor, newJoint);
    this.motors.push(newJoint);
}

//used for debugging stuff
let test = function(){
    this.i += 1;
    (this.physicsEnabled) ? this.disablePhysics() : this.startPhysics(); 
    console.log(this.meshes.body.position);
}

//Prototypical object used to store vehicle attributes
let Prototype = function(speed, torque, wheelDiam, wheelHeight, wheelRestitution, wheelFriction, bodyMass, wheelMass, powerupName, engineName, x, z, rotation){
    this.speed = speed;
    this.torque = torque * engine(engineName);
    this.originalTorque = torque;
    this.wheelDiam = wheelDiam;
    this.wheelHeight = wheelHeight;
    this.wheelRestitution = wheelRestitution;
    this.wheelFriction = wheelFriction;
    this.bodyMass = bodyMass; 
    this.wheelMass = wheelMass;
    this.powerupName = powerupName;
    this.offRoad = false;
    this.sbActivationTime = 0;
    this.originalVector3 = new Vector3(x,-25,z);
    this.originalQuaternion = {x:rotation.x, y:rotation.y, z:rotation.z, w:rotation.w};
    Object.preventExtensions(this);
}

//Return vehicle to its original position
let resetPosition = function(){
    this.move(this.prototype.originalVector3, this.prototype.originalQuaternion, false);
}

//Prototypical builder for each vehicle
let vehicleBuilder = function(visible, rotation, scene){
    this.scene = scene;
    //Camera set up
    this.cameras = [];
    this.cameras.push(new BABYLON.FollowCamera("FollowCamera", new Vector3(0,0,0),this.scene, this.meshes.body));
    this.camera = this.cameras[0];
    this.camera.radius = 100; this.camera.heightOffset = 70; this.camera.rotationOffset = 270;this.camera.cameraAcceleration = 0.010;this.camera.maxCameraSpeed = 15;
    this.camera.inputs.clear();
    //Alt camera
    this.cameras.push(new BABYLON.ArcRotateCamera("ArcCamera", Math.PI/2, Math.PI/6, 200, this.meshes.body, scene));

      //Setting universal variables/functions
      this.motors = [];
      this.physicsEnabled = false;
      !this.userInput && (this.userInput = userInput);//only set if undefined (has not been overidden by the child class)
      this.disablePhysics = disablePhysics;
      this.switchCamera = switchCamera;
      this.test = test;
      this.move = move;
      this.resetPosition = resetPosition;
      this.wheelPositioning = wheelPositioning;
      this.wheelMeshParent = wheelMeshParent;
      this.wheelJoint = wheelJoint;
      //Calling functions to build the vehicle
      this.wheels = Object.keys(this.meshes).filter(x => x != "body");
      //Body part
      this.attachBodyParts();
      //Wheel part
      this.attachWheels && this.attachWheels();//only call if defined by the child class
      this.meshes.body.rotationQuaternion = rotation
      this.move(this.prototype.originalVector3, this.prototype.originalQuaternion, false);

      //make babylon meshes invisible
      if (!visible)
          Object.entries(this.meshes).map((x) => x[1].isVisible = false);
}

let switchCamera = function(){
    console.log('switching camera')
    if(this.camera === this.cameras[0])
        this.camera = this.cameras[1];
    else
        this.camera = this.cameras[0];
}

//Omni vehicle
//A bit different from the others since it wasn't implemented with wheels
export class Omni {
    constructor(scene, x, z, engineName, powerupName, visible, rotation) {
        this.prototype = new Prototype(20, 200, 2.5, 1, 1, 50, 10, 1, powerupName, engineName, x, z, rotation);
        this.meshes = {
            body: BABYLON.MeshBuilder.CreateCylinder(null, { diameter: 23, height: 10 }, scene),
        }
        this.protoConst = vehicleBuilder;
        this.protoConst(visible, rotation, scene);
        this.switchCamera();
    }

    startPhysics(){
        if(this.physicsEnabled)
        return;
        this.meshes.body.physicsImpostor = new BABYLON.PhysicsImpostor(this.meshes.body, BABYLON.PhysicsImpostor.CylinderImpostor, { mass: this.prototype.bodyMass, friction: 0.01, restitution: 0 }, this.scene);
        this.physicsEnabled = true;
    }

    disablePhysics() {
        if(!this.physicsEnabled)
        return;
        this.meshes.body.physicsImpostor.dispose();
        this.meshes.body.physicsImpostor = null;
        this.physicsEnabled = false;
    }

    attachBodyParts() {
        var mesh = this.scene.getTransformNodeByName("Omni");
        mesh.parent = this.meshes.body;
        mesh.position.z = 0;
        mesh.position.y = -5;
    }

    userInput(keys) {
        console.log("Radian" + keys['radian']);
        var impulseVector = new BABYLON.Vector3(0, 0, 0);
        var multi =
        ((new Date().getTime() - this.prototype.sbActivationTime) < sbDuration) ? sbMultiplier : 1;
        if (this.prototype.offRoad && this.prototype.powerupName != "4 Wheel Drive" && Math.floor(Math.random() * 10) == 9) {
            var x = Math.random() * 2 - 1 > 0 ? Math.random()*-1 : Math.random();
            var y = Math.random() * 2 - 1 > 0 ? Math.random()*-1 : Math.random();
            var z = Math.random() * 2 - 1 > 0 ? Math.random()*-1 : Math.random();
            impulseVector = new BABYLON.Vector3(x, y, z);
        }
        else if (keys['s'])
        {
            if (keys['a'])
            {
                impulseVector = new BABYLON.Vector3(1, 0, 1);
            } else if (keys["d"])//west?
            {
                impulseVector = new BABYLON.Vector3(-1, 0, 1);
            }
            else {
                impulseVector = new BABYLON.Vector3(0, 0, 1);
            }
        } else if (keys['w']) {
            if (keys['a'])
            {
                impulseVector = new BABYLON.Vector3(1, 0, -1);
            } else if (keys["d"])
            {
                impulseVector = new BABYLON.Vector3(-1, 0, -1);
            }
            else {
                impulseVector = new BABYLON.Vector3(0, 0, -1);
            }
        } else if (keys['d']) {
            impulseVector = new BABYLON.Vector3(-1, 0, 0);
        } else if (keys['a']) {
            impulseVector = new BABYLON.Vector3(1, 0, 0);
        }
        this.meshes.body.physicsImpostor.applyImpulse(impulseVector.scale(this.prototype.bodyMass * multi), this.meshes.body.getAbsolutePosition());
    }
}

export class Tank {
    constructor(scene, x, z, engineName, powerupName, visible, rotation) {
        this.prototype = new Prototype(50, 50, 2.5, 1, 0.05, 100, 20, 1, powerupName, engineName, x, z, rotation);
        this.meshes = {
            body: BABYLON.MeshBuilder.CreateBox(null, { width: 22, depth: 20, height: 6 }, scene),
            wheelL1: BABYLON.MeshBuilder.CreateCylinder(null, { diameter: this.prototype.wheelDiam, height: this.prototype.wheelHeight }, scene),
            wheelL2: BABYLON.MeshBuilder.CreateCylinder(null, { diameter: this.prototype.wheelDiam, height: this.prototype.wheelHeight }, scene),
            wheelL3: BABYLON.MeshBuilder.CreateCylinder(null, { diameter: this.prototype.wheelDiam, height: this.prototype.wheelHeight }, scene),
            wheelL4: BABYLON.MeshBuilder.CreateCylinder(null, { diameter: this.prototype.wheelDiam, height: this.prototype.wheelHeight }, scene),
            wheelR1: BABYLON.MeshBuilder.CreateCylinder(null, { diameter: this.prototype.wheelDiam, height: this.prototype.wheelHeight }, scene),
            wheelR2: BABYLON.MeshBuilder.CreateCylinder(null, { diameter: this.prototype.wheelDiam, height: this.prototype.wheelHeight }, scene),
            wheelR3: BABYLON.MeshBuilder.CreateCylinder(null, { diameter: this.prototype.wheelDiam, height: this.prototype.wheelHeight }, scene),
            wheelR4: BABYLON.MeshBuilder.CreateCylinder(null, { diameter: this.prototype.wheelDiam, height: this.prototype.wheelHeight }, scene),
        };
        this.protoConst = vehicleBuilder;
        this.protoConst(visible, rotation, scene);
    }

    startPhysics(){
        if(this.physicsEnabled)
            return;
        this.wheels.forEach((x) => {
            this.meshes[x].setParent(null);
            this.meshes[x].physicsImpostor = 
            new BABYLON.PhysicsImpostor(this.meshes[x], BABYLON.PhysicsImpostor.CylinderImpostor, { mass: this.prototype.wheelMass, friction: this.prototype.wheelFriction, restitution: this.prototype.wheelRestitution }, this.scene);
        });
        //Adding physics imposter to body mesh (the parent of the mod mesh)
        this.meshes.body.physicsImpostor =
        new BABYLON.PhysicsImpostor(this.meshes.body, BABYLON.PhysicsImpostor.BoxImpostor, { mass: this.prototype.bodyMass , restitution: 0, friction: 0}, this.scene);
        //hinges part
        let wheelWidth = 10.5;
        let wheelHeight = -3;
        this.wheelJoint(this.meshes.body, this.meshes.wheelL1, -5.3, wheelHeight, wheelWidth);
        this.wheelJoint(this.meshes.body, this.meshes.wheelL2, -1.6, wheelHeight, wheelWidth);
        this.wheelJoint(this.meshes.body, this.meshes.wheelL3, 2, wheelHeight, wheelWidth);
        this.wheelJoint(this.meshes.body, this.meshes.wheelL4, 5.5, wheelHeight, wheelWidth);
        this.wheelJoint(this.meshes.body, this.meshes.wheelR1, -5.3, wheelHeight, -wheelWidth);
        this.wheelJoint(this.meshes.body, this.meshes.wheelR2, -1.6, wheelHeight, -wheelWidth);
        this.wheelJoint(this.meshes.body, this.meshes.wheelR3, 2, wheelHeight, -wheelWidth);
        this.wheelJoint(this.meshes.body, this.meshes.wheelR4, 5.5, wheelHeight, -wheelWidth);
        this.physicsEnabled = true;
    }

    attachBodyParts() {
        let body = this.meshes.body;
        var mesh = this.scene.getTransformNodeByName("TankBody");
        mesh.parent = body;
        //Positioning the MOD mesh relative to the babylon mesh
        mesh.position.y -= 4;
        mesh.position.z -= 23;
        mesh.position.x -= 2;

        mesh = this.scene.getMeshByName("Tank_PowerupAttach");
        mesh.parent = body;
        mesh.position.y -= 4;
        mesh.position.z -= 23;
        mesh.position.x -= 2;
        mesh = this.scene.getMeshByName("Tank_EngineAttach");
        mesh.parent = body;
                mesh.position.y -= 4;
        mesh.position.z -= 23;
        mesh.position.x -= 2;
        mesh = this.scene.getMeshByName("Tank_TopAttach");
        mesh.parent = body;
        mesh.position.y -= 4;
        mesh.position.z -= 23;
        mesh.position.x -= 2;

    }
    attachWheels() {
        let L1 = this.meshes.wheelL1;
        let L2 = this.meshes.wheelL2;
        let L3 = this.meshes.wheelL3;
        let L4 = this.meshes.wheelL4;
        let R1 = this.meshes.wheelR1;
        let R2 = this.meshes.wheelR2;
        let R3 = this.meshes.wheelR3;
        let R4 = this.meshes.wheelR4;
        let body = this.meshes.body;
        let wheelWidth = 10.5;
        let wheelHeight = -3;

        //Rotating all the wheels so the face is parralel with the ground
        L1.rotate(BABYLON.Axis.X, Math.PI / 2, BABYLON.Space.LOCAL);
        L2.rotate(BABYLON.Axis.X, Math.PI / 2, BABYLON.Space.LOCAL);
        L3.rotate(BABYLON.Axis.X, Math.PI / 2, BABYLON.Space.LOCAL);
        L4.rotate(BABYLON.Axis.X, Math.PI / 2, BABYLON.Space.LOCAL);
        R1.rotate(BABYLON.Axis.X, Math.PI / 2, BABYLON.Space.LOCAL);
        R2.rotate(BABYLON.Axis.X, Math.PI / 2, BABYLON.Space.LOCAL);
        R3.rotate(BABYLON.Axis.X, Math.PI / 2, BABYLON.Space.LOCAL);
        R4.rotate(BABYLON.Axis.X, Math.PI / 2, BABYLON.Space.LOCAL);

        //positioning the mod wheel meshes relative to babylon wheel mesh
        this.wheelMeshParent(this.scene.getMeshByName("TankL1"), L1, 3.2, 13, -2);
        this.wheelMeshParent(this.scene.getMeshByName("TankL2"), L2, -0.5, 13, -2);
        this.wheelMeshParent(this.scene.getMeshByName("TankL3"), L3, -3.7, 13, -2);
        this.wheelMeshParent(this.scene.getMeshByName("TankL4"), L4, -7.2, 13, -2);
        this.wheelMeshParent(this.scene.getMeshByName("TankR1"), R1, 3.2, 33, -2);
        this.wheelMeshParent(this.scene.getMeshByName("TankR2"), R2, -0.5, 33, -2);
        this.wheelMeshParent(this.scene.getMeshByName("TankR3"), R3, -3.7, 33, -2);
        this.wheelMeshParent(this.scene.getMeshByName("TankR4"), R4, -7.2, 33, -2);

        //Positioning the babylon/parent meshes relative to the vehicle
        this.wheelPositioning(body, L1, -5.3, wheelHeight, wheelWidth);
        this.wheelPositioning(body, L2, -1.6, wheelHeight, wheelWidth);
        this.wheelPositioning(body, L3, 2, wheelHeight, wheelWidth);
        this.wheelPositioning(body, L4, 5.5, wheelHeight, wheelWidth);
        this.wheelPositioning(body, R1, -5.3, wheelHeight, -wheelWidth);
        this.wheelPositioning(body, R2, -1.6, wheelHeight, -wheelWidth);
        this.wheelPositioning(body, R3, 2, wheelHeight, -wheelWidth);
        this.wheelPositioning(body, R4, 5.5, wheelHeight, -wheelWidth);
    }

    forwards(multi) {
        this.motors.map((x) => x.setMotor(+this.prototype.speed * multi, this.prototype.torque * multi));
    }
    backwards(multi) {
        this.motors.map((x) => x.setMotor(-this.prototype.speed * multi, this.prototype.torque * multi));
    }
    forwardsLeft(multi) {
        var torqueMultiForwards = 0.6;
        var torqueMultiBackwards = torqueMultiForwards/3;
        this.motors[0].setMotor(this.prototype.speed/3 * multi, this.prototype.torque * torqueMultiBackwards * multi);
        this.motors[1].setMotor(this.prototype.speed/3 * multi, this.prototype.torque * torqueMultiBackwards * multi);
        this.motors[2].setMotor(this.prototype.speed/3 * multi, this.prototype.torque * torqueMultiBackwards * multi);
        this.motors[3].setMotor(this.prototype.speed/3 * multi, this.prototype.torque * torqueMultiBackwards * multi);
        this.motors[4].setMotor(this.prototype.speed * multi, this.prototype.torque * torqueMultiForwards * multi);
        this.motors[5].setMotor(this.prototype.speed * multi, this.prototype.torque * torqueMultiForwards * multi);
        this.motors[6].setMotor(this.prototype.speed * multi, this.prototype.torque * torqueMultiForwards * multi);
        this.motors[7].setMotor(this.prototype.speed * multi, this.prototype.torque * torqueMultiForwards * multi);
    }
    backwardsLeft(multi) {
        var torqueMultiForwards = 0.6;
        var torqueMultiBackwards = torqueMultiForwards/3;
        this.motors[0].setMotor(-this.prototype.speed/3 * multi, this.prototype.torque * torqueMultiBackwards * multi);
        this.motors[1].setMotor(-this.prototype.speed/3 * multi, this.prototype.torque * torqueMultiBackwards * multi);
        this.motors[2].setMotor(-this.prototype.speed/3 * multi, this.prototype.torque * torqueMultiBackwards * multi);
        this.motors[3].setMotor(-this.prototype.speed/3 * multi, this.prototype.torque * torqueMultiBackwards * multi);
        this.motors[4].setMotor(-this.prototype.speed * multi, this.prototype.torque * torqueMultiForwards * multi);
        this.motors[5].setMotor(-this.prototype.speed * multi, this.prototype.torque * torqueMultiForwards * multi);
        this.motors[6].setMotor(-this.prototype.speed * multi, this.prototype.torque * torqueMultiForwards * multi);
        this.motors[7].setMotor(-this.prototype.speed * multi, this.prototype.torque * torqueMultiForwards * multi);
    }
    backwardsRight(multi) {
        var torqueMultiForwards = 0.6;
        var torqueMultiBackwards = torqueMultiForwards/3;
        this.motors[4].setMotor(-this.prototype.speed/3 * multi, this.prototype.torque * torqueMultiBackwards * multi);
        this.motors[5].setMotor(-this.prototype.speed/3 * multi, this.prototype.torque * torqueMultiBackwards * multi);
        this.motors[6].setMotor(-this.prototype.speed/3 * multi, this.prototype.torque * torqueMultiBackwards * multi);
        this.motors[7].setMotor(-this.prototype.speed/3 * multi, this.prototype.torque * torqueMultiBackwards * multi);
        this.motors[0].setMotor(-this.prototype.speed * multi, this.prototype.torque * torqueMultiForwards * multi);
        this.motors[1].setMotor(-this.prototype.speed * multi, this.prototype.torque * torqueMultiForwards * multi);
        this.motors[2].setMotor(-this.prototype.speed * multi, this.prototype.torque * torqueMultiForwards * multi);
        this.motors[3].setMotor(-this.prototype.speed * multi, this.prototype.torque * torqueMultiForwards * multi);
    }
    forwardsRight(multi) {
        var torqueMultiForwards = 0.6;
        var torqueMultiBackwards = torqueMultiForwards/3;
        this.motors[0].setMotor(this.prototype.speed * multi, this.prototype.torque * torqueMultiForwards * multi);
        this.motors[1].setMotor(this.prototype.speed * multi, this.prototype.torque * torqueMultiForwards * multi);
        this.motors[2].setMotor(this.prototype.speed * multi, this.prototype.torque * torqueMultiForwards * multi);
        this.motors[3].setMotor(this.prototype.speed * multi, this.prototype.torque * torqueMultiForwards * multi);
        this.motors[4].setMotor(this.prototype.speed/3 * multi, this.prototype.torque * torqueMultiBackwards * multi);
        this.motors[5].setMotor(this.prototype.speed/3 * multi, this.prototype.torque * torqueMultiBackwards * multi);
        this.motors[6].setMotor(this.prototype.speed/3 * multi, this.prototype.torque * torqueMultiBackwards * multi);
        this.motors[7].setMotor(this.prototype.speed/3 * multi, this.prototype.torque * torqueMultiBackwards * multi);
    }
    right(multi) {
        var torqueMulti = 0.1;
        this.motors[0].setMotor(this.prototype.speed * multi, this.prototype.torque * torqueMulti);
        this.motors[1].setMotor(this.prototype.speed * multi, this.prototype.torque * torqueMulti);
        this.motors[2].setMotor(this.prototype.speed * multi, this.prototype.torque * torqueMulti);
        this.motors[3].setMotor(this.prototype.speed * multi, this.prototype.torque * torqueMulti);
        this.motors[4].setMotor(-this.prototype.speed * multi, this.prototype.torque * torqueMulti);
        this.motors[5].setMotor(-this.prototype.speed * multi, this.prototype.torque * torqueMulti);
        this.motors[6].setMotor(-this.prototype.speed * multi, this.prototype.torque * torqueMulti);
        this.motors[7].setMotor(-this.prototype.speed * multi, this.prototype.torque * torqueMulti);
    }
    left(multi) {
        var torqueMulti = 0.1;
        this.motors[0].setMotor(-this.prototype.speed * multi, this.prototype.torque * torqueMulti);
        this.motors[1].setMotor(-this.prototype.speed * multi, this.prototype.torque * torqueMulti);
        this.motors[2].setMotor(-this.prototype.speed * multi, this.prototype.torque * torqueMulti);
        this.motors[3].setMotor(-this.prototype.speed * multi, this.prototype.torque * torqueMulti);
        this.motors[4].setMotor(this.prototype.speed * multi, this.prototype.torque * torqueMulti);
        this.motors[5].setMotor(this.prototype.speed * multi, this.prototype.torque * torqueMulti);
        this.motors[6].setMotor(this.prototype.speed * multi, this.prototype.torque * torqueMulti);
        this.motors[7].setMotor(this.prototype.speed * multi, this.prototype.torque * torqueMulti);
    }
    releaseDrive() {
        this.motors.map(x => x.setMotor(0, this.prototype.torque / 8));
    }
    releaseSteering() {
        this.motors.map(x => x.setMotor(0, this.prototype.torque / 8));
    }

}

export class Train {
    constructor(scene, x, z, engineName, powerupName, visible, rotation) {
        this.prototype = new Prototype(30,10,5.5,1,0.05,100,30,1,powerupName,engineName, x, z, rotation);
        this.meshes = {
            body: BABYLON.MeshBuilder.CreateBox("ABCDE", { width: 25, depth: 15, height: 6 }, scene),
            wheelL1: BABYLON.MeshBuilder.CreateCylinder(null, { diameter: this.prototype.wheelDiam, height: this.prototype.wheelHeight }, scene),
            wheelL2: BABYLON.MeshBuilder.CreateCylinder(null, { diameter: this.prototype.wheelDiam, height: this.prototype.wheelHeight }, scene),
            wheelL3: BABYLON.MeshBuilder.CreateCylinder(null, { diameter: this.prototype.wheelDiam, height: this.prototype.wheelHeight }, scene),
            wheelR1: BABYLON.MeshBuilder.CreateCylinder(null, { diameter: this.prototype.wheelDiam, height: this.prototype.wheelHeight }, scene),
            wheelR2: BABYLON.MeshBuilder.CreateCylinder(null, { diameter: this.prototype.wheelDiam, height: this.prototype.wheelHeight }, scene),
            wheelR3: BABYLON.MeshBuilder.CreateCylinder(null, { diameter: this.prototype.wheelDiam, height: this.prototype.wheelHeight }, scene),
        };
        this.protoConst = vehicleBuilder;
        this.protoConst(visible, rotation, scene);

        //hide un-used rails
        this.scene.getMeshByName("RightBar").position.y = -100;
        this.scene.getMeshByName("LeftBar").position.y = -100;
    }

    startPhysics(){
        if(this.physicsEnabled)
        return;
        this.wheels.forEach((x) => {
            this.meshes[x].setParent(null);
            this.meshes[x].physicsImpostor = 
        new BABYLON.PhysicsImpostor(this.meshes[x], BABYLON.PhysicsImpostor.CylinderImpostor, { mass: this.prototype.wheelMass, friction: this.prototype.wheelFriction, restitution: this.prototype.wheelRestitution }, this.scene);
        });
        this.meshes.body.physicsImpostor =
        new BABYLON.PhysicsImpostor(this.meshes.body, BABYLON.PhysicsImpostor.BoxImpostor, { mass: this.prototype.bodyMass, friction: 0 }, this.scene);
        let wheelWidth = 8.5;
        let wheelHeight = -0.5;
        this.wheelJoint(this.meshes.body, this.meshes.wheelL1, -6, wheelHeight, wheelWidth);
        this.wheelJoint(this.meshes.body, this.meshes.wheelL2, 0.5, wheelHeight, wheelWidth);
        this.wheelJoint(this.meshes.body, this.meshes.wheelL3, 7, wheelHeight, wheelWidth);
        this.wheelJoint(this.meshes.body, this.meshes.wheelR1, -6, wheelHeight, -wheelWidth);
        this.wheelJoint(this.meshes.body, this.meshes.wheelR2, 0.5, wheelHeight, -wheelWidth);
        this.wheelJoint(this.meshes.body, this.meshes.wheelR3, 7, wheelHeight, -wheelWidth);
        this.physicsEnabled = true;
    }

    attachBodyParts() {
        //Attaching mod mesh to babylon mesh
        var mesh = this.scene.getTransformNodeByName("TrainBody");
        mesh.parent = this.meshes.body;
        //Positioning the MOD mesh relative to the babylon mesh
        mesh.position.y -= 8.2;
        mesh.position.z -= 19.5;
        mesh.position.x -= 5;
    }

    attachWheels() {
        let L1 = this.meshes.wheelL1;
        let L2 = this.meshes.wheelL2;
        let L3 = this.meshes.wheelL3;
        let R1 = this.meshes.wheelR1;
        let R2 = this.meshes.wheelR2;
        let R3 = this.meshes.wheelR3;
        let body = this.meshes.body;
        let wheelWidth = 8.5;
        let wheelHeight = -0.5;

        //Rotating all the wheels so the face is parralel with the ground
        L1.rotate(BABYLON.Axis.X, Math.PI / 2, BABYLON.Space.LOCAL);
        L2.rotate(BABYLON.Axis.X, Math.PI / 2, BABYLON.Space.LOCAL);
        L3.rotate(BABYLON.Axis.X, Math.PI / 2, BABYLON.Space.LOCAL);
        R1.rotate(BABYLON.Axis.X, Math.PI / 2, BABYLON.Space.LOCAL);
        R2.rotate(BABYLON.Axis.X, Math.PI / 2, BABYLON.Space.LOCAL);
        R3.rotate(BABYLON.Axis.X, Math.PI / 2, BABYLON.Space.LOCAL);

        //Adding cylinder parent for mod wheel mesh, positioning relatively
        this.wheelMeshParent(this.scene.getTransformNodeByName("TL1"), L1, 4, 11.5, -7.1);
        this.wheelMeshParent(this.scene.getTransformNodeByName("TL2"), L2, -2.3, 11.3, -7.1);
        this.wheelMeshParent(this.scene.getTransformNodeByName("TL3"), L3, -9, 11.5, -7.1);
        this.wheelMeshParent(this.scene.getTransformNodeByName("TR1"), R1, 4, 27.5, -7.1);
        this.wheelMeshParent(this.scene.getTransformNodeByName("TR2"), R2, -2.3, 27.5, -7.1);
        this.wheelMeshParent(this.scene.getTransformNodeByName("TR3"), R3, -9, 27.5, -7.1);

        //Positioning the babylon/parent meshes relative to the vehicle
        this.wheelPositioning(body, L1, -6, wheelHeight, wheelWidth);
        this.wheelPositioning(body, L2, 0.5, wheelHeight, wheelWidth);
        this.wheelPositioning(body, L3, 7, wheelHeight, wheelWidth);
        this.wheelPositioning(body, R1, -6, wheelHeight, -wheelWidth);
        this.wheelPositioning(body, R2, 0.5, wheelHeight, -wheelWidth);
        this.wheelPositioning(body, R3, 7, wheelHeight, -wheelWidth);
    }

    forwards(multi) {
        this.motors.map((x) => x.setMotor(+this.prototype.speed * multi, this.prototype.torque * multi));
    }

    forwardsLeft(multi){
        var torqueMultiForwards = 0.6;
        var torqueMultiBackwards = torqueMultiForwards;
        this.motors[0].setMotor(this.prototype.speed/4 * multi, this.prototype.torque * torqueMultiBackwards * multi);
        this.motors[1].setMotor(this.prototype.speed/4 * multi, this.prototype.torque * torqueMultiBackwards * multi);
        this.motors[2].setMotor(this.prototype.speed/4 * multi, this.prototype.torque * torqueMultiBackwards * multi);
        this.motors[3].setMotor(this.prototype.speed * multi, this.prototype.torque * torqueMultiForwards * multi);
        this.motors[4].setMotor(this.prototype.speed * multi, this.prototype.torque * torqueMultiForwards * multi);
        this.motors[5].setMotor(this.prototype.speed * multi, this.prototype.torque * torqueMultiForwards * multi);
    }

    forwardsRight(multi){
        var torqueMultiForwards = 0.6;
        var torqueMultiBackwards = torqueMultiForwards;
        this.motors[0].setMotor(this.prototype.speed * multi, this.prototype.torque * torqueMultiBackwards * multi);
        this.motors[1].setMotor(this.prototype.speed * multi, this.prototype.torque * torqueMultiBackwards * multi);
        this.motors[2].setMotor(this.prototype.speed * multi, this.prototype.torque * torqueMultiBackwards * multi);
        this.motors[3].setMotor(this.prototype.speed/4 * multi, this.prototype.torque * torqueMultiForwards * multi);
        this.motors[4].setMotor(this.prototype.speed/4 * multi, this.prototype.torque * torqueMultiForwards * multi);
        this.motors[5].setMotor(this.prototype.speed/4 * multi, this.prototype.torque * torqueMultiForwards * multi);
    }

    backwardsLeft(multi){
        var torqueMultiForwards = 0.6;
        var torqueMultiBackwards = torqueMultiForwards/3;
        this.motors[0].setMotor(-this.prototype.speed/3 * multi, this.prototype.torque * torqueMultiBackwards * multi);
        this.motors[1].setMotor(-this.prototype.speed/3 * multi, this.prototype.torque * torqueMultiBackwards * multi);
        this.motors[2].setMotor(-this.prototype.speed/3 * multi, this.prototype.torque * torqueMultiBackwards * multi);
        this.motors[3].setMotor(-this.prototype.speed * multi, this.prototype.torque * torqueMultiForwards * multi);
        this.motors[4].setMotor(-this.prototype.speed * multi, this.prototype.torque * torqueMultiForwards * multi);
        this.motors[5].setMotor(-this.prototype.speed * multi, this.prototype.torque * torqueMultiForwards * multi);
    }

    backwardsRight(multi){
        var torqueMultiForwards = 0.6;
        var torqueMultiBackwards = torqueMultiForwards/3;
        this.motors[0].setMotor(-this.prototype.speed * multi, this.prototype.torque * torqueMultiBackwards * multi);
        this.motors[1].setMotor(-this.prototype.speed * multi, this.prototype.torque * torqueMultiBackwards * multi);
        this.motors[2].setMotor(-this.prototype.speed * multi, this.prototype.torque * torqueMultiBackwards * multi);
        this.motors[3].setMotor(-this.prototype.speed/3 * multi, this.prototype.torque * torqueMultiForwards * multi);
        this.motors[4].setMotor(-this.prototype.speed/3 * multi, this.prototype.torque * torqueMultiForwards * multi);
        this.motors[5].setMotor(-this.prototype.speed/3 * multi, this.prototype.torque * torqueMultiForwards * multi);
    }

    backwards(multi) {
        this.motors.map((x) => x.setMotor(-this.prototype.speed * multi, this.prototype.torque * multi));
    }

    left(multi) {
        this.motors[0].setMotor(-this.prototype.speed * multi, this.prototype.torque * multi);
        this.motors[1].setMotor(-this.prototype.speed * multi, this.prototype.torque * multi);
        this.motors[2].setMotor(-this.prototype.speed * multi, this.prototype.torque * multi);
        this.motors[3].setMotor(this.prototype.speed * multi, this.prototype.torque * multi);
        this.motors[4].setMotor(this.prototype.speed * multi, this.prototype.torque * multi);
        this.motors[5].setMotor(this.prototype.speed * multi, this.prototype.torque * multi);
    }

    right(multi) {
        this.motors[0].setMotor(this.prototype.speed * multi, this.prototype.torque * multi);
        this.motors[1].setMotor(this.prototype.speed * multi, this.prototype.torque * multi);
        this.motors[2].setMotor(this.prototype.speed * multi, this.prototype.torque * multi);
        this.motors[3].setMotor(-this.prototype.speed * multi, this.prototype.torque * multi);
        this.motors[4].setMotor(-this.prototype.speed * multi, this.prototype.torque * multi);
        this.motors[5].setMotor(-this.prototype.speed * multi, this.prototype.torque * multi);
    }

    releaseDrive() {
        this.motors.map((x) => x.setMotor(0, this.prototype.torque / 8));
    }

    releaseSteering() {
        this.motors.map((x) => x.setMotor(0, this.prototype.torque / 8));
    }

}

export class MT {
    constructor(scene, x, z, engineName, powerupName, visible, rotation) {
        this.prototype = new Prototype(30, 10, 5.5, 1.5, 0.01, 80, 10, 1, powerupName, engineName, x, z, rotation);
        this.meshes = {
            body: BABYLON.MeshBuilder.CreateBox(null, { width: 24, depth: 20, height: 6 }, scene),
            wheel1: BABYLON.MeshBuilder.CreateCylinder(null, { diameter: this.prototype.wheelDiam, height: this.prototype.wheelHeight }, scene),
            wheel2: BABYLON.MeshBuilder.CreateCylinder(null, { diameter: this.prototype.wheelDiam, height: this.prototype.wheelHeight }, scene),
        };
        this.protoConst = vehicleBuilder;
        this.protoConst(visible, rotation, scene);
    }

    startPhysics() {
        if(this.physicsEnabled)
        return;
        this.wheels.forEach((x) => {
            this.meshes[x].setParent(null);
            this.meshes[x].physicsImpostor = 
        new BABYLON.PhysicsImpostor(this.meshes[x], BABYLON.PhysicsImpostor.CylinderImpostor, { mass: 1, friction: this.prototype.wheelFriction, restitution: this.prototype.wheelRestitution }, this.scene);
        });
        this.meshes.body.physicsImpostor =
        new BABYLON.PhysicsImpostor(this.meshes.body, BABYLON.PhysicsImpostor.BoxImpostor, { mass: this.prototype.bodyMass, friction:0,  restitution: 0}, this.scene);
        this.wheelJoint(this.meshes.body, this.meshes.wheel1, -6.5, -1.5, 10);
        this.wheelJoint(this.meshes.body, this.meshes.wheel2, -6.5, -1.5, -10);
        this.physicsEnabled = true;
    }

    attachBodyParts() {
        //attaching MOD mesh to babylon mesh, creating a physics imposter for babylon mesh
        var mesh = this.scene.getTransformNodeByName("MTBody");
        mesh.parent = this.meshes.body;
        //Positioning the MOD mesh relative to the babylon mesh
        mesh.position.y = -12;
        mesh.position.z = -13;
        mesh.position.x = -3;
    }

    attachWheels() {
        this.meshes.wheel1.rotate(BABYLON.Axis.X, Math.PI / 2, BABYLON.Space.LOCAL);
        this.meshes.wheel2.rotate(BABYLON.Axis.X, Math.PI / 2, BABYLON.Space.LOCAL);
        this.wheelMeshParent(this.scene.getMeshByName("MTLeft"), this.meshes.wheel1, 3.5, 3, -9.5);
        this.wheelMeshParent(this.scene.getMeshByName("MTRight"), this.meshes.wheel2, 3.5, 22.7, -9.5);
        this.wheelPositioning(this.meshes.body, this.meshes.wheel1, -6.5, -1.5, 10);
        this.wheelPositioning(this.meshes.body, this.meshes.wheel2, -6.5, -1.5, -10);
    }

    forwards(multi) {

        this.motors.map((x) => x.setMotor(+this.prototype.speed * multi, this.prototype.torque * multi));
    }

    forwardsLeft(multi)
    {
        this.motors[0].setMotor(this.prototype.speed * multi/4, this.prototype.torque * multi * 0.8);
        this.motors[1].setMotor(this.prototype.speed * multi, this.prototype.torque * multi);
    }
    forwardsRight(multi)
    {
        this.motors[0].setMotor(this.prototype.speed * multi, this.prototype.torque * multi * 0.8);
        this.motors[1].setMotor(this.prototype.speed * multi/4, this.prototype.torque * multi * 0.8);
    }

    backwards(multi) {
        this.motors.map((x) => x.setMotor(-this.prototype.speed * multi, this.prototype.torque * multi));
    }

    backwardsLeft(multi){

    }

    backwardsRight(multi)
    {

    }

    right(multi) {
        this.motors[0].setMotor(this.prototype.speed/2 * multi, this.prototype.torque * multi);
        this.motors[1].setMotor(-this.prototype.speed/2 * multi, this.prototype.torque * multi);
    }
    left(multi) {
        this.motors[0].setMotor(-this.prototype.speed/2 * multi, this.prototype.torque * multi);
        this.motors[1].setMotor(this.prototype.speed/2 * multi, this.prototype.torque * multi);
    }
    releaseDrive() {
        this.motors[0].setMotor(0, this.prototype.torque / 3);
        this.motors[1].setMotor(0, this.prototype.torque / 3);
    }
    releaseSteering() {
        this.motors[0].setMotor(0, this.prototype.torque / 3);
        this.motors[1].setMotor(0, this.prototype.torque / 3);
    }
}