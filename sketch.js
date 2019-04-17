// CONFIGURATION CONSTANTS
const WINDOW_SIZE = 10; // Frames
const RAMP_INTERVAL = 0.01; // Seconds
const TRIGGER_DISTANCE = 0.4; // Meters
const GRID_CHANNELS_WIDTH = 2;
const GRID_CHANNELS_HEIGHT = 2;
const MAX_LEFT_RIGHT_DISTANCE = 1; // Meters away from origin (center)
const MIN_FRONT_BACK_DISTANCE = 2; // Meters
const MAX_FRONT_BACK_DISTANCE = 6; // Meters
const MAX_JOINT_DISTANCE = 1; // Meters
const ROOM_CENTER_Z = 2.5; // Meters to center of space from kinect

let kinectron = null;
let jointsBuffer = [];
let frameCount = -1; // -1 b/c increments to 0 on first run of draw();

let playing = false;
let out = new Tone.MultiChannelOutput(4);
// const out = new Tone.GridMultiChannelOutput(GRID_CHANNELS_WIDTH, GRID_CHANNELS_HEIGHT);
out.connect(document.getElementById("multichannel-meter"));
let panner = new Tone.MultiChannelPanner(4);
// const panner = new Tone.GridPanner(GRID_CHANNELS_WIDTH, GRID_CHANNELS_HEIGHT);
panner.connect(out);
const masterVolume = new Tone.Volume();
masterVolume.connect(panner);

let instruments = [];
function addSound(name, filename, jointOne, jointTwo, isLoop, isDistanceBased) {
  new Tone.Buffer(filename, buffer => {
    console.log(`Buffer finished loading for ${filename}`);
    let player = new Tone.Player(buffer);
    player.loop = isLoop;
    let fader = null;
    if (isDistanceBased) {
      fader = new Tone.Gain(0).connect(masterVolume);
      player.connect(fader);
      player.start();
    } else {
      player.connect(masterVolume);
    }
    instruments.push({
      'name': name,
      'filename': filename,
      'player': player,
      'fader': fader,
      'jointOne': jointOne,
      'jointTwo': jointTwo,
      'isLoop': isLoop,
      'on': false,
      'isDistanceBased': isDistanceBased,
      'wasTriggerDistance': false
    });
  });
}
Tone.Buffer.on('load', () => {
  console.log('All buffers finished loading.');
  const playbutton = document.getElementById('playbutton');
  playbutton.innerHTML = 'Play All';
  playbutton.disabled = false;
  playbutton.addEventListener('click', toggle);
});
function loadSounds() {
  addSound('three-voices', 'three-voices.mp3', kinectron.ELBOWRIGHT, kinectron.KNEERIGHT, true, false);
  addSound('cracking-knuckles', 'cracking-knuckles.wav', kinectron.HANDLEFT, kinectron.FOOTLEFT, true, false);
  addSound('electricity', 'electricity.wav', kinectron.HEAD, kinectron.HANDLEFT, true, true);
  Tone.context.resume(); // Start the AudioContext
  // TODO More sounds
  const playbutton = document.getElementById('playbutton');
  playbutton.removeEventListener('click', loadSounds);
  playbutton.disabled = true;
  playbutton.innerHTML = 'Loading...';
}
// Chrome requires user interaction to start the audio context, without which we can't load the Buffers
document.getElementById('playbutton').addEventListener('click', loadSounds);

function play() {
  console.log('playAll');
  instruments.forEach(instrument => instrument['player'].start());
  playing = true;
}

function stop() {
  console.log('stopAll');
  instruments.forEach(instrument => instrument['player'].stop());
  playing = false;
}

function toggle() {
  if (playing) {
    stop();
    document.getElementById('playbutton').innerHTML = 'Play All';
  } else {
    play();
    document.getElementById('playbutton').innerHTML = 'Stop All';
  }
}

function bodyTracked(body) {
  // console.log('bodyTracked');
  if (body.joints.some(joint => isNaN(joint.cameraX) || isNaN(joint.cameraY) || isNaN(joint.cameraZ))) {
    // TODO do we get frames with some but not all joints? If so we need to handle better
    // console.log('NaN joint, dropping frame');
    return;
  }
  jointsBuffer.push(body.joints);
}

function setup() {
  createCanvas(400, 400);
  background(256);

  // Define and create an instance of kinectron
  // kinectron = new Kinectron("10.17.201.104");
  kinectron = new Kinectron("10.17.119.223");
  // kinectron = new Kinectron("127.0.0.1");

  // Connect with application over peer
  kinectron.makeConnection();

  // Request all tracked bodies and pass data to your callback
  kinectron.startTrackedBodies(bodyTracked);
}


