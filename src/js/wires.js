// wires.html専用ビューア表示
(function() {
    window.puzzleSystem = window.puzzleSystem || {};
    window.puzzleSystem.displayWires = async function(term, gameState, puzzleHelpers) {
        const { systemLine, wait, errorLine } = puzzleHelpers;
        // wiresギミックが既に回答済みならエラーを返す
        if (gameState && gameState.wiresAnswered) {
            await errorLine("[ERROR]: wiresギミックは既に回答済みです。再度開くことはできません。", 20);
            await systemLine("[TIP]: wiresギミックは一度しか回答できません。", 20);
            return false;
        }
        // magic2と同じY/Nプロンプト
        term.write('[SYSTEM]: このギミックは一度しか解答できません。よろしいですか? (Y/N): ');
        gameState.inputMode = 'wires_confirm';
        gameState.waitingForWiresConfirm = { fileName: 'wires.html' };

        // wires.htmlからの完了通知を受けて2秒後にビューアを閉じる
        if (!window._wiresViewerCloseListener) {
            window._wiresViewerCloseListener = true;
            window.addEventListener('message', function(event) {
                if (event && event.data && event.data.type === 'wiresComplete') {
                    setTimeout(() => {
                        const parentDoc = window.parent.document;
                        const filePages = window.parent.filePages || {};
                        const fileConfig = filePages['wires'];
                        if (!fileConfig) return;
                        const container = parentDoc.getElementById('fileViewerContainer' + fileConfig.viewerId);
                        if (container) container.style.display = 'none';
                    }, 2000);
                }
            });
        }
    };

    window.puzzleSystem.handleWiresConfirmInput = async function(term, gameState, puzzleHelpers, input) {
        const { systemLine, errorLine, wait } = puzzleHelpers;
        var confirmation = gameState.waitingForWiresConfirm;
        if (!confirmation) return false;
        var answer = input.trim().toLowerCase();
        if (answer === 'y' || answer === 'yes') {
            term.write('\r\n');
            await systemLine('[SYSTEM]: 神経接続ギミックを読み込んでいます...', 30);
            await wait(800);
            await systemLine('', 0);
            // filePagesの仕組みを使ってwires.htmlをfileViewerContainer5で表示
            const parentDoc = window.parent.document;
            const filePages = window.parent.filePages || {};
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
                container.style.width = '400px';
                container.style.height = '300px';
                if (window.parent.bringToFront) window.parent.bringToFront(container);
            }
            await systemLine('[TIP]: 神経接続ギミックはEVEウィンドウ内に表示されます', 20);
            // ビューア自動クローズはpostMessageイベントで行う
            if (gameState) gameState.wiresAnswered = true;
            gameState.inputMode = 'normal';
            gameState.waitingForWiresConfirm = null;
            return true;
        } else if (answer === 'n' || answer === 'no') {
            term.write('\r\n');
            await systemLine('[CANCEL]: ギミック起動をキャンセルしました。', 20);
            gameState.inputMode = 'normal';
            gameState.waitingForWiresConfirm = null;
            return true;
        } else {
            term.write('\r\n');
            await errorLine('[ERROR]: Y または N を入力してください', 30);
            term.write('[SYSTEM]: このギミックは一度しか解答できません。よろしいですか? (Y/N): ');
            return true;
        }
    };
})();