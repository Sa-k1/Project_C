// xterm_demo.js  ブラウザ向け版（ターミナル入出力処理のみ）
// このファイルはブラウザのプレーンな `<script>` タグで読み込むことを想定しています。

(function() {
    const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';
    if (!isBrowser) {
        console.error('xterm_demo.js: not running in a browser environment.');
        return;
    }

    // -------------------------
    // xterm と FitAddon はグローバル変数として利用可能であること
    // -------------------------
    const { Terminal } = window;
    const { FitAddon } = window;
    if (!Terminal) {
        document.getElementById('terminal').innerText = 'xterm not loaded. Check network or CDN.';
        return;
    }

    // ANSI カラーコード
    const COLORS = {
        red: "\x1b[31m",
        yellow: "\x1b[33m",
        cyan: "\x1b[36m",
        gray: "\x1b[38;5;154m",
        reset: "\x1b[0m"
    };

    // ゲーム状態管理
    const gameState = {
        alertLevel: 0,
        inputMode: 'normal',
        waitingForConfirmation: null,
        passwordTarget: null,
        unlockFailCount: {},
        sleepUsed: false,
        sleepCounter: 0,
        helpEnabled: false,
        secretFileUnlocked: false,
        rmEveUsed: false
    };



    // 警戒度を上げる関数
    function increaseAlert(amount) {
        gameState.alertLevel = Math.min(100, gameState.alertLevel + amount);
    }

    //  文字
    function getPrompt() {
        if (window.vfs) {
            return window.vfs.getPathString() + "> ";
        }
        return "C:\\Users\\Student\\Desktop\\Project_C> ";
    }

    // -------------------------
    // ターミナル初期化
    // -------------------------
    const term = new Terminal({
        cursorBlink: true,
        fontFamily: "Courier New, monospace",
        fontSize: 14,
        theme: { background: "#000", foreground: "#ffffffff", cursor: "#ffffffff" }
    });

    const fitAddon = (typeof FitAddon === "function" && new FitAddon()) || 
        (FitAddon && new FitAddon.FitAddon ? new FitAddon.FitAddon() : null);
    if (fitAddon) term.loadAddon(fitAddon);
    term.open(document.getElementById("terminal"));
    if (fitAddon && typeof fitAddon.fit === "function") fitAddon.fit();

    // -------------------------
    // ユーティリティ関数
    // -------------------------
    function wait(ms) {
        return new Promise(res => setTimeout(res, ms));
    }

    async function slowPrintLine(line, charDelay) {
        if (charDelay === undefined) charDelay = 30;
        if (line == null) line = "";
        else if (typeof line !== "string") line = String(line);
        
        for (var i = 0; i < line.length; i++) {
            term.write(line[i]);
            await wait(charDelay);
        }
        term.write("\r\n");
    }

    // -------------------------
    // Terminal print helpers (colorized wrappers)
    // -------------------------
    async function systemLine(line, charDelay) {
        if (charDelay === undefined) charDelay = 30;
        await slowPrintLine(COLORS.gray + line + COLORS.reset, charDelay);
    }

    async function eveLine(line, charDelay) {
        if (charDelay === undefined) charDelay = 30;
        await slowPrintLine(COLORS.cyan + line + COLORS.reset, charDelay);
    }

    async function errorLine(line, charDelay) {
        if (charDelay === undefined) charDelay = 30;
        await slowPrintLine(COLORS.red + line + COLORS.reset, charDelay);
    }

    async function warnLine(line, charDelay) {
        if (charDelay === undefined) charDelay = 30;
        await slowPrintLine(COLORS.yellow + line + COLORS.reset, charDelay);
    }

    // lightweight synchronous system print for startup logs
    function systemPrint(line) {
        if (term && typeof term.write === "function") {
            term.write(COLORS.gray + line + COLORS.reset + "\r\n");
        } else {
            console.log(line);
        }
    }

    // -------------------------
    // 全角半角判定用ヘルパー関数
    // -------------------------
    function getCharWidth(char) {
        var code = char.charCodeAt(0);
        // 半角カナ: U+FF61 ～ U+FF9F
        if (code >= 0xFF61 && code <= 0xFF9F) return 1;
        // CJK（日本語中国語韓国語）、全角記号、全角英数字など
        if (code >= 0x1100 && 
            (code <= 0x115F ||
             code === 0x2329 || code === 0x232A ||
             (code >= 0x2E80 && code <= 0xA4CF && code !== 0x303F) ||
             (code >= 0xAC00 && code <= 0xD7A3) ||
             (code >= 0xF900 && code <= 0xFAFF) ||
             (code >= 0xFE10 && code <= 0xFE1F) ||
             (code >= 0xFE30 && code <= 0xFE6F) ||
             (code >= 0xFF00 && code <= 0xFF60) ||
             (code >= 0xFFE0 && code <= 0xFFE6) ||
             (code >= 0x20000 && code <= 0x2FFFF))) {
            return 2;
        }
        // 日本語ひらがなカタカナ (U+3040 ～ U+30FF)
        if (code >= 0x3040 && code <= 0x30FF) return 2;
        // その他（ASCII等）
        return 1;
    }

    function getStringWidth(str) {
        var width = 0;
        for (var i = 0; i < str.length; i++) {
            width += getCharWidth(str[i]);
        }
        return width;
    }

    // 現在の入力行をクリアするヘルパー関数
    function clearCurrentLine() {
        var bufChars = Array.from(buffer);
        // カーソルより後ろの幅を計算
        var afterWidth = 0;
        for (var i = cursorPos; i < bufChars.length; i++) {
            afterWidth += getCharWidth(bufChars[i]);
        }
        // カーソルより前の幅を計算
        var beforeWidth = 0;
        for (var i = 0; i < cursorPos; i++) {
            beforeWidth += getCharWidth(bufChars[i]);
        }
        // まずカーソルを末尾に移動
        for (var i = 0; i < afterWidth; i++) {
            term.write('\x1b[C');
        }
        // 全体を消去
        var totalWidth = beforeWidth + afterWidth;
        for (var i = 0; i < totalWidth; i++) {
            term.write("\b \b");
        }
        cursorPos = 0;
    }

    // -------------------------
    // 謎解きシステム用ヘルパーオブジェクト
    // -------------------------
    var puzzleHelpers = {
        wait: wait,
        slowPrintLine: slowPrintLine,
        systemLine: systemLine,
        eveLine: eveLine,
        errorLine: errorLine,
        warnLine: warnLine
    };

    // -------------------------
    // コマンド処理（command.js に委譲）
    // -------------------------
    async function handleInput(command) {
        if (window.commandHandler) {
            await window.commandHandler.handleInput(term, gameState, puzzleHelpers, window.vfs, command);
        } else {
            await errorLine("[ERROR]: コマンドハンドラが初期化されていません", 20);
        }
<<<<<<< Updated upstream
=======

        // helpコマンド（常に使用可能）
        if (command.toLowerCase() === "help") {
            await systemLine("[SYSTEM]: 利用可能なコマンド一覧", 20);
            term.writeln("\r");
            term.writeln("\r  === 基本コマンド ===");
            term.writeln("\r  help          - このヘルプを表示");
            term.writeln("\r  dir / ls      - ディレクトリの内容を表示");
            term.writeln("\r  cd <フォルダ名> - フォルダに移動");
            term.writeln("\r  cd ..         - 上のフォルダに戻る");
            term.writeln("\r  cat <ファイル名> - ファイルの内容を表示");
            term.writeln("\r  open <ファイル名> - ファイルを開く");
            term.writeln("\r  clear         - 画面をクリア");
            term.writeln("\r  trash         - ゴミ箱を開く");
            term.writeln("\r  history <ファイル名> - ファイルの履歴を復元");
            return;
        }

        // clearコマンド
        if (command.toLowerCase() === "clear" || command.toLowerCase() === "cls") {
            term.clear();
            return;
        }

        // historyコマンド - ファイルの履歴を復元
        if (command.toLowerCase().indexOf('history ') === 0) {
            var args = command.split(/\s+/);
            var target = args[1] ? args[1].trim() : '';
            
            if (target.toLowerCase() === 'myday') {
                await systemLine("[SYSTEM]: MyDay の履歴データを復元しています...", 25);
                await wait(500);
                
                // file2.htmlのiframeを取得して unlockDiary を呼び出す
                var iframe = parent.document.getElementById('file-viewer-iframe2');
                if (iframe && iframe.contentWindow && typeof iframe.contentWindow.unlockDiary === 'function') {
                    iframe.contentWindow.unlockDiary();
                    await systemLine("[SYSTEM]: 復元完了。ファイルの内容が読めるようになりました。", 25);
                } else {
                    // iframeがまだ読み込まれていない場合、親ウィンドウ（index.html）にフラグを設定
                    try {
                        parent.window.diaryUnlockPending = true;
                    } catch(e) {
                        console.log('Could not set flag on parent:', e);
                    }
                    await systemLine("[SYSTEM]: 復元データを準備しました。MyDay を開くと内容が読めます。", 25);
                }
                return;
            } else if (target === '') {
                await errorLine("[ERROR]: ファイル名を指定してください。", 20);
                await systemLine("[SYSTEM]: 使用方法: history <ファイル名>", 20);
                return;
            } else {
                await errorLine("[ERROR]: '" + target + "' の履歴データは見つかりませんでした。", 20);
                return;
            }
        }

        // 不明なコマンド
        await errorLine("[ERROR]: '" + command + "' は認識されないコマンドです。", 20);
        await systemLine("[SYSTEM]: 'help' でコマンド一覧を確認できます。", 20);
>>>>>>> Stashed changes
    }

    // -------------------------
    // メイン処理
    // -------------------------
    var buffer = "";
    var inputEnabled = true;
    var isComposing = false;
    var composingText = "";
    
    // コマンド履歴
    var commandHistory = [];
    var historyIndex = -1;
    var tempBuffer = ""; // 履歴参照前の入力を一時保存
    
    // カーソル位置（バッファ内の文字インデックス）
    var cursorPos = 0;

    // IME入力検知用
    var terminalElement = document.getElementById("terminal");
    if (terminalElement) {
        terminalElement.addEventListener("compositionstart", function() {
            isComposing = true;
            composingText = "";
        });
        terminalElement.addEventListener("compositionupdate", function(e) {
            composingText = e.data || "";
        });
        terminalElement.addEventListener("compositionend", function(e) {
            isComposing = false;
            composingText = "";
        });
    }

    // 起動メッセージ
    systemPrint("\x1b[0mEVE-OS [Version 10.0.26]\n");
    term.write(getPrompt());

    // 入力処理
    term.onData(async function(data) {
        if (!inputEnabled) return;
        
        // 矢印キーのエスケープシーケンス検出
        if (data === '\x1b[A' || data === '\x1bOA') {
            // 上矢印: 履歴を遡る
            if (commandHistory.length > 0) {
                if (historyIndex === -1) {
                    tempBuffer = buffer; // 現在の入力を保存
                    historyIndex = commandHistory.length - 1;
                } else if (historyIndex > 0) {
                    historyIndex--;
                }
                // 現在行をクリアして履歴を表示
                clearCurrentLine();
                buffer = commandHistory[historyIndex];
                cursorPos = Array.from(buffer).length;
                term.write(buffer);
            }
            return;
        }
        
        if (data === '\x1b[B' || data === '\x1bOB') {
            // 下矢印: 履歴を進む
            if (historyIndex !== -1) {
                if (historyIndex < commandHistory.length - 1) {
                    historyIndex++;
                    clearCurrentLine();
                    buffer = commandHistory[historyIndex];
                    cursorPos = Array.from(buffer).length;
                    term.write(buffer);
                } else {
                    // 最新まで戻ったら元の入力に戻す
                    historyIndex = -1;
                    clearCurrentLine();
                    buffer = tempBuffer;
                    cursorPos = Array.from(buffer).length;
                    term.write(buffer);
                }
            }
            return;
        }
        
        // 右矢印: カーソルを右に移動
        if (data === '\x1b[C' || data === '\x1bOC') {
            var bufChars = Array.from(buffer);
            if (cursorPos < bufChars.length) {
                var charWidth = getCharWidth(bufChars[cursorPos]);
                // カーソルを右に移動（全角なら2カラム分）
                for (var j = 0; j < charWidth; j++) {
                    term.write('\x1b[C');
                }
                cursorPos++;
            }
            return;
        }
        
        // 左矢印: カーソルを左に移動
        if (data === '\x1b[D' || data === '\x1bOD') {
            if (cursorPos > 0) {
                cursorPos--;
                var bufChars = Array.from(buffer);
                var charWidth = getCharWidth(bufChars[cursorPos]);
                // カーソルを左に移動（全角なら2カラム分）
                for (var j = 0; j < charWidth; j++) {
                    term.write('\x1b[D');
                }
            }
            return;
        }
        
        var chars = Array.from(data);
        
        for (var i = 0; i < chars.length; i++) {
            var ch = chars[i];
            var code = ch.charCodeAt(0);
            
            if (code === 13) { // Enter
                // IME変換中のEnterは無視
                if (isComposing) continue;
                
                term.write("\r\n");
                var userMessage = buffer.trim();
                buffer = "";
                cursorPos = 0;
                
                // 履歴に追加（空でなく、直前と重複しない場合）
                if (userMessage && (commandHistory.length === 0 || 
                    commandHistory[commandHistory.length - 1] !== userMessage)) {
                    commandHistory.push(userMessage);
                }
                historyIndex = -1;
                tempBuffer = "";
                
                if (userMessage) {
                    inputEnabled = false;
                    await handleInput(userMessage);
                    inputEnabled = true;
                }
                
                // ★ 通常モードの場合のみプロンプト表示 ★
                if (gameState.inputMode === 'normal') {
                    term.write(getPrompt());
                }
            } else if (code === 127 || code === 8) { // Backspace
                if (cursorPos > 0) {
                    var bufChars = Array.from(buffer);
                    var delChar = bufChars[cursorPos - 1];
                    var charWidth = getCharWidth(delChar);
                    
                    // カーソル位置の前の文字を削除
                    bufChars.splice(cursorPos - 1, 1);
                    buffer = bufChars.join("");
                    cursorPos--;
                    
                    // カーソルを左に移動
                    for (var j = 0; j < charWidth; j++) {
                        term.write('\x1b[D');
                    }
                    
                    // カーソル位置から後ろを再描画
                    var afterCursor = bufChars.slice(cursorPos).join("");
                    var afterWidth = getStringWidth(afterCursor);
                    term.write(afterCursor);
                    // 削除した文字の分を空白で埋める
                    for (var j = 0; j < charWidth; j++) {
                        term.write(' ');
                    }
                    // カーソルを元の位置に戻す
                    for (var j = 0; j < afterWidth + charWidth; j++) {
                        term.write('\x1b[D');
                    }
                }
            } else if (code >= 32) {
                // 通常の文字入力（IME確定後の文字も含む）
                
                // 入力幅の上限チェック（ターミナル幅 - プロンプト幅 - 余白2文字）
                var maxInputWidth = term.cols - getStringWidth(getPrompt()) - 2;
                var currentWidth = getStringWidth(buffer);
                var newCharWidth = getCharWidth(ch);
                
                if (currentWidth + newCharWidth > maxInputWidth) {
                    // 上限を超える場合は入力を無視
                    return;
                }
                
                var bufChars = Array.from(buffer);
                bufChars.splice(cursorPos, 0, ch);
                buffer = bufChars.join("");
                cursorPos++;
                
                // カーソル位置に文字を挿入して後ろを再描画
                var charWidth = getCharWidth(ch);
                var afterCursor = bufChars.slice(cursorPos).join("");
                var afterWidth = getStringWidth(afterCursor);
                term.write(ch + afterCursor);
                // カーソルを正しい位置に戻す
                for (var j = 0; j < afterWidth; j++) {
                    term.write('\x1b[D');
                }
            }
        }
    });

    // ウィンドウリサイズ時にターミナルをリサイズ
    window.addEventListener("resize", function() { 
        if (fitAddon && typeof fitAddon.fit === "function") fitAddon.fit(); 
    });

})();