// =========================================
// EVE謎解きシステム
// ダイヤル・クリック連打・長押し
// =========================================

(function() {
    'use strict';

    // =========================================
    // 設定
    // =========================================
    const PUZZLE_CONFIG = {
        // ダイヤルの正解（0-100の3つの数字）
        dialAnswers: [37, 72, 15],
        // クリック目標回数
        clickTarget: 20,
        // 長押し目標秒数
        holdTarget: 5.0,
        // 成功後の遷移先
        successDestination: 'true_end.html'
    };

    // =========================================
    // 状態管理
    // =========================================
    const state = {
        // ダイヤルの現在値
        dialValues: [0, 0, 0],
        // ダイヤルのロック状態
        dialLocked: [false, false, false],
        // クリック回数
        clickCount: 0,
        // クリック完了
        clickComplete: false,
        // 長押し時間
        holdTime: 0,
        // 長押し中か
        isHolding: false,
        // 長押し完了
        holdComplete: false,
        // 長押しインターバル
        holdInterval: null
    };

    // =========================================
    // 音声生成（Web Audio API）
    // =========================================
    let audioContext = null;

    function initAudio() {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    // カチッ音（正解位置）
    function playClickSound() {
        initAudio();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 1200;
        oscillator.type = 'square';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialDecayTo = 0.01;
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialDecayTo = 0.01;
        gainNode.gain.linearRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.05);
    }

    // 通常のダイヤル音
    function playDialSound() {
        initAudio();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 400;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.01, audioContext.currentTime + 0.03);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.03);
    }

    // ロック音（ダイヤル確定）
    function playLockSound() {
        initAudio();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
    }

    // クリック音
    function playTapSound() {
        initAudio();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 600 + Math.random() * 200;
        oscillator.type = 'square';
        
        gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.01, audioContext.currentTime + 0.02);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.02);
    }

    // 成功音
    function playSuccessSound() {
        initAudio();
        const frequencies = [523, 659, 784, 1047]; // C5, E5, G5, C6
        
        frequencies.forEach((freq, i) => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = freq;
            oscillator.type = 'sine';
            
            const startTime = audioContext.currentTime + i * 0.15;
            gainNode.gain.setValueAtTime(0.2, startTime);
            gainNode.gain.linearRampToValueAtTime(0.01, startTime + 0.3);
            
            oscillator.start(startTime);
            oscillator.stop(startTime + 0.3);
        });
    }

    // =========================================
    // ダイヤル処理
    // =========================================
    function updateDialDisplay(dialIndex) {
        const dial = document.querySelector(`.dial[data-dial="${dialIndex}"]`);
        const valueSpan = dial.querySelector('.dial-value');
        valueSpan.textContent = state.dialValues[dialIndex];
    }

    function checkDialCorrect(dialIndex) {
        return state.dialValues[dialIndex] === PUZZLE_CONFIG.dialAnswers[dialIndex];
    }

    function updateDialStatus(dialIndex) {
        const statusEl = document.querySelector(`.dial-status[data-dial="${dialIndex}"]`);
        
        if (state.dialLocked[dialIndex]) {
            statusEl.textContent = '🔓 UNLOCKED';
            statusEl.className = 'dial-status unlocked';
        } else if (checkDialCorrect(dialIndex)) {
            statusEl.textContent = '✓ CORRECT';
            statusEl.className = 'dial-status unlocked';
        } else {
            statusEl.textContent = '';
            statusEl.className = 'dial-status';
        }
    }

    function checkAllDialsComplete() {
        const allCorrect = state.dialLocked.every(locked => locked);
        const statusEl = document.getElementById('dial-complete');
        
        if (allCorrect) {
            statusEl.textContent = '✓ UNLOCKED';
            statusEl.classList.add('complete');
        } else {
            statusEl.textContent = '❌ LOCKED';
            statusEl.classList.remove('complete');
        }
        
        checkFinalStatus();
    }

    function handleDialChange(dialIndex, direction) {
        if (state.dialLocked[dialIndex]) return;
        
        let newValue = state.dialValues[dialIndex];
        
        if (direction === 'up') {
            newValue = (newValue + 1) % 101;
        } else {
            newValue = (newValue - 1 + 101) % 101;
        }
        
        state.dialValues[dialIndex] = newValue;
        updateDialDisplay(dialIndex);
        
        // 正解の位置かチェック
        if (checkDialCorrect(dialIndex)) {
            playClickSound(); // カチッ音
            
            // 正解位置でロック
            state.dialLocked[dialIndex] = true;
            playLockSound();
            updateDialStatus(dialIndex);
            checkAllDialsComplete();
        } else {
            playDialSound(); // 通常音
            updateDialStatus(dialIndex);
        }
    }

    // =========================================
    // クリック連打処理
    // =========================================
    function updateClickDisplay() {
        document.getElementById('click-count').textContent = state.clickCount;
        const percent = (state.clickCount / PUZZLE_CONFIG.clickTarget) * 100;
        document.getElementById('click-bar').style.width = percent + '%';
    }

    function handleClick() {
        if (state.clickComplete) return;
        
        state.clickCount++;
        playTapSound();
        updateClickDisplay();
        
        // ボタンにアニメーション
        const btn = document.getElementById('click-target');
        btn.style.transform = 'scale(0.9)';
        setTimeout(() => btn.style.transform = '', 50);
        
        if (state.clickCount >= PUZZLE_CONFIG.clickTarget) {
            state.clickComplete = true;
            btn.classList.add('complete');
            btn.querySelector('span').textContent = 'DONE';
            
            const statusEl = document.getElementById('click-complete');
            statusEl.textContent = '✓ UNLOCKED';
            statusEl.classList.add('complete');
            
            playLockSound();
            checkFinalStatus();
        }
    }

    // =========================================
    // 長押し処理
    // =========================================
    function updateHoldDisplay() {
        document.getElementById('hold-time').textContent = state.holdTime.toFixed(1);
        const percent = (state.holdTime / PUZZLE_CONFIG.holdTarget) * 100;
        document.getElementById('hold-bar').style.width = Math.min(percent, 100) + '%';
    }

    function startHold() {
        if (state.holdComplete) return;
        
        state.isHolding = true;
        const btn = document.getElementById('hold-target');
        btn.classList.add('holding');
        
        state.holdInterval = setInterval(() => {
            if (!state.isHolding) return;
            
            state.holdTime += 0.05;
            updateHoldDisplay();
            
            if (state.holdTime >= PUZZLE_CONFIG.holdTarget) {
                completeHold();
            }
        }, 50);
    }

    function stopHold() {
        if (state.holdComplete) return;
        
        state.isHolding = false;
        const btn = document.getElementById('hold-target');
        btn.classList.remove('holding');
        
        if (state.holdInterval) {
            clearInterval(state.holdInterval);
            state.holdInterval = null;
        }
        
        // 離すとリセット（完了していない場合）
        if (!state.holdComplete) {
            state.holdTime = 0;
            updateHoldDisplay();
        }
    }

    function completeHold() {
        state.holdComplete = true;
        state.isHolding = false;
        
        if (state.holdInterval) {
            clearInterval(state.holdInterval);
            state.holdInterval = null;
        }
        
        const btn = document.getElementById('hold-target');
        btn.classList.remove('holding');
        btn.classList.add('complete');
        btn.querySelector('span').textContent = 'DONE';
        
        const statusEl = document.getElementById('hold-complete');
        statusEl.textContent = '✓ UNLOCKED';
        statusEl.classList.add('complete');
        
        playLockSound();
        checkFinalStatus();
    }

    // =========================================
    // 最終ステータスチェック
    // =========================================
    function checkFinalStatus() {
        const dialComplete = state.dialLocked.every(locked => locked);
        const allComplete = dialComplete && state.clickComplete && state.holdComplete;
        
        const statusEl = document.getElementById('security-status');
        
        if (allComplete) {
            statusEl.textContent = 'UNLOCKED';
            statusEl.classList.add('unlocked');
            
            // 成功演出
            playSuccessSound();
            
            // 2秒後に遷移
            setTimeout(() => {
                window.location.href = PUZZLE_CONFIG.successDestination;
            }, 2000);
        }
    }

    // =========================================
    // 初期化
    // =========================================
    function initPuzzle() {
        // ダイヤルボタンのイベント
        document.querySelectorAll('.dial-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const dialIndex = parseInt(btn.dataset.dial);
                const direction = btn.dataset.dir;
                handleDialChange(dialIndex, direction);
            });
        });
        
        // クリックターゲットのイベント
        const clickTarget = document.getElementById('click-target');
        clickTarget.addEventListener('click', handleClick);
        
        // 長押しターゲットのイベント
        const holdTarget = document.getElementById('hold-target');
        holdTarget.addEventListener('mousedown', startHold);
        holdTarget.addEventListener('mouseup', stopHold);
        holdTarget.addEventListener('mouseleave', stopHold);
        holdTarget.addEventListener('touchstart', (e) => {
            e.preventDefault();
            startHold();
        });
        holdTarget.addEventListener('touchend', stopHold);
        holdTarget.addEventListener('touchcancel', stopHold);
        
        // 初期表示
        for (let i = 0; i < 3; i++) {
            updateDialDisplay(i);
            updateDialStatus(i);
        }
        updateClickDisplay();
        updateHoldDisplay();
    }

    // =========================================
    // 謎解きUIを表示する関数（外部から呼び出し可能）
    // =========================================
    function showPuzzle() {
        const puzzleOverlay = document.getElementById('puzzle-overlay');
        puzzleOverlay.style.display = 'flex';
        initPuzzle();
    }

    function hidePuzzle() {
        const puzzleOverlay = document.getElementById('puzzle-overlay');
        puzzleOverlay.style.display = 'none';
    }

    // グローバルに公開
    window.evePuzzle = {
        show: showPuzzle,
        hide: hidePuzzle,
        config: PUZZLE_CONFIG
    };

    // 自動で表示する場合（テスト用）
    // 本番では eve_intro.js から適切なタイミングで window.evePuzzle.show() を呼ぶ
    // document.addEventListener('DOMContentLoaded', () => {
    //     // 3秒後に謎解きUIを表示（テスト用）
    //     // 本番ではストーリー演出後に呼び出す
    //     setTimeout(() => {
    //         showPuzzle();
    //     }, 3000);
    // });

})();
