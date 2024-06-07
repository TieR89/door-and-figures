const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 2, 5);

// Рендеринг
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true; // Включение теней
document.body.appendChild(renderer.domElement);

// Добавление OrbitControls для камеры
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.25;
controls.screenSpacePanning = false;
controls.minDistance = 1;
controls.maxDistance = 1000;
controls.maxPolarAngle = Math.PI / 2;

// Загрузка текстур
const textureLoader = new THREE.TextureLoader();
const lightWoodTexture = textureLoader.load(
  './style/img/rm187-mynt-34.jpg',
  texture => {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  }
);
const tileTexture = textureLoader.load(
  './style/img/close-up-marble-textured-tiles.jpg',
  texture => {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(20, 20);
  }
);
const wallTexture = textureLoader.load(
  './style/img/14a3aca6e1611278c68ea34e72718dfd.jpg'
);

// Функция для создания двери
function createDoor(width, height) {
  const doorGroup = new THREE.Group();

  // Размеры частей двери
  const frameThickness = 0.1;
  const doorWidth = width;
  const doorHeight = height;

  // Создание центральной части двери
  const centerGeometry = new THREE.BoxGeometry(
    doorWidth - 2 * frameThickness,
    doorHeight - 2 * frameThickness,
    0.05
  );
  const centerMaterial = new THREE.MeshPhongMaterial({ map: lightWoodTexture });
  const center = new THREE.Mesh(centerGeometry, centerMaterial);
  center.position.set(0, 0, 0);
  center.castShadow = true;
  center.receiveShadow = true;
  center.material.map.repeat.set(
    (doorWidth - 2 * frameThickness) / 2,
    (doorHeight - 2 * frameThickness) / 2
  );
  doorGroup.add(center);

  // Создание рамки двери (верхняя, нижняя, левая, правая части)
  const frameGeometryHorizontal = new THREE.BoxGeometry(
    doorWidth,
    frameThickness,
    0.05
  );
  const frameGeometryVertical = new THREE.BoxGeometry(
    frameThickness,
    doorHeight,
    0.05
  );
  const frameMaterial = new THREE.MeshPhongMaterial({ color: 0x654321 });

  const topFrame = new THREE.Mesh(frameGeometryHorizontal, frameMaterial);
  topFrame.position.set(0, doorHeight / 2 - frameThickness / 2, 0);
  topFrame.castShadow = true;
  topFrame.receiveShadow = true;
  doorGroup.add(topFrame);

  const bottomFrame = new THREE.Mesh(frameGeometryHorizontal, frameMaterial);
  bottomFrame.position.set(0, -doorHeight / 2 + frameThickness / 2, 0);
  bottomFrame.castShadow = true;
  bottomFrame.receiveShadow = true;
  doorGroup.add(bottomFrame);

  const leftFrame = new THREE.Mesh(frameGeometryVertical, frameMaterial);
  leftFrame.position.set(-doorWidth / 2 + frameThickness / 2, 0, 0);
  leftFrame.castShadow = true;
  leftFrame.receiveShadow = true;
  doorGroup.add(leftFrame);

  const rightFrame = new THREE.Mesh(frameGeometryVertical, frameMaterial);
  rightFrame.position.set(doorWidth / 2 - frameThickness / 2, 0, 0);
  rightFrame.castShadow = true;
  rightFrame.receiveShadow = true;
  doorGroup.add(rightFrame);

  // Дверная ручка
  const handleGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.2, 32);
  const handleMaterial = new THREE.MeshPhongMaterial({ color: 0xcccccc });
  const handle = new THREE.Mesh(handleGeometry, handleMaterial);
  handle.rotation.z = Math.PI / 2;
  handle.position.set(doorWidth / 2 - frameThickness - 0.1, 0, 0.05);
  handle.castShadow = true;
  handle.receiveShadow = true;
  doorGroup.add(handle);

  doorGroup.position.y = doorHeight / 2 - 2; // Дверь меняет размер относительно пола
  return doorGroup;
}

// Создание двери с заданными размерами
let door = createDoor(2, 4);
scene.add(door);

// Обновление размеров двери
function updateDoor(width, height) {
  scene.remove(door);
  door = createDoor(width, height);
  scene.add(door);
}

// Добавление пола
const floorGeometry = new THREE.PlaneGeometry(20, 20);
const floorMaterial = new THREE.MeshPhongMaterial({ map: tileTexture });
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -2;
floor.receiveShadow = true; // Пол принимает тени
scene.add(floor);

// Добавление стены позади двери
const wallGeometry = new THREE.PlaneGeometry(20, 10);
const wallMaterial = new THREE.MeshPhongMaterial({ map: wallTexture });
const wall = new THREE.Mesh(wallGeometry, wallMaterial);
wall.position.z = -5;
wall.position.y = 3;
wall.receiveShadow = true; // Стена принимает тени
scene.add(wall);

// Создание кубической камеры для динамических отражений
const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(256, {
  format: THREE.RGBFormat,
  generateMipmaps: true,
  minFilter: THREE.LinearMipmapLinearFilter,
});
const cubeCamera = new THREE.CubeCamera(1, 1000, cubeRenderTarget);
scene.add(cubeCamera);

// Цилиндр
const cylinderGeometry = new THREE.CylinderGeometry(0.5, 0.5, 2, 32);
const cylinderMaterial = new THREE.MeshPhongMaterial({
  envMap: cubeRenderTarget.texture,
});
const cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
cylinder.position.set(-1, -1, 2); // Расположение цилиндра перед дверью
cylinder.castShadow = true; // Цилиндр отбрасывает тени
cylinder.receiveShadow = true; // Цилиндр принимает тени
scene.add(cylinder);

// Пирамида
const pyramidGeometry = new THREE.ConeGeometry(0.75, 1.5, 4);
const pyramidMaterial = new THREE.MeshPhongMaterial({ color: 0x0000ff });
const pyramid = new THREE.Mesh(pyramidGeometry, pyramidMaterial);
pyramid.position.set(1, -1.25, 2); // Расположение пирамиды перед дверью
pyramid.castShadow = true; // Пирамида отбрасывает тени
pyramid.receiveShadow = true; // Пирамида принимает тени
scene.add(pyramid);

// Добавление света
const ambientLight = new THREE.AmbientLight(0x404040); // Мягкий рассеянный свет
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1); // Направленный свет
directionalLight.position.set(5, 10, 7.5);
directionalLight.castShadow = true; // Свет отбрасывает тени
directionalLight.shadow.mapSize.width = 512;
directionalLight.shadow.mapSize.height = 512;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 50;
scene.add(directionalLight);

// Обработчик изменения размера окна
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Обработчики изменения значений input
document.getElementById('width').addEventListener('input', event => {
  const width = parseFloat(event.target.value);
  const height = parseFloat(document.getElementById('height').value);
  document.getElementById('widthValue').textContent = width;
  updateDoor(width, height);
});

document.getElementById('height').addEventListener('input', event => {
  const height = parseFloat(event.target.value);
  const width = parseFloat(document.getElementById('width').value);
  document.getElementById('heightValue').textContent = height;
  updateDoor(width, height);
});

// Анимация
function animate() {
  requestAnimationFrame(animate);

  // Обновление кубической карты отражений
  cylinder.visible = false;
  cubeCamera.update(renderer, scene);
  cylinder.visible = true;

  controls.update();
  renderer.render(scene, camera);
}

animate();
