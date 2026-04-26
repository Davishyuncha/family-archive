// 1. Firebase 설정
var firebaseConfig = {
  apiKey: "AIzaSyBMU-Xl9O-allLpayUHUvUgM13BWR8",
  authDomain: "family-archive-eb4b2.firebaseapp.com",
  projectId: "family-archive-eb4b2",
  storageBucket: "family-archive-eb4b2.firebasestorage.app",
  messagingSenderId: "313936285468",
  appId: "1:313936285468:web:0e5f99ebf2796e6f2be227"
};

// Firebase 초기화
firebase.initializeApp(firebaseConfig);
var db = firebase.firestore();
db.settings({ experimentalForceLongPolling: true });

// 전역 변수
var compressedImageData = null;

// 로그인 체크
function checkPassword() {
    var pw = document.getElementById('family-password').value;
    if (pw === "1234") {
        document.getElementById('login-overlay').style.display = 'none';
        document.getElementById('main-content').style.display = 'block';
        initializeRealtimeUpdates();
    } else {
        alert("비밀번호가 틀렸습니다.");
    }
}

// 모달 제어
function openModal() { document.getElementById('post-modal').style.display = 'flex'; }
function closeModal() { document.getElementById('post-modal').style.display = 'none'; }
function openAlbumModal() { document.getElementById('album-modal').style.display = 'flex'; }
function closeAlbumModal() { document.getElementById('album-modal').style.display = 'none'; resetAlbumPreview(); }
function openVideoModal() { document.getElementById('video-modal').style.display = 'flex'; }
function closeVideoModal() { document.getElementById('video-modal').style.display = 'none'; }
function openEventModal() { document.getElementById('event-modal').style.display = 'flex'; }
function closeEventModal() { document.getElementById('event-modal').style.display = 'none'; }

