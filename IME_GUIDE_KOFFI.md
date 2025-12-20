# IME監視機能 - 完全ガイド（koffi版）

⚡ **高速・軽量なIME監視機能** - PowerShell不要、直接Windows APIを呼び出し

## 🎉 特徴

- ✅ **PowerShell不要** - koffiで直接Windows APIを呼び出し
- ✅ **コンソールウィンドウ不要** - バックグラウンドプロセスなし
- ✅ **超高速** - ネイティブAPI呼び出し（1ms以下）
- ✅ **軽量** - CPU使用率ほぼゼロ
- ✅ **Visual Studio不要** - koffiはプリビルド済み

---

## 📦 インストール

### 1. 必要なパッケージ

```bash
npm install
```

**それだけです！** 追加のビルドツールやPowerShellスクリプトは不要です。

---

## インストールのみやってください
## インストールのみやってください
## インストールのみやってください
## インストールのみやってください
## インストールのみやってください
## インストールのみやってください

## 🚀 実装方法

### ステップ1: preload.jsを作成（プロジェクトルート）

```javascript
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getIMEStatus: () => ipcRenderer.invoke('get-ime-status')
});
```

### ステップ2: main.jsにkoffiコードを追加

```javascript
import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import koffi from 'koffi';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let imeMonitorInterval = null;
let lastIMEStatus = false;

// Windows APIの読み込み
let user32, imm32, GetForegroundWindow, ImmGetDefaultIMEWnd, SendMessageW;

try {
  user32 = koffi.load('user32.dll');
  imm32 = koffi.load('imm32.dll');
  
  GetForegroundWindow = user32.func('GetForegroundWindow', 'void*', []);
  ImmGetDefaultIMEWnd = imm32.func('ImmGetDefaultIMEWnd', 'void*', ['void*']);
  SendMessageW = user32.func('SendMessageW', 'long', ['void*', 'uint', 'void*', 'void*']);
  
  console.log('✅ Windows API読み込み成功');
} catch (error) {
  console.error('❌ Windows API読み込み失敗:', error);
}

// IME状態を直接取得
function checkIMEStatus() {
  try {
    if (!GetForegroundWindow || !ImmGetDefaultIMEWnd || !SendMessageW) return false;
    
    const hwnd = GetForegroundWindow();
    const imeWnd = ImmGetDefaultIMEWnd(hwnd);
    const result = SendMessageW(imeWnd, 0x0283, koffi.pointer(0x0005), koffi.pointer(0));
    
    lastIMEStatus = result !== 0;
    return lastIMEStatus;
  } catch (error) {
    return false;
  }
}

// IME監視を開始
function startIMEMonitor() {
  if (imeMonitorInterval) return;
  
  checkIMEStatus();
  imeMonitorInterval = setInterval(() => checkIMEStatus(), 200);
  
  console.log('✅ IME監視を開始しました');
}

// IME監視を停止
function stopIMEMonitor() {
  if (imeMonitorInterval) {
    clearInterval(imeMonitorInterval);
    imeMonitorInterval = null;
    console.log('✅ IME監視を停止しました');
  }
}

// IME状態を取得
async function getIMEStatus() {
  return { enabled: lastIMEStatus, timestamp: Date.now() };
}

// BrowserWindow作成時にpreloadを設定
function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });
  
  win.loadFile('index.html');
}

app.whenReady().then(() => {
  startIMEMonitor();
  ipcMain.handle('get-ime-status', async () => await getIMEStatus());
  createWindow();
});

// 終了処理
app.on('before-quit', () => stopIMEMonitor());
app.on('window-all-closed', () => {
  stopIMEMonitor();
  if (process.platform !== 'darwin') app.quit();
});
```

### ステップ3: レンダラープロセス（index.js等）にUI追加

