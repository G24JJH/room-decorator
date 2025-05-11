const SPREADSHEET_KEY = '1xUDw_vkG2aS5KF0F50gGpSDgRMmdBZ2_pQc27D39_qQ';
const userId  = new URLSearchParams(location.search).get('user') || 'nugullover';

// Fabric 초기화
const canvas = new fabric.Canvas('c', { selection: false });
const shop   = document.getElementById('shop');
// (나머지 컨트롤 요소 참조 생략…)

window.onload = function() {
  Tabletop.init({
    key: SPREADSHEET_KEY,
    simpleSheet: false,
    callback: data => {
      const furnitureSheet = data['가구'];
      const userSheet      = data['유저'];
      // B열(ID)에 userId가 있을 때:
      const userRow = userSheet.find(r => r.ID === userId);
      if (!userRow) return alert(`유저 ${userId} 정보가 없습니다.`);
      
      // F열(인벤토리) 파싱
      const invList = userRow.인벤토리.split(',')
        .map(p => p.trim().split(':'))
        .map(([name,c])=>({ name:name.trim(), count:+c||0 }));
      
      invList.forEach(item => {
        if (item.count > 0) {
          const f = furnitureSheet.find(f => f.이름 === item.name);
          if (f) addShopItem(item.name, f.이미지URL);
        }
      });
    }
  });
};

function addShopItem(name, imgUrl) {
  const img = document.createElement('img');
  img.src = imgUrl;
  img.className = 'shop-item';
  img.draggable = true;
  img.dataset.name = name;
  img.addEventListener('dragstart', e => {
    e.dataTransfer.setData('name', name);
  });
  shop.appendChild(img);
}

// 이하 Fabric 드롭/선택/삭제 등 로직 그대로…
