// ========== CHAIR ==========
// Rounded cushion seat with backrest and tapered legs
// Requires: THREE

function createChair(chairMat) {
  const group = new THREE.Group();
  const sw = 450, sd = 450, st = 45, sh = 450, bh = 500, bt = 25;

  // Cushion material (dark leather look)
  const cushionMat = new THREE.MeshPhongMaterial({
    color: 0x6B1A00, shininess: 20, specular: new THREE.Color(0x332211)
  });

  // Seat — rounded box via ExtrudeGeometry
  const seatShape = new THREE.Shape();
  const sR = 25;
  const shw = sw/2, shd = sd/2;
  seatShape.moveTo(-shd + sR, -shw);
  seatShape.lineTo(shd - sR, -shw);
  seatShape.quadraticCurveTo(shd, -shw, shd, -shw + sR);
  seatShape.lineTo(shd, shw - sR);
  seatShape.quadraticCurveTo(shd, shw, shd - sR, shw);
  seatShape.lineTo(-shd + sR, shw);
  seatShape.quadraticCurveTo(-shd, shw, -shd, shw - sR);
  seatShape.lineTo(-shd, -shw + sR);
  seatShape.quadraticCurveTo(-shd, -shw, -shd + sR, -shw);

  const seatGeo = new THREE.ExtrudeGeometry(seatShape, {
    depth: st, bevelEnabled: true,
    bevelThickness: 8, bevelSize: 8, bevelSegments: 3
  });
  const seat = new THREE.Mesh(seatGeo, cushionMat);
  seat.position.set(0, 0, sh - st);
  group.add(seat);

  // Backrest — rounded rectangle standing upright
  const bkw = sw/2 - 10;
  const bkh = bh/2 - 20;
  const bR = 30;
  const backShape = new THREE.Shape();
  backShape.moveTo(-bkw + bR, -bkh);
  backShape.lineTo(bkw - bR, -bkh);
  backShape.quadraticCurveTo(bkw, -bkh, bkw, -bkh + bR);
  backShape.lineTo(bkw, bkh - bR);
  backShape.quadraticCurveTo(bkw, bkh, bkw - bR, bkh);
  backShape.lineTo(-bkw + bR, bkh);
  backShape.quadraticCurveTo(-bkw, bkh, -bkw, bkh - bR);
  backShape.lineTo(-bkw, -bkh + bR);
  backShape.quadraticCurveTo(-bkw, -bkh, -bkw + bR, -bkh);

  const backGeo = new THREE.ExtrudeGeometry(backShape, {
    depth: bt, bevelEnabled: true,
    bevelThickness: 5, bevelSize: 5, bevelSegments: 2
  });
  backGeo.rotateX(Math.PI / 2);
  backGeo.rotateZ(Math.PI / 2);
  const back = new THREE.Mesh(backGeo, chairMat);
  back.position.set(sd/2 - bt/2, 0, sh + bkh);
  back.rotation.y = 0.08;
  group.add(back);

  // Legs — tapered cylinders with slight splay
  const legPositions = [
    [-sd/2 + 45, -sw/2 + 45],
    [sd/2 - 45, -sw/2 + 45],
    [-sd/2 + 45, sw/2 - 45],
    [sd/2 - 45, sw/2 - 45]
  ];
  for (const [x, y] of legPositions) {
    const legGeo = new THREE.CylinderGeometry(15, 22, sh - st, 8);
    legGeo.rotateX(Math.PI / 2);
    const leg = new THREE.Mesh(legGeo, chairMat);
    leg.position.set(x, y, (sh - st) / 2);
    leg.castShadow = true;
    group.add(leg);
  }

  return group;
}
