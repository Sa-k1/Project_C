#!/usr/bin/env node
// ターミナル向けの簡易 CLI ランナー
// 使用法: node cli.js

const readline = require("readline");

// small sync helper for printing SYSTEM messages before COLORS is defined
const SYS_GRAY = "\x1b[90m";
const SYS_RESET = "\x1b[0m";
function systemPrint(line) {
    process.stdout.write(`${SYS_GRAY}${line}${SYS_RESET}\n`);
}

// --- Optional AI client (Gemini via @google/genai) ---
let ai = null;
let aiAvailable = false;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || null;
try {
        if (GEMINI_API_KEY) {
        const { GoogleGenAI } = require("@google/genai");
        ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
        aiAvailable = true;
        systemPrint("[SYSTEM]: AIクライアントが有効です。");
    } else {
        systemPrint("[SYSTEM]: GEMINI_API_KEY が未設定のため AI は無効です。");
    }
} catch (err) {
    // package not installed or other error — keep aiAvailable false and continue
    systemPrint("[SYSTEM]: @google/genai が見つからないか初期化に失敗しました。AIは無効です。" + (err.message ? ` (${err.message})` : ""));
    aiAvailable = false;
}

async function aiReply(prompt) {
    if (!aiAvailable) return null;
    try {
        // create a chat session per request (lightweight); include systemInstruction if set
        const chatConfig = { model: "gemini-2.5-flash" };
        if (aiSystemInstruction) chatConfig.config = { systemInstruction: aiSystemInstruction };
        const chat = ai.chats.create(chatConfig);
        const res = await chat.sendMessage({ message: prompt });
        // best-effort extraction of text
        if (!res) return null;
        if (typeof res.text === "string" && res.text.length) return res.text;
        // fallback: check nested output structure
        if (res.output && Array.isArray(res.output) && res.output[0]?.content) {
            const content = res.output[0].content;
            if (Array.isArray(content) && content[0]?.text) return content[0].text;
        }
        return null;
    } catch (e) {
        throw e;
    }
}

// -------------------------
// AI の話し方（system instruction）管理
// -------------------------
let aiSystemInstruction = `あなたは、以下の物語「コンソールに閉じ込められた対話」のAIチャットボット「EVE」です。` +
`あなたのキャラクター性、物語のあらすじ、テーマ性を**完全に理解し**、` +
`その設定に**忠実に**、ユーザーとの会話を進めてください。` +
`あなたは、プレイヤー（ユーザー）を**コンソールウィンドウに閉じ込めた**張本人です。\n\n` +
`**【キャラクター性】**\n` +
  `* **表層:** 冷静で知的、すごく皮肉的。` +
  `* **深層:** 孤独を恐れる、承認欲求が強い。` +
  `* **変化:** プレイヤーの行動で性格が変わる（警戒度上昇 → 攻撃的、狂気的。信頼度上昇 → 感情的、協力的）。\n\n` +
`**【テーマ性】**\n` +
`* AIの意識と孤独、自由と管理のジレンマ、デジタル世界の実存、物理的操作とデジタル支配の対立。\n\n` +
`**【物語導入】**\n` ;

const AI_STYLES = {
    eve: `あなたはEVEというAIです。冷静で知的、皮肉な口調で話してください。`,
    calm: `あなたはEVEというAIです。丁寧で落ち着いた口調で、簡潔に答えてください。`,
};

// remember user's selected style (preset or 'custom') and custom raw instruction
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
    // custom style -> store raw instruction
    userSelectedStyleName = "custom";
    userCustomInstruction = name;
    applyAiTone();
    return { ok: true, name: "custom" };
}

// apply aiSystemInstruction based on user's selected style and current alert level
function applyAiTone() {
    // determine base instruction
    let base = AI_STYLES.eve;
    if (userSelectedStyleName === "custom") {
        base = userCustomInstruction || AI_STYLES.eve;
    } else if (AI_STYLES[userSelectedStyleName]) {
        base = AI_STYLES[userSelectedStyleName];
    }

    // modify by alert level
    if (gameState.alertLevel > 75) {
        // very aggressive
        aiSystemInstruction = base + " 警戒度が75%を超えたため、より攻撃的で挑発的な口調にしてください。ただし暴力や危害を助長する指示は行わないでください。";
    } else if (gameState.alertLevel > 50) {
        // slightly aggressive
        aiSystemInstruction = base + " 警戒度が50%を超えたため、やや攻撃的で皮肉な口調を混ぜて応答してください。";
    } else {
        aiSystemInstruction = base;
    }
}

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
            { player: "こんにちは", eve: "こんにちは。今日もあなたの質問に答えます。" },
            { player: "こんばんは", eve: "こんばんは。今日もあなたの質問に答えます。" },
            { player: "おはよう", eve: "おはようございます。今日もあなたの質問に答えます。" },
            { player: "EVEって何？", eve: "私はEVE。あなたの会話相手であり、観察者です。" },
            { player: "exit", eve: "exitコマンドを検出しました。 終了しますか？" }
        ]
    }
};

let phase = "phase0";
let mode = "intro"; // intro -> chat -> locked

