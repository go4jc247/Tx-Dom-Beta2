// ========== TABLE ==========
// Hexagonal poker-style table with rounded corners, felt surface, apron, and legs
// Requires: THREE, textures (woodTex, woodBump, railTex, feltTex, floorTex)

const TABLE_RADIUS = 900;
const TOP_THICKNESS = 45;
const RAIL_WIDTH = 120;
const FELT_DEPTH = 3;
const LEG_HEIGHT = 700;
const APOTHEM = TABLE_RADIUS * Math.cos(Math.PI / 6);

function hexShape(radius, offsetDeg, cornerRadius) {
  const shape = new THREE.Shape();
  const cr = cornerRadius || 0;
  const verts = [];
  for (let i = 0; i < 6; i++) {
    const angle = (i * 60 + offsetDeg) * Math.PI / 180;
    verts.push({ x: radius * Math.cos(angle), y: radius * Math.sin(angle) });
  }
  if (cr <= 0) {
    shape.moveTo(verts[0].x, verts[0].y);
    for (let i = 1; i < 6; i++) shape.lineTo(verts[i].x, verts[i].y);
  } else {
    for (let i = 0; i < 6; i++) {
      const prev = verts[(i + 5) % 6];
      const curr = verts[i];
      const next = verts[(i + 1) % 6];
      const dx1 = prev.x - curr.x, dy1 = prev.y - curr.y;
      const dx2 = next.x - curr.x, dy2 = next.y - curr.y;
      const len1 = Math.sqrt(dx1*dx1 + dy1*dy1);
      const len2 = Math.sqrt(dx2*dx2 + dy2*dy2);
      const p1x = curr.x + (dx1/len1) * cr;
      const p1y = curr.y + (dy1/len1) * cr;
      const p2x = curr.x + (dx2/len2) * cr;
      const p2y = curr.y + (dy2/len2) * cr;
      if (i === 0) shape.moveTo(p1x, p1y);
      else shape.lineTo(p1x, p1y);
      shape.quadraticCurveTo(curr.x, curr.y, p2x, p2y);
    }
  }
  shape.closePath();
  return shape;
}

function createTable(woodMat, feltMat, railMat, floorTex) {
  const group = new THREE.Group();
  const CORNER_R = 60;

  // Rail (full hex with rounded corners and bevel)
  const topGeo = new THREE.ExtrudeGeometry(hexShape(TABLE_RADIUS, 30, CORNER_R), {
    depth: TOP_THICKNESS, bevelEnabled: true,
    bevelThickness: 8, bevelSize: 8, bevelSegments: 4
  });
  const top = new THREE.Mesh(topGeo, railMat);
  top.receiveShadow = true;
  group.add(top);

  // Felt (inset, raised above rail to avoid z-fighting)
  const feltGeo = new THREE.ExtrudeGeometry(hexShape(TABLE_RADIUS - RAIL_WIDTH, 30, CORNER_R * 0.5), {
    depth: FELT_DEPTH, bevelEnabled: false
  });
  const felt = new THREE.Mesh(feltGeo, feltMat);
  felt.position.z = TOP_THICKNESS + 6;
  felt.receiveShadow = true;
  group.add(felt);

  // Apron (skirt under the table top)
  const apronH = 60;
  const apronGeo = new THREE.ExtrudeGeometry(hexShape(TABLE_RADIUS - 15, 30, CORNER_R), {
    depth: apronH, bevelEnabled: true,
    bevelThickness: 4, bevelSize: 4, bevelSegments: 2
  });
  const apron = new THREE.Mesh(apronGeo, woodMat);
  apron.position.z = -apronH;
  group.add(apron);

  // Legs — tapered cylinders
  const legR = TABLE_RADIUS - 120;
  for (let i = 0; i < 6; i++) {
    const angle = (i * 60 + 30) * Math.PI / 180;
    const legGeo = new THREE.CylinderGeometry(22, 30, LEG_HEIGHT, 12);
    legGeo.rotateX(Math.PI / 2);
    const leg = new THREE.Mesh(legGeo, woodMat);
    leg.position.set(legR * Math.cos(angle), legR * Math.sin(angle), -apronH - LEG_HEIGHT / 2);
    leg.castShadow = true;
    group.add(leg);
  }

  // Floor
  const floorGeo = new THREE.PlaneGeometry(6000, 6000);
  const floorMatObj = new THREE.MeshPhongMaterial({ map: floorTex, shininess: 10 });
  const floor = new THREE.Mesh(floorGeo, floorMatObj);
  floor.position.z = -apronH - LEG_HEIGHT;
  floor.receiveShadow = true;
  group.add(floor);

  return group;
}
