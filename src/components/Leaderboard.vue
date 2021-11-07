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
          <tr v-for="object in this.scores" :key="object.name+1">
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
        <div class="row">
          <h5>Search Options</h5>
          <p class="searchHead">Body</p>
          <button v-on:click="click('body', 'Train')" id="Train">Train</button>
          <button v-on:click="click('body', 'Car')" id="Car">Car</button>
          <button v-on:click="click('body', 'Tank')" id="Tank">Tank</button>
          <button v-on:click="click('body', 'Spaceship')" id="Spaceship">Space Ship</button> 
        </div>
        <div class="row">
        <p class="searchHead">Powerup</p>
        <button v-on:click="click('powerup', '4 Wheel Drive')" id="4 Wheel Drive">4 Wheel Drive</button>
        <button v-on:click="click('powerup', 'Emergency Siren')" id="Emergency Siren">Emergency Siren</button>
        <button v-on:click="click('powerup', 'Portal')" id="Portal">Portal</button>
        <button v-on:click="click('powerup', 'Speed Boost')" id="Speed Boost">Speed Boost</button>          
        </div>
        <div class="row">
        <p class="searchHead">Engine</p>
        <button v-on:click="click('engine', 'Steam')" id="Steam">Steam</button>
        <button v-on:click="click('engine', 'Petrol')" id="Petrol">Petrol</button>
        <button v-on:click="click('engine', 'Jet')" id="Jet">Jet</button>
        <button v-on:click="click('engine', 'Nuclear Fusion')" id="Nuclear Fusion">Nuclear Fusion</button>          
        </div>
        <div class="row">
          <p class="searchHead">Name</p>
          <div v-on:click="text()" contenteditable="true" id="nameInput">Enter name here...</div>
          <button v-on:click="enterName()" id="name">Enter</button>          
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "Leaderboard",
  props: {},
  methods: {
    //update and repeat parameters are both functions
    //The server responds with "Re" to tell the client to re-send the request
    //In that situation, the client calls the repeat() function
    //Otherwise, it calls update(data) where data is the response from the server
    //
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
    //overwrites the leaderboard object with new data
    update(data) {
      this.scores = JSON.parse(data).scores; //Object: {name:, score:, body:, powerup:, engine:}
    }, 
    //waits 50ms then resends the request
    repeat(){
        setTimeout(() => {
          this.getRequest(this.update, this.repeat);
        }, 50);
    }
  },
  data() {
    return {
      scores: [],//store the response from server here
      getReq: {name: "", body: "", engine: "", powerup: "" },//sent to server based on user selection
      //Event called when user clicks a button
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
      //event called when user clicks in text box (where they enter their name)
      text: function(){
        console.log("Text clicked");
        document.getElementById("nameInput").textContent = "";
        this.getReq["name"] = "";
        this.getRequest(this.update, this.repeat);
      },
      //User name sent to server
      enterName: function(){
        let n = (x) => x == "Enter name here..." ? "" : x;
        this.getReq["name"] = n(document.getElementById("nameInput").textContent);
        this.getRequest(this.update, this.repeat);
      }
    };
  },
  mounted() {
    //immediately request from server on page load
    this.getRequest(this.update, this.repeat);
    document.getElementById('nameInput').addEventListener('keydown', (evt) => {
      console.log(evt.key);
      //detect user entering their name
      if (evt.key === "Enter") {
        evt.preventDefault();
        this.enterName();
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
  margin: 0em;
}

#nameInput{
  background-color: rosybrown;
}

.pressed{
  background-color: rosybrown;
}

#options {
  background-color: blueviolet;
  padding: 1em;
  border: 1px solid white;
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

#name{
  margin:0.2em 0em 0em 0em;
}

</style>