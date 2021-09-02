<template>
  <div>
    <table class="table" id="leaderTable">
      <th>Name</th>
      <th>Score</th>
      <th>Body</th>
      <th>Power-up!</th>
      <th>Engine</th>
      <tr v-for="object in this.scores" :key="object.name">
        <td>{{ object.name }}</td>
        <td>{{ object.score }}</td>
        <td>{{ ["Train", "Car", "Tank", "Spaceship"][object.body] }}</td>
        <td>{{ ["4 Wheel Drive", "Emergency Siren", "Portal", "Speed Boost"][object.powerup] }}</td>
        <td>{{ ["Steam", "Petrol", "Jet", "Nuclear Fusion"][object.engine] }}</td>
      </tr>
    </table>
  </div>
</template>

<script>
export default {
  name: "Leaderboard",
  props: {},
  methods: {
    getRequest() {
      var name = "testName";var score = 555;var vehicle = "Car"; var powerup = "Emergency Siren";var engine = "Jet";
      const url = `http://localhost:3000/"name":"${name}"x"score":"${score}"x"vehicle":"${vehicle}"x"powerup":"${powerup}"x"engine":"${engine}"`;
      var xhr = new XMLHttpRequest();
      const u = this.update;

      xhr.onreadystatechange = function () {
        if (this.readyState != 4) return;

        if (this.status == 200) {
          console.log("Response text: ", u(this.responseText));
        }
      };
      xhr.open("GET", url, true);
      xhr.setRequestHeader("Content-Type", "text/plain");
      xhr.send();
    },
    update(data) {
      console.log("hello?????" + data);
        this.scores = JSON.parse(data).scores;
        return this.scores;
    },
  },
  data() {
    return {
      something: { property: "Before Get" },
      scores: [],
      header: "Name"
    };
  },
  mounted() {
    this.getRequest();
  },
};
</script>

<style scoped>
#leaderTable {
  font-family: Arial, Helvetica, sans-serif;
  border-collapse: collapse;
  width: 100%;
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
  background-color: #FFFFFF;
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