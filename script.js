const canvas = document.getElementById('canvas');
const shopItems = document.querySelectorAll('.shop-item');
let selectedFurniture = null;

// 가구를 드래그하여 캔버스에 놓을 때
shopItems.forEach(item => {
  item.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData("furniture", e.target.src);
  });
});

canvas.addEventListener('dragover', (e) => {
  e.preventDefault();
});

canvas.addEventListener('drop', (e) => {
  e.preventDefault();
  const imgURL = e.dataTransfer.getData("furniture");
  const img = document.createElement('img');
  img.src = imgURL;
  img.className = "item";
  img.style.left = `${e.offsetX - 40}px`;
  img.style.top = `${e.offsetY - 40}px`;
  
  // Z-Index 초기값 설정
  img.dataset.zIndex = 10;
  img.style.zIndex = 10;
  
  // Z-Index 조정 및 삭제 버튼 추가
  const zIndexSlider = document.createElement('input');
  zIndexSlider.type = 'range';
  zIndexSlider.min = 1;
  zIndexSlider.max = 100;
  zIndexSlider.value = 10;
  zIndexSlider.className = 'z-index-slider';

  const deleteButton = document.createElement('button');
  deleteButton.className = 'delete-btn';
  deleteButton.textContent = '삭제';

  // Z-Index 조절 및 삭제 이벤트
  zIndexSlider.addEventListener('input', () => {
    img.dataset.zIndex = zIndexSlider.value;
    img.style.zIndex = zIndexSlider.value;
  });

  deleteButton.addEventListener('click', () => {
    canvas.removeChild(img);
    canvas.removeChild(zIndexSlider);
    canvas.removeChild(deleteButton);
  });

  // 클릭 시 가구 선택
  img.addEventListener('click', () => {
    if (selectedFurniture) {
      selectedFurniture.classList.remove('selected');
    }
    selectedFurniture = img;
    img.classList.add('selected');
    canvas.appendChild(zIndexSlider);
    canvas.appendChild(deleteButton);
  });

  canvas.appendChild(img);
});

// 유저의 룸 배치 저장
function saveRoomLayout() {
  const furnitureData = [];
  
  const items = document.querySelectorAll('.item');
  items.forEach(item => {
    const data = {
      x: parseInt(item.style.left),
      y: parseInt(item.style.top),
      zIndex: item.dataset.zIndex
    };
    furnitureData.push(data);
  });

  const userId = 'user123';  // 예시: 사용자 ID
  const layoutData = {
    userId: userId,
    layout: furnitureData
  };

  // Google Apps Script로 저장
  fetch("https://script.google.com/macros/s/AKfycbwU8mzi1r-AGpQLipCX4D7OxaASypZqEAxhM4Q-QPniqDeBg1DWRo6yeWd2T3gmVnDBPQ/exec", {
    method: "POST",
    body: JSON.stringify(layoutData),
    headers: {
      'Content-Type': 'application/json'
    }
  })
  .then(response => response.text())
  .then(data => {
    alert("방 배치가 저장되었습니다.");
  });
}

// 유저의 룸 배치 불러오기
function loadRoomLayout(userId) {
  fetch(`https://script.google.com/macros/s/AKfycbwU8mzi1r-AGpQLipCX4D7OxaASypZqEAxhM4Q-QPniqDeBg1DWRo6yeWd2T3gmVnDBPQ/exec?userId=${userId}`)
    .then(response => response.json())
    .then(data => {
      const layoutData = data.layout;
      layoutData.forEach(furniture => {
        const img = document.createElement('img');
        img.src = "assets/sofa.png";  // 예시: 가구 이미지
        img.className = "item";
        img.style.left = `${furniture.x}px`;
        img.style.top = `${furniture.y}px`;
        img.style.zIndex = furniture.zIndex;

        img.addEventListener('click', () => {
          if (selectedFurniture) {
            selectedFurniture.classList.remove('selected');
          }
          selectedFurniture = img;
          img.classList.add('selected');
        });

        canvas.appendChild(img);
      });
    });
}

// 예시: 저장 버튼 클릭 시
document.getElementById('saveBtn').addEventListener('click', saveRoomLayout);

// 예시: 불러오기 버튼 클릭 시
document.getElementById('loadBtn').addEventListener('click', () => {
  const userId = 'user123';  // 예시: 사용자 ID
  loadRoomLayout(userId);
});
