// [안정성 강화 버전 - 다중 업로드 지원]
var firebaseConfig = {
  apiKey: "AIzaSyA8MU-9T0Go-sGlLyaylAIhO_qgN238ROE",
  authDomain: "family-archive-dd482.firebaseapp.com",
  projectId: "family-archive-dd482",
  storageBucket: "family-archive-dd482.firebasestorage.app",
  messagingSenderId: "238028540570",
  appId: "1:238028540570:web:e0d9464d174eca1c86ad23"
};

var db;
var compressedImages = [];

try {
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    db = firebase.firestore();
    db.settings({ experimentalForceLongPolling: true });
    console.log("Firebase 연결 준비 완료");
} catch (e) {
    alert("연결 초기화 실패: " + e.message);
}

function updateStatus(msg, color) {
    var s = document.getElementById('conn-status');
    if (s) {
        s.innerText = msg;
        if (color) s.style.color = color;
    }
}

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

function openModal() { document.getElementById('post-modal').style.display = 'flex'; }
function closeModal() { document.getElementById('post-modal').style.display = 'none'; }
function openAlbumModal() { document.getElementById('album-modal').style.display = 'flex'; }
function closeAlbumModal() { document.getElementById('album-modal').style.display = 'none'; resetAlbumPreview(); }
function openVideoModal() { document.getElementById('video-modal').style.display = 'flex'; }
function closeVideoModal() { document.getElementById('video-modal').style.display = 'none'; }
function openEventModal() { document.getElementById('event-modal').style.display = 'flex'; }
function closeEventModal() { document.getElementById('event-modal').style.display = 'none'; }

document.addEventListener('DOMContentLoaded', function() {
    var fileInput = document.getElementById('album-file');
    if (fileInput) {
        fileInput.onchange = function(e) {
            var files = Array.prototype.slice.call(e.target.files || []);
            if (!files.length) return;
            compressedImages = new Array(files.length);
            var preview = document.getElementById('preview-container');
            preview.innerHTML = '';
            preview.style.display = 'block';
            var done = 0;
            updateStatus("사진 압축 중... (0/" + files.length + ")", "#ffc107");
            files.forEach(function(file, idx) {
                var reader = new FileReader();
                reader.onload = function(event) {
                    var img = new Image();
                    img.onload = function() {
                        var canvas = document.createElement('canvas');
                        var MAX_WIDTH = 800;
                        var width = img.width;
                        var height = img.height;
                        if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
                        canvas.width = width; canvas.height = height;
                        var ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, width, height);
                        var dataUrl = canvas.toDataURL('image/jpeg', 0.6);
                        compressedImages[idx] = dataUrl;
                        var thumb = document.createElement('img');
                        thumb.src = dataUrl;
                        thumb.style.cssText = 'max-width:80px; max-height:80px; margin:4px; border-radius:6px; vertical-align:middle;';
                        preview.appendChild(thumb);
                        done++;
                        updateStatus("사진 압축 중... (" + done + "/" + files.length + ")", "#ffc107");
                        if (done === files.length) {
                            document.getElementById('paste-area').innerText = files.length + "장 준비 완료!";
                            updateStatus("업로드 준비됨", "#4caf50");
                            fileInput.value = '';
                        }
                    };
                    img.src = event.target.result;
                };
                reader.readAsDataURL(file);
            });
        };
    }
});

function resetAlbumPreview() {
    compressedImages = [];
    var preview = document.getElementById('preview-container');
    if (preview) {
        preview.innerHTML = '';
        preview.style.display = 'none';
    }
    var paste = document.getElementById('paste-area');
    if (paste) paste.innerText = "여기를 터치하여 사진 선택 (여러 장 가능)";
}

function submitPost() {
    var t = document.getElementById('post-title').value;
    var a = document.getElementById('post-author').value;
    var c = document.getElementById('post-content').value;
    if (!t || !a || !c) { alert("내용을 모두 입력해 주세요."); return; }

    db.collection("familyPosts").add({
        title: t, author: a, content: c,
        date: new Date().toISOString().split('T')[0],
        time: Date.now()
    }).then(function() {
        closeModal();
        document.getElementById('post-title').value = '';
        document.getElementById('post-author').value = '';
        document.getElementById('post-content').value = '';
    }).catch(function(e) { alert("전송 실패: " + e.message); });
}

