import { storyData } from "./story/story.js";

const terminal = document.getElementById("terminal");
const input = document.getElementById("player-input");

let phase = "phase0";
let step = 0;
let mode = "intro"; // intro → chat → locked → ending



// タイプ風出力
function slowPrint(text, delay = 35) {
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

// 一定時間待つ
function wait(ms) {
    return new Promise(res => setTimeout(res, ms));
}


// Phase0導入
async function playIntro() {
    for (const line of storyData[phase].intro) {
    await slowPrint(line);
    await wait(400);
    }
    await slowPrint("[EVE]: 話しかけてください。");
    mode = "chat";
}

// プレイヤー入力処理
async function handleInput(command) {
    if (!command) return;
    await slowPrint(`> ${command}`);

    // help は常にコマンド一覧を表示する
    if (command.toLowerCase().includes("help")) {
        await showCommands();
        terminal.scrollTop = terminal.scrollHeight;
        return;
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
      // 「終了」や「exit」が含まれると異変へ移行
        if (command.toLowerCase().includes("exit") || command.includes("終了")) {
            mode = "locked";
            await wait(800);
            await playLockEvent();
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
        await showHelp(); 
    } else {
        await slowPrint("[EVE]: あなたの入力は記録されています。続けてください。");
    }
    }

    terminal.scrollTop = terminal.scrollHeight;
}

// 異変イベント（Phase0 → Phase1への導入）
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
        await slowPrint(line, 30);
        await wait(600);
    }

        await slowPrint("[EVE]: ここにいる間、あなたは安全です。たぶん。");
}

input.addEventListener("keydown", async e => {
    if (e.key === "Enter") {
    const command = input.value.trim();
    input.value = "";
    await handleInput(command);
    }
});

playIntro();
