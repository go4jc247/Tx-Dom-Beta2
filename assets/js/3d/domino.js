// ========== DOMINO ==========
// 3-layer design: body + beveled frame with clipping planes + inner slab with pip holes
// Requires: THREE

const DOM_L = 50, DOM_W = 25, DOM_H = 9, DOM_BEVEL = 2;
const PIP_R = 2.5, HOLE_DEPTH = 4;
const GROOVE_W = 2.5, GROOVE_LEN = 17.5;
const BOWL_DEPTH = 2.5;
const BOWL_ROT_X = Math.PI / 2;
const PILL_RY = Math.PI / 2;
const TC_RY = Math.PI;
const BC_RY = Math.PI;
const BC_RZ = Math.PI;
const PIP_SHININESS = 295, PIP_SPEC = 70;
const BODY_SHININESS = 30, BODY_SPEC = 15;
const GROOVE_SHININESS = 30, GROOVE_SPEC = 15;

// Pip colors from TX-Dom-Dev
const pipColors = [
  0x141416, 0x36B258, 0xF0C73D, 0xE74C3C,
  0x00B2FF, 0x9B59B6, 0xA76E34, 0x3B82F6
];

const pipGrid = {
  TL: [-6.25,  6.25], T: [-6.25, 0], TR: [-6.25, -6.25],
  L:  [0,      6.25], C: [0,     0], R:  [0,     -6.25],
  BL: [6.25,   6.25], B: [6.25,  0], BR: [6.25,  -6.25]
};
const pipLayouts = [
  [],
  ['C'],
  ['TR', 'BL'],
  ['TR', 'C', 'BL'],
  ['TL', 'TR', 'BL', 'BR'],
  ['TL', 'TR', 'C', 'BL', 'BR'],
  ['TL', 'TR', 'L', 'R', 'BL', 'BR'],
  ['TL', 'TR', 'L', 'C', 'R', 'BL', 'BR']
];

function roundedRectShape(w, h, r) {
  const shape = new THREE.Shape();
  const x = w/2 - r, y = h/2 - r;
  shape.moveTo(-x, -h/2);
  shape.lineTo(x, -h/2);
  shape.quadraticCurveTo(w/2, -h/2, w/2, -y);
  shape.lineTo(w/2, y);
  shape.quadraticCurveTo(w/2, h/2, x, h/2);
  shape.lineTo(-x, h/2);
  shape.quadraticCurveTo(-w/2, h/2, -w/2, y);
  shape.lineTo(-w/2, -y);
  shape.quadraticCurveTo(-w/2, -h/2, -x, -h/2);
  return shape;
}

const pendingFrames = [];

