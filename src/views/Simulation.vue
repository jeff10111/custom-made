<template>
  <div>
    <div>
      {{ this.userSelection["body"] }} with
      {{ this.userSelection.engine }} engine and
      {{ this.userSelection.powerup }} powerup
    </div>
    <div><button @click="powerUp">Activate Powerup!!</button><button @click="somethingElse">umm!!</button></div>
    <canvas id="gameCanvas" width="1920px" height="1080px"></canvas>
  </div>
</template>

<script>
import *  as CanvasApp from "../canvasApp.js";

export default {
  name: "Simulation",
  props: {
  },
  methods: {
    powerUp() {
      this.Application.powerUpActivation();
    },
    somethingElse() {
      console.log("Something else");
    }
  },
  data() {
    return { userSelection: { body: "", engine: "", powerup: "" }, mode: 0 };
  },
  mounted() {
    this.userSelection["body"] = this.$route.query.body;
    this.userSelection["engine"] = this.$route.query.engine;
    this.userSelection["powerup"] = this.$route.query.powerup;
    this.Application = new CanvasApp.BabylonApp(this.userSelection["body"], this.userSelection["engine"], this.userSelection["powerup"]);
  },
};
</script>
