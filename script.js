// 설정
const GAS_URL = 'https://script.google.com/macros/s/AKfycbyUFjgyZK1VomJVHENpN0GN0IIIvqgSWki1k9a4TSLSRleTr01p5D1kZxG51OTOJ3rUCQ/exec';
const userId  = new URLSearchParams(location.search).get('user') || 'defaultUser';

// Fabric 캔버스 초기화
const canvas = new fabric.Canvas('c', { selection: false });

// UI 요소
const shop    = document.getElementById('shop');
const zSlider = document.getElementById('zSlider');
const deleteBtn = document.getElementById('deleteBtn');
const saveBtn   = document.getElementById('saveBtn');
const loadBtn   = document.getElementById('loadBtn');

// 현재 선택된 오브젝트
let activeObject = null;

// 1) 인벤토리 불러오기 & 상점 렌더
fetch(`${GAS_URL}?userId=${userId}&type=inventory`)
  .then(r=>r.json())
  .then(data => {
    data.inventory.forEach(item => {
      const img = document.createElement('img');
      img.src = item.img;
      img.className = 'shop-item';
      img.draggable = true;
      img.dataset.name = item.name;
      img.addEventListener('dragstart', e => {
        e.dataTransfer.setData('name', item.name);
      });
      shop.appendChild(img);
    });
  });

// 2) 캔버스에 드롭
canvas.upperCanvasEl.addEventListener('dragover', e => e.preventDefault());
canvas.upperCanvasEl.addEventListener('drop', e => {
  e.preventDefault();
  const name = e.dataTransfer.getData('name');
  // 재고 체크 생략; 프로토타입에서는 무한 공급
  fabric.Image.fromURL(
    shop.querySelector(`[data-name="${name}"]`).src,
    img => {
      img.set({
        left: e.offsetX,
        top: e.offsetY,
        selectable: true,
        hasControls: false,
        data: { name }
      });
      canvas.add(img);
      canvas.setActiveObject(img);
      updateControls(img);
    }
  );
});

// 3) 선택 / 컨트롤 업데이트
canvas.on('selection:created', e => updateControls(e.target));
canvas.on('selection:updated', e => updateControls(e.target));
canvas.on('before:selection:cleared', () => clearControls());

function updateControls(obj) {
  activeObject = obj;
  zSlider.disabled = false;
  zSlider.value = canvas.getObjects().indexOf(obj) + 1;
  deleteBtn.disabled = false;
}
function clearControls() {
  activeObject = null;
  zSlider.disabled = true;
  deleteBtn.disabled = true;
}

// 4) z-index 조절
zSlider.addEventListener('input', () => {
  if (!activeObject) return;
  const idx = parseInt(zSlider.value) - 1;
  canvas.bringToFront(activeObject);
  // 순서를 재정렬하려면 전체 오브젝트 재정렬 로직 필요
  canvas.renderAll();
});

// 5) 삭제
deleteBtn.addEventListener('click', () => {
  if (!activeObject) return;
  canvas.remove(activeObject);
  clearControls();
});

// 6) 저장 (레이아웃 JSON)
saveBtn.addEventListener('click', () => {
  const layout = canvas.toJSON(['data']).objects.map(o => ({
    name: o.data.name,
    src: o.src,
    left: o.left,
    top: o.top,
    flip: o.flipX || false,
    z: canvas.getObjects().indexOf(canvas._objects.find(x=>x === o)) + 1
  }));
  fetch(GAS_URL, {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ userId, type:'layout', layout })
  }).then(()=>alert('저장 완료'));
});

// 7) 불러오기
loadBtn.addEventListener('click', () => {
  fetch(`${GAS_URL}?userId=${userId}&type=layout`)
    .then(r=>r.json())
    .then(data => {
      canvas.clear();
      data.layout.forEach(o => {
        fabric.Image.fromURL(o.src, img => {
          img.set({ left:o.left, top:o.top, flipX:o.flip });
          canvas.add(img);
        });
      });
    });
});
