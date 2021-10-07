<template>
  <div>
    <div>
      {{ this.userSelection.body }} with
      {{ this.userSelection.engine }} engine and
      {{ this.userSelection.powerup }} powerup
    </div>
    <div class="btn-group" role="group">
      <button type="button" @click="spinArm" hidden>Spin!</button>
      <button type="button" @click="buildVehicle" hidden>Build Selected Vehicle!</button>
      <button type="button" @click="playCSV" hidden>Play CSV!</button>
      <button type="button" @click="raiseBlocks" id="av" class="simButton" hidden>Raise Blocks!</button>
      <button type="button" @click="lowerBlocks" hidden>Lower Blocks!</button>
      <button type="button" @click="powerUp" hidden>Activate Powerup!!</button>
      <button type="button" @click="scoreSubmission">Submit Best Score</button>
      <button type="button" @click="anything">anythingForTesting</button>
      <button type="button" @click="openVehicleSelection">Change Vehicle</button><div id="bestScore">Current Best Score: 0</div>
    </div>
    <div>
    <canvas id="gameCanvas" width="1000px" height="600px"></canvas>
    </div>
    
    <!-- The Modal -->
    <div id="myModal" class="modal">
    <!-- Modal content -->
    <div class="modal-content">
      <div class="container">
        <div class="row justify-content-center">
          <h4 id="heading">Submit Score</h4>
        </div>
        <div class="row justify-content-center">
          <div class="col-8">
            <div @click="clear()" contenteditable="true" id="nameInput">Enter name here...</div>  
          </div>
        </div>     
        <div class="row justify-content-center">
          <div class="col-8">
          <button @click="pushName()" id="name">Enter</button>
          <button @click="cancel()" id="cancel">Cancel</button>   
          </div>
        </div>
      </div>
    </div>
    </div>

    <!-- Vehicle Selection Interface Modal -->
    <div id="vehicleSelection" class="modal">
      <div class="container modal-select-content">
        <div class="row">
          <div class="col"><!-- selection rows-->
            <h1> Choose your components </h1>
            <div class="row selection">
              <h4>Bodies</h4>
              <InterfaceItem2 class="col-sm body" v-for="body in bodies" v-bind:key="body.id" :partName="body" v-on:send="sendText" ref="body"></InterfaceItem2>
            </div>
            <div class="row selection">
              <h4>Engines</h4>
              <InterfaceItem2 class="col-sm engine" v-for="engine in engines" v-bind:key="engine.id" :partName="engine" v-on:send="sendText" ref="engine"></InterfaceItem2>
            </div>
            <div class="row selection">
              <h4>Power-ups</h4>
              <InterfaceItem2 class="col-sm powerup" v-for="powerup in powerups" v-bind:key="powerup.id" :partName="powerup" v-on:send="sendText" ref="powerup"></InterfaceItem2>
            </div>
          </div>
          <div class="col">
            <h1> Vehicle Description </h1>
            <div class="row" id="descText"><!-- description text -->
              <div>
        The <p>{{this.userSelection.body}}</p> represents the 
        <p>{{this.userSelection.body == "Train" ? "first" : 
        this.userSelection.body == "Car" ? "second": 
        this.userSelection.body == "Tank" ? "third" : "fourth"}}</p> industrial revolution.

        The <p>{{this.userSelection.engine}}</p> engine represents the 
        <p>{{this.userSelection.engine == "Steam" ? "first" : 
        this.userSelection.engine == "Petrol" ? "second": 
        this.userSelection.engine == "Jet" ? "third" : "fourth"}}</p> industrial revolution. 

        The <p>{{this.userSelection.powerup}}</p> power-up
        {{this.userSelection.powerup == "4 Wheel Drive" ? "allows the vehicle to drive over the 4WD section of the track more easily." :
        this.userSelection.powerup == "Emergency Siren" ? "allows the vehicle to pass through red lights without stopping" :
        this.userSelection.powerup == "Portal" ? "allows the vehicle to drive through one of the walls":
        this.userSelection.powerup == "Speed Boost" ? "gives the vehicle a temporary speed boost when activated by the player.": ""
        }}
              </div>
            </div>
            <div class="row"><!-- images -->
                <img src="../assets/Car.png" id="CarImage" title="car" width="200" />
                <img src="../assets/Tank.png" id="TankImage" title="tank" width="200" />
                <img src="../assets/Spaceship.png" title="spaceship" id="SpaceshipImage" width="200" />
                <img src="../assets/Train.png" title="train" id="TrainImage" width="100"/>
                <button id="startSimulation" @click="restartSimulation">Start Simulation</button>
            </div>
          </div>
        </div>
      </div>
    </div>  

  </div>
</template>

