// app.js
const fs = require('fs');
const http = require('http');
const { exit } = require('process');
const server = http.createServer();
let vehicle = [];

let scores = {scores: [
    {
      name: "Athena",
      body: "Car",
      powerup: "Emergency Siren",
      engine: "Nuclear Fusion",
    },
    { name: "Bella", body: "Spaceship", powerup: "Portal", engine: "Jet" },
    {
      name: "Cara",
      body: "Tank",
      powerup: "Speed Boost",
      engine: "Petrol",
    },
    {
      name: "Diana",
      body: "Car",
      powerup: "4 Wheel Drive",
      engine: "Steam",
    },
    {
      name: "Emilia",
      body: "Train",
      powerup: "Emergency Siren",
      engine: "Nuclear Fusion",
    },
    {
      name: "Felicia",
      body: "Spaceship",
      powerup: "Emergency Siren",
      engine: "Steam",
    },
    {
      name: "Gloria",
      body: "Tank",
      powerup: "Speed Boost",
      engine: "Nuclear Fusion",
    },
    {
      name: "Hadria",
      body: "Tank",
      powerup: "Portal",
      engine: "Nuclear Fusion",
    },
    {
      name: "Nelia",
      body: "Spaceship",
      powerup: "Portal",
      engine: "Nuclear Fusion",
    },
    {
      name: "Octavia",
      body: "Train",
      powerup: "4 Wheel Drive",
      engine: "Nuclear Fusion",
    },
  ]};

//How to write data to file, for later
fs.writeFile("RequestData", "aaa", function(err){if(err) console.log("error")});

server.on('request', (request, response) =>
{
    //Setting header to allow cross origin
    response.writeHead(200,
    {'Access-Control-Allow-Origin': '*',
    'Content-Type': 'text/plain',
    'Access-Control-Allow-Headers':  '*'
    });

    console.log("Request received");

    //Used for leaderboard requesting scores
    if(request.method == "GET")
    {
        console.log("Get request received");
        response.write(JSON.stringify(scores));
        response.end();
    }

    //Used for sending new scores
    else if(request.method == "POST")
    {
        console.log("Post request received");
        var badPost = false;
        //Pushing the data into an array
        request.on('data', (chunk) =>
        {
            vehicle = [];
            vehicle.push(chunk);
        }).on('end', () =>
        {
            try{
                vehicle = JSON.parse(Buffer.concat(vehicle).toString());
                //Writing data to filesystem
                fs.writeFile("RequestData", JSON.stringify(vehicle), function(err){if(err) console.log("error")}); 
                console.log(vehicle);
                if(!('body' in vehicle && 'powerup' in vehicle && 'engine' in vehicle)){
                    throw 'Invalid KEYS: ' + Object.keys(vehicle);
                }
                if(!(vehicle.body == "Car" || vehicle.body == "Spaceship" || vehicle.body == "Train" || vehicle.body == "Tank"))
                {
                    throw 'Invalid BODY: ' + vehicle.body;
                }
                if(!(vehicle.powerup == "4 Wheel Drive" || vehicle.powerup == "Emergency Siren" || vehicle.powerup == "Portal" || vehicle.powerup == "Speed Boost"))
                {
                    throw 'Invalid POWERUP: ' + vehicle.powerup;
                }
                if(!(vehicle.engine == "Steam" || vehicle.engine == "Petrol" || vehicle.engine == "Jet" || vehicle.engine == "Nuclear Fusion"))
                {
                    throw 'Invalid ENGINE: ' + vehicle.engine;
                }
            } catch (e){
                badPost = true;
                console.error(e);
            }
        });
        if(!badPost){
            response.end("Finished receiving data, Thank You!");
            //write score to file
        }

    }

});

process.on('SIGINT', function() {
    console.log("Shutting down");
    exit();
});

// Start the server on port 3000
server.listen(3000, '127.0.0.1');
console.log('Node server running on port 3000');

