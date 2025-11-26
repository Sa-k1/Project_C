/**
 * 心理ホラー演出（電子的な呼吸・脈動）
 */

class PulseEffect {
    constructor(options = {}) {
        this.options = {
            enableZoom: true,
            enableVignette: true,
            enableScanline: true,
            enableGlitch: false,
            message: null,
            sound: false,
            soundSrc: './heartbeat.mp3',
            ...options
        };
        this.overlay = null;
        this.vignette = null;
        this.scanline = null;
        this.glitch = null;
        this.ghost = null;
        this.flicker = null;
        this.messageEl = null;
        this.audio = null;
        this.isActive = false;
    }

    /**
     * 心臓の鼓動（ループ）- 不気味
     */
    startHeartbeat() {
        if (this.isActive) return;
        this.isActive = true;
        this.clear();

        // オーバーレイ
        this.overlay = document.createElement('div');
        this.overlay.className = 'pulse-overlay heartbeat';
        document.body.appendChild(this.overlay);

        // ビネット（画面端の闇）
        if (this.options.enableVignette) {
            this.vignette = document.createElement('div');
            this.vignette.className = 'pulse-vignette horror';
            document.body.appendChild(this.vignette);
        }

        // 走査線
        if (this.options.enableScanline) {
            this.scanline = document.createElement('div');
            this.scanline.className = 'scanline-noise active';
            document.body.appendChild(this.scanline);
        }

        // ズーム
        if (this.options.enableZoom) {
            document.documentElement.classList.add('pulse-zoom-horror');
            document.body.classList.add('pulse-zoom-horror');
        }

        // 音
        if (this.options.sound && this.options.soundSrc) {
            this.playSound();
        }
    }

    /**
     * 電子的な呼吸（ループ）- 機械的で不気味
     */
    startDigitalBreath() {
        if (this.isActive) return;
        this.isActive = true;
        this.clear();

        this.overlay = document.createElement('div');
        this.overlay.className = 'pulse-overlay digital-breath';
        document.body.appendChild(this.overlay);

        // 走査線
        this.scanline = document.createElement('div');
        this.scanline.className = 'scanline-noise active';
        document.body.appendChild(this.scanline);

        // グリッチ
        if (this.options.enableGlitch) {
            this.glitch = document.createElement('div');
            this.glitch.className = 'glitch-distort active';
            document.body.appendChild(this.glitch);
        }
    }

    /**
     * 1回だけ脈動（ドクン！）- ホラー版
     */
    single(message = null) {
        this.clearOverlay();

        // 激しい脈動
        this.overlay = document.createElement('div');
        this.overlay.className = 'pulse-overlay single-horror';
        document.body.appendChild(this.overlay);

        // ビネット
        this.vignette = document.createElement('div');
        this.vignette.className = 'pulse-vignette horror';
        document.body.appendChild(this.vignette);
        
        setTimeout(() => {
            if (this.vignette) {
                this.vignette.style.animation = 'none';
                this.vignette.style.opacity = '0.3';
            }
        }, 1500);

        // ズーム（1回だけ）
        if (this.options.enableZoom) {
            document.documentElement.classList.add('pulse-zoom-horror');
            document.body.classList.add('pulse-zoom-horror');
            
            setTimeout(() => {
                document.documentElement.classList.remove('pulse-zoom-horror');
                document.body.classList.remove('pulse-zoom-horror');
            }, 1500);
        }

        // 走査線（一瞬）
        this.scanline = document.createElement('div');
        this.scanline.className = 'scanline-noise active';
        document.body.appendChild(this.scanline);
        
        setTimeout(() => {
            if (this.scanline) {
                this.scanline.classList.remove('active');
            }
        }, 1000);

        // メッセージ
        if (message) {
            this.showMessage(message);
        }
    }

