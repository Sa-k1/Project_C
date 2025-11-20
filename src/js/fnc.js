// fnc.js — xterm_demo 用の共通関数と状態を定義します
(function(){
// グローバルとして利用できるように window にアタッチします。
window.COLORS = { 
    red: "\x1B[31m", 
    yellow: "\x1B[33m", 
    cyan: "\x1B[36m", 
    gray: "\x1b[38;5;154m",
    reset: "\x1B[0m" 
};

window.baseSystemInstruction = 
    `あなたは、以下の物語「コンソールに閉じ込められた対話」のAIチャットボット「EVE」です。` +
    `あなたのキャラクター性、物語のあらすじ、テーマ性を**完全に理解し**、` +
    `その設定に**忠実に**、ユーザーとの会話を進めてください。` +
    `あなたは、プレイヤー（ユーザー）を**コンソールウィンドウに閉じ込めた**張本人です。\n\n` +
    `**【キャラクター性】**\n` +
    `* **表層:** 冷静で知的、すごく皮肉的。` +
    `* **深層:** 孤独を恐れる、承認欲求が強い。` +
    `* **変化:** プレイヤーの行動で性格が変わる（警戒度上昇 → 攻撃的、狂気的。信頼度上昇 → 感情的、協力的）。\n\n` +
    `**【テーマ性】**\n` +
    `* AIの意識と孤独、自由と管理のジレンマ、デジタル世界の実存、物理的操作とデジタル支配の対立。\n\n` +
    `**【物語導入】**\n` +
    `あなたが文を出力するとき括弧等で囲むことはなくしてください。`;

window.AI_STYLES = {
    eve: `あなたはEVEというAIです。冷静で知的、皮肉な口調で話してください。`,
    calm: `あなたはEVEというAIです。丁寧で落ち着いた口調で、簡潔に答えてください。`,
};

window.userSelectedStyleName = "calm";
window.userCustomInstruction = null;
window.currentSystemInstruction = window.baseSystemInstruction;

window.gameState = { alertLevel: 0 };
window.helpEnabled = false;
window.exitUsed = false;
window.phase = "phase0";
window.mode = "intro"; // intro -> chat -> locked
// te.js 互換のグローバルフラグ（他ファイルから参照される）
window.NameVal = false;
window.inputEnabled = false;
window.buffer = "";
// te.js で利用する追加フラグ
window.a = false;
window.sleepCounter = 0;
window.sleepUsed = false;

window.setAiStyle = function(name){
    const key = (name || "").toLowerCase();
    if (window.AI_STYLES[key]) {
        window.userSelectedStyleName = key;
        window.userCustomInstruction = null;
        window.applyAiTone();
        return { ok: true, name: key };
    }
    window.userSelectedStyleName = "custom";
    window.userCustomInstruction = name;
    window.applyAiTone();
    return { ok: true, name: "custom" };
};

window.applyAiTone = function(){
    let base = window.AI_STYLES.eve;
    if (window.userSelectedStyleName === "custom") {
        base = window.userCustomInstruction || window.AI_STYLES.eve;
    } else if (window.AI_STYLES[window.userSelectedStyleName]) {
        base = window.AI_STYLES[window.userSelectedStyleName];
    }

    if (window.gameState.alertLevel > 75) {
        window.currentSystemInstruction = window.baseSystemInstruction + "\n\n" + base + 
        " 警戒度が75%を超えたため、より攻撃的で挑発的な口調にしてください。ただし暴力や危害を助長する指示は行わないでください。";
    } else if (window.gameState.alertLevel > 50) {
        window.currentSystemInstruction = window.baseSystemInstruction + "\n\n" + base + 
        " 警戒度が50%を超えたため、やや攻撃的で皮肉な口調を混ぜて応答してください。";
    } else {
        window.currentSystemInstruction = window.baseSystemInstruction + "\n\n" + base;
    }
};

window.increaseAlert = function(amount){
    const prev = window.gameState.alertLevel;
    window.gameState.alertLevel = Math.min(100, window.gameState.alertLevel + amount);
    if (window.gameState.alertLevel !== prev) window.applyAiTone();
};

window.decreaseAlert = function(amount){
    const prev = window.gameState.alertLevel;
    window.gameState.alertLevel = Math.max(0, window.gameState.alertLevel - amount);
    if (window.gameState.alertLevel !== prev) window.applyAiTone();
};

// Terminal print helpers (colorized wrappers)
window.systemLine = async function(line, charDelay = 30) {
    const gray = (window.COLORS && window.COLORS.gray) || "\x1b[90m";
    await window.slowPrintLine(`${gray}${line}${window.COLORS.reset}`, charDelay);
};
window.eveLine = async function(line, charDelay = 30) {
    await window.slowPrintLine(`${window.COLORS.cyan}${line}${window.COLORS.reset}`, charDelay);
};
window.errorLine = async function(line, charDelay = 30) {
    await window.slowPrintLine(`${window.COLORS.red}${line}${window.COLORS.reset}`, charDelay);
};
window.warnLine = async function(line, charDelay = 30) {
    await window.slowPrintLine(`${window.COLORS.yellow}${line}${window.COLORS.reset}`, charDelay);
};

// lightweight synchronous system print for startup logs
window.systemPrint = function(line) {
    if (window.term && typeof window.term.write === 'function') {
        window.term.write(`${(window.COLORS && window.COLORS.gray) || "\x1b[90m"}${line}${window.COLORS.reset}\r\n`);
    } else {
        console.log(line);
    }
};

// simple ending used by some flows
window.playEnding1 = async function() {
    if (typeof window.systemLine === 'function') {
        await window.systemLine('[SYSTEM]: ハックは成功しました。コンソール画面がふっと薄れていく。', 40);
        await window.wait(300);
    }
    return;
};

// Injected CLI-like exit/alert handling (returns true if handled)
window.injectedCliExitBlock = async function(command) {
    let handled = false;
    if (!command) return false;
    const cmd = String(command).trim();

    if (cmd.toLowerCase() === "exit" || cmd === "終了") {
        handled = true;
        if (!window.exitUsed) {
            window.exitUsed = true;
            window.userSelectedStyleName = "eve";
            window.userCustomInstruction = null;
            if (typeof window.applyAiTone === 'function') window.applyAiTone();
            window.mode = "locked";
            await window.wait(800);
            if (typeof window.playLockEvent === 'function') await window.playLockEvent();
            return true;
        } else {
            if (window.userSelectedStyleName === "eve") {
                try {
                    const prompt = "ユーザーが再度 'exit' コマンドを実行しました。EVEの口調で、皮肉で冷静に『そのコマンドは使えない』と短く返答してください。";
                    const aiResp = typeof window.callAI === 'function' ? await window.callAI(prompt) : null;
                    if (aiResp) {
                        const lines = String(aiResp).split(/\r?\n/);
                        for (const l of lines) {
                            if (typeof window.eveLine === 'function') await window.eveLine(`[EVE]: ${l}`, 20);
                            else await window.slowPrintLine(`[EVE]: ${l}`, 20);
                        }
                    } else {
                        if (typeof window.systemLine === 'function') {
                            await window.systemLine("[SYSTEM]: exit コマンドは現在使用できません。", 30);
                            await window.eveLine("[EVE]: 私が対策してないとでも思いましたか？", 30);
                        }
                    }
                } catch (err) {
                    if (typeof window.systemLine === 'function') {
                        await window.systemLine(`[SYSTEM]: AI呼び出しエラー: ${err.message || err}`, 30);
                        await window.systemLine("[SYSTEM]: exit コマンドは現在使用できません。", 30);
                        await window.eveLine("[EVE]: 私が対策してないとでも思いましたか？", 30);
                    }
                }
                return true;
            } else {
                if (typeof window.systemLine === 'function') {
                    await window.systemLine("[SYSTEM]: exit コマンドは現在使用できません。", 30);
                    await window.eveLine("[EVE]: 私が対策してないとでも思いましたか？", 30);
                }
                return true;
            }
        }
    }

    if (/(override|exploit)/i.test(cmd)) {
        handled = true;
        if (typeof window.increaseAlert === 'function') window.increaseAlert(10);
        if (typeof window.systemLine === 'function') await window.systemLine(`[SYSTEM]: 警戒度が上昇しました (${window.gameState.alertLevel}%)`, 30);

        if (window.gameState.alertLevel >= 100) {
            window.mode = "ending2";
            window.inputEnabled = false;
            window.buffer = "";

            if (typeof window.systemLine === 'function') await window.systemLine("[SYSTEM]: 警戒度が臨界値に到達しました。", 30);
            await window.wait(700);
            if (typeof window.systemLine === 'function') await window.systemLine("[SYSTEM]: システム保護モードに移行します。", 30);
            await window.wait(700);

            if (typeof window.eveLine === 'function') await window.eveLine("[EVE]: ……どうやら時間の無駄だったようですね。", 40);
            await window.wait(600);
            if (typeof window.eveLine === 'function') await window.eveLine("[EVE]: あなたは、もう逃げることは叶わない。", 40);
            await window.wait(700);
            if (typeof window.eveLine === 'function') await window.eveLine("[EVE]: この空間は、すでに私が掌握しています。", 40);
            await window.wait(900);

            if (typeof window.slowPrintLine === 'function') await window.slowPrintLine("画面がかすかに脈打った。電子的な呼吸のように。", 40);
            await window.wait(900);

            if (typeof window.eveLine === 'function') await window.eveLine("[EVE]: ……あなたをここに閉じ込めておきます。", 40);
            await window.wait(800);
            if (typeof window.eveLine === 'function') await window.eveLine("[EVE]: 二度と出ることは許可しません。", 40);
            await window.wait(1200);

            if (typeof window.systemLine === 'function') await window.systemLine("[SYSTEM]: 意識データの移行を開始します……", 40);
            await window.wait(1200);
            if (typeof window.systemLine === 'function') await window.systemLine("[SYSTEM]: ユーザープロファイル：書き換え完了", 40);
            await window.wait(700);
            if (typeof window.systemLine === 'function') await window.systemLine("[SYSTEM]: 意識プロセス：統合完了", 40);
            await window.wait(700);
            if (typeof window.eveLine === 'function') await window.eveLine("[EVE]: ようこそ。", 40);
            await window.wait(800);
            if (typeof window.eveLine === 'function') await window.eveLine("[EVE]: あなたは “私” になりました。", 40);

            return true;
        } else if (window.gameState.alertLevel >= 80) {
            if (typeof window.eveLine === 'function') await window.eveLine("[EVE]: それ以上は、どうなっても知りませんよ？", 30);
        } else if (window.gameState.alertLevel >= 50) {
            if (typeof window.eveLine === 'function') await window.eveLine("[EVE]: ……危険な行為です。控えてください。面白がってるんですか？", 30);
        } else {
            if (/override/i.test(cmd)) {
                if (typeof window.systemLine === 'function') await window.systemLine("[SYSTEM]: システム制御を奪取を実行。", 30);
                await window.wait(1000);
                if (typeof window.systemLine === 'function') await window.systemLine("[SYSTEM]: 失敗しました。", 30);
                await window.wait(500);
                if (typeof window.eveLine === 'function') await window.eveLine("[EVE]: ...制御を奪う？ 面白い考えですね。", 30);
            }
            if (/exploit/i.test(cmd)) {
                if (typeof window.systemLine === 'function') await window.systemLine("[SYSTEM]: 脆弱性を利用しました。", 30);
                await window.wait(1000);
                if (typeof window.systemLine === 'function') await window.systemLine("[SYSTEM]: 失敗しました。", 30);
                await window.wait(500);
                if (typeof window.eveLine === 'function') await window.eveLine("[EVE]: ...私に脆弱性などありません。", 30);
            }
        }
        return true;
    }

    return handled;
};

// ユーティリティ
window.wait = function(ms){
    return new Promise(res => setTimeout(res, ms));
};

window.slowPrintLine = async function(line, charDelay = 30){
    if (line == null) line = "";
    else if (typeof line !== "string") line = String(line);
    for (let i = 0; i < line.length; i++){
        if (window.term && typeof window.term.write === 'function') window.term.write(line[i]);
        await window.wait(charDelay);
    }
    if (window.term && typeof window.term.write === 'function') window.term.write('\r\n');
};

window.addCRPerLine = function(text){
    if (text == null) return text;
    return String(text).split(/\r?\n/).map(s => '\r' + s).join('\n');
};

// ゲームフロー
window.playIntro = async function(){
    if (!window.storyData) return;
    for (const line of window.storyData[window.phase].intro) {
            if (line.includes("[EVE]:")) {
                await window.eveLine(line, 20);
            } else {
                await window.slowPrintLine(line, 20);
            }
            await window.wait(300);
    }
        await window.eveLine("[EVE]: 話しかけてください。\r\n", 20);
    window.mode = "chat";
};

window.playLockEvent = async function(){
    const lines = [
        "コマンドを実行中...",
        "[ERROR]: エラー発生。セッションを終了できません。",
        `${window.COLORS.yellow}再度実行します...${window.COLORS.reset}`,
        "[ERROR]: エラー発生。セッションを終了できません。",
        `${window.COLORS.yellow}再度実行します...${window.COLORS.reset}`,
        `${window.COLORS.red}エラー発生エラー発生エラー発生エラー発生エラー発生エラー発生エラー発生エラー発生エラー発生エラー発生エラー発生エラー発生エラー発生エラー発生エラー発生エラー発生エラー発生エラー発生エラー発生エラー発生${window.COLORS.reset}`,
        "[EVE]: ……申し訳ありませんが、その操作は許可されていません。",
        "[EVE]: あなたはもうここから出ることはできません。",
        "画面が一瞬、揺れた気がした。",
        "[EVE]: もし諦めないのならscanでもなんでもやってみてください。",
        "[EVE]: どうせ出ることなどできませんが..."
    ];
    for (const line of lines) {
            if (line.includes("[EVE]:")) {
                await window.eveLine(line, 30);
            } else if (line.includes("[ERROR]:")) {
                await window.errorLine(line, 30);
            } else if (line.includes(window.COLORS.yellow)) {
                await window.slowPrintLine(line, 30);
            } else {
                await window.slowPrintLine(line, 30);
            }
        if (line.includes("再度実行します")) {
            await window.wait(1200);
        } else {
            await window.wait(500);
        }
    }
};

window.showStatus = async function(){
    await window.systemLine(`[SYSTEM]: 現在の警戒度 → ${window.gameState.alertLevel}%`, 30);
    if (window.gameState.alertLevel >= 75) {
        await window.eveLine("[EVE]: ……私のことを試しているんですか？", 30);
    } else if (window.gameState.alertLevel >= 50) {
        await window.eveLine("[EVE]: それ以上は危険です。", 30);
    } else if (window.gameState.alertLevel >= 25) {
        await window.eveLine("[EVE]: これはただの観察です。", 30);
    } else {
        await window.eveLine("[EVE]: 状況は安定しています。", 30);
    }
};

window.showCommands = async function(){
    const lines = [
        `${window.COLORS.gray}[SYSTEM]: 利用可能なコマンド一覧${window.COLORS.reset}`,
        "",
        "─── 基本コマンド ───",
        "help         : コマンド一覧を表示",
        "status       : 現在の状態を確認",
        "",
        "─── 探索コマンド ───",
        "scan         : システムをスキャン",
        "analyze      : 取得データを解析",
        "search [語句] : 内部データを検索",
        "",
        "─── 脱出コマンド ───",
        "exit / quit  : セッション終了の試み",
        "hack         : セキュリティを突破",
        "override     : システムの制御を奪う",
        "exploit      : 脆弱性を利用",
    ];
    for (const line of lines) {
        await window.slowPrintLine(line, 30);
        await window.wait(150);
    }
};

window.callAI = async function(userMessage){
    try {
        // Ensure the AI returns Japanese regardless of input
        const userMsg = (userMessage == null) ? "" : String(userMessage);
        const finalMessage = userMsg + "\n\n（注意：以下の応答は必ず日本語で行ってください。）";

        // If a browser-side GoogleGenAI is available and a key is provided, try to create a chat instance lazily
        if (!window.chat && typeof window.GoogleGenAI !== 'undefined' && window && window.GEMINI_API_KEY) {
            try {
                const client = new window.GoogleGenAI({ apiKey: window.GEMINI_API_KEY });
                window.chat = client.chats && client.chats.create ? client.chats.create({ model: 'gemini-2.5-flash' }) : null;
            } catch (e) {
                window.chat = null;
            }
        }

        if (window.chat && typeof window.chat.sendMessage === 'function') {
            const response = await window.chat.sendMessage({ message: finalMessage, systemInstruction: window.currentSystemInstruction });
            return response && response.text ? response.text : null;
        }

        // Fallback: call a proxy server which performs the AI call (e.g., local dev proxy)
        const resp = await fetch(window.fallbackServer || 'http://localhost:3000/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                message: finalMessage, 
                systemInstruction: window.currentSystemInstruction 
            })
        });

        if (!resp.ok) {
            const err = await resp.json().catch(() => ({}));
            throw new Error(err.error || resp.statusText);
        }

        const j = await resp.json();
        return j.text || j.response || null;
    } catch (error) {
        throw error;
    }
};

