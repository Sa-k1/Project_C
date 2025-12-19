const { contextBridge, ipcRenderer } = require('electron');

// Electronのセキュアなブリッジを使用してAPIを公開
contextBridge.exposeInMainWorld('electronAPI', {
  // IME状態を取得
  getIMEStatus: () => ipcRenderer.invoke('get-ime-status'),
  
  // 既存のIPCメソッド（既に使用されている場合は維持）
  send: (channel, data) => {
    const validChannels = ['game-start', 'prepare-splash'];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  on: (channel, func) => {
    const validChannels = ['game-start', 'prepare-splash'];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  },
  
  // 汎用的なipcRenderer呼び出し（後方互換性のため）
  ipcRenderer: {
    send: (channel, ...args) => {
      const validChannels = ['game-start', 'prepare-splash'];
      if (validChannels.includes(channel)) {
        ipcRenderer.send(channel, ...args);
      }
    },
    on: (channel, func) => {
      const validChannels = ['start-animation', 'game-start', 'prepare-splash'];
      if (validChannels.includes(channel)) {
        ipcRenderer.on(channel, (event, ...args) => func(...args));
      }
    },
    invoke: (channel, ...args) => {
      const validChannels = ['get-ime-status'];
      if (validChannels.includes(channel)) {
        return ipcRenderer.invoke(channel, ...args);
      }
    }
  }
});

