import * as BABYLON from 'babylonjs';
let sbDuration = 30000;//30 second power up duration
let sbMultiplier = 2;
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
            body: BABYLON.MeshBuilder.CreateCylinder(null, { diameter: 23, height: 10}, scene),
        }
        this.meshes.body.position.x = x;
        this.meshes.body.position.z = z;
        this.attachBodyParts();
        if (!visible)
        Object.entries(this.meshes).map((x) => x[1].isVisible = false);
    }

    attachBodyParts()
    {
        let body = this.meshes.body;
        var mesh = this.scene.getMeshByName("Omni");
        console.log("OMNI: " + this.scene.getMeshByName("Omni"));
        body.position.y = 25;
        mesh.parent = body;
        mesh.position.z = 0;
        mesh.position.y = -5;
        body.physicsImpostor = new BABYLON.PhysicsImpostor(body, BABYLON.PhysicsImpostor.CylinderImpostor, { mass: this.attr.bodyMass, friction: 0.01, restitution: 0 }, this.scene);
    }

    userInput(keys)
    {
        //console.log("ok");
        var impulseVector = new BABYLON.Vector3(0,0,0);
        if(keys['s'])//north?
        {
            if(keys['a'])//east?
            {
                impulseVector = new BABYLON.Vector3(1,0,1);
            } else if (keys["d"])//west?
            {
                impulseVector = new BABYLON.Vector3(-1,0,1);
            }
            else{
                impulseVector = new BABYLON.Vector3(0,0,1);
            }
        } else if (keys['w'])
        {
            if(keys['a'])//east?
            {
                impulseVector = new BABYLON.Vector3(1,0,-1);
            } else if (keys["d"])//west?
            {
                impulseVector = new BABYLON.Vector3(-1,0,-1);
            }
            else{
                impulseVector = new BABYLON.Vector3(0,0,-1);
            }            
        } else if (keys['d'])
        {
            impulseVector = new BABYLON.Vector3(-1,0,0);
        } else if (keys['a'])
        {
            impulseVector = new BABYLON.Vector3(1,0,0);
        }
        this.meshes.body.physicsImpostor.applyImpulse(impulseVector.scale(this.attr.bodyMass), this.meshes.body.getAbsolutePosition());
    }



}

