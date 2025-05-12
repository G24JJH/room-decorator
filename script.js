// --- script.js ---
// 0) 기본 세팅
const canvas    = new fabric.Canvas('c', { selection: false });
const shop      = document.getElementById('shop');
const zSlider   = document.getElementById('zSlider');
const deleteBtn = document.getElementById('deleteBtn');
const saveBtn = document.getElementById('saveBtn');
if (saveBtn) {
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

    const userId = localStorage.getItem('userId');
    if (!userId) return alert('로그인이 필요합니다.');

    saveLayoutToSheet(userId, data);  // ✅ 전달한 데이터로 저장
    localStorage.setItem('roomLayout', JSON.stringify(data));
    alert('✅ 저장되었습니다!');
  });
}
const loadBtn   = document.getElementById('loadBtn');

// flip 버튼
const flipBtn   = document.createElement('button');
flipBtn.id      = 'flipBtn';
flipBtn.textContent = '↔️ 반전!';
flipBtn.disabled  = true;
document.getElementById('controls').appendChild(flipBtn);

let activeObject = null;
let gapiLoaded = false;

function start() {
  gapi.client.init({
    apiKey: 'AIzaSyBYMvVkhdniX7glIF42vV6BdPzRwL0AJJQ',
    discoveryDocs: ["https://sheets.googleapis.com/$discovery/rest?version=v4"],
  }).then(() => {
    gapiLoaded = true;  // API 로드 성공 후 true로 설정
    console.log("Google API loaded successfully.");
  }).catch(e => {
    console.error("API 로드 실패:", e);
  });
}

gapi.load('client', start);  // gapi 클라이언트 로드 시작

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

  const userId = localStorage.getItem('userId');
  if (!userId) return alert('로그인이 필요합니다.');

  saveLayoutToSheet(userId, data);  // ✅ 전달한 데이터로 저장
  localStorage.setItem('roomLayout', JSON.stringify(data));
  alert('✅ 저장되었습니다!');
});

// 8) 불러오기 → localStorage (크기/순서/반전 복원)
loadBtn.addEventListener('click', () => {
  const userId = localStorage.getItem('userId');
  if (!userId) return alert('❌ 로그인이 필요합니다.');
  loadLayoutFromSheet(userId);  // ✅ 구글 시트에서 불러오기
});

// 로그인 제어
const loginSection = document.getElementById('loginSection');
const appSection = document.getElementById('app');
const loginBtn = document.getElementById('loginBtn');
const loginStatus = document.getElementById('loginStatus');

// 로그인 버튼 이벤트
loginBtn.addEventListener('click', () => {
  const id = document.getElementById('loginId').value;
  const pw = document.getElementById('loginPw').value;

  if (id === '1234' && pw === '1234') {
    localStorage.setItem('userId', id);
    loginStatus.textContent = `✅ 로그인 성공!`;
    loginStatus.style.color = 'green';

    // UI 전환
    loginSection.style.display = 'none';
    appSection.style.display = 'block';
  } else {
    loginStatus.textContent = '❌ 로그인 실패. ID 또는 비밀번호가 잘못되었습니다.';
    loginStatus.style.color = 'red';
  }
});

// 자동 로그인 (이미 로그인 되어 있으면 바로 app 보여주기)
window.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('userId')) {
    loginSection.style.display = 'none';
    appSection.style.display = 'block';
  }
});

function saveLayoutToSheet(userId, data) {
  if (!gapiLoaded) return alert('Google API가 로드되지 않았습니다.');

  const layoutJson = JSON.stringify(data);

  // 먼저 유저 ID가 위치한 행을 찾아야 함
  gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: '1xUDw_vkG2aS5KF0F50gGpSDgRMmdBZ2_pQc27D39_qQ',
    range: '룸!A1:F10',
  }).then(res => {
    const rows = res.result.values;
    const rowIndex = rows.findIndex(row => row[0] === userId);
    if (rowIndex === -1) return alert('유저를 찾을 수 없습니다.');

    const sheetRow = rowIndex + 2; // 실제 시트의 행 번호
    const updateRange = `룸!D${sheetRow}`;  // D열에 저장

    return gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId: '1xUDw_vkG2aS5KF0F50gGpSDgRMmdBZ2_pQc27D39_qQ',
      range: updateRange,
      valueInputOption: 'RAW',
      resource: {
        values: [[layoutJson]]
      }
    });
  }).then(() => {
    alert('✅ 구글 스프레드시트에 저장되었습니다.');
  }).catch(err => {
    console.error('스프레드시트 저장 실패:', err);
  });
}

function loadLayoutFromSheet(userId) {
  if (!gapiLoaded) return alert('Google API가 로드되지 않았습니다.');

  gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: '1xUDw_vkG2aS5KF0F50gGpSDgRMmdBZ2_pQc27D39_qQ',  // ✅ 진짜 스프레드시트 ID
    range: '룸!A1:D10',
  }).then(res => {
    const rows = res.result.values;
    const userRow = rows.find(row => row[0] === userId);

    if (!userRow || !userRow[3]) return alert('❌ 저장된 배치가 없습니다.');

    let layout;
    try {
      layout = JSON.parse(userRow[3]);
    } catch (e) {
      console.error('❌ JSON 파싱 오류:', e);
      return alert('저장된 데이터 형식이 잘못되었습니다.');
    }

    canvas.clear();

    layout.forEach(item => {
      fabric.Image.fromURL(item.src, img => {
        img.set({
          left: item.left,
          top: item.top,
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
  }).catch(err => {
    console.error('불러오기 실패:', err);
    alert('❌ 구글 시트에서 불러오기에 실패했습니다.');
  });
}
