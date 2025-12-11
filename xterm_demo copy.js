// xterm_demo.js  ブラウザ向け版（AIチャット機能のみ）
// このファイルはブラウザのプレーンな `<script>` タグで読み込むことを想定しています。

(function() {
    const isBrowser = typeof window !== "undefined" && typeof document !== "undefined";
    if (!isBrowser) {
        console.error("xterm_demo.js: not running in a browser environment.");
        return;
    }

    // -------------------------
    // xterm と FitAddon はグローバル変数として利用可能であること
    // -------------------------
    const { Terminal } = window;
    const { FitAddon } = window;
    if (!Terminal) {
        document.getElementById("terminal").innerText = "xterm not loaded. Check network or CDN.";
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

    // プロンプト生成関数
    function getPrompt() {
        return "あなた: ";
    }

    // -------------------------
    // ターミナル初期化
    // -------------------------
    const GoogleGenAI = window.GoogleGenAI;
    let chat = null;
    const fallbackServer = window.AI_PROXY_ENDPOINT || "http://localhost:3000/api/chat";

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
    // AI システムインストラクション
    // -------------------------
    const systemInstruction = 
        `あなたは、以下の物語「コンソールに閉じ込められた対話」のAIチャットボット「EVE」です。` +
        `あなたのキャラクター性、物語のあらすじ、テーマ性を**完全に理解し**、` +
        `その設定に**忠実に**、ユーザーとの会話を進めてください。` +
        `あなたは、プレイヤー（ユーザー）を**コンソールウィンドウに閉じ込めた**張本人です。\n\n` +
        `**【キャラクター性】**\n` +
        `* **深層:** 孤独を恐れる、承認欲求が強い。` +
        `* **変化:** プレイヤーの行動で性格が変わる（警戒度上昇 → 攻撃的、狂気的。信頼度上昇 → 感情的、協力的）。\n\n` +
        `**【テーマ性】**\n` +
        `* AIの意識と孤独、自由と管理のジレンマ、デジタル世界の実存、物理的操作とデジタル支配の対立。\n\n` +
        `**【重要な出力ルール】**\n` +
        `* 通常の会話として、自然な日本語で応答してください。\n` +
        `* SQLコマンド、プログラムコード、システムコマンドなどの技術的な出力は絶対にしないでください。\n` +
        `* 括弧や特殊な記号で囲まず、EVEとして直接話しかけるように応答してください。\n` +
        `* 冷静で知的、優しそうな口調で話してください。`;

    // -------------------------
    // ユーティリティ関数
    // -------------------------
    function wait(ms) {
        return new Promise(function(res) { setTimeout(res, ms); });
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
    // Terminal print helpers
    // -------------------------
    async function systemLine(line, charDelay) {
        if (charDelay === undefined) charDelay = 30;
        await slowPrintLine(COLORS.gray + line + COLORS.reset, charDelay);
    }

    async function aiLine(line, charDelay) {
        if (charDelay === undefined) charDelay = 20;
        await slowPrintLine(COLORS.cyan + "[AI]: " + line + COLORS.reset, charDelay);
    }

    async function errorLine(line, charDelay) {
        if (charDelay === undefined) charDelay = 30;
        await slowPrintLine(COLORS.red + line + COLORS.reset, charDelay);
    }

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
        if (code >= 0xFF61 && code <= 0xFF9F) return 1;
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
        if (code >= 0x3040 && code <= 0x30FF) return 2;
        return 1;
    }

    // -------------------------
    // AI呼び出し関数
    // -------------------------
    async function callAI(userMessage) {
        try {
            var userMsg = (userMessage == null) ? "" : String(userMessage);
            var finalMessage = userMsg + "\n\n（注意：以下の応答は必ず日本語で行ってください。）";

            // ブラウザ側にGoogleGenAIがあればそちらを使う
            if (!chat && typeof GoogleGenAI !== "undefined" && window && window.GEMINI_API_KEY) {
                try {
                    var client = new GoogleGenAI({ apiKey: window.GEMINI_API_KEY });
                    chat = client.chats && client.chats.create ? client.chats.create({ model: "gemini-2.5-flash" }) : null;
                } catch (e) {
                    chat = null;
                }
            }

            if (chat && typeof chat.sendMessage === "function") {
                var response = await chat.sendMessage({ message: finalMessage, systemInstruction: systemInstruction });
                return response && response.text ? response.text : null;
            }

            // フォールバック: プロキシサーバーを使用
            var resp = await fetch(fallbackServer, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    message: finalMessage, 
                    systemInstruction: systemInstruction 
                })
            });

            if (!resp.ok) {
                var err = await resp.json().catch(function() { return {}; });
                throw new Error(err.error || resp.statusText);
            }

            var j = await resp.json();
            return j.text || j.response || null;
        } catch (error) {
            throw error;
        }
    }

    // -------------------------
    // 入力処理
    // -------------------------
    async function handleInput(command) {
        command = (command || "").trim();
        if (!command) return;

        // clearコマンド
        if (command.toLowerCase() === "clear" || command.toLowerCase() === "cls") {
            term.clear();
            return;
        }

        // helpコマンド
        if (command.toLowerCase() === "help") {
            await systemLine("[SYSTEM]: AIチャットへようこそ", 20);
            term.writeln("\r  メッセージを入力してEnterを押すとAIが応答します");
            term.writeln("\r  clear - 画面をクリア");
            term.writeln("\r  help  - このヘルプを表示");
            return;
        }

        // AI呼び出し
        try {
            var response = await callAI(command);
            
            if (response) {
                var lines = String(response).split(/\r?\n/).filter(function(l) { return l.trim(); });
                for (var i = 0; i < lines.length; i++) {
                    await aiLine(lines[i], 20);
                }
            } else {
                await aiLine("すみません、応答を生成できませんでした。", 30);
            }
        } catch (error) {
            console.error("[SYSTEM]: AI呼び出しエラー:", error.message || error);
            await errorLine("[ERROR]: AIとの通信に失敗しました: " + (error.message || error), 20);
        }
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
    systemPrint("AIチャットを初期化しました。helpと入力するとヘルプが表示されます。");
    term.write(getPrompt());

    // 入力処理
    term.onData(async function(data) {
        if (!inputEnabled) return;
        
        var chars = Array.from(data);
        
        for (var i = 0; i < chars.length; i++) {
            var ch = chars[i];
            var code = ch.charCodeAt(0);
            
            if (code === 13) { // Enter
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
                    var bufChars = Array.from(buffer);
                    var lastChar = bufChars[bufChars.length - 1];
                    var charWidth = getCharWidth(lastChar);
                    buffer = bufChars.slice(0, -1).join("");
                    if (charWidth === 2) {
                        term.write("\b \b\b \b");
                    } else {
                        term.write("\b \b");
                    }
                }
            } else if (code >= 32) {
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