export class Tank {
    constructor(scene, x, z, engineName, powerupName, visible) {
        this.scene = scene;
        this.attr = {
            speed: 20, torque: 200 * engine(engineName),
            wheelDiam: 2.5, wheelHeight: 1, wheelRestitution: 1,
            bodyMass: 20, wheelFriction: 50, sbActivationTime: 0, powerupName: powerupName, offroad: false
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
        var mesh = this.scene.getMeshByName("TankBody");
        body.position.y = 20;
        mesh.parent = body;
        //Positioning the MOD mesh relative to the babylon mesh
        mesh.position.y -= 4;
        mesh.position.z -= 23;
        mesh.position.x -= 2;
        //Adding physics imposter to body mesh (the parent of the mod mesh)
        this.meshes.body.physicsImpostor =
            new BABYLON.PhysicsImpostor(body, BABYLON.PhysicsImpostor.BoxImpostor, { mass: this.attr.bodyMass }, this.scene);
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

    userInput(keys)
    {
        if(keys["w"]){
            this.forwards();
        } else if (keys["a"])
        {
            this.left();
        } else if (keys["s"])
        {
            this.backwards();
        } else if (keys["d"] )
        {
            this.right();
        } else {
            this.releaseDrive();
        }
    }

    forwards() {
        //If the power-up is not 4wd and the vehicle is offroad 
        //alternate handling characteristics
        if (this.attr.offroad && this.attr.powerupName != "4 Wheel Drive") {
            //do something different
            return;
        }
        //used for speedboost powerup
        var multi =
            ((new Date().getTime() - this.attr.sbActivationTime) < sbDuration) ? sbMultiplier : 1;
        this.motors.map((x) => x.setMotor(+this.attr.speed * multi, this.attr.torque * multi));
    }
    backwards() {
        if (this.attr.offroad && this.attr.powerupName != "4 Wheel Drive") {
            //do something different
            return;
        }
        var multi =
            ((new Date().getTime() - this.attr.sbActivationTime) < sbDuration) ? sbMultiplier : 1;
        this.motors.map((x) => x.setMotor(-this.attr.speed * multi, this.attr.torque * multi));
    }
    left() {
        if (this.attr.offroad && this.attr.powerupName != "4 Wheel Drive") {
            //do something different
            return;
        }
        var multi =
            ((new Date().getTime() - this.attr.sbActivationTime) < sbDuration) ? sbMultiplier : 1;
        this.motors[0].setMotor(-this.attr.speed * multi, this.attr.torque * multi);
        this.motors[1].setMotor(-this.attr.speed * multi, this.attr.torque * multi);
        this.motors[2].setMotor(-this.attr.speed * multi, this.attr.torque * multi);
        this.motors[3].setMotor(-this.attr.speed * multi, this.attr.torque * multi);
        this.motors[4].setMotor(this.attr.speed * multi, this.attr.torque * multi);
        this.motors[5].setMotor(this.attr.speed * multi, this.attr.torque * multi);
        this.motors[6].setMotor(this.attr.speed * multi, this.attr.torque * multi);
        this.motors[7].setMotor(this.attr.speed * multi, this.attr.torque * multi);

    }
    right() {
        if (this.attr.offroad && this.attr.powerupName != "4 Wheel Drive") {
            //do something different
            return;
        }
        var multi =
            ((new Date().getTime() - this.attr.sbActivationTime) < sbDuration) ? sbMultiplier : 1;
        this.motors[0].setMotor(this.attr.speed * multi, this.attr.torque * multi);
        this.motors[1].setMotor(this.attr.speed * multi, this.attr.torque * multi);
        this.motors[2].setMotor(this.attr.speed * multi, this.attr.torque * multi);
        this.motors[3].setMotor(this.attr.speed * multi, this.attr.torque * multi);
        this.motors[4].setMotor(-this.attr.speed * multi, this.attr.torque * multi);
        this.motors[5].setMotor(-this.attr.speed * multi, this.attr.torque * multi);
        this.motors[6].setMotor(-this.attr.speed * multi, this.attr.torque * multi);
        this.motors[7].setMotor(-this.attr.speed * multi, this.attr.torque * multi);
    }
    releaseDrive() {
        this.motors.map(x => x.setMotor(0, this.attr.torque / 3));
    }
    releaseSteering() {
        this.motors.map(x => x.setMotor(0, this.attr.torque / 3));
    }

}

export class Train {
    constructor(scene, x, z, engineName, visible) {
        this.scene = scene;
        this.attr = {
            speed: 10, torque: 25 * engine(engineName),
            wheelDiam: 5.5, wheelHeight: 1, wheelRestitution: 1,
            bodyMass: 100, wheelFriction: 50, sbActivationTime: 0
        };
        this.meshes = {
            body: BABYLON.MeshBuilder.CreateBox(null, { width: 20, depth: 15, height: 6 }, scene),
            front: BABYLON.MeshBuilder.CreateBox(null, { width: 8, depth: 15, height: 6 }, scene),
            wheelL1: BABYLON.MeshBuilder.CreateCylinder(null, { diameter: this.attr.wheelDiam, height: this.attr.wheelHeight }, scene),
            wheelL2: BABYLON.MeshBuilder.CreateCylinder(null, { diameter: this.attr.wheelDiam, height: this.attr.wheelHeight }, scene),
            wheelL3: BABYLON.MeshBuilder.CreateCylinder(null, { diameter: this.attr.wheelDiam, height: this.attr.wheelHeight }, scene),
            wheelR1: BABYLON.MeshBuilder.CreateCylinder(null, { diameter: this.attr.wheelDiam, height: this.attr.wheelHeight }, scene),
            wheelR2: BABYLON.MeshBuilder.CreateCylinder(null, { diameter: this.attr.wheelDiam, height: this.attr.wheelHeight }, scene),
            wheelR3: BABYLON.MeshBuilder.CreateCylinder(null, { diameter: this.attr.wheelDiam, height: this.attr.wheelHeight }, scene),
            arm: BABYLON.MeshBuilder.CreateBox(null, { width: 14.5, depth: 1, height: 1 }, scene),
            arm2: BABYLON.MeshBuilder.CreateBox(null, { width: 14.5, depth: 1, height: 1 }, scene),
        };
        this.motors = [];
        //Offset
        this.meshes.body.position.x = x;
        this.meshes.body.position.z = z;
        //Body positioning and physics
        this.attachBodyParts();
        //Wheel positioning and physics
        this.attachWheels();
        //attach the arm connecting wheels on each side
        this.attachArms();
        //Make all physics meshes invisible
        if (!visible)
            Object.entries(this.meshes).map((x) => x[1].isVisible = false);

    }

    attachArms() {
        //Creating the arm and adding the MOD child mesh
        let arm = this.meshes.arm;
        var mesh = this.scene.getMeshByName("RightBar");
        this.parentMeshToBar(mesh, arm, 0.75, -7, -28.5);
        this.positionBar(this.meshes.wheelL1, arm, 5.2, 1.2, 0);
        arm.physicsImpostor = new BABYLON.PhysicsImpostor(arm, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 1 }, this.scene);
        this.attachBar(this.meshes.wheelL1, arm, -5.2, 1);
        this.attachBar(this.meshes.wheelL2, arm, 1.3, 1);
        this.attachBar(this.meshes.wheelL3, arm, 7.8, 1);

        arm = this.meshes.arm2;
        mesh = this.scene.getMeshByName("LeftBar");
        this.parentMeshToBar(mesh, arm, 0.75, -7, -10.4);
        this.positionBar(this.meshes.wheelR1, arm, 5.2, -1.2, 0);
        arm.physicsImpostor = new BABYLON.PhysicsImpostor(arm, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 1 }, this.scene);
        this.attachBar(this.meshes.wheelR1, arm, -5.2, -1);
        this.attachBar(this.meshes.wheelR2, arm, 1.3, -1);
        this.attachBar(this.meshes.wheelR3, arm, 7.8, -1);
    }

