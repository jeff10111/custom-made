<template>
<div>
  {{this.userSelection["body"]}} with {{this.userSelection.engine}} engine and {{this.userSelection.powerup}} powerup
</div>
</template>

<script>
export default {
  name: 'Simulation',
  props: {
    test: {one:"a",two:"a"}//should be passing values as props but don't know how yet
  },
  data() {
    return {userSelection: {body: "", engine: "", powerup: ""}, mode: 0};
  },
  mounted() {
    this.userSelection["body"] = this.$route.query.body;
    this.userSelection["engine"] = this.$route.query.engine;
    this.userSelection["powerup"] = this.$route.query.powerup;
  }
}
</script>
