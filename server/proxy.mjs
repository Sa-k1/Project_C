import express from 'express';
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
// JSON と URL エンコード済みリクエストボディをパースして `req.body` を設定します。
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const port = process.env.PORT || 3000;

// __dirname 相当を取得
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ファイルから API キーを読み取るフォールバック関数
function loadApiKeyFromFiles() {
  const candidates = [
    path.resolve(__dirname, '..', '.env'),
    path.resolve(__dirname, '.env'),
  ];

  for (const p of candidates) {
    try {
      if (!fs.existsSync(p)) continue;
      const content = fs.readFileSync(p, { encoding: 'utf8' });
      const lines = content.split(/\r?\n/);
      // .env 形式をパース
      for (const line of lines) {
        const s = line.trim();
        if (!s || s.startsWith('#')) continue;
        const eq = s.indexOf('=');
        if (eq > 0) {
          const k = s.slice(0, eq).trim();
          let v = s.slice(eq + 1).trim();
          // 先頭末尾の引用符を削除
          v = v.replace(/^"|"$/g, '').replace(/^'|'$/g, '');
          if (k === 'GOOGLE_API_KEY' || k === 'GEMINI_API_KEY') return v;
        }
      }
      // 単一行がキーのみの場合を許容
      const firstNonEmpty = lines.find(l => l.trim().length > 0 && !l.trim().startsWith('#'));
      if (firstNonEmpty) return firstNonEmpty.trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '');
    } catch (e) {
      // 無視して次へ
    }
  }

  return null;
}

// 環境変数が無ければファイルから読んで設定する
if (!process.env.GOOGLE_API_KEY && !process.env.GEMINI_API_KEY) {
  const key = loadApiKeyFromFiles();
  if (key) {
    process.env.GOOGLE_API_KEY = key;
    console.log('[proxy] loaded API key from file');
  }
}

// API キーは環境変数経由で渡すのが安全です。
// 優先順: GOOGLE_API_KEY, GEMINI_API_KEY
const API_KEY = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || null;
let ai = null;
if (API_KEY) {
  try {
    ai = new GoogleGenAI({ apiKey: API_KEY });
    console.log('[proxy] GoogleGenAI initialized');
  } catch (err) {
    console.warn('[proxy] GoogleGenAI の初期化に失敗しました:', err && err.message ? err.message : err);
  }
} else {
  console.warn('[proxy] GOOGLE_API_KEY / GEMINI_API_KEY が設定されていません。AI は無効化されます');
}


async function handleChat(req, res) {
  const { message, systemInstruction } = req.body || {};
  // 必須: message がなければエラーを返す
  if (!message) return res.status(400).json({ error: 'message required' });
  // サーバー側で AI が未設定ならエラー
  if (!ai) return res.status(500).json({ error: 'AI not configured on server' });
  try {
    // リクエストごとにチャットセッションを作成（ユーザー間で状態が混ざらないようにする）
    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: { systemInstruction: systemInstruction || '' }
    });

    // AI にメッセージを投げる
    const resp = await chat.sendMessage({ message });

    // 応答テキストをベストエフォートで抽出
    const text = resp && resp.text ? resp.text : (resp?.output?.[0]?.content?.[0]?.text || null);

    return res.json({ text, raw: resp });
  } catch (err) {
    console.error('[proxy] chat error', err && err.message ? err.message : err);
    return res.status(500).json({ error: err && err.message ? err.message : String(err) });
  }
}

app.post('/api/chat', handleChat);

// ハンドラと app をプログラム的に利用できるようエクスポート
export { app, handleChat };

// デフォルトではリッスンするが、組み込み利用時にポートを開きたくない場合は
// 環境変数 `DISABLE_SERVER=1` をセットしてからモジュールを読み込んでください。
if (process.env.DISABLE_SERVER !== '1') {
  app.listen(port, () => {
    console.log(`[proxy] listening on http://localhost:${port}`);
  });
} else {
  console.log('[proxy] server listening disabled by DISABLE_SERVER=1');
}
