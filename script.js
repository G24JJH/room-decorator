const canvas = document.getElementById("canvas");
const shop = document.getElementById("shop");
const controlPanel = document.getElementById("control-panel");
const zSlider = document.getElementById("z-index-slider");
const zValue = document.getElementById("z-index-value");
const selectedName = document.getElementById("selected-name");

let selectedFurniture = null;
let userFurniture = {
  sofa: 1,
  desk: 1,
  chair: 0 // 예시: 이건 0개니까 안 보이게
};

// 🛍️ 보유 가구만 목록에 표시
for (const [name, count] of Object.entries(userFurniture)) {
  if (count > 0) {
    const img = document.createElement("img");
    img.src = `assets/${name}.png`;
    img.draggable = true;
    img.className = "shop-item";
    img.dataset.name = name;
    shop.appendChild(img);

    img.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("furniture", name);
    });
  }
}

// 📦 가구 드롭
canvas.addEventListener("dragover", (e) => e.preventDefault());

canvas.addEventListener("drop", (e) => {
  e.preventDefault();
  const name = e.dataTransfer.getData("furniture");
  if (userFurniture[name] <= 0) {
    alert("해당 가구가 부족합니다!");
    return;
  }

  const id = name + Date.now();
  const img = document.createElement("img");
  img.src = `assets/${name}.png`;
  img.className = "furniture";
  img.style.left = `${e.offsetX}px`;
  img.style.top = `${e.offsetY}px`;
  img.style.zIndex = 10;
  img.id = id;
  img.dataset.name = name;

  canvas.appendChild(img);
  userFurniture[name]--;

  setupFurnitureEvents(img);
  selectFurniture(img);
});

// 🧲 클릭 시 가구 선택 및 zIndex 조절
function setupFurnitureEvents(img) {
  img.addEventListener("click", (e) => {
    e.stopPropagation();
    selectFurniture(img);
  });

  // 드래그 이동
  let offsetX, offsetY;
  img.addEventListener("mousedown", (e) => {
    e.preventDefault();
    selectFurniture(img);
    offsetX = e.offsetX;
    offsetY = e.offsetY;

    function onMouseMove(moveEvent) {
      img.style.left = `${moveEvent.pageX - canvas.offsetLeft - offsetX}px`;
      img.style.top = `${moveEvent.pageY - canvas.offsetTop - offsetY}px`;
    }

    function onMouseUp() {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    }

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  });
}

// 🎯 선택 UI
function selectFurniture(furniture) {
  document.querySelectorAll(".furniture").forEach(f => f.classList.remove("selected"));
  furniture.classList.add("selected");
  selectedFurniture = furniture;
  selectedName.textContent = furniture.dataset.name;
  zSlider.value = furniture.style.zIndex || 10;
  zValue.textContent = zSlider.value;
  controlPanel.style.display = "block";
}

// 🧭 Z-index 슬라이더 동기화
zSlider.addEventListener("input", () => {
  if (selectedFurniture) {
    selectedFurniture.style.zIndex = zSlider.value;
    zValue.textContent = zSlider.value;
  }
});

// 🧼 캔버스 바깥 클릭 시 선택 해제
document.body.addEventListener("click", () => {
  selectedFurniture = null;
  controlPanel.style.display = "none";
  document.querySelectorAll(".furniture").forEach(f => f.classList.remove("selected"));
});
