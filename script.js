// --- script.js ---
// V.0.3.1 (z-index 입력 방식 반영)

let canvas;
let activeObject = null;
let gapiInited = false;
let accessToken = null;
let tokenClient;

function gapiInit() {
  gapi.client.init({
    apiKey: 'AIzaSyBYMvVkhdniX7glIF42vV6BdPzRwL0AJJQ',
    discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4']
  }).then(() => {
    gapiInited = true;
    console.log('gapi client initialized');
  }).catch(e => console.error('gapi client init error:', e));
}

function gisInit() {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: '710863003277-ir6c0k7hl1rstsh6bb3pkkj8ddij9hih.apps.googleusercontent.com',
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    redirect_uri: window.location.origin,
    callback: resp => {
      if (resp.error) {
        console.error('Token error:', resp);
      } else {
        accessToken = resp.access_token;
        console.log('Access token acquired');
      }
    }
  });
}

window.addEventListener('DOMContentLoaded', () => {
  gapi.load('client', gapiInit);
  gisInit();

  canvas = new fabric.Canvas('c', { selection: false });
  const zInput = document.getElementById('zIndex');
  const deleteBtn = document.getElementById('deleteBtn');
  const saveBtn = document.getElementById('saveBtn');
  const loadBtn = document.getElementById('loadBtn');

  const flipBtn = document.createElement('button');
  flipBtn.id = 'flipBtn';
  flipBtn.textContent = '↔️ 반전';
  flipBtn.disabled = true;
  document.getElementById('controls').appendChild(flipBtn);

  document.querySelectorAll('.shop-item').forEach(img => {
    img.addEventListener('dragstart', e => e.dataTransfer.setData('name', img.dataset.name));
  });
  canvas.upperCanvasEl.addEventListener('dragover', e => e.preventDefault());
  canvas.upperCanvasEl.addEventListener('drop', e => {
    e.preventDefault();
    const name = e.dataTransfer.getData('name');
    const src = `assets/${name}.png`;
    fabric.Image.fromURL(src, img => {
      img.set({ left: e.offsetX, top: e.offsetY, selectable: true, hasControls: true, lockRotation: true, lockUniScaling: false, data: { name, src } });
      canvas.add(img);
      canvas.setActiveObject(img);
      showControls(img);
    });
  });

  canvas.on('mouse:down', opts => opts.target ? showControls(opts.target) : hideControls());

  function showControls(obj) {
    activeObject = obj;
    deleteBtn.disabled = flipBtn.disabled = false;
    zInput.disabled = false;
    const idx = canvas.getObjects().indexOf(obj) + 1; // 사용자에게는 1부터 보이도록
    zInput.value = idx;
  }

  function hideControls() {
    activeObject = null;
    zInput.disabled = deleteBtn.disabled = flipBtn.disabled = true;
    zInput.value = '';
  }

  zInput.addEventListener('change', () => {
    if (!activeObject) return;
    const newIndex = parseInt(zInput.value, 10) - 1;
    const objects = canvas.getObjects();
    if (isNaN(newIndex) || newIndex < 0 || newIndex >= objects.length) {
      alert(`z-index는 1 ~ ${objects.length} 사이로 입력하세요.`);
      showControls(activeObject); // 이전 값으로 복구
      return;
    }
    canvas.moveTo(activeObject, newIndex);
    canvas.renderAll();
    showControls(activeObject); // 위치 바뀌었으니 다시 반영
  });

  deleteBtn.addEventListener('click', () => {
    if (!activeObject) return;
    canvas.remove(activeObject);
    hideControls();
  });

  flipBtn.addEventListener('click', () => {
    if (!activeObject) return;
    activeObject.toggle('flipX');
    canvas.renderAll();
  });

  saveBtn.addEventListener('click', () => {
    if (!gapiInited) return alert('Google API 로드 대기 중');
    if (!accessToken) return tokenClient.requestAccessToken();
    gapi.client.setToken({ access_token: accessToken });

    const userId = localStorage.getItem('userId');
    if (!userId) return alert('로그인이 필요합니다.');

    const data = canvas.getObjects().map(obj => ({
      name: obj.data.name,
      src: obj.data.src,
      left: obj.left,
      top: obj.top,
      scaleX: obj.scaleX || 1,
      scaleY: obj.scaleY || 1,
      flip: obj.flipX || false,
      z: canvas.getObjects().indexOf(obj)
    }));

    gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: '1xUDw_vkG2aS5KF0F50gGpSDgRMmdBZ2_pQc27D39_qQ',
      range: '룸!A2:A100'
    }).then(res => {
      const idx = (res.result.values || []).findIndex(r => r[0] === userId);
      if (idx < 0) throw '유저를 찾을 수 없습니다.';
      const row = idx + 2;
      return gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: '1xUDw_vkG2aS5KF0F50gGpSDgRMmdBZ2_pQc27D39_qQ',
        range: `룸!D${row}`,
        valueInputOption: 'RAW',
        resource: { values: [[JSON.stringify(data)]] }
      });
    }).then(() => alert('✅ 저장 완료'))
      .catch(err => {
        console.error('저장 실패', err);
        alert('❌ 저장 실패');
      });
  });

  loadBtn.addEventListener('click', () => {
    if (!gapiInited) return alert('Google API 로드 대기 중');
    if (!accessToken) return tokenClient.requestAccessToken();
    gapi.client.setToken({ access_token: accessToken });

    const userId = localStorage.getItem('userId');
    if (!userId) return alert('로그인이 필요합니다.');

    gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: '1xUDw_vkG2aS5KF0F50gGpSDgRMmdBZ2_pQc27D39_qQ',
      range: '룸!A2:D100'
    }).then(res => {
      const row = (res.result.values || []).find(r => r[0] === userId);
      if (!row || !row[3]) throw '저장된 배치가 없습니다.';
      let layout;
      try {
        layout = JSON.parse(row[3]);
      } catch {
        throw '데이터 형식 오류';
      }
      canvas.clear();
      hideControls();
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
      console.error('불러오기 실패', err);
      alert(`❌ ${err}`);
    });
  });
});
