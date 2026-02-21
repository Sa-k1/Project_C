/**
 * ホラー演出モジュール
 * コマンド使用時にランダムで発動
 */

class HoraEffect {
    constructor() {
        this.targetWindow = (window.parent && window.parent !== window) ? window.parent : window;
        this.targetDocument = this.targetWindow.document;
        this.audioContext = null;
        console.log('[HoraEffect] 初期化完了');
    }

    wait(ms) {
        return new Promise(res => setTimeout(res, ms));
    }

    /**
     * ランダムでホラー演出を発動
     * @param {number} chance - 発動確率 (0.0 ~ 1.0)
     */
    async randomTrigger(chance = 0.05) {
        console.log('[HoraEffect] randomTrigger呼び出し');
        if (Math.random() > chance) {
            return false;
        }

        const effects = [
            () => this.redFlash(),
            () => this.glitchAttack(),
            () => this.darkCreep()
        ];

        const effectIndex = Math.floor(Math.random() * effects.length);
        console.log('[HoraEffect] 演出発動:', effectIndex);
        await effects[effectIndex]();
        return true;
    }

    /**
     * 不気味なメッセージが一瞬表示
     */
    async creepyMessage() {
        const messages = [
            '見てる',
            '逃げられない',
            'ここにいる',
            '後ろ',
            '見つけた',
            'ずっと見てた',
            '助けて',
            '出られない',
            'お前だ',
            '消えろ'
        ];
        
        const msg = this.targetDocument.createElement('div');
        msg.className = 'hora-creepy-message';
        msg.textContent = messages[Math.floor(Math.random() * messages.length)];
        
        // ランダムな位置
        msg.style.left = (20 + Math.random() * 60) + '%';
        msg.style.top = (20 + Math.random() * 60) + '%';
        
        this.targetDocument.body.appendChild(msg);
        
        await this.wait(30);
        msg.classList.add('active');
        await this.wait(400);
        msg.classList.remove('active');
        await this.wait(200);
        msg.remove();
    }

    /**
     * 赤いフラッシュ + 振動
     */
    async redFlash() {
        this.playScareSound();
        
        const overlay = this.createOverlay('hora-red-flash');
        this.targetDocument.body.appendChild(overlay);
        this.targetDocument.body.classList.add('hora-shake');
        
        for (let i = 0; i < 4; i++) {
            overlay.style.opacity = '0.6';
            await this.wait(60);
            overlay.style.opacity = '0.1';
            await this.wait(40);
        }
        
        this.targetDocument.body.classList.remove('hora-shake');
        overlay.remove();
    }

    /**
     * 激しいグリッチ攻撃
     */
    async glitchAttack() {
        const overlay = this.createOverlay('hora-glitch-attack');
        this.targetDocument.body.appendChild(overlay);
        this.targetDocument.body.classList.add('hora-glitch-body');
        
        // ノイズ音
        this.playNoise(500);
        
        await this.wait(500);
        
        this.targetDocument.body.classList.remove('hora-glitch-body');
        overlay.remove();
    }

    /**
     * 画面が徐々に暗く侵食される
     */
    async darkCreep() {
        const dark = this.createOverlay('hora-dark-creep');
        this.targetDocument.body.appendChild(dark);
        
        await this.wait(30); // 50→30ms
        dark.classList.add('active');
        await this.wait(600); // 2000→600ms
        dark.classList.remove('active');
        await this.wait(150); // 500→150ms
        dark.remove();
    }

    // ================================
    // サウンド
    // ================================

