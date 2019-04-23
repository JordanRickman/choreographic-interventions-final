// ----- KINECT -----

// Number of frames (draw() loop @ 60fps) over which position and joints are averaged.
const WINDOW_SIZE = 10;

// When two joints get closer together than this distance (meters), trigger associated sound
const TRIGGER_DISTANCE = 0.3;

// Distance above the head (meters) at which the hands begin triggering breathing sound
const BREATH_HAND_TRIGGER_HEIGHT = 0.2;

// Maximum distance (meters) from center of space for audio panning purposes.
const MAX_LEFT_RIGHT_DISTANCE = 1;
const MAX_FRONT_BACK_DISTANCE = 6;

// Meters to center of space from kinect
const ROOM_CENTER_Z = 2.5;


// ----- Sound (ToneJS) -----

// Interval in seconds over which we ramp ToneJS parameters when they change
// Make it match our window duration (at 60fps), minus one frame to ensure no jumps/overlaps in our ramps
// const RAMP_INTERVAL = WINDOW_SIZE-1 / 60;
const RAMP_INTERVAL = 0.01;

// For blending the two heartbeats, we use a curve of the form y=x^n from x=0 to x=1
// This is that n. For n=1, we have a linear ramp. As n increases, we get more
// of a curve, hearing less mechanical heartbeat at first but having the
// mechanical sound ramp up faster at the end.
const CROSSFADE_CURVE_POWER = 2;