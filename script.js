const GAS_URL = "https://script.google.com/macros/s/AKfycbyUFjgyZK1VomJVHENpN0GN0IIIvqgSWki1k9a4TSLSRleTr01p5D1kZxG51OTOJ3rUCQ/exec";
const userId  = new URLSearchParams(location.search).get("user") || "default";
const canvas  = document.getElementById("canvas");
const shop    = document.getElementById("shop");
let inventory = [];
let layout    = [];

// 1) 인벤토리 불러와 샵 렌더
fetch(`${GAS_URL}?userId=${userId}&type=inventory`)
  .then(r=>r.json())
  .then(data=> {
    inventory = data.inventory || [];
    inventory.forEach(item => {
      const img = document.createElement("img");
      img.src = item.img;
      img.className = "shop-item";
      img.draggable = true;
      img.dataset.name = item.name;
      img.addEventListener("dragstart", e => {
        e.dataTransfer.setData("name", item.name);
      });
      shop.appendChild(img);
    });
  });

// 2) 배치 정보 불러오기 (초기 렌더)
function loadLayout() {
  fetch(`${GAS_URL}?userId=${userId}&type=layout`)
    .then(r=>r.json())
    .then(data=> {
      layout = data.layout || [];
      canvas.innerHTML = "";
      layout.forEach(obj => addFurniture(obj));
    });
}

// 3) 드래그 앤 드롭
canvas.addEventListener("dragover", e=>e.preventDefault());
canvas.addEventListener("drop", e=> {
  e.preventDefault();
  const name = e.dataTransfer.getData("name");
  const x = e.offsetX, y = e.offsetY;
  const obj = { name, x, y, z:10, flip:false };
  layout.push(obj);
  addFurniture(obj);
});

// 4) 가구 엘리먼트 생성
function addFurniture(obj) {
  const div = document.createElement("div");
  div.className = "furniture";
  div.style.left = obj.x + "px";
  div.style.top  = obj.y + "px";
  div.style.zIndex = obj.z;
  div.style.transform = obj.flip ? "scaleX(-1)" : "";

  const img = document.createElement("img");
  img.src = inventory.find(i=>i.name===obj.name)?.img;
  div.appendChild(img);

  //  선택 & 컨트롤
  div.addEventListener("click", e => {
    e.stopPropagation();
    document.querySelectorAll(".controls")?.forEach(c=>c.remove());
    showControls(div, obj);
  });

  makeDraggable(div, obj);
  canvas.appendChild(div);
}

// 5) 드래그 이동으로 좌표 업데이트
function makeDraggable(el, obj) {
  let dx, dy, down=false;
  el.onmousedown = e => {
    down=true; dx = e.offsetX; dy = e.offsetY;
  };
  window.onmousemove = e => {
    if (!down) return;
    obj.x = e.pageX - canvas.offsetLeft - dx;
    obj.y = e.pageY - canvas.offsetTop - dy;
    el.style.left = obj.x + "px";
    el.style.top  = obj.y + "px";
  };
  window.onmouseup = () => down=false;
}

// 6) z-index 슬라이더 + 삭제 버튼
function showControls(el, obj) {
  const c = document.createElement("div");
  c.className = "controls";
  c.innerHTML = `
    <input type="range" min="1" max="100" value="${obj.z}" />
    <button>삭제</button>
  `;
  c.querySelector("input").oninput = e => {
    obj.z = +e.target.value;
    el.style.zIndex = obj.z;
  };
  c.querySelector("button").onclick = () => {
    layout = layout.filter(o=>o!==obj);
    el.remove();
  };
  el.appendChild(c);
}

// 7) 저장 & 불러오기 버튼 이벤트
document.getElementById("saveBtn").onclick = () => {
  fetch(GAS_URL, {
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ userId, type:"layout", layout })
  }).then(()=>alert("저장완료"));
};
document.getElementById("loadBtn").onclick = loadLayout;

// 캔버스 클릭 시 컨트롤 제거
canvas.addEventListener("click", ()=> {
  document.querySelectorAll(".controls")?.forEach(c=>c.remove());
});

// 초기 로드
loadLayout();