<script>
import * as CanvasApp from "../canvasApp.js";
import InterfaceItem2 from '@/components/InterfaceItem2.vue'
export default {
  name: "Simulation",
  props: {},
  components: {InterfaceItem2},
  methods: {
    restartSimulation() {
      this.Application.restartSimulation(this.userSelection.body, this.userSelection.powerup, this.userSelection.engine);
      document.getElementById("vehicleSelection").style.display = "none";
    },
    powerUp() {
      this.Application.powerUpActivation();
    },
    spinArm() {
      this.Application.spinArm();
    },
    buildVehicle() {
      this.Application.buildVehicle();
    },
    playCSV() {
      this.Application.playCSV();
    },
    raiseBlocks() {
      this.Application.raiseBlocks();
    },
    lowerBlocks() {
      this.Application.lowerBlocks();
    },
    pushName(){
      console.log('name pushed: ' + document.getElementById("nameInput").textContent);
      this.Application.submitScore(document.getElementById("nameInput").textContent || "");
      document.getElementById("myModal").style.display = "none";    
      },
    clear() {
      document.getElementById("nameInput").textContent = "";
    },
    scoreSubmission() {
      document.getElementById("myModal").style.display = "block";
      document.getElementById("nameInput").textContent = "Enter name here...";
    },
    cancel(){
      document.getElementById("myModal").style.display = "none";
    },
    anything(){
      this.Application.something();
    },
    openVehicleSelection(){
      document.getElementById("vehicleSelection").style.display = "block";
    },
    sendText: function(text) 
    {
              //this statement changes the image displayed
              //when a user select a different vehicle
              //each if statement also changes the user selection variable
              if(this.bodies.indexOf(text) >=0)
              {
                this.$refs.body.map(x => x.reset());
                this.userSelection["body"] = text;
                var attr = document.createAttribute("hidden");
                document.getElementById("TankImage").setAttributeNode(attr);
                document.getElementById("CarImage").setAttributeNode(attr.cloneNode());
                document.getElementById("SpaceshipImage").setAttributeNode(attr.cloneNode());
                document.getElementById("TrainImage").setAttributeNode(attr.cloneNode());
                document.getElementById(text+"Image").removeAttribute("hidden");
              }
              else if (this.engines.indexOf(text) >=0)
              {
                this.$refs.engine.map(x => x.reset());
                this.userSelection["engine"] = text;
              }
              else if (this.powerups.indexOf(text) >=0)
              {
                this.$refs.powerup.map(x => x.reset())
                this.userSelection["powerup"] = text
              }
    },
  },
  data() {
    return { userSelection: { body: "", engine: "", powerup: "" }, mode: 0,
    count: 0, body: 0, powerup:0, engine: 0, credits: 100,
    imageUrl: "",
    bodies: ['Train','Car','Tank','Spaceship'],
    engines: ['Steam', 'Petrol', 'Jet', 'Nuclear Fusion'],
    powerups: ['4 Wheel Drive', 'Emergency Siren','Portal','Speed Boost'],
    };
  },
  mounted() {
    this.userSelection["body"] = this.$route.query.body;
    this.userSelection["engine"] = this.$route.query.engine;
    this.userSelection["powerup"] = this.$route.query.powerup;
      if(!this.Application)
        this.Application = new CanvasApp.BabylonApp(
        this.userSelection["body"],
        this.userSelection["engine"],
        this.userSelection["powerup"]
        );
    [this.userSelection.body, this.userSelection.engine, this.userSelection.powerup].map(x => this.sendText(x));
  }, 
};
</script>
<style>
@import "~@/components/bootstrap.css";
.modal {
  display: none; /* Hidden by default */
  position: fixed; /* Stay in place */
  z-index: 1; /* Sit on top */
  left: 0;
  top: 0;
  width: 100%; /* Full width */
  height: 100%; /* Full height */
  overflow: auto; /* Enable scroll if needed */
  background-color: rgb(0,0,0); /* Fallback color */
  background-color: rgba(0,0,0,0.4); /* Black w/ opacity */
}

.modal-content {
  background-color: #000000;
  color: white;
  margin: 15% auto; /* 15% from the top and centered */
  padding: 20px;
  border: 1px solid #888;
  width: 20%; /* Could be more or less, depending on screen size */
}

.modal-select-content {
  background-color: #000000;
  margin: 5% auto; 
  padding: 20px;
  border: 1px solid #888;
  width: 80%; /* Could be more or less, depending on screen size */
}

.close {
  color: #aaa;
  float: right;
  font-size: 28px;
  font-weight: bold;
}

.close:hover,
.close:focus {
  color: black;
  text-decoration: none;
  cursor: pointer;
}

#nameInput {
  margin: 0em, 3em, 0em, 3em;
  height: 3em;
  color: rgb(0, 0, 0);
  background-color: white;
  border-style: solid;
  border-color: black;
}

#heading {
  margin: 0em, 3em, 0em, 3em;
  height: 3em;
  color: rgb(168, 168, 168);
}

#cancel{
  display:inline;
}

.row.selection{
  background-color: black;
  border-color: white;
  border-style:solid;
  border-width: 1px;
  margin-bottom: 1em;
}

img{
  margin: 50px;
  width: 200px !important;
  height: 200px;
}

.col-sm {margin-bottom: 10px; padding:0em} 
h1{margin-bottom: 10px;}
p{color:rosybrown; display: inline}
#startSimulation{
  display:inline;
  width: 200px;
  height: 200px;
  margin: 0em;
  padding: 0px;
  border: 4mm outset rosybrown;
  font-size: 2em;
  vertical-align: middle;
    border-radius: 0.6em;

}
#startSimulation:hover{
  border: 4mm inset rosybrown;
  border-radius: 0.6em;
}
h1{
  background-color: black;
  border-color: white;
  border-style:solid;
  border-width: 1px;
}

h4{
  margin-top: 0.25em;
}

.row.selection{
  background-color: black;
  border-color: white;
  border-style:solid;
  border-width: 1px;
  margin-bottom: 1em;
}

#descText{
  border-color: white;
  border-width: 1px;
  border-style: solid;
  background-color: black;
}

div.row{
  margin:0%;
}

img{
  margin: 50px;
}

.row.description{
  border-color: white;
  border-width: 1em;
}

#bestScore{
  display:table-cell;
  vertical-align: bottom;
}
</style>
