// magic2.js - ギミック2: 断片データ並び替えパズル
// magic1.jsクリア後に進めるギミック
// クリア報酬: [次のギミックで使うもの]

(function() {
    
    // =========================================
    // ギミック2の設定
    // =========================================
    // 
    // 謎の内容:
    // - system/backup/ に隠しファイルがある（searchで発見）
    // - .fragment_1~4.dat に文字が記録 (E, P, O, H)
    // - .order_hint.memo に並び替え順序のヒント (4→3→2→1)
    // - restored_data.enc がパスワードロックされている
    // - パスワード: HOPE
    //
    // 解き方:
    // 1. cd system → search で「backup/」フォルダ発見
    // 2. cd backup
    // 3. search で隠しファイル一覧を見る
    // 5. cat で各fragmentを読んで文字を集める
    // 6. cat .order_hint.memo で順序を知る
    // 7. open restored_data.enc → パスワード「HOPE」
    //
    // クリア報酬: gimmick2Cleared = true
    // 
    // =========================================
    
    const CORRECT_PASSWORD = 'HOPE';
    const LOCKED_FILE = 'restored_data.enc';

    window.gimmick2System = {
        
        isCleared: false,
        
        // このファイルが暗号化ファイルかどうか
        isEncryptedFile: function(fileName) {
            return fileName === LOCKED_FILE;
        },
        
        // -------------------------
        // Y/N確認処理
        // -------------------------
        handleConfirmationInput: async function(term, gameState, puzzleHelpers, input) {
            const { systemLine, errorLine, eveLine, wait } = puzzleHelpers;
            
            var confirmation = gameState.waitingForConfirmation_gimmick2;
            
            if (!confirmation) return false;
            
            var answer = input.trim().toLowerCase();
            
            if (answer === 'y' || answer === 'yes') {
                term.write('\r\n');
                await systemLine('[SYSTEM]: パスワードを入力してください', 30);
                term.write('パスワード: ');
                
                gameState.inputMode = 'gimmick2_password';
                gameState.passwordTarget_gimmick2 = confirmation.fileName;
                gameState.waitingForConfirmation_gimmick2 = null;
                return true;
                
            } else if (answer === 'n' || answer === 'no') {
                term.write('\r\n');
                await systemLine('[SYSTEM]: キャンセルしました', 30);
                await wait(300);
                
                gameState.inputMode = 'normal';
                gameState.waitingForConfirmation_gimmick2 = null;
                return true;
                
            } else {
                term.write('\r\n');
                await errorLine('[ERROR]: Y または N を入力してください', 30);
                term.write('[SYSTEM]: パスワードを入力しますか? (Y/N): ');
                return true;
            }
        },
        
        // -------------------------
        // パスワード入力処理
        // -------------------------
        handlePasswordInput: async function(term, gameState, puzzleHelpers, password) {
            const { systemLine, errorLine, warnLine, wait, slowPrintLine } = puzzleHelpers;
            
            var fileName = gameState.passwordTarget_gimmick2;
            
            if (fileName !== LOCKED_FILE) {
                term.write('\r\n');
                await errorLine('[ERROR]: ファイルが見つかりません', 30);
                gameState.inputMode = 'normal';
                gameState.passwordTarget_gimmick2 = null;
                return false;
            }
            
            password = password.toUpperCase().trim();
            
            // 正解
            if (password === CORRECT_PASSWORD) {
                term.write('\r\n');
                await systemLine("[SYSTEM]: パスワード認証中...", 30);
                await wait(800);
                await systemLine("[SYSTEM]: 暗号解読中...", 30);
                await wait(800);
                await systemLine("[SYSTEM]: ✓ 認証成功", 30);
                await wait(400);
                
                await systemLine("", 0);
                await systemLine("╔════════════════════════════════════╗", 10);
                await systemLine("║      データ復元完了                ║", 10);
                await systemLine("╚════════════════════════════════════╝", 10);
                await systemLine("", 0);
                
                await slowPrintLine("  復元されたデータを読み込んでいます...", 25);
                await wait(500);
                
                await systemLine("", 0);
                await systemLine("  === 復元されたデータ ===", 20);
                await systemLine("  ", 0);
                await slowPrintLine("  EVEシステム バックアップログ", 20);
                await slowPrintLine("  日付: 2025-XX-XX", 20);
                await slowPrintLine("  内容: [重要なシステム情報]", 20);
                await systemLine("", 0);
                
                // クリア処理
                this.isCleared = true;
                gameState.gimmick2Cleared = true;
                gameState.inputMode = 'normal';
                gameState.passwordTarget_gimmick2 = null;
                
                await systemLine("", 0);
                
                // 報酬があればここで付与
                // await systemLine("[SYSTEM]: 新しいコマンドを取得しました「???」", 25);
                
                return true;
            }
            
            // 不正解
            term.write('\r\n');
            await systemLine("[SYSTEM]: パスワード認証中...", 30);
            await wait(800);
            await errorLine("[ERROR]: パスワードが違います。", 20);
            await systemLine("[TIP]: フラグメントの順序を確認してください", 20);
            
            gameState.inputMode = 'normal';
            gameState.passwordTarget_gimmick2 = null;
            
            return false;
        },
        
        // -------------------------
        // ファイルを開く処理
        // -------------------------
        openEncryptedFile: async function(term, gameState, puzzleHelpers, fileName) {
            const { systemLine, warnLine, wait } = puzzleHelpers;
            
            if (fileName !== LOCKED_FILE) return false;
            
            await systemLine("[SYSTEM]: 復元データファイルを開いています...", 30);
            await wait(500);
            await warnLine("[WARNING]: このファイルはパスワードで保護されています", 30);
            await wait(400);
            
            // 確認待ち状態に設定
            gameState.waitingForConfirmation_gimmick2 = {
                type: 'open_encrypted_gimmick2',
                fileName: fileName
            };
            gameState.inputMode = 'gimmick2_confirmation';
            
            term.write('\r\n');
            term.write('[SYSTEM]: パスワードを入力しますか? (Y/N): ');
            
            return true;
        },
        
        // クリア条件チェック
        checkClearCondition: function(gameState) {
            return this.isCleared || gameState.gimmick2Cleared;
        }
    };

})();
