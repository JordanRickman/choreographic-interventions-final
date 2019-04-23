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
  loadSound('electricity', 'sounds/electricity-trimmed.wav', false);
  loadSound('heartbeat', 'sounds/heartbeat-12x.wav', true, player => {
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

  playbutton.removeEventListener('click', initTone);
  playbutton.disabled = true;
  playbutton.innerHTML = 'Loading...';
}
// Chrome requires user interaction to start the audio context
document.getElementById('playbutton').addEventListener('click', initTone);