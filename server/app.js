// app.js
//Connecting to database
const sqlite3 = require('sqlite3');
let db = new sqlite3.Database("custom-made-db", sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
    return console.error(err.message)
  }
  console.log("successfully connected to the database");
});
//Store results of db requests for sending to clients
var selectAllString = "";
var selectWhereStrings = {};
//Creating server
const http = require('http');
const server = http.createServer();
//ctrl-c
const { exit } = require('process');

//Server request response api
server.on('request', (request, response) => {
  //Setting header to allow cross origin
  response.writeHead(200,
    {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'text/plain',
      'Access-Control-Allow-Headers': '*'
    });

  console.log("Request received");

  //Used for leaderboard requesting scores
  if (request.method == "GET") {
    var string = request.url.slice(1,request.url.length);
    string = `{${string.replace(/%20/g, " ").replace(/x/g, ", ").replace(/%22/g, "\"")}}`;
    console.log("Get request received");
    try {
      string = JSON.parse(string);
    } catch (e) {
      console.error(e);
    }
    console.log(string);
    response.write(selectAllString);
    response.end();
  }

  //Used for sending new scores
  else if (request.method == "POST") {
    console.log("Post request received");
      var badPost = false;
      var vehicle = [];

    request.on('data', (chunk) => {
      vehicle.push(chunk);
    }).on('end', () => {
      try {
        vehicle = JSON.parse(Buffer.concat(vehicle).toString());
        //todo make sure name is submitted, make sure score is submitted as number, convert body/engine/powerup to ints
        if (!('body' in vehicle && 'powerup' in vehicle && 'engine' in vehicle && 'name' in vehicle && 'score' in vehicle)) {
          throw 'Invalid KEYS: ' + Object.keys(vehicle);
        }
        if (!(vehicle.body == "Car" || vehicle.body == "Spaceship" || vehicle.body == "Train" || vehicle.body == "Tank")) {
          throw 'Invalid BODY: ' + vehicle.body;
        }
        if (!(vehicle.powerup == "4 Wheel Drive" || vehicle.powerup == "Emergency Siren" || vehicle.powerup == "Portal" || vehicle.powerup == "Speed Boost")) {
          throw 'Invalid POWERUP: ' + vehicle.powerup;
        }
        if (!(vehicle.engine == "Steam" || vehicle.engine == "Petrol" || vehicle.engine == "Jet" || vehicle.engine == "Nuclear Fusion")) {
          throw 'Invalid ENGINE: ' + vehicle.engine;
        }
        if (isNaN(parseInt(vehicle.score))) {
          throw 'Invalid SCORE: ' + vehicle.score;
        }
        if (vehicle.name.replace(/[^0-9a-zA-Z]/g, '').length < 1) {
          throw "Invalid NAME: " + vehicle.name;
        }
      } catch (e) {
        badPost = true;
        console.error(e);
      }
      if (!badPost) {
        dbInsert(
          parseInt(vehicle.score),
          vehicle.name.replace(/[^0-9a-zA-Z]/g, '').slice(0,20),
          (vehicle.body == "Train") ? 0 : (vehicle.body == "Car") ? 1 : (vehicle.body == "Tank") ? 2 : 3,
          (vehicle.powerup == "4 Wheel Drive") ? 0 : (vehicle.powerup == "Emergency Siren") ? 1 : (vehicle.powerup == "Portal") ? 2 : 3,
          (vehicle.engine == "Steam") ? 0 : (vehicle.engine == "Petrol") ? 1 : (vehicle.engine == "Jet") ? 2 : 3,
        );
        console.log("Completed Database Insertion");
        selectAll();
        response.end("Finished receiving data, Thank You!");
      }
    });
  }

});

process.on('SIGINT', function () {
  console.log("Shutting down");
  //do any clean up here
  db.close();
  exit();
});

function dbInsert(score, name, body, powerup, engine) {
  db.run(`INSERT INTO leaderboard (score, name, body, powerup, engine) VALUES (${score}, "${name}", ${body}, ${powerup}, ${engine})`);
}

function selectAll() {
  let sql = `SELECT * FROM leaderboard ORDER BY score DESC LIMIT 10`;
  var scores = {scores: []};
  db.all(sql, (err, rows) => {
    if(err)
      return console.error(err.message);
    rows.forEach((row) => {
      scores.scores.push({name:row.name, body:row.body, engine:row.engine, powerup:row.powerup, score:row.score});
    });
    selectAllString = JSON.stringify(scores);
  });
}

function selectWhere(values) {
  //values = {body: "", powerup: "", engine: ""}
  var scores = {scores: []};
  if(!("body" in values || "powerup" in values || "engine" in values)){
    selectAll();
    return;
  }
  values = 
  {
    body: ["Train", "Car", "Tank", "Spaceship"].findIndex(x => x == values.body),
    powerup: ["4 Wheel Drive", "Emergency Siren", "Portal", "Speed Boost"].findIndex(x => x == values.powerup),
    engine: ["Steam", "Petrol", "Jet", "Nuclear Fusion"].findIndex(x => x == values.engine)
  }

  let sql = `SELECT * FROM leaderboard WHERE`;
  if(values.body != -1){
    sql += ` body = ${values.body}`;
  }
  if(values.powerup != -1){
    if (sql.slice(sql.length-5,sql.length) != "WHERE") {
      sql +=  ` AND`
    }
    sql += ` powerup = ${values.powerup}`;
  }
  if(values.engine != -1){
    if (sql.slice(sql.length-5,sql.length) != "WHERE") {
      sql +=  ` AND`
    }
    sql += ` engine = ${values.engine}`;
  }
  sql += `;`;
  db.all(sql, (err, rows) => {
    rows.forEach((row) => {
      scores.scores.push({name:row.name, body:row.body, engine:row.engine, powerup:row.powerup, score:row.score});
    });
    selectWhereStrings[values.body.toString() + values.powerup.toString() + values.engine.toString()] = JSON.stringify(scores);
  });
}

// Start the server on port 3000
server.listen(3000, '127.0.0.1');
console.log('Node server running on port 3000');
selectAll();
//selectWhere({body: "Train", powerup: "", engine: ""});
