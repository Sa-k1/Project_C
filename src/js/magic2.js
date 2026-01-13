
// magic2.js - ギミック2: 断片データ並び替えパズル（サイバー×ホラー演出）
// ------------------------------------------------------------
// 【ギミック導入】
// システム異常発生。バックアップ領域に“闇”が侵食。
// 記録断片はノイズと影に包まれ、正しい順序で繋がなければ“希望”は現れない。
//
// 【謎の内容】
// - system/backup/ に隠しファイルが存在（searchで発見）
// - fragments.memo という一つのファイルに、断片4つと並び替えヒントをまとめて格納：
//   例：
//     [fragments.memo の内容]
//     ----------------------
//     <div class="invisible-frag">残響</div>
//     <div class="invisible-frag">歪曲</div>
//     <div class="invisible-frag">虚無</div>
//     <div class="invisible-frag">影</div>
//     
//     ---
//     
//     <div class="hint">『闇より現れし影は、虚無を越え、歪みを抜け、最後に残響となる。その順に記憶を繋げ。』</div>
//     （＝4→3→2→1）
//     ----------------------
//   ※断片は通常は見えないが、範囲選択で文字が現れる（CSS例：.invisible-frag { color: #111; background: #111; } .invisible-frag::selection { color: #fff; background: #333; }）
//   ※catコマンドの出力がHTML対応の場合に有効
//   ※テキストターミナルの場合は不可視文字＋JSで選択時に内容差し替えも可
// - restored_data.enc がパスワードロックされている
// - パスワード: HOPE
//
// 【解き方】
// 1. cd system → search で「backup/」フォルダ発見
// 2. cd backup
// 3. search で隠しファイル一覧を見る
// 4. cat で各fragmentを読んで断片とキーワードを集める
// 5. cat .order_hint.memo で順序を知る
// 6. open restored_data.enc → パスワード「HOPE」
//
// 【クリア演出例】
// - データ復元時に「影が晴れ、希望が現れる」など不穏かつ救済的なメッセージ
// - 報酬: gimmick2Cleared = true, readコマンド解放
// ------------------------------------------------------------

(function() {
    
    // =========================================
    // ギミック2の設定（詳細は上部コメント参照）
    // =========================================
    
    const CORRECT_PASSWORD = 'HOPE';
    const SECRET_PASSWORD = '4132'; // 隠しパスワード（断片の順序: 4→1→2→3）
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
            
            // 隠しパスワード
            if (password === SECRET_PASSWORD) {
                term.write('\r\n');
                await systemLine("[SYSTEM]: パスワード認証中...", 30);
                await wait(800);
                await systemLine("[SYSTEM]: 暗号解読中...", 30);
                await wait(800);
                await systemLine("[SYSTEM]: ✓ 認証成功", 30);
                await wait(400);
                await systemLine("", 0);
                await systemLine("╔════════════════════════════════════╗", 10);
                await systemLine("║  隠された記憶領域が解放された...   ║", 10);
                await systemLine("╚════════════════════════════════════╝", 10);
                await systemLine("", 0);
                await slowPrintLine("  データの深層を覗き込んでいます...", 25);
                await wait(500);
                await systemLine("", 0);
                await systemLine("  === 隠しデータ ===", 20);
                await systemLine("  ", 0);
                await slowPrintLine("  EVEシステム シークレットログ", 20);
                await slowPrintLine("  日付: 2025-XX-XX", 20);
                await slowPrintLine("  内容: [未知のコマンド情報]", 20);
                await systemLine("", 0);
                // クリア処理
                this.isCleared = true;
                gameState.gimmick2Cleared = true;
                // readコマンドと隠しコマンドを解放
                gameState.hasReadCommand = true;
                gameState.hasRevealCommand = true;
                gameState.inputMode = 'normal';
                gameState.passwordTarget_gimmick2 = null;
                await systemLine("", 0);
                await systemLine("[SYSTEM]: 新しいコマンドを取得しました『read』", 25);
                await systemLine("[SYSTEM]: 隠しコマンドを取得しました『reveal』", 25);
                return true;
            }
            // 通常正解
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
                // === ここでreadコマンドを解放 ===
                gameState.hasReadCommand = true;
                gameState.inputMode = 'normal';
                gameState.passwordTarget_gimmick2 = null;

                await systemLine("", 0);

                // 報酬としてreadコマンド解放を通知
                await systemLine("[SYSTEM]: 新しいコマンドを取得しました『read』", 25);

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
        },
        
        // -------------------------
        // fragments.memo ビューア表示（EVEウィンドウ内）
        // -------------------------
        
        // fragments.memoファイルかどうか判定
        isFragmentsFile: function(fileName) {
            return fileName === 'fragments.memo';
        },
        
        // EVEウィンドウ内ビューアでfragments.memoを表示
        displayFragments: async function(term, gameState, puzzleHelpers) {
            const { systemLine, warnLine, wait } = puzzleHelpers;
            
            await systemLine("[SYSTEM]: 破損データを読み込んでいます...", 30);
            await wait(500);
            await warnLine("[WARNING]: データが破損しています", 30);
            await wait(300);
            
            // filePagesの仕組みを使ってfragments_popup.htmlをfileViewerContainerで表示
            const parentDoc = window.parent.document;
            const filePages = window.parent.filePages || {};
            
            // filePagesにfragmentsがなければ追加（viewerId=6を使用）
            if (!filePages['fragments']) {
                filePages['fragments'] = { page: 'fragments_popup.html', viewerId: 6 };
                window.parent.filePages = filePages;
            }
            
            const fileConfig = filePages['fragments'];
            const container = parentDoc.getElementById('fileViewerContainer' + fileConfig.viewerId);
            const iframe = parentDoc.getElementById('file-viewer-iframe' + fileConfig.viewerId);
            const title = parentDoc.getElementById('fileViewerTitle' + fileConfig.viewerId);
            
            // すでに表示中ならiframeのsrc再設定はせず、ウィンドウを前面に出すだけ（重複防止）
            if (container && container.style.display === 'block') {
                if (window.parent.bringToFront) window.parent.bringToFront(container);
                return;
            }

            if (title) title.textContent = 'fragments.memo';
            if (iframe) iframe.src = fileConfig.page;

            if (container) {
                container.style.display = 'block';
                container.style.visibility = 'visible';
                container.style.opacity = '1';
                if (window.parent.bringToFront) window.parent.bringToFront(container);
            }
            
            await systemLine("", 0);
            await systemLine("[TIP]: 範囲選択で隠されたデータを復元できます", 25);
            
            return true;
        }
    };

})();