    parentMeshToBar(mesh, bar, x, y, z) {
        bar.addChild(mesh);
        mesh.setParent(bar);
        mesh.position.x = x;
        mesh.position.y = y;
        mesh.position.z = z;
    }

    positionBar(wheel, bar, x, y, z) {
        bar.parent = wheel;
        bar.position.x = x;
        bar.position.y = y;
        bar.position.z = z;
        bar.setParent(null);
        bar.rotate(BABYLON.Axis.X, (Math.PI / 2) * 3, BABYLON.Space.LOCAL);
    }

    attachBar(wheel, bar, pob, otherSide) {
        var distanceFromCenter = -1.2;
        var projection = -1.2 * otherSide;
        var positionOnBar = pob + distanceFromCenter;
        var newJoint = new BABYLON.MotorEnabledJoint(BABYLON.PhysicsJoint.HingeJoint, {
            mainPivot: new BABYLON.Vector3(distanceFromCenter, 0, 0),
            connectedPivot: new BABYLON.Vector3(positionOnBar, 0, projection),
            mainAxis: new BABYLON.Vector3(0, 1, 0),
            connectedAxis: new BABYLON.Vector3(0, 0, 1),
        });
        wheel.physicsImpostor.addJoint(bar.physicsImpostor, newJoint);
    }

    attachBodyParts() {
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
            new BABYLON.PhysicsImpostor(body, BABYLON.PhysicsImpostor.BoxImpostor, { mass: this.attr.bodyMass }, this.scene);
        //Adding physics to front part
        front.physicsImpostor =
            new BABYLON.PhysicsImpostor(front, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 1 }, this.scene);
        var newJoint = new BABYLON.PhysicsJoint(BABYLON.PhysicsJoint.LockJoint, {});
        this.meshes.body.physicsImpostor.addJoint(front.physicsImpostor, newJoint);
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
        let wheelHeight = -1.5;