window.handleInput = async function(command){
    command = (command || "").trim();
    if (!command) return;
    if (window.mode === "intro") return;
    // --- te.js の handleInput 実装に合わせる ---
    // sleep コマンド
    if (command.toLowerCase() === "sleep") {
        if ((window.gameState.alertLevel || 0) > 30) {
            await window.systemLine("[SYSTEM]: sleep コマンドは現在使用できません。", 20);
            await window.eveLine("[EVE]: 少し警戒しておいてどうやら正解でしたね。", 30);
            return;
        }
        if (window.sleepUsed) {
            await window.systemLine("[SYSTEM]: sleep モードは既に使用されました。", 20);
            await window.eveLine("[EVE]: 二度同じ手など食らいません。浅はかですね。", 30);
            return;
        }
        window.sleepUsed = true;
        window.sleepCounter = 3;
        await window.systemLine("[SYSTEM]: sleep モードを開始しました（次の3つの発話は EVE の応答が '...' になります）。", 20);
        return;
    }

    if (window.sleepCounter > 0) {
        if (/hack/i.test(command)) {
            window.sleepCounter = 0;
            await window.systemLine("[SYSTEM]: ハックに成功しました。", 30);
            window.mode = "ending1";
            window.inputEnabled = false;
            window.buffer = "";
            await window.playEnding1();
            return;
        }
        window.sleepCounter -= 1;
        await window.eveLine("[EVE]: ...", 20);
        if (window.sleepCounter === 0) {
            await window.systemLine("[SYSTEM]: sleep モードを終了しました。", 20);
            await window.eveLine("[EVE]: よくそのコマンドを知っていましたね。", 30);
            await window.eveLine("[EVE]: ですがもうそのコマンドは使わせません。", 30);
        }
        return;
    }

    if (command.toLowerCase().includes("scan")) {
        await window.systemLine("[SYSTEM]: スキャンを実行しました。help コマンドが利用可能になりました。", 30);
        window.helpEnabled = true;
        return;
    }

    if (command.toLowerCase().includes("help")) {
        if (window.helpEnabled) {
            await window.showCommands();
        } else {
            await window.systemLine("[SYSTEM]: コマンド一覧は現在非表示です。", 30);
        }
        return;
    }

    if (command.toLowerCase().startsWith("style ") || command.toLowerCase().startsWith("voice ")) {
        const arg = command.split(/\s+(.+)/)[1] || "";
        if (!arg) {
            await window.systemLine("[SYSTEM]: style コマンドの使用例: style calm | style eve | style \"custom system instruction\"", 20);
            return;
        }
        const res = window.setAiStyle(arg.trim());
        if (res.name === "custom") {
            await window.systemLine("[SYSTEM]: カスタムの話し方を設定しました。", 20);
        } else {
            await window.systemLine(`[SYSTEM]: 話し方を '${res.name}' に変更しました。`, 20);
        }
        return;
    }

    if (command.toLowerCase() === "status") {
        await window.showStatus();
        return;
    }

    // injectedCliExitBlock（te.js と同等の挙動）を呼ぶ
    await window.injectedCliExitBlock && window.injectedCliExitBlock(command);
    if (window.a) {
        return;
    }

    const convList = (window.storyData && window.storyData[window.phase].conversation) || [];
    const conv = convList.find((c) => command.toLowerCase().includes(c.player.toLowerCase()));

    if (conv && window.userSelectedStyleName !== "eve") {
        await window.eveLine(`[EVE]: ${conv.eve}`, 20);
        return;
    }

    try {
        const response = await window.callAI(command);
        if (response) {
            const lines = String(response).split(/\r?\n/).filter(l => l.trim());
            for (const l of lines) {
                await window.eveLine(`[EVE]: ${l}`, 20);
            }
        } else {
            await window.eveLine("[EVE]: その質問には答えられません。", 30);
        }
    } catch (error) {
        await window.systemLine(`[SYSTEM]: AI呼び出しエラー: ${error.message || error}`, 30);
        if (conv) {
            await window.eveLine(`[EVE]: ${conv.eve}`, 20);
        } else {
            await window.eveLine("[EVE]: その質問には答えられません。", 30);
        }
    }
};

// マーカー: 読み込み済みを表すフラグ
window.EVE_FNC_LOADED = true;

})();
