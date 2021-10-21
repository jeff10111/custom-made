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

export class SpeedBoostGui{
    constructor(adt, ba)
    {
        this.stackPanel = new StackPanel();
        this.stackPanel.height = `${adt._canvas.height*0.15}px`;
        this.stackPanel.width = `${adt._canvas.width*0.35}px`;
        //stackPanel.background = "black";
        this.stackPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        this.stackPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        adt.addControl(this.stackPanel);
        this.app = ba;
        this.startTime = 0;
        this.currentTime;
    }

    activateButton(){
        if(this.button)
            this.button.dispose();
        console.log("Creating button in class for speed boost button");

        this.button = Button.CreateSimpleButton("but", "Activate\nSpeedBoost");
        this.button.width = 0.8;
        this.button.height = 0.8;
        this.button.color = "white";
        this.button.background = "red";
        this.button.alpha = 0.8;
        this.stackPanel.addControl(this.button);
        var button = this.button;
        var app = this.app;

        this.button.onPointerDownObservable.add(function() {
            if(button.textBlock.text != "Activate\nSpeedBoost")
                return;
            app.buttonPressed("speedBoost");
            button.textBlock.text = "SpeedBoost\nActivated";
        });            
    }

    //Remove button
    deactivateButton(){
        if(this.button)
        {
            this.button.dispose();
        }  
        this.startTime = 0;
    }

    startTimer(){
        this.startTime = new Date().getTime();
        this.active = true;
    }

    updateTimerText(){
        if(this.startTime && this.button){
            let timeLeft = 10 - (Math.floor((new Date().getTime() - this.startTime)/1000));
        if (timeLeft < 0)
            timeLeft = 0;
        this.button.textBlock.text = `Boost Remaining:\n${timeLeft.toString()}s`;

        }
    }
}