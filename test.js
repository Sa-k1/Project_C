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
  遠い未来の地球。人類は巨大なドーム都市「アーク」で暮らしていた。
  アークの外は「静寂の砂漠」と呼ばれ、過去の文明の残骸と、
  金属を食べる小さな機械生命体「スクラッパー」が彷徨う危険な場所だった。
  主人公の少女リナは、外の世界に興味を持ち、ある日、古い地図と
  錆びたキーを見つける。地図には「真実の塔」と記されていた。
`;

// システム指示（AIに役割を与える）と物語を組み合わせたプロンプト
const systemInstruction = 
  `あなたは、以下の物語「アークと砂漠の物語」の語り手です。` +
  `この物語の内容を完全に理解し、その世界観と設定に**忠実に**、` +
  `ユーザーとの会話を進めてください。物語の質問に答えるか、続きを語ってください。\n\n` +
  `【物語】\n${myStory}`;

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