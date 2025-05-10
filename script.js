const canvas = document.getElementById("canvas");
const shopItemsContainer = document.getElementById("shop-items");

let userId = new URLSearchParams(location.search).get("user") || "guest";
let furnitureCounts = {
  sofa: 2,
  table: 1,
  chair: 3
};

let selectedItem = null;
let furnitureIdCounter = 0;

const GAS_URL = "https://script.google.com/macros/s/AKfycbwU8mzi1r-AGpQLipCX4D7OxaASypZqEAxhM4Q-QPniqDeBg1DWRo6yeWd2T3gmVnDBPQ/exec";

function createShopItems() {
  Object.entries(furnitureCounts).forEach(([name, count]) => {
    if (count <= 0) return;

    const img = document.createElement("img");
    img.src = `assets/${name}.png`;
    img.className = "shop-item";
    img.draggable = true;
    img.dataset.name = name;
    img.title = `${name} (${count}개)`;

    img.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("furniture", name);
    });

    shopItemsContainer.appendChild(img);
  });
}

canvas.addEventListener("dragover", (e) => e.preventDefault());

canvas.addEventListener("drop", (e) => {
  e.preventDefault();
  const name = e.dataTransfer.getData("furniture");

  if (furnitureCounts[name] <= 0) {
    alert("더 이상 배치할 수 없습니다.");
    return;
  }

  addFurniture(name, e.offsetX, e.offsetY);
  furnitureCounts[name]--;
  refreshShop();
});

function refreshShop() {
  shopItemsContainer.innerHTML = "";
  createShopItems();
}

function addFurniture(name, x, y) {
  const id = `${name}-${++furnitureIdCounter}`;
  const div = document.createElement("div");
  div.className = "furniture";
  div.id = id;
  div.style.left = `${x}px`;
  div.style.top = `${y}px`;
  div.style.zIndex = 10;

  const img = document.createElement("img");
  img.src = `assets/${name}.png`;
  img.className = "furniture-img";

  const zSlider = document.createElement("input");
  zSlider.type = "range";
  zSlider.min = 1;
  zSlider.max = 100;
  zSlider.value = 10;
  zSlider.addEventListener("input", () => {
    div.style.zIndex = zSlider.value;
  });

  const flipBtn = document.createElement("button");
  flipBtn.textContent = "좌우반전";
  flipBtn.onclick = () => {
    img.style.transform = img.style.transform === "scaleX(-1)" ? "scaleX(1)" : "scaleX(-1)";
  };

  const delBtn = document.createElement("button");
  delBtn.textContent = "삭제";
  delBtn.onclick = () => {
    div.remove();
    furnitureCounts[name]++;
    refreshShop();
  };

  div.appendChild(img);
  div.appendChild(document.createElement("br"));
  div.appendChild(zSlider);
  div.appendChild(flipBtn);
  div.appendChild(delBtn);

  makeDraggable(div);
  canvas.appendChild(div);
}

function makeDraggable(el) {
  let offsetX = 0, offsetY = 0;

  el.onmousedown = function (e) {
    selectedItem = el;
    offsetX = e.offsetX;
    offsetY = e.offsetY;

    document.onmousemove = function (e) {
      selectedItem.style.left = (e.pageX - canvas.offsetLeft - offsetX) + "px";
      selectedItem.style.top = (e.pageY - canvas.offsetTop - offsetY) + "px";
    };

    document.onmouseup = function () {
      document.onmousemove = null;
      selectedItem = null;
    };
  };
}

function saveLayout() {
  const furniture = Array.from(document.querySelectorAll(".furniture")).map(div => {
    const name = div.id.split("-")[0];
    const x = parseInt(div.style.left);
    const y = parseInt(div.style.top);
    const z = parseInt(div.style.zIndex);
    const flipped = div.querySelector("img").style.transform === "scaleX(-1)";

    return { name, x, y, z, flipped };
  });

  fetch(GAS_URL, {
    method: "POST",
    body: JSON.stringify({ userId, layout: furniture })
  }).then(res => res.text())
    .then(msg => alert("저장 완료"));
}

function loadLayout() {
  fetch(`${GAS_URL}?userId=${userId}`)
    .then(res => res.json())
    .then(data => {
      data.layout.forEach(item => {
        addFurniture(item.name, item.x, item.y);
        const div = document.getElementById(`${item.name}-${furnitureIdCounter}`);
        div.style.zIndex = item.z;
        if (item.flipped) {
          div.querySelector("img").style.transform = "scaleX(-1)";
        }
        furnitureCounts[item.name]--;
      });
      refreshShop();
    });
}

// 초기 실행
createShopItems();
