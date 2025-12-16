import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let cliProcess;
let TitleScreen;
let splashScreen;

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    autoHideMenuBar: true,
    // フルスクリーン表示にする場合は下のコメントアウトを外してください
    // fullscreen: true, 
    nodeIntegration: true, // これを有効にする
    contextIsolation: false, // 必要に応じて無効化
    title: ''
  });
  
  win.loadFile(path.join(__dirname, 'src', 'html', 'index.html'));
}

function createtitleWindow() {
  TitleScreen = new BrowserWindow({
    width: 800,
    height: 600,
    autoHideMenuBar: true,
    transparent: true,  // 透明にする
    frame: false,       // フレームを消す（透明にするために必要）
    // フルスクリーン表示にする場合は下のコメントアウトを外してください
    // fullscreen: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    title: 's'
  });
  TitleScreen.loadFile(path.join(__dirname, 'src', 'html', 'title.html'));
}

app.whenReady().then(() => {
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
      nodeIntegration: true,
      contextIsolation: false
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
    }, 0);
    // アニメーションは既に1秒進んでいるので1500msに調整
    // 0を1500に
  });
});

app.on('window-all-closed', () => {
  if (cliProcess) {
    cliProcess.kill();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
