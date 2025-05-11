// --- script.js ---
// 0) 기본 세팅
const canvas    = new fabric.Canvas('c', { selection: false });
const shop      = document.getElementById('shop');
const zSlider   = document.getElementById('zSlider');
const deleteBtn = document.getElementById('deleteBtn');
const saveBtn   = document.getElementById('saveBtn');
const loadBtn   = document.getElementById('loadBtn');
// flip 버튼
const flipBtn   = document.createElement('button');
flipBtn.id      = 'flipBtn';
flipBtn.textContent = '↔️ 반전';
flipBtn.disabled  = true;
document.getElementById('controls').appendChild(flipBtn);

let activeObject = null;

// 1) 상점 드래그 시작
document.querySelectorAll('.shop-item').forEach(img => {
  img.addEventListener('dragstart', e => {
    e.dataTransfer.setData('name', img.dataset.name);
  });
});

// 2) 캔버스에 드롭 → 이미지 추가
canvas.upperCanvasEl.addEventListener('dragover', e => e.preventDefault());
canvas.upperCanvasEl.addEventListener('drop', e => {
  e.preventDefault();
  const name = e.dataTransfer.getData('name');
  const src  = `assets/${name}.png`;
  fabric.Image.fromURL(src, img => {
    img.set({
      left: e.offsetX, top: e.offsetY,
      selectable: true, hasControls: true,
      lockRotation: true, lockUniScaling: false,
      data: { name, src }
    });
    canvas.add(img);
    canvas.setActiveObject(img);
    showControls(img);
  });
});

// 3) 클릭 시 오브젝트 또는 배경 구분하여 컨트롤
canvas.on('mouse:down', opts => {
  if (opts.target) {
    showControls(opts.target);
  } else {
    hideControls();
  }
});

// showControls: 버튼 활성화 및 activeObject 설정
function showControls(obj) {
  activeObject = obj;
  zSlider.disabled   = false;
  deleteBtn.disabled = false;
  flipBtn.disabled   = false;
  // 슬라이더 값 세팅
  const idx = canvas.getObjects().indexOf(obj) + 1;
  zSlider.value = idx;
}

// hideControls: 버튼 비활성화
function hideControls() {
  activeObject = null;
  zSlider.disabled   = true;
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

// 7) 저장 → localStorage (scaleX/scaleY 추가)
saveBtn.addEventListener('click', () => {
  const data = canvas.getObjects().map(obj => ({
    name:   obj.data.name,
    src:    obj.data.src,
    left:   obj.left,
    top:    obj.top,
    scaleX: obj.scaleX || 1,
    scaleY: obj.scaleY || 1,
    flip:   obj.flipX || false,
    z:      canvas.getObjects().indexOf(obj)
  }));
  localStorage.setItem('roomLayout', JSON.stringify(data));
  alert('✅ 저장되었습니다!');
});

// 8) 불러오기 → localStorage (크기/순서/반전 복원)
loadBtn.addEventListener('click', () => {
  const raw = localStorage.getItem('roomLayout');
  if (!raw) return alert('❌ 저장된 레이아웃이 없습니다.');
  const layout = JSON.parse(raw);

  canvas.clear();
  hideControls();

  layout.forEach(item => {
    fabric.Image.fromURL(item.src, img => {
      img.set({
        left: item.left,
        top:  item.top,
        scaleX: item.scaleX,
        scaleY: item.scaleY,
        flipX: item.flip,
        selectable: true,
        hasControls: true,
        lockRotation: true,
        lockUniScaling: false,
        data: { name: item.name, src: item.src }
      });
      canvas.add(img);
      canvas.moveTo(img, item.z);
      canvas.renderAll();
    });
  });
});
