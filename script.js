// Mock Data for the Archive (Cleared as requested)
const feedData = [];
const albumData = [];
const studyData = [];

// Password Check
function checkPassword() {
    const password = document.getElementById('family-password').value;
    const errorMsg = document.getElementById('login-error');
    
    if (password === "1234") {
        document.getElementById('login-overlay').style.display = 'none';
        document.getElementById('main-content').style.display = 'block';
        initializeContent();
    } else {
        errorMsg.style.display = 'block';
    }
}

// Smooth Scrolling
document.querySelectorAll('nav a').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        document.querySelector(targetId).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Modal Logic
function openModal() { document.getElementById('post-modal').style.display = 'flex'; }
function closeModal() { document.getElementById('post-modal').style.display = 'none'; }

function openAlbumModal() { document.getElementById('album-modal').style.display = 'flex'; }
function closeAlbumModal() { 
    document.getElementById('album-modal').style.display = 'none'; 
    resetAlbumPreview();
}

let selectedImageData = null;

// File Upload & Paste Listeners
document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('album-file');
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) handleImageFile(file);
        });
    }
    window.addEventListener('paste', (e) => {
        if (document.getElementById('album-modal').style.display === 'flex') {
            const items = e.clipboardData.items;
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    const file = items[i].getAsFile();
                    handleImageFile(file);
                }
            }
        }
    });
});

function handleImageFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        selectedImageData = e.target.result;
        document.getElementById('image-preview').src = selectedImageData;
        document.getElementById('preview-container').style.display = 'block';
        document.getElementById('paste-area').innerText = "이미지가 선택되었습니다.";
    };
    reader.readAsDataURL(file);
}

function resetAlbumPreview() {
    selectedImageData = null;
    document.getElementById('image-preview').src = '';
    document.getElementById('preview-container').style.display = 'none';
    document.getElementById('paste-area').innerText = "여기에 사진 붙여넣기";
    if (document.getElementById('album-file')) document.getElementById('album-file').value = '';
}

function openVideoModal() { document.getElementById('video-modal').style.display = 'flex'; }
function closeVideoModal() { 
    document.getElementById('video-modal').style.display = 'none'; 
    resetVideoPreview();
}

let selectedVideoData = null;

// Video Listeners
document.addEventListener('DOMContentLoaded', () => {
    // ... previous listeners ...
    const videoInput = document.getElementById('video-file');
    if (videoInput) {
        videoInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) handleVideoFile(file);
        });
    }
});

function handleVideoFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        selectedVideoData = e.target.result;
        document.getElementById('video-preview').src = selectedVideoData;
        document.getElementById('video-preview-container').style.display = 'block';
    };
    reader.readAsDataURL(file);
}

function resetVideoPreview() {
    selectedVideoData = null;
    document.getElementById('video-preview').src = '';
    document.getElementById('video-preview-container').style.display = 'none';
    if (document.getElementById('video-file')) document.getElementById('video-file').value = '';
    if (document.getElementById('video-url')) document.getElementById('video-url').value = '';
}

function openEventModal() { document.getElementById('event-modal').style.display = 'flex'; }
function closeEventModal() { document.getElementById('event-modal').style.display = 'none'; }

// Submission Logic
function submitPost() {
    const title = document.getElementById('post-title').value;
    const author = document.getElementById('post-author').value;
    const content = document.getElementById('post-content').value;
    const image = document.getElementById('post-image').value || "";
    
    if (!title || !author || !content) { alert("모든 내용을 입력해주세요!"); return; }

    const newPost = { title, author, content, image, date: new Date().toISOString().split('T')[0] };
    const savedPosts = JSON.parse(localStorage.getItem('familyPosts') || "[]");
    savedPosts.unshift(newPost);
    localStorage.setItem('familyPosts', JSON.stringify(savedPosts));

    renderFeed();
    closeModal();
}

function submitAlbum() {
    if (!selectedImageData) { alert("사진을 선택하거나 붙여넣어 주세요!"); return; }
    const savedAlbum = JSON.parse(localStorage.getItem('familyAlbum') || "[]");
    savedAlbum.unshift(selectedImageData);
    localStorage.setItem('familyAlbum', JSON.stringify(savedAlbum));
    renderAlbum();
    closeAlbumModal();
}

function submitVideo() {
    const titleInput = document.getElementById('video-title-input');
    const dateInput = document.getElementById('video-date-input');
    const urlInput = document.getElementById('video-url');
    
    const title = titleInput.value.trim();
    const date = dateInput.value;
    const url = urlInput.value.trim();
    
    if (!title || !date) { 
        alert("영상 제목과 날짜를 꼭 입력해주세요!"); 
        return; 
    }

    // URL이 있으면 URL 우선, 없으면 선택된 파일 데이터 사용
    let videoSource = "";
    let isUrl = false;

    if (url) {
        videoSource = url;
        isUrl = true;
    } else if (selectedVideoData) {
        videoSource = selectedVideoData;
        isUrl = false;
    }

    if (!videoSource) { 
        alert("유튜브 주소를 입력하거나 영상 파일을 선택해주세요!"); 
        return; 
    }

    const newVideo = { title, date, source: videoSource, isUrl: isUrl };
    const savedVideos = JSON.parse(localStorage.getItem('familyVideos') || "[]");
    
    try {
        savedVideos.unshift(newVideo);
        localStorage.setItem('familyVideos', JSON.stringify(savedVideos));
        
        // 입력창 초기화
        titleInput.value = "";
        dateInput.value = "";
        urlInput.value = "";
        resetVideoPreview();
        
        renderVideos();
        closeVideoModal();
        alert("영상이 성공적으로 등록되었습니다!");
    } catch (e) {
        alert("저장 공간이 부족합니다. 영상 파일 대신 유튜브 주소(URL)를 사용해 주세요.");
        console.error("Save error:", e);
    }
}