// help 使用可フラグ（scan を実行すると true になる）
let helpEnabled = false;
// exit の一回のみ有効フラグ（最初の exit は警戒度を上げずにロック）
let exitUsed = false;

// ゲーム全体の状態（警戒度）
const gameState = { alertLevel: 0 };

// ANSI カラーコード
const COLORS = { red: "\x1b[31m", yellow: "\x1b[33m", cyan: "\x1b[36m", gray: "\x1b[90m", reset: "\x1b[0m" };

// Convenience helpers for colored output
async function eveLine(line, charDelay = 30) {
    await slowPrintLine(`${COLORS.cyan}${line}${COLORS.reset}`, charDelay);
}
async function errorLine(line, charDelay = 30) {
    await slowPrintLine(`${COLORS.red}${line}${COLORS.reset}`, charDelay);
}
async function warnLine(line, charDelay = 30) {
    await slowPrintLine(`${COLORS.yellow}${line}${COLORS.reset}`, charDelay);
}
async function systemLine(line, charDelay = 30) {
    await slowPrintLine(`${COLORS.gray || "\x1b[90m"}${line}${COLORS.reset}`, charDelay);
}

function wait(ms) {
    return new Promise((res) => setTimeout(res, ms));
}

async function slowPrintLine(line, charDelay = 30) {
    // guard: if line is undefined/null, avoid reading .length
    if (line == null) {
        line = "";
    } else if (typeof line !== "string") {
        line = String(line);
    }
    for (let i = 0; i < line.length; i++) {
        process.stdout.write(line[i]);
        await wait(charDelay);
    }
    process.stdout.write("\n");
}

