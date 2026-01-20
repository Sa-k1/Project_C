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

    // Titleに戻るボタンの処理
    const startBtn = document.getElementById('startBtn');
    if (startBtn) {
        startBtn.addEventListener('click', (e) => {
            console.log('ボタンがクリックされました');
            e.stopPropagation(); // クリックイベントの伝播を防止
            
            // フェードアウト開始
            document.body.style.transition = 'opacity 1s ease-out';
            document.body.style.opacity = '0';
            
            // フェードアウト完了後にメッセージを送信
            setTimeout(() => {
                console.log('electronAPI:', window.electronAPI);
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