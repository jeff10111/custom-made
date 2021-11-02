import * as BABYLON from "babylonjs";
import {Ellipse, Control} from "@babylonjs/gui";

//Used to make the two circles and the puck
let makeThumbArea = function(name, thickness, color, background){
    let rect = new Ellipse();
        rect.name = name;
        rect.thickness = thickness;//0 makes solid circle
        rect.color = color;
        rect.background = background;
        rect.paddingLeft = "0px";
        rect.paddingRight = "0px";
        rect.paddingTop = "0px";
        rect.paddingBottom = "0px";
    return rect;
 }

export class JoyStick{
    constructor(adt, app)
    {
        //Distance from bottom of canvas
        let sideJoystickOffset = 20;
        let bottomJoystickOffset = -20;
        //Sizes
        let puckSize = 60;
        let innerContainerHeight = 80;
        let outerContainerHeight = 200;
        //Center point offset for user mouse/touch input calculations
        let center = {x:outerContainerHeight/2 + puckSize/2, y:adt._canvas.height - (outerContainerHeight/2) - puckSize/2};

        //Outer container
        let leftThumbContainer = makeThumbArea("leftThumb", 2, "red", null);
        leftThumbContainer.height = `${outerContainerHeight}px`;
        leftThumbContainer.width = `${outerContainerHeight}px`;
        leftThumbContainer.isPointerBlocker = true;
        leftThumbContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        leftThumbContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        leftThumbContainer.alpha = 0.4;
        leftThumbContainer.left = sideJoystickOffset;
        leftThumbContainer.top = bottomJoystickOffset;
  
        //Inner container
        let leftInnerThumbContainer = makeThumbArea("leftInnterThumb", 4, "red", null);
        leftInnerThumbContainer.height = `${innerContainerHeight}px`;
        leftInnerThumbContainer.width = `${innerContainerHeight}px`;
        leftInnerThumbContainer.isPointerBlocker = true;
        leftInnerThumbContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        leftInnerThumbContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;

        //Puck
        let leftPuck = makeThumbArea("leftPuck",0, "white", "white");
        leftPuck.height = `${puckSize}px`;
        leftPuck.width = `${puckSize}px`;
        leftPuck.isPointerBlocker = true;
        leftPuck.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        leftPuck.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        leftPuck.isVisible = true;

        //THUMB DOWN
        leftThumbContainer.onPointerDownObservable.add(function() {
            leftPuck.isDown = true;
        });

        //THUMB UP
        leftThumbContainer.onPointerUpObservable.add(function() {
            leftPuck.isDown = false;
            //release all inputs
            app.keysPressed['a'] = app.keysPressed['w'] = app.keysPressed['s'] = app.keysPressed['d'] = 0;
            //return puck to center
            leftPuck.left = 0;
            leftPuck.top = 0;
        });

        //THUMB MOVED
        leftThumbContainer.onPointerMoveObservable.add(function(coordinates) {

            //Make sure the user is pressing on not just passing cursor over the puck
            if (!leftPuck.isDown) 
            {
                return;
            }

            //Distance from center
            let distance = Math.sqrt(Math.pow(coordinates.x - center.x, 2) + Math.pow(coordinates.y - center.y, 2))
            
            //If it's outside the container stop
            if(distance > outerContainerHeight/2)
                return;

            //Set puck position 
            leftPuck.left = coordinates.x-(leftThumbContainer._currentMeasure.width*.5)-sideJoystickOffset;
            leftPuck.top = (adt._canvas.height - coordinates.y-(leftThumbContainer._currentMeasure.height*.5)+bottomJoystickOffset)*-1;

            //Calculate angle from 0,0 to point
            let angle = Math.atan2(coordinates.y - center.y, coordinates.x - center.x); 

            //Un-used, but radians could be implemented on the vehicle instead of key pressed
            app.keysPressed['radian'] = angle;

            //If the puck is too close to center, no input
            if(distance < 50)
            {
                app.keysPressed['w'] = 0; app.keysPressed['a'] = 0; app.keysPressed['s'] = 0; app.keysPressed['d'] = 0;
                return;
            }
                           
            //Setting key presses using the angle
            if(angle > 0)
            {
                if(angle < 0.125 * Math.PI)//D
                {
                    app.keysPressed['w'] = 0; app.keysPressed['a'] = 0; app.keysPressed['s'] = 0; app.keysPressed['d'] = 1;
                } else if (angle < 0.375 * Math.PI)//SD
                {
                    app.keysPressed['w'] = 0; app.keysPressed['a'] = 0; app.keysPressed['s'] = 1; app.keysPressed['d'] = 1;
                } else if (angle < 0.625 * Math.PI)//S
                {
                    app.keysPressed['w'] = 0; app.keysPressed['a'] = 0; app.keysPressed['s'] = 1; app.keysPressed['d'] = 0;
                } else if (angle < 0.875 * Math.PI)//SA
                {
                    app.keysPressed['w'] = 0; app.keysPressed['a'] = 1; app.keysPressed['s'] = 1; app.keysPressed['d'] = 0;
                } else //A
                {
                    app.keysPressed['w'] = 0; app.keysPressed['a'] = 1; app.keysPressed['s'] = 0; app.keysPressed['d'] = 0;
                }
            } else {
                if(angle > -0.125 * Math.PI)//D
                {
                    app.keysPressed['w'] = 0; app.keysPressed['a'] = 0; app.keysPressed['s'] = 0; app.keysPressed['d'] = 1;
                } else if (angle > -0.375 * Math.PI)//WD
                {
                    app.keysPressed['w'] = 1; app.keysPressed['a'] = 0; app.keysPressed['s'] = 0; app.keysPressed['d'] = 1;
                } else if (angle > -0.625 * Math.PI)//W
                {
                    app.keysPressed['w'] = 1; app.keysPressed['a'] = 0; app.keysPressed['s'] = 0; app.keysPressed['d'] = 0;
                } else if (angle > -0.875 * Math.PI)//WA
                {
                    app.keysPressed['w'] = 1; app.keysPressed['a'] = 1; app.keysPressed['s'] = 0; app.keysPressed['d'] = 0;
                }else //A
                {
                    app.keysPressed['w'] = 0; app.keysPressed['a'] = 1; app.keysPressed['s'] = 0; app.keysPressed['d'] = 0;
                }
            }
        });

        //Adding the two circles and puck
        adt.addControl(leftThumbContainer);
        leftThumbContainer.addControl(leftInnerThumbContainer);
        leftThumbContainer.addControl(leftPuck);
    }        

}