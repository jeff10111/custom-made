
//Used by the controller to send a user's score to the server
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
  


 