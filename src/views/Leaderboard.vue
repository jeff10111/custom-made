<template>
  <div>
    <table class="table" id="leaderTable">
      <th>Name</th>
      <th>Body</th>
      <th>Power-up</th>
      <th>Engine</th>
      <tr v-for="object in this.scores" :key="object.name">
        <td>{{ object.name }}</td>
        <td>{{ object.body }}</td>
        <td>{{ object.powerup }}</td>
        <td>{{ object.engine }}</td>
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
      const url = "http://localhost:3000/example+url";
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
        this.scores = JSON.parse(data).scores;
        return this.scores;
    },
  },
  data() {
    return {
      something: { property: "Before Get" },
      scores: [
        {
          name: "Athena",
          body: "Car",
          powerup: "Emergency Siren",
          engine: "Nuclear Fusion",
        }
      ],
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