// index.js
const { app, BrowserWindow } = require('electron');
const path = require('path');


function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    autoHideMenuBar: true,
    fullscreen: true, 
    title: ''
  });
  win.loadFile(path.join(__dirname, 'src', 'html', 'index.html'));
}

app.whenReady().then(createWindow);
