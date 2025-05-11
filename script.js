// --- script.js ---

// 0) 기본 세팅
const canvas    = new fabric.Canvas('c', { selection: false });
const shop      = document.getElementById('shop');
const zSlider   = document.getElementById('zSlider');
const deleteBtn = document.getElementById('deleteBtn');
const saveBtn   = document.getElementById('saveBtn');
const loadBtn   = document.getElementById('loadBtn');

// 전역 flip 버튼 (controls 영역에 삽입)
const flipBtn = document.createElement('button');
flipBtn.id = 'flipBtn';
flipBtn.textContent = '↔️ 반전';
flipBtn.disabled = true;
document.getElementById('controls').appendChild(flipBtn);

let activeObject = null;

// 1) 상점 이미지 드래그 시작
document.querySelectorAll('.shop-item').forEach(img => {
  img.addEventListener('dragstart', e => {
    e.dataTransfer.setData('name', img.dataset.name);
  });
});

// 2) 캔버스에 드롭하면 Fabric 이미지 추가
canvas.upperCanvasEl.addEventListener('dragover', e => e.preventDefault());
canvas.upperCanvasEl.addEventListener('drop', e => {
  e.preventDefault();
  const name = e.dataTransfer.getData('name');
  const src  = `assets/${name}.png`;

  fabric.Image.fromURL(src, img => {
    img.set({
      left: e.offsetX,
      top:  e.offsetY,
      selectable: true,
      hasControls: true,
      lockRotation: true,
      lockUniScaling: false,
      data: { name, src }
    });
    canvas.add(img);
    canvas.setActiveObject(img);
    showControls(img);
  });
});

// 3) 선택/해제 이벤트로 컨트롤 표시/숨김
canvas.on('selection:created',  e => showControls(e.target));
canvas.on('selection:updated',  e => showControls(e.target));
canvas.on('before:selection:cleared', () => hideControls());

function showControls(obj) {
  activeObject = obj;
  // 컨트롤 핸들 모두 활성화
  zSlider.disabled = false;
  deleteBtn.disabled = false;
  flipBtn.disabled   = false;

  // slider 값 세팅 (z-order)
  const idx = canvas.getObjects().indexOf(obj) + 1;
  zSlider.value = idx;
}

function hideControls() {
  activeObject = null;
  zSlider.disabled = true;
  deleteBtn.disabled = true;
  flipBtn.disabled   = true;
}

// 4) z-index 슬라이더
zSlider.addEventListener('input', () => {
  if (!activeObject) return;
  const z = parseInt(zSlider.value) - 1;
  canvas.moveTo(activeObject, z);
  canvas.renderAll();
});

// 5) 삭제 버튼
deleteBtn.addEventListener('click', () => {
  if (!activeObject) return;
  canvas.remove(activeObject);
  hideControls();
});

// 6) 반전 버튼
flipBtn.addEventListener('click', () => {
  if (!activeObject) return;
  activeObject.toggle('flipX');
  canvas.renderAll();
});

// 7) 저장 → localStorage
saveBtn.addEventListener('click', () => {
  const data = canvas.getObjects().map(obj => ({
    name: obj.data.name,
    src:  obj.data.src,
    left: obj.left,
    top:  obj.top,
    flip: obj.flipX || false,
    z:    canvas.getObjects().indexOf(obj)
  }));
  localStorage.setItem('roomLayout', JSON.stringify(data));
  alert('✅ 저장되었습니다!');
});

// 8) 불러오기 → localStorage
loadBtn.addEventListener('click', () => {
  const raw = localStorage.getItem('roomLayout');
  if (!raw) {
    return alert('❌ 저장된 레이아웃이 없습니다.');
  }
  const layout = JSON.parse(raw);

  canvas.clear();
  hideControls();

  // 비동기 이미지 로드 → 순서 보장
  layout.forEach(item => {
    fabric.Image.fromURL(item.src, img => {
      img.set({
        left:  item.left,
        top:   item.top,
        selectable: true,
        hasControls: true,
        lockRotation: true,
        lockUniScaling: false,
        flipX: item.flip,
        data: { name: item.name, src: item.src }
      });
      canvas.add(img);
      canvas.moveTo(img, item.z);
      canvas.renderAll();
    });
  });
});

// 9) 빈 공간 클릭 시 컨트롤 숨김
canvas.on('mouse:down', opts => {
  if (!opts.target) hideControls();
});
