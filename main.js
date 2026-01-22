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
let eveIntroScreen;
let mainWin; // メインゲーム画面
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
  // まずEVE導入シーンを表示
  eveIntroScreen = new BrowserWindow({
    width: 800,
    height: 600,
    autoHideMenuBar: true,
    // フルスクリーン表示にする場合は下のコメントアウトを外してください
    fullscreen: true,
    frame: false,
    show: true,
    icon: path.join(__dirname, "src/pic/app_icon.ico"),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    title: 'EVE'
  });
  
  eveIntroScreen.loadFile(path.join(__dirname, 'src', 'html', 'eve_intro.html'));
  
  // 18秒後にフェードアウトしてメインゲームへ切り替え
  setTimeout(() => {
    // フェードアウト開始
    if (eveIntroScreen && !eveIntroScreen.isDestroyed()) {
      eveIntroScreen.webContents.executeJavaScript(`
        document.body.style.transition = 'opacity 1s ease-out';
        document.body.style.opacity = '0';
      `);
      
      // フェード完了後にメインウィンドウ作成
      setTimeout(() => {
        mainWin = new BrowserWindow({
          width: 800,
          height: 600,
          autoHideMenuBar: true,
          // フルスクリーン表示にする場合は下のコメントアウトを外してください
          fullscreen: true,
          show: false,
          icon: path.join(__dirname, "src/pic/app_icon.ico"),
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
          },
          title: 'EVE'
        });
        
        mainWin.loadFile(path.join(__dirname, 'src', 'html', 'index.html'));
        
        // リロード検出用の変数
        let lastLoadedURL = '';
        
        // リロード（Ctrl+R）を検出してセーブデータを削除
        mainWin.webContents.on('did-start-loading', () => {
          const currentURL = mainWin.webContents.getURL();
          console.log('ページ読み込み開始:', currentURL);
          
          // 同じURLが再度読み込まれた場合はリロードと判断
          if (lastLoadedURL && currentURL === lastLoadedURL) {
            console.log('🔄 リロード検出: セーブデータを削除します');
            mainWin.webContents.executeJavaScript(`
              if (window.saveSystem) {
                window.saveSystem.clear();
                console.log('リロードによりセーブデータを削除しました');
              }
              localStorage.removeItem("eveGameState");
              localStorage.removeItem("lastSessionTime");
            `).catch(err => console.error('セーブデータ削除エラー:', err));
          }
          
          lastLoadedURL = currentURL;
        });
        
        // メインウィンドウの準備完了後にフェードイン
        mainWin.once('ready-to-show', () => {
          if (eveIntroScreen && !eveIntroScreen.isDestroyed()) {
            eveIntroScreen.close();
            eveIntroScreen = null;
          }
          
          // フェードイン効果
          mainWin.webContents.executeJavaScript(`
            document.body.style.opacity = '0';
            document.body.style.transition = 'opacity 1s ease-in';
            setTimeout(() => { document.body.style.opacity = '1'; }, 50);
          `);
          
          mainWin.show();
        });
      }, 1000); // フェードアウト時間
    }
  }, 19500); // 18秒 - フェードアウト時間(1秒)
}

