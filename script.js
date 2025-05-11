// Fabric 캔버스 초기화
const canvas = new fabric.Canvas('c', { selection: false });
const shop    = document.getElementById('shop');
const zSlider = document.getElementById('zSlider');
const deleteBtn = document.getElementById('deleteBtn');
const saveBtn   = document.getElementById('saveBtn');
const loadBtn   = document.getElementById('loadBtn');

let activeObject = null;

// 1) 가구 드래그 시작
document.querySelectorAll('.shop-item').forEach(img => {
  img.addEventListener('dragstart', e => {
    e.dataTransfer.setData('name', img.dataset.name);
  });
});

// 2) 캔버스에 드롭
canvas.upperCanvasEl.addEventListener('dragover', e => e.preventDefault());
canvas.upperCanvasEl.addEventListener('drop', e => {
  e.preventDefault();
  const name = e.dataTransfer.getData('name');
  const src = `assets/${name}.png`;
  fabric.Image.fromURL(src, img => {
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
  });
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
  document.querySelectorAll('.controls').forEach(c => c.remove());
}

// 4) z-index 조절
zSlider.addEventListener('input', () => {
  if (!activeObject) return;
  canvas.bringToFront(activeObject);
  activeObject.set('zIndex', +zSlider.value);
  canvas.renderAll();
});

// 5) 삭제
deleteBtn.addEventListener('click', () => {
  if (!activeObject) return;
  canvas.remove(activeObject);
  clearControls();
});

// 6) 저장 (localStorage)
saveBtn.addEventListener('click', () => {
  const layout = canvas.toJSON(['data']).objects.map(o => ({
    name: o.data.name,
    src: o.getSrc(),
    left: o.left,
    top: o.top,
    flip: o.flipX || false,
    z: canvas.getObjects().indexOf(canvas._objects.find(x=>x === o)) + 1
  }));
  localStorage.setItem('roomLayout', JSON.stringify(layout));
  alert('저장 완료 (localStorage)');
});

// 7) 불러오기 (localStorage)
loadBtn.addEventListener('click', () => {
  const raw = localStorage.getItem('roomLayout');
  if (!raw) return alert('저장된 레이아웃이 없습니다.');
  const layout = JSON.parse(raw);
  canvas.clear();
  layout.forEach(o => {
    fabric.Image.fromURL(o.src, img => {
      img.set({ left:o.left, top:o.top, flipX:o.flip, selectable:true, hasControls:false, data:{name:o.name} });
      canvas.add(img);
    });
  });
});

// 캔버스 클릭 시 컨트롤 해제
canvas.on('mouse:down', opts => {
  if (!opts.target) clearControls();
});
