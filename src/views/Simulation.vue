<template>
  <div>
    <div>
      {{ this.userSelection["body"] }} with
      {{ this.userSelection.engine }} engine and
      {{ this.userSelection.powerup }} powerup
    </div>
    <div><button @click="spinArm">Spin!</button>
    <button @click="buildT">Build Model T!</button>
    <button @click="playCSV">Play CSV!</button>
    <button @click="raiseBlocks">Raise Blocks!</button>
    <button @click="lowerBlocks">Lower Blocks!</button>
    <button @click="powerUp">Activate Powerup!!</button></div>
    <canvas id="gameCanvas" width="1000px" height="600px"></canvas>
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
    buildT() {
      this.Application.buildT();
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
