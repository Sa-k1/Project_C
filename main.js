const { app, BrowserWindow } = require('electron');
const path = require('path');


function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    autoHideMenuBar: true,
    // フルスクリーン表示にする場合は下のコメントアウトを外してください
    // fullscreen: true, 
    title: ''
  });
  win.loadFile(path.join(__dirname, 'src', 'html', 'index.html'));
}

app.whenReady().then(() => {
  const splashScreen = new BrowserWindow({
    width: 800, // 新しい幅
    height: 600, // 新しい高さ
    // fullscreen: true,
    frame: false,
    alwaysOnTop: true,
    transparent: true
  });

  console.log('start');
  splashScreen.webContents.on('did-finish-load', () => {
    console.log('load');
  });

  splashScreen.on('closed', () => {
    console.log('end');
  });

  splashScreen.loadFile(path.join(__dirname, 'src', 'html', 'splash.html'));

  setTimeout(() => {
    splashScreen.close();
    createWindow();
  }, 2500);
});
