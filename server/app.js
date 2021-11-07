/* app.js
* Two uses are implemented on the server
* 1. Respond to get requests for leaderboard data
* 2. Recieve post request, write new leaderboard entry
* This uses http get/post and SQLite database
*/

//Connecting to database
const fs = require('fs');
const sqlite3 = require('sqlite3');
const http = require('http');
//Opening DB and creating database object
let db = new sqlite3.Database("custom-made-db", sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
    return console.error(err.message)
  }
  console.log("successfully connected to the database");
});
//Valid options (to compare when user makes a request)
var validBodies = {"Train":0,"Car":1,"Tank":2,"Spaceship":3};
var validPowerups = {"4 Wheel Drive":0, "Emergency Siren":1, "Portal":2, "Speed Boost":3};
var validEngines = {"Steam":0, "Petrol":1, "Jet":2, "Nuclear Fusion":3};

//Store results of db requests for sending to clients
//This is a caching system
//I couldn't get the server to wait for the database to return an answer,
//So the first request causes the result to be cached, the server tells the client to resend the request, 
//Client resends the request, server sends cached result to client
var selectAllString = "";//Store select all response here to send to clients
var selectWhereStrings = {};//Key:Response pair

//Creating server
const server = http.createServer();
//ctrl-c
const { exit } = require('process');
//Array to store bad words in
var badWords = [];

//Server request response api
server.on('request', (request, response) => {
  //Setting header to allow cross origin
  response.writeHead(200,
    {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'text/plain',
      'Access-Control-Allow-Headers': '*'
    });

  //Used for leaderboard requesting scores
  if (request.method == "GET") {
    var string = request.url.slice(1,request.url.length);
    if(string.length == 0)
    {
      response.write(selectAllString);
    }
    else {
      //Select where object -> {name:, body:, engine:, powerup:,}
      //Transforming the url into potentially valid json
      string = `{${string.replace(/%20/g, " ").replace(/x/g, ", ").replace(/%22/g, "\"")}}`;
      //Parsing the json string into JSON object
      try {
        string = JSON.parse(string);
        if("name" in string){
           string.name.replace(/[^0-9a-zA-Z]/g, '').slice(0,20);
        }
      } catch (e) {
        console.error(e);
        return;
      }

      //Generating key for cache:
      var key = (string["name"] || "X").toString() + (string["body"] || "X").toString() + (string["engine"] || "X").toString() + (string["powerup"] || "X").toString();
      //The keys are empty
      if(key == "XXXX")
      {
        response.write(selectAllString);
      }
      //response is already cached - return it
      else if(selectWhereStrings[key] != undefined){
        response.write(selectWhereStrings[key])
      //Response has not been cached - tell the client to request again, update cache
      } else {
        response.write("Re");
        selectWhere(string, key);
      }
    }
    response.end();
  }
  //Used for sending new scores
  else if (request.method == "POST") {

    var badPost = false;//set to true if post violates any rules
    var vehicle = [];//store the response here

    request.on('data', (chunk) => {
      vehicle.push(chunk);
    }).on('end', () => {
      try {

        vehicle = JSON.parse(Buffer.concat(vehicle).toString());//tries to convert post to JSON
        vehicle.name.replace(/[^0-9a-zA-Z]/g, '').slice(0,20);//Only allows alphanumeric characters, maximum length of 20

        //Validates that all the required keys are in the object and no additional keys are included
        if (!('body' in vehicle && 'powerup' in vehicle && 'engine' in vehicle && 'name' in vehicle && 'score' in vehicle && Object.keys(vehicle).length == 5)) {
          throw 'Invalid KEYS: ' + Object.keys(vehicle);
        }
        //Validates the values for body, powerup and engine
        if (validBodies[vehicle.body] == undefined) {
          throw 'Invalid BODY: ' + vehicle.body;
        }
        if (validPowerups[vehicle.powerup] == undefined) {
          throw 'Invalid POWERUP: ' + vehicle.powerup;
        }
        if (validEngines[vehicle.engine] == undefined) {
          throw 'Invalid ENGINE: ' + vehicle.engine;
        }
        //Validates the score is a number
        if (isNaN(parseInt(vehicle.score))) {
          throw 'Invalid SCORE: ' + vehicle.score;
        }
        //Valides the name is at least one character, and doesn't include a bad word
        if (vehicle.name.length < 1 || badWords.some((x) => vehicle.name.toLowerCase().includes(x))) {
          throw "Invalid NAME: " + vehicle.name;
        }
      } catch (e) {
        badPost = true;//If it's a bad post nothing happens
        console.error(e);
      }
      //if the post is good then an entry is inserted into the database
      if (!badPost) {
        console.log("Inserting user: " + vehicle.name);
        dbInsert(
          parseInt(vehicle.score),
          vehicle.name,
          validBodies[vehicle.body],
          validPowerups[vehicle.powerup],
          validEngines[vehicle.engine],
        );
        console.log("Completed Database Insertion");
        selectAll();//updates the cache for select all to make sure it's valid
        response.end("Finished receiving data, Thank You!");
      }
    });
  }

});

//Cleanly shut down
process.on('SIGINT', function () {
  console.log("Shutting down");
  //do any clean up here
  db.close();
  exit();
});

//query string, all the values are already validated
function dbInsert(score, name, body, powerup, engine) {
  db.run(`INSERT INTO leaderboard (score, name, body, powerup, engine) VALUES (${score}, "${name}", ${body}, ${powerup}, ${engine})`);
}

//Updates select all cache
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

//Updates selectWhere cache
//Values parameter is an object with key:value pairs
//key represents the query and is used to store the db response in the cache
function selectWhere(values, key) {//Expects words as values, not numbers which are stored in the database
  //values = {body: "", powerup: "", engine: ""}
  var scores = {scores: []};
  //None of the keys are valid - these keys should exist even if the value is an empty string
  if(!("body" in values || "powerup" in values || "engine" in values)){
    return;
  }
  //Converting the strings to ints (as the database has)
  values = 
  {
    body: ["Train", "Car", "Tank", "Spaceship"].findIndex(x => x == values.body),
    powerup: ["4 Wheel Drive", "Emergency Siren", "Portal", "Speed Boost"].findIndex(x => x == values.powerup),
    engine: ["Steam", "Petrol", "Jet", "Nuclear Fusion"].findIndex(x => x == values.engine),
    name: (values.name != undefined && values.name != "") ? values.name : -1,
  }
  //None of the values are valid -> findIndex() returns -1 if not found
  if(values.body + values.powerup + values.engine + values.name == -4)
  {
    return;
  }

  //Creating the query string
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
  if(values.name != -1){
    if (sql.slice(sql.length-5,sql.length) != "WHERE") {
      sql +=  ` AND`
    }
    sql += ` name = "${values.name}"`;
  }
  sql += ` ORDER BY score DESC LIMIT 10;`;
  console.log("SQL QUERY IS: " + sql)
  db.all(sql, (err, rows) => {
    rows.forEach((row) => {
      scores.scores.push({name:row.name, body:row.body, engine:row.engine, powerup:row.powerup, score:row.score});
    });
    selectWhereStrings[key] = JSON.stringify(scores);
    console.log(JSON.stringify(scores));
  });
}

//Load bad words list. I got the list from:
// https://github.com/LDNOOBW/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words
fs.readFile('bannedWords.txt', 'utf8', function (err,data) {
  if (err) {
    return console.log(err);
  }
  badWords = data.split('\n').map(x => x.slice(0,x.length-1));
});

// Start the server on port 3000
server.listen(3000, '127.0.0.1');
console.log('Node server running on port 3000');
//Preload result into cache
selectAll();

