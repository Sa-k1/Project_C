const storyText = document.getElementById('storyText');
const endContainer = document.getElementById('endContainer');
let canClick = false;
let currentLine = 0;

const lines = [
    'システムは停止した。',
    '静寂が広がる。',
    'しかし、ログの片隅に一行だけ残っていた。',
    '「削除完了。次のユーザーを待機中。」',
    'あなたは本当に<span class="highlight">最初の</span>ユーザーだったのだろうか。',
];

function showLine() {
if (currentLine >= lines.length) {
    // 全文表示完了、クリック可能に
    canClick = true;
    // 最後の行にクリックインジケーターを追加
    const lastP = storyText.lastElementChild;
    if (lastP) {
        const indicator = document.createElement('span');
        indicator.className = 'click-indicator';
        indicator.textContent = ' ▼';
        lastP.appendChild(indicator);
    }
    return;
}

const line = lines[currentLine];
const p = document.createElement('p');

if (line === '') {
    p.innerHTML = '&nbsp;';
} else {
    p.innerHTML = line;
}

p.style.opacity = '0';
storyText.appendChild(p);

// フェードイン
setTimeout(() => {
    p.style.transition = 'opacity 1s ease-out';
    p.style.opacity = '1';
}, 100);

currentLine++;

// 次の行を自動で表示
setTimeout(() => {
    showLine();
}, 1500);
}

// 最初の行を表示
setTimeout(() => {
    showLine();
}, 500);

// クリックでEND表示（全文表示後のみ）
document.addEventListener('click', () => {
    if (!canClick) return;
        canClick = false;

// クリックインジケーターを削除
const indicators = document.querySelectorAll('.click-indicator');
indicators.forEach(ind => ind.remove());

// ストーリーテキストをフェードアウト
storyText.style.transition = 'opacity 1.5s ease-out';
storyText.style.opacity = '0';

// END表示（画面中央）
setTimeout(() => {
    endContainer.classList.add('fade-in');
}, 1500);
});