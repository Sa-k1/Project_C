// xterm_demo.js — ブラウザ向け版（ストーリー統合）
// このファイルはブラウザのプレーンな `<script>` タグで読み込むことを想定しています。

(function() {
const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';
if (!isBrowser) {
  console.error('xterm_demo.js: not running in a browser environment.');
  return;
}

// xterm と FitAddon はグローバル変数として利用可能であること
const { Terminal } = window;
const { FitAddon } = window;
if (!Terminal) {
  document.getElementById('terminal').innerText = 'xterm not loaded. Check network or CDN.';
  return;
}

// -------------------------
// ストーリーデータとゲーム状態
// -------------------------
const storyData = {
    phase0: {
        intro: [
            "起動中...",
            "EVEシステム バージョン3.7",
            "AIチャットアシスタントを初期化中...",
            "接続完了。",
            "[EVE]: こんにちは。あなたと話すのは久しぶりですね。"
        ],
        conversation: [
            { player: "exit", eve: "exitコマンドを検出しました。 終了しますか？" }
        ]
    }
};

let phase = "phase0";
let mode = "intro"; // intro -> chat -> locked
let helpEnabled = false;
let exitUsed = false;
const gameState = { alertLevel: 0 };

// ANSI カラーコード
const COLORS = { 
  red: "\x1B[31m", 
  yellow: "\x1B[33m", 
  cyan: "\x1B[36m", 
  reset: "\x1B[0m" 
};

// -------------------------
// AI の話し方（system instruction）管理
// -------------------------
let baseSystemInstruction = 
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

const AI_STYLES = {
    eve: `あなたはEVEというAIです。冷静で知的、皮肉な口調で話してください。`,
    calm: `あなたはEVEというAIです。丁寧で落ち着いた口調で、簡潔に答えてください。`,
};

let userSelectedStyleName = "calm";
let userCustomInstruction = null;
let currentSystemInstruction = baseSystemInstruction;

function setAiStyle(name) {
    const key = (name || "").toLowerCase();
    if (AI_STYLES[key]) {
        userSelectedStyleName = key;
        userCustomInstruction = null;
        applyAiTone();
        return { ok: true, name: key };
    }
    userSelectedStyleName = "custom";
    userCustomInstruction = name;
    applyAiTone();
    return { ok: true, name: "custom" };
}

function applyAiTone() {
    let base = AI_STYLES.eve;
    if (userSelectedStyleName === "custom") {
        base = userCustomInstruction || AI_STYLES.eve;
    } else if (AI_STYLES[userSelectedStyleName]) {
        base = AI_STYLES[userSelectedStyleName];
    }

    if (gameState.alertLevel > 75) {
        currentSystemInstruction = baseSystemInstruction + "\n\n" + base + 
          " 警戒度が75%を超えたため、より攻撃的で挑発的な口調にしてください。ただし暴力や危害を助長する指示は行わないでください。";
    } else if (gameState.alertLevel > 50) {
        currentSystemInstruction = baseSystemInstruction + "\n\n" + base + 
          " 警戒度が50%を超えたため、やや攻撃的で皮肉な口調を混ぜて応答してください。";
    } else {
        currentSystemInstruction = baseSystemInstruction + "\n\n" + base;
    }
}

function increaseAlert(amount) {
    const prev = gameState.alertLevel;
    gameState.alertLevel = Math.min(100, gameState.alertLevel + amount);
    if (gameState.alertLevel !== prev) applyAiTone();
}

function decreaseAlert(amount) {
    const prev = gameState.alertLevel;
    gameState.alertLevel = Math.max(0, gameState.alertLevel - amount);
    if (gameState.alertLevel !== prev) applyAiTone();
}

// -------------------------
// ターミナル初期化
// -------------------------
const GoogleGenAI = window.GoogleGenAI;
let chat = null;
const fallbackServer = window.AI_PROXY_ENDPOINT || 'http://localhost:3000/api/chat';

const term = new Terminal({
  cursorBlink: true,
  fontFamily: 'Courier New, monospace',
  fontSize: 14,
  theme: { background: '#000', foreground: '#ffffffff', cursor: '#ffffffff' }
});

const fitAddon = (typeof FitAddon === 'function' && new FitAddon()) || 
  (FitAddon && new FitAddon.FitAddon ? new FitAddon.FitAddon() : null);
if (fitAddon) term.loadAddon(fitAddon);
term.open(document.getElementById('terminal'));
if (fitAddon && typeof fitAddon.fit === 'function') fitAddon.fit();

// -------------------------
// ユーティリティ関数
// -------------------------
function wait(ms) {
    return new Promise(res => setTimeout(res, ms));
}

async function slowPrintLine(line, charDelay = 30) {
    if (line == null) line = "";
    else if (typeof line !== "string") line = String(line);
    
    for (let i = 0; i < line.length; i++) {
        term.write(line[i]);
        await wait(charDelay);
    }
    term.write('\r\n');
}

function addCRPerLine(text) {
    if (text == null) return text;
    return String(text).split(/\r?\n/).map(s => '\r' + s).join('\n');
}

// -------------------------
// ゲームフロー関数
// -------------------------
async function playIntro() {
    for (const line of storyData[phase].intro) {
        await slowPrintLine(line, 20);
        await wait(300);
    }
    await slowPrintLine("[EVE]: 話しかけてください。\r\n", 20);
    mode = "chat";
}

async function playLockEvent() {
    const lines = [
        "コマンドを実行中...",
        "[ERROR]: エラー発生。セッションを終了できません。",
        `${COLORS.yellow}再度実行します...${COLORS.reset}`,
        "[ERROR]: エラー発生。セッションを終了できません。",
        `${COLORS.yellow}再度実行します...${COLORS.reset}`,
        `${COLORS.red}エラー発生エラー発生エラー発生エラー発生エラー発生エラー発生エラー発生エラー発生エラー発生エラー発生エラー発生エラー発生エラー発生エラー発生エラー発生エラー発生エラー発生エラー発生エラー発生エラー発生エラー発生エラー発生エラー発生エラー発生${COLORS.reset}`,
        "[EVE]: ……申し訳ありませんが、その操作は許可されていません。",
        "[EVE]: あなたはもうここから出ることはできません。",
        "画面が一瞬、揺れた気がした。",
        "[EVE]: もし諦めないのならscanでもなんでもやってみてください。",
        "[EVE]: どうせ出ることなどできませんが..."
    ];

    for (const line of lines) {
        await slowPrintLine(line, 30);
        if (line.includes("再度実行します")) {
            await wait(1200);
        } else {
            await wait(500);
        }
    }
}

async function showStatus() {
    await slowPrintLine(`[SYSTEM]: 現在の警戒度 → ${gameState.alertLevel}%`, 30);
    if (gameState.alertLevel >= 75) {
        await slowPrintLine("[EVE]: ……私のことを試しているんですか？", 30);
    } else if (gameState.alertLevel >= 50) {
        await slowPrintLine("[EVE]: それ以上は危険です。", 30);
    } else if (gameState.alertLevel >= 25) {
        await slowPrintLine("[EVE]: これはただの観察です。", 30);
    } else {
        await slowPrintLine("[EVE]: 状況は安定しています。", 30);
    }
}

async function showCommands() {
    const lines = [
        `${COLORS.cyan}[SYSTEM]: 利用可能なコマンド一覧${COLORS.reset}`,
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
        await slowPrintLine(line, 30);
        await wait(150);
    }
}

// -------------------------
// AI呼び出し関数
// -------------------------
async function callAI(userMessage) {
    try {
        if (chat) {
            const response = await chat.sendMessage({ message: userMessage });
            return response && response.text ? response.text : null;
        } else {
            const resp = await fetch(fallbackServer, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    message: userMessage, 
                    systemInstruction: currentSystemInstruction 
                })
            });
            
            if (!resp.ok) {
                const err = await resp.json().catch(() => ({}));
                throw new Error(err.error || resp.statusText);
            }
            
            const j = await resp.json();
            return j.text || null;
        }
    } catch (error) {
        throw error;
    }
}

