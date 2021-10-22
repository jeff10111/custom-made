import {
  TextBlock,
  StackPanel,
  AdvancedDynamicTexture,
  Image,
  Button,
  Rectangle,
  Control,
  Grid,
} from "@babylonjs/gui";
import {
  Scene,
  Sound,
  ParticleSystem,
  PostProcess,
  Effect,
  SceneSerializer,
} from "@babylonjs/core";
import { JoyStick } from "./joystick"; 

export class Hud {
  constructor(scene, keysPressed) {
    this._scene = scene;

    const playerUI = AdvancedDynamicTexture.CreateFullscreenUI("UI");
    this._playerUI = playerUI;
    this._playerUI.idealHeight = 720;
    this._prevTime = 0;
    this._clockTime = null; //GAME TIME
    this._sString = "00";
    this._mString = 0;
    this.time;

    const stackPanel = new StackPanel();
    stackPanel.height = "100%";
    stackPanel.width = "100%";
    stackPanel.top = "14px";
    stackPanel.verticalAlignment = 0;
    playerUI.addControl(stackPanel);

    //Game timer text
    const clockTime = new TextBlock();
    clockTime.name = "clock";
    clockTime.textHorizontalAlignment = TextBlock.HORIZONTAL_ALIGNMENT_CENTER;
    clockTime.fontSize = "48px";
    clockTime.color = "white";
    clockTime.text = "00:00";
    clockTime.resizeToFit = true;
    clockTime.height = "96px";
    clockTime.width = "220px";
    clockTime.fontFamily = "Lucida Console";
    stackPanel.addControl(clockTime);
    this._clockTime = clockTime;

    //Redlight timer text
    const redlightTime = new TextBlock();
    redlightTime.name = "redlight";
    redlightTime.textHorizontalAlignment = TextBlock.HORIZONTAL_ALIGNMENT_LEFT;
    redlightTime.fontSize = "48px";
    redlightTime.color = "red";
    redlightTime.text = "";
    redlightTime.resizeToFit = true;
    redlightTime.height = "96px";
    redlightTime.width = "220px";
    redlightTime.fontFamily = "Lucida Console";
    stackPanel.addControl(redlightTime);
    this._redlightTime = 5000;
    this._redlightTimeClock = redlightTime;
    this._stopRedlight = true;

    //start joystick
    new JoyStick(playerUI, keysPressed);
  }

  updateHud() {
    if (!this._stopTimer && this._startTime != null) {
      let curTime =
        Math.floor((new Date().getTime() - this._startTime) / 1000) ; // divide by 1000 to get seconds

      this.time = curTime; //keeps track of the total time elapsed in seconds
      this._clockTime.text = this._formatTime(curTime);
    }
    if (!this._stopRedlight && this._redlightTime >= 0) {
      console.log(new Date().getTime(), " - ", this._prevTime)
      this._redlightTime -= (new Date().getTime() - this._prevTime)
      console.log(this._redlightTime)
      this._prevTime = new Date().getTime();
      if (this._redlightTime < 0) {
        this._redlightTime = 0;
      }
      this._redlightTimeClock.text = ("WAIT: " + this._redlightTime)
    }

  }

  //---- Game Timer ----
  startTimer() {
    this._startTime = new Date().getTime();
    console.log(this._startTime);
    this._stopTimer = false;
    this._redlightTime = 5000;
  }
  stopTimer() {
    this._stopTimer = true;
  }

  startRedlight() {
    this._prevTime = new Date().getTime()
    this._stopRedlight = false;
    if (this._redlightTime > 5000) {
      this._redlightTimeClock.visible = true;
    }

  }
  stopRedlight() {
    this._stopRedlight = true;
    if (this._redlightTime < 10) {
      this._redlightTimeClock.visible = false;
      this._redlightTimeClock.text = ""
    }
  }

  //format the time so that it is relative to 11:00 -- game time
  _formatTime(time) {
    let minsPassed = Math.floor(time / 60); //seconds in a min
    let secPassed = time - minsPassed * 60;
    return (
      (minsPassed < 10 ? "0" : "") +
      minsPassed +
      ":" +
      (secPassed < 10 ? "0" : "") +
      secPassed
    );
  }
}
