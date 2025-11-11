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
// 追記、アプリから開く形式に変えてください

app.whenReady().then(createWindow);
