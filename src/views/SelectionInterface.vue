<template>
<div>
<router-link :to="'/simulation?body=' + userSelection.body + '&powerup=' + userSelection.powerup + '&engine=' + userSelection.engine">
Start Simulation</router-link>

<div class="container">
  <div class="row">

    <div class="col"><!-- Column for selecting-->
    <h1> Choose your components </h1>
      <div class="row">
        <InterfaceItem2 class="col-sm body" v-for="body in bodies" v-bind:key="body.id" :partName="body" v-on:send="sendText" ref="body"></InterfaceItem2>
      </div>
      <div class="row">
        <InterfaceItem2 class="col-sm engine" v-for="engine in engines" v-bind:key="engine.id" :partName="engine" v-on:send="sendText" ref="engine"></InterfaceItem2>
      </div>
      <div class="row">
        <InterfaceItem2 class="col-sm powerup" v-for="powerup in powerups" v-bind:key="powerup.id" :partName="powerup" v-on:send="sendText" ref="powerup"></InterfaceItem2>
      </div>
    </div>

    <div class="col"><!-- Column for informations-->
      <p>{{this.userSelection}}</p>
    </div>

  </div>
</div>

</div>
</template>

<script>
import InterfaceItem2 from '@/components/InterfaceItem2.vue'
export default {
  name: 'SelectionInterface',
  components: {
    InterfaceItem2
  },
  props: {
    aaa: String
  },
  data() {
    return {count: 0, body: 0, powerup:0, engine: 0, credits: 100,
    bodies: ['Train','Car','Tank','Spaceship'],
    engines: ['Steam', 'Petrol', 'Jet', 'Nuclear Fusion'],
    powerups: ['4 Wheel Drive', 'Emergency Siren','Portal','Speed Boost'],
    userSelection: {body:"Train",engine:"Steam",powerup:"Portal"}//
    };
  },
  methods: {
            sendText: function(text) {
              if(this.bodies.indexOf(text) >=0)
              {
                this.$refs.body.map(x => x.reset());
                this.userSelection["body"] = text;
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
  }
}
</script>


<style>
@import '~@/components/bootstrap.css';
.col-sm {margin-bottom: 10px;} 
h1{margin-bottom: 10px;}
</style>