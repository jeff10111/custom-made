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

export class Hud {
  constructor(scene) {
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
  }

  updateHud() {
    if (!this._stopTimer && this._startTime != null) {
      let curTime =
        Math.floor((new Date().getTime() - this._startTime) / 1000) +
        this._prevTime; // divide by 1000 to get seconds

      this.time = curTime; //keeps track of the total time elapsed in seconds
      this._clockTime.text = this._formatTime(curTime);
    }
  }

  //---- Game Timer ----
  startTimer() {
    this._startTime = new Date().getTime();
    console.log(this._startTime);
    this._stopTimer = false;
  }
  stopTimer() {
    this._stopTimer = true;
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
