//TRIANGLES
let ptriFrame = []; // previous triFrame
let triFrame = [];
let tri = 10; // division for triangles
let xPoints = [];
let yPoints = [];
let shockCount = 0;

function initTriangles() {
  //TRIANGLES
  for (i = 1; i < tri * 3; i++) { // create 30 points for 10 triangles
    x1 = random(width / tri * (i - 1), width / tri * i);
    x2 = random(width / tri * (i - 1), width / tri * i);
    x3 = random(width / tri * (i - 1), width / tri * i);
    y1 = random(height);
    y2 = random(height);
    y3 = random(height);
    xPoints.push(x1, x2, x3);
    yPoints.push(y1, y2, y3);
  }
}

//MOUTH
let pixelCol;
let pix = [];
let noiseScale = 0.0;
let noiseVal;
let sinVal;
let sinValRate;
let sinValMul;

function drawMouth() {
  noStroke();
  fill(255, 30);
  sinValRate = frameCount / 4; // rate of inc and dec
  sinValMul = width / 20; // size of mouth
  noiseScale = noiseScale + 0.02;
  noiseVal = noise(noiseScale);
  sinVal = sin(radians(sinValRate));
  sinVal = sinVal * sinValMul;

  for (i = 0; i < 10; i++) {
    beginShape();
    curveVertex(0, height / 2);
    curveVertex(width / 6, height / 2);
    curveVertex(width / 2, (height / 3 - sinVal) + i * 20 * noiseVal); // center
    curveVertex(width / 6 * 5, height / 2);
    curveVertex(width, height / 2);
    endShape();
    beginShape();
    curveVertex(0, height / 2);
    curveVertex(width / 6, height / 2);
    curveVertex(width / 2, (height / 3 * 2 + sinVal) - i * 20 * noiseVal); // center
    curveVertex(width / 6 * 5, height / 2);
    curveVertex(width, height / 2);
    endShape();
  }
}

//SHOCK
let n = []; // stores frames to shock (normal distribution)
let shockFrequency = 20; // frequency of shock x times
let shockRate = 2; // flash every 3 frames
let totalFrames = 60 * 60; // 10 minutes
let shockDuration = 20; // *2 frames