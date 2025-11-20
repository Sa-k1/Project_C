// xterm_demo.js — ブラウザ向け版（ストーリー統合）
// このファイルはブラウザのプレーンな `<script>` タグで読み込むことを想定しています。

(async function() {
const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';
if (!isBrowser) {
    console.error('xterm_demo.js: not running in a browser environment.');
    return;
}

// xterm と FitAddon はグローバル変数として利用可能であること
const { Terminal } = window;
const { FitAddon } = window;
if (!Terminal) {
    document.getElementById('terminal').innerText = 'xterm not loaded. Check network or CDN.';
    return;
}

// fnc.js を動的に読み込みます（ブラウザ環境で、同じディレクトリ構成を想定）
function loadFncScript(){
    return new Promise((resolve, reject) => {
        if (window.EVE_FNC_LOADED) return resolve();
        const s = document.createElement('script');
        // Resolve path relative to this script's location so the demo works from subfolders
        const current = document.currentScript && document.currentScript.src ? document.currentScript.src : window.location.href;
        const fncUrl = new URL('src/js/fnc.js', current).href;
        s.src = fncUrl;
        s.defer = true;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error('failed to load src/js/fnc.js'));
        document.head.appendChild(s);
    });
}

// -------------------------
// ストーリーデータとゲーム状態
// -------------------------
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
            { player: "exit", eve: "exitコマンドを検出しました。 終了しますか？" }
        ]
    }
};

// NOTE: 関数やAI状態の大部分は `src/js/fnc.js` に移動しました。
//       ここでは `fnc.js` を読み込んでから残りの初期化を続行します。
const GoogleGenAI = window.GoogleGenAI;
let chat = null;
const fallbackServer = window.AI_PROXY_ENDPOINT || 'http://localhost:3000/api/chat';

const term = new Terminal({
    cursorBlink: true,
    fontFamily: 'Courier New, monospace',
    fontSize: 14,
    theme: { background: '#000', foreground: '#ffffffff', cursor: '#ffffffff' }
});

const fitAddon = (typeof FitAddon === 'function' && new FitAddon()) || 
    (FitAddon && new FitAddon.FitAddon ? new FitAddon.FitAddon() : null);
if (fitAddon) term.loadAddon(fitAddon);
term.open(document.getElementById('terminal'));
if (fitAddon && typeof fitAddon.fit === 'function') fitAddon.fit();

// 関数や状態は外部ファイル（fnc.js）で定義されます。読み込み後に利用してください。

// -------------------------
// メイン処理
// -------------------------
let buffer = '';
let inputEnabled = false;

// 外部関数ファイルを読み込み、必要なグローバル参照をセットしてから初期化を行う
try {
    await loadFncScript();
    // fnc.js 側で定義した関数は window に配置される想定
    window.term = term;
    window.chat = chat;
    window.fallbackServer = fallbackServer;
    window.storyData = storyData;

    if (typeof window.applyAiTone === 'function') window.applyAiTone();
    if (typeof window.playIntro === 'function') {
        window.playIntro().then(() => {
            inputEnabled = true;
            term.write('C:\\Users> ');
        });
    }
} catch (err) {
    console.error('Failed to load fnc.js:', err);
    // 最低限の動作継続のために表示
    term.write('\r\n[SYSTEM]: 内部スクリプトの読み込みに失敗しました。\r\n');
}

term.onData(async data => {
    if (!inputEnabled) return;
    
    for (let i = 0; i < data.length; i++) {
        const ch = data[i];
        const code = ch.charCodeAt(0);
        
        if (code === 13) { // Enter
            term.write('\r\n');
            const userMessage = buffer.trim();
            buffer = '';
            
            if (userMessage) {
                inputEnabled = false;
                await handleInput(userMessage);
                inputEnabled = true;
            }
            
            term.write('C:\\Users> ');
        } else if (code === 127 || code === 8) { // Backspace
            if (buffer.length > 0) {
                buffer = buffer.slice(0, -1);
                term.write('\b \b');
            }
        } else if (code >= 32) {
            buffer += ch;
            term.write(ch);
        }
    }
});

window.addEventListener('resize', () => { 
    if (fitAddon && typeof fitAddon.fit === 'function') fitAddon.fit(); 
});

})();