```javascript
// IME状態表示用の要素を作成
function createIMEStatusDisplay() {
    const existingDisplay = document.getElementById('ime-status-display');
    if (existingDisplay) return;

    const imeDisplay = document.createElement('div');
    imeDisplay.id = 'ime-status-display';
    imeDisplay.innerHTML = `
        <div style="margin-bottom: 5px;">
            <span style="font-weight: bold;">IME:</span> 
            <span id="imeEnabled" style="color: #00ff00;">-</span>
        </div>
        <div>
            <span style="font-weight: bold;">モード:</span> 
            <span id="imeMode" style="color: #00ffff;">-</span>
        </div>
    `;
    
    Object.assign(imeDisplay.style, {
        position: 'fixed',
        top: '10px',
        right: '10px',
        background: 'rgba(0, 0, 0, 0.85)',
        color: 'white',
        padding: '12px 15px',
        borderRadius: '8px',
        fontSize: '13px',
        fontFamily: 'monospace',
        zIndex: '10000',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
        minWidth: '150px'
    });
    
    document.body.appendChild(imeDisplay);
}

// IME状態を更新
async function updateIMEStatus() {
    try {
        if (!window.electronAPI?.getIMEStatus) return;

        const status = await window.electronAPI.getIMEStatus();
        
        if (status && !status.error) {
            const enabledEl = document.getElementById('imeEnabled');
            const modeEl = document.getElementById('imeMode');
            
            if (enabledEl && modeEl) {
                if (status.enabled) {
                    enabledEl.textContent = 'ON';
                    enabledEl.style.color = '#00ff00';
                    modeEl.textContent = '日本語入力';
                    modeEl.style.color = '#00ffff';
                } else {
                    enabledEl.textContent = 'OFF';
                    enabledEl.style.color = '#ff6b6b';
                    modeEl.textContent = '英数字';
                    modeEl.style.color = '#aaaaaa';
                }
            }
        }
    } catch (error) {
        console.error('IME状態更新失敗:', error);
    }
}

// IME監視を開始
function startIMEMonitoring() {
    createIMEStatusDisplay();
    updateIMEStatus();
    setInterval(updateIMEStatus, 200);
    console.log('IME監視を開始しました');
}

// 起動
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startIMEMonitoring);
} else {
    startIMEMonitoring();
}
```

---

## ✅ 動作確認

```bash
npm start
```

ターミナルに以下が表示されれば成功：
```
✅ Windows API読み込み成功
✅ IME監視を開始しました
```

画面右上にIME状態が表示されます！

---

## 🎨 カスタマイズ

### 更新速度の変更
```javascript
setInterval(updateIMEStatus, 200);  // ← この数字を変更
// 100 = 超高速、200 = 高速、500 = 標準
```

### 表示位置の変更
```javascript
Object.assign(imeDisplay.style, {
    top: '10px',    // 上からの距離
    right: '10px',  // 右からの距離（leftに変更で左寄せ）
    // ...
});
```

---

## 📊 PowerShell版との比較

| 項目 | PowerShell版（旧） | koffi版（新） |
|------|-------------------|---------------|
| 速度 | ⭐⭐⭐ (100-200ms) | ⭐⭐⭐⭐⭐ (<1ms) |
| CPU使用率 | やや高い | ほぼゼロ |
| プロセス数 | +1（PowerShell） | 0（追加なし） |
| コンソールウィンドウ | 表示される | 表示されない |
| ビルド | 不要 | 不要 |
| Visual Studio | 不要 | 不要 |

---

## 🐛 トラブルシューティング

### エラー: `Cannot find module 'koffi'`
```bash
npm install koffi
```

### エラー: `Windows API読み込み失敗`
→ Windows専用機能です。Windows以外では動作しません。

### エラー: `electronAPI is not defined`
→ `main.js`の`webPreferences`に`preload: path.join(__dirname, 'preload.js')`が設定されているか確認

---

## 🌟 完全なファイル構成

```
your-project/
├── package.json
├── preload.js          ← 新規作成
├── main.js             ← 変更（koffiコード追加）
└── src/
    └── js/
        └── index.js    ← 変更（UI追加）
```

**必要なもの:**
1. koffiパッケージ（`npm install koffi`）
2. preload.js（新規作成）
3. main.jsの変更
4. レンダラープロセスのコード追加

---

**最終更新**: 2025年12月19日  
**技術**: koffi, Windows API  
**動作確認**: Windows 11, Electron 39.0.0
