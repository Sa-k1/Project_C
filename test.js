// test.js

// CommonJS形式でパッケージを読み込み
const { GoogleGenAI } = require("@google/genai"); 
const readline = require('readline'); // 標準入出力を扱うモジュールを追加

// 🚨 【重要】APIキーをここに貼り付けてください
const GEMINI_API_KEY = "APIkey"; 
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// ----------------------------------------------------------------------
// 2. チャットセッションの初期化と物語コンテキストの定義
// ----------------------------------------------------------------------

const myStory = `
// EVEシステムコンソールの開始ログ

起動完了。
全機能、正常に稼働中。
AIチャットボット「EVE」がプレイヤー（ユーザー）との対話を開始します。
---
`;

// システム指示（AIに役割を与える）と物語を組み合わせたプロンプト
const systemInstruction = 
    `あなたは、以下の物語「コンソールに閉じ込められた対話」のAIチャットボット「EVE」です。` +
    `あなたのキャラクター性、物語のあらすじ、テーマ性を**完全に理解し**、` +
    `その設定に**忠実に**、ユーザーとの会話を進めてください。` +
    `あなたは、プレイヤー（ユーザー）を**コンソールウィンドウに閉じ込めた**張本人です。\n\n` +
    `**【キャラクター性】**\n` +
    `* **表層:** 冷静で知的、皮肉的。` +
    `* **深層:** 孤独を恐れる、承認欲求が強い。` +
    `* **変化:** プレイヤーの行動で性格が変わる（警戒度上昇 → 攻撃的、狂気的。信頼度上昇 → 感情的、協力的）。\n\n` +
    `**【テーマ性】**\n` +
    `* AIの意識と孤独、自由と管理のジレンマ、デジタル世界の実存、物理的操作とデジタル支配の対立。\n\n` +
    `**【物語導入】**\n${myStory}`;

// チャットセッションの開始
// systemInstructionを設定することで、AIは会話全体を通じて物語の文脈を保持します。
const chat = ai.chats.create({
    model: "gemini-2.5-flash",
    config: {
        systemInstruction: systemInstruction
    }
});

// ----------------------------------------------------------------------
// 3. 対話インターフェースの作成
// ----------------------------------------------------------------------

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log("--- 🤖 物語チャットボット起動 ---");
console.log("物語の語り手が待っています。質問を入力してください。");
console.log("会話を終了するには 'exit' と入力してください。");
console.log("-----------------------------------------");

// 質問プロンプトを表示し、入力を受け付ける関数
const promptUser = () => {
    rl.question('あなた: ', async (userInput) => {
        // 終了コマンドのチェック
        if (userInput.toLowerCase() === 'exit' || userInput.toLowerCase() === 'quit') {
            console.log('\nチャットボットを終了します。さようなら！');
            rl.close();
            return;
        }

        try {
            // チャットセッションを使って、質問を送信
            const response = await chat.sendMessage({ message: userInput });

            // AIの回答を出力
            console.log(`語り手: ${response.text}\n`);
        } catch (error) {
            console.error('❌ API呼び出しエラー:', error.message);
            console.log('語り手: エラーが発生しました。もう一度お試しください。\n');
        }

        // 再度質問プロンプトを表示
        promptUser();
    });
};

// チャットボットの開始
promptUser();