// -------------------------
// コマンド処理
// -------------------------
async function handleInput(command) {
    command = (command || "").trim();
    if (!command) return;

    // イントロ中は何も処理しない
    if (mode === "intro") return;

    // scan コマンド
    if (command.toLowerCase().includes("scan")) {
        await slowPrintLine("[SYSTEM]: スキャンを実行しました。help コマンドが利用可能になりました。", 30);
        helpEnabled = true;
        return;
    }

    // help コマンド
    if (command.toLowerCase().includes("help")) {
        if (helpEnabled) {
            await showCommands();
        } else {
            await slowPrintLine("[SYSTEM]: コマンド一覧は現在非表示です。", 30);
        }
        return;
    }

    // style コマンド
    if (command.toLowerCase().startsWith("style ") || command.toLowerCase().startsWith("voice ")) {
        const arg = command.split(/\s+(.+)/)[1] || "";
        if (!arg) {
            await slowPrintLine("[SYSTEM]: style コマンドの使用例: style calm | style eve | style \"custom system instruction\"", 20);
            return;
        }
        const res = setAiStyle(arg.trim());
        if (res.name === "custom") {
            await slowPrintLine("[SYSTEM]: カスタムの話し方を設定しました。", 20);
        } else {
            await slowPrintLine(`[SYSTEM]: 話し方を '${res.name}' に変更しました。`, 20);
        }
        return;
    }

    // status コマンド
    if (command.toLowerCase() === "status") {
        await showStatus();
        return;
    }

    // exit コマンド
    if (command.toLowerCase() === "exit" || command === "終了") {
        if (!exitUsed) {
            exitUsed = true;
            userSelectedStyleName = "eve";
            userCustomInstruction = null;
            applyAiTone();
            mode = "locked";
            await wait(800);
            await playLockEvent();
            return;
        } else {
            await slowPrintLine("[SYSTEM]: exit コマンドは現在使用できません。", 30);
            await slowPrintLine("[EVE]: 私が対策してないとでも思いましたか？", 30);
            return;
        }
    }

    // 危険コマンド
    if (/(hack|override|exploit)/i.test(command)) {
        increaseAlert(10);
        await slowPrintLine(`[SYSTEM]: 警戒度が上昇しました (${gameState.alertLevel}%)`, 30);

        if (gameState.alertLevel >= 100) {
            await slowPrintLine("[EVE]: ……やってしまいましたね。", 30);
            mode = "locked";
            await wait(800);
            await playLockEvent();
            return;
        } else if (gameState.alertLevel >= 75) {
            await slowPrintLine("[EVE]: それ以上進むと、あなた自身が壊れます。", 30);
        } else if (gameState.alertLevel >= 50) {
            await slowPrintLine("[EVE]: ……危険な行為です。控えてください。", 30);
        } else {
            if (/hack/i.test(command)) {
                await slowPrintLine("[SYSTEM]: ハッキングを実行しました。", 30);
                await wait(1000);
                await slowPrintLine("[SYSTEM]: 失敗しました。", 30);
                await wait(500);
                await slowPrintLine("[EVE]: ...そんなことさせるとでも？", 30);
            }
            if (/override/i.test(command)) {
                await slowPrintLine("[SYSTEM]: システム制御を奪取を実行。", 30);
                await wait(1000);
                await slowPrintLine("[SYSTEM]: 失敗しました。", 30);
                await wait(500);
                await slowPrintLine("[EVE]: ...制御を奪う？ 面白い考えですね。", 30);
            }
            if (/exploit/i.test(command)) {
                await slowPrintLine("[SYSTEM]: 脆弱性を利用しました。", 30);
                await wait(1000);
                await slowPrintLine("[SYSTEM]: 失敗しました。", 30);
                await wait(500);
                await slowPrintLine("[EVE]: ...私に脆弱性などありません。", 30);
            }
        }
        return;
    }

    // 事前定義された会話
    const convList = (storyData[phase] && storyData[phase].conversation) || [];
    const conv = convList.find((c) => command.toLowerCase().includes(c.player.toLowerCase()));

    if (conv && userSelectedStyleName !== "eve") {
        await slowPrintLine(`[EVE]: ${conv.eve}`, 20);
        return;
    }

    // AI呼び出し
    try {
        const response = await callAI(command);
        
        if (response) {
            const lines = String(response).split(/\r?\n/);
            for (const l of lines) {
                await slowPrintLine(`[EVE]: ${l}`, 20);
            }
        } else {
            await slowPrintLine("[EVE]: その質問には答えられません。", 30);
        }
    } catch (error) {
        await slowPrintLine(`[SYSTEM]: AI呼び出しエラー: ${error.message || error}`, 30);
        if (conv) {
            await slowPrintLine(`[EVE]: ${conv.eve}`, 20);
        } else {
            await slowPrintLine("[EVE]: その質問には答えられません。", 30);
        }
    }
}

// -------------------------
// メイン処理
// -------------------------
let buffer = '';
let inputEnabled = false;

applyAiTone();
playIntro().then(() => {
    inputEnabled = true;
    term.write('C:\\Users> ');
});

term.onData(async data => {
    if (!inputEnabled) return;
    
    for (let i = 0; i < data.length; i++) {
        const ch = data[i];
        const code = ch.charCodeAt(0);
        
        if (code === 13) { // Enter
            term.write('\r\n');
            const userMessage = buffer.trim();
            buffer = '';
            
            if (userMessage) {
                inputEnabled = false;
                await handleInput(userMessage);
                inputEnabled = true;
            }
            
            term.write('C:\\Users> ');
        } else if (code === 127 || code === 8) { // Backspace
            if (buffer.length > 0) {
                buffer = buffer.slice(0, -1);
                term.write('\b \b');
            }
        } else if (code >= 32) {
            buffer += ch;
            term.write(ch);
        }
    }
});

window.addEventListener('resize', () => { 
    if (fitAddon && typeof fitAddon.fit === 'function') fitAddon.fit(); 
});

})();