        //Rotating all the wheels so the face is parralel with the ground
        L1.rotate(BABYLON.Axis.X, Math.PI / 2, BABYLON.Space.LOCAL);
        L2.rotate(BABYLON.Axis.X, Math.PI / 2, BABYLON.Space.LOCAL);
        L3.rotate(BABYLON.Axis.X, Math.PI / 2, BABYLON.Space.LOCAL);
        R1.rotate(BABYLON.Axis.X, Math.PI / 2, BABYLON.Space.LOCAL);
        R2.rotate(BABYLON.Axis.X, Math.PI / 2, BABYLON.Space.LOCAL);
        R3.rotate(BABYLON.Axis.X, Math.PI / 2, BABYLON.Space.LOCAL);

        //Adding cylinder parent for mod wheel mesh, positioning relatively
        this.wheelMeshParent(this.scene.getMeshByName("TL1"), L1, 4, 11.5, -7.1);
        this.wheelMeshParent(this.scene.getMeshByName("TL2"), L2, -2.3, 11.3, -7.1);
        this.wheelMeshParent(this.scene.getMeshByName("TL3"), L3, -9, 11.5, -7.1);
        this.wheelMeshParent(this.scene.getMeshByName("TR1"), R1, 4, 27.5, -7.1);
        this.wheelMeshParent(this.scene.getMeshByName("TR2"), R2, -2.3, 27.5, -7.1);
        this.wheelMeshParent(this.scene.getMeshByName("TR3"), R3, -9, 27.5, -7.1);

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

    userInput(keys)
    {
        if(keys["w"]){
            this.forwards();
        } else if (keys["a"])
        {
            this.left();
        } else if (keys["s"])
        {
            this.backwards();
        } else if (keys["d"] )
        {
            this.right();
        } else {
            this.releaseDrive();
        }
    }

    forwards() {
        if (this.attr.offroad && this.attr.powerupName != "4 Wheel Drive") {
            //do something different
            return;
        }
        var multi =
            ((new Date().getTime() - this.attr.sbActivationTime) < sbDuration) ? sbMultiplier : 1;
        this.motors.map((x) => x.setMotor(+this.attr.speed * multi, this.attr.torque * multi));
    }

    backwards() {
        if (this.attr.offroad && this.attr.powerupName != "4 Wheel Drive") {
            //do something different
            return;
        }
        var multi =
            ((new Date().getTime() - this.attr.sbActivationTime) < sbDuration) ? sbMultiplier : 1;
        this.motors.map((x) => x.setMotor(-this.attr.speed * multi, this.attr.torque * multi));
    }

    left() {
        if (this.attr.offroad && this.attr.powerupName != "4 Wheel Drive") {
            //do something different
            return;
        }
        var multi =
            ((new Date().getTime() - this.attr.sbActivationTime) < sbDuration) ? sbMultiplier : 1;
        this.motors[0].setMotor(-this.attr.speed * multi, this.attr.torque * multi);
        this.motors[1].setMotor(-this.attr.speed * multi, this.attr.torque * multi);
        this.motors[2].setMotor(-this.attr.speed * multi, this.attr.torque * multi);
        this.motors[3].setMotor(this.attr.speed * multi, this.attr.torque * multi);
        this.motors[4].setMotor(this.attr.speed * multi, this.attr.torque * multi);
        this.motors[5].setMotor(this.attr.speed * multi, this.attr.torque * multi);
    }

    right() {
        if (this.attr.offroad && this.attr.powerupName != "4 Wheel Drive") {
            //do something different
            return;
        }
        var multi =
            ((new Date().getTime() - this.attr.sbActivationTime) < sbDuration) ? sbMultiplier : 1;
        this.motors[0].setMotor(this.attr.speed * multi, this.attr.torque * multi);
        this.motors[1].setMotor(this.attr.speed * multi, this.attr.torque * multi);
        this.motors[2].setMotor(this.attr.speed * multi, this.attr.torque * multi);
        this.motors[3].setMotor(-this.attr.speed * multi, this.attr.torque * multi);
        this.motors[4].setMotor(-this.attr.speed * multi, this.attr.torque * multi);
        this.motors[5].setMotor(-this.attr.speed * multi, this.attr.torque * multi);
    }

    releaseDrive() {
        this.motors.map((x) => x.setMotor(0, this.attr.torque / 3));
    }

    releaseSteering() {
        this.motors.map((x) => x.setMotor(0, this.attr.torque / 3));
    }

}

