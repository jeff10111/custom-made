
<template>
  <div id="renderCanvas">
    {{this.userSelection["body"]}} with {{this.userSelection.engine}} engine and {{this.userSelection.powerup}} powerup
    <Scene v-model="myScene">
      <!-- <Entity v-model="myEntity">
        <Box v-model="myBox"></Box>
      </Entity> -->
      <Asset :position="[0,0,0]" :scaling="[0.1,0.1,0.1]" src="../assets/dornaRigged.glb" v-model="dornaArm" v-on="scaleUp()"></Asset>
    </Scene>
  </div>
</template>
<script src="https://preview.babylonjs.com/babylon.js"></script>
<script src="https://preview.babylonjs.com/gui/babylon.gui.min.js"></script>
<script src="https://preview.babylonjs.com/inspector/babylon.inspector.bundle.js"></script>
<script src="https://preview.babylonjs.com/nodeEditor/babylon.nodeEditor.js"></script>
<script src="https://preview.babylonjs.com/materialsLibrary/babylonjs.materials.min.js"></script>
<script src="https://preview.babylonjs.com/proceduralTexturesLibrary/babylonjs.proceduralTextures.min.js"></script>
<script src="https://preview.babylonjs.com/postProcessesLibrary/babylonjs.postProcess.min.js"></script>
<script src="https://preview.babylonjs.com/loaders/babylonjs.loaders.min.js"></script>
<script src="https://preview.babylonjs.com/serializers/babylonjs.serializers.min.js"></script>
<script>

export default {
  name: 'Simulation',
  props: {
    test: {one:"a",two:"a"}//should be passing values as props but don't know how yet
  },
  data() {
    return {
      userSelection: {body: "", engine: "", powerup: ""}, 
      mode: 0,
      myScene: null,
      myEntity: null,
      myBox: null,
      dornaArm: {path: '../assets/dornaRigged.glb'},
      };
  },
  methods: {
    scaleUp() {
      console.log(this.dornaArm)
    }
  },
  watch: {
    myScene() {
      // myScene is now available from the component
      // do something with it here or call a method to use it from here
    },

    dornaArm() {
      // dornaArm now available from the component
      // do something with it here or call a method to use it from here
      console.log("yo");
      console.log(this);
    },

    myBox() {
      // myBox is now available from the component
      // do something with it here or call a method to use it from here
    }
  },
  mounted() {
    this.userSelection["body"] = this.$route.query.body;
    this.userSelection["engine"] = this.$route.query.engine;
    this.userSelection["powerup"] = this.$route.query.powerup;

  }
}
</script>