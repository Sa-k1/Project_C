// magic3.js - ギミック3: キーボード・ブラインド・トレース
// magic2.jsクリア後に進めるギミック
// クリア報酬: [次のギミックで使うもの]

(function() {
    // グローバルなgimmick3Systemオブジェクトを作成
    window.gimmick3System = {};

    // -------------------------
    // パスワード設定（キーボード位置パズル）
    // -------------------------
    window.gimmick3System.PUZZLE_CONFIG = {
        correctPassword: 'TRUST',
        lockedFile: 'traced_file.enc',
        
        // キーボード配列（QWERTY）- 数字とアルファベットのみ
        // SPACEだけが見える（ヒント）
        keyboardLayout: [
            // 数字行
            ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
            // 第1行（QWERTY）
            ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
            // 第2行（ASDFGH）
            ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
            // 第3行（ZXCVBN）
            ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
            // 第4行（スペースバー）- 右側を1文字分短く
            ['', '', '', '[        空白       ]', '', '', '']
        ],
        
        // パスワードのキー位置（配列インデックス: [行, 列]）
        // TRUST = T(1,4), R(1,3), U(1,6), S(2,1), T(1,4)
        passwordPositions: [
            { row: 1, col: 4, char: 'T', order: 1 },  // T
            { row: 1, col: 3, char: 'R', order: 2 },  // R
            { row: 1, col: 6, char: 'U', order: 3 },  // U
            { row: 2, col: 1, char: 'S', order: 4 },  // S
            { row: 1, col: 4, char: 'T', order: 5 }   // T
        ]
    };

    // -------------------------
    // クリア状態
    // -------------------------
    window.gimmick3System.isCleared = false;

    // -------------------------
    // key_trace.logを読み込む処理
    // -------------------------
    window.gimmick3System.displayKeyTrace = async function(term, gameState, puzzleHelpers) {
        const { systemLine, wait } = puzzleHelpers;
        await systemLine("[SYSTEM]: キーログ画像を読み込んでいます...", 30);
        await wait(800);
        await systemLine("", 0);
        // filePagesの仕組みを使ってkey_trace_viewer.htmlをfileViewerContainer4で表示
        const parentDoc = window.parent.document;
        const filePages = window.parent.filePages || {};
        const fileConfig = filePages['key_trace'];
        if (fileConfig) {
            const container = parentDoc.getElementById('fileViewerContainer' + fileConfig.viewerId);
            const iframe = parentDoc.getElementById('file-viewer-iframe' + fileConfig.viewerId);
            const title = parentDoc.getElementById('fileViewerTitle' + fileConfig.viewerId);
            if (title) title.textContent = 'key_trace.png';
            if (iframe) iframe.src = fileConfig.page;
            if (container) {
                container.style.display = 'block';
                container.style.visibility = 'visible';
                container.style.opacity = '1';
                if (window.parent.bringToFront) window.parent.bringToFront(container);
            }
        }
        await systemLine("[TIP]: 画像はEVEウィンドウ内に表示されます", 20);
        return true;
    };

    // -------------------------
    // このファイルが暗号化ファイルかどうか
    // -------------------------
    window.gimmick3System.isEncryptedFile = function(fileName) {
        return fileName === window.gimmick3System.PUZZLE_CONFIG.lockedFile;
    };

    // -------------------------
    // Y/N確認処理
    // -------------------------
    window.gimmick3System.handleConfirmationInput = async function(term, gameState, puzzleHelpers, input) {
        const { systemLine, errorLine, wait } = puzzleHelpers;
        
        var confirmation = gameState.waitingForConfirmation_gimmick3;
        
        if (!confirmation) return false;
        
        var answer = input.trim().toLowerCase();
        
        if (answer === 'y' || answer === 'yes') {
            term.write('\r\n');
            await systemLine('[SYSTEM]: パスワードを入力してください', 30);
            term.write('パスワード: ');
            
            gameState.inputMode = 'gimmick3_password';
            gameState.passwordTarget_gimmick3 = confirmation.fileName;
            gameState.waitingForConfirmation_gimmick3 = null;
            return true;
            
        } else if (answer === 'n' || answer === 'no') {
            term.write('\r\n');
            await systemLine('[SYSTEM]: キャンセルしました', 30);
            await wait(300);
            
            gameState.inputMode = 'normal';
            gameState.waitingForConfirmation_gimmick3 = null;
            return true;
            
        } else {
            term.write('\r\n');
            await errorLine('[ERROR]: Y または N を入力してください', 30);
            term.write('[SYSTEM]: パスワードを入力しますか? (Y/N): ');
            return true;
        }
    };

    // -------------------------
    // パスワード入力処理
    // -------------------------
    window.gimmick3System.handlePasswordInput = async function(term, gameState, puzzleHelpers, password) {
        const { systemLine, errorLine, warnLine, wait, slowPrintLine } = puzzleHelpers;
        const config = window.gimmick3System.PUZZLE_CONFIG;
        
        var fileName = gameState.passwordTarget_gimmick3;
        
        if (fileName !== config.lockedFile) {
            term.write('\r\n');
            await errorLine('[ERROR]: ファイルが見つかりません', 30);
            gameState.inputMode = 'normal';
            gameState.passwordTarget_gimmick3 = null;
            return false;
        }
        
        password = password.toUpperCase().trim();
        
        // 正解
        if (password === config.correctPassword) {
            term.write('\r\n');
            await systemLine("[SYSTEM]: パスワード認証中...", 30);
            await wait(800);
            await systemLine("[SYSTEM]: キートレース解析中...", 30);
            await wait(800);
            await systemLine("[SYSTEM]: ✓ 認証成功", 30);
            await wait(400);
            
            await systemLine("", 0);
            await systemLine("╔════════════════════════════════════╗", 10);
            await systemLine("║      ファイル復号完了              ║", 10);
            await systemLine("╚════════════════════════════════════╝", 10);
            await systemLine("", 0);
            
            await slowPrintLine("  復号されたデータを読み込んでいます...", 25);
            await wait(500);
            
            await systemLine("", 0);
            await systemLine("  === 復号されたファイル ===", 20);
            await systemLine("  ", 0);
            await slowPrintLine("  重要なメッセージ:", 20);
            await slowPrintLine("  「信頼は鍵となる。しかし誰を信頼すべきか？」", 20);
            await slowPrintLine("  ", 0);
            await slowPrintLine("  [添付データ: access_key.dat]", 20);
            await systemLine("", 0);
            
            // クリア処理
            window.gimmick3System.isCleared = true;
            gameState.gimmick3Cleared = true;
            // === ここでremnantコマンドを解放 ===
            gameState.hasRemnantCommand = true;
            gameState.inputMode = 'normal';
            gameState.passwordTarget_gimmick3 = null;

            // 報酬としてremnantコマンド解放を通知
            await systemLine("[SYSTEM]: 新しいコマンドを取得しました『remnant』", 25);

            return true;
        }
        
        // 不正解
        term.write('\r\n');
        await systemLine("[SYSTEM]: パスワード認証中...", 30);
        await wait(800);
        await errorLine("[ERROR]: パスワードが違います。", 20);
        await systemLine("[TIP]: キーボードの位置をもう一度確認してください", 20);
        await systemLine("[TIP]: open key_trace.log で再度確認できます", 20);
        
        gameState.inputMode = 'normal';
        gameState.passwordTarget_gimmick3 = null;
        
        return false;
    };

    // -------------------------
    // ファイルを開く処理
    // -------------------------
    window.gimmick3System.openEncryptedFile = async function(term, gameState, puzzleHelpers, fileName) {
        const { systemLine, warnLine, wait } = puzzleHelpers;
        const config = window.gimmick3System.PUZZLE_CONFIG;
        
        if (fileName !== config.lockedFile) return false;
        
        await systemLine("[SYSTEM]: トレースされたファイルを開いています...", 30);
        await wait(500);
        await warnLine("[WARNING]: このファイルはパスワードで保護されています", 30);
        await wait(400);
        
        // 確認待ち状態に設定
        gameState.waitingForConfirmation_gimmick3 = {
            type: 'open_encrypted_gimmick3',
            fileName: fileName
        };
        gameState.inputMode = 'gimmick3_confirmation';
        
        term.write('\r\n');
        term.write('[SYSTEM]: パスワードを入力しますか? (Y/N): ');
        
        return true;
    };

    // -------------------------
    // クリア条件チェック
    // -------------------------
    window.gimmick3System.checkClearCondition = function(gameState) {
        return window.gimmick3System.isCleared || gameState.gimmick3Cleared;
    };

    // -------------------------
    // EVEウィンドウ内に画像モーダルを表示する関数
    // -------------------------
    window.gimmick3System.showImageModal = function(imagePath) {
        let old = document.getElementById('eve-keytrace-window');
        if (old) old.remove();
        const win = document.createElement('div');
        win.id = 'eve-keytrace-window';
        win.style.position = 'fixed';
        win.style.left = '50%';
        win.style.top = '50%';
        win.style.transform = 'translate(-50%, -50%)';
        win.style.background = 'rgba(0,0,0,0.97)';
        win.style.border = '2.5px solid #00ff00';
        win.style.borderRadius = '12px';
        win.style.boxShadow = '0 0 40px #00ff00, 0 0 0 #000';
        win.style.maxWidth = '600px';
        win.style.width = '90vw';
        win.style.zIndex = '9999';
        win.style.padding = '0 0 24px 0';
        win.innerHTML = `
            <div style="background:#00ff00;color:#000;padding:12px 0;border-radius:10px 10px 0 0;font-weight:bold;font-size:1.2em;letter-spacing:0.1em;">キーログ画像ビューア</div>
            <div style="padding:24px 24px 0 24px;text-align:center;">
                <div style='color:#00ff00;font-size:1.1em;font-weight:bold;margin-bottom:10px;border-bottom:1px solid #00ff00;padding-bottom:5px;'>=== キートレース画像 ===</div>
                <img src="${imagePath}" alt="key trace" style="max-width:95%;max-height:50vh;border:2px solid #00ff00;box-shadow:0 0 20px #000;background:#222;display:block;margin:0 auto 16px auto;">
                <div style="color:#88ff88;font-style:italic;margin-top:10px;padding:10px;border-left:3px solid #00ff00;background:rgba(0,255,0,0.08);text-align:left;">ヒント: この画像はシステムのキーログ情報を示しています。</div>
            </div>
            <div style="margin:18px 24px 0 24px;padding:10px;background:#002200;border-left:3px solid #00ff00;border-radius:5px;text-align:left;">
                <span style="color:#00ff00;font-weight:bold;">ステータス: </span>
                <span style="color:#88ff88;">表示中 ✓</span>
            </div>
            <button id="eve-keytrace-close" style="margin:24px auto 0 auto;display:block;font-size:1.1rem;padding:0.5em 2em;border-radius:6px;border:1px solid #00ff00;background:#111;color:#00ff00;cursor:pointer;transition:background 0.2s;">閉じる</button>
        `;
        document.body.appendChild(win);
        document.getElementById('eve-keytrace-close').onclick = () => win.remove();
    };

})();
