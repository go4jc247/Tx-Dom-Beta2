// ========== RACK ==========
// Domino rack with base, back wall, front lip, and side guards
// Requires: THREE

function createRack(rackMat) {
  const group = new THREE.Group();
  const rackLen = 220, rackDep = 40, baseH = 6;
  const backH = 45, backT = 4;
  const lipH = 8, lipT = 3;
  const guardH = 85, guardT = 3, guardDep = 70;
  const leanRad = 12 * Math.PI / 180;

  // Base
  const baseGeo = new THREE.BoxGeometry(rackLen, rackDep, baseH);
  const base = new THREE.Mesh(baseGeo, rackMat);
  base.position.z = baseH / 2;
  group.add(base);

  // Back wall
  const backGeo = new THREE.BoxGeometry(rackLen, backT, backH);
  const back = new THREE.Mesh(backGeo, rackMat);
  back.position.set(0, rackDep/2 - backT/2 - 11, baseH + backH/2);
  back.rotation.x = -leanRad;
  group.add(back);

  // Front lip
  const lipGeo = new THREE.BoxGeometry(rackLen, lipT, lipH);
  const lip = new THREE.Mesh(lipGeo, rackMat);
  lip.position.set(0, -rackDep/2 + lipT/2, baseH + lipH/2);
  group.add(lip);

  // Guards
  for (const side of [-1, 1]) {
    const guardGeo = new THREE.BoxGeometry(guardT, guardDep, guardH);
    const guard = new THREE.Mesh(guardGeo, rackMat);
    guard.position.set(side * (rackLen/2 - guardT/2), -20, baseH + guardH/2);
    guard.rotation.x = -leanRad;
    group.add(guard);
  }

  return group;
}
