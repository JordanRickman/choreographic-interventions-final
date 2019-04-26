// ----- KINECT -----

// Fixed width and height of screen to make sure position tracking works.
const SCREEN_WIDTH = 1920;
const SCREEN_HEIGHT = 1080;

// Number of frames (draw() loop @ 60fps) over which position and joints are averaged.
const WINDOW_SIZE = 10;

// When two joints get closer together than this distance (meters), trigger associated sound
const TRIGGER_DISTANCE = 0.3;

// There is a "safe zone" path across the center of the screen, where the dancer
// can walk (outside the mouth), without getting shocked.
// This is its width as a proportion of the "deviance" variable.
const SAFE_CENTER_PATH_HEIGHT_PROPORTION = 0.2;



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