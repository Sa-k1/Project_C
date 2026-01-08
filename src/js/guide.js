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
    taskbarClock.addEventListener('click', () => {
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
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message-eve';
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
    
    // メッセージカウントを増やす
    messageCount++;
    
    // 自動メッセージの場合、パネルが閉じていたら未読カウントを増やす
    if (!notificationPanel.classList.contains('show')) {
        unreadCount++;
        updateChatBadge();
    }
}

// EVEから自動的にメッセージを送る関数（グローバルで使用可能）
window.sendEveMessage = function(message, title = '') {
    addEveMessage(message, title);
};

// ========================
// 特定条件でEVEからメッセージを送る例
// ========================

// 例1: 起動から10秒後にメッセージ（他のメッセージがない場合のみ）
setTimeout(() => {
    if (messageCount === 0) {
        window.sendEveMessage('まだそこにいますか？', 'システムチェック');
    }
}, 10000);

