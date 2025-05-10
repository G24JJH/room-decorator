const canvas = document.getElementById('canvas');
const shopItems = document.querySelectorAll('.shop-item');
const furnitureCounts = {
  sofa: 3,
  desk: 2
};

let furnitureItems = [];

// 가구 드래그 시작
shopItems.forEach(item => {
  item.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData("furniture", e.target.src);
    e.dataTransfer.setData("name", e.target.dataset.name);
  });
});

// 가구 배치 (드롭)
canvas.addEventListener('dragover', (e) => {
  e.preventDefault();
});

canvas.addEventListener('drop', (e) => {
  e.preventDefault();
  const imgURL = e.dataTransfer.getData("furniture");
  const name = e.dataTransfer.getData("name");
  
  if (canPlaceFurniture(name)) {
    const img = document.createElement('img');
    img.src = imgURL;
    img.className = "item";
    img.style.left = `${e.offsetX - 40}px`;
    img.style.top = `${e.offsetY - 40}px`;
    
    const furnitureId = `${name}${Date.now()}`;
    img.id = furnitureId;
    img.dataset.angle = 0;

    const zIndexSlider = document.createElement('input');
    zIndexSlider.type = 'range';
    zIndexSlider.className = 'z-index-slider';
    zIndexSlider.value = 10;
    zIndexSlider.min = 1;
    zIndexSlider.max = 100;
    zIndexSlider.id = `z-index-${furnitureId}`;

    const zIndexLabel = document.createElement('label');
    zIndexLabel.textContent = `우선순위: `;
    const zIndexValue = document.createElement('span');
    zIndexValue.id = `${furnitureId}-z-index-value`;
    zIndexValue.textContent = zIndexSlider.value;
    zIndexLabel.appendChild(zIndexValue);
    
    const furnitureContainer = document.createElement('div');
    furnitureContainer.className = "furniture";
    furnitureContainer.id = furnitureId;
    furnitureContainer.appendChild(img);
    furnitureContainer.appendChild(zIndexSlider);
    furnitureContainer.appendChild(zIndexLabel);

    canvas.appendChild(furnitureContainer);
    updateFurnitureInfo(furnitureId, e.offsetX, e.offsetY, 10);

    img.addEventListener('click', () => {
      let angle = (parseInt(img.dataset.angle) + 90) % 360;
      img.style.transform = `rotate(${angle}deg)`;
      img.dataset.angle = angle;
    });

    zIndexSlider.addEventListener('input', (e) => {
      updateZIndex(furnitureId, e.target.value);
    });
  }
});

// 가구 배치 가능 여부 체크
function canPlaceFurniture(furniture) {
  if (furnitureCounts[furniture] > 0) {
    furnitureCounts[furniture]--;
    return true;
  } else {
    alert("이 가구는 더 이상 배치할 수 없습니다.");
    return false;
  }
}

// Z값 업데이트
function updateZIndex(furnitureId, value) {
  const furniture = document.getElementById(furnitureId);
  furniture.style.zIndex = value;
  document.getElementById(`${furnitureId}-z-index-value`).textContent = value;
  updateFurnitureInfo(furnitureId, furniture.style.left, furniture.style.top, value);
}

// 가구 정보 업데이트
function updateFurnitureInfo(furnitureId, x, y, zIndex) {
  const index = furnitureItems.findIndex(item => item.id === furnitureId);
  if (index !== -1) {
    furnitureItems[index] = { id: furnitureId, zIndex, x, y };
  } else {
    furnitureItems.push({ id: furnitureId, zIndex, x, y });
  }
}

// 삭제 함수 예시 (선택 사항)
function deleteFurniture(furnitureId) {
  const furnitureElement = document.getElementById(furnitureId);
  if (furnitureElement) {
    furnitureElement.remove();
    updateFurnitureCount(furnitureId);
  }
}

function updateFurnitureCount(furnitureId) {
  const name = furnitureId.replace(/[0-9]/g, '');
  furnitureCounts[name]++;
}

// 저장 (Google Apps Script 사용 시)
function saveFurnitureLayout() {
  fetch("https://script.google.com/macros/s/AKfycbzquVxMrEOE9FTUO7AB0Oizyvdk8POBJQuQhkhRT80qiiMc54Hnr-Eq2r7sxyguNMIw/exec", {
    method: "POST",
    body: JSON.stringify({
      userId: "123456",
      roomData: furnitureItems
    })
  })
  .then(res => res.text())
  .then(console.log);
}

// 불러오기
function loadFurnitureLayout() {
  fetch("https://script.google.com/macros/s/AKfycbzquVxMrEOE9FTUO7AB0Oizyvdk8POBJQuQhkhRT80qiiMc54Hnr-Eq2r7sxyguNMIw/exec?userId=123456")
    .then(res => res.json())
    .then(data => {
      data.layout.forEach(furniture => {
        placeFurniture(furniture.id, furniture.x, furniture.y, furniture.zIndex);
      });
    });
}

function placeFurniture(id, x, y, zIndex) {
  const img = document.createElement('img');
  img.src = "assets/sofa.png"; // 실제 저장된 가구 종류에 맞게 변경 필요
  img.className = "item";
  img.style.left = `${x}px`;
  img.style.top = `${y}px`;
  img.style.zIndex = zIndex;

  const container = document.createElement('div');
  container.className = "furniture";
  container.id = id;
  container.appendChild(img);

  canvas.appendChild(container);
}
