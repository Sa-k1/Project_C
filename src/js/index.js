const mini = document.getElementById('miniWindow');
let offsetX, offsetY, isDragging = false;

mini.addEventListener('mousedown', (e) => {
    isDragging = true;
    offsetX = e.offsetX;
    offsetY = e.offsetY;
});

document.addEventListener('mouseup', () => isDragging = false);

document.addEventListener('mousemove', (e) => {
    if (isDragging) { // この行を修正（条件チェックを追加）
        mini.style.left = `${e.pageX - offsetX}px`;
        mini.style.top = `${e.pageY - offsetY}px`;
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