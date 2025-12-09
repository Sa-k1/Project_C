const searchInput = document.querySelector('.search');

if (searchInput) {
    let draggedElement = null;
    
    // ドラッグ開始時に要素を記録
    document.addEventListener('dragstart', (e) => {
        draggedElement = e.target;
    });
    
    // dragoverイベントをキャンセルしてドロップを許可
    searchInput.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
    });

    // dropイベントで独自の処理を実行
    searchInput.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        let customText = ''; // デフォルトは何も入れない
        
        // まずクラスをリセット
        searchInput.classList.remove('warning-text');        
        searchInput.value = customText;
        draggedElement = null; // リセット
    });
}