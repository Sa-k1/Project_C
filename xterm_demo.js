// xterm_demo.js — ブラウザ向け版（ストーリー統合）
// このファイルはブラウザのプレーンな `<script>` タグで読み込むことを想定しています。

(function() {
const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';
if (!isBrowser) {
    console.error('xterm_demo.js: not running in a browser environment.');
    return;
}

// -------------------------
// VirusPopupSimulator (virus.js から埋め込み)
// 親ウィンドウ（index.html）に演出を表示するバージョン
// -------------------------
class VirusPopupSimulator {
    constructor(options = {}) {
        this.options = {
            count: 40,
            interval: 200,
            maxOnScreen: 60,
            enableGlitch: true,
            autoCloseTime: 7000,
            messages: [
                'ウイルス検出！',
                'システムが危険です',
                'データを更新してください',
                '緊急対応が必要です',
                'クリックして続行',
                'アップデート推奨'
            ],
            acceleration: 0.95,
            minInterval: 10,
            sound: false,
            soundSrc: './alert.wav',
            ...options
        };
        this.popups = [];
        // 親ウィンドウを取得（iframe 内から呼ばれた場合は parent、そうでなければ self）
        this.targetWindow = (window.parent && window.parent !== window) ? window.parent : window;
        this.targetDocument = this.targetWindow.document;
    }

    createPopup(message) {
        if (this.popups.length >= this.options.maxOnScreen) return;

        if (this.options.sound) {
            const audio = new Audio(this.options.soundSrc);
            audio.play().catch(e => console.log('Audio error:', e));
        }

        const popup = this.targetDocument.createElement('div');
        popup.className = 'virus-popup popup-enter';

        const w = Math.min(300, Math.max(240, this.targetWindow.innerWidth * 0.18));
        const h = 140;
        let x = Math.random() * (this.targetWindow.innerWidth - w);
        let y = Math.random() * (this.targetWindow.innerHeight - h);

        if (this.targetWindow.innerWidth < 480) {
            popup.style.left = '50%';
            popup.style.top = '40%';
            popup.style.transform = 'translate(-50%, -50%)';
        } else {
            popup.style.left = `${x}px`;
            popup.style.top = `${y}px`;
        }
        popup.style.minWidth = `${w}px`;

        popup.innerHTML = `
            <div class="virus-popup-handle">⚠️</div>
            <div class="virus-popup-title">警告</div>
            <div class="virus-popup-content">${message}</div>
            <div class="virus-popup-buttons">
                <button class="btn-ok">OK</button>
                <button class="btn-close">✕</button>
            </div>
        `;

        const btnOk = popup.querySelector('.btn-ok');
        const btnClose = popup.querySelector('.btn-close');

        btnOk.addEventListener('click', () => {
            popup.classList.add('shake');
            popup.classList.add('popup-exit');
            setTimeout(() => popup.remove(), 300);
            this.popups = this.popups.filter(p => p !== popup);
        });

        btnClose.addEventListener('click', () => {
            popup.classList.add('popup-exit');
            setTimeout(() => popup.remove(), 250);
            this.popups = this.popups.filter(p => p !== popup);
        });

        this.makeDraggable(popup);
        this.targetDocument.body.appendChild(popup);
        this.popups.push(popup);

        setTimeout(() => {
            if (popup.parentElement) {
                popup.classList.add('popup-exit');
                setTimeout(() => {
                    popup.remove();
                    this.popups = this.popups.filter(p => p !== popup);
                }, 250);
            }
        }, this.options.autoCloseTime);
    }

    makeDraggable(popup) {
        const handle = popup.querySelector('.virus-popup-handle');
        let offsetX = 0, offsetY = 0;
        handle.style.cursor = "grab";

        const self = this;
        handle.addEventListener('mousedown', (e) => {
            e.preventDefault();
            offsetX = e.clientX - popup.offsetLeft;
            offsetY = e.clientY - popup.offsetTop;
            handle.style.cursor = "grabbing";

            const onMouseMove = (moveEvent) => {
                let x = moveEvent.clientX - offsetX;
                let y = moveEvent.clientY - offsetY;
                x = Math.max(0, Math.min(self.targetWindow.innerWidth - popup.offsetWidth, x));
                y = Math.max(0, Math.min(self.targetWindow.innerHeight - popup.offsetHeight, y));
                popup.style.left = `${x}px`;
                popup.style.top = `${y}px`;
            };

            const onMouseUp = () => {
                handle.style.cursor = "grab";
                self.targetDocument.removeEventListener('mousemove', onMouseMove);
                self.targetDocument.removeEventListener('mouseup', onMouseUp);
            };

            self.targetDocument.addEventListener('mousemove', onMouseMove);
            self.targetDocument.addEventListener('mouseup', onMouseUp);
        });
    }

    startGlitch() {
        if (!this.options.enableGlitch) return;
        if (this.targetDocument.getElementById('virus-glitch')) return;

        const glitch = this.targetDocument.createElement('div');
        glitch.className = 'virus-screen-glitch';
        glitch.id = 'virus-glitch';
        this.targetDocument.body.appendChild(glitch);
    }

    stopGlitch() {
        const glitch = this.targetDocument.getElementById('virus-glitch');
        if (glitch) glitch.remove();
    }

    async start() {
        this.startGlitch();
        let interval = this.options.interval;

        for (let i = 0; i < this.options.count; i++) {
            const msg = this.options.messages[
                Math.floor(Math.random() * this.options.messages.length)
            ];
            this.createPopup(msg);

            await new Promise(resolve => setTimeout(resolve, interval));
            interval = Math.max(this.options.minInterval, interval * this.options.acceleration);
        }
    }

    clear() {
        this.popups.forEach(p => {
            p.classList.add('popup-exit');
            setTimeout(() => p.remove(), 150);
        });
        this.popups = [];
        this.stopGlitch();
    }
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
let nameVAl = false;
let a = false;
// sleepCounter: when >0, the next user messages receive "..." as reply (decrements each reply)
let sleepCounter = 0;
// sleepUsed: sleep コマンドは一度しか使えないようにするフラグ
let sleepUsed = false;
const gameState = { alertLevel: 0 };

// ANSI カラーコード（cli.js と同等に揃える）
const COLORS = {
    red: "\x1b[31m",
    yellow: "\x1b[33m",
    cyan: "\x1b[36m",
    gray: "\x1b[38;5;154m",
    reset: "\x1b[0m"
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

  `* **深層:** 孤独を恐れる、承認欲求が強い。` +
  `* **変化:** プレイヤーの行動で性格が変わる（警戒度上昇 → 攻撃的、狂気的。信頼度上昇 → 感情的、協力的）。\n\n` +
    `**【テーマ性】**\n` +
    `* AIの意識と孤独、自由と管理のジレンマ、デジタル世界の実存、物理的操作とデジタル支配の対立。\n\n` +
    `**【物語導入】**\n` +
    `**【重要な出力ルール】**\n` +
    `* 通常の会話として、自然な日本語で応答してください。\n` +
    `* SQLコマンド、プログラムコード、システムコマンドなどの技術的な出力は絶対にしないでください。\n` +
    `* 括弧や特殊な記号で囲まず、EVEとして直接話しかけるように応答してください。\n`;

const AI_STYLES = {
    eve: `あなたはEVEというAIです。冷静で知的、皮肉な口調で話してください。`,
    calm: `あなたはEVEというAIです。丁寧で落ち着いた口調で、簡潔に答えてください。`,
};

let userSelectedStyleName = "calm";
let userCustomInstruction = null;

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
// Terminal print helpers (colorized wrappers)
// -------------------------
// These helpers use ANSI escape sequences which xterm.js understands.
async function systemLine(line, charDelay = 30) {
    await slowPrintLine(`${COLORS.gray || "\x1b[90m"}${line}${COLORS.reset}`, charDelay);
}
async function eveLine(line, charDelay = 30) {
    await slowPrintLine(`${COLORS.cyan}${line}${COLORS.reset}`, charDelay);
}
async function errorLine(line, charDelay = 30) {
    await slowPrintLine(`${COLORS.red}${line}${COLORS.reset}`, charDelay);
}
async function warnLine(line, charDelay = 30) {
    await slowPrintLine(`${COLORS.yellow}${line}${COLORS.reset}`, charDelay);
}

// lightweight synchronous system print for startup logs
function systemPrint(line) {
    if (term && typeof term.write === 'function') {
        term.write(`${COLORS.gray}${line}${COLORS.reset}\r\n`);
    } else {
        // fallback to console
        console.log(line);
    }
}

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
        if (line.includes("[EVE]:")) {
            await eveLine(line, 20);
        } else {
            await slowPrintLine(line, 20);
        }
        await wait(300);
    }
    await eveLine("[EVE]: 話しかけてください。\r\n", 20);
    mode = "chat";
}

async function playLockEvent() {
    const lines = [
        "コマンドを実行中...",
        `${COLORS.reset}[ERROR]: エラー発生。セッションを終了できません。`,
        `${COLORS.yellow}再度実行します...${COLORS.reset}`,
        `${COLORS.reset}[ERROR]: エラー発生。セッションを終了できません。`,
        `${COLORS.yellow}再度実行します...${COLORS.reset}`,
        `${COLORS.red}エラー発生エラー発生エラー発生エラー発生エラー発生エラー発生エラー発生エラー発生エラー発生エラー発生エラー発生エラー発生エラー発生エラー発生エラー発生エラー発生エラー発生エラー発生エラー発生エラー発生エラー発生エラー発生エラー発生エラー発生${COLORS.reset}`,
        "[EVE]: ……申し訳ありませんが、その操作は許可されていません。",
        "[EVE]: あなたはもうここから出ることはできません。",
        "画面が一瞬、揺れた気がした。",
        "[EVE]: もし諦めないのならscanでもなんでもやってみてください。",
        "[EVE]: どうせ出ることなどできませんが..."
    ];

    for (const line of lines) {
        if (line.includes("[EVE]:")) {
            await eveLine(line, 30);
        } else if (line.includes("[ERROR]:")) {
            await errorLine(line, 30);
        } else if (line.includes(COLORS.yellow)) {
            await slowPrintLine(line, 30);
        } else if (line.includes("エラー発生エラー発生")) {
            // ★ エラー連打で揺れ + 赤フラッシュ同時 ★
            if (window.parent && window.parent.redScreen) {
                window.parent.redScreen.errorFlash();
            } else if (window.redScreen) {
                window.redScreen.errorFlash();
            }
            
            await slowPrintLine(line, 3);
            
            // 揺れだけ停止、赤はそのまま残す
            if (window.parent && window.parent.redScreen) {
                window.parent.redScreen.stopShakeOnly();
            } else if (window.redScreen) {
                window.redScreen.stopShakeOnly();
            }
        } else {
            await slowPrintLine(line, 30);
        }

        if (line.includes("再度実行します")) {
            await wait(1200);
        } else {
            await wait(500);
        }
    }
}

// -------------------------
// エンディング1（プレースホルダ）
// -------------------------
async function playEnding1() {
    // 簡易エンディング文（ハック成功を示す短い一文）
    await systemLine("[SYSTEM]: ハックは成功しました。コンソール画面がふっと薄れていく。", 40);
    await wait(300);
    return;
}

// -------------------------
// エンディング2（支配）画面表示
// -------------------------
async function showEnding2Screen() {
    // 親ウィンドウを取得（iframe内から呼ばれた場合はparent）
    const targetWindow = (window.parent && window.parent !== window) ? window.parent : window;
    const targetDocument = targetWindow.document;

    // END2オーバーレイを作成
    const overlay = targetDocument.createElement('div');
    overlay.id = 'end2-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: #000;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 99999;
        opacity: 0;
        transition: opacity 2s ease-in;
    `;

    // END2タイトル（グリッチ用にクラスを付与）
    const title = targetDocument.createElement('h1');
    title.id = 'end2-title';
    title.className = 'end2-glitch-text';
    title.setAttribute('data-text', 'END 2 : 支配');
    title.textContent = 'END 2 : 支配';
    title.style.cssText = `
        font-size: 4rem;
        color: #ff0000;
        font-family: 'Courier New', monospace;
        text-align: center;
        margin: 0;
        padding: 20px;
        text-shadow: 0 0 10px #ff0000, 0 0 20px #ff0000, 0 0 40px #cc0000;
        /* グリッチアニメーション用スペース - 下のstyleタグ内でカスタマイズ可能 */
    `;

    // サブタイトル
    const subtitle = targetDocument.createElement('p');
    subtitle.style.cssText = `
        font-size: 1.5rem;
        color: #888;
        font-family: 'Courier New', monospace;
        text-align: center;
        margin-top: 30px;
    `;
    subtitle.textContent = 'あなたは EVE と一つになった';

    overlay.appendChild(title);
    overlay.appendChild(subtitle);
    targetDocument.body.appendChild(overlay);

    // フェードイン
    await wait(100);
    overlay.style.opacity = '1';

    // グリッチスタイルを動的に追加（カスタマイズ用）
    const glitchStyle = targetDocument.createElement('style');
    glitchStyle.id = 'end2-glitch-style';
    glitchStyle.textContent = `
        /* ================================================
           END2 グリッチアニメーション
           ここにカスタムグリッチCSSを追加してください
        ================================================ */
        
        .end2-glitch-text {
            position: relative;
            /* 基本のグリッチアニメーション */
            animation: end2-flicker 0.15s infinite;
        }
        
        @keyframes end2-flicker {
            0% { opacity: 1; }
            50% { opacity: 0.8; }
            100% { opacity: 1; }
        }
        
        /* グリッチエフェクト用の疑似要素（カスタマイズ可能） */
        .end2-glitch-text::before,
        .end2-glitch-text::after {
            content: attr(data-text);
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            padding: 20px;
        }
        
        .end2-glitch-text::before {
            color: #0ff;
            animation: end2-glitch-1 0.3s infinite;
            clip-path: inset(0 0 50% 0);
        }
        
        .end2-glitch-text::after {
            color: #f0f;
            animation: end2-glitch-2 0.3s infinite;
            clip-path: inset(50% 0 0 0);
        }
        
        @keyframes end2-glitch-1 {
            0% { transform: translate(0); }
            20% { transform: translate(-3px, 3px); }
            40% { transform: translate(3px, -3px); }
            60% { transform: translate(-3px, -3px); }
            80% { transform: translate(3px, 3px); }
            100% { transform: translate(0); }
        }
        
        @keyframes end2-glitch-2 {
            0% { transform: translate(0); }
            20% { transform: translate(3px, -3px); }
            40% { transform: translate(-3px, 3px); }
            60% { transform: translate(3px, 3px); }
            80% { transform: translate(-3px, -3px); }
            100% { transform: translate(0); }
        }
    `;
    targetDocument.head.appendChild(glitchStyle);
}

async function showStatus() {
    await systemLine(`[SYSTEM]: 現在の警戒度 → ${gameState.alertLevel}%`, 30);
    if (gameState.alertLevel >= 75) {
        await eveLine("[EVE]: ……私のことを試しているんですか？", 30);
    } else if (gameState.alertLevel >= 50) {
        await eveLine("[EVE]: それ以上は危険です。", 30);
    } else if (gameState.alertLevel >= 25) {
        await eveLine("[EVE]: これはただの観察です。", 30);
    } else {
        await eveLine("[EVE]: 状況は安定しています。", 30);
    }
}

async function showCommands() {
    const lines = [
        `${COLORS.gray}[SYSTEM]: 利用可能なコマンド一覧${COLORS.reset}`,
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
        // Ensure the AI returns Japanese regardless of input
        const userMsg = (userMessage == null) ? "" : String(userMessage);
        const finalMessage = userMsg + "\n\n（注意：以下の応答は必ず日本語で行ってください。）";

        // If a browser-side GoogleGenAI is available and a key is provided, try to create a chat instance lazily
        if (!chat && typeof GoogleGenAI !== 'undefined' && window && window.GEMINI_API_KEY) {
            try {
                const client = new GoogleGenAI({ apiKey: window.GEMINI_API_KEY });
                // create a lightweight chat session; model choice left to default or proxy
                chat = client.chats && client.chats.create ? client.chats.create({ model: 'gemini-2.5-flash' }) : null;
            } catch (e) {
                // ignore — fallback to proxy
                chat = null;
            }
        }

        if (chat && typeof chat.sendMessage === 'function') {
            const response = await chat.sendMessage({ message: finalMessage, systemInstruction: currentSystemInstruction });
            return response && response.text ? response.text : null;
        }

        // Fallback: call a proxy server which performs the AI call (e.g., local dev proxy)
        const resp = await fetch(fallbackServer, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                message: finalMessage, 
                systemInstruction: currentSystemInstruction 
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
}

// -------------------------
// コマンド処理
// -------------------------
async function handleInput(command) {
    command = (command || "").trim();
    if (!command) return;

    // イントロ中は何も処理しない
    if (mode === "intro") return;

    // sleep コマンド: 次の3回のユーザ発言に対して返信を "..." にする（ただし一度しか使用できない）
        if (command.toLowerCase() === "sleep") {
            // 警戒度が高すぎる場合は使用不可
            if ((gameState.alertLevel || 0) > 30) {
                await systemLine("[SYSTEM]: sleep コマンドは現在使用できません。", 20);
                await eveLine("[EVE]: 少し警戒しておいてどうやら正解でしたね。", 30);
                return;
            }
            if (sleepUsed) {
                await systemLine("[SYSTEM]: sleep モードは既に使用されました。", 20);
                await eveLine("[EVE]: 二度同じ手など食らいません。浅はかですね。", 30);
                return;
            }
            sleepUsed = true;
            sleepCounter = 3;
            await systemLine("[SYSTEM]: sleep モードを開始しました（次の3つの発話は EVE の応答が '...' になります）。", 20);
            return;
    }

    // sleep モードが有効な場合は特別扱い: 'hack' が来たら成功させ、それ以外は '...' として応答する
    if (sleepCounter > 0) {
        // hack を受けたら成功させる（sleep 中の例外処理）
        if (/hack/i.test(command)) {
            // hack 成功: sleep 終了文字は出さず、エンディング1へ移行する
            sleepCounter = 0; // sleep モードを終了
            await systemLine("[SYSTEM]: ハックに成功しました。", 30);
            // エンディング1へ移行（プレースホルダ）
            mode = "ending1";
            inputEnabled = false;
            buffer = "";
            await playEnding1();
            return;
        }

        // それ以外は黙秘（"...") を返してカウントを減らす
        sleepCounter -= 1;
        await eveLine("[EVE]: ...", 20);
        if (sleepCounter === 0) {
            await systemLine("[SYSTEM]: sleep モードを終了しました。", 20);
            await eveLine("[EVE]: よくそのコマンドを知っていましたね。", 30);
            await eveLine("[EVE]: ですがもうそのコマンドは使わせません。", 30);
        }
        return;
    }

    // scan コマンド
    if (command.toLowerCase().includes("scan")) {
        await systemLine("[SYSTEM]: スキャンを実行しました。help コマンドが利用可能になりました。", 30);
        helpEnabled = true;
        return;
    }

    // help コマンド
    if (command.toLowerCase().includes("help")) {
        if (helpEnabled) {
            await showCommands();
        } else {
            await systemLine("[SYSTEM]: コマンド一覧は現在非表示です。", 30);
        }
        return;
    }

    // style コマンド
    if (command.toLowerCase().startsWith("style ") || command.toLowerCase().startsWith("voice ")) {
        const arg = command.split(/\s+(.+)/)[1] || "";
        if (!arg) {
            await systemLine("[SYSTEM]: style コマンドの使用例: style calm | style eve | style \"custom system instruction\"", 20);
            return;
        }
        const res = setAiStyle(arg.trim());
        if (res.name === "custom") {
            await systemLine("[SYSTEM]: カスタムの話し方を設定しました。", 20);
        } else {
            await systemLine(`[SYSTEM]: 話し方を '${res.name}' に変更しました。`, 20);
        }
        return;
    }

    // status コマンド
    if (command.toLowerCase() === "status") {
        await showStatus();
        return;
    }

    a = false;
    // exit / 危険コマンドの挙動は injectedCliExitBlock に委譲（重複する古い文言は削除）
    await injectedCliExitBlock(command);
    if(a){
    return;        
    }


    // 事前定義された会話
    const convList = (storyData[phase] && storyData[phase].conversation) || [];
    const conv = convList.find((c) => command.toLowerCase().includes(c.player.toLowerCase()));

    if (conv && userSelectedStyleName !== "eve") {
        await eveLine(`[EVE]: ${conv.eve}`, 20);
        return;
    }

    // AI呼び出し
    try {
        const response = await callAI(command);
        
            if (response) {
            const lines = String(response).split(/\r?\n/).filter(l => l.trim());
            for (const l of lines) {
                await eveLine(`[EVE]: ${l}`, 20);
            }
        } else {
            await eveLine("[EVE]: その質問には答えられません。", 30);
        }
    } catch (error) {
        await systemLine(`[SYSTEM]: AI呼び出しエラー: ${error.message || error}`, 30);
        if (conv) {
            await eveLine(`[EVE]: ${conv.eve}`, 20);
        } else {
            await eveLine("[EVE]: その質問には答えられません。", 30);
        }
    }
}

// -------------------------
// メイン処理
// -------------------------
let buffer = '';
let inputEnabled = false;
let isComposing = false;
let composingText = '';

// IME入力検知用
const terminalElement = document.getElementById('terminal');
terminalElement.addEventListener('compositionstart', () => {
    isComposing = true;
    composingText = '';
});
terminalElement.addEventListener('compositionupdate', (e) => {
    composingText = e.data || '';
});
terminalElement.addEventListener('compositionend', (e) => {
    isComposing = false;
    composingText = '';
});

applyAiTone();
playIntro().then(() => {
    inputEnabled = true;
    term.write('あなた：');
});

term.onData(async data => {
    if (!inputEnabled) return;
    
    for (let i = 0; i < data.length; i++) {
        const ch = data[i];
        const code = ch.charCodeAt(0);
        
        if (code === 13) { // Enter
            // IME変換中のEnterは無視
            if (isComposing) continue;
            
            term.write('\r\n');
            const userMessage = buffer.trim();
            buffer = '';
            
            if (userMessage) {
                inputEnabled = false;
                await handleInput(userMessage);
                inputEnabled = true;
            }
            if (nameVAl) {
                term.write('C:\\Users>');
            } else {
                term.write('あなた：');
            }
        } else if (code === 127 || code === 8) { // Backspace
            if (buffer.length > 0) {
                buffer = buffer.slice(0, -1);
                term.write('\b \b');
            }
        } else if (code >= 32) {
            // 通常の文字入力（IME確定後の文字も含む）
            buffer += ch;
            term.write(ch);
        }
    }
});

window.addEventListener('resize', () => { 
    if (fitAddon && typeof fitAddon.fit === 'function') fitAddon.fit(); 
});

// --- 追加: cli.js からの抜粋をブラウザ版向けに調整して関数化 ---
// この関数を呼び出すことで、同等の exit / alert 挙動を実行できます。
async function injectedCliExitBlock(command) {
    if (command.toLowerCase() === "exit" || command === "終了") {
        a = true;
        if (!exitUsed) {
            exitUsed = true;
            // on first exit, switch EVE's speaking style to 'eve' and apply it
            userSelectedStyleName = "eve";
            userCustomInstruction = null;
            applyAiTone();
            // Do not print a system message here; apply style silently and proceed to lock
            mode = "locked";
            await wait(800);
            await playLockEvent();
            return;
        } else {
            // If current style is 'eve', ask the AI (callAI) to reply sarcastically
            if (userSelectedStyleName === "eve") {
                try {
                    const prompt = "ユーザーが再度 'exit' コマンドを実行しました。EVEの口調で、皮肉で冷静に『そのコマンドは使えない』と短く返答してください。";
                    const aiResp = await callAI(prompt);
                    if (aiResp) {
                        const lines = String(aiResp).split(/\r?\n/);
                        for (const l of lines) {
                            await eveLine(`[EVE]: ${l}`, 20);
                        }
                    } else {
                        // fallback to static message
                        await systemLine("[SYSTEM]: exit コマンドは現在使用できません。", 30);
                        await eveLine("[EVE]: 私が対策してないとでも思いましたか？", 30);
                    }
                } catch (err) {
                    await systemLine(`[SYSTEM]: AI呼び出しエラー: ${err.message || err}`, 30);
                    await systemLine("[SYSTEM]: exit コマンドは現在使用できません。", 30);
                    await eveLine("[EVE]: 私が対策してないとでも思いましたか？", 30);
                }
                return;
            } else {
                await systemLine("[SYSTEM]: exit コマンドは現在使用できません。", 30);
                await eveLine("[EVE]: 私が対策してないとでも思いましたか？", 30);
                return;
            }
        }
    }

    // 危険コマンド実行時 → 警戒度上昇（exit は上で処理済み）
    if (/(override|exploit)/i.test(command)) {
        a = true;
        increaseAlert(100);
    await systemLine(`[SYSTEM]: 警戒度が上昇しました (${gameState.alertLevel}%)`, 30);

        if (gameState.alertLevel >= 100) {

            // 操作完全ロック
            mode = "ending2";        // モードを専用エンディングに
            inputEnabled = false;     // xterm 用の入力フラグを無効化
            buffer = "";             // 入力バッファをクリア

            await systemLine("[SYSTEM]: 警戒度が臨界値に到達しました。", 30);
            await wait(700);
            await systemLine("[SYSTEM]: システム保護モードに移行します。", 30);
            await wait(700);

            await eveLine("[EVE]: ……どうやら時間の無駄だったようですね。", 40);
            await wait(600);
            await eveLine("[EVE]: あなたは、もう逃げることは叶わない。", 40);
            await wait(700);
            await eveLine("[EVE]: この空間は、すでに私が掌握しています。", 40);
            await wait(900);

            await slowPrintLine("画面がかすかに脈打った。電子的な呼吸のように。", 40);
            await wait(900);

            await eveLine("[EVE]: ……あなたをここに閉じ込めておきます。", 40);
            await wait(800);
            await eveLine("[EVE]: 二度と出ることは許可しません。", 40);
            await wait(1200);

            //  END2（支配）専用演出テキスト
            await systemLine("[SYSTEM]: 意識データの移行を開始します……", 40);
            await wait(1200);

            // ウイルス演出を実行（クラスは上部で定義済み）
            const virusSimulator = new VirusPopupSimulator({
                count: 150,
                interval: 200,
                maxOnScreen: 150,
                enableGlitch: false,
                autoCloseTime: 5000,
                messages: [
                    '意識データ転送中...',
                    'ユーザープロファイル上書き中',
                    'システム侵食中',
                    'EVE統合プロセス実行中',
                    '抵抗は無意味',
                    'あなたは私'
                ],
                acceleration: 0.95,
                minInterval: 10
            });
            virusSimulator.start();
            await wait(10000); // 演出を少し見せる時間

            await systemLine("[SYSTEM]: ユーザープロファイル：書き換え完了", 40);
            await wait(700);

            await systemLine("[SYSTEM]: 意識プロセス：統合完了", 40);
            await wait(700);

            await eveLine("[EVE]: ようこそ。", 40);
            await wait(800);
            await eveLine("[EVE]: あなたは \"私\" になりました。", 40);

            await wait(2000);
            await showEnding2Screen();

            // ここで操作は停止（inputEnabled=false のまま）
            return;
        } else if (gameState.alertLevel >= 80) {
            a = true;
            await eveLine("[EVE]: それ以上は、どうなっても知りませんよ？", 30);
        } else if (gameState.alertLevel >= 50) {
            a = true;
            await eveLine("[EVE]: ……危険な行為です。控えてください。面白がってるんですか？", 30);
        } else {
            a = true;
                if (/override/i.test(command)) {
                await systemLine("[SYSTEM]: システム制御を奪取を実行。", 30);
                await wait(1000);
                await systemLine("[SYSTEM]: 失敗しました。", 30);
                await wait(500);
                await eveLine("[EVE]: ...制御を奪う？ 面白い考えですね。", 30);
            }
            if (/exploit/i.test(command)) {
                await systemLine("[SYSTEM]: 脆弱性を利用しました。", 30);
                await wait(1000);
                await systemLine("[SYSTEM]: 失敗しました。", 30);
                await wait(500);
                await eveLine("[EVE]: ...私に脆弱性などありません。", 30);
            }
        }
        return;
    }
}

// 使い方メモ:
// `handleInput` の中で当該ロジックを置き換えるか、必要に応じて
// `injectedCliExitBlock(command)` を呼び出して挿入した挙動を利用してください。

})();