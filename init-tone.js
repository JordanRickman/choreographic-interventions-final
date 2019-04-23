// ----- SETUP: ToneJS -----
let players = {};
let masterVolume = null;
let playing = false;
let heartbeatGain = null;
let pistonGain = null;
let threeVoicesWasTriggered = false;
let toneInitialized = false;

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
  } else {
    playAll();
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

  Tone.Buffer.on('load', () => {
    console.log('All buffers finished loading.');
  });
  loadSound('electricity', 'sounds/electricity-trimmed.wav', true);
  loadSound('heartbeat', 'sounds/heartbeat-12x.wav', true, player => {
    player.volume.value = -12; // Make heartbeat softer (-6Db)
    player.disconnect(0);
    heartbeatGain = new Tone.Gain().connect(masterVolume);
    player.connect(heartbeatGain);
    player.start();
  });
  loadSound('piston', 'sounds/piston-12x.wav', true, player => {
    player.disconnect(0);
    pistonGain = new Tone.Gain(0).connect(masterVolume); // start with only heartbeat
    player.connect(pistonGain);
    player.start();
  });
  loadSound('breathing', 'sounds/breathing.wav', true, player => {
	   player.volume.value = 44; // Boost by 44Db b/c the source sound is really soft.
  });
  toneInitialized = true;
}