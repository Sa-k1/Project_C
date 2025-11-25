/**
 * exit コマンド後のびっくり赤背景演出
 * 使い方: RedScreenEffect.shock() で一気に発動
 */

class RedScreenEffect {
    constructor(options = {}) {
        this.options = {
            message: '',
            messageDuration: 3000,
            sound: false,
            soundSrc: './shock.mp3',
            onComplete: null,
            ...options
        };
        this.overlay = null;
        this.vignette = null;
        this.messageEl = null;
        this.glitch = null;
        this.audio = null;
    }

    /**
     * びっくり演出を発動（メイン）
     */
    shock() {
        this.clear();

        // 画面を振動させる（html と body 両方）
        document.documentElement.classList.add('screen-shake');
        document.body.classList.add('screen-shake');

        // 赤オーバーレイ（瞬時）
        this.overlay = document.createElement('div');
        this.overlay.className = 'red-overlay shock';
        document.body.appendChild(this.overlay);

        // ビネット（瞬時）
        this.vignette = document.createElement('div');
        this.vignette.className = 'red-vignette active';
        document.body.appendChild(this.vignette);

        // グリッチノイズ
        this.glitch = document.createElement('div');
        this.glitch.className = 'glitch-noise';
        document.body.appendChild(this.glitch);

        // 音再生
        if (this.options.sound && this.options.soundSrc) {
            this.playSound();
        }

        // メッセージ表示（少し遅らせて表示）
        if (this.options.message) {
            setTimeout(() => {
                this.showMessage(this.options.message);
            }, 200);
        }

        // 振動終了
        setTimeout(() => {
            document.documentElement.classList.remove('screen-shake');
            document.body.classList.remove('screen-shake');
        }, 400);

        // 演出終了コールバック
        if (this.options.onComplete) {
            setTimeout(() => {
                this.options.onComplete();
            }, this.options.messageDuration + 500);
        }
    }

    /**
     * メッセージ表示
     */
    showMessage(text) {
        this.messageEl = document.createElement('div');
        this.messageEl.className = 'eve-message';
        this.messageEl.textContent = text;
        document.body.appendChild(this.messageEl);

        // フェードアウト
        setTimeout(() => {
            if (this.messageEl) {
                this.messageEl.classList.add('fade-out');
            }
        }, this.options.messageDuration);

        // 削除
        setTimeout(() => {
            if (this.messageEl) {
                this.messageEl.remove();
                this.messageEl = null;
            }
        }, this.options.messageDuration + 1000);
    }

    /**
     * 音再生
     */
    playSound() {
        try {
            this.audio = new Audio(this.options.soundSrc);
            this.audio.volume = 0.7;
            this.audio.play().catch(e => console.log('Audio error:', e));
        } catch (e) {
            console.log('Audio error:', e);
        }
    }

    /**
     * 激しい画面揺れ（エラー連打用）
     */
    shakeIntense() {
        document.documentElement.classList.add('screen-shake-intense');
        document.body.classList.add('screen-shake-intense');
    }

    /**
     * 激しい画面揺れを停止
     */
    stopShakeIntense() {
        document.documentElement.classList.remove('screen-shake-intense');
        document.body.classList.remove('screen-shake-intense');
    }

    /**
     * エラー連打演出（揺れ + 赤フラッシュ同時）
     */
    errorFlash() {
        this.clearOverlay();
        
        // 激しい揺れ
        document.documentElement.classList.add('screen-shake-intense');
        document.body.classList.add('screen-shake-intense');
        
        // 赤フラッシュ
        this.overlay = document.createElement('div');
        this.overlay.className = 'red-overlay error-flash';
        document.body.appendChild(this.overlay);
    }

    /**
     * 揺れだけ停止（赤はそのまま残す）
     */
    stopShakeOnly() {
        document.documentElement.classList.remove('screen-shake-intense');
        document.body.classList.remove('screen-shake-intense');
        
        // 赤フラッシュのアニメーションを止めて、固定の赤に変更
        if (this.overlay) {
            this.overlay.classList.remove('error-flash');
            this.overlay.classList.add('error-stay');
        }
    }

    /**
     * エラー連打演出を停止（揺れも赤も停止）
     */
    stopErrorFlash() {
        document.documentElement.classList.remove('screen-shake-intense');
        document.body.classList.remove('screen-shake-intense');
        
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }
    }

    /**
     * オーバーレイだけクリア（内部用）
     */
    clearOverlay() {
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }
    }

    /**
     * 演出をクリア
     */
    clear() {
        document.documentElement.classList.remove('screen-shake');
        document.body.classList.remove('screen-shake');
        document.documentElement.classList.remove('screen-shake-intense');
        document.body.classList.remove('screen-shake-intense');
        
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }
        if (this.vignette) {
            this.vignette.remove();
            this.vignette = null;
        }
        if (this.messageEl) {
            this.messageEl.remove();
            this.messageEl = null;
        }
        if (this.glitch) {
            this.glitch.remove();
            this.glitch = null;
        }
        if (this.audio) {
            this.audio.pause();
            this.audio = null;
        }
    }
}

// グローバルに公開
window.RedScreenEffect = RedScreenEffect;
window.redScreen = new RedScreenEffect(window.RED_SCREEN_OPTIONS || {});