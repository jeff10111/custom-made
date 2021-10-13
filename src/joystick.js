import * as BABYLON from "babylonjs";
import {Ellipse, Control} from "@babylonjs/gui";

let makeThumbArea = function(name, thickness, color, background, curves){
    let rect = new Ellipse();
        rect.name = name;
        rect.thickness = thickness;
        rect.color = color;
        rect.background = background;
        rect.paddingLeft = "0px";
        rect.paddingRight = "0px";
        rect.paddingTop = "0px";
        rect.paddingBottom = "0px";
    return rect;
 }

export class JoyStick{
    constructor(adt, keysPressed)
    {
        let xAddPos = 0;
        let yAddPos = 0;
        let sideJoystickOffset = 20;
        let bottomJoystickOffset = -20;
        let center = {x:82.5 + sideJoystickOffset, y:518 + bottomJoystickOffset};

        this.x = 5;
        let leftThumbContainer = makeThumbArea("leftThumb", 2, "blue", null);
        leftThumbContainer.height = "200px";
        leftThumbContainer.width = "200px";
        leftThumbContainer.isPointerBlocker = true;
        leftThumbContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        leftThumbContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        leftThumbContainer.alpha = 0.4;
        leftThumbContainer.left = sideJoystickOffset;
        leftThumbContainer.top = bottomJoystickOffset;
  
        let leftInnerThumbContainer = makeThumbArea("leftInnterThumb", 4, "blue", null);
        leftInnerThumbContainer.height = "80px";
        leftInnerThumbContainer.width = "80px";
        leftInnerThumbContainer.isPointerBlocker = true;
        leftInnerThumbContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        leftInnerThumbContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;

        let leftPuck = makeThumbArea("leftPuck",0, "blue", "blue");
        leftPuck.height = "60px";
        leftPuck.width = "60px";
        leftPuck.isPointerBlocker = true;
        leftPuck.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        leftPuck.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        leftPuck.isVisible = true;
        leftThumbContainer.alpha = 0.4;


        leftThumbContainer.onPointerDownObservable.add(function() {
            leftPuck.isDown = true;
        });

        leftThumbContainer.onPointerUpObservable.add(function() {
            leftPuck.isDown = false;
            keysPressed['a'] = keysPressed['w'] = keysPressed['s'] = keysPressed['d'] = 0;
        });

        leftThumbContainer.onPointerMoveObservable.add(function(coordinates) {
            if (!leftPuck.isDown) 
                return;
            
            xAddPos = coordinates.x-(leftThumbContainer._currentMeasure.width*.5)-sideJoystickOffset;
            yAddPos = adt._canvas.height - coordinates.y-(leftThumbContainer._currentMeasure.height*.5)+bottomJoystickOffset;
            leftPuck.floatLeft = xAddPos;
            leftPuck.floatTop = yAddPos*-1;
            leftPuck.left = leftPuck.floatLeft;
            leftPuck.top = leftPuck.floatTop;
                
            //up or down
            if(coordinates.x - center.x > -42 && coordinates.x - center.x < 42)
            {
                keysPressed['a'] = 0; keysPressed['d'] = 0;
                if(coordinates.y - center.y > 0)
                {
                    console.log("UP");
                    keysPressed['s'] = 1;keysPressed['w'] = 0;
                }
                else 
                {
                    console.log("DOWN");
                    keysPressed['s'] = 0;keysPressed['w'] = 1;
                }
            }
            //left or right
            else if(coordinates.y - center.y > -42 && coordinates.y - center.y < 42)
            {
                keysPressed['s'] = 0; keysPressed['w'] = 0;
                if(coordinates.x - center.x > 0)
                {
                    console.log("right");
                    (keysPressed['a'] = 0); (keysPressed['d'] = 1);
                } else
                {
                    console.log("left");
                    (keysPressed['a'] = 1); (keysPressed['d'] = 0);
                }   
            }
            //left up, right up
            else if(coordinates.y - center.y < 0)
            {
                keysPressed['s'] = 0; keysPressed['w'] = 1;
                if(coordinates.x - center.x > 0)
                {
                    console.log("left up");
                    keysPressed['d'] = 1; keysPressed['a'] = 0;
                } else
                {
                    console.log("right up")
                    keysPressed['d'] = 0; keysPressed['a'] = 1;
                }

            } 
            //left down, right down
            else if (coordinates.y - center.y > 0)
            {
                keysPressed['w'] = 0; keysPressed['s'] = 1;
                if(coordinates.x - center.x > 0)
                {
                    console.log("left down");
                    keysPressed['d'] = 1; keysPressed['a'] = 0;
                } else
                {
                    console.log("right down");
                    keysPressed['d'] = 0; keysPressed['a'] = 1;
                }
            }
        });

        adt.addControl(leftThumbContainer);
        leftThumbContainer.addControl(leftInnerThumbContainer);
        leftThumbContainer.addControl(leftPuck);
    }        

}