export class MT {
    constructor(scene, x, z, engineName, visible) {
        this.scene = scene;
        this.attr = {
            speed: 10, torque: 10 * engine(engineName),
            wheelDiam: 5.5, wheelHeight: 1, wheelRestitution: 1,
            bodyMass: 20, wheelFriction: 50, sbActivationTime: 0
        };

        this.meshes = {
            body: BABYLON.MeshBuilder.CreateBox(null, { width: 15, depth: 20, height: 6 }, scene),
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
        mesh.position.y -= 12;
        mesh.position.z -= 13;
        mesh.position.x += 0;
        //Adding physics imposter to babylon mesh (the parent of the mod mesh)
        this.meshes.body.physicsImpostor =
            new BABYLON.PhysicsImpostor(body, BABYLON.PhysicsImpostor.BoxImpostor, { mass: this.attr.bodyMass }, this.scene);
        //creating box physics for front part
        front.physicsImpostor =
            new BABYLON.PhysicsImpostor(front, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 5 }, this.scene);
        var newJoint = new BABYLON.PhysicsJoint(BABYLON.PhysicsJoint.LockJoint, {});
        this.meshes.body.physicsImpostor.addJoint(front.physicsImpostor, newJoint);
        //bearings
        b1.parent = front;
        b1.position.y = -5;
        b1.position.x = 2;
        b1.position.z = 6.5;//width
        b1.setParent(null);
        b1.physicsImpostor = new BABYLON.PhysicsImpostor(b1, BABYLON.PhysicsImpostor.BoxImpostor, { friction: 0, mass: 10 }, this.scene);
        front.physicsImpostor.addJoint(b1.physicsImpostor, newJoint);
        b2.parent = front;
        b2.position.y = -4.5;
        b2.position.x = 2;
        b2.position.z = -6.5;//width
        b2.setParent(null);
        b2.physicsImpostor = new BABYLON.PhysicsImpostor(b2, BABYLON.PhysicsImpostor.BoxImpostor, { friction: 0, mass: 1 }, this.scene);
        front.physicsImpostor.addJoint(b2.physicsImpostor, newJoint);
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
        this.wheelJoint(body, w1, -3.5, -2.5, 10);
        this.wheelJoint(body, w2, -3.5, -2.5, -10);
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

    userInput(keys)
    {
        if(keys["w"]){
            this.forwards();
        } else if (keys["a"])
        {
            this.left();
        } else if (keys["s"])
        {
            this.backwards();
        } else if (keys["d"] )
        {
            this.right();
        } else {
            this.releaseDrive();
        }
    }

    forwards() {
        if (this.attr.offroad && this.attr.powerupName != "4 Wheel Drive") {
            //do something different
            return;
        }
        var multi =
            ((new Date().getTime() - this.attr.sbActivationTime) < sbDuration) ? sbMultiplier : 1;
        this.motors.map((x) => x.setMotor(+this.attr.speed * multi, this.attr.torque * multi));
    }
    backwards() {
        if (this.attr.offroad && this.attr.powerupName != "4 Wheel Drive") {
            //do something different
            return;
        }
        var multi =
            ((new Date().getTime() - this.attr.sbActivationTime) < sbDuration) ? sbMultiplier : 1;
        this.motors.map((x) => x.setMotor(-this.attr.speed * multi, this.attr.torque * multi));
    }
    right() {
        if (this.attr.offroad && this.attr.powerupName != "4 Wheel Drive") {
            //do something different
            return;
        }
        var multi =
            ((new Date().getTime() - this.attr.sbActivationTime) < sbDuration) ? sbMultiplier : 1;
        this.motors[0].setMotor(this.attr.speed * multi, this.attr.torque * multi);
        this.motors[1].setMotor(-this.attr.speed * multi, this.attr.torque * multi);
    }
    left() {
        if (this.attr.offroad && this.attr.powerupName != "4 Wheel Drive") {
            //do something different
            return;
        }
        var multi =
            ((new Date().getTime() - this.attr.sbActivationTime) < sbDuration) ? sbMultiplier : 1;
        this.motors[0].setMotor(-this.attr.speed * multi, this.attr.torque * multi);
        this.motors[1].setMotor(this.attr.speed * multi, this.attr.torque * multi);
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