// 사진 선택 및 압축
document.addEventListener('DOMContentLoaded', function() {
    var fileInput = document.getElementById('album-file');
    var pasteArea = document.getElementById('paste-area');
    
    if (pasteArea && fileInput) {
        pasteArea.onclick = function() { fileInput.click(); };
    }
    
    if (fileInput) {
        fileInput.onchange = function(e) {
            var file = e.target.files[0];
            if (!file) return;
            
            document.getElementById('paste-area').innerText = "사진 읽는 중...";
            var reader = new FileReader();
            reader.onload = function(event) {
                var img = new Image();
                img.onload = function() {
                    document.getElementById('paste-area').innerText = "최적화 중...";
                    var canvas = document.createElement('canvas');
                    var MAX_WIDTH = 1000;
                    var width = img.width;
                    var height = img.height;
                    if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
                    canvas.width = width;
                    canvas.height = height;
                    var ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    compressedImageData = canvas.toDataURL('image/jpeg', 0.7);
                    document.getElementById('image-preview').src = compressedImageData;
                    document.getElementById('preview-container').style.display = 'block';
                    document.getElementById('paste-area').innerText = "준비 완료! [추가하기] 클릭";
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        };
    }
});

function resetAlbumPreview() {
    compressedImageData = null;
    document.getElementById('image-preview').src = '';
    document.getElementById('preview-container').style.display = 'none';
    document.getElementById('paste-area').innerText = "여기에 사진 붙여넣기";
}

// 서버 전송 (스마트폰 최적화: 창부터 닫기)
function submitAlbum() {
    alert("추가하기 버튼이 눌렸습니다! 작업을 시작합니다.");
    
    if (!compressedImageData) {
        alert("사진이 아직 준비되지 않았습니다. 잠시만 기다려 주세요.");
        return;
    }

    // 1. 일단 창부터 즉시 닫기
    closeAlbumModal();
    alert("화면을 닫고 전송을 시작합니다.");

    // 2. 그 다음 서버로 조용히 보내기
    try {
        db.collection("familyAlbum").add({
            imageUrl: compressedImageData,
            createdAt: new Date().toISOString()
        }).then(function() {
            console.log("전송 완료");
        }).catch(function(error) {
            alert("서버 전송 중 오류 발생: " + error.message);
        });
    } catch (e) {
        alert("코드 실행 중 오류 발생: " + e.message);
    }
}

function submitPost() {
    var t = document.getElementById('post-title').value;
    var a = document.getElementById('post-author').value;
    var c = document.getElementById('post-content').value;
    if (!t || !a || !c) { alert("내용을 입력하세요."); return; }
    
    db.collection("familyPosts").add({
        title: t, author: a, content: c,
        image: document.getElementById('post-image').value || "",
        date: new Date().toISOString().split('T')[0],
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(closeModal);
}

function submitVideo() {
    var u = document.getElementById('video-url').value;
    if (!u) return;
    db.collection("familyVideos").add({
        title: document.getElementById('video-title-input').value,
        date: document.getElementById('video-date-input').value,
        source: u,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(closeVideoModal);
}

function submitEvent() {
    var d = document.getElementById('event-date').value;
    var s = document.getElementById('event-desc').value;
    if (!d || !s) return;
    db.collection("familyEvents").add({
        date: d, desc: s,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(closeEventModal);
}

// 실시간 화면 업데이트
function initializeRealtimeUpdates() {
    db.collection("familyPosts").orderBy("createdAt", "desc").onSnapshot(function(qs) {
        var cont = document.getElementById('feed-container');
        cont.innerHTML = '';
        qs.forEach(function(doc) {
            var item = doc.data();
            var d = document.createElement('div');
            d.className = 'glass card';
            d.innerHTML = '<div class="card-content">' +
                (item.image ? '<img src="'+item.image+'" style="width:100%; border-radius:10px; margin-bottom:10px;">' : '') +
                '<span class="date">'+item.date+' | '+item.author+'</span>' +
                '<h3>'+item.title+'</h3><p>'+item.content+'</p>' +
                '<button class="btn-delete" onclick="deleteItem(\'familyPosts\', \''+doc.id+'\')">삭제</button></div>';
            cont.appendChild(d);
        });
    });

    db.collection("familyAlbum").orderBy("createdAt", "desc").onSnapshot(function(qs) {
        var cont = document.getElementById('album-container');
        cont.innerHTML = '';
        qs.forEach(function(doc) {
            var item = doc.data();
            var d = document.createElement('div');
            d.className = 'glass card';
            d.style.padding = '10px';
            d.innerHTML = '<img src="'+item.imageUrl+'" style="width:100%; border-radius:10px;">' +
                '<button class="btn-delete" onclick="deleteItem(\'familyAlbum\', \''+doc.id+'\')">삭제</button>';
            cont.appendChild(d);
        });
    });

    db.collection("familyVideos").orderBy("createdAt", "desc").onSnapshot(function(qs) {
        var cont = document.getElementById('video-container');
        cont.innerHTML = '';
        qs.forEach(function(doc) {
            var v = doc.data();
            var d = document.createElement('div');
            d.className = 'glass card video-card';
            var regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
            var match = v.source.match(regExp);
            var embed = (match && match[2].length === 11) ? "https://www.youtube.com/embed/" + match[2] : v.source;
            d.innerHTML = '<div class="video-display" style="position:relative; aspect-ratio:16/9; background:#000; border-radius:15px; overflow:hidden;">' +
                '<iframe src="'+embed+'" style="width:100%; height:100%; border:none;" allowfullscreen></iframe></div>' +
                '<div class="card-content"><h3>'+v.title+'</h3><button class="btn-delete" onclick="deleteItem(\'familyVideos\', \''+doc.id+'\')">삭제</button></div>';
            cont.appendChild(d);
        });
    });

    db.collection("familyEvents").orderBy("date", "asc").onSnapshot(function(qs) {
        var cont = document.getElementById('events-container');
        cont.innerHTML = '';
        qs.forEach(function(doc) {
            var e = doc.data();
            var d = document.createElement('div');
            d.className = 'event-card';
            d.innerHTML = '<div class="date">'+e.date+'</div><div class="desc">'+e.desc+'</div>' +
                '<button class="btn-delete" onclick="deleteItem(\'familyEvents\', \''+doc.id+'\')">X</button>';
            cont.appendChild(d);
        });
    });
}

function deleteItem(coll, id) {
    if (confirm("삭제하시겠습니까?")) db.collection(coll).doc(id).delete();
}

// 전역 연결
window.checkPassword = checkPassword;
window.submitAlbum = submitAlbum;
window.submitPost = submitPost;
window.submitVideo = submitVideo;
window.submitEvent = submitEvent;
window.deleteItem = deleteItem;
