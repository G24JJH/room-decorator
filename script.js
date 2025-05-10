
fetch("https://script.google.com/macros/s/AKfycbzquVxMrEOE9FTUO7AB0Oizyvdk8POBJQuQhkhRT80qiiMc54Hnr-Eq2r7sxyguNMIw/exec", {
    method: "POST",
    body: JSON.stringify({
      userId: "123456",
      roomData: [
        { name: "소파1", x: 120, y: 150, rotate: 90 }
      ]
    })
  })
  .then(res => res.text())
  .then(console.log);

fetch("https://script.google.com/macros/s/AKfycbzquVxMrEOE9FTUO7AB0Oizyvdk8POBJQuQhkhRT80qiiMc54Hnr-Eq2r7sxyguNMIw/exec")
  .then(res => res.json())
  .then(data => {
    console.log("불러온 방:", data);
  });
