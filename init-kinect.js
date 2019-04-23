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