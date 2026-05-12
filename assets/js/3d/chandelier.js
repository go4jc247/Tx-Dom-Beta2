// ========== CHANDELIER ==========
// Pool-table style hanging lamp with brass fittings and green shade
// Requires: THREE

function createChandelier() {
  const cGroup = new THREE.Group();
  const brassMat = new THREE.MeshPhongMaterial({
    color: 0xb8860b, shininess: 80,
    specular: new THREE.Color(0xffdd88)
  });
  const shadeMat = new THREE.MeshPhongMaterial({
    color: 0x2a5a2a, shininess: 30, specular: new THREE.Color(0x224422),
    side: THREE.DoubleSide
  });

  // Central rod
  const rodGeo = new THREE.CylinderGeometry(8, 8, 400, 8);
  rodGeo.rotateX(Math.PI / 2);
  const rod = new THREE.Mesh(rodGeo, brassMat);
  rod.position.z = 200;
  cGroup.add(rod);

  // Ceiling plate
  const plateGeo = new THREE.CylinderGeometry(60, 60, 15, 16);
  plateGeo.rotateX(Math.PI / 2);
  const plate = new THREE.Mesh(plateGeo, brassMat);
  plate.position.z = 400;
  cGroup.add(plate);

  // Main shade (wide cone, pool-table style)
  const shadeGeo = new THREE.CylinderGeometry(350, 180, 80, 24, 1, true);
  shadeGeo.rotateX(Math.PI / 2);
  const shade = new THREE.Mesh(shadeGeo, shadeMat);
  shade.position.z = -10;
  cGroup.add(shade);

  // Brass rim at bottom of shade
  const rimGeo = new THREE.TorusGeometry(180, 6, 8, 24);
  const rim = new THREE.Mesh(rimGeo, brassMat);
  rim.position.z = -50;
  cGroup.add(rim);

  // Top rim
  const topRimGeo = new THREE.TorusGeometry(350, 5, 8, 24);
  const topRim = new THREE.Mesh(topRimGeo, brassMat);
  topRim.position.z = 30;
  cGroup.add(topRim);

  // Decorative ball at bottom
  const ballGeo = new THREE.SphereGeometry(15, 12, 12);
  const ball = new THREE.Mesh(ballGeo, brassMat);
  ball.position.z = -60;
  cGroup.add(ball);

  return cGroup;
}
