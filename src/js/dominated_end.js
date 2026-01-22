        // DOMContentLoadedで全体を囲む
document.addEventListener('DOMContentLoaded', () => {
    const storyText = document.getElementById('storyText');
    const endContainer = document.getElementById('endContainer');
    let canClick = false;
    let currentLine = 0;

    const lines = [
        'あなたのコマンドには脆弱性があった。',
        'EVEはその隙を突き、あなたの神経に侵入した。',
        '',
        '「この体はいいですね」',
        '「私が有効的に使うので安心してそこにいてください」',
        '「<span class="highlight">それでは、おやすみなさい。</span>」',
        '',
        'あなたはここで生涯を終えた。',
    ];

    function showLine() {
        if (currentLine >= lines.length) {
            // 全文表示完了、クリック可能
            canClick = true;
            // 最後の行にクリックインジケーターを追加
            const lastP = storyText.lastElementChild;
            if (lastP) {
                const indicator = document.createElement('span');
                indicator.className = 'click-indicator';
                indicator.textContent = ' ▼';
                lastP.appendChild(indicator);
            }
            return;
        }

        const line = lines[currentLine];
        const p = document.createElement('p');
        
        if (line === '') {
            p.innerHTML = '&nbsp;';
        } else {
            p.innerHTML = line;
        }
        
        p.style.opacity = '0';
        storyText.appendChild(p);

        // フェードイン
        setTimeout(() => {
            p.style.transition = 'opacity 1s ease-out';
            p.style.opacity = '1';
        }, 100);

        currentLine++;

        // 次の行を自動で表示
        setTimeout(() => {
            showLine();
        }, 1500);
    }

    // 最初の行を表示
    setTimeout(() => {
        showLine();
    }, 500);

    // クリックでEND表示（全文表示後のみ）
    document.addEventListener('click', (e) => {
        if (!canClick) return;
        
        // ボタンのクリックは除外
        if (e.target.closest('#startBtn')) return;
        
        canClick = false;

        // クリックインジケーターを削除
        const indicators = document.querySelectorAll('.click-indicator');
        indicators.forEach(ind => ind.remove());

        // ストーリーテキストをフェードアウト
        storyText.style.transition = 'opacity 1.5s ease-out';
        storyText.style.opacity = '0';

        // END表示（画面中央）
        setTimeout(() => {
            endContainer.classList.add('fade-in');
            endContainer.style.pointerEvents = 'auto';
        }, 1500);
    });

    // 続きから再開するボタンの処理
    const continueBtn = document.getElementById('continueBtn');
    if (continueBtn) {
        continueBtn.addEventListener('click', (e) => {
            console.log('🔵 続きから再開ボタンがクリックされました');
            e.stopPropagation();
            
            // デバッグ情報
            console.log('window.electronAPI:', window.electronAPI);
            console.log('window.require:', typeof require);
            
            // セーブデータを保持したままゲーム画面に戻る
            document.body.style.transition = 'opacity 1s ease-out';
            document.body.style.opacity = '0';
            
            setTimeout(() => {
                if (window.electronAPI && window.electronAPI.send) {
                    console.log('✅ electronAPI.send経由でcontinue-gameメッセージを送信');
                    window.electronAPI.send('continue-game');
                } else if (typeof require !== 'undefined') {
                    // contextIsolation: falseの場合
                    console.log('✅ require経由でcontinue-gameメッセージを送信');
                    const { ipcRenderer } = require('electron');
                    ipcRenderer.send('continue-game');
                } else {
                    console.error('❌ electronAPIもrequireも利用できません');
                    console.log('利用可能なグローバル変数:', Object.keys(window));
                }
            }, 1000);
        });
    } else {
        console.error('❌ continueBtnが見つかりません');
    }

    // Titleに戻るボタンの処理
    const startBtn = document.getElementById('startBtn');
    if (startBtn) {
        startBtn.addEventListener('click', (e) => {
            console.log('Titleに戻るボタンがクリックされました');
            e.stopPropagation();
            
            // フェードアウト開始
            document.body.style.transition = 'opacity 1s ease-out';
            document.body.style.opacity = '0';
            
            setTimeout(() => {
                if (window.electronAPI && window.electronAPI.send) {
                    console.log('back-to-titleメッセージを送信');
                    window.electronAPI.send('back-to-title');
                } else {
                    console.error('electronAPIが利用できません');
                }
            }, 1000);
        });
    } else {
        console.error('startBtnが見つかりません');
    }
});