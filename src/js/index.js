const mini = document.getElementById('miniWindow');
const windowContainer = document.getElementById('windowContainer');
let offsetX, offsetY, isDragging = false;

// ウィンドウコンテナ全体をドラッグ可能にする
windowContainer.addEventListener('mousedown', (e) => {
        // Only start dragging when the user clicks the title area (the visible top bar / handle).
        // Also ignore clicks on interactive controls inside that area (buttons, tabs, icons).
        const handle = e.target.closest('.box, .titlebar, .side-panel-header');
        if (!handle) return; // not clicking the titlebar area -> do not start drag

        // If clicked element is an interactive child (button, control, tab, icon, inputs), don't start drag
        const ignored = e.target.closest('.window-controls, .ctrl, .tab, .tab-icon, .tab-label, .icon_ALL, .icon, .text, #mini-iframe, #trash-can, #trash-image, .draggable-item, .trash-button, #eve, #eve-image, .side-panel-content');
        if (ignored) return;

        isDragging = true;
        const rect = windowContainer.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
});

document.addEventListener('mouseup', () => isDragging = false);

document.addEventListener('mousemove', (e) => {
    if (isDragging) { // この行を修正（条件チェックを追加）
        windowContainer.style.left = `${e.clientX - offsetX}px`;
        windowContainer.style.top = `${e.clientY - offsetY}px`;
    }
});

// ドラッグ可能なアイテムの処理
const items = document.querySelectorAll('.draggable-item');
const trashCan = document.getElementById('trash-can');

items.forEach(item => {
    item.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', e.target.id);
    });

    item.addEventListener('dragend', () => {
        trashCan.style.backgroundColor = 'transparent';
    });
});

// ゴミ箱の処理
trashCan.addEventListener('dragover', (e) => {
    e.preventDefault();
    trashCan.classList.add('drag-over');
});

trashCan.addEventListener('dragleave', () => {
    trashCan.classList.remove('drag-over');
});

// ゴミ箱のドロップ処理
trashCan.addEventListener('drop', (e) => {
    e.preventDefault();
    trashCan.classList.remove('drag-over');

    const id = e.dataTransfer.getData('text/plain');
    const draggedElement = document.getElementById(id);

    if (draggedElement) {
        const trashItem = document.createElement('div');
        trashItem.className = 'trash-item';
        trashItem.innerHTML = `
            ${draggedElement.textContent}
            <button onclick="restoreItem('${id}', '${draggedElement.textContent}')">
                復元
            </button>
        `;
        
        const trashContent = document.getElementById('trash-content');
        trashContent.appendChild(trashItem);
        draggedElement.style.display = 'none';
    }
});

// ゴミ箱を開く/閉じる処理
const toggleButton = document.getElementById('toggle-trash-content');
const trashContent = document.getElementById('trash-content');

// ゴミ箱のダブルクリックとボタンクリックの処理
const trashImage = document.getElementById('trash-image');

// ダブルクリックイベントを追加
trashImage.addEventListener('dblclick', () => {
    toggleTrashContent();
});

// ボタンクリックイベントを修正
toggleButton.addEventListener('click', () => {
    toggleTrashContent();
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