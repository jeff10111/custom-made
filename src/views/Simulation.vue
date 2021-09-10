<template>
  <div>
    <div>
      {{ this.userSelection.body }} with
      {{ this.userSelection.engine }} engine and
      {{ this.userSelection.powerup }} powerup
    </div>
    <div class="btn-group" role="group">
      <button type="button" @click="spinArm">Spin!</button>
      <button type="button" @click="buildVehicle">Build Selected Vehicle!</button>
      <button type="button" @click="playCSV">Play CSV!</button>
      <button type="button" @click="raiseBlocks" id="av" class="simButton">Raise Blocks!</button>
      <button type="button" @click="lowerBlocks">Lower Blocks!</button>
      <button type="button" @click="powerUp">Activate Powerup!!</button>
      <button type="button" @click="scoreSubmission">Open Score Submission</button>
    </div>
    <div>
    <canvas id="gameCanvas" width="1000px" height="600px"></canvas>
    </div>
    <!-- The Modal -->
    <div id="myModal" class="modal">

    <!-- Modal content -->
    <div class="modal-content">
      <div class="container">
        <div class="row">
          <h4 id="heading">Submit Score</h4>
          </div>
      <div class="row">
          <div @click="clear()" contenteditable="true" id="nameInput">Enter name here...</div>
          <button @click="pushName()" id="name">Enter</button>
          <button @click="cancel()" id="cancel">Cancel</button>     
      </div>     
      </div>
    </div>

  </div>
  </div>
</template>

<script>
import * as CanvasApp from "../canvasApp.js";

export default {
  name: "Simulation",
  props: {},
  methods: {
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
    }
  },
  data() {
    return { userSelection: { body: "", engine: "", powerup: "" }, mode: 0 };
  },
  mounted() {
    this.userSelection["body"] = this.$route.query.body;
    this.userSelection["engine"] = this.$route.query.engine;
    this.userSelection["powerup"] = this.$route.query.powerup;
    this.Application = new CanvasApp.BabylonApp(
      this.userSelection["body"],
      this.userSelection["engine"],
      this.userSelection["powerup"]
    );
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
  background-color: #fefefe;
  margin: 15% auto; /* 15% from the top and centered */
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
  color: black;
  border-style: solid;
  border-color: black;
}

#heading {
  margin: 0em, 3em, 0em, 3em;
  height: 3em;
  color: black;
}

#cancel{
  display:inline;
}
</style>
