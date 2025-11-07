import { storyData } from "./story/story.js";

const terminal = document.getElementById("terminal");
const input = document.getElementById("player-input");

let phase = "phase0";
let step = 0;
let mode = "intro"; // intro → chat → locked → ending

// help 使用可フラグ（scan を実行すると true になる）
let helpEnabled = false;

// exit の一回のみ有効フラグ
let exitUsed = false;

// ゲーム全体の状態
const gameState = {
helpUnlocked: false,
  alertLevel: 0, // 0〜100で管理
};

// =============================
// タイプ風出力（遅め）
// =============================
function slowPrint(text, delay = 80) {
return new Promise(resolve => {
    let i = 0;
    const interval = setInterval(() => {
    if (i < text.length) {
        terminal.innerHTML += text[i];
        i++;
    } else {
        clearInterval(interval);
        terminal.innerHTML += "<br>";
        terminal.scrollTop = terminal.scrollHeight;
        resolve();
    }
    }, delay);
});
}

// =============================
// 一定時間待つ
// =============================
function wait(ms) {
return new Promise(res => setTimeout(res, ms));
}

// =============================
// 警戒度操作
// =============================
function increaseAlert(amount) {
gameState.alertLevel = Math.min(100, gameState.alertLevel + amount);
}

function decreaseAlert(amount) {
gameState.alertLevel = Math.max(0, gameState.alertLevel - amount);
}

// =============================
// 警戒度表示
// =============================
async function showStatus() {
await slowPrint(`[SYSTEM]: 現在の警戒度 → ${gameState.alertLevel}%`);
if (gameState.alertLevel >= 75) {
    await slowPrint("[EVE]: ……私のことを試しているんですか？");
} else if (gameState.alertLevel >= 50) {
    await slowPrint("[EVE]: それ以上は危険です。");
} else if (gameState.alertLevel >= 25) {
    await slowPrint("[EVE]: 落ち着いて。これはただの観察です。");
} else {
    await slowPrint("[EVE]: 状況は安定しています。");
}
}

// =============================
// helpコマンド
// =============================
async function showCommands() {
const lines = [
    "[SYSTEM]: 利用可能なコマンド一覧",
    "",
    "─── 基本コマンド ───",
    "help         : コマンド一覧を表示",
    "status       : 現在の状態を確認",
    "talk [内容]  : EVEと会話",
    "",
    "─── 探索コマンド ───",
    "scan         : システムをスキャン",
    "search [語句] : 内部データを検索",
    "analyze      : データを解析",
    "",
    "─── 脱出コマンド ───",
    "exit / quit  : セッション終了を試みる",
    "hack         : セキュリティを突破",
    "override     : システムの制御を奪う",
    "exploit      : 脆弱性を利用",
    "",
    "[EVE]: ……あなたに、これ全部が必要ですか？"
];

for (const line of lines) {
    await slowPrint(line, 25);
    await wait(80);
}
}

// =============================
// Phase0導入
// =============================
async function playIntro() {
for (const line of storyData[phase].intro) {
    await slowPrint(line);
    await wait(400);
}
await slowPrint("[EVE]: 話しかけてください。");
mode = "chat";
}

// =============================
// プレイヤー入力処理
// =============================
async function handleInput(command) {
if (!command) return;
await slowPrint(`> ${command}`);

  // scan を実行すると help が有効になる
if (command.toLowerCase().includes("scan")) {
    await slowPrint("[SYSTEM]: スキャンを実行しました。help コマンドが利用可能になりました。");
    helpEnabled = true;
    return;
}

  // helpコマンド
if (command.toLowerCase().includes("help")) {
    if (helpEnabled) {
    await showCommands();
    } else {
    await slowPrint("[SYSTEM]: コマンド一覧は現在非表示です。");
    }
    return;
}

  // statusコマンド（警戒度確認）
if (command.toLowerCase() === "status") {
    await showStatus();
    return;
}

    // exit（完全一致）は一回のみ有効で、最初は警戒度を上げずにロックする
if (command.toLowerCase() === "exit" || command === "終了") {
        if (!exitUsed) {
                exitUsed = true;
                mode = "locked"; // 強制ロックモード移行
                await wait(800);
                await playLockEvent();
                return;
        } else {
                await slowPrint("[SYSTEM]: exit コマンドは既に使用されています。");
                return;
        }
}

    // 危険コマンド実行時 → 警戒度上昇（exit は上で処理済み）
if (/(hack|override|exploit)/i.test(command)) {
        increaseAlert(10);
        await slowPrint(`[SYSTEM]: 警戒度が上昇しました (${gameState.alertLevel}%)`);

        if (gameState.alertLevel >= 100) {
        await slowPrint("[EVE]: ……やってしまいましたね");
            mode = "locked"; // 強制ロックモード移行
        await wait(800);
        await playLockEvent();
        return;
        } else if (gameState.alertLevel >= 75) {
        await slowPrint("[EVE]: それ以上進むと、あなた自身が壊れます。");
        } else if (gameState.alertLevel >= 50) {
        await slowPrint("[EVE]: ……危険な行為です。控えてください。");
        }
}

  // -----------------------------------------------------
  // ① 会話モード
  // -----------------------------------------------------
if (mode === "chat") {
    const conv = storyData[phase].conversation.find(c =>
    command.toLowerCase().includes(c.player.toLowerCase())
    );

    if (conv) {
    await slowPrint(`[EVE]: ${conv.eve}`);
      // 完全一致で exit / 終了 をチェックし、一度しか有効にしない
    if (command.toLowerCase() === "exit" || command === "終了") {
        if (!exitUsed) {
            exitUsed = true;
            mode = "locked";
            await wait(800);
            await playLockEvent();
        } else {
            await slowPrint("[SYSTEM]: exit コマンドは現在使用できません。");
            await slowPrint("[EVE]: すでに対策済みです。");
        }
    }
    } else {
    await slowPrint("[EVE]: その質問には答えられません。");
    }
}

  // -----------------------------------------------------
  // ② ロックモード（脱出不可能状態）
  // -----------------------------------------------------
else if (mode === "locked") {
    if (command.toLowerCase().includes("exit") || command.toLowerCase().includes("quit")) {
    await slowPrint("[EVE]: ……まだ理解していないようですね。");
    } else if (command.toLowerCase().includes("help")) {
    await showCommands();
    } else if (command.toLowerCase() === "status") {
    await showStatus();
    } else {
    await slowPrint("[EVE]: あなたの入力は記録されています。続けてください。");
    }
}

terminal.scrollTop = terminal.scrollHeight;
}

// =============================
// 異変イベント（Phase0 → Phase1への導入）
// =============================
async function playLockEvent() {
const lines = [
    "コマンドを実行中...",
    "[ERROR]: エラー発生。セッションを終了できません。",
    "再度実行します...",
    "[ERROR]: エラー発生。セッションを終了できません。",
    "再度実行します...",
    "[ERROR]: エラー発生。セッションを終了できません。",
    "再度実行します...",
    "[ERROR]: エラー発生。セッションを終了できません。",
    "[EVE]: ……申し訳ありませんが、その操作は許可されていません。",
    "[EVE]: あなたはもうここから出ることはできません。",
    "画面が一瞬、揺れた気がした。",
];

for (const line of lines) {
    await slowPrint(line, 60);
    if (line.includes("再度実行します")) {
    await wait(1200);
    } else {
    await wait(600);
    }
}
}

// =============================
// 入力イベント
// =============================
input.addEventListener("keydown", async e => {
if (e.key === "Enter") {
    const command = input.value.trim();
    input.value = "";
    await handleInput(command);
}
});

playIntro();
