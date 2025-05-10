// 사용자 ID에서 실제 가진 가구 개수만 반영해 초기화
const ownedFurniture = {
  sofa: 1,
  table: 2,
  chair: 0
};

const canvas = document.getElementById('canvas');
const shopItemsContainer = document.getElementById('shop-items');
const selectedInfo = document.getElementById('selected-info');
let selectedItem = null;

// 상점 표시 - 소지 가구만 보이게
for (const name in ownedFurniture) {
  if (ownedFurniture[name] > 0) {
    const img = document.createElement('img');
    img.src = `assets/${name}.png`;
    img.className = 'shop-item';
    img.setAttribute('draggable', true);
    img.dataset.name = name;
    img.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData("furniture", name);
    });
    shopItemsContainer.appendChild(img);
  }
}

canvas.addEventListener('dragover', (e) => e.preventDefault());

canvas.addEventListener('drop', (e) => {
  e.preventDefault();
  const name = e.dataTransfer.getData("furniture");
  if (ownedFurniture[name] <= 0) {
    alert("이 가구는 더 이상 배치할 수 없습니다.");
    return;
  }
  
  ownedFurniture[name]--;

  const id = name + Date.now();
  const wrapper = document.createElement('div');
  wrapper.className = 'item';
  wrapper.id = id;
  wrapper.style.left = `${e.offsetX - 40}px`;
  wrapper.style.top = `${e.offsetY - 40}px`;
  wrapper.style.zIndex = Date.now() % 100;

  const img = document.createElement('img');
  img.src = `assets/${name}.png`;
  img.style.width = '100%';

  wrapper.appendChild(img);

  const zCtrl = document.createElement('div');
  zCtrl.className = 'z-index-control';
  zCtrl.innerHTML = `
    <input type="range" min="1" max="100" value="${wrapper.style.zIndex}" />
    <div>z: <span>${wrapper.style.zIndex}</span></div>
  `;

  zCtrl.querySelector('input').addEventListener('input', (e) => {
    wrapper.style.zIndex = e.target.value;
    zCtrl.querySelector('span').textContent = e.target.value;
  });

  wrapper.appendChild(zCtrl);
  canvas.appendChild(wrapper);

  makeDraggable(wrapper);
});

function makeDraggable(el) {
  let offsetX = 0, offsetY = 0;

  el.addEventListener('mousedown', (e) => {
    if (e.target.tagName === 'INPUT') return;

    selectedItem?.classList.remove('selected');
    selectedItem = el;
    selectedItem.classList.add('selected');
    selectedInfo.textContent = el.id;

    offsetX = e.offsetX;
    offsetY = e.offsetY;

    function moveHandler(eMove) {
      const x = eMove.offsetX - offsetX;
      const y = eMove.offsetY - offsetY;

      // 캔버스 내에서만 이동 허용
      const bounds = canvas.getBoundingClientRect();
      const newX = Math.min(bounds.width - 80, Math.max(0, x));
      const newY = Math.min(bounds.height - 80, Math.max(0, y));
      el.style.left = `${newX}px`;
      el.style.top = `${newY}px`;
    }

    function upHandler() {
      document.removeEventListener('mousemove', moveHandler);
      document.removeEventListener('mouseup', upHandler);
    }

    document.addEventListener('mousemove', moveHandler);
    document.addEventListener('mouseup', upHandler);
  });
}