    playScareSound() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.value = 150;
        osc.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.2);
        
        gain.gain.value = 0.3;
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
        
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        
        osc.start();
        osc.stop(this.audioContext.currentTime + 0.3);
    }

    async playNoise(duration = 500) {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        const bufferSize = this.audioContext.sampleRate * (duration / 1000);
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        const source = this.audioContext.createBufferSource();
        const gain = this.audioContext.createGain();
        
        source.buffer = buffer;
        gain.gain.value = 0.15;
        
        source.connect(gain);
        gain.connect(this.audioContext.destination);
        
        source.start();
    }

    playWhisper() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        // 低い持続音（不気味な雰囲気）
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.type = 'sine';
        osc.frequency.value = 80;
        
        gain.gain.value = 0.1;
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 2);
        
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        
        osc.start();
        osc.stop(this.audioContext.currentTime + 2);
    }

    // ================================
    // ユーティリティ
    // ================================

    createOverlay(className) {
        const overlay = this.targetDocument.createElement('div');
        overlay.className = className;
        return overlay;
    }

    // ================================
    // 特殊演出: 文字化け + 音（magic1クリア用）
    // ================================

    /**
     * ターミナル文字化け演出
     * @param {Object} term - xtermターミナルオブジェクト
     */
    async terminalGlitchAndShatter(term) {
        console.log('[HoraEffect] terminalGlitchAndShatter開始');
        
        const glitchChars = '҉̵̡̢̧̨̛̖̗̘̙̜̝̞̟̠̤̥̦̩̪̫̬̭̮̯̰̱̲̳̹̺̻̼͇͈͉͍͎̀́̂̃̄̅̆̇̈̉̊̋̌̍̎̏̐̑̒̓̔̽̾̿̀́͂̓̈́͆͊͋͌̕̚ͅ͏͓͔͕͖͙͚͐͑͒͗͛ͣͤͥͦͧͨͩͪͫͬͭͮͯ';
        const japaneseGlitch = '壊滅崩破裂堕落呪縛錯乱侵蝕';
        
        // === ダン！と一気に文字化けが出る ===
        this.playImpactSound();  // ドンという音
        this.targetDocument.body.classList.add('hora-violent-shake');
        
        // 一気に20行出す
        for (let i = 0; i < 20; i++) {
            let line = '';
            const lineLength = 70 + Math.floor(Math.random() * 30);
            for (let j = 0; j < lineLength; j++) {
                if (Math.random() < 0.4) {
                    line += japaneseGlitch[Math.floor(Math.random() * japaneseGlitch.length)];
                } else {
                    line += glitchChars[Math.floor(Math.random() * glitchChars.length)];
                }
            }
            term.writeln('\r\x1b[91m' + line + '\x1b[0m');
        }
        
        await this.wait(100);
        this.targetDocument.body.classList.remove('hora-violent-shake');
        
        // ノイズ音
        this.playNoise(400);
        
        // 画面グリッチ
        this.targetDocument.body.classList.add('hora-glitch-body');
        await this.wait(400);
        this.targetDocument.body.classList.remove('hora-glitch-body');
        
        term.writeln('\r\n');
        await this.wait(200);
    }

    /**
     * ドンというインパクト音
     */
    playImpactSound() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        // 低音のドン
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.type = 'sine';
        osc.frequency.value = 80;
        osc.frequency.exponentialRampToValueAtTime(30, this.audioContext.currentTime + 0.2);
        
        gain.gain.value = 0.5;
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
        
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        
        osc.start();
        osc.stop(this.audioContext.currentTime + 0.3);
    }

    // ================================
    // 特殊演出: 「その体をください」→「ください」画面いっぱい（magic2用）
    // ================================

    /**
     * 「ください」演出
     * @param {Object} term - xtermターミナルオブジェクト
     * @param {Object} helpers - puzzleHelpers
     */
    async kudasaiEffect(term, helpers) {
        console.log('[HoraEffect] kudasaiEffect開始');
        
        // EVEのセリフ
        await helpers.wait(500);
        await helpers.eveLine('[EVE]: その体を...', 30);
        await helpers.wait(800);
        await helpers.eveLine('[EVE]: ください', 50);
        await helpers.wait(1000);
        
        // バンッ！という音と同時に真っ暗 + ください
        await this.playBangSound();
        
        // 画面真っ暗 + 「ください」を同時に出す
        const blackout = this.targetDocument.createElement('div');
        blackout.className = 'hora-blackout active';
        this.targetDocument.body.appendChild(blackout);
        
        const kudasai = this.targetDocument.createElement('div');
        kudasai.className = 'hora-kudasai-container active';
        
        // ぎっしり配置（12列×15行）
        const cols = 12;
        const rows = 15;
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const text = this.targetDocument.createElement('div');
                text.className = 'hora-kudasai-text';
                text.textContent = 'ください';
                text.style.left = (col / cols * 100 + 100 / cols / 2) + '%';
                text.style.top = (row / rows * 100 + 100 / rows / 2) + '%';
                kudasai.appendChild(text);
            }
        }
        
        this.targetDocument.body.appendChild(kudasai);
        
        // 画面振動
        this.targetDocument.body.classList.add('hora-violent-shake');
        await this.wait(100);
        this.targetDocument.body.classList.remove('hora-violent-shake');
        
        await this.wait(2500);
        
        // いきなり消える
        kudasai.remove();
        blackout.remove();
    }

    /**
     * ダンッという衝撃音（音源ファイル再生）
     */
    // async playBangSound() {
    //     console.log('[HoraEffect] playBangSound - 音源ファイル再生');
    //     
    //     try {
    //         // 音源ファイルのパスを解決
    //         const audioPath = '../audio/se_bikkuri05.mp3';
    //         
    //         const audio = new Audio(audioPath);
    //         audio.volume = 1.0; // 最大音量
    //         
    //         // 再生
    //         await audio.play();
    //         console.log('[HoraEffect] playBangSound - 再生成功');
    //     } catch (e) {
    //         console.error('[HoraEffect] playBangSound - エラー:', e);
    //         // フォールバック：生成音
    //         this.playBangSoundFallback();
    //     }
    // }

    /**
     * バン音（生成音）
     */
    playBangSound() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        const now = this.audioContext.currentTime;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.type = 'sine';
        osc.frequency.value = 60;
        
        gain.gain.setValueAtTime(1000.0, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        
        osc.start(now);
        osc.stop(now + 0.3);
    }

    /**
     * ジャンプスケア（掌画像）
     */
    async jumpScarePalm() {
        console.log('[HoraEffect] jumpScarePalm開始');
        
        // バン音（se_bikkuri05.mp3）
        try {
            const audio = new Audio('../audio/se_bikkuri05.mp3');
            audio.volume = 1.0;
            audio.play();
        } catch(e) {
            console.error('[HoraEffect] 音声再生エラー:', e);
        }
        
        // 画面振動
        this.targetDocument.body.classList.add('hora-violent-shake');
        
        // 掌画像を画面いっぱいに表示
        const overlay = this.targetDocument.createElement('div');
        overlay.className = 'hora-jumpscare-overlay';
        
        const img = this.targetDocument.createElement('img');
        img.src = '../pic/IMG_3690.png';
        img.className = 'hora-jumpscare-image';
        img.onerror = () => console.error('[HoraEffect] 画像読み込み失敗:', img.src);
        img.onload = () => console.log('[HoraEffect] 画像読み込み成功');
        overlay.appendChild(img);
        
        this.targetDocument.body.appendChild(overlay);
        
        await this.wait(100);
        this.targetDocument.body.classList.remove('hora-violent-shake');
        
        // 少し表示
        await this.wait(800);
        
        // 消える
        overlay.remove();
        
        console.log('[HoraEffect] jumpScarePalm終了');
    }

    /**
     * 画面が割れる演出
     */
    async shatterScreen(term) {
        // ガラスが割れる音
        this.playGlassBreak();
        
        // 画面振動
        this.targetDocument.body.classList.add('hora-violent-shake');
        
        // 画面割れオーバーレイ
        const shatter = this.targetDocument.createElement('div');
        shatter.className = 'hora-shatter-overlay';
        shatter.innerHTML = this.generateCracks();
        this.targetDocument.body.appendChild(shatter);
        
        await this.wait(50);
        shatter.classList.add('active');
        
        // 文字が飛び散るパーティクル
        const particles = this.targetDocument.createElement('div');
        particles.className = 'hora-text-particles';
        
        const flyingChars = '壊滅破損崩落ERROR警告危険';
        for (let i = 0; i < 30; i++) {
            const p = this.targetDocument.createElement('div');
            p.className = 'hora-flying-char';
            p.textContent = flyingChars[Math.floor(Math.random() * flyingChars.length)];
            p.style.left = (Math.random() * 100) + '%';
            p.style.top = (Math.random() * 100) + '%';
            p.style.setProperty('--fly-x', (Math.random() - 0.5) * 500 + 'px');
            p.style.setProperty('--fly-y', (Math.random() - 0.5) * 500 + 'px');
            p.style.setProperty('--fly-rotate', (Math.random() * 720 - 360) + 'deg');
            p.style.animationDelay = (Math.random() * 0.2) + 's';
            particles.appendChild(p);
        }
        this.targetDocument.body.appendChild(particles);
        
        await this.wait(300);
        this.targetDocument.body.classList.remove('hora-violent-shake');
        
        // 割れたまま少し維持
        await this.wait(1500);
        
        // フェードアウト
        shatter.classList.add('fadeout');
        particles.classList.add('fadeout');
        
        await this.wait(500);
        shatter.remove();
        particles.remove();
    }
}

// グローバルに公開
window.HoraEffect = HoraEffect;
window.horaFX = new HoraEffect();
