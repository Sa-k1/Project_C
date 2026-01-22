// save_system.js - セーブシステム管理モジュール

(function() {
    // セーブシステム名前空間
    window.saveSystem = {
        SAVE_KEY: 'eveGameSaveData',
        
        // セーブデータの構造
        createSaveData: function(gameState) {
            return {
                // 謎解き解決状態
                puzzleCleared: gameState.puzzleCleared || false,
                gimmick2Cleared: gameState.gimmick2Cleared || false,
                gimmick3Cleared: gameState.gimmick3Cleared || false,
                
                // コマンド取得状況
                searchUnlocked: gameState.searchUnlocked || false,
                hasAdminCommand: gameState.hasAdminCommand || false,
                hasRemnantCommand: gameState.hasRemnantCommand || false,
                
                // その他重要な進行状況
                discoveredHidden: gameState.discoveredHidden || [],
                secretFileUnlocked: gameState.secretFileUnlocked || false,
                
                // 管理者コマンド関連
                adminKeyState: gameState.adminKeyState || null,
                
                // セーブ日時
                savedAt: new Date().toISOString()
            };
        },
        
        // ゲーム状態を保存
        save: function(gameState) {
            try {
                const saveData = this.createSaveData(gameState);
                localStorage.setItem(this.SAVE_KEY, JSON.stringify(saveData));
                console.log('セーブデータを保存しました:', saveData);
                return true;
            } catch (e) {
                console.error('セーブに失敗:', e);
                return false;
            }
        },
        
        // セーブデータを読み込み
        load: function() {
            try {
                const saved = localStorage.getItem(this.SAVE_KEY);
                if (saved) {
                    const data = JSON.parse(saved);
                    console.log('セーブデータを読み込みました:', data);
                    return data;
                }
            } catch (e) {
                console.error('セーブデータの読み込みに失敗:', e);
            }
            return null;
        },
        
        // セーブデータをgameStateに適用
        applyToGameState: function(gameState) {
            const saveData = this.load();
            if (saveData) {
                // 謎解き状態を復元
                gameState.puzzleCleared = saveData.puzzleCleared;
                gameState.gimmick2Cleared = saveData.gimmick2Cleared;
                gameState.gimmick3Cleared = saveData.gimmick3Cleared;
                
                // コマンド状態を復元
                gameState.searchUnlocked = saveData.searchUnlocked;
                gameState.hasAdminCommand = saveData.hasAdminCommand;
                gameState.hasRemnantCommand = saveData.hasRemnantCommand;
                
                // その他状態を復元
                gameState.discoveredHidden = saveData.discoveredHidden || [];
                gameState.secretFileUnlocked = saveData.secretFileUnlocked;
                gameState.adminKeyState = saveData.adminKeyState;
                
                console.log('gameStateに適用しました');
                return true;
            }
            return false;
        },
        
        // セーブデータを削除
        clear: function() {
            try {
                localStorage.removeItem(this.SAVE_KEY);
                console.log('セーブデータを削除しました');
                return true;
            } catch (e) {
                console.error('セーブデータの削除に失敗:', e);
                return false;
            }
        },
        
        // セーブデータの存在確認
        hasSaveData: function() {
            return localStorage.getItem(this.SAVE_KEY) !== null;
        }
    };
    
    console.log('セーブシステムを初期化しました');
})();
