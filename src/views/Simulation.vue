
<template>
  <div id="renderCanvas">
    <!-- {{this.userSelection["body"]}} with {{this.userSelection.engine}} engine and {{this.userSelection.powerup}} powerup -->
    <Scene v-model="myScene">
      <Entity v-model="myEntity">
        <Box v-model="myBox"></Box>
      </Entity>
      <!-- <Asset src="../assets/dornaRigged.glb" v-model="myAssetRoot"></Asset> -->
    </Scene>
  </div>
</template>

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
      // myAssetRoot: {path: '../assets/dornaRigged.glb'},
      };
  },
  watch: {
    myScene() {
      // myScene is now available from the component
      // do something with it here or call a method to use it from here
    },

    myEntity() {
      // myEntity is now available from the component
      // do something with it here or call a method to use it from here
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