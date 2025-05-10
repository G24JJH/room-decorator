const canvas = document.getElementById('canvas');
const shop = document.getElementById('shop');
let selectedItem = null;
let furnitureList = {};
let userId = getUserIdFromURL();

window.onload = () => {
  fetch(`https://script.google.com/macros/s/AKfycbxpzwYKwPNRCeLAWJ98W28Ox0Wx6tRW01fczXIPxpKhH5QfyjT4aeuBVpkz8xWJiv1OEw/exec?userId=${userId}&type=inventory`)
    .then(res => res.json())
    .then(data => {
      furnitureList = data.furniture;
      initializeShop(furnitureList);
    });
};

function initializeShop(list) {
  shop.innerHTML = "";
  Object.entries(list).forEach(([key, value]) => {
    if (value.count > 0) {
      const img = document.createElement("img");
      img.src = value.img;
      img.className = "shop-item";
      img.draggable = true;
      img.dataset.key = key;
      img.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("furniture-key", key);
      });
      shop.appendChild(img);
    }
  });
}

// 보유 가구만 상점에 표시
Object.entries(furnitureList).forEach(([key, value]) => {
  if (value.count > 0) {
    const img = document.createElement("img");
    img.src = value.img;
    img.className = "shop-item";
    img.draggable = true;
    img.dataset.key = key;
    img.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("furniture-key", key);
    });
    shop.appendChild(img);
  }
});

canvas.addEventListener("dragover", e => e.preventDefault());
canvas.addEventListener("drop", e => {
  e.preventDefault();
  const key = e.dataTransfer.getData("furniture-key");
  if (furnitureList[key].count <= 0) return alert("더 이상 배치할 수 없습니다.");

  furnitureList[key].count--;

  const furniture = document.createElement("div");
  furniture.className = "furniture";
  furniture.style.left = `${e.offsetX - 30}px`;
  furniture.style.top = `${e.offsetY - 30}px`;
  furniture.style.zIndex = 10;

  const img = document.createElement("img");
  img.src = furnitureList[key].img;
  img.style.pointerEvents = "none";
  furniture.appendChild(img);

  // 좌우 반전
  furniture.addEventListener("dblclick", () => {
    const scale = furniture.style.transform === "scaleX(-1)" ? "scaleX(1)" : "scaleX(-1)";
    furniture.style.transform = scale;
  });

  // 선택 이벤트
  furniture.addEventListener("click", (e) => {
    e.stopPropagation();
    selectItem(furniture);
  });

  makeDraggable(furniture);
  canvas.appendChild(furniture);
});

// 캔버스 클릭 시 선택 해제
canvas.addEventListener("click", () => {
  if (selectedItem) {
    selectedItem.querySelector(".controls").remove();
    selectedItem = null;
  }
});

function selectItem(item) {
  if (selectedItem) {
    selectedItem.querySelector(".controls").remove();
  }
  selectedItem = item;

  const controls = document.createElement("div");
  controls.className = "controls";
  controls.innerHTML = `
    <label>Z:
      <input type="range" min="1" max="100" value="${item.style.zIndex}" />
    </label>
    <button>삭제</button>
  `;

  controls.querySelector("input").addEventListener("input", (e) => {
    item.style.zIndex = e.target.value;
  });

  controls.querySelector("button").addEventListener("click", () => {
    item.remove();
    selectedItem = null;
  });

  item.appendChild(controls);
  controls.style.display = "block";
}

// 드래그 이동
function makeDraggable(el) {
  let isDragging = false;
  let offsetX, offsetY;

  el.addEventListener("mousedown", (e) => {
    if (e.target.closest(".controls")) return;
    isDragging = true;
    offsetX = e.offsetX;
    offsetY = e.offsetY;
  });

  window.addEventListener("mousemove", (e) => {
    if (!isDragging || !el) return;
    el.style.left = `${e.pageX - canvas.offsetLeft - offsetX}px`;
    el.style.top = `${e.pageY - canvas.offsetTop - offsetY}px`;
  });

  window.addEventListener("mouseup", () => {
    isDragging = false;
  });
}

// 저장 / 불러오기
function saveRoom() {
  const items = Array.from(canvas.querySelectorAll(".furniture")).map(el => {
    const img = el.querySelector("img");
    return {
      src: img.src,
      x: parseInt(el.style.left),
      y: parseInt(el.style.top),
      z: parseInt(el.style.zIndex),
      flip: el.style.transform === "scaleX(-1)" ? true : false
    };
  });

  fetch("https://script.google.com/macros/s/AKfycbxpzwYKwPNRCeLAWJ98W28Ox0Wx6tRW01fczXIPxpKhH5QfyjT4aeuBVpkz8xWJiv1OEw/exec", {
    method: "POST",
    body: JSON.stringify({ userId, layout: items }),
    headers: { "Content-Type": "application/json" }
  }).then(res => res.text()).then(console.log);
}

function loadRoom() {
  fetch("https://script.google.com/macros/s/AKfycbxpzwYKwPNRCeLAWJ98W28Ox0Wx6tRW01fczXIPxpKhH5QfyjT4aeuBVpkz8xWJiv1OEw/exec?userId=" + userId)
    .then(res => res.json())
    .then(data => {
      canvas.innerHTML = ""; // 초기화
      data.layout.forEach(item => {
        const el = document.createElement("div");
        el.className = "furniture";
        el.style.left = `${item.x}px`;
        el.style.top = `${item.y}px`;
        el.style.zIndex = item.z;
        el.style.transform = item.flip ? "scaleX(-1)" : "scaleX(1)";

        const img = document.createElement("img");
        img.src = item.src;
        img.style.pointerEvents = "none";
        el.appendChild(img);

        el.addEventListener("click", (e) => {
          e.stopPropagation();
          selectItem(el);
        });

        el.addEventListener("dblclick", () => {
          const scale = el.style.transform === "scaleX(-1)" ? "scaleX(1)" : "scaleX(-1)";
          el.style.transform = scale;
        });

        makeDraggable(el);
        canvas.appendChild(el);
      });
    });
}

function getUserIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("user") || "defaultUser";
}
