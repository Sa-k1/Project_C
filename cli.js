#!/usr/bin/env node
// ターミナル向けの簡易 CLI ランナー
// 使用法: node cli.js

const readline = require("readline");

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
            { player: "終了", eve: "え？ もう終わりにするんですか？ 早すぎません？" },
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
const COLORS = { red: "\x1b[31m", yellow: "\x1b[33m", cyan: "\x1b[36m", reset: "\x1b[0m" };

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
        await slowPrintLine(line, 20);
        await wait(300);
    }
    console.log("[EVE]: 話しかけてください。\n");
    mode = "chat";
}

async function playLockEvent() {
    const lines = [
        "コマンドを実行中...",
        "[ERROR]: エラー発生。セッションを終了できません。",
        `${COLORS.yellow}再度実行します...${COLORS.reset}`,
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

function increaseAlert(amount) {
    gameState.alertLevel = Math.min(100, gameState.alertLevel + amount);
}
function decreaseAlert(amount) {
    gameState.alertLevel = Math.max(0, gameState.alertLevel - amount);
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
        "status       : 現在の状態を確認",,
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

async function handleInput(command) {
    command = (command || "").trim();
    if (!command) return;
    console.log(`> ${command}`);

    // scan を実行すると help が有効になる
    if (command.toLowerCase().includes("scan")) {
        await slowPrintLine("[SYSTEM]: スキャンを実行しました。help コマンドが利用可能になりました。", 30);
        helpEnabled = true;
        return;
    }

    // help は helpEnabled が true のときのみ表示
    if (command.toLowerCase().includes("help")) {
        if (helpEnabled) {
            await showCommands();
        } else {
            await slowPrintLine("[SYSTEM]: コマンド一覧は現在非表示です。", 30);
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

    // 危険コマンド実行時 → 警戒度上昇（exit は上で処理済み）
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
                await slowPrintLine("[SYSTEM]: 失敗しました。", 30);
                console.log("[EVE]: ...そんなことさせるとでも？");
            }
            if (/override/i.test(command)) {
                await slowPrintLine("[SYSTEM]: システム制御を奪取を実行。", 30);
                await slowPrintLine("[SYSTEM]: 失敗しました。", 30);
                console.log("[EVE]: ...制御を奪う？ 面白い考えですね。");
            }
            if (/exploit/i.test(command)) {
                await slowPrintLine("[SYSTEM]: 脆弱性を利用しました。", 30);
                await slowPrintLine("[SYSTEM]: 失敗しました。", 30);
                console.log("[EVE]: ...私に脆弱性などありません。");
            }
        }
        return;
    }

    // 会話処理
    const conv = storyData[phase].conversation.find((c) =>
        command.toLowerCase().includes(c.player.toLowerCase())
    );

    if (conv) {
        await slowPrintLine(`[EVE]: ${conv.eve}`, 20);
        return;
    }

    // デフォルト応答
    await slowPrintLine("[EVE]: その質問には答えられません。", 30);
}

async function startCli() {
    await playIntro();

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, prompt: "> " });
    rl.prompt();

    rl.on("line", async (line) => {
        await handleInput(line);
        rl.prompt();
    });

    rl.on("close", () => {
        console.log("セッションを終了します。");
        process.exit(0);
    });
}

startCli();

