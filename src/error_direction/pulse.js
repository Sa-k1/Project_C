/**
 * 脈動演出（心臓の鼓動風）
 * 使い方: 
 *   pulseEffect.start()     - 脈動開始（ループ）
 *   pulseEffect.single()    - 1回だけドクン
 *   pulseEffect.stop()      - 停止
 */

class PulseEffect {
    constructor(options = {}) {
        this.options = {
            enableZoom: true,
            enableVignette: true,
            message: null,
            sound: false,
            soundSrc: './heartbeat.mp3',
            ...options
        };
        this.overlay = null;
        this.vignette = null;
        this.messageEl = null;
        this.audio = null;
        this.isActive = false;
    }

    /**
     * 脈動開始（ループ）
     */
    start() {
        if (this.isActive) return;
        this.isActive = true;
        this.clear();

        this.overlay = document.createElement('div');
        this.overlay.className = 'pulse-overlay active';
        document.body.appendChild(this.overlay);

        if (this.options.enableVignette) {
            this.vignette = document.createElement('div');
            this.vignette.className = 'pulse-vignette active';
            document.body.appendChild(this.vignette);
        }

        if (this.options.enableZoom) {
            document.documentElement.classList.add('pulse-zoom');
            document.body.classList.add('pulse-zoom');
        }

        if (this.options.sound && this.options.soundSrc) {
            this.playSound();
        }

        if (this.options.message) {
            this.showMessage(this.options.message);
        }
    }

    /**
     * 1回だけ脈動（ドクン）
     */
    single(message = null) {
        this.clearOverlay();

        this.overlay = document.createElement('div');
        this.overlay.className = 'pulse-overlay single';
        document.body.appendChild(this.overlay);

        if (this.options.enableVignette) {
            this.vignette = document.createElement('div');
            this.vignette.className = 'pulse-vignette active';
            document.body.appendChild(this.vignette);
            
            setTimeout(() => {
                if (this.vignette) {
                    this.vignette.remove();
                    this.vignette = null;
                }
            }, 2000);
        }

        if (this.options.enableZoom) {
            document.documentElement.classList.add('pulse-zoom');
            document.body.classList.add('pulse-zoom');
            
            setTimeout(() => {
                document.documentElement.classList.remove('pulse-zoom');
                document.body.classList.remove('pulse-zoom');
            }, 1200);
        }

        if (message) {
            this.showMessage(message);
        }
    }

    /**
     * メッセージ表示
     */
    showMessage(text) {
        if (this.messageEl) {
            this.messageEl.remove();
        }
        
        this.messageEl = document.createElement('div');
        this.messageEl.className = 'pulse-message';
        this.messageEl.textContent = text;
        document.body.appendChild(this.messageEl);

        setTimeout(() => {
            if (this.messageEl) {
                this.messageEl.remove();
                this.messageEl = null;
            }
        }, 2000);
    }

    /**
     * 音再生（ループ）
     */
    playSound() {
        try {
            this.audio = new Audio(this.options.soundSrc);
            this.audio.volume = 0.4;
            this.audio.loop = true;
            this.audio.play().catch(e => console.log('Audio error:', e));
        } catch (e) {
            console.log('Audio error:', e);
        }
    }

    /**
     * オーバーレイだけクリア
     */
    clearOverlay() {
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }
    }

    /**
     * 脈動停止
     */
    stop() {
        this.isActive = false;
        
        document.documentElement.classList.remove('pulse-zoom');
        document.body.classList.remove('pulse-zoom');
        
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }
        if (this.vignette) {
            this.vignette.remove();
            this.vignette = null;
        }
        if (this.audio) {
            this.audio.pause();
            this.audio = null;
        }
    }

    /**
     * 完全クリア
     */
    clear() {
        this.stop();
        if (this.messageEl) {
            this.messageEl.remove();
            this.messageEl = null;
        }
    }
}

// グローバルに公開
window.PulseEffect = PulseEffect;
window.pulseEffect = new PulseEffect(window.PULSE_OPTIONS || {});