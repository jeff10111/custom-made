let recording = true;
let lastTime = 0;

export function sendScoreToServer(name, score, vehicle, powerup, engine) {
    const url = `http://localhost:3000/LOL`;
    var xhr = new XMLHttpRequest();
  
    xhr.onreadystatechange = function() {
      if (this.readyState != 4) return;
  
      if (this.status == 200) {
        console.log(this.responseText);
      }
    };
  
    xhr.open("POST", url, true);
    xhr.setRequestHeader('Content-Type', 'text/plain');
    xhr.send(JSON.stringify({
      name: name, score: score, body: vehicle, powerup: powerup, engine: engine,
    }));
  }
  
function vehicleToServer(data){
      const url = `http://localhost:3000/SCORE`;
      var xhr = new XMLHttpRequest();
  
      xhr.onreadystatechange = function() {
        if (this.readyState != 4) return;
    
        if (this.status == 200) {
          console.log(this.responseText);
        }
      };
      xhr.open("POST", url, true);
      xhr.setRequestHeader('Content-Type', 'text/plain');
      xhr.send(JSON.stringify(data));
  }

  export function stopRecording(){
    recording = false;
  }

  export async function startRecording(vehicle){
    var coords;
    var rotation;
    lastTime = new Date().getTime();
    while(recording == true){
      if(new Date().getTime() >= lastTime + 100){
        coords = vehicle.meshes.body.position;
        rotation = vehicle.meshes.body.rotationQuaternion;
        vehicleToServer(`vehicle:{coords:${coords}, rotation:${rotation}}`);
      }
    }
  }

 