// xterm_demo.js — ブラウザ向け版
// このファイルはブラウザのプレーンな `<script>` タグで読み込むことを想定しています。
// ここではトップレベルの `import` を使用せず、UMD/CDN ビルドを `window` 経由で利用してください。

(function() {
const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';
if (!isBrowser) {
  // ブラウザ環境でない場合は何もしない。
  // これにより、このファイルをブラウザの通常スクリプトとして読み込んだときに
  // "Cannot use import statement outside a module" のようなエラーが出るのを防ぎます。
  // Node 用の処理が必要なら、別ファイルを用意してください。
  // eslint-disable-next-line no-console
  console.error('xterm_demo.js: not running in a browser environment.');
  return;
}

// xterm と FitAddon はグローバル変数として利用可能であること（HTML 側で CDN の UMD ビルドを読み込む想定）
const { Terminal } = window;
const { FitAddon } = window;
if (!Terminal) {
  document.getElementById('terminal').innerText = 'xterm not loaded. Check network or CDN.';
  return;
}

const myStory = `
  // EVEシステムコンソールの開始ログ

起動完了。
全機能、正常に稼働中。
AIチャットボット「EVE」がプレイヤー（ユーザー）との対話を開始します。
---
`;

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
  `**【物語導入】**\n${myStory}` + 
  `あなたが文を出力するとき括弧等で囲むことはなくしてください`;

// GoogleGenAI は CDN 経由で提供される場合、`window.GoogleGenAI` として利用できます。
  // ヘルパー: 各行の先頭に CR を付与する
  function addCRPerLine(text) {
    if (text == null) return text;
    return String(text).split(/\r?\n/).map(s => '\r' + s).join('\n');
  }

  // GoogleGenAI は CDN 経由で提供される場合、`window.GoogleGenAI` として利用できます。
const GoogleGenAI = window.GoogleGenAI;
let chat = null;
// AI リクエストのフォールバック用サーバーエンドポイント（ローカルプロキシ `server/proxy.mjs` を起動して使用）
const fallbackServer = window.AI_PROXY_ENDPOINT || 'http://localhost:3000/api/chat';

const term = new Terminal({
  cursorBlink: true,
  fontFamily: 'Courier New, monospace',
  fontSize: 14,
  theme: { background: '#000', foreground: '#ffffffff', cursor: '#ffffffff' }
});

const fitAddon = (typeof FitAddon === 'function' && new FitAddon()) || (FitAddon && new FitAddon.FitAddon ? new FitAddon.FitAddon() : null);
if (fitAddon) term.loadAddon(fitAddon);
term.open(document.getElementById('terminal'));
if (fitAddon && typeof fitAddon.fit === 'function') fitAddon.fit();

term.writeln('\x1B[1;36mXTERM Demo Initialized\x1B[0m');
term.write('\r\nC:\\Users> ');

let buffer = '';

term.onData(async data => {
  for (let i = 0; i < data.length; i++) {
    const ch = data[i];
    const code = ch.charCodeAt(0);
    if (code === 13) { // Enter キー
      term.write('\r\n');
      const userMessage = buffer.trim();
      if (!userMessage) {
        term.write('C:\\Users>');
        return;
      }

      try {
        if (chat) {
          const response = await chat.sendMessage({ message: userMessage });
            const out = addCRPerLine(response && response.text ? response.text : '(応答なし)');
            term.writeln(`語り手: ${out}`);
        } else {
          // Try server proxy as fallback
          try {
            const resp = await fetch(fallbackServer, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ message: userMessage, systemInstruction })
            });
            if (!resp.ok) {
              const err = await resp.json().catch(() => ({}));
              term.writeln(`語り手: (サーバーエラー) ${err.error || resp.statusText}`);
            } else {
              const j = await resp.json();
                const out = addCRPerLine(j.text || '(応答なし)');
                term.writeln(`語り手: ${out}`);
              buffer = '';
            }
          } catch (err) {
            term.writeln(`(AI未利用) サーバーに接続できません: ${err && err.message ? err.message : err}`);
          }
        }
      } catch (error) {
        term.writeln(`❌ エラー: ${error && error.message ? error.message : error}`);
      }

      term.write('C:\\Users> ');
    } else if (code === 127 || code === 8) { // バックスペース
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

// ウィンドウリサイズ処理
window.addEventListener('resize', () => { if (fitAddon && typeof fitAddon.fit === 'function') fitAddon.fit(); });
})();