function createBgWindow() {
  BGScreen = new BrowserWindow({
    width: 1920,  //1920に設定
    height: 1080,  //1080に設定
    frame: false,       // フレームを消す（透明にするために必要）
    // fullscreenにするとほかのウィンドウが最前面に来れなくなる可能性があるためウィンドウサイズで対応
    // fullscreen: true,
    show: false,      // 最初は非表示
    skipTaskbar: true,  // タスクバーに表示しない
    icon: path.join(__dirname, "src/pic/app_icon.ico"),
    webPreferences: {
      nodeIntegration: true,  // 既存のコードとの互換性のため維持
      contextIsolation: false  // 既存のコードとの互換性のため維持
    },
    title: 'EVE'
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
    width: 1920,
    height: 1080,
    autoHideMenuBar: true,
    transparent: true,  // 透明にする
    frame: false,       // フレームを消す（透明にするために必要）
    show: false,        // 最初は非表示にして準備してから表示
    alwaysOnTop: true,  // Titleを最前面に
    // フルスクリーン表示にする場合は下のコメントアウトを外してください
    // fullscreen: true,
    icon: path.join(__dirname, "src/pic/app_icon.ico"),
    webPreferences: {
      nodeIntegration: true,  // 既存のコードとの互換性のため維持
      contextIsolation: false  // 既存のコードとの互換性のため維持
    },
    title: 'EVE'
  });
  TitleScreen.loadFile(path.join(__dirname, 'src', 'html', 'title.html'));
  
  TitleScreen.once('ready-to-show', () => {
    // Titleを最前面に、BGを背面に確実に配置
    TitleScreen.setAlwaysOnTop(true, 'screen-saver');
    TitleScreen.show();
    TitleScreen.focus();
    TitleScreen.moveTop();
    
    if (BGScreen && !BGScreen.isDestroyed()) {
      BGScreen.setAlwaysOnTop(false);
      BGScreen.blur();
    }
  });
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
    // フルスクリーン表示にする場合は下のコメントアウトを外してください
    fullscreen: true,
    frame: false,
    alwaysOnTop: true,
    transparent: true,
    show: false,  // 最初は非表示
    icon: path.join(__dirname, "src/pic/app_icon.ico"),
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

  // 続きから再開ボタンが押されたとき
  console.log('✅ continue-gameハンドラーを登録します');
  ipcMain.on('continue-game', (event) => {
    console.log('🔄 続きから再開: ゲーム画面に戻ります');
    console.log('イベント受信:', event);
    
    // 送信元のウィンドウを取得
    const senderWindow = BrowserWindow.getFocusedWindow();
    console.log('送信元ウィンドウ:', senderWindow ? senderWindow.getTitle() : 'なし');
    
    // 全てのウィンドウをログ出力
    const allWindows = BrowserWindow.getAllWindows();
    console.log('現在のウィンドウ数:', allWindows.length);
    allWindows.forEach((win, index) => {
      if (!win.isDestroyed()) {
        const url = win.webContents.getURL();
        console.log(`ウィンドウ${index}:`, win.getTitle(), 'URL:', url);
      }
    });
    
    // mainWinが存在するか確認
    console.log('mainWin存在:', mainWin ? 'あり' : 'なし');
    console.log('mainWin破棄:', mainWin && mainWin.isDestroyed() ? 'はい' : 'いいえ');
    
    // mainWinが存在しない、または破棄されている場合は新規作成
    if (!mainWin || mainWin.isDestroyed()) {
      console.log('✅ mainWinを新規作成します');
      
      // EVE導入画面はスキップして直接メインウィンドウを作成
      mainWin = new BrowserWindow({
        width: 800,
        height: 600,
        autoHideMenuBar: true,
        fullscreen: true,
        show: false,
        icon: path.join(__dirname, "src/pic/app_icon.ico"),
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          preload: path.join(__dirname, 'preload.js')
        },
        title: 'EVE - Main Game'
      });
      
      mainWin.loadFile(path.join(__dirname, 'src', 'html', 'index.html'));
      
      // リロード検出用の変数
      let lastLoadedURL = '';
      
      // リロード（Ctrl+R）を検出してセーブデータを削除
      mainWin.webContents.on('did-start-loading', () => {
        const currentURL = mainWin.webContents.getURL();
        console.log('ページ読み込み開始:', currentURL);
        
        // 同じURLが再度読み込まれた場合はリロードと判断
        if (lastLoadedURL && currentURL === lastLoadedURL) {
          console.log('🔄 リロード検出: セーブデータを削除します');
          mainWin.webContents.executeJavaScript(`
            if (window.saveSystem) {
              window.saveSystem.clear();
              console.log('リロードによりセーブデータを削除しました');
            }
            localStorage.removeItem("eveGameState");
            localStorage.removeItem("lastSessionTime");
          `).catch(err => console.error('セーブデータ削除エラー:', err));
        }
        
        lastLoadedURL = currentURL;
      });
      
      mainWin.once('ready-to-show', () => {
        console.log('✅ mainWinの準備が完了しました');
        
        // 全てのEND画面を閉じる（mainWin作成後）
        allWindows.forEach(win => {
          if (!win.isDestroyed() && win !== BGScreen && win !== mainWin) {
            const url = win.webContents.getURL();
            if (url.includes('end.html') || url.includes('true_end.html') || 
                url.includes('dominated_end.html') || url.includes('timeout_end.html')) {
              console.log('END画面を閉じます:', url);
              win.close();
            }
          }
        });
        
        mainWin.webContents.executeJavaScript(`
          document.body.style.opacity = '0';
          document.body.style.transition = 'opacity 1s ease-in';
          setTimeout(() => { document.body.style.opacity = '1'; }, 50);
        `);
        mainWin.show();
        mainWin.focus();
        console.log('✅ mainWinを表示しました');
      });
    } else {
      // 既存のmainWinを表示
      console.log('✅ 既存のmainWinが存在します');
      const currentURL = mainWin.webContents.getURL();
      console.log('現在のmainWin URL:', currentURL);
      
      // mainWinがEND画面を表示している場合、index.htmlに戻す
      if (currentURL.includes('end.html') || currentURL.includes('true_end.html') || 
          currentURL.includes('dominated_end.html') || currentURL.includes('timeout_end.html')) {
        console.log('✅ mainWinをindex.htmlに戻します');
        
        // フェードアウト
        mainWin.webContents.executeJavaScript(`
          document.body.style.transition = 'opacity 0.5s ease-out';
          document.body.style.opacity = '0';
        `);
        
        setTimeout(() => {
          mainWin.loadFile(path.join(__dirname, 'src', 'html', 'index.html'));
          mainWin.once('ready-to-show', () => {
            console.log('✅ index.htmlの読み込みが完了しました');
            mainWin.webContents.executeJavaScript(`
              document.body.style.opacity = '0';
              document.body.style.transition = 'opacity 1s ease-in';
              setTimeout(() => { document.body.style.opacity = '1'; }, 50);
            `);
            mainWin.show();
            mainWin.focus();
          });
        }, 500);
      } else {
        // 既にindex.htmlを表示している場合はそのまま表示
        console.log('✅ mainWinをそのまま表示します');
        mainWin.webContents.executeJavaScript(`
          document.body.style.opacity = '0';
          document.body.style.transition = 'opacity 1s ease-in';
          setTimeout(() => { document.body.style.opacity = '1'; }, 50);
        `);
        mainWin.show();
        mainWin.focus();
      }
      console.log('✅ 既存のmainWin処理完了');
    }
  });

  // ENDからタイトルに戻る処理
  console.log('✅ back-to-titleハンドラーを登録しました');
  ipcMain.on('back-to-title', () => {
    console.log('🔙 back to title from END');
    
    // 全てのウィンドウを取得
    const allWindows = BrowserWindow.getAllWindows();
    
    // 現在のウィンドウ（END画面）を閉じる
    allWindows.forEach(win => {
      if (!win.isDestroyed() && win !== BGScreen) {
        win.close();
      }
    });
    
    // スプラッシュ画面を再作成
    splashScreen = new BrowserWindow({
      width: 800,
      height: 600,
      fullscreen: true,
      frame: false,
      alwaysOnTop: true,
      transparent: true,
      show: false,
      icon: path.join(__dirname, "src/pic/app_icon.ico"),
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    });
    splashScreen.loadFile(path.join(__dirname, 'src', 'html', 'splash.html'));
    
    // 少し待ってからタイトル画面を再作成
    setTimeout(() => {
      // BGScreenを一時的に最前面に（強制的に前面に出す）
      if (BGScreen && !BGScreen.isDestroyed()) {
        BGScreen.setAlwaysOnTop(true, 'screen-saver');
        BGScreen.show();
        BGScreen.focus();
        BGScreen.moveTop();
        // すぐにalwaysOnTopを解除（背面に戻す）
        setTimeout(() => {
          if (BGScreen && !BGScreen.isDestroyed()) {
            BGScreen.setAlwaysOnTop(true);
            BGScreen.blur();
          }
        }, 50);
        console.log('✅ BG画面を前面に配置しました');
      }
      
      createtitleWindow();
      
      // タイトル画面が作成されたら最前面に持ってくる
      setTimeout(() => {
        if (TitleScreen && !TitleScreen.isDestroyed()) {
          TitleScreen.setAlwaysOnTop(true, 'screen-saver');
          TitleScreen.show();
          TitleScreen.focus();
          TitleScreen.moveTop();
          console.log('✅ タイトル画面を最前面に配置しました');
        }
      }, 1000);
    }, 500);
  });
});

// アプリ終了時のクリーンアップ
app.on('before-quit', () => {
  console.log('アプリ終了: セーブデータを削除します');
  stopIMEMonitor();
  
  // ゲームを閉じる場合はセーブデータを削除
  const windows = BrowserWindow.getAllWindows();
  windows.forEach(win => {
    if (!win.isDestroyed()) {
      win.webContents.executeJavaScript(`
        if (window.saveSystem) {
          window.saveSystem.clear();
          console.log('アプリ終了: セーブデータを削除しました');
        }
        localStorage.removeItem("eveGameState");
        localStorage.removeItem("lastSessionTime");
      `).catch(err => console.error('セーブデータ削除エラー:', err));
    }
  });
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
