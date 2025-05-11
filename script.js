// Fabric 캔버스 초기화
const canvas    = new fabric.Canvas('c', { selection: false });
const shop      = document.getElementById('shop');
const zSlider   = document.getElementById('zSlider');
const deleteBtn = document.getElementById('deleteBtn');
const saveBtn   = document.getElementById('saveBtn');
const loadBtn   = document.getElementById('loadBtn');

// 1) 드래그 시작
document.querySelectorAll('.shop-item').forEach(img => {
  img.addEventListener('dragstart', e => {
    e.dataTransfer.setData('name', img.dataset.name);
  });
});

// 2) 드롭하여 이미지 추가
canvas.upperCanvasEl.addEventListener('dragover', e => e.preventDefault());
canvas.upperCanvasEl.addEventListener('drop', e => {
  e.preventDefault();
  const name = e.dataTransfer.getData('name');
  const src  = `assets/${name}.png`;
  fabric.Image.fromURL(src, img => {
    img.set({
      left: e.offsetX,
      top: e.offsetY,
      selectable: true,
      hasControls: true,    // 컨트롤 켜기
      lockRotation: true,   // 회전 잠금
      lockUniScaling: false, // 비율 유지 해제 (원하시면 true)
      data: { name }
    });
    canvas.add(img);
    canvas.setActiveObject(img);
    showControls(img);
  });
});

// 3) 선택/해제 시 컨트롤 업데이트
canvas.on('selection:created',  e => showControls(e.target));
canvas.on('selection:updated',  e => showControls(e.target));
canvas.on('before:selection:cleared', () => hideControls());

// showControls: 슬라이더·삭제·flip 버튼 활성화
function showControls(obj) {
  activeObject = obj;
  obj.set({ hasControls: true, lockRotation: true });
  canvas.renderAll();
  // z-index 슬라이더
  zSlider.disabled = false;
  // 현재 순서(index) +1
  const idx = canvas.getObjects().indexOf(obj) + 1;
  zSlider.value = idx;
  // 삭제 버튼 활성화
  deleteBtn.disabled = false;
  // flip 버튼도 활성화
  flipBtn.disabled = false;
}

// hideControls: 비활성화
function hideControls() {
  if (activeObject) {
    activeObject.set({ hasControls: false });
    canvas.renderAll();
  }
  activeObject = null;
}

// 4) z-index 조절 (객체 순서 재배치)
zSlider.addEventListener('input', () => {
  const obj = canvas.getActiveObject();
  if (!obj) return;
  const z = parseInt(zSlider.value) - 1;
  canvas.moveTo(obj, z);
  canvas.renderAll();
});

// 5) 삭제
deleteBtn.addEventListener('click', () => {
  const obj = canvas.getActiveObject();
  if (!obj) return;
  canvas.remove(obj);
  hideControls();
});

// 6) 좌우 반전 버튼 생성 및 이벤트
const flipBtn = document.createElement('button');
flipBtn.textContent = '↔️ 반전';
flipBtn.id = 'flipBtn';
flipBtn.disabled = true;
document.getElementById('controls').appendChild(flipBtn);

flipBtn.addEventListener('click', () => {
  const obj = canvas.getActiveObject();
  if (!obj) return;
  obj.toggle('flipX');
  canvas.renderAll();
});

// 7) 저장 (localStorage)
saveBtn.addEventListener('click', () => {
  const data = canvas.getObjects().map(obj => ({
    name: obj.data.name,
    left: obj.left,
    top: obj.top,
    flip: obj.flipX || false,
    z: canvas.getObjects().indexOf(obj)
  }));
  localStorage.setItem('roomLayout', JSON.stringify(data));
  alert('저장되었습니다!');
});

// 8) 불러오기 (localStorage)
loadBtn.addEventListener('click', () => {
  const raw = localStorage.getItem('roomLayout');
  if (!raw) {
    return alert('저장된 레이아웃이 없습니다.');
  }
  const layout = JSON.parse(raw);
  canvas.clear();
  hideControls();
  layout.forEach(item => {
    fabric.Image.fromURL(`assets/${item.name}.png`, img => {
      img.set({
        left: item.left,
        top:  item.top,
        flipX: item.flip,
        selectable: true,
        hasControls: false,
        data: { name: item.name }
      });
      canvas.add(img);
      // 순서 재배치
      canvas.moveTo(img, item.z);
      canvas.renderAll();
    });
  });
});

// 9) 캔버스 클릭 시 컨트롤 숨김
canvas.on('mouse:down', opts => {
  if (!opts.target) hideControls();
});
