// --- script.js ---
// 모든 코드 DOMContentLoaded 이후 실행
window.addEventListener('DOMContentLoaded', () => {
  // Fabric canvas 초기화
  const canvas = new fabric.Canvas('c', { selection: false });
  const shop = document.getElementById('shop');
  const zSlider = document.getElementById('zSlider');
  const deleteBtn = document.getElementById('deleteBtn');
  const saveBtn = document.getElementById('saveBtn');
  const loadBtn = document.getElementById('loadBtn');

  // flip 버튼 추가
  const flipBtn = document.createElement('button');
  flipBtn.id = 'flipBtn';
  flipBtn.textContent = '↔️ 반전';
  flipBtn.disabled = true;
  document.getElementById('controls').appendChild(flipBtn);

  let activeObject = null;
  let gapiLoaded = false;

  // Google API 초기화 함수
  function start() {
    gapi.client.init({
      apiKey: 'AIzaSyBYMvVkhdniX7glIF42vV6BdPzRwL0AJJQ',
      clientId: '710863003277-ir6c0k7hl1rstsh6bb3pkkj8ddij9hih.apps.googleusercontent.com',
      discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
      scope: 'https://www.googleapis.com/auth/spreadsheets',
    }).then(() => {
      return gapi.auth2.getAuthInstance().signIn();
    }).then(() => {
      console.log('Google API 인증 완료');
      gapiLoaded = true;
    }).catch(e => {
      console.error('API 로드 실패:', e);
    });
  }
  gapi.load('client:auth2', start);

  // 상점 아이템 드래그 핸들러
  document.querySelectorAll('.shop-item').forEach(img => {
    img.addEventListener('dragstart', e => {
      e.dataTransfer.setData('name', img.dataset.name);
    });
  });

  // 캔버스 드롭
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

  // 객체 선택/해제
  canvas.on('mouse:down', opts => {
    opts.target ? showControls(opts.target) : hideControls();
  });

  function showControls(obj) {
    activeObject = obj;
    zSlider.disabled = deleteBtn.disabled = flipBtn.disabled = false;
    zSlider.value = canvas.getObjects().indexOf(obj) + 1;
  }
  function hideControls() {
    activeObject = null;
    zSlider.disabled = deleteBtn.disabled = flipBtn.disabled = true;
  }

  // z-index 조정
  zSlider.addEventListener('input', () => {
    if (!activeObject) return;
    canvas.moveTo(activeObject, parseInt(zSlider.value) - 1);
    canvas.renderAll();
  });

  // 삭제
  deleteBtn.addEventListener('click', () => {
    if (!activeObject) return;
    canvas.remove(activeObject);
    hideControls();
  });

  // 반전
  flipBtn.addEventListener('click', () => {
    if (!activeObject) return;
    activeObject.toggle('flipX');
    canvas.renderAll();
  });

  // 저장 (Google Sheets)
  saveBtn.addEventListener('click', () => {
    const userId = localStorage.getItem('userId');
    if (!userId) return alert('로그인이 필요합니다.');
    if (!gapiLoaded) return alert('Google API가 로드되지 않았습니다.');

    const data = canvas.getObjects().map(obj => ({
      name: obj.data.name, src: obj.data.src, left: obj.left, top: obj.top,
      scaleX: obj.scaleX || 1, scaleY: obj.scaleY || 1, flip: obj.flipX || false, z: canvas.getObjects().indexOf(obj)
    }));

    // 유저 ID 행 찾기 후 D열 업데이트
    gapi.client.sheets.spreadsheets.values.get({ spreadsheetId: '1xUDw_vkG2aS5KF0F50gGpSDgRMmdBZ2_pQc27D39_qQ', range: '룸!A2:A100' })
      .then(res => {
        const idx = (res.result.values || []).findIndex(r => r[0] === userId);
        if (idx < 0) return alert('유저를 찾을 수 없습니다.');
        const row = idx + 2;
        return gapi.client.sheets.spreadsheets.values.update({
          spreadsheetId: '1xUDw_vkG2aS5KF0F50gGpSDgRMmdBZ2_pQc27D39_qQ',
          range: `룸!D${row}`, valueInputOption: 'RAW', resource: { values: [[JSON.stringify(data)]] }
        });
      })
      .then(() => alert('✅ 구글 시트 저장 완료'))
      .catch(err => { console.error('저장 실패', err); alert('❌ 저장 실패'); });
  });

  // 불러오기 (Google Sheets)
  loadBtn.addEventListener('click', () => {
    const userId = localStorage.getItem('userId');
    if (!userId) return alert('로그인이 필요합니다.');
    if (!gapiLoaded) return alert('Google API가 로드되지 않았습니다.');

    gapi.client.sheets.spreadsheets.values.get({ spreadsheetId: '1xUDw_vkG2aS5KF0F50gGpSDgRMmdBZ2_pQc27D39_qQ', range: '룸!A2:D100' })
      .then(res => {
        const row = (res.result.values || []).find(r => r[0] === userId);
        if (!row || !row[3]) return alert('저장된 배치가 없습니다.');
        let layout;
        try { layout = JSON.parse(row[3]); } catch { return alert('저장 형식 오류'); }

        canvas.clear(); hideControls();
        layout.forEach(item => {
          fabric.Image.fromURL(item.src, img => {
            img.set({ left: item.left, top: item.top, scaleX: item.scaleX, scaleY: item.scaleY, flipX: item.flip, selectable: true, hasControls: true, lockRotation: true, lockUniScaling: false, data: { name: item.name, src: item.src } });
            canvas.add(img); canvas.moveTo(img, item.z); canvas.renderAll();
          });
        });
      })
      .catch(err => { console.error('불러오기 실패', err); alert('❌ 불러오기 실패'); });
  });
});