    /**
     * 幽霊のような残像（じわっと現れる）
     */
    ghostAppear() {
        if (this.ghost) {
            this.ghost.remove();
        }
        
        this.ghost = document.createElement('div');
        this.ghost.className = 'ghost-afterimage active';
        document.body.appendChild(this.ghost);

        setTimeout(() => {
            if (this.ghost) {
                this.ghost.remove();
                this.ghost = null;
            }
        }, 4000);
    }

    /**
     * 一瞬のちらつき（何かが見えた気がする）
     */
    flicker() {
        if (this.flicker) {
            this.flicker.remove();
        }
        
        this.flickerEl = document.createElement('div');
        this.flickerEl.className = 'horror-flicker active';
        document.body.appendChild(this.flickerEl);

        setTimeout(() => {
            if (this.flickerEl) {
                this.flickerEl.remove();
                this.flickerEl = null;
            }
        }, 200);
    }

    /**
     * グリッチ攻撃（画面が壊れる）
     */
    glitchAttack(duration = 2000) {
        if (this.glitch) {
            this.glitch.remove();
        }
        
        this.glitch = document.createElement('div');
        this.glitch.className = 'glitch-distort active';
        document.body.appendChild(this.glitch);

        setTimeout(() => {
            if (this.glitch) {
                this.glitch.remove();
                this.glitch = null;
            }
        }, duration);
    }

    /**
     * 全部乗せ（最恐演出）
     */
    nightmare(message = null) {
        this.clear();

        // 一瞬のちらつき
        this.flickerEl = document.createElement('div');
        this.flickerEl.className = 'horror-flicker active';
        document.body.appendChild(this.flickerEl);

        setTimeout(() => {
            if (this.flickerEl) {
                this.flickerEl.remove();
            }

            // 激しい脈動
            this.overlay = document.createElement('div');
            this.overlay.className = 'pulse-overlay single-horror';
            document.body.appendChild(this.overlay);

            // ビネット
            this.vignette = document.createElement('div');
            this.vignette.className = 'pulse-vignette horror';
            document.body.appendChild(this.vignette);

            // 走査線
            this.scanline = document.createElement('div');
            this.scanline.className = 'scanline-noise active';
            document.body.appendChild(this.scanline);

            // グリッチ
            this.glitch = document.createElement('div');
            this.glitch.className = 'glitch-distort active';
            document.body.appendChild(this.glitch);

            // ズーム
            document.documentElement.classList.add('pulse-zoom-horror');
            document.body.classList.add('pulse-zoom-horror');

            // 幽霊
            this.ghost = document.createElement('div');
            this.ghost.className = 'ghost-afterimage active';
            document.body.appendChild(this.ghost);

            // メッセージ
            if (message) {
                setTimeout(() => {
                    this.showMessage(message);
                }, 500);
            }

            // 3秒後にグリッチだけ止める
            setTimeout(() => {
                if (this.glitch) {
                    this.glitch.remove();
                    this.glitch = null;
                }
                document.documentElement.classList.remove('pulse-zoom-horror');
                document.body.classList.remove('pulse-zoom-horror');
            }, 3000);
        }, 150);
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
        }, 3000);
    }

    /**
     * 音再生
     */
    playSound() {
        try {
            this.audio = new Audio(this.options.soundSrc);
            this.audio.volume = 0.3;
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
     * 停止
     */
    stop() {
        this.isActive = false;
        
        document.documentElement.classList.remove('pulse-zoom-horror');
        document.body.classList.remove('pulse-zoom-horror');
        
        if (this.overlay) { this.overlay.remove(); this.overlay = null; }
        if (this.vignette) { this.vignette.remove(); this.vignette = null; }
        if (this.scanline) { this.scanline.remove(); this.scanline = null; }
        if (this.glitch) { this.glitch.remove(); this.glitch = null; }
        if (this.ghost) { this.ghost.remove(); this.ghost = null; }
        if (this.flickerEl) { this.flickerEl.remove(); this.flickerEl = null; }
        if (this.audio) { this.audio.pause(); this.audio = null; }
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