// ----- SETUP: POSITION TRACKING -----

// Dancer positions received over OSC. format: {x: x, y: y}
let positions = [];

// Get data from Processing sketch
// Values will return an array of comma-delimited x,y values as strings.
// e.g. ['24, 356', '973, 12', '187, 44']
function receiveOsc(address, values) {
  //console.log("received OSC: " + address + "\t" + value.length);
  // Look for messages addressed to '/centers'
  if (address == '/centers') {
    // Forget it if there's nothing
    if (values[0] == undefined) return;
    // Iterate through values array
    for (let value of values) {
      // For each value: 'x, y'... create a 2-position array
      // to store x and y separately: [x, y]
      let xy = value.split(',');
      x = int(xy[0]);
      y = int(xy[1]);
      // Turn it into an object literal
      positions.push({
        x: x,
        y: y
      });
      // console.log(`position: (${x}, ${y})`);
    }
  }
}

// Ability to send messages back to Processing
// We're not using this
function sendOsc(address, value) {
  socket.emit('message', [address].concat(value));
}

// Set-up the port number
function setupOsc(oscPortIn, oscPortOut) {
  var socket = io.connect('http://127.0.0.1:8081', {
    port: 8081,
    rememberTransport: false
  });
  socket.on('connect', function() {
    socket.emit('config', {
      server: {
        port: oscPortIn,
        host: '127.0.0.1'
      },
      client: {
        port: oscPortOut,
        host: '127.0.0.1'
      }
    });
  });
  socket.on('message', function(msg) {
    //console.log(msg);
    // msg is an array: ['/centers', '345, 56', '87, 19']
    // First item in msg array is going to be the address: '/centers'
    // Rest of message will be data values: 'x, y' positions
    receiveOsc(msg[0], msg.splice(1));
  });
}
