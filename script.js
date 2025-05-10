const canvas = document.getElementById('canvas');
const shop = document.getElementById('shop');
let selectedItem = null;
let furnitureList = {};
let userId = getUserIdFromURL();
const GAS_URL = 'https://script.google.com/macros/s/AKfycbx9262w3aZ36nFlK1BxUATFe3IADscwtx0MUle4jxAXovOlDOUc-Z873Mu_d6aYcwi1BA/exec';

window.onload = () => {
  fetch(`${GAS_URL}?userId=${userId}&type=inventory`)
    .then(res => res.json())
    .then(data => {
      furnitureList = data.furniture;
      initializeShop(furnitureList);
    })
    .catch(err => {
      console.error("가구 목록 불러오기 실패:", err);
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

canvas.addEventListener("dragover", e => e.preventDefault());

canvas.addEventListener("drop", e => {
  e.preventDefault();
  const key = e.dataTransfer.getData("furniture-key");
  if (!furnitureList[key] || furnitureList[key].count <= 0) {
    alert("보유한 수량이 없습니다.");
    return;
  }
  furnitureList[key].count--;

  const el = createFurnitureElement(key, e.offsetX - 30, e.offsetY - 30);
  canvas.appendChild(el);
});

function createFurnitureElement(key, x, y, z = 10, flip = false) {
  const el = document.createElement("div");
  el.className = "furniture";
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  el.style.zIndex = z;
  el.style.transform = flip ? "scaleX(-1)" : "scaleX(1)";

  const img = document.createElement("img");
  img.src = furnitureList[key]?.img || "";
  img.draggable = false;
  el.appendChild(img);

  el.addEventListener("click", (e) => {
    e.stopPropagation();
    selectItem(el);
  });

  el.addEventListener("dblclick", () => {
    el.style.transform = el.style.transform === "scaleX(-1)" ? "scaleX(1)" : "scaleX(-1)";
  });

  makeDraggable(el);
  return el;
}

canvas.addEventListener("click", () => {
  if (selectedItem) {
    const prev = selectedItem.querySelector(".controls");
    if (prev) prev.remove();
    selectedItem = null;
  }
});

function selectItem(el) {
  if (selectedItem && selectedItem !== el) {
    const prev = selectedItem.querySelector(".controls");
    if (prev) prev.remove();
  }

  selectedItem = el;

  const controls = document.createElement("div");
  controls.className = "controls";
  controls.innerHTML = `
    <label>Z:
      <input type="range" min="1" max="100" value="${el.style.zIndex || 10}" />
    </label>
    <button>삭제</button>
  `;
  controls.querySelector("input").addEventListener("input", (e) => {
    el.style.zIndex = e.target.value;
  });

  controls.querySelector("button").addEventListener("click", () => {
    el.remove();
    selectedItem = null;
  });

  el.appendChild(controls);
  controls.style.display = "block";
}

function makeDraggable(el) {
  let offsetX = 0, offsetY = 0, isDragging = false;

  el.addEventListener("mousedown", (e) => {
    if (e.target.closest(".controls")) return;
    isDragging = true;
    const rect = el.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
  });

  document.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    const left = e.clientX - canvas.offsetLeft - offsetX;
    const top = e.clientY - canvas.offsetTop - offsetY;
    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
  });

  document.addEventListener("mouseup", () => {
    isDragging = false;
  });
}

function saveRoom() {
  const layout = Array.from(canvas.querySelectorAll(".furniture")).map(el => ({
    src: el.querySelector("img").src,
    x: parseInt(el.style.left),
    y: parseInt(el.style.top),
    z: parseInt(el.style.zIndex),
    flip: el.style.transform === "scaleX(-1)"
  }));

  fetch(GAS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "save", userId, layout })
  }).then(res => res.text()).then(console.log);
}

function loadRoom() {
  fetch(`${GAS_URL}?type=load&userId=${userId}`)
    .then(res => res.json())
    .then(data => {
      canvas.innerHTML = "";
      data.layout.forEach(item => {
        const key = findKeyByImg(item.src);
        const el = createFurnitureElement(key, item.x, item.y, item.z, item.flip);
        canvas.appendChild(el);
      });
    });
}

function findKeyByImg(src) {
  return Object.keys(furnitureList).find(k => furnitureList[k].img === src) || "unknown";
}

function getUserIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("user") || "defaultUser";
}
