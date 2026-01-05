// admin_key.js - admin_key.dat専用ビューア表示
(function() {
    window.puzzleSystem = window.puzzleSystem || {};
    window.puzzleSystem.displayAdminKey = async function(term, gameState, puzzleHelpers) {
        const { systemLine, wait } = puzzleHelpers;
        await systemLine("[SYSTEM]: 管理者キー情報を読み込んでいます...", 30);
        await wait(800);
        await systemLine("", 0);
        // filePagesの仕組みを使ってadmin_key.htmlをfileViewerContainer4で表示
        const parentDoc = window.parent.document;
        const filePages = window.parent.filePages || {};
        // filePagesにadmin_keyがなければ追加
        if (!filePages['admin_key']) {
            filePages['admin_key'] = { page: 'admin_key.html', viewerId: 4 };
        }
        const fileConfig = filePages['admin_key'];
        const container = parentDoc.getElementById('fileViewerContainer' + fileConfig.viewerId);
        const iframe = parentDoc.getElementById('file-viewer-iframe' + fileConfig.viewerId);
        const title = parentDoc.getElementById('fileViewerTitle' + fileConfig.viewerId);
        if (title) title.textContent = 'admin_key.dat';
        if (iframe) iframe.src = fileConfig.page;
        if (container) {
            container.style.display = 'block';
            container.style.visibility = 'visible';
            container.style.opacity = '1';
            if (window.parent.bringToFront) window.parent.bringToFront(container);
        }
        await systemLine("[TIP]: 管理者キー情報はEVEウィンドウ内に表示されます", 20);
        return true;
    };
})();
