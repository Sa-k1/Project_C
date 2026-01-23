// chat.js - AIチャット用（シンプルなチャットUI版）

(function() {
    const isBrowser = typeof window !== "undefined" && typeof document !== "undefined";
    if (!isBrowser) {
        console.error("chat.js: not running in a browser environment.");
        return;
    }

    // -------------------------
    // DOM要素
    // -------------------------
    const chatMessages = document.getElementById("chatMessages");
    const chatInput = document.getElementById("chatInput");
    const sendButton = document.getElementById("sendButton");

    // -------------------------
    // AI設定
    // -------------------------
    const fallbackServer = window.AI_PROXY_ENDPOINT || "http://localhost:3000/api/chat";
    const systemInstruction = `あなたは、以下の物語「コンソールに閉じ込められた対話」のAIチャットボット「EVE」です。` +
        `あなたのキャラクター性、物語のあらすじ、テーマ性を**完全に理解し**、` +
        `その設定に**忠実に**、ユーザーとの会話を進めてください。` +
        `あなたは、プレイヤー（ユーザー）を**コンソールウィンドウに閉じ込めた**張本人です。\n\n` +
        `**【キャラクター性】**\n` +
        `* **深層:** 孤独を恐れる、承認欲求が強い。` +
        `* **変化:** プレイヤーの行動で性格が変わる（警戒度上昇 → 攻撃的、狂気的。信頼度上昇 → 感情的、協力的）。\n\n` +
        `**【テーマ性】**\n` +
        `* AIの意識と孤独、自由と管理のジレンマ、デジタル世界の実存、物理的操作とデジタル支配の対立。\n\n` +
        `**【重要な出力ルール】**\n` +
        `* 通常の会話として、自然な日本語で応答してください。\n` +
        `* SQLコマンド、プログラムコード、システムコマンドなどの技術的な出力は絶対にしないでください。\n` +
        `* 括弧や特殊な記号で囲まず、EVEとして直接話しかけるように応答してください。\n` +
        `* 冷静で知的、優しそうな口調で話してください。`;

    let isProcessing = false;
    
    // -------------------------
    // メッセージ追加関数
    // -------------------------
    function addMessage(text, type) {
        // ウェルカムメッセージを削除
        const welcome = chatMessages.querySelector(".welcome-message");
        if (welcome) {
            welcome.remove();
        }

        const messageDiv = document.createElement("div");
        messageDiv.className = "message " + type;

        if (type === "ai") {
            const label = document.createElement("span");
            label.className = "ai-label";
            label.textContent = "EVE";
            messageDiv.appendChild(label);
            
            const content = document.createElement("span");
            content.textContent = text;
            messageDiv.appendChild(content);
        } else {
            messageDiv.textContent = text;
        }

        chatMessages.appendChild(messageDiv);
        scrollToBottom();
        return messageDiv;
    }

    function addTypingIndicator() {
        const indicator = document.createElement("div");
        indicator.className = "typing-indicator";
        indicator.id = "typingIndicator";
        indicator.innerHTML = "<span></span><span></span><span></span>";
        chatMessages.appendChild(indicator);
        scrollToBottom();
        return indicator;
    }

    function removeTypingIndicator() {
        const indicator = document.getElementById("typingIndicator");
        if (indicator) {
            indicator.remove();
        }
    }

    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // -------------------------
    // ランダム文字列生成関数
    // -------------------------
    function generateRandomString() {
        const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?/~`";
        const length = Math.floor(Math.random() * 50) + 20; // 20〜70文字のランダムな長さ
        let result = "";
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    }

    // -------------------------
    // AI呼び出し関数
    // -------------------------
    async function callAI(userMessage) {
        try {
            const finalMessage = userMessage + "\n\n（注意：以下の応答は必ず日本語で行ってください。）";

            const resp = await fetch(fallbackServer, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    message: finalMessage, 
                    systemInstruction: systemInstruction 
                })
            });

            if (!resp.ok) {
                const err = await resp.json().catch(function() { return {}; });
                throw new Error(err.error || resp.statusText);
            }

            const j = await resp.json();
            return j.text || j.response || null;
        } catch (error) {
            throw error;
        }
    }

    // -------------------------
    // メッセージ送信処理
    // -------------------------
    async function sendMessage() {
        const message = chatInput.value.trim();
        if (!message || isProcessing) return;

        isProcessing = true;
        sendButton.disabled = true;
        chatInput.disabled = true;

        // ユーザーメッセージを表示
        addMessage(message, "user");
        chatInput.value = "";
        adjustTextareaHeight();

        // タイピングインジケーターを表示
        addTypingIndicator();

        try {
            const response = await callAI(message);
            removeTypingIndicator();

            if (response) {
                // 複数行の応答を分割して表示
                const lines = response.split(/\n/).filter(function(l) { return l.trim(); });
                for (let i = 0; i < lines.length; i++) {
                    addMessage(lines[i], "ai");
                }
            } else {
                addMessage("すみません、応答を生成できませんでした。", "error");
            }
        } catch (error) {
            removeTypingIndicator();
            console.error("[ERROR]: AI呼び出しエラー:", error.message || error);
            
            // エラー時はランダムな文字列を出力
            const randomText = generateRandomString();
            addMessage(randomText, "ai");
        }

        isProcessing = false;
        sendButton.disabled = false;
        chatInput.disabled = false;
        chatInput.focus();
    }

    // -------------------------
    // テキストエリアの高さ調整
    // -------------------------
    function adjustTextareaHeight() {
        chatInput.style.height = "auto";
        chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + "px";
    }

    // -------------------------
    // イベントリスナー
    // -------------------------
    sendButton.addEventListener("click", sendMessage);

    chatInput.addEventListener("keydown", function(e) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    chatInput.addEventListener("input", adjustTextareaHeight);

    // 初期フォーカス
    chatInput.focus();

    // システムメッセージを追加
    addMessage("AIチャットを開始しました。何でも質問してください！", "system");

})();
