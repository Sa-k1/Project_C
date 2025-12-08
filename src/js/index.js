const mini = document.getElementById('miniWindow');
const windowContainer = document.getElementById('windowContainer');
let offsetX, offsetY, isDragging = false;

// ファイルビューア用の変数（3つのウィンドウ）
const fileViewerContainers = {
    1: document.getElementById('fileViewerContainer1'),
    2: document.getElementById('fileViewerContainer2'),
    3: document.getElementById('fileViewerContainer3')
};
let fileViewerDragState = { id: null, offsetX: 0, offsetY: 0 };

// z-indexの管理用（ウィンドウを前面に持ってくる機能）
let topZIndex = 200;

// ウィンドウコンテナ全体をドラッグ可能にする
windowContainer.addEventListener('mousedown', (e) => {
        // Only start dragging when the user clicks the title area (the visible top bar / handle).
        // Also ignore clicks on interactive controls inside that area (buttons, tabs, icons).
        const handle = e.target.closest('.box, .titlebar, .side-panel-header');
        if (!handle) return; // not clicking the titlebar area -> do not start drag

        // If clicked element is an interactive child (button, control, tab, icon, inputs), don't start drag
        const ignored = e.target.closest('.window-controls, .ctrl, .tab, .tab-icon, .tab-label, .icon_ALL, .icon, .text, #mini-iframe, #trash-can, #trash-image, .draggable-item, #eve, #eve-image, .side-panel-content');
        if (ignored) return;

        isDragging = true;
        const rect = windowContainer.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        
        // 前面に持ってくる
        bringToFront(windowContainer);
});

// ファイルビューアのドラッグ処理（3つのウィンドウに対応）
Object.entries(fileViewerContainers).forEach(([id, container]) => {
    if (!container) return;
    
    container.addEventListener('mousedown', (e) => {
        // まず前面に持ってくる
        bringToFront(container);
        
        const handle = e.target.closest('.box, .titlebar');
        if (!handle) return;

        const ignored = e.target.closest('.window-controls, .ctrl, .tab, .tab-label, iframe');
        if (ignored) return;

        fileViewerDragState = {
            id: id,
            offsetX: e.clientX - container.getBoundingClientRect().left,
            offsetY: e.clientY - container.getBoundingClientRect().top
        };
    });
});

// EVEウィンドウもクリックで前面に
windowContainer.addEventListener('mousedown', () => {
    bringToFront(windowContainer);
});

// iframeクリック検知：document.activeElementを監視
let lastActiveElement = null;
setInterval(() => {
    const activeElement = document.activeElement;
    
    // アクティブな要素が変わった時だけ処理
    if (activeElement !== lastActiveElement) {
        lastActiveElement = activeElement;
        
        // EVEウィンドウのiframe
        const eveIframe = document.getElementById('mini-iframe');
        if (activeElement === eveIframe) {
            bringToFront(windowContainer);
            return;
        }
        
        // ファイルビューアのiframe
        Object.entries(fileViewerContainers).forEach(([id, container]) => {
            if (!container) return;
            const iframe = container.querySelector('iframe');
            if (activeElement === iframe) {
                bringToFront(container);
            }
        });
    }
}, 50);

// ウィンドウを前面に持ってくる関数
function bringToFront(element) {
    topZIndex++;
    element.style.zIndex = topZIndex;
}

document.addEventListener('mouseup', () => {
    isDragging = false;
    fileViewerDragState.id = null;
});

document.addEventListener('mousemove', (e) => {
    if (isDragging) {
        windowContainer.style.left = `${e.clientX - offsetX}px`;
        windowContainer.style.top = `${e.clientY - offsetY}px`;
    }
    // ファイルビューアのドラッグ（3つのウィンドウに対応）
    if (fileViewerDragState.id !== null) {
        const container = fileViewerContainers[fileViewerDragState.id];
        if (container) {
            container.style.left = `${e.clientX - fileViewerDragState.offsetX}px`;
            container.style.top = `${e.clientY - fileViewerDragState.offsetY}px`;
            container.style.right = 'auto';
        }
    }
});

// ファイルビューアの閉じるボタン（3つのウィンドウに対応）
document.querySelectorAll('.file-viewer-container .ctrl.close').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const viewerId = e.target.dataset.viewer;   
        const container = fileViewerContainers[viewerId];
        if (container) {
            container.style.display = 'none';
            const iframe = container.querySelector('iframe');
            if (iframe) iframe.src = '';
        }
    });
});


// ドラッグ可能なアイテムの処理
const items = document.querySelectorAll('.draggable-item');
const trashCan = document.getElementById('trash-can');

// ファイルごとのページ設定（ファイルIDとウィンドウ番号のマッピング）
const filePages = {
    'file1': { page: 'file1.html', viewerId: 1 },  // 重要なデータ.txt
    'file2': { page: 'file2.html', viewerId: 2 },  // 古いメモ.doc
    'file3': { page: 'file3.html', viewerId: 3 }   // 不要な写真.jpg
};