function createDomino(leftVal, rightVal) {
  const group = new THREE.Group();
  const topZ = DOM_H / 2;
  const splitZ = topZ - HOLE_DEPTH;
  const gr = GROOVE_W / 2;
  const gl = GROOVE_LEN / 2;
  const frameW = DOM_BEVEL;

  const bodySpecColor = new THREE.Color(`rgb(${BODY_SPEC},${BODY_SPEC},${BODY_SPEC})`);
  const grooveSpecColor = new THREE.Color(`rgb(${GROOVE_SPEC},${GROOVE_SPEC},${GROOVE_SPEC})`);
  const pipSpecColor = new THREE.Color(`rgb(${PIP_SPEC},${PIP_SPEC},${PIP_SPEC})`);
  const domIvoryMat = new THREE.MeshPhongMaterial({ color: 0xFFFFF0, shininess: BODY_SHININESS, specular: bodySpecColor });
  const domBlackMat = new THREE.MeshPhongMaterial({ color: 0x111111, side: THREE.DoubleSide, shininess: GROOVE_SHININESS, specular: grooveSpecColor });

  // Collect pip positions
  const allPips = [];
  if (leftVal > 0)
    for (const name of pipLayouts[leftVal]) {
      const [px, py] = pipGrid[name];
      allPips.push({ x: -DOM_L/4 + px, y: py, val: leftVal });
    }
  if (rightVal > 0)
    for (const name of pipLayouts[rightVal]) {
      const [px, py] = pipGrid[name];
      allPips.push({ x: DOM_L/4 + px, y: py, val: rightVal });
    }

  // LAYER 1: BODY — beveled edges, up to splitZ only
  const bodyShape = roundedRectShape(DOM_L, DOM_W, DOM_BEVEL);
  const bodyGeo = new THREE.ExtrudeGeometry(bodyShape, {
    depth: DOM_H - HOLE_DEPTH, bevelEnabled: true,
    bevelThickness: DOM_BEVEL, bevelSize: DOM_BEVEL, bevelSegments: 3
  });
  bodyGeo.translate(0, 0, -topZ - DOM_BEVEL);
  const body = new THREE.Mesh(bodyGeo, domIvoryMat);
  body.castShadow = true;
  group.add(body);

  // LAYER 2: BEVELED FRAME with clipping planes
  const innerX = DOM_L/2 - frameW;
  const innerY = DOM_W/2 - frameW;
  const framePlanes = [
    new THREE.Plane(new THREE.Vector3(-1, 0, 0), -innerX),
    new THREE.Plane(new THREE.Vector3(1, 0, 0),  -innerX),
    new THREE.Plane(new THREE.Vector3(0, -1, 0), -innerY),
    new THREE.Plane(new THREE.Vector3(0, 1, 0),  -innerY),
  ];
  const frameShape = roundedRectShape(DOM_L, DOM_W, DOM_BEVEL);
  const frameGeo = new THREE.ExtrudeGeometry(frameShape, {
    depth: HOLE_DEPTH, bevelEnabled: true,
    bevelThickness: DOM_BEVEL, bevelSize: DOM_BEVEL, bevelSegments: 3
  });
  frameGeo.translate(0, 0, splitZ - DOM_BEVEL);
  const frameMat = new THREE.MeshPhongMaterial({
    color: 0xFFFFF0, shininess: BODY_SHININESS, specular: bodySpecColor,
    clippingPlanes: framePlanes, clipIntersection: true, clipShadows: true
  });
  const frame = new THREE.Mesh(frameGeo, frameMat);
  frame.castShadow = true;
  frame._localPlaneData = { innerX, innerY };
  pendingFrames.push(frame);
  group.add(frame);

  // LAYER 3: INNER SLAB — no bevel, clean holes
  const innerShape = roundedRectShape(DOM_L - 2*frameW + 0.1, DOM_W - 2*frameW + 0.1, 0.5);
  for (const pip of allPips) {
    const hole = new THREE.Path();
    hole.absarc(pip.x, pip.y, PIP_R, 0, Math.PI * 2, true);
    innerShape.holes.push(hole);
  }
  const grooveHole = new THREE.Path();
  grooveHole.moveTo(-gr, -gl);
  grooveHole.lineTo(-gr, gl);
  grooveHole.absarc(0, gl, gr, Math.PI, 0, true);
  grooveHole.lineTo(gr, -gl);
  grooveHole.absarc(0, -gl, gr, 0, Math.PI, true);
  innerShape.holes.push(grooveHole);
  const innerGeo = new THREE.ExtrudeGeometry(innerShape, { depth: HOLE_DEPTH, bevelEnabled: false });
  innerGeo.translate(0, 0, splitZ);
  const inner = new THREE.Mesh(innerGeo, domIvoryMat);
  group.add(inner);

  // COLORED CONCAVE PIP INSERTS
  for (const pip of allPips) {
    const pipMat = new THREE.MeshPhongMaterial({
      color: pipColors[pip.val], side: THREE.DoubleSide,
      shininess: PIP_SHININESS, specular: pipSpecColor
    });
    const sphereR = (PIP_R * PIP_R + BOWL_DEPTH * BOWL_DEPTH) / (2 * BOWL_DEPTH);
    const bowlAngle = Math.asin(Math.min(PIP_R / sphereR, 1));
    const bowlGeo = new THREE.SphereGeometry(sphereR, 24, 16, 0, Math.PI * 2, Math.PI - bowlAngle, bowlAngle);
    bowlGeo.scale(1, 1, -1);
    const norms = bowlGeo.attributes.normal;
    for (let i = 0; i < norms.count; i++) {
      norms.setXYZ(i, -norms.getX(i), -norms.getY(i), -norms.getZ(i));
    }
    norms.needsUpdate = true;
    bowlGeo.rotateX(BOWL_ROT_X);
    const bowl = new THREE.Mesh(bowlGeo, pipMat);
    bowl.position.set(pip.x, pip.y, topZ - BOWL_DEPTH + sphereR);
    group.add(bowl);
  }

  // BLACK INVERTED HALF-PILL GROOVE
  const pillR = gr;
  const troughGeo = new THREE.CylinderGeometry(pillR, pillR, GROOVE_LEN, 24, 1, true, 0, Math.PI);
  troughGeo.rotateY(PILL_RY);
  const trough = new THREE.Mesh(troughGeo, domBlackMat);
  trough.position.set(0, 0, topZ);
  group.add(trough);

  // Quarter-sphere end caps
  const capGeoTop = new THREE.SphereGeometry(pillR, 24, 12, 0, Math.PI, 0, Math.PI / 2);
  capGeoTop.rotateY(TC_RY);
  const capTop = new THREE.Mesh(capGeoTop, domBlackMat);
  capTop.position.set(0, gl, topZ);
  group.add(capTop);

  const capGeoBot = new THREE.SphereGeometry(pillR, 24, 12, 0, Math.PI, 0, Math.PI / 2);
  capGeoBot.rotateY(BC_RY);
  capGeoBot.rotateZ(BC_RZ);
  const capBot = new THREE.Mesh(capGeoBot, domBlackMat);
  capBot.position.set(0, -gl, topZ);
  group.add(capBot);

  return group;
}

function createStandingDomino(leftVal, rightVal) {
  const dom = createDomino(leftVal, rightVal);
  dom.rotation.x = (90 - 12) * Math.PI / 180;
  dom.rotation.z = Math.PI / 2;
  return dom;
}
