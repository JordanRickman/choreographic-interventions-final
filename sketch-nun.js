//TRIANGLES
let ptriFrame = []; // previous triFrame
let triFrame = [];
let tri = 10; // division for triangles
let xPoints = [];
let yPoints = [];
let shockCount = 0;

//MOUTH
let pixelCol;
let pix = [];
let noiseScale = 0.0;
let noiseVal;
let sinVal;
let sinValRate;
let sinValMul;

//SHOCK
let n = []; // stores frames to shock (normal distribution)
let shockFrequency = 20; // frequency of shock x times
let shockRate = 2; // flash every 3 frames
let totalFrames = 60 * 60; // 10 minutes
let shockDuration = 20; // *2 frames

function preload() {
  shock = loadSound("shock.mp3");
  zap = loadSound("zap.mp3");
}

function setup() {
  createCanvas(windowWidth, windowHeight);

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

  // SHOCK
  frameRate(60)
  for (i = 0; i < shockFrequency; i++) {
    x = random(totalFrames);
    x = round(x);
    n.push(x);
  }
}

function draw() {
  // background(0);

  // TRIANGLE AFTER SHOCK
  if (frameCount > triFrame[0]) { // draw triangles after shock
    // stroke(255);
    fill(255, 50);
    for (i = 0; i < shockCount * 3; i = i + 3) {
      beginShape();
      vertex(xPoints[i], yPoints[i]);
      vertex(xPoints[i + 1], yPoints[i + 1]);
      vertex(xPoints[i + 2], yPoints[i + 2]);
      endShape(CLOSE);
    }
  }

/*
  // DRAW MOUTH
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
*/

  //SHOCK IN MOUTH
  pixelCol = get(mouseX, mouseY);
  pix.push(pixelCol);

  if (frameCount > 10) {
    pix.splice(0, 1);
  }

  if (pix[0][0] == 0) { // if mouse is inside mouth, shock
    shock.play();
    triFrame.push(frameCount); // push frame count to display triangles
    if (frameCount % 2 == 0) {
      strokeWeight(2);
      stroke(255);
      for (i = height / 3; i < height / 3 * 2; i = i + 10) {
        line(0, i, width, i);
      }
      fill(255);
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

    //TRIANGLES DURING SHOCK
    strokeWeight(1);
    fill(255); // draw triangles during shock
    for (i = 0; i < shockCount * 3; i = i + 3) {
      beginShape();
      vertex(xPoints[i], yPoints[i]);
      vertex(xPoints[i + 1], yPoints[i + 1]);
      vertex(xPoints[i + 2], yPoints[i + 2]);
      endShape(CLOSE);
    }
  }

  // //SHOCK RANDOM
  // for (i = 0; i < totalFrames; i++) {
  //   if (frameCount == n[i] - shockDuration) {
  //     shock.play();
  //   }
  //   if (frameCount > n[i] - shockDuration && frameCount < n[i] + shockDuration && frameCount % shockRate == 0) {
  //     background(255);
  //   }
  // }

  if (frameCount > 10) {
    if (pix[0][0] < pix[9][0]) {
      shockCount = shockCount + 0.05;
    }
  }
}