items.forEach(item => {
    item.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', e.target.id);
    });

    item.addEventListener('dragend', () => {
        trashCan.style.backgroundColor = 'transparent';
    });

    // ダブルクリックでファイルを開く（それぞれ別のウィンドウで表示）
    item.addEventListener('dblclick', (e) => {
        const fileId = item.id;
        const fileConfig = filePages[fileId];
        if (fileConfig) {
            const container = fileViewerContainers[fileConfig.viewerId];
            const iframe = document.getElementById(`file-viewer-iframe${fileConfig.viewerId}`);
            const title = document.getElementById(`fileViewerTitle${fileConfig.viewerId}`);
            
            // ファイル名を取得してタイトルに設定
            const fileName = item.querySelector('.word')?.textContent || 'ファイル';
            if (title) {
                title.textContent = fileName;
            }
            
            // iframeにファイルを読み込み
            if (iframe) {
                iframe.src = fileConfig.page;
            }
            
            // ウィンドウを表示して前面に
            if (container) {
                container.style.display = 'block';
                bringToFront(container);
            }
        }
    });
});

// トグル機能を関数化
function toggleTrashContent() {
    if (trashContent.style.display === 'none') {
        trashContent.style.display = 'block';
        toggleButton.textContent = 'ゴミ箱を閉じる';
    } else {
        trashContent.style.display = 'none';
        toggleButton.textContent = 'ゴミ箱を開く';
    }
}

// 復元機能
window.restoreItem = function(id, content) {
    const originalElement = document.getElementById(id);
    if (originalElement) {
        originalElement.style.display = 'block';
        const trashItem = event.target.parentElement;
        trashItem.parentElement.removeChild(trashItem);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const eveImage = document.getElementById('eve-image');

  // 簡易トグル関数（windowContainerを表示/非表示にする）
    function toggleElement(el) {
        if (!el) return;
        const cur = window.getComputedStyle(el).display;
        // 表示に切り替えるとき、iframe の src を JS でセットして consoll.html を読み込む
        if (cur === 'none' || cur === '') {
            el.style.display = 'flex';
            const iframe = document.getElementById('mini-iframe');
                if (iframe && !iframe.dataset.loaded) {
                // 相対パスで xterm_demo.html を読み込む（index.html と同じディレクトリなので相対パスは 'xterm_demo.html'）
                iframe.src = 'xterm_demo.html';
                    // iframe が読み込まれたら textarea（既存コンソール）を隠す
                    iframe.addEventListener('load', () => {
                        iframe.dataset.loaded = 'true';
                        const ta = document.querySelector('.text');
                        if (ta) ta.style.display = 'none';
                    }, { once: true });
                }
        } else {
                    el.style.display = 'none';
                    // miniWindow を閉じたら textarea を再表示しておく
                    const ta = document.querySelector('.text');
                    if (ta) ta.style.display = '';
        }
    }

  // --- 追加: EVE アイコンをクリックで開閉（ドラッグと衝突しないようにする） ---
    if (eveImage && windowContainer) {
    let possibleDrag = false;
    let dragged = false;
    let startX = 0, startY = 0;

    eveImage.addEventListener('mousedown', (e) => {
        possibleDrag = true;
        dragged = false;
        startX = e.clientX;
        startY = e.clientY;
    });

    document.addEventListener('mousemove', (e) => {
        if (!possibleDrag) return;
        if (Math.hypot(e.clientX - startX, e.clientY - startY) > 6) {
        dragged = true;
        }
    });

    document.addEventListener('mouseup', () => {
        possibleDrag = false;
      // 小さな遅延でフラグをリセット
        setTimeout(() => { dragged = false; }, 50);
    });

    eveImage.addEventListener('dblclick', (e) => {
      if (dragged) return; // ドラッグ中のクリックは無視
        e.preventDefault();
        toggleElement(windowContainer);
    });
    }

const overlay = document.querySelector('.fade');
overlay.addEventListener('animationend', () => {
  overlay.remove();
});

// タスクバー時計の更新
function updateClock() {
    const now = new Date();
    
    // 時刻表示 (HH:MM形式)
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;
    
    // 日付表示 (YYYY/MM/DD形式)
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateStr = `${year}/${month}/${day}`;
    
    // 要素に反映
    const clockTime = document.getElementById('clock-time');
    const clockDate = document.getElementById('clock-date');
    
    if (clockTime) clockTime.textContent = timeStr;
    if (clockDate) clockDate.textContent = dateStr;
}

// 初回実行と毎秒更新
updateClock();
setInterval(updateClock, 1000);

});

function processCommand(command) {
    const cmd = command.trim().toLowerCase();
    
    // ...existing code...
    
    // exit コマンドでびっくり演出
    if (cmd === 'exit') {
        window.redScreen.options.message = '逃げられると思った？';
        window.redScreen.shock();
        return;
    }
}