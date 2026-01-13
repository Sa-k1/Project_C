// =========================================
// EVE謎解きシステム（自動開始版）
// last_nazo.html 専用
// =========================================

(function() {
    'use strict';

    // =========================================
    // 設定
    // =========================================
    const PUZZLE_CONFIG = {
        // ダイヤルの正解（0-100の3つの数字）
        dialAnswers: [33, 66, 99],
        // クリック目標回数
        clickTarget: 20,
        // 長押し目標秒数
        holdTarget: 5.0,
        // 時間制限（秒）
        timeLimit: 6000,
        // 成功後の遷移先
        successDestination: 'true_end.html',
        // 失敗後の遷移先
        failDestination: 'dominated_end.html'
    };

    // =========================================
    // 状態管理
    // =========================================
    const state = {
        dialValues: [0, 0, 0],
        dialLocked: [false, false, false],
        dialComplete: false,  // 3つ全て正解でクリア
        clickCount: 0,
        clickComplete: false,
        holdTime: 0,
        isHolding: false,
        holdComplete: false,
        holdInterval: null,
        // タイマー関連
        timeRemaining: PUZZLE_CONFIG.timeLimit,
        timerInterval: null,
        gameOver: false
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

    function playClickSound() {
        initAudio();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.frequency.value = 1200;
        oscillator.type = 'square';
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.05);
    }

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

    function playSuccessSound() {
        initAudio();
        const frequencies = [523, 659, 784, 1047];
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

    // 失敗音
    function playFailSound() {
        initAudio();
        const frequencies = [400, 300, 200];
        frequencies.forEach((freq, i) => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            oscillator.frequency.value = freq;
            oscillator.type = 'sawtooth';
            const startTime = audioContext.currentTime + i * 0.2;
            gainNode.gain.setValueAtTime(0.3, startTime);
            gainNode.gain.linearRampToValueAtTime(0.01, startTime + 0.3);
            oscillator.start(startTime);
            oscillator.stop(startTime + 0.3);
        });
    }

    // =========================================
    // タイマー処理
    // =========================================
    function updateTimerDisplay() {
        const timerEl = document.getElementById('timer-display');
        if (timerEl) {
            timerEl.textContent = state.timeRemaining.toFixed(1);
            // 残り5秒以下で赤く
            if (state.timeRemaining <= 5) {
                timerEl.classList.add('danger');
            }
        }
    }

    function startTimer() {
        state.timerInterval = setInterval(() => {
            if (state.gameOver) return;
            
            state.timeRemaining -= 0.1;
            updateTimerDisplay();
            
            if (state.timeRemaining <= 0) {
                state.timeRemaining = 0;
                updateTimerDisplay();
                gameOverFail();
            }
        }, 100);
    }

    function stopTimer() {
        if (state.timerInterval) {
            clearInterval(state.timerInterval);
            state.timerInterval = null;
        }
    }

    function gameOverFail() {
        state.gameOver = true;
        stopTimer();
        
        // 長押し中なら停止
        if (state.holdInterval) {
            clearInterval(state.holdInterval);
            state.holdInterval = null;
        }
        
        playFailSound();
        
        // 画面を赤くフラッシュ
        const puzzleOverlay = document.getElementById('puzzle-overlay');
        if (puzzleOverlay) {
            puzzleOverlay.style.background = 'rgba(100, 0, 0, 0.95)';
        }
        
        const statusEl = document.getElementById('security-status');
        if (statusEl) {
            statusEl.textContent = 'TIME OUT - FAILED';
            statusEl.style.color = '#f00';
        }
        
        // 2秒後に失敗画面へ遷移
        setTimeout(() => {
            window.location.href = PUZZLE_CONFIG.failDestination;
        }, 2000);
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
        // ステータス表示なし（答えがわからないようにする）
        const statusEl = document.querySelector(`.dial-status[data-dial="${dialIndex}"]`);
        statusEl.textContent = '';
        statusEl.className = 'dial-status';
    }

    function checkAllDialsComplete() {
        // 3つ全てが正解の値になっているかチェック
        const allCorrect = PUZZLE_CONFIG.dialAnswers.every((answer, i) => state.dialValues[i] === answer);
        const statusEl = document.getElementById('dial-complete');
        
        if (allCorrect && !state.dialComplete) {
            // 3つ全て正解！
            state.dialComplete = true;
            state.dialLocked = [true, true, true]; // 全てロック
            statusEl.textContent = '✓ UNLOCKED';
            statusEl.classList.add('complete');
            playLockSound();
        } else if (!allCorrect) {
            state.dialComplete = false;
            statusEl.textContent = '❌ LOCKED';
            statusEl.classList.remove('complete');
        }
        checkFinalStatus();
    }

    function handleDialChange(dialIndex, direction) {
        // ダイヤルクリア済みなら操作不可
        if (state.dialComplete || state.gameOver) return;
        
        let newValue = state.dialValues[dialIndex];
        if (direction === 'up') {
            newValue = (newValue + 1) % 101;
        } else {
            newValue = (newValue - 1 + 101) % 101;
        }
        
        state.dialValues[dialIndex] = newValue;
        updateDialDisplay(dialIndex);
        playDialSound();
        
        // 3つ全て正解かチェック
        checkAllDialsComplete();
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
        if (state.clickComplete || state.gameOver) return;
        
        state.clickCount++;
        playTapSound();
        updateClickDisplay();
        
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
        if (state.holdComplete || state.gameOver) return;
        
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
        if (state.holdComplete || state.gameOver) return;
        
        state.isHolding = false;
        const btn = document.getElementById('hold-target');
        btn.classList.remove('holding');
        
        if (state.holdInterval) {
            clearInterval(state.holdInterval);
            state.holdInterval = null;
        }
        
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
        if (state.gameOver) return;
        
        // dialCompleteを使用（3つ全て正解でtrue）
        const allComplete = state.dialComplete && state.clickComplete && state.holdComplete;
        
        const statusEl = document.getElementById('security-status');
        
        if (allComplete) {
            state.gameOver = true;
            stopTimer();
            
            statusEl.textContent = 'UNLOCKED';
            statusEl.classList.add('unlocked');
            playSuccessSound();
            setTimeout(() => {
                window.location.href = PUZZLE_CONFIG.successDestination;
            }, 2000);
        }
    }

    // =========================================
    // 初期化
    // =========================================
    function initPuzzle() {
        // ダイヤルボタン（クリックのみ）
        document.querySelectorAll('.dial-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const dialIndex = parseInt(btn.dataset.dial);
                const direction = btn.dataset.dir;
                handleDialChange(dialIndex, direction);
            });
        });
        
        // クリックターゲット
        const clickTarget = document.getElementById('click-target');
        clickTarget.addEventListener('click', handleClick);
        
        // 長押しターゲット
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
        updateTimerDisplay();
        
        // タイマー開始
        startTimer();
    }

    // ページ読み込み時に自動開始
    document.addEventListener('DOMContentLoaded', () => {
        const puzzleOverlay = document.getElementById('puzzle-overlay');
        if (puzzleOverlay) {
            puzzleOverlay.style.display = 'flex';
        }
        initPuzzle();
    });

})();