function average(arr) {
  const sum = arr.reduce((total, next) => next+total);
  return sum / arr.length;
}

function computeTheta(x, y) {
	if (x > 0) {
		return Math.atan(y / x);
	} else if (x < 0) {
		return Math.atan(x / y) + Math.PI;
	} else if (y < 0) { // Vertical line down
		return 3*Math.PI / 2;
	} else { // Vertical line up
		return Math.PI / 2;
	}
}

function draw() {
  frameCount++;
  if ((frameCount % WINDOW_SIZE) != 0 || jointsBuffer.length == 0)
    return;

  instruments.forEach(instrument => {
    const distances = jointsBuffer.map(frame => {
      const jointOneX = frame[instrument['jointOne']].cameraX;
      const jointOneY = frame[instrument['jointOne']].cameraY;
      const jointTwoX = frame[instrument['jointTwo']].cameraX;
      const jointTwoY = frame[instrument['jointTwo']].cameraY;
      return dist(jointOneX, jointOneY, jointTwoX, jointTwoY);
    });
    const avgDistance = average(distances);
    console.log(`${instrument['name']}: ${avgDistance} meters`);
    if (instrument['isDistanceBased']) {
      const gain = map(avgDistance, MAX_JOINT_DISTANCE, 0, 0, 1);
      instrument['fader'].gain.exponentialRampTo(gain, RAMP_INTERVAL);
      return;
    }
    if (!instrument['on'] && !instrument['wasTriggerDistance'] && avgDistance < TRIGGER_DISTANCE) {
      console.log(`${instrument['name']} on.`);
      if (!instrument['isLoop']) {
        // For non-looping sound effects, start over at beginning
        instrument['player'].restart();
      } else {
        // Otherwise, pick up where we left off
        // TODO does that work with Tone.Player()?
        instrument['player'].start();
      }
      instrument['on'] = instrument['wasTriggerDistance'] = true;
    }
    if (instrument['wasTriggerDistance'] && avgDistance >= TRIGGER_DISTANCE) {
      // Don't trigger on/off again until joints are separated and then brought back together
      instrument['wasTriggerDistance'] = false;
    }
    if (instrument['on'] && !instrument['wasTriggerDistance'] && avgDistance < TRIGGER_DISTANCE) {
      console.log(`${instrument['name']} off.`);
      instrument['player'].stop();
      instrument['wasTriggerDistance'] = true;
      instrument['on'] = false;
    }
  });

  const avgX = average(jointsBuffer.map(frame => frame[kinectron.SPINESHOULDER].cameraX));
  const avgZ = average(jointsBuffer.map(frame => frame[kinectron.SPINESHOULDER].cameraZ)) - 1.8;


  const theta = computeTheta(avgX, avgZ);
  // Theta: 0 to 2PI radians; far right -> far right. Panner settings: -1 to 1s, back -> back
  const pannerSetting = map(theta, 2*Math.PI, 0, -1, 1);
  console.log(`x: ${avgX}, z: ${avgZ}, theta: ${theta}, pan: ${pannerSetting}`);
  panner.pan.linearRampTo(pannerSetting, RAMP_INTERVAL);

  // ---- Show theta on a circle ----
  background(256);
  // The circle
  strokeWeight(1);
  stroke(0);
  noFill();
  ellipse(200, 200, 390);
  // A marker for theta
  noStroke();
  fill('red');
  const markerX = 200 + (390/2) * cos(theta);
  const markerY = 200 + (390/2) * sin(theta);
  ellipse(markerX, markerY, 8);


  /*
  const panLeftRight = constrain(map(avgX, -MAX_LEFT_RIGHT_DISTANCE, MAX_LEFT_RIGHT_DISTANCE, -1, 1), -1, 1);
  const panFrontBack = constrain(map(avgZ, -MAX_FRONT_BACK_DISTANCE, MAX_FRONT_BACK_DISTANCE, -1, 1), -1, 1);
  console.log(`avgX: ${avgX}, avgZ: ${avgZ}, panLeftRight: ${panLeftRight}, panFrontBack: ${panFrontBack}`);
  // panner.panX.linearRampTo(panLeftRight, RAMP_INTERVAL);
  // panner.panY.linearRampTo(panFrontBack, RAMP_INTERVAL);
  panner.pan.linearRampTo(panLeftRight, RAMP_INTERVAL);
  */

  jointsBuffer = [];
}
