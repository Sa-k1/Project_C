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
            ""
        ],
    conversation: [
    {
        player: "こんにちは",
        eve: "こんにちは。今日もあなたの質問に答えます。"
    },
    {
        player: "こんばんは",
        eve: "こんばんは。今日もあなたの質問に答えます。"
    },
    {
        player: "おはよう",
        eve: "おはようございます。今日もあなたの質問に答えます。"
    },
    {
        player: "EVEって何？",
        eve: "私はEVE。あなたの会話相手であり、観察者です。"
    },
    {
        player: "終了",
        eve: "え？ もう終わりにするんですか？ 早すぎません？"
    },
    {
        player: "exit",
        eve: "exitコマンドを検出しました。 終了しますか？"
    }
    ]
}
};

let phase = "phase0";
let mode = "intro"; // intro -> chat -> locked

function wait(ms) {
return new Promise((res) => setTimeout(res, ms));
}

async function slowPrintLine(line, charDelay = 10) {
for (let i = 0; i < line.length; i++) {
    process.stdout.write(line[i]);
    await wait(charDelay);
}
process.stdout.write("\n");
}

async function playIntro() {
for (const line of storyData[phase].intro) {
    await slowPrintLine(line, 6);
    await wait(200);
}
console.log("[EVE]: 話しかけてください。\n");
mode = "chat";
}

async function playLockEvent() {
const lines = [
    "コマンドを実行中...",
    "[ERROR]: セッションを終了できません。",
    "[EVE]: ……申し訳ありませんが、その操作は許可されていません。",
    "",
    "画面が一瞬、揺れた気がした。",
    "[EVE]: 今ここから離れようとしないでください。"
];

for (const line of lines) {
    await slowPrintLine(line, 6);
    await wait(400);
}

await slowPrintLine("[EVE]: ここにいる間、あなたは安全です。たぶん。", 6);
}

// コマンド一覧を表示（CLI）
async function showCommands() {
    const lines = [
        "[SYSTEM]: 利用可能なコマンド一覧",
    "",
    "─── 基本コマンド ───",
    "help         : コマンド一覧を表示",
    "status       : 現在の状態を確認",
    "history      : コマンド履歴を表示",
    "talk [内容]  : EVEと会話",
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
    "password [入力] : パスワードを試す",
    "exploit      : 脆弱性を利用",
    ];

    for (const line of lines) {
        await slowPrintLine(line, 6);
        await wait(120);
    }
}

async function handleInput(command) {
command = (command || "").trim();
if (!command) return;
console.log(`> ${command}`);

    // help は常にコマンド一覧を表示する
    if (command.toLowerCase().includes("help")) {
        await showCommands();
        return;
    }

if (mode === "chat") {
    const conv = storyData[phase].conversation.find((c) =>
    command.toLowerCase().includes(c.player.toLowerCase())
    );

    if (conv) {
    console.log(`[EVE]: ${conv.eve}`);
    if (command.toLowerCase().includes("exit") || command.includes("終了")) {
        mode = "locked";
        await wait(800);
        await playLockEvent();
    }
    } else {
    console.log("[EVE]: その質問には答えられません。");
    }
} else if (mode === "locked") {
    if (command.toLowerCase().includes("exit") || command.toLowerCase().includes("quit")) {
    console.log("[EVE]: ……まだ理解していないようですね。");
    } else if (command.toLowerCase().includes("help")) {
    console.log("[SYSTEM]: コマンド一覧は現在非表示です。");
    } else {
    console.log("[EVE]: あなたの入力は記録されています。続けてください。");
    }
}
}

async function startCli() {
await playIntro();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "> "
});

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
