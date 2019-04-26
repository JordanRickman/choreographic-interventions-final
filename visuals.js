//TRIANGLES
let ptriFrame = []; // previous triFrame
let triFrame = [];
let x1, y1, x2, y2, x3, y3;
let xx1 = [];
let yy1 = [];
let xx2 = [];
let yy2 = [];
let xx3 = [];
let yy3 = [];
let shockCount = 0;

function initTriangles() {
  for (i = 0; i < 8; i++) {
    x1 = width / 2 + (random(-width / 5, width / 5));
    y1 = height / 2 + (random(-height / 10, height / 10));
    xx1.push(x1);
    yy1.push(y1);

    x2 = (width / 3 * i/2) - (random(width / 3));
    if (i % 2 == 0) {
      y2 = height / 10 * 9;
    } else {
      y2 = height / 10;
    }
    xx2.push(x2);
    yy2.push(y2);

    x3 = x2 + width / 4;
    y3 = y2 + (random(-height / 20, height / 20));
    xx3.push(x3);
    yy3.push(y3);
  }
}

function drawTriangles() {
  if (frameCount - lastShockFrame < WINDOW_SIZE) {
    //TRIANGLES DURING SHOCK
    strokeWeight(1);
    fill(255); // draw triangles during shock
    for (i = 0; i < shockCount; i++) {
      beginShape();
      vertex(xx1[i], yy1[i]);
      vertex(xx2[i], yy2[i]);
      vertex(xx3[i], yy3[i]);
      endShape(CLOSE);
    }
  } else {
    // TRIANGLE AFTER SHOCK
    if (frameCount > triFrame[0]) { // draw triangles after shock
      // stroke(255);
      fill(255, 50);
      for (i = 0; i < shockCount; i++) {
        beginShape();
        vertex(xx1[i], yy1[i]);
        vertex(xx2[i], yy2[i]);
        vertex(xx3[i], yy3[i]);
        endShape(CLOSE);
      }
    }
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
  // We check for shocking every WINDOW_SIZE frames, so only update then.
  // Flash every other frame with frameCount % 2 == 0
  if (frameCount - lastShockFrame < WINDOW_SIZE && frameCount % 2 === 0) {
    drawMouthShock();
  } else {
    drawMouthNoShock();
  }
}

function drawMouthShock() {
  background(255);
  // strokeWeight(2);
  // stroke(255);
  // for (i = height / 3; i < height / 3 * 2; i = i + 10) {
  //   line(0, i, width, i);
  // }
  // fill(255);
  // for (i = 0; i < 10; i++) {
  //   beginShape();
  //   curveVertex(0, height / 2);
  //   curveVertex(width / 6, height / 2);
  //   curveVertex(width / 2, (height / 3 - sinVal) + i * 20 * noiseVal); // center
  //   curveVertex(width / 6 * 5, height / 2);
  //   curveVertex(width, height / 2);
  //   endShape();
  //   beginShape();
  //   curveVertex(0, height / 2);
  //   curveVertex(width / 6, height / 2);
  //   curveVertex(width / 2, (height / 3 * 2 + sinVal) - i * 20 * noiseVal); // center
  //   curveVertex(width / 6 * 5, height / 2);
  //   curveVertex(width, height / 2);
  //   endShape();
  // }
}

function drawMouthNoShock() {
  noStroke();
  fill(255, 15);
  sinValRate = frameCount / 4; // rate of inc and dec
  sinValMul = width / 20; // size of mouth
  noiseScale = noiseScale + 0.02;
  noiseVal = noise(noiseScale);
  sinVal = sin(radians(sinValRate));
  sinVal = sinVal * sinValMul;

  for (i = 0; i < 10; i++) {
    beginShape();
    curveVertex(0, height / 2);
    curveVertex(0, height / 2);
    // curveVertex(width / 6, height / 2);
    curveVertex(width / 2, (height / 3 - sinVal) + i * 20 * noiseVal); // center
    // curveVertex(width / 6 * 5, height / 2);
    curveVertex(width, height / 2);
    curveVertex(width, height / 2);
    endShape();

    beginShape();
    curveVertex(0, height / 2);
    curveVertex(0, height / 2);
    // curveVertex(width / 6, height / 2);
    curveVertex(width / 2, (height / 3 * 2 + sinVal) - i * 20 * noiseVal); // center
    // curveVertex(width / 6 * 5, height / 2);
    curveVertex(width, height / 2);
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