function submitEvent() {
    const date = document.getElementById('event-date').value;
    const desc = document.getElementById('event-desc').value;
    if (!date || !desc) return;
    const newEvent = { date, desc };
    const savedEvents = JSON.parse(localStorage.getItem('familyEvents') || "[]");
    savedEvents.unshift(newEvent);
    localStorage.setItem('familyEvents', JSON.stringify(savedEvents));
    renderEvents();
    closeEventModal();
}

// Render Logic
function renderFeed() {
    const feedContainer = document.getElementById('feed-container');
    feedContainer.innerHTML = '';
    const savedPosts = JSON.parse(localStorage.getItem('familyPosts') || "[]");
    savedPosts.forEach(item => {
        const card = document.createElement('div');
        card.className = 'glass card';
        card.innerHTML = `
            ${item.image ? `<img src="${item.image}">` : ''}
            <div class="card-content">
                <span class="date">${item.date} | ${item.author}</span>
                <h3>${item.title}</h3>
                <p>${item.content}</p>
                <button class="btn-delete" onclick="deleteItem('familyPosts', ${savedPosts.indexOf(item)})">삭제</button>
            </div>
        `;
        feedContainer.appendChild(card);
    });
}

function deleteItem(key, index) {
    if (!confirm("정말 이 항목을 삭제하시겠습니까?")) return;
    const items = JSON.parse(localStorage.getItem(key) || "[]");
    items.splice(index, 1);
    localStorage.setItem(key, JSON.stringify(items));
    initializeContent(); // 화면 새로고침
}

function renderAlbum() {
    const albumContainer = document.getElementById('album-container');
    albumContainer.innerHTML = '';
    const savedAlbum = JSON.parse(localStorage.getItem('familyAlbum') || "[]");
    savedAlbum.forEach((imgUrl, index) => {
        const item = document.createElement('div');
        item.className = 'glass card';
        item.style.padding = '10px';
        item.innerHTML = `
            <img src="${imgUrl}" style="margin-bottom: 10px; border-radius: 10px;">
            <button class="btn-delete" onclick="deleteItem('familyAlbum', ${index})">삭제</button>
        `;
        albumContainer.appendChild(item);
    });
}

function renderVideos() {
    const videoContainer = document.getElementById('video-container');
    videoContainer.innerHTML = '';
    const savedVideos = JSON.parse(localStorage.getItem('familyVideos') || "[]");
    savedVideos.forEach((video, index) => {
        const item = document.createElement('div');
        item.className = 'glass card video-card';
        const displayUrl = video.isUrl ? getYouTubeEmbedUrl(video.source) : video.source;
        item.innerHTML = `
            <div class="video-display" style="position: relative; aspect-ratio: 16/9; background: #000; border-radius: 15px; overflow: hidden;">
                ${video.isUrl ? 
                    `<iframe src="${displayUrl}" style="width: 100%; height: 100%; border: none;" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>` : 
                    `<video src="${video.source}" controls style="width: 100%; height: 100%;"></video>`
                }
            </div>
            <div class="card-content">
                <span class="date">${video.date}</span>
                <h3>${video.title}</h3>
                <div class="card-buttons" style="display: flex; gap: 10px; margin-top: 15px;">
                    ${video.isUrl ? `<a href="${video.source}" target="_blank" class="btn-watch">유튜브에서 보기</a>` : ''}
                    <button class="btn-delete" onclick="deleteItem('familyVideos', ${index})" style="margin-top: 0;">삭제</button>
                </div>
            </div>
        `;
        videoContainer.appendChild(item);
    });
}

// Helper to get YouTube Embed URL (Improved)
function getYouTubeEmbedUrl(url) {
    if (!url) return '';
    if (url.includes('embed/')) return url;
    
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    
    if (match && match[2].length === 11) {
        return `https://www.youtube.com/embed/${match[2]}?autoplay=0&rel=0`;
    }
    return url;
}

function renderEvents() {
    const container = document.getElementById('events-container');
    container.innerHTML = '';
    const savedEvents = JSON.parse(localStorage.getItem('familyEvents') || "[]");
    savedEvents.forEach(event => {
        const div = document.createElement('div');
        div.className = 'event-card';
        div.innerHTML = `<div class="date">${event.date}</div><div class="desc">${event.desc}</div>`;
        container.appendChild(div);
    });
}

function initializeContent() {
    renderFeed();
    renderAlbum();
    renderVideos();
    renderEvents();
}
