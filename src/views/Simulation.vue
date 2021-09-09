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
    </div>
    <div>
    <canvas id="gameCanvas" width="1000px" height="600px"></canvas>
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


</style>
