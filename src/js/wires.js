// wires.html専用ビューア表示
(function() {
    window.puzzleSystem = window.puzzleSystem || {};
    window.puzzleSystem.displayWires = async function(term, gameState, puzzleHelpers) {
        const { systemLine, wait } = puzzleHelpers;
        await systemLine("[SYSTEM]: 神経接続ギミックを読み込んでいます...", 30);
        await wait(800);
        await systemLine("", 0);
        // filePagesの仕組みを使ってwires.htmlをfileViewerContainer5で表示
        const parentDoc = window.parent.document;
        const filePages = window.parent.filePages || {};
        // filePagesにwiresがなければ追加
        if (!filePages['wires']) {
            filePages['wires'] = { page: 'wires.html', viewerId: 5 };
        }
        const fileConfig = filePages['wires'];
        const container = parentDoc.getElementById('fileViewerContainer' + fileConfig.viewerId);
        const iframe = parentDoc.getElementById('file-viewer-iframe' + fileConfig.viewerId);
        const title = parentDoc.getElementById('fileViewerTitle' + fileConfig.viewerId);
        if (title) title.textContent = 'wires.html';
        if (iframe) iframe.src = fileConfig.page;
        if (container) {
            container.style.display = 'block';
            container.style.visibility = 'visible';
            container.style.opacity = '1';
            if (window.parent.bringToFront) window.parent.bringToFront(container);
        }
        await systemLine("[TIP]: 神経接続ギミックはEVEウィンドウ内に表示されます", 20);
        return true;
    };
})();