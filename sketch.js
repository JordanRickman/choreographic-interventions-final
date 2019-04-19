// ----- UTILITY FUNCTIONS -----
// Average an array of numbers
function average(arr) {
  const sum = arr.reduce((total, next) => next+total);
  return sum / arr.length;
}


// ----- SETUP: KINECT -----
let kinectron = null;
let jointsBuffer = [];
let frameCount = -1; // -1 b/c increments to 0 on first run of draw();

function bodyTracked(body) {
  // console.log('bodyTracked');
  if (body.joints.some(joint => isNaN(joint.cameraX) || isNaN(joint.cameraY) || isNaN(joint.cameraZ))) {
    // TODO do we get frames with some but not all joints? If so we need to handle better
    // console.log('NaN joint, dropping frame');
    return;
  }
  jointsBuffer.push(body.joints);
}


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
    // If there's data, empty out the positions array
    positions = [];
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


// ----- SETUP: ToneJS -----
let players = {};
let masterVolume = null;
let playing = false;
const playbutton = document.getElementById('playbutton');
let heartbeatGain = null;
let pistonGain = null;
let threeVoicesWasTriggered = false;

function playAll() {
  console.log('playAll');
  instruments.forEach(instrument => instrument['player'].start());
  playing = true;
}

function stopAll() {
  console.log('stopAll');
  instruments.forEach(instrument => instrument['player'].stop());
  playing = false;
}

function toggle() {
  if (playing) {
    stopAll();
    document.getElementById('playbutton').innerHTML = 'Play All';
  } else {
    playAll();
    document.getElementById('playbutton').innerHTML = 'Stop All';
  }
}

function loadSound(label, filename, isLoop, callback) {
  new Tone.Buffer(filename, buffer => {
    console.log(`Buffer finished loading for ${filename}`);
    let player = new Tone.Player(buffer);
    player.loop = isLoop;
    player.connect(masterVolume);
    players[label] = player;
    if (callback)
      callback(player);
  });
}

function initTone() {
  Tone.context.resume(); // Start the AudioContext
  masterVolume = new Tone.Volume().toMaster();
  Tone.Master.connect(document.getElementById("multichannel-meter"));

  Tone.Buffer.on('load', () => {
    console.log('All buffers finished loading.');
    playbutton.innerHTML = 'Play All';
    playbutton.disabled = false;
    playbutton.addEventListener('click', toggle);
  });
  loadSound('three-voices', 'three-voices.mp3', true);
  loadSound('electricity', 'electricity.wav', false);
  loadSound('heartbeat', 'heartbeat-12x.wav', true, player => {
    player.disconnect(0);
    heartbeatGain = new Tone.Gain().connect(masterVolume);
    player.connect(heartbeatGain);
    player.start();
  });
  loadSound('piston', 'piston-12x.wav', true, player => {
    player.disconnect(0);
    pistonGain = new Tone.Gain(0).connect(masterVolume); // start with only heartbeat
    player.connect(pistonGain);
    player.start();
  });
  loadSound('breathing', 'breathing.wav', false, player => {
	player.volume.value = 44; // Boost by 44Db b/c the source sound is really soft.
  });

  playbutton.removeEventListener('click', initTone);
  playbutton.disabled = true;
  playbutton.innerHTML = 'Loading...';
}
// Chrome requires user interaction to start the audio context
document.getElementById('playbutton').addEventListener('click', initTone);



// ----- p5 setup() function -----
function setup() {
  // createCanvas(400, 400);
  // background(256);

  // Define and create an instance of kinectron
  kinectron = new Kinectron("10.17.201.104");
  // kinectron = new Kinectron("10.17.119.223");

  // Connect with application over peer
  kinectron.makeConnection();

  // Request all tracked bodies and pass data to your callback
  kinectron.startTrackedBodies(bodyTracked);


  // Set-up OSC communication
  // 12000 is the port number for receiving data
  // 3334 is the port number for sending data
  setupOsc(12000, 3334);
  noCursor();
}



// ----- Code for each draw() loop -----
function handleElectricity(dancerPosition) {
  if (!players['electricity'] || players['electricity'].state === 'started')
    return;

  // Max progress: happens ~once per 2 seconds
  // Min progress: happens ~once per 20 seconds
  // This function fires 6x per second at 60 FPS.
  const probability = map(dancerPosition.progress, 0, 1, 1/ (20*6), 1 / (2*6));
  if (random() > probability)
    return; // Don't fire sound
  players['electricity'].start();
}

function handleHeartbeat(dancerPosition) {
  if (!players['heartbeat'] || !players['piston'])
    return; // Buffers not yet loaded

  // Crossfade between the two "heartbeats"
  heartbeatGain.gain.linearRampTo(1 - dancerPosition.progress, RAMP_INTERVAL);
  pistonGain.gain.linearRampTo(dancerPosition.progress, RAMP_INTERVAL);
}

