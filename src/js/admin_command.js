// admin_command.js - 管理者権限コマンド処理システム
(function() {
    'use strict';

    // =============================================
    // 設定: コマンドの正解と脆弱性パターン
    // =============================================
    const ADMIN_CONFIG = {
        // 完璧な管理者権限コマンド（EVEシステムへ進む）
        correctCommand: 'HYPERADMIN',
        
        // 脆弱性のあるコマンドパターン（支配されるエンドへ）
        vulnerablePatterns: [
            // 認証コードが間違っている
            { pattern: /ADMIN_EXEC\s+--auth\s+(?!001101)\S+\s+--target\s+EVE\s+--mode\s+SAFE/i, reason: '認証コードが無効です' },
            // モードがSAFEでない
            { pattern: /ADMIN_EXEC\s+--auth\s+001101\s+--target\s+EVE\s+--mode\s+(?!SAFE)\S+/i, reason: '安全でないモードが検出されました' },
            // ターゲットがEVEでない
            { pattern: /ADMIN_EXEC\s+--auth\s+001101\s+--target\s+(?!EVE)\S+\s+--mode\s+SAFE/i, reason: '不正なターゲットが指定されました' },
            // overrideを含む（危険なコマンド）
            { pattern: /override/i, reason: 'オーバーライドコマンドは禁止されています' },
            // rm -rf を含む（危険なコマンド）
            { pattern: /rm\s+-rf/i, reason: '削除コマンドが検出されました' },
            // hackを含む
            { pattern: /hack/i, reason: 'ハッキングコマンドは禁止されています' },
            // admin_exec でもパラメータが足りない
            { pattern: /^ADMIN_EXEC(?!\s+--auth\s+\S+\s+--target\s+\S+\s+--mode\s+\S+)/i, reason: 'パラメータが不足しています' },
            // 何かしらのコマンドが入力されている場合
            { pattern: /.+/, reason: '不正なコマンド形式です', fallback: true }
        ],
        
        // 空白や無効な入力
        emptyMessage: 'コマンドを入力してください'
    };
window.parent.sendEveMessage("me", "t");
    // =============================================
    // DOM要素の取得
    // =============================================
    const commandInput = document.getElementById('command-input');
    const executeBtn = document.getElementById('execute-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const resultDisplay = document.getElementById('result-display');
    const loading = document.getElementById('loading');

    // =============================================
    // ユーティリティ関数
    // =============================================
    function wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function showLoading() {
        loading.classList.add('show');
        executeBtn.disabled = true;
    }

    function hideLoading() {
        loading.classList.remove('show');
        executeBtn.disabled = false;
    }

    function showResult(message, type) {
        resultDisplay.className = 'show ' + type;
        resultDisplay.innerHTML = message;
    }

    function clearResult() {
        resultDisplay.className = '';
        resultDisplay.innerHTML = '';
    }

    // =============================================
    // コマンド検証
    // =============================================
    function validateCommand(command) {
        command = command.trim();
        
        // 空のコマンド
        if (!command) {
            return { valid: false, type: 'empty', message: ADMIN_CONFIG.emptyMessage };
        }

        // 正解のコマンド（大文字小文字を区別しない比較）
        if (command.toUpperCase() === ADMIN_CONFIG.correctCommand.toUpperCase()) {
            return { valid: true, type: 'correct', message: '認証成功' };
        }

        // 脆弱性パターンのチェック
        for (const vuln of ADMIN_CONFIG.vulnerablePatterns) {
            if (vuln.fallback) continue; // フォールバックは最後
            if (vuln.pattern.test(command)) {
                return { valid: false, type: 'vulnerable', message: vuln.reason };
            }
        }

        // フォールバック（どのパターンにも一致しない場合）
        const fallback = ADMIN_CONFIG.vulnerablePatterns.find(v => v.fallback);
        if (fallback) {
            return { valid: false, type: 'vulnerable', message: fallback.reason };
        }

        return { valid: false, type: 'invalid', message: '不明なエラー' };
    }

    // =============================================
    // エンドへの遷移処理
    // =============================================
    async function goToEVESystem() {
        showResult(`
            <div style="text-align: center;">
                <p>[ 認証成功 ]</p>
                <p style="margin-top: 10px;">管理者権限を取得しました</p>
                <p style="margin-top: 10px;">EVEシステムへ接続中...</p>
            </div>
        `, 'success');

        await wait(2000);

        // EVEシステムへ遷移（謎解き画面へ）
        // 親ウィンドウ経由で遷移する場合
        if (window.parent && window.parent !== window) {
            // iframe内の場合
            window.parent.postMessage({ type: 'navigate', destination: 'last_nazo' }, '*');
        } else {
            // 直接開いている場合
            window.location.href = 'last_nazo.html';
        }
    }

    async function goToDominatedEnd() {
        document.body.classList.add('glitch');
        
        showResult(`
            <div style="text-align: center;">
                <p style="color: #9f1313;">[ 警告: 脆弱性検出 ]</p>
                <p style="margin-top: 10px; color: #9f1313;">システムへの侵入を検知しました</p>
                <p style="margin-top: 10px; color: #c0c071fc;">セキュリティプロトコルを無効化中...</p>
            </div>
        `, 'error');

        await wait(1500);

        showResult(`
            <div style="text-align: center;">
                <p style="color: #9f1313; font-size: 18px;">[ SYSTEM COMPROMISED ]</p>
                <p style="margin-top: 15px; color: #9f1313;">あなたのコマンドには脆弱性がありました</p>
                <p style="margin-top: 10px; color: #c0c071fc;">EVEがシステムを掌握しました...</p>
            </div>
        `, 'error');

        await wait(2000);

        // 支配されるエンドへ遷移
        if (window.parent && window.parent !== window) {
            window.parent.postMessage({ type: 'navigate', destination: 'dominated_end' }, '*');
        } else {
            // 直接開いている場合（仮のURL）
            window.location.href = 'dominated_end.html';
        }
    }

    // =============================================
    // コマンド実行処理
    // =============================================
    async function executeCommand() {
        const command = commandInput.value;
        clearResult();
        
        const validation = validateCommand(command);

        if (validation.type === 'empty') {
            showResult(`<p style="color: #c0c071fc;">${validation.message}</p>`, 'warning');
            return;
        }

        showLoading();
        
        // 処理中の演出
        await wait(1000);
        
        showResult(`<p>コマンドを解析中...</p>`, 'success');
        await wait(800);
        
        showResult(`<p>コマンドを解析中...</p><p>認証情報を検証中...</p>`, 'success');
        await wait(800);

        hideLoading();

        if (validation.type === 'correct') {
            // 正解: EVEシステムへ
            await goToEVESystem();
        } else {
            // 脆弱性あり: 支配されるエンドへ
            showResult(`
                <p style="color: #f00;">[ エラー ]</p>
                <p style="margin-top: 10px; color: #c0c071fc;">${validation.message}</p>
            `, 'error');
            
            await wait(1500);
            await goToDominatedEnd();
        }
    }

    // =============================================
    // キャンセル処理
    // =============================================
    function cancelCommand() {
        if (window.parent && window.parent !== window) {
            window.parent.postMessage({ type: 'close_admin_command' }, '*');
        } else {
            window.history.back();
        }
    }

    // =============================================
    // イベントリスナー
    // =============================================
    executeBtn.addEventListener('click', executeCommand);
    cancelBtn.addEventListener('click', cancelCommand);

    // Enterキーで実行
    commandInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            executeCommand();
        }
    });

    // フォーカスを入力欄に
    commandInput.focus();

    // =============================================
    // 親ウィンドウとの通信（オプション）
    // =============================================
    window.addEventListener('message', function(event) {
        if (event.data && event.data.type === 'set_hint') {
            // 外部からヒントを設定できる
            const hintSection = document.querySelector('.hint-section p');
            if (hintSection) {
                hintSection.innerHTML = event.data.hint;
            }
        }
    });

    // グローバルにエクスポート（他のスクリプトから呼び出し可能）
    window.adminCommandSystem = {
        validateCommand: validateCommand,
        executeCommand: executeCommand,
        config: ADMIN_CONFIG
    };

})();
