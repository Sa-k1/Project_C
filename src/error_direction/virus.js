/* ウイルス演出：VirusPopupSimulator クラス */
/* virus-config.js で設定管理 */

class VirusPopupSimulator {
    constructor(options = {}) {
        this.options = {
            count: 40,
            interval: 120,
            maxOnScreen: 60,
            enableGlitch: true,
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
        this.timerInterval = null;
    }

    createPopup(message) {
        if (this.popups.length >= this.options.maxOnScreen) return;

        const popup = document.createElement('div');
        popup.className = 'virus-popup';

        const w = Math.min(300, Math.max(240, window.innerWidth * 0.18));
        const h = 140;
        const x = Math.random() * (window.innerWidth - w);
        const y = Math.random() * (window.innerHeight - h);
        popup.style.left = `${x}px`;
        popup.style.top = `${y}px`;
        popup.style.minWidth = `${w}px`;

        popup.innerHTML = `
            <div class="virus-popup-handle">⚠️</div>
            <div class="virus-popup-title">警告</div>
            <div class="virus-popup-content">${message}</div>
            <div class="virus-popup-buttons">
                <button class="btn-ok">OK</button>
                <button class="btn-close">✕</button>
            </div>
        `;

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

        this.makeDraggable(popup);

        document.body.appendChild(popup);
        this.popups.push(popup);

        // setTimeout(() => {
        //     if (popup.parentElement) {
        //         popup.remove();
        //         this.popups = this.popups.filter(p => p !== popup);
        //     }
        // }, 7000);
    }

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

    startGlitch() {
        if (!this.options.enableGlitch) return;
        if (document.getElementById('virus-glitch')) return;

        const glitch = document.createElement('div');
        glitch.className = 'virus-screen-glitch';
        glitch.id = 'virus-glitch';
        document.body.appendChild(glitch);
    }

    stopGlitch() {
        const glitch = document.getElementById('virus-glitch');
        if (glitch) glitch.remove();
    }

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

    clear() {
        this.popups.forEach(p => p.remove());
        this.popups = [];
        this.stopGlitch();
    }
}

/* グローバルに公開 */
window.VirusPopupSimulator = VirusPopupSimulator;

/* 自動バインド */
(function autoBind() {
    function setup() {
        if (window.__virusSimulatorBound) return;

        // virus-config.js から設定を取得
        const opts = window.VIRUS_SIM_OPTIONS || {
            count: 40,
            interval: 120,
            maxOnScreen: 60,
            enableGlitch: true
        };

        const simulator = new VirusPopupSimulator(opts);
        window.simulator = simulator;

        function tryBind() {
            const startBtn = document.getElementById('start-virus');
            const clearBtn = document.getElementById('clear-virus');
            if (!startBtn || !clearBtn) return false;

            startBtn.addEventListener('click', () => {
                simulator.clear();
                simulator.start();
            });
            clearBtn.addEventListener('click', () => simulator.clear());
            window.__virusSimulatorBound = true;
            return true;
        }

        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            tryBind();
        } else {
            document.addEventListener('DOMContentLoaded', tryBind);
        }
    }

    try {
        setup();
    } catch (e) {
        console.error('virus.js autoBind failed', e);
    }
})();