function submitVideo() {
    var url = document.getElementById('video-url').value;
    var title = document.getElementById('video-title-input').value;
    var date = document.getElementById('video-date-input').value;
    if (!url || !title) { alert("제목과 YouTube 주소를 입력해 주세요."); return; }

    db.collection("familyVideos").add({
        title: title, date: date, source: url, time: Date.now()
    }).then(function() {
        closeVideoModal();
        document.getElementById('video-url').value = '';
        document.getElementById('video-title-input').value = '';
        document.getElementById('video-date-input').value = '';
    }).catch(function(e) { alert("전송 실패: " + e.message); });
}

function submitEvent() {
    var d = document.getElementById('event-date').value;
    var s = document.getElementById('event-desc').value;
    if (!d || !s) { alert("날짜와 일정 내용을 입력해 주세요."); return; }

    db.collection("familyEvents").add({
        date: d, desc: s, time: Date.now()
    }).then(function() {
        closeEventModal();
        document.getElementById('event-date').value = '';
        document.getElementById('event-desc').value = '';
    }).catch(function(e) { alert("전송 실패: " + e.message); });
}

var pendingBatch = null;

function submitAlbum() {
    if (!compressedImages.length) {
        alert("사진을 먼저 선택해 주세요.");
        return;
    }

    var btn = document.querySelector("#album-modal .btn-primary");
    btn.innerText = "전송 중...";
    btn.disabled = true;

    var images = compressedImages.slice();
    var total = images.length;
    var baseTime = Date.now();
    var markers = images.map(function(_, i) {
        return "u_" + baseTime + "_" + i + "_" + Math.random().toString(36).slice(2, 8);
    });
    updateStatus("서버로 전송 중... (0/" + total + ")", "#ffc107");

    var settled = false;
    var settle = function(msg, color, isFailure) {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutId);
        pendingBatch = null;
        btn.innerText = "추가하기";
        btn.disabled = false;
        updateStatus(msg, color);
        if (!isFailure) closeAlbumModal();
    };

    pendingBatch = {
        markers: markers,
        confirmedCount: 0,
        total: total,
        onProgress: function(count) {
            updateStatus("업로드 확인 중... (" + count + "/" + total + ")", "#ffc107");
        },
        onAllConfirmed: function() {
            settle("업로드 성공! (" + total + "장)", "#4caf50", false);
        }
    };

    var timeoutId = setTimeout(function() {
        var done = pendingBatch ? pendingBatch.confirmedCount : 0;
        settle("응답 없음 (" + done + "/" + total + " 확인)", "#f44336", true);
        alert("업로드 시간 초과.\n" + done + "/" + total + "장만 확인되었습니다.");
    }, Math.max(60000, total * 15000));

    images.forEach(function(dataUrl, idx) {
        db.collection("familyAlbum").add({
            imageUrl: dataUrl,
            time: baseTime + idx,
            marker: markers[idx]
        }).then(function() {
            console.log("add().then() (marker:", markers[idx], ")");
        }).catch(function(error) {
            console.error("전송 에러 (idx=" + idx + "):", error);
            settle("일부 전송 실패: " + error.code, "#f44336", true);
            alert("전송 실패!\n사유: " + error.message);
        });
    });
}

