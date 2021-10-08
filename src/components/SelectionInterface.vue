<template>
<div>


<div class="container">
  <div class="row">

    <div class="col"><!-- Column for selecting-->
      <h1> Choose your components </h1>
      <div class="row selection">
        <h4> Bodies </h4>
        <InterfaceItem2 class="col-sm body" v-for="body in bodies" v-bind:key="body.id" :partName="body" v-on:send="sendText" ref="body"></InterfaceItem2>
      </div>
      <div class="row selection">
        <h4> Engines </h4>
        <InterfaceItem2 class="col-sm engine" v-for="engine in engines" v-bind:key="engine.id" :partName="engine" v-on:send="sendText" ref="engine"></InterfaceItem2>
      </div>
      <div class="row selection">
        <h4> Power-ups </h4>
        <InterfaceItem2 class="col-sm powerup" v-for="powerup in powerups" v-bind:key="powerup.id" :partName="powerup" v-on:send="sendText" ref="powerup"></InterfaceItem2>
      </div>
    </div>

    <div class="col"><!-- Column for informations-->
      <h1> Vehicle Description </h1>
      <div class="row" id="descText">
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
      <div class="row">
        <div class="column">
                <img src="../assets/Car.png" id="CarImage" width="200" hidden/>
                <img src="../assets/Tank.png" id="TankImage" width="200" hidden/>
                <img src="../assets/Spaceship.png" id="SpaceshipImage" width="200" hidden/>
                <img src="../assets/Train.png" id="TrainImage" width="200"/>

          <button id="startSimulation" @click="sendRestart">Start Simulation</button>
        </div>
      </div>
    </div>

  </div>
</div>

</div>
</template>

<script>
import InterfaceItem2 from '@/components/InterfaceItem2.vue'//../assets/name.png
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
    imageUrl: "",
    bodies: ['Train','Car','Tank','Spaceship'],
    engines: ['Steam', 'Petrol', 'Jet', 'Nuclear Fusion'],
    powerups: ['4 Wheel Drive', 'Emergency Siren','Portal','Speed Boost'],
    userSelection: {body:"Train",engine:"Steam",powerup:"4 Wheel Drive"}//
    };
  },
  methods: {
            sendRestart(){
              this.$emit('send',this.userSelection['body'], this.userSelection['engine'], this.userSelection['powerup']);
            },
            sendText: function(text) {
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
  }
}
</script>


<style scoped>
@import '~@/components/bootstrap.css';
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

</style>