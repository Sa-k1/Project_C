export class VirusPopupSimulator {
    constructor(options = {}) {
        this.options = {
            count: 100,                    // ポップアップ生成数
            interval: 10,               // 生成間隔（ms）
            maxOnScreen: 100,             // 画面上の最大数
            enableGlitch: true,          // 画面チラつき有効
            messages: [
                'ウイルス検出！',
                'システムが危険です',
                'データを更新してください',
                '緊急対応が必要です',
                'クリックして続行',
                'アップデート推奨'
            ],
            ...options
        };
        this.popups = [];
        this.glitchInterval = null;
    }

    /**
     * ポップアップを 1 つ生成
     */
    createPopup(message) {
        // 画面上限チェック
        if (this.popups.length >= this.options.maxOnScreen) {
            return;
        }

        const popup = document.createElement('div');
        popup.className = 'virus-popup';
        
        // ランダム位置（画面内）
        const x = Math.random() * (window.innerWidth - 300);
        const y = Math.random() * (window.innerHeight - 180);
        popup.style.left = `${x}px`;
        popup.style.top = `${y}px`;

        // コンテンツ
        popup.innerHTML = `
            <div class="virus-popup-handle">⚠️</div>
            <div class="virus-popup-title">警告</div>
            <div class="virus-popup-content">${message}</div>
            <div class="virus-popup-buttons">
                <button class="btn-ok">OK</button>
                <button class="btn-close">✕</button>
            </div>
        `;

        // ボタン動作
        const btnOk = popup.querySelector('.btn-ok');
        const btnClose = popup.querySelector('.btn-close');

        btnOk.addEventListener('click', () => {
            popup.classList.add('shake');
            setTimeout(() => popup.remove(), 400);
            this.popups = this.popups.filter(p => p !== popup);
        });

        btnClose.addEventListener('click', () => {
            popup.remove();
            this.popups = this.popups.filter(p => p !== popup);
        });

        // ドラッグ可能にする（移動の楽しさ）
        this.makeDraggable(popup);

        document.body.appendChild(popup);
        this.popups.push(popup);

        // 自動クローズ（7秒後）
        setTimeout(() => {
            if (popup.parentElement) {
                popup.remove();
                this.popups = this.popups.filter(p => p !== popup);
            }
        }, 7000);
    }

    /**
     * ドラッグ機能
     */
    makeDraggable(popup) {
        let offsetX = 0, offsetY = 0;
        const handle = popup.querySelector('.virus-popup-handle');

        handle.addEventListener('mousedown', (e) => {
            e.preventDefault();
            offsetX = e.clientX - popup.offsetLeft;
            offsetY = e.clientY - popup.offsetTop;

            const onMouseMove = (moveEvent) => {
                popup.style.left = (moveEvent.clientX - offsetX) + 'px';
                popup.style.top = (moveEvent.clientY - offsetY) + 'px';
            };

            const onMouseUp = () => {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            };

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
    }

    /**
     * チラつき効果を開始
     */
    startGlitch() {
        if (!this.options.enableGlitch) return;

        const glitch = document.createElement('div');
        glitch.className = 'virus-screen-glitch';
        glitch.id = 'virus-glitch';
        document.body.appendChild(glitch);

        this.glitchInterval = setInterval(() => {
            if (!document.getElementById('virus-glitch')) {
                clearInterval(this.glitchInterval);
            }
        }, 150);
    }

    /**
     * チラつき効果を終了
     */
    stopGlitch() {
        const glitch = document.getElementById('virus-glitch');
        if (glitch) glitch.remove();
        if (this.glitchInterval) clearInterval(this.glitchInterval);
    }

    /**
     * メイン実行
     */
    async start() {
        this.startGlitch();

        for (let i = 0; i < this.options.count; i++) {
            const msg = this.options.messages[
                Math.floor(Math.random() * this.options.messages.length)
            ];
            this.createPopup(msg);
            await new Promise(resolve => setTimeout(resolve, this.options.interval));
        }
    }

    /**
     * 全クリア
     */
    clear() {
        this.popups.forEach(p => p.remove());
        this.popups = [];
        this.stopGlitch();
    }
}

// グローバルで使う場合は以下をアンコメント
// window.VirusPopupSimulator = VirusPopupSimulator;