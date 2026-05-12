// ========== PROCEDURAL TEXTURES & MATERIALS ==========
// Shared textures and materials used by table, chair, rack
// Requires: THREE

function createWoodTexture(baseR, baseG, baseB, grainDensity) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 512;
  const ctx = c.getContext('2d');
  ctx.fillStyle = `rgb(${baseR},${baseG},${baseB})`;
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < grainDensity; i++) {
    const y = Math.random() * 512;
    const w = 1 + Math.random() * 3;
    const alpha = 0.05 + Math.random() * 0.12;
    const darker = Math.random() > 0.5;
    ctx.strokeStyle = darker ? `rgba(0,0,0,${alpha})` : `rgba(255,200,100,${alpha * 0.5})`;
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x < 512; x += 20) {
      ctx.lineTo(x, y + Math.sin(x * 0.02 + i) * (3 + Math.random() * 5));
    }
    ctx.stroke();
  }
  const imgData = ctx.getImageData(0, 0, 512, 512);
  for (let p = 0; p < imgData.data.length; p += 4) {
    const n = (Math.random() - 0.5) * 12;
    imgData.data[p] += n;
    imgData.data[p+1] += n;
    imgData.data[p+2] += n;
  }
  ctx.putImageData(imgData, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function createFeltTexture() {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 512;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#006820';
  ctx.fillRect(0, 0, 512, 512);
  const imgData = ctx.getImageData(0, 0, 512, 512);
  for (let p = 0; p < imgData.data.length; p += 4) {
    const n = (Math.random() - 0.5) * 18;
    imgData.data[p] += n * 0.3;
    imgData.data[p+1] += n;
    imgData.data[p+2] += n * 0.3;
  }
  ctx.putImageData(imgData, 0, 0);
  ctx.globalAlpha = 0.04;
  for (let i = 0; i < 2000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const len = 3 + Math.random() * 8;
    const angle = Math.random() * Math.PI;
    ctx.strokeStyle = Math.random() > 0.5 ? '#004010' : '#008030';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function createFloorTexture() {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 512;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#2a2a3e';
  ctx.fillRect(0, 0, 512, 512);
  const imgData = ctx.getImageData(0, 0, 512, 512);
  for (let p = 0; p < imgData.data.length; p += 4) {
    const n = (Math.random() - 0.5) * 10;
    imgData.data[p] += n;
    imgData.data[p+1] += n;
    imgData.data[p+2] += n;
  }
  ctx.putImageData(imgData, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(8, 8);
  return tex;
}

// Generate all textures and materials
function createAllMaterials() {
  const woodTex = createWoodTexture(139, 69, 19, 80);
  woodTex.repeat.set(0.25, 0.25);
  const railTex = createWoodTexture(92, 51, 23, 100);
  railTex.repeat.set(0.25, 0.25);
  const chairTex = createWoodTexture(180, 120, 60, 60);
  chairTex.repeat.set(1, 2);
  const rackTex = createWoodTexture(120, 65, 20, 70);
  const feltTex = createFeltTexture();
  feltTex.repeat.set(1, 1);
  const floorTex = createFloorTexture();

  const woodBump = createWoodTexture(128, 128, 128, 80);

  const woodMat = new THREE.MeshPhongMaterial({
    map: woodTex, bumpMap: woodBump, bumpScale: 0.8,
    shininess: 40, specular: new THREE.Color(0x332211)
  });
  const feltMat = new THREE.MeshPhongMaterial({
    map: feltTex, bumpMap: createFeltTexture(), bumpScale: 0.3,
    shininess: 5, specular: new THREE.Color(0x111111)
  });
  const railMat = new THREE.MeshPhongMaterial({
    map: railTex, bumpMap: woodBump, bumpScale: 1.0,
    shininess: 50, specular: new THREE.Color(0x443322)
  });
  const chairMat = new THREE.MeshPhongMaterial({
    map: chairTex, bumpMap: woodBump, bumpScale: 0.6,
    shininess: 35, specular: new THREE.Color(0x332211)
  });
  const rackMat = new THREE.MeshPhongMaterial({
    map: rackTex, bumpMap: woodBump, bumpScale: 0.5,
    shininess: 30, specular: new THREE.Color(0x221100)
  });

  return { woodMat, feltMat, railMat, chairMat, rackMat, floorTex };
}
