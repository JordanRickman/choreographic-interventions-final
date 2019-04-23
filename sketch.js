
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

let frameCount = -1; // -1 b/c increments to 0 on first run of draw();
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
  handleBreathing(dancerPosition);

  jointsBuffer = [];
  positions = [];
}
