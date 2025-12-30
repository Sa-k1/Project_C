import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import koffi from 'koffi';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let cliProcess;
let TitleScreen;
let splashScreen;
let BGScreen;
let imeMonitorInterval = null;
let lastIMEStatus = false;

// Windows APIの読み込み（koffiを使用）
let user32, imm32, GetForegroundWindow, ImmGetDefaultIMEWnd, SendMessageW;

try {
  user32 = koffi.load('user32.dll');
  imm32 = koffi.load('imm32.dll');
  
  // Windows API関数の定義
  GetForegroundWindow = user32.func('GetForegroundWindow', 'void*', []);
  ImmGetDefaultIMEWnd = imm32.func('ImmGetDefaultIMEWnd', 'void*', ['void*']);
  SendMessageW = user32.func('SendMessageW', 'long', ['void*', 'uint', 'void*', 'void*']);
  
  console.log('✅ Windows API読み込み成功');
} catch (error) {
  console.error('❌ Windows API読み込み失敗:', error);
}

// IME状態を直接取得する関数（koffi使用）
function checkIMEStatus() {
  try {
    if (!GetForegroundWindow || !ImmGetDefaultIMEWnd || !SendMessageW) {
      console.log('Windows API Not');
      return false;
    }
    
    const hwnd = GetForegroundWindow();
    const imeWnd = ImmGetDefaultIMEWnd(hwnd);
    
    // SendMessageWを使用してIME状態を取得
    // 0x0283 = WM_IME_CONTROL, 0x0005 = IMC_GETOPENSTATUS
    const result = SendMessageW(imeWnd, 0x0283, 0x0005, 0);
    
    const newStatus = result !== 0;
    
    // 状態が変わった時だけログ出力
    // if (newStatus !== lastIMEStatus) {
      // console.log(`🔄 IME状態変更: ${newStatus ? 'ON' : 'OFF'} (result: ${result})`);
    // }
    
    lastIMEStatus = newStatus;
    return lastIMEStatus;
  } catch (error) {
    console.error('❌ IME状態取得エラー:', error);
    return false; 
  }
}

// IME監視を開始
function startIMEMonitor() {
  if (imeMonitorInterval) return; // 既に起動済み
  
  // 初回実行
  checkIMEStatus();
  
  // 200ms間隔で監視
  imeMonitorInterval = setInterval(() => {
    checkIMEStatus();
  }, 200);
  
  console.log('✅ IME監視を開始しました（koffi使用）');
}

// IME監視を停止
function stopIMEMonitor() {
  if (imeMonitorInterval) {
    clearInterval(imeMonitorInterval);
    imeMonitorInterval = null;
    console.log('✅ IME監視を停止しました');
  }
}

// IME状態を取得する関数（最後の状態を即座に返す）
async function getIMEStatus() {
  return {
    enabled: lastIMEStatus,
    timestamp: Date.now()
  };
}

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    autoHideMenuBar: true,
    // フルスクリーン表示にする場合は下のコメントアウトを外してください
    // fullscreen: true, 
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    title: ''
  });
  
  win.loadFile(path.join(__dirname, 'src', 'html', 'index.html'));
}

function createBgWindow() {
  BGScreen = new BrowserWindow({
    width: 800,  //1920に設定
    height: 600,  //1080に設定
    frame: false,       // フレームを消す（透明にするために必要）
    // fullscreenにするとほかのウィンドウが最前面に来れなくなるためウィンドウサイズで対応
    alwaysOnTop: false,  // 常に最前面を無効化
    show: false,      // 最初は非表示
    webPreferences: {
      nodeIntegration: true,  // 既存のコードとの互換性のため維持
      contextIsolation: false  // 既存のコードとの互換性のため維持
    },
    title: ' '
  });
  
  BGScreen.once('ready-to-show', () => {
    BGScreen.show();
    // 背面に配置
    BGScreen.setAlwaysOnTop(false);
  });

  BGScreen.loadFile(path.join(__dirname, 'src', 'html', 'BG.html'));
}

function createtitleWindow() {
  TitleScreen = new BrowserWindow({
    width: 800,
    height: 600,
    autoHideMenuBar: true,
    transparent: true,  // 透明にする
    frame: false,       // フレームを消す（透明にするために必要）
    show: true,
    alwaysOnTop: true,  // Titleを最前面に
    // フルスクリーン表示にする場合は下のコメントアウトを外してください
    // fullscreen: true,
    webPreferences: {
      nodeIntegration: true,  // 既存のコードとの互換性のため維持
      contextIsolation: false  // 既存のコードとの互換性のため維持
    },
    title: 's'
  });
  TitleScreen.loadFile(path.join(__dirname, 'src', 'html', 'title.html'));
  
  // Titleを最前面に、BGを背面に確実に配置
  TitleScreen.setAlwaysOnTop(true);
  if (BGScreen) {
    BGScreen.setAlwaysOnTop(false);
    BGScreen.blur();
  }
}

app.whenReady().then(() => {
  // IME監視プロセスを起動
  startIMEMonitor();

  createBgWindow();

  // IME状態取得のIPCハンドラーを登録
  ipcMain.handle('get-ime-status', async () => {
    return await getIMEStatus();
  });

  // スプラッシュ画面を事前に作成（非表示）
  splashScreen = new BrowserWindow({
    width: 800,
    height: 600,
    // fullscreen: true,
    frame: false,
    alwaysOnTop: true,
    transparent: true,
    show: false,  // 最初は非表示
    webPreferences: {
      nodeIntegration: true,  // 既存のコードとの互換性のため維持
      contextIsolation: false  // 既存のコードとの互換性のため維持
    }
  });

  splashScreen.loadFile(path.join(__dirname, 'src', 'html', 'splash.html'));

  splashScreen.on('closed', () => {
    console.log('splash end');
  });

  createtitleWindow();

  // スプラッシュのアニメーションを事前に開始（タイトルのフェードアウト中に裏で準備）
  ipcMain.on('prepare-splash', () => {
    if (splashScreen) {
      splashScreen.webContents.executeJavaScript(`
        document.body.classList.remove('paused');
      `);
    }
  });

  // スタートボタンが押されたときのIPC受信（フェードアウト完了時）
  ipcMain.on('game-start', () => {
    console.log('button pressed');
    
    // スプラッシュ画面を表示
    if (splashScreen) {
      splashScreen.show();
    }
    
    // タイトル画面を閉じる
    if (TitleScreen) {
      TitleScreen.close();
    }

    // スプラッシュ表示後、setTimeoutでメインウィンドウを開く
    setTimeout(() => {
      splashScreen.close();
      createWindow();
    }, 1500);
    // アニメーションは既に1秒進んでいるので1500msに調整
    // 0を1500に
  });
});

// アプリ終了時のクリーンアップ
app.on('before-quit', () => {
  console.log('apri end...');
  stopIMEMonitor();
});

app.on('window-all-closed', () => {
  if (cliProcess) {
    cliProcess.kill();
  }
  stopIMEMonitor();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Ctrl+C などでプロセスが終了する場合
process.on('exit', () => {
  stopIMEMonitor();
});

process.on('SIGINT', () => {
  stopIMEMonitor();
  process.exit();
});

process.on('SIGTERM', () => {
  stopIMEMonitor();
  process.exit();
});
