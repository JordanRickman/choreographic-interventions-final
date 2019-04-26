let manualOverrideX;
let manualOverrideY;
let isManualOverride;

function setup() {
  frameRate(60);
  createCanvas(windowWidth, windowHeight);
  background(0);

  isManualOverride = false;
  manualOverrideX = 0;
  manualOverrideY = SCREEN_HEIGHT / 2;

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
function handleShockSound() {
  if (!players['electricity'])
    return; // Buffer not loaded yet.

  if (frameCount - lastShockFrame < WINDOW_SIZE && players['electricity'].state === 'stopped') {
    players['electricity'].start();
  } else if (frameCount - lastShockFrame >= WINDOW_SIZE && players['electricity'].state === 'started') {
    players['electricity'].stop();
  }
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


// On right (later) half of the screen, we shock once when she leaves the mouth,
// then we don't (at least, on that half of the screen)
let didShockOnsecondHalf = false;

function shouldWeShock(dancerPosition) {
  if (dancerPosition.deviance < SAFE_CENTER_PATH_HEIGHT_PROPORTION) {
    // There is a safe path across the center of the screen.
    return false;
  }
  const pixelValue = get(dancerPosition.x, dancerPosition.y);
  if (pixelValue[0] > 0) {
    // We are within the mouth, don't shock
    return false;
  }

  // On right (later) half of the screen, we shock once when she leaves the mouth,
  // then we don't (at least, on that half of the screen)
  if (dancerPosition.progress > 0.5 && !didShockOnsecondHalf) {
    didShockOnsecondHalf = true;
    return true;
  } else if (dancerPosition.progress > 0.5) {
    return false;
  }

  // Process of elimination: we are on left half of screen, but outside eye or safe path.
  return true;
}

let lastShockFrame = -1; // Special value -1 indicates no shock yet.
function draw() {
  // console.log(`FPS: ${getFrameRate()}`);
  background(0);

  drawMouth();

  if ((frameCount % WINDOW_SIZE) != 0 || (positions.length == 0 && !isManualOverride))
    // Everything after this depends on kinect data, which we average over WINDOW_SIZE frames
    return;

  const dancerPosition = isManualOverride?
    {
      x: manualOverrideX,
      y: manualOverrideY
    }
  :
    {
      x: average(positions.map(pos => pos.x)),
      y: average(positions.map(pos => pos.y))
    };
  // We care about the dancer's position along the "journey" (right -> left side of space),
  // and her deviance from the center line. Express these as fractions 0 -> 1.
  dancerPosition.progress = map(dancerPosition.x, 0, SCREEN_WIDTH, 0, 1);
  dancerPosition.deviance = map(abs(dancerPosition.y - SCREEN_HEIGHT/2), 0, SCREEN_HEIGHT/2, 0, 1);
  console.log(`x: ${dancerPosition.x}, y: ${dancerPosition.y}, progress: ${dancerPosition.progress}, deviance: ${dancerPosition.deviance}`);

  if (shouldWeShock(dancerPosition)) {
    lastShockFrame = frameCount;
  }

  handleShockSound();
  handleHeartbeat(dancerPosition);
  handleBreathing(dancerPosition);

  jointsBuffer = [];
  positions = [];
}

// Chrome requires user interaction to start the audio context
function mouseClicked() {
  if (!toneInitialized)
    initTone();
}

function keyReleased() {
  // console.log(`Key: ${key}, keyCode: ${keyCode}`);
  if (keyCode === 189) { // Minus
    if (masterVolume) {
      masterVolume.volume.linearRampTo(masterVolume.volume.value - 2, 0.1);
      console.log(`Volume: ${masterVolume.volume.value - 2}`);
    }
  } else if (keyCode === 187) { // Plus
    if (masterVolume) {
      masterVolume.volume.linearRampTo(masterVolume.volume.value + 2, 0.1);
      console.log(`Volume: ${masterVolume.volume.value + 2}`);
    }
  } else if (key === 'M') {
    isManualOverride = !isManualOverride;
    console.log(`Manual Override: ${isManualOverride}, x: ${manualOverrideX}, y: ${manualOverrideY}`);
  } else if (keyCode === UP_ARROW) {
    manualOverrideY -= SCREEN_HEIGHT * MANUAL_Y_STEP_SIZE; // Minus b/c towards top of screen.
    manualOverrideY = constrain(manualOverrideY, 0, SCREEN_HEIGHT);
    console.log(`Manual Override: ${isManualOverride}, x: ${manualOverrideX}, y: ${manualOverrideY}`);
  } else if (keyCode === DOWN_ARROW) {
    manualOverrideY += SCREEN_HEIGHT * MANUAL_Y_STEP_SIZE; // Plus b/c towards bottom of screen.
    manualOverrideY = constrain(manualOverrideY, 0, SCREEN_HEIGHT);
    console.log(`Manual Override: ${isManualOverride}, x: ${manualOverrideX}, y: ${manualOverrideY}`);
  } else if (keyCode === LEFT_ARROW) {
    manualOverrideX -= SCREEN_WIDTH * MANUAL_X_STEP_SIZE;
    manualOverrideX = constrain(manualOverrideX, 0, SCREEN_WIDTH);
    console.log(`Manual Override: ${isManualOverride}, x: ${manualOverrideX}, y: ${manualOverrideY}`);
  } else if (keyCode === RIGHT_ARROW) {
    manualOverrideX += SCREEN_WIDTH * MANUAL_X_STEP_SIZE;
    manualOverrideX = constrain(manualOverrideX, 0, SCREEN_WIDTH);
    console.log(`Manual Override: ${isManualOverride}, x: ${manualOverrideX}, y: ${manualOverrideY}`);
  }
}
