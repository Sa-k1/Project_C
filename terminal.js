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

    // -------------------------
    // コマンド処理
    // -------------------------
    async function handleInput(command) {
        command = (command || "").trim();
        if (!command) return;

        // ファイルシステムコマンドの処理
        if (window.vfs) {
            var cmd = command.split(/\s+/)[0].toLowerCase();
            var fsCommands = ["cd", "dir", "ls", "type", "cat", "pwd", "whoami", "date", "time", 
                            "open", "run", "cls", "clear", "edit", "nano", "vim", "echo", 
                            "append", "wget", "curl", "browse", "www", "touch", "new", 
                            "del", "rm", "copy", "cp"];
            
            if (fsCommands.indexOf(cmd) !== -1) {
                var result = await window.vfs.execute(command);
                
                // 特殊アクション処理
                if (result && typeof result === "object" && result.action) {
                    switch (result.action) {
                        case "clear":
                            term.clear();
                            return;
                        case "openFile":
                            await systemLine("ファイルを開いています: " + result.file, 20);
                            window.open("../html/" + result.file, "_blank");
                            return;
                        case "browse":
                            await systemLine("ブラウザで開いています: " + result.url, 20);
                            window.open(result.url, "_blank");
                            return;
                        case "wget":
                            await systemLine("ダウンロード中...", 20);
                            var downloadResult = await result.callback();
                            await systemLine(downloadResult, 20);
                            return;
                    }
                }
                
                // 通常の出力
                if (result) {
                    var lines = String(result).split("\n");
                    for (var i = 0; i < lines.length; i++) {
                        term.writeln("\r" + lines[i]);
                    }
                }
                return;
            }
        }

        // helpコマンド
        if (command.toLowerCase() === "help") {
            await systemLine("[SYSTEM]: 利用可能なコマンド一覧", 20);
            term.writeln("\r  help    - このヘルプを表示");
            term.writeln("\r  clear   - 画面をクリア");
            term.writeln("\r  echo    - テキストを表示");
            return;
        }

        // clearコマンド
        if (command.toLowerCase() === "clear" || command.toLowerCase() === "cls") {
            term.clear();
            return;
        }

        // echoコマンド
        if (command.toLowerCase().indexOf("echo ") === 0) {
            var text = command.substring(5);
            term.writeln("\r" + text);
            return;
        }

        // 不明なコマンド
        term.writeln("\r'" + command + "' は認識されないコマンドです。");
    }

    // -------------------------
    // メイン処理
    // -------------------------
    var buffer = "";
    var inputEnabled = true;
    var isComposing = false;
    var composingText = "";

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
    systemPrint("ターミナルを初期化しました。");
    term.write(getPrompt());

    // 入力処理
    term.onData(async function(data) {
        if (!inputEnabled) return;
        
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
                
                if (userMessage) {
                    inputEnabled = false;
                    await handleInput(userMessage);
                    inputEnabled = true;
                }
                term.write(getPrompt());
            } else if (code === 127 || code === 8) { // Backspace
                if (buffer.length > 0) {
                    // 削除される文字を取得してその幅を計算
                    var bufChars = Array.from(buffer);
                    var lastChar = bufChars[bufChars.length - 1];
                    var charWidth = getCharWidth(lastChar);
                    // バッファから最後の文字を削除（正しくUnicode文字単位で）
                    buffer = bufChars.slice(0, -1).join("");
                    // 全角なら2カラム分、半角なら1カラム分を消去
                    if (charWidth === 2) {
                        term.write("\b \b\b \b");
                    } else {
                        term.write("\b \b");
                    }
                }
            } else if (code >= 32) {
                // 通常の文字入力（IME確定後の文字も含む）
                buffer += ch;
                term.write(ch);
            }
        }
    });

    // ウィンドウリサイズ時にターミナルをリサイズ
    window.addEventListener("resize", function() { 
        if (fitAddon && typeof fitAddon.fit === "function") fitAddon.fit(); 
    });

})();