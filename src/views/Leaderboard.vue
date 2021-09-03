<template>
  <div class="container">
    <div class="row">
      <div class="col">
        <table class="table" id="leaderTable">
          <th>Name</th>
          <th>Score</th>
          <th>Body</th>
          <th>Power-up</th>
          <th>Engine</th>
          <tr v-for="object in this.scores" :key="object.name">
            <td>{{ object.name }}</td>
            <td>{{ object.score }}</td>
            <td>{{ ["Train", "Car", "Tank", "Spaceship"][object.body] }}</td>
            <td>
              {{
                ["4 Wheel Drive", "Emergency Siren", "Portal", "Speed Boost"][
                  object.powerup
                ]
              }}
            </td>
            <td>
              {{ ["Steam", "Petrol", "Jet", "Nuclear Fusion"][object.engine] }}
            </td>
          </tr>
        </table>
      </div>
      <div class="col-2" id="options">
        <h5>Search Options</h5>
        <p class="searchHead">Body</p>
        <button v-on:click="click('body', 'Train')" id="Train">Train</button>
        <button v-on:click="click('body', 'Car')" id="Car">Car</button>
        <button v-on:click="click('body', 'Tank')" id="Tank">Tank</button>
        <button v-on:click="click('body', 'Spaceship')" id="Spaceship">Space Ship</button>
        <p class="searchHead">Powerup</p>
        <button v-on:click="click('powerup', '4 Wheel Drive')" id="4 Wheel Drive">4 Wheel Drive</button>
        <button v-on:click="click('powerup', 'Emergency Siren')" id="Emergency Siren">Emergency Siren</button>
        <button v-on:click="click('powerup', 'Portal')" id="Portal">Portal</button>
        <button v-on:click="click('powerup', 'Speed Boost')" id="Speed Boost">Speed Boost</button>
        <p class="searchHead">Engine</p>
        <button v-on:click="click('engine', 'Steam')" id="Steam">Steam</button>
        <button v-on:click="click('engine', 'Petrol')" id="Petrol">Petrol</button>
        <button v-on:click="click('engine', 'Jet')" id="Jet">Jet</button>
        <button v-on:click="click('engine', 'Nuclear Fusion')" id="Nuclear Fusion">Nuclear Fusion</button>
        <p class="searchHead">Name</p>
        <div v-on:click="text()" contenteditable="true" id="nameInput">Enter name here...</div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "Leaderboard",
  props: {},
  methods: {
    getRequest(update, repeat) {
      const url = `http://localhost:3000/"name":"${this.getReq.name}"x"body":"${this.getReq.body}"x"powerup":"${this.getReq.powerup}"x"engine":"${this.getReq.engine}"`;
      var xhr = new XMLHttpRequest();

      xhr.onreadystatechange = function () {
        if (this.readyState != 4) return;
        if (this.status == 200) {
          (this.responseText == "Re") ? repeat() : update(this.responseText);
        }
      };
      xhr.open("GET", url, true);
      xhr.setRequestHeader("Content-Type", "text/plain");
      xhr.send();
    },
    update(data) {
      this.scores = JSON.parse(data).scores; //Object: {name:, score:, body:, powerup:, engine:}
    }, 
    repeat(){
        setTimeout(() => {
          this.getRequest(this.update, this.repeat);
        }, 50);
    }
  },
  data() {
    return {
      scores: [],
      getReq: {name: "", body: "", engine: "", powerup: "" },
      click: function (param, input) {        
        var element = document.getElementById(input);
        if(element.classList.contains("pressed")){
          this.getReq[param] = "";
          element.classList.remove("pressed");
        } else {
          this.getReq[param] = input;
          let remove = function(idArray) {
            idArray.map(x => document.getElementById(x).classList.remove("pressed"));
          }
          remove({body:["Train","Car","Tank","Spaceship"], powerup:["4 Wheel Drive", "Emergency Siren", "Portal", "Speed Boost"],engine:["Steam", "Petrol", "Jet", "Nuclear Fusion"]}[param]);
          element.classList.add("pressed");
        }
        this.getRequest(this.update, this.repeat);
      },
      text: function(){
        console.log("Text clicked");
        document.getElementById("nameInput").textContent = "";
        this.getReq["name"] = "";
      }
    };
  },
  mounted() {
    this.getRequest(this.update, this.repeat);
    document.getElementById('nameInput').addEventListener('keydown', (evt) => {
      if (evt.key === "Enter") {
        evt.preventDefault();
        this.getReq["name"] = document.getElementById("nameInput").textContent;
        this.getRequest(this.update, this.repeat);
      }
});
  },
};
</script>

<style scoped>
@import "~@/components/bootstrap.css";
#leaderTable {
  font-family: Arial, Helvetica, sans-serif;
  border-collapse: collapse;
  width: 100%;
}

.searchHead{
  color:white;
}

#nameInput{
  background-color: rosybrown;
}

.pressed{
  background-color: rosybrown;
}

#options {
  background-color: blueviolet;
}

#leaderTable td,
#leaderTable th {
  border: 1px solid #ddd;
  padding: 8px;
}

#leaderTable tr:nth-child(even) {
  background-color: #f2f2f2;
}

#leaderTable tr {
  color: #000;
}

#leaderTable tr:nth-child(odd) {
  background-color: #ffffff;
}

#leaderTable tr:hover {
  background-color: #ddd;
}

#leaderTable th {
  padding-top: 12px;
  padding-bottom: 12px;
  text-align: left;
  background-color: blueviolet;
  color: white;
}
</style>