function initializeRealtimeUpdates() {
    updateStatus("데이터 로딩 중...", "#ffc107");

    db.collection("familyAlbum").onSnapshot(function(qs) {
        var cont = document.getElementById('album-container');
        if (!cont) return;
        cont.innerHTML = '';
        var list = [];
        qs.forEach(function(doc) { list.push({ id: doc.id, data: doc.data() }); });
        list.sort(function(a, b) { return (b.data.time || 0) - (a.data.time || 0); });

        var matchedCount = 0;
        list.forEach(function(row) {
            var item = row.data;
            if (pendingBatch && item.marker && pendingBatch.markers.indexOf(item.marker) !== -1) {
                matchedCount++;
            }
            var d = document.createElement('div');
            d.className = 'glass card';
            d.style.padding = '10px';
            d.innerHTML = '<img src="'+item.imageUrl+'" style="width:100%; border-radius:10px;">' +
                '<button class="btn-delete" onclick="deleteItem(\'familyAlbum\', \''+row.id+'\')">삭제</button>';
            cont.appendChild(d);
        });

        if (pendingBatch && matchedCount > pendingBatch.confirmedCount) {
            pendingBatch.confirmedCount = matchedCount;
            if (matchedCount >= pendingBatch.total) {
                pendingBatch.onAllConfirmed();
            } else {
                pendingBatch.onProgress(matchedCount);
            }
        } else if (!pendingBatch) {
            updateStatus("서버 연결됨", "#4caf50");
        }
    }, function(err) {
        console.error("Album Load Error:", err);
        updateStatus("연결 오류: " + err.code, "#f44336");
    });

    db.collection("familyPosts").onSnapshot(function(qs) {
        var cont = document.getElementById('feed-container');
        if (!cont) return;
        cont.innerHTML = '';
        var list = [];
        qs.forEach(function(doc) { list.push({ id: doc.id, data: doc.data() }); });
        list.sort(function(a, b) { return (b.data.time || 0) - (a.data.time || 0); });
        list.forEach(function(row) {
            var item = row.data;
            var d = document.createElement('div');
            d.className = 'glass card';
            d.innerHTML = '<div class="card-content">' +
                '<span class="date">'+(item.date||'')+(item.author ? ' | '+item.author : '')+'</span>' +
                '<h3>'+(item.title||'제목 없음')+'</h3><p>'+(item.content||'')+'</p>' +
                '<button class="btn-delete" onclick="deleteItem(\'familyPosts\', \''+row.id+'\')">삭제</button></div>';
            cont.appendChild(d);
        });
    });

    db.collection("familyVideos").onSnapshot(function(qs) {
        var cont = document.getElementById('video-container');
        if (!cont) return;
        cont.innerHTML = '';
        var list = [];
        qs.forEach(function(doc) { list.push({ id: doc.id, data: doc.data() }); });
        list.sort(function(a, b) { return (b.data.time || 0) - (a.data.time || 0); });
        list.forEach(function(row) {
            var v = row.data;
            var regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
            var match = (v.source || '').match(regExp);
            var embed = (match && match[2].length === 11) ? "https://www.youtube.com/embed/" + match[2] : v.source;
            var d = document.createElement('div');
            d.className = 'glass card video-card';
            d.innerHTML = '<div class="video-display" style="position:relative; aspect-ratio:16/9; background:#000; border-radius:15px; overflow:hidden;">' +
                '<iframe src="'+embed+'" style="width:100%; height:100%; border:none;" allowfullscreen></iframe></div>' +
                '<div class="card-content"><h3>'+(v.title||'')+'</h3>' +
                '<span class="date">'+(v.date||'')+'</span>' +
                '<button class="btn-delete" onclick="deleteItem(\'familyVideos\', \''+row.id+'\')">삭제</button></div>';
            cont.appendChild(d);
        });
    });

    db.collection("familyEvents").onSnapshot(function(qs) {
        var cont = document.getElementById('events-container');
        if (!cont) return;
        cont.innerHTML = '';
        var list = [];
        qs.forEach(function(doc) { list.push({ id: doc.id, data: doc.data() }); });
        list.sort(function(a, b) { return (a.data.date || '').localeCompare(b.data.date || ''); });
        list.forEach(function(row) {
            var e = row.data;
            var d = document.createElement('div');
            d.className = 'event-card';
            d.innerHTML = '<div class="date">'+(e.date||'')+'</div><div class="desc">'+(e.desc||'')+'</div>' +
                '<button class="btn-delete" onclick="deleteItem(\'familyEvents\', \''+row.id+'\')">X</button>';
            cont.appendChild(d);
        });
    });
}

function deleteItem(coll, id) {
    if (confirm("삭제하시겠습니까?")) {
        db.collection(coll).doc(id).delete().catch(function(e) { alert("오류: " + e.message); });
    }
}

window.checkPassword = checkPassword;
window.submitAlbum = submitAlbum;
window.submitPost = submitPost;
window.submitVideo = submitVideo;
window.submitEvent = submitEvent;
window.deleteItem = deleteItem;
window.openModal = openModal;
window.closeModal = closeModal;
window.openAlbumModal = openAlbumModal;
window.closeAlbumModal = closeAlbumModal;
window.openVideoModal = openVideoModal;
window.closeVideoModal = closeVideoModal;
window.openEventModal = openEventModal;
window.closeEventModal = closeEventModal;