function handleThreeVoices(dancerPosition) {
  if (!players['three-voices'] || jointsBuffer.length == 0)
    return; // Buffer not yet loaded.
  const player = players['three-voices'];

  const distances = jointsBuffer.map(frame => {
    const jointOneX = frame[kinectron.ELBOWRIGHT].cameraX;
    const jointOneY = frame[kinectron.ELBOWRIGHT].cameraY;
    const jointOneZ = frame[kinectron.ELBOWRIGHT].cameraZ;
    const jointTwoX = frame[kinectron.KNEERIGHT].cameraX;
    const jointTwoY = frame[kinectron.KNEERIGHT].cameraY;
    const jointTwoZ = frame[kinectron.KNEERIGHT].cameraZ;
    return dist(jointOneX, jointOneY, jointOneZ, jointTwoX, jointTwoY, jointTwoZ);
  });
  const avgDistance = average(distances);
  console.log(`three-voices (right elbow-knee): ${avgDistance} meters`);
  if (player.state === 'stopped' && !threeVoicesWasTriggered && avgDistance < TRIGGER_DISTANCE) {
    console.log(`three-voices ON.`);
    // TODO figure out how to seek to where we left off
    player.start();
    threeVoicesWasTriggered = true;
  }
  if (threeVoicesWasTriggered && avgDistance >= TRIGGER_DISTANCE) {
    // Don't trigger on/off again until joints are separated and then brought back together
    threeVoicesWasTriggered = false;
  }
  if (player.state === 'started' && !threeVoicesWasTriggered && avgDistance < TRIGGER_DISTANCE) {
    console.log(`three-voices OFF.`);
    player.stop();
    threeVoicesWasTriggered = true;
  }
}

function handleBreathing() {
  if (!players['three-voices'] || jointsBuffer.length == 0)
    return; // Buffer not yet loaded.
  const player = players['three-voices'];

  const distances = jointsBuffer.map(frame => {
    const jointOneX = frame[kinectron.HANDLEFT].cameraX;
    const jointOneY = frame[kinectron.HANDLEFT].cameraY;
    const jointOneZ = frame[kinectron.HANDLEFT].cameraZ;
    const jointTwoX = frame[kinectron.HANDRIGHT].cameraX;
    const jointTwoY = frame[kinectron.HANDRIGHT].cameraY;
    const jointTwoZ = frame[kinectron.HANDRIGHT].cameraZ;
    return dist(jointOneX, jointOneY, jointOneZ, jointTwoX, jointTwoY, jointTwoZ);
  });
  const avgDistance = average(distances);
  const heights = jointsBuffer.map((frame, i) => {
    const leftHandY = frame[kinectron.HANDLEFT].cameraY;
    const rightHandY = frame[kinectron.HANDRIGHT].cameraY;
    const handsAvgY = average([leftHandY, rightHandY]);
    const headY = frame[kinectron.HEAD].cameraY;
    return handsAvgY - headY;
  });
  const avgHeight = average(heights);
  console.log(`breathing (left-right hand): ${avgDistance} meters apart, ${avgHeight} meters above head.`);

  // Note we are triggering on *greater* than TRIGGER_DISTANCE in this case
  if (avgHeight > BREATH_HAND_TRIGGER_HEIGHT && avgDistance > TRIGGER_DISTANCE && players['breathing'].state === 'stopped') {
     console.log('breathing ON');
	 players['breathing'].start();
  }
  // There is no need to handle stopping the breathing sound, because the Tone.Player does not loop.
  // However, the sound will keep repeating so long as the hands are in position.
}

function draw() {
  // console.log(`FPS: ${getFrameRate()}`);

  frameCount++;
  if ((frameCount % WINDOW_SIZE) != 0 || positions.length == 0)
    return;

  const dancerPosition = {
    x: average(positions.map(pos => pos.x)),
    y: average(positions.map(pos => pos.y))
  };
  // We care about the dancer's position along the "journey" (right -> left side of space),
  // and her deviance from the center line. Express these as fractions 0 -> 1.
  dancerPosition.progress = map(dancerPosition.x, windowWidth, 0, 0, 1);
  dancerPosition.deviance = map(abs(dancerPosition.y - windowHeight/2), 0, windowHeight/2, 0, 1);
  console.log(`x: ${dancerPosition.x}, y: ${dancerPosition.y}, progress: ${dancerPosition.progress}, deviance: ${dancerPosition.deviance}`);

  handleElectricity(dancerPosition);
  handleHeartbeat(dancerPosition);
  handleThreeVoices(dancerPosition);
  handleBreathing(dancerPosition);

  jointsBuffer = [];
  positions = [];
}