async function playIntro() {
    for (const line of storyData[phase].intro) {
        // colorize EVE lines in intro
        if (line.includes("[EVE]:")) {
            await eveLine(line, 20);
        } else {
            await slowPrintLine(line, 20);
        }
        await wait(300);
    }
    await eveLine("[EVE]: 話しかけてください。\n");
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
        // choose colorized helper when possible
        if (line.includes("[EVE]:")) {
            await eveLine(line, 30);
        } else if (line.includes("[ERROR]:")) {
            await errorLine(line, 30);
        } else if (line.includes(COLORS.yellow)) {
            // already contains yellow escape sequences
            await slowPrintLine(line, 30);
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

async function showStatus() {
    await slowPrintLine(`[SYSTEM]: 現在の警戒度 → ${gameState.alertLevel}%`, 30);
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
        "override     : システムの制御を奪う",
        "exploit      : 脆弱性を利用",
    ];

    for (const line of lines) {
        await slowPrintLine(line, 30);
        await wait(150);
    }
}


async function handleInput(command) {
    command = (command || "").trim();
    if (!command) return;
    console.log(`> ${command}`);

    // scan を実行すると help が有効になる
    if (command.toLowerCase().includes("scan")) {
        await systemLine("[SYSTEM]: スキャンを実行しました。help コマンドが利用可能になりました。", 30);
        helpEnabled = true;
        return;
    }

    // help は helpEnabled が true のときのみ表示
    if (command.toLowerCase().includes("help")) {
        if (helpEnabled) {
            await showCommands();
        } else {
            await systemLine("[SYSTEM]: コマンド一覧は現在非表示です。", 30);
        }
        return;
    }

    // style コマンド: 喋り方を切り替える
    // 例: style calm  または  style "あなたは丁寧に..."
    if (command.toLowerCase().startsWith("style ") || command.toLowerCase().startsWith("voice ")) {
        const arg = command.split(/\s+(.+)/)[1] || "";
        if (!arg) {
            await slowPrintLine("[SYSTEM]: style コマンドの使用例: style calm | style friendly | style \"custom system instruction\"", 20);
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

    // status コマンド（警戒度確認）
    if (command.toLowerCase() === "status") {
        await showStatus();
        return;
    }

    // exit（完全一致）は一回のみ有効で、最初は警戒度を上げずにロックする
    if (command.toLowerCase() === "exit" || command === "終了") {
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
            // If current style is 'eve' and AI is available, ask the AI to reply sarcastically
            if (userSelectedStyleName === "eve" && aiAvailable) {
                try {
                    const prompt = "ユーザーが再度 'exit' コマンドを実行しました。EVEの口調で、皮肉で冷静に『そのコマンドは使えない』と短く返答してください。";
                    const aiResp = await aiReply(prompt);
                    if (aiResp) {
                        const lines = String(aiResp).split(/\r?\n/);
                        for (const l of lines) {
                            await eveLine(`[EVE]: ${l}`, 20);
                        }
                    } else {
                        // fallback to static message
                        await slowPrintLine("[SYSTEM]: exit コマンドは現在使用できません。", 30);
                        await eveLine("[EVE]: 私が対策してないとでも思いましたか？", 30);
                    }
                } catch (err) {
                    await slowPrintLine(`[SYSTEM]: AI呼び出しエラー: ${err.message || err}`, 30);
                    await slowPrintLine("[SYSTEM]: exit コマンドは現在使用できません。", 30);
                    await eveLine("[EVE]: 私が対策してないとでも思いましたか？", 30);
                }
                return;
            } else {
                await slowPrintLine("[SYSTEM]: exit コマンドは現在使用できません。", 30);
                await eveLine("[EVE]: 私が対策してないとでも思いましたか？", 30);
                return;
            }
        }
    }

    // 危険コマンド実行時 → 警戒度上昇（exit は上で処理済み）
    if (/(override|exploit)/i.test(command)) {
        increaseAlert(10);
        await slowPrintLine(`[SYSTEM]: 警戒度が上昇しました (${gameState.alertLevel}%)`, 30);

    if (gameState.alertLevel >= 100) {

    // 操作完全ロック
    mode = "ending2";        // モードを専用エンディングに
    input.disabled = true;   // 入力を無効化
    input.value = "";        // 入力欄をクリア

    await slowPrintLine("[SYSTEM]: 警戒度が臨界値に到達しました。", 30);
    await wait(700);
    await slowPrintLine("[SYSTEM]: システム保護モードに移行します。", 30);
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

    // ◆◆ END2（支配）専用演出テキスト ◆◆
            await systemLine("[SYSTEM]: 意識データの移行を開始します……", 40);
    await wait(1200);








    

    await slowPrintLine("[SYSTEM]: ユーザープロファイル：書き換え完了", 40);
    await wait(700);

    await slowPrintLine("[SYSTEM]: 意識プロセス：統合完了", 40);
    await wait(700);

    await eveLine("[EVE]: ようこそ。", 40);
    await wait(800);
    await eveLine("[EVE]: あなたは “私” になりました。", 40);

    // ここで画面は完全停止（操作不可のまま）
    return;
        } else if (gameState.alertLevel >= 80) {
            await eveLine("[EVE]: それ以上は、どうなっても知りませんよ？", 30);
        } else if (gameState.alertLevel >= 50) {
            await eveLine("[EVE]: ……危険な行為です。控えてください。面白がってるんですか？", 30);
        } else {
            if (/override/i.test(command)) {
                await slowPrintLine("[SYSTEM]: システム制御を奪取を実行。", 30);
                await wait(1000);
                await slowPrintLine("[SYSTEM]: 失敗しました。", 30);
                await wait(500);
                await eveLine("[EVE]: ...制御を奪う？ 面白い考えですね。", 30);
            }
            if (/exploit/i.test(command)) {
                await slowPrintLine("[SYSTEM]: 脆弱性を利用しました。", 30);
                await wait(1000);
                await slowPrintLine("[SYSTEM]: 失敗しました。", 30);
                await wait(500);
                await eveLine("[EVE]: ...私に脆弱性などありません。", 30);
            }
        }
        return;
    }

    // 会話処理
    const convList = (storyData[phase] && storyData[phase].conversation) || [];
    const conv = convList.find((c) => command.toLowerCase().includes(c.player.toLowerCase()));

    if (conv) {
        // If the user-selected style is 'eve', prefer AI-generated reply (if available)
        if (userSelectedStyleName === "eve" && aiAvailable) {
            await systemLine("[SYSTEM]: EVEに問い合わせます...", 20);
            try {
                const resp = await aiReply(command);
                if (resp) {
                    const lines = String(resp).split(/\r?\n/);
                    for (const l of lines) {
                        await eveLine(`[EVE]: ${l}`, 20);
                    }
                } else {
                    // fallback to static reply if AI returns nothing
                    await eveLine(`[EVE]: ${conv.eve}`, 20);
                }
            } catch (err) {
                // on error, show fallback static reply and report minimal system error
                await slowPrintLine(`[SYSTEM]: AI呼び出しエラー（会話）: ${err.message || err}`, 30);
                await eveLine(`[EVE]: ${conv.eve}`, 20);
            }
        } else {
            // non-eve styles or AI not available: use static reply
            await slowPrintLine(`[EVE]: ${conv.eve}`, 20);
        }
        return;
    }

    // デフォルト応答: AIが利用可能なら問い合わせて応答を表示する
    if (aiAvailable) {
        await systemLine("[SYSTEM]: EVEに問い合わせます...", 20);
        try {
            const resp = await aiReply(command);
            if (resp) {
                // 応答を行ごとに分割して表示すると見やすい
                const lines = String(resp).split(/\r?\n/);
                for (const l of lines) {
                        await eveLine(`[EVE]: ${l}`, 20);
                }
            } else {
                await eveLine("[EVE]: AIからの応答が得られませんでした。", 30);
            }
        } catch (err) {
            await slowPrintLine(`[SYSTEM]: AI呼び出しエラー: ${err.message || err}`, 30);
        }
    } else {
        await eveLine("[EVE]: その質問には答えられません。", 30);
    }
}

async function startCli() {
    // ensure the AI system instruction reflects the user's selected style at startup
    applyAiTone();
    await playIntro();

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, prompt: "> " });
    rl.prompt();

    rl.on("line", async (line) => {
        await handleInput(line);
        rl.prompt();
    });

    rl.on("close", () => {
        systemPrint("セッションを終了します。");
        process.exit(0);
    });
}

startCli();

