import {
    StackPanel,
    Button,
    Control,
  } from "@babylonjs/gui";

  /*
  * Class for the SpeedBoost button and integrated timer
  */
export class SpeedBoostGui{
    //Creating container for button (it is not visible)
    constructor(adt, ba)
    {
        this.stackPanel = new StackPanel();
        this.stackPanel.height = `${adt._canvas.height*0.15}px`;
        this.stackPanel.width = `${adt._canvas.width*0.35}px`;
        this.stackPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        this.stackPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        adt.addControl(this.stackPanel);
        this.app = ba;
        this.startTime = 0;
        this.currentTime;
    }

    //Creating the button if user has chosen this powerup
    activateButton(){
        //If the button already exists, we want to remove and rebuilt it
        if(this.button)
            this.button.dispose();

        //Create button called but with Activate SpeedBoost as its text
        this.button = Button.CreateSimpleButton("but", "Activate\nSpeedBoost");
        this.button.width = 0.8;
        this.button.height = 0.8;
        this.button.color = "white";
        this.button.background = "red";
        this.button.alpha = 0.8;
        this.stackPanel.addControl(this.button);
        //Scope these attributes so they can be used below
        var button = this.button;
        var app = this.app;

        //Function for if they click it
        //Function is a member of the button object, not of this class
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

    //Called from controller
    startTimer(){
        this.startTime = new Date().getTime();
        this.active = true;
    }

    //Called for gui class
    updateTimerText(){
        if(this.startTime && this.button){
            let timeLeft = 10 - (Math.floor((new Date().getTime() - this.startTime)/1000));
        if (timeLeft < 0)
            timeLeft = 0;
        this.button.textBlock.text = `Boost Remaining:\n${timeLeft.toString()}s`;

        }
    }
}