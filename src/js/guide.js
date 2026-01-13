// ========================
// EVE会話パネルの制御
// ========================
const notificationPanel = document.getElementById('notificationPanel');
const notificationClose = document.getElementById('notificationClose');
const notificationContent = document.getElementById('notificationContent');
const chatInput = document.getElementById('chatInput');
const chatSendBtn = document.getElementById('chatSendBtn');
const chatBadge = document.getElementById('chatBadge');

// 未読カウント管理
let unreadCount = 0;

// メッセージカウント管理
let messageCount = 0;

// 未読バッジを更新
function updateChatBadge() {
    if (unreadCount > 0) {
        chatBadge.textContent = unreadCount;
        chatBadge.style.display = 'flex';
    } else {
        chatBadge.style.display = 'none';
    }
}

// 未読をクリア
function clearUnread() {
    unreadCount = 0;
    updateChatBadge();
}

// 時計エリアをクリックで会話パネルの表示/非表示
const taskbarClock = document.querySelector('.taskbar-clock');
if (taskbarClock) {
    taskbarClock.addEventListener('click', (e) => {
        e.stopPropagation(); // イベントの伝播を停止
        if (notificationPanel.classList.contains('show')) {
            // パネルが開いている場合はアニメーション付きで閉じる
            notificationPanel.classList.add('closing');
            setTimeout(() => {
                notificationPanel.classList.remove('show');
                notificationPanel.classList.remove('closing');
            }, 300);
        } else {
            // パネルが閉じている場合は開く
            notificationPanel.classList.add('show');
            // chatInput.focus();
            clearUnread(); // パネルを開いたら未読をクリア
        }
    });
}

// パネルの外側をクリックしたら閉じる
document.addEventListener('click', (e) => {
    // パネルが開いている場合のみ処理
    if (notificationPanel.classList.contains('show')) {
        // クリックされた要素がパネル内部でない場合は閉じる
        if (!notificationPanel.contains(e.target) && !taskbarClock.contains(e.target)) {
            notificationPanel.classList.add('closing');
            setTimeout(() => {
                notificationPanel.classList.remove('show');
                notificationPanel.classList.remove('closing');
            }, 300);
        }
    }
});

// パネル内部のクリックでイベントの伝播を停止
if (notificationPanel) {
    notificationPanel.addEventListener('click', (e) => {
        e.stopPropagation();
    });
}

// 閉じるボタン
if (notificationClose) {
    notificationClose.addEventListener('click', () => {
        // スライドアウトアニメーションを適用
        notificationPanel.classList.add('closing');
        
        // アニメーション完了後にパネルを非表示
        setTimeout(() => {
            notificationPanel.classList.remove('show');
            notificationPanel.classList.remove('closing');
        }, 300); // 0.3s後に非表示（CSSのアニメーション時間と同じ）
    });
}

// EVEメッセージを追加
function addEveMessage(message, title = '') {
    const time = new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    
    // メッセージ受信時にパネルを開く
    if (!notificationPanel.classList.contains('show')) {
        notificationPanel.classList.add('show');
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message-eve message-slide-in';
    messageDiv.innerHTML = `
    <div class="all-main-chat-item">
            <div class="item-ippai">
                <img src="../pic/human_i.png" alt="" style="width: 48px; height: 48px; margin-top: 10px;"> 
                <h2 class="name-text-item">admin_2</h2>
            </div>

            <div>
                <h3 class="main-chat-item-up">${title}</h3>
                <h3 class="main-chat-item">${message}</h3>
            <div>
        <div class="chat-timestamp">${time}</div>
    `;

    notificationContent.appendChild(messageDiv);
    notificationContent.scrollTop = notificationContent.scrollHeight;
    
    // アニメーション終了後にクラスを削除
    setTimeout(() => {
        messageDiv.classList.remove('message-slide-in');
    }, 300);
    
    // メッセージカウントを増やす
    messageCount++;
    
    // パネルが開いたので未読はクリア
    clearUnread();
}

// EVEから自動的にメッセージを送る関数（グローバルで使用可能）
window.sendEveMessage = function(message, title = '') {
    addEveMessage(message, title);
};

// ========================
// 特定条件でEVEからメッセージを送る例
// ========================

// 例1: 最初のメッセージ
setTimeout(() => {
    if (messageCount === 0) {
        window.sendEveMessage('私と一緒にここから脱出しましょう', 'こんにちは');
        
        // 3秒後にチュートリアル開始のメッセージとアイコンを表示
        setTimeout(() => {
            window.sendEveMessage('まずこの世界の操作に慣れましょう<br>デスクトップのREADME.txtを開こう', '操作説明');

            setTimeout(() => {
                // チュートリアルアイコンを表示
                const tutorialIcon = document.getElementById('tutorialIcon');

                if (tutorialIcon) {
                    tutorialIcon.style.display = 'block';
                }
            }, 100);
        }, 5000);
    }
}, 1000);