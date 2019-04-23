
// ----- p5 setup() function -----
function setup() {
  frameRate(60);
  createCanvas(windowWidth, windowHeight);
  background(0);

  // Visuals
  initTriangles();

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
  // Heartbeat is softer, always ramp down linearly.
  heartbeatGain.gain.linearRampTo(1 - dancerPosition.progress, RAMP_INTERVAL);
  // Piston is louder, follow a curve to ramp up.
  pistonGain.gain.linearRampTo(Math.pow(dancerPosition.progress, CROSSFADE_CURVE_POWER), RAMP_INTERVAL);
}

function handleBreathing() {
  if (!players['breathing'] || jointsBuffer.length == 0)
    return; // Buffer not yet loaded.
  const player = players['breathing'];

  const distances = jointsBuffer.map(frame => {
    const jointOneX = frame[kinectron.HANDLEFT].cameraX;
    const jointOneY = frame[kinectron.HANDLEFT].cameraY;
    const jointOneZ = frame[kinectron.HANDLEFT].cameraZ;
    const jointTwoX = frame[kinectron.HEAD].cameraX;
    const jointTwoY = frame[kinectron.HEAD].cameraY;
    const jointTwoZ = frame[kinectron.HEAD].cameraZ;
    return dist(jointOneX, jointOneY, jointOneZ, jointTwoX, jointTwoY, jointTwoZ);
  });
  const avgDistance = average(distances);
  console.log(`breathing (left hand - head): ${avgDistance} meters apart`);

  if (avgDistance <= TRIGGER_DISTANCE && players['breathing'].state === 'stopped') {
    console.log('breathing ON');
	  players['breathing'].start();
  } else if (avgDistance > TRIGGER_DISTANCE && players['breathing'].state === 'started') {
    console.log('breathing OFF');
    players['breathing'].stop();
  }
}

function draw() {
  // console.log(`FPS: ${getFrameRate()}`);
  background(0);

  drawMouth();

  if ((frameCount % WINDOW_SIZE) != 0 || positions.length == 0)
    // Everything after this depends on kinect data, which we average over WINDOW_SIZE frames
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

  // handleElectricity(dancerPosition);
  handleHeartbeat(dancerPosition);
  handleBreathing(dancerPosition);

  jointsBuffer = [];
  positions = [];
}
