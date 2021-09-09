import * as BABYLON from 'babylonjs';
//import { FollowCamera } from 'babylonjs/Cameras/followCamera';
let sbDuration = 30000;//30 second power up duration
let sbMultiplier = 1.3;
//once the track is implemented we will know what this is



function engine(e) {
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

export class Omni {
    constructor(scene, x, z, engineName, powerupName, visible) {
        console.log("From the omni constructor");
        this.scene = scene;
        this.attr = {
            speed: 20, torque: 200 * engine(engineName),
            wheelDiam: 2.5, wheelHeight: 1, wheelRestitution: 1,
            bodyMass: 10, wheelFriction: 50, sbActivationTime: 0, powerupName: powerupName, offroad: false
        };
        this.meshes = {
            body: BABYLON.MeshBuilder.CreateCylinder(null, { diameter: 23, height: 10 }, scene),
        }
        this.meshes.body.position.x = x;
        this.meshes.body.position.z = z;
        this.meshes.body.rotation = new BABYLON.Vector3(0,1.5,0);
        this.attachBodyParts();
        if (!visible)
            Object.entries(this.meshes).map((x) => x[1].isVisible = false);
    }

    attachBodyParts() {
        let body = this.meshes.body;
        var mesh = this.scene.getTransformNodeByName("Omni");
        // console.log("OMNI: " + this.scene.getMeshByName("Omni"));
        body.position.y = -15;
        mesh.parent = body;
        mesh.position.z = 0;
        mesh.position.y = -5;
        // var triggerMesh = new BABYLON.MeshBuilder.CreateCylinder("OmniBody")
        body.physicsImpostor = new BABYLON.PhysicsImpostor(body, BABYLON.PhysicsImpostor.CylinderImpostor, { mass: this.attr.bodyMass, friction: 0.01, restitution: 0 }, this.scene);
        //new FollowCamera(name: string, position: Vector3, scene: Scene, lockedTarget?: Nullable<AbstractMesh>)
    }

    userInput(keys) {
        var impulseVector = new BABYLON.Vector3(0, 0, 0);
        // var multi =
        // ((new Date().getTime() - this.attr.sbActivationTime) < sbDuration) ? sbMultiplier : 1;
        if (this.attr.offroad && this.attr.powerupName != "4 Wheel Drive" && Math.floor(Math.random() * 10) == 9) {
            var x = Math.random() * 2 - 1 > 0 ? Math.random()*-1 : Math.random();
            var y = Math.random() * 2 - 1 > 0 ? Math.random()*-1 : Math.random();
            var z = Math.random() * 2 - 1 > 0 ? Math.random()*-1 : Math.random();
            impulseVector = new BABYLON.Vector3(x, y, z);
        }
        else if (keys['s'])//north?
        {
            if (keys['a'])//east?
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
            if (keys['a'])//east?
            {
                impulseVector = new BABYLON.Vector3(1, 0, -1);
            } else if (keys["d"])//west?
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
        this.meshes.body.physicsImpostor.applyImpulse(impulseVector.scale(this.attr.bodyMass * sbMultiplier), this.meshes.body.getAbsolutePosition());
    }



}

export class Tank {
    constructor(scene, x, z, engineName, powerupName, visible) {
        this.scene = scene;
        this.attr = {
            speed: 50, torque: 50 * engine(engineName),
            wheelDiam: 2.5, wheelHeight: 1, wheelRestitution: 0.05,
            bodyMass: 20, wheelFriction: 100, sbActivationTime: 0, powerupName: powerupName, offroad: false
        };
        this.meshes = {
            body: BABYLON.MeshBuilder.CreateBox(null, { width: 22, depth: 20, height: 6 }, scene),
            wheelL1: BABYLON.MeshBuilder.CreateCylinder(null, { diameter: this.attr.wheelDiam, height: this.attr.wheelHeight }, scene),
            wheelL2: BABYLON.MeshBuilder.CreateCylinder(null, { diameter: this.attr.wheelDiam, height: this.attr.wheelHeight }, scene),
            wheelL3: BABYLON.MeshBuilder.CreateCylinder(null, { diameter: this.attr.wheelDiam, height: this.attr.wheelHeight }, scene),
            wheelL4: BABYLON.MeshBuilder.CreateCylinder(null, { diameter: this.attr.wheelDiam, height: this.attr.wheelHeight }, scene),
            wheelR1: BABYLON.MeshBuilder.CreateCylinder(null, { diameter: this.attr.wheelDiam, height: this.attr.wheelHeight }, scene),
            wheelR2: BABYLON.MeshBuilder.CreateCylinder(null, { diameter: this.attr.wheelDiam, height: this.attr.wheelHeight }, scene),
            wheelR3: BABYLON.MeshBuilder.CreateCylinder(null, { diameter: this.attr.wheelDiam, height: this.attr.wheelHeight }, scene),
            wheelR4: BABYLON.MeshBuilder.CreateCylinder(null, { diameter: this.attr.wheelDiam, height: this.attr.wheelHeight }, scene),
        };
        this.motors = [];
        //Offset
        this.meshes.body.position.x = x;
        this.meshes.body.position.z = z;
        this.meshes.body.rotation = new BABYLON.Vector3(0,1.5,0);
        //Body positioning and physics
        this.attachBodyParts();
        //Wheel positioning and physics
        this.attachWheels();
        //Make all physics meshes invisible
        if (!visible)
            Object.entries(this.meshes).map((x) => x[1].isVisible = false);
    }
    attachBodyParts() {
        let body = this.meshes.body;
        var mesh = this.scene.getTransformNodeByName("TankBody");
        body.position.y = -15;
        mesh.parent = body;
        //Positioning the MOD mesh relative to the babylon mesh
        mesh.position.y -= 4;
        mesh.position.z -= 23;
        mesh.position.x -= 2;
        //Adding physics imposter to body mesh (the parent of the mod mesh)
        this.meshes.body.physicsImpostor =
            new BABYLON.PhysicsImpostor(body, BABYLON.PhysicsImpostor.BoxImpostor, { mass: this.attr.bodyMass , restitution: 0, friction: 0}, this.scene);
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

        //physics/hinge part
        this.wheelJoint(body, L1, -5.3, wheelHeight, wheelWidth);
        this.wheelJoint(body, L2, -1.6, wheelHeight, wheelWidth);
        this.wheelJoint(body, L3, 2, wheelHeight, wheelWidth);
        this.wheelJoint(body, L4, 5.5, wheelHeight, wheelWidth);
        this.wheelJoint(body, R1, -5.3, wheelHeight, -wheelWidth);
        this.wheelJoint(body, R2, -1.6, wheelHeight, -wheelWidth);
        this.wheelJoint(body, R3, 2, wheelHeight, -wheelWidth);
        this.wheelJoint(body, R4, 5.5, wheelHeight, -wheelWidth);


    }

    wheelPositioning(body, wheel, x, y, z) {
        wheel.parent = body;
        wheel.position.y = y;
        wheel.position.z = z;//width
        wheel.position.x = x;
    }

    wheelMeshParent(mesh, parentMesh, x, y, z) {
        parentMesh.setParent(null);
        mesh.parent = parentMesh;
        mesh.rotate(BABYLON.Axis.X, Math.PI / 2, BABYLON.Space.LOCAL);
        mesh.position.y = y;//width
        mesh.position.z = z;// y negative is up
        mesh.position.x = x;//forward/backward
    }
    wheelJoint(body, wheel, x, y, z) {
        wheel.setParent(null);
        wheel.physicsImpostor = new BABYLON.PhysicsImpostor(wheel, BABYLON.PhysicsImpostor.CylinderImpostor, { mass: 1, friction: this.attr.wheelFriction, restitution: this.attr.wheelRestitution }, this.scene);
        var newJoint = new BABYLON.MotorEnabledJoint(BABYLON.PhysicsJoint.HingeJoint, {
            mainPivot: new BABYLON.Vector3(0, 0, 0), //Having these as zero means the pivot is in the wheel (good thing)
            connectedPivot: new BABYLON.Vector3(x, y, z), //(length,y,)
            mainAxis: new BABYLON.Vector3(0, -1, 0), //axis of rotation for body 1
            connectedAxis: new BABYLON.Vector3(0, 0, 1), //axis of rotation for body 2
        });
        wheel.physicsImpostor.addJoint(body.physicsImpostor, newJoint);
        this.motors.push(newJoint);
    }

    userInput(keys) {
        var multi =
        ((new Date().getTime() - this.attr.sbActivationTime) < sbDuration) ? sbMultiplier : 1;
        if (this.attr.offroad && this.attr.powerupName != "4 Wheel Drive" && Math.random() > 0.85) {
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
        else if (keys["w"]) {
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
        } else if (keys["a"]) {
            this.left(multi);
        } else {
            this.releaseDrive();
        }
    }

    forwards(multi) {
        this.motors.map((x) => x.setMotor(+this.attr.speed * multi, this.attr.torque * multi));
    }
    backwards(multi) {
        this.motors.map((x) => x.setMotor(-this.attr.speed * multi, this.attr.torque * multi));
    }
    forwardsLeft(multi) {
        var torqueMultiForwards = 0.6;
        var torqueMultiBackwards = torqueMultiForwards/3;
        this.motors[0].setMotor(this.attr.speed/3 * multi, this.attr.torque * torqueMultiBackwards * multi);
        this.motors[1].setMotor(this.attr.speed/3 * multi, this.attr.torque * torqueMultiBackwards * multi);
        this.motors[2].setMotor(this.attr.speed/3 * multi, this.attr.torque * torqueMultiBackwards * multi);
        this.motors[3].setMotor(this.attr.speed/3 * multi, this.attr.torque * torqueMultiBackwards * multi);
        this.motors[4].setMotor(this.attr.speed * multi, this.attr.torque * torqueMultiForwards * multi);
        this.motors[5].setMotor(this.attr.speed * multi, this.attr.torque * torqueMultiForwards * multi);
        this.motors[6].setMotor(this.attr.speed * multi, this.attr.torque * torqueMultiForwards * multi);
        this.motors[7].setMotor(this.attr.speed * multi, this.attr.torque * torqueMultiForwards * multi);
    }
    backwardsLeft(multi) {
        var torqueMultiForwards = 0.6;
        var torqueMultiBackwards = torqueMultiForwards/3;
        this.motors[0].setMotor(-this.attr.speed/3 * multi, this.attr.torque * torqueMultiBackwards * multi);
        this.motors[1].setMotor(-this.attr.speed/3 * multi, this.attr.torque * torqueMultiBackwards * multi);
        this.motors[2].setMotor(-this.attr.speed/3 * multi, this.attr.torque * torqueMultiBackwards * multi);
        this.motors[3].setMotor(-this.attr.speed/3 * multi, this.attr.torque * torqueMultiBackwards * multi);
        this.motors[4].setMotor(-this.attr.speed * multi, this.attr.torque * torqueMultiForwards * multi);
        this.motors[5].setMotor(-this.attr.speed * multi, this.attr.torque * torqueMultiForwards * multi);
        this.motors[6].setMotor(-this.attr.speed * multi, this.attr.torque * torqueMultiForwards * multi);
        this.motors[7].setMotor(-this.attr.speed * multi, this.attr.torque * torqueMultiForwards * multi);
    }
    backwardsRight(multi) {
        var torqueMultiForwards = 0.6;
        var torqueMultiBackwards = torqueMultiForwards/3;
        this.motors[4].setMotor(-this.attr.speed/3 * multi, this.attr.torque * torqueMultiBackwards * multi);
        this.motors[5].setMotor(-this.attr.speed/3 * multi, this.attr.torque * torqueMultiBackwards * multi);
        this.motors[6].setMotor(-this.attr.speed/3 * multi, this.attr.torque * torqueMultiBackwards * multi);
        this.motors[7].setMotor(-this.attr.speed/3 * multi, this.attr.torque * torqueMultiBackwards * multi);
        this.motors[0].setMotor(-this.attr.speed * multi, this.attr.torque * torqueMultiForwards * multi);
        this.motors[1].setMotor(-this.attr.speed * multi, this.attr.torque * torqueMultiForwards * multi);
        this.motors[2].setMotor(-this.attr.speed * multi, this.attr.torque * torqueMultiForwards * multi);
        this.motors[3].setMotor(-this.attr.speed * multi, this.attr.torque * torqueMultiForwards * multi);
    }
    forwardsRight(multi) {
        var torqueMultiForwards = 0.6;
        var torqueMultiBackwards = torqueMultiForwards/3;
        this.motors[0].setMotor(this.attr.speed * multi, this.attr.torque * torqueMultiForwards * multi);
        this.motors[1].setMotor(this.attr.speed * multi, this.attr.torque * torqueMultiForwards * multi);
        this.motors[2].setMotor(this.attr.speed * multi, this.attr.torque * torqueMultiForwards * multi);
        this.motors[3].setMotor(this.attr.speed * multi, this.attr.torque * torqueMultiForwards * multi);
        this.motors[4].setMotor(this.attr.speed/3 * multi, this.attr.torque * torqueMultiBackwards * multi);
        this.motors[5].setMotor(this.attr.speed/3 * multi, this.attr.torque * torqueMultiBackwards * multi);
        this.motors[6].setMotor(this.attr.speed/3 * multi, this.attr.torque * torqueMultiBackwards * multi);
        this.motors[7].setMotor(this.attr.speed/3 * multi, this.attr.torque * torqueMultiBackwards * multi);
    }
    right(multi) {
        var torqueMulti = 0.1;
        this.motors[0].setMotor(this.attr.speed * multi, this.attr.torque * torqueMulti);
        this.motors[1].setMotor(this.attr.speed * multi, this.attr.torque * torqueMulti);
        this.motors[2].setMotor(this.attr.speed * multi, this.attr.torque * torqueMulti);
        this.motors[3].setMotor(this.attr.speed * multi, this.attr.torque * torqueMulti);
        this.motors[4].setMotor(-this.attr.speed * multi, this.attr.torque * torqueMulti);
        this.motors[5].setMotor(-this.attr.speed * multi, this.attr.torque * torqueMulti);
        this.motors[6].setMotor(-this.attr.speed * multi, this.attr.torque * torqueMulti);
        this.motors[7].setMotor(-this.attr.speed * multi, this.attr.torque * torqueMulti);
    }
    left(multi) {
        var torqueMulti = 0.1;
        this.motors[0].setMotor(-this.attr.speed * multi, this.attr.torque * torqueMulti);
        this.motors[1].setMotor(-this.attr.speed * multi, this.attr.torque * torqueMulti);
        this.motors[2].setMotor(-this.attr.speed * multi, this.attr.torque * torqueMulti);
        this.motors[3].setMotor(-this.attr.speed * multi, this.attr.torque * torqueMulti);
        this.motors[4].setMotor(this.attr.speed * multi, this.attr.torque * torqueMulti);
        this.motors[5].setMotor(this.attr.speed * multi, this.attr.torque * torqueMulti);
        this.motors[6].setMotor(this.attr.speed * multi, this.attr.torque * torqueMulti);
        this.motors[7].setMotor(this.attr.speed * multi, this.attr.torque * torqueMulti);
    }
    releaseDrive() {
        this.motors.map(x => x.setMotor(0, this.attr.torque / 8));
    }
    releaseSteering() {
        this.motors.map(x => x.setMotor(0, this.attr.torque / 8));
    }

}

export class Train {
    constructor(scene, x, z, engineName, visible) {
        this.scene = scene;
        this.attr = {
            speed: 30, torque: 10 * engine(engineName),
            wheelDiam: 5.5, wheelHeight: 1, wheelRestitution: 0.05,
            bodyMass: 30, wheelFriction: 100, sbActivationTime: 0, wheelMass: 1,
            offroad: false,
        };
        this.meshes = {
            body: BABYLON.MeshBuilder.CreateBox(null, { width: 25, depth: 15, height: 6 }, scene),
            front: BABYLON.MeshBuilder.CreateBox(null, { width: 8, depth: 15, height: 6 }, scene),
            wheelL1: BABYLON.MeshBuilder.CreateCylinder(null, { diameter: this.attr.wheelDiam, height: this.attr.wheelHeight }, scene),
            wheelL2: BABYLON.MeshBuilder.CreateCylinder(null, { diameter: this.attr.wheelDiam, height: this.attr.wheelHeight }, scene),
            wheelL3: BABYLON.MeshBuilder.CreateCylinder(null, { diameter: this.attr.wheelDiam, height: this.attr.wheelHeight }, scene),
            wheelR1: BABYLON.MeshBuilder.CreateCylinder(null, { diameter: this.attr.wheelDiam, height: this.attr.wheelHeight }, scene),
            wheelR2: BABYLON.MeshBuilder.CreateCylinder(null, { diameter: this.attr.wheelDiam, height: this.attr.wheelHeight }, scene),
            wheelR3: BABYLON.MeshBuilder.CreateCylinder(null, { diameter: this.attr.wheelDiam, height: this.attr.wheelHeight }, scene),
        };
        this.motors = [];
        //Offset
        this.meshes.body.position.x = x;
        this.meshes.body.position.z = z;
        this.meshes.body.rotation = new BABYLON.Vector3(0,1.5,0);
        //Body positioning and physics
        this.attachBodyParts();
        //Wheel positioning and physics
        this.attachWheels();
        //Make all physics meshes invisible
        if (!visible)
            Object.entries(this.meshes).map((x) => x[1].isVisible = false);

    }

    attachBodyParts() {
        let body = this.meshes.body;
        //pull body out of the ground
        body.position.y = -15;

        //Attaching mod mesh to babylon mesh
        var mesh = this.scene.getTransformNodeByName("TrainBody");
        mesh.parent = body;
        //Positioning the MOD mesh relative to the babylon mesh
        mesh.position.y -= 8.2;
        mesh.position.z -= 19.5;
        mesh.position.x -= 5;
        //Adding physics imposter to body mesh (the parent of the mod mesh)
        this.meshes.body.physicsImpostor =
            new BABYLON.PhysicsImpostor(body, BABYLON.PhysicsImpostor.BoxImpostor, { mass: this.attr.bodyMass, friction: 0 }, this.scene);
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

        //adding physics to wheel and attaching it to the body
        this.wheelJoint(body, L1, -6, wheelHeight, wheelWidth);
        this.wheelJoint(body, L2, 0.5, wheelHeight, wheelWidth);
        this.wheelJoint(body, L3, 7, wheelHeight, wheelWidth);
        this.wheelJoint(body, R1, -6, wheelHeight, -wheelWidth);
        this.wheelJoint(body, R2, 0.5, wheelHeight, -wheelWidth);
        this.wheelJoint(body, R3, 7, wheelHeight, -wheelWidth);

    }

    wheelPositioning(body, wheel, x, y, z) {
        wheel.parent = body;
        wheel.position.y = y;
        wheel.position.z = z;//width
        wheel.position.x = x;
    }

    wheelMeshParent(mesh, parentMesh, x, y, z) {
        mesh.parent = parentMesh;
        mesh.rotate(BABYLON.Axis.X, Math.PI / 2, BABYLON.Space.LOCAL);
        mesh.position.y = y;//width
        mesh.position.z = z;// y negative is up
        mesh.position.x = x;//forward/backward
    }

    wheelJoint(body, wheel, x, y, z) {
        wheel.setParent(null);
        wheel.physicsImpostor = new BABYLON.PhysicsImpostor(wheel, BABYLON.PhysicsImpostor.CylinderImpostor, { mass: this.attr.wheelMass, friction: this.attr.wheelFriction, restitution: this.attr.wheelRestitution }, this.scene);
        var newJoint = new BABYLON.MotorEnabledJoint(BABYLON.PhysicsJoint.HingeJoint, {
            mainPivot: new BABYLON.Vector3(0, 0, 0), //Having these as zero means the pivot is in the wheel (good thing)
            connectedPivot: new BABYLON.Vector3(x, y, z), //(length,y,)
            mainAxis: new BABYLON.Vector3(0, -1, 0), //axis of rotation for body 1
            connectedAxis: new BABYLON.Vector3(0, 0, 1), //axis of rotation for body 2
        });
        wheel.physicsImpostor.addJoint(body.physicsImpostor, newJoint);
        this.motors.push(newJoint);
    }

    userInput(keys) {
        var multi =
        ((new Date().getTime() - this.attr.sbActivationTime) < sbDuration) ? sbMultiplier : 1;
        if (this.attr.offroad && this.attr.powerupName != "4 Wheel Drive" && Math.random() > 0.85) {
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
        if (keys["w"]) {
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
        } else if (keys["a"]) {
            this.left(multi);
        } else {
            this.releaseDrive();
        }
    }

    forwards(multi) {
        this.motors.map((x) => x.setMotor(+this.attr.speed * multi, this.attr.torque * multi));
    }

    forwardsLeft(multi){
        var torqueMultiForwards = 0.6;
        var torqueMultiBackwards = torqueMultiForwards;
        this.motors[0].setMotor(this.attr.speed/4 * multi, this.attr.torque * torqueMultiBackwards * multi);
        this.motors[1].setMotor(this.attr.speed/4 * multi, this.attr.torque * torqueMultiBackwards * multi);
        this.motors[2].setMotor(this.attr.speed/4 * multi, this.attr.torque * torqueMultiBackwards * multi);
        this.motors[3].setMotor(this.attr.speed * multi, this.attr.torque * torqueMultiForwards * multi);
        this.motors[4].setMotor(this.attr.speed * multi, this.attr.torque * torqueMultiForwards * multi);
        this.motors[5].setMotor(this.attr.speed * multi, this.attr.torque * torqueMultiForwards * multi);
    }

    forwardsRight(multi){
        var torqueMultiForwards = 0.6;
        var torqueMultiBackwards = torqueMultiForwards;
        this.motors[0].setMotor(this.attr.speed * multi, this.attr.torque * torqueMultiBackwards * multi);
        this.motors[1].setMotor(this.attr.speed * multi, this.attr.torque * torqueMultiBackwards * multi);
        this.motors[2].setMotor(this.attr.speed * multi, this.attr.torque * torqueMultiBackwards * multi);
        this.motors[3].setMotor(this.attr.speed/4 * multi, this.attr.torque * torqueMultiForwards * multi);
        this.motors[4].setMotor(this.attr.speed/4 * multi, this.attr.torque * torqueMultiForwards * multi);
        this.motors[5].setMotor(this.attr.speed/4 * multi, this.attr.torque * torqueMultiForwards * multi);
    }

    backwardsLeft(multi){
        var torqueMultiForwards = 0.6;
        var torqueMultiBackwards = torqueMultiForwards/3;
        this.motors[0].setMotor(-this.attr.speed/3 * multi, this.attr.torque * torqueMultiBackwards * multi);
        this.motors[1].setMotor(-this.attr.speed/3 * multi, this.attr.torque * torqueMultiBackwards * multi);
        this.motors[2].setMotor(-this.attr.speed/3 * multi, this.attr.torque * torqueMultiBackwards * multi);
        this.motors[3].setMotor(-this.attr.speed * multi, this.attr.torque * torqueMultiForwards * multi);
        this.motors[4].setMotor(-this.attr.speed * multi, this.attr.torque * torqueMultiForwards * multi);
        this.motors[5].setMotor(-this.attr.speed * multi, this.attr.torque * torqueMultiForwards * multi);
    }

    backwardsRight(multi){
        var torqueMultiForwards = 0.6;
        var torqueMultiBackwards = torqueMultiForwards/3;
        this.motors[0].setMotor(-this.attr.speed * multi, this.attr.torque * torqueMultiBackwards * multi);
        this.motors[1].setMotor(-this.attr.speed * multi, this.attr.torque * torqueMultiBackwards * multi);
        this.motors[2].setMotor(-this.attr.speed * multi, this.attr.torque * torqueMultiBackwards * multi);
        this.motors[3].setMotor(-this.attr.speed/3 * multi, this.attr.torque * torqueMultiForwards * multi);
        this.motors[4].setMotor(-this.attr.speed/3 * multi, this.attr.torque * torqueMultiForwards * multi);
        this.motors[5].setMotor(-this.attr.speed/3 * multi, this.attr.torque * torqueMultiForwards * multi);
    }

    backwards(multi) {
        this.motors.map((x) => x.setMotor(-this.attr.speed * multi, this.attr.torque * multi));
    }

    left(multi) {
        this.motors[0].setMotor(-this.attr.speed * multi, this.attr.torque * multi);
        this.motors[1].setMotor(-this.attr.speed * multi, this.attr.torque * multi);
        this.motors[2].setMotor(-this.attr.speed * multi, this.attr.torque * multi);
        this.motors[3].setMotor(this.attr.speed * multi, this.attr.torque * multi);
        this.motors[4].setMotor(this.attr.speed * multi, this.attr.torque * multi);
        this.motors[5].setMotor(this.attr.speed * multi, this.attr.torque * multi);
    }

    right(multi) {
        this.motors[0].setMotor(this.attr.speed * multi, this.attr.torque * multi);
        this.motors[1].setMotor(this.attr.speed * multi, this.attr.torque * multi);
        this.motors[2].setMotor(this.attr.speed * multi, this.attr.torque * multi);
        this.motors[3].setMotor(-this.attr.speed * multi, this.attr.torque * multi);
        this.motors[4].setMotor(-this.attr.speed * multi, this.attr.torque * multi);
        this.motors[5].setMotor(-this.attr.speed * multi, this.attr.torque * multi);
    }

    releaseDrive() {
        this.motors.map((x) => x.setMotor(0, this.attr.torque / 8));
    }

    releaseSteering() {
        this.motors.map((x) => x.setMotor(0, this.attr.torque / 8));
    }

}

export class MT {
    constructor(scene, x, z, engineName, visible) {
        this.scene = scene;
        this.attr = {
            speed: 30, torque: 10 * engine(engineName),
            wheelDiam: 5.5, wheelHeight: 1.5, wheelRestitution: 0.01,
            bodyMass: 10, wheelFriction: 80, sbActivationTime: 0,
            offroad: false
        };

        this.meshes = {
            body: BABYLON.MeshBuilder.CreateBox(null, { width: 24, depth: 20, height: 6 }, scene),
            front: BABYLON.MeshBuilder.CreateBox(null, { width: 8, depth: 20, height: 6 }, scene),
            wheel1: BABYLON.MeshBuilder.CreateCylinder(null, { diameter: this.attr.wheelDiam, height: this.attr.wheelHeight }, scene),
            wheel2: BABYLON.MeshBuilder.CreateCylinder(null, { diameter: this.attr.wheelDiam, height: this.attr.wheelHeight }, scene),
            b1: BABYLON.MeshBuilder.CreateBox(null, { size: 2, height: 2.4 }, scene),
            b2: BABYLON.MeshBuilder.CreateBox(null, { size: 2, height: 2.4 }, scene),
        };
        this.motors = [];
        //Offset
        this.meshes.body.position.x = x;
        this.meshes.body.position.z = z;
        //this.meshes.body.rotation = new BABYLON.Vector3(0,1.5,0);

        //Body part
        this.attachBodyParts();
        //Wheel part
        this.attachWheels();
        //make babylon meshes invisible
        if (!visible)
            Object.entries(this.meshes).map((x) => x[1].isVisible = false);
    }
    attachBodyParts() {
        let body = this.meshes.body;
        body.position.y = -15;
        //attaching MOD mesh to babylon mesh, creating a physics imposter for babylon mesh
        var mesh = this.scene.getTransformNodeByName("MTBody");
        mesh.parent = body;
        //Positioning the MOD mesh relative to the babylon mesh
        mesh.position.y = -12;
        mesh.position.z = -13;
        mesh.position.x = -3;
        //Adding physics imposter to babylon mesh (the parent of the mod mesh)
        this.meshes.body.physicsImpostor =
            new BABYLON.PhysicsImpostor(body, BABYLON.PhysicsImpostor.BoxImpostor, { mass: this.attr.bodyMass, friction:0,  restitution: 0}, this.scene);

    }

    attachWheels() {
        let w1 = this.meshes.wheel1;
        let w2 = this.meshes.wheel2;
        let body = this.meshes.body;
        w1.rotate(BABYLON.Axis.X, Math.PI / 2, BABYLON.Space.LOCAL);
        w2.rotate(BABYLON.Axis.X, Math.PI / 2, BABYLON.Space.LOCAL);
        this.wheelMeshParent(this.scene.getMeshByName("MTLeft"), w1, 3.5, 3, -9.5);
        this.wheelMeshParent(this.scene.getMeshByName("MTRight"), w2, 3.5, 22.7, -9.5);
        this.wheelPositioning(body, w1, -3.5, -2.5, 10);
        this.wheelPositioning(body, w2, -3.5, -2.5, -10);
        this.wheelJoint(body, w1, -6.5, -1.5, 10);
        this.wheelJoint(body, w2, -6.5, -1.5, -10);
    }

    wheelPositioning(body, wheel, x, y, z) {
        wheel.parent = body;
        wheel.position.y = y;
        wheel.position.z = z;//width
        wheel.position.x = x;
    }

    wheelMeshParent(mesh, parentMesh, x, y, z) {
        mesh.parent = parentMesh;
        mesh.rotate(BABYLON.Axis.X, Math.PI / 2, BABYLON.Space.LOCAL);
        mesh.position.y = y;//width
        mesh.position.z = z;// y negative is up
        mesh.position.x = x;//forward/backward
    }

    wheelJoint(body, wheel, x, y, z) {
        wheel.setParent(null);
        wheel.physicsImpostor = new BABYLON.PhysicsImpostor(wheel, BABYLON.PhysicsImpostor.CylinderImpostor, { mass: 1, friction: this.attr.wheelFriction, restitution: this.attr.wheelRestitution }, this.scene);
        var newJoint = new BABYLON.MotorEnabledJoint(BABYLON.PhysicsJoint.HingeJoint, {
            mainPivot: new BABYLON.Vector3(0, 0, 0), //Having these as zero means the pivot is in the wheel (good thing)
            connectedPivot: new BABYLON.Vector3(x, y, z), //(length,y,)
            mainAxis: new BABYLON.Vector3(0, -1, 0), //axis of rotation for body 1
            connectedAxis: new BABYLON.Vector3(0, 0, 1), //axis of rotation for body 2
        });
        wheel.physicsImpostor.addJoint(body.physicsImpostor, newJoint);
        this.motors.push(newJoint);
    }

    userInput(keys) {
        var multi =
        ((new Date().getTime() - this.attr.sbActivationTime) < sbDuration) ? sbMultiplier : 1;
        if (this.attr.offroad && this.attr.powerupName != "4 Wheel Drive" && Math.random() > 0.85) {
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
        if (keys["w"]) {
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
        } else if (keys["a"]) {
            this.left(multi);
        } else {
            this.releaseDrive();
        }
    }

    forwards(multi) {

        this.motors.map((x) => x.setMotor(+this.attr.speed * multi, this.attr.torque * multi));
    }

    forwardsLeft(multi)
    {
        this.motors[0].setMotor(this.attr.speed * multi/4, this.attr.torque * multi * 0.8);
        this.motors[1].setMotor(this.attr.speed * multi, this.attr.torque * multi);
    }
    forwardsRight(multi)
    {
        this.motors[0].setMotor(this.attr.speed * multi, this.attr.torque * multi * 0.8);
        this.motors[1].setMotor(this.attr.speed * multi/4, this.attr.torque * multi * 0.8);
    }

    backwards(multi) {
        this.motors.map((x) => x.setMotor(-this.attr.speed * multi, this.attr.torque * multi));
    }

    backwardsLeft(multi){

    }

    backwardsRight(multi)
    {

    }

    right(multi) {
        this.motors[0].setMotor(this.attr.speed/2 * multi, this.attr.torque * multi);
        this.motors[1].setMotor(-this.attr.speed/2 * multi, this.attr.torque * multi);
    }
    left(multi) {
        this.motors[0].setMotor(-this.attr.speed/2 * multi, this.attr.torque * multi);
        this.motors[1].setMotor(this.attr.speed/2 * multi, this.attr.torque * multi);
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