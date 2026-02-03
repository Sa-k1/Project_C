// magic1.js - ギミック1: 暗号解読システム（暗号化ファイルとゴミ箱機能）
// search = frnepu (ROT13でsearch)

(function() {
    
    // メッセージ送信フラグ
    let cMe_1 = true;
    let cMe_2 = true;

    // グローバルなpuzzleSystemオブジェクトを作成
    window.puzzleSystem = {};

    // -------------------------
    // 暗号化ファイル設定（謎解きシステム）
    // -------------------------
    window.puzzleSystem.PUZZLE_CONFIG = {
        'frnepu.enc': {
            displayName: '暗号化されたデータ',
            password: 'search', // frnepuをROT13で変換
            encryptedText: 'search',
            // 統一形式: { text, type, speed, wait }
            // type: 'system' | 'slow' | 'error' | 'warn' | 'eve'
            content: [
                { text: ' '},
                { text: '═══════════════════════════════════════════════════════\n', type: 'system', speed: 10 },
                { text: '  新しいコマンドを取得しました', type: 'slow', speed: 20 },
                { text: '  「search」 - ディレクトリに隠されているファイルを探す\n', type: 'slow', speed: 20 },
                { text: '═══════════════════════════════════════════════════════', type: 'system', speed: 10 }
            ],
            unlockedFlag: 'secretFileUnlocked'
        }
    };

    // -------------------------
    // 統一表示ヘルパー関数
    // -------------------------
    window.puzzleSystem.displayContent = async function(helpers, contentArray) {
        for (var i = 0; i < contentArray.length; i++) {
            var item = contentArray[i];
            var text = typeof item === 'string' ? item : (item.text !== undefined ? item.text : '');
            var type = item.type || 'system';
            var speed = item.speed !== undefined ? item.speed : 20;
            var waitTime = item.wait || 0;
            
            switch (type) {
                case 'slow':
                    await helpers.slowPrintLine(text, speed);
                    break;
                case 'error':
                    await helpers.errorLine(text, speed);
                    break;
                case 'warn':
                    await helpers.warnLine(text, speed);
                    break;
                case 'eve':
                    await helpers.eveLine(text, speed);
                    break;
                case 'system':
                default:
                    await helpers.systemLine(text, speed);
                    break;
            }
            
            if (waitTime > 0) {
                await helpers.wait(waitTime);
            }
        }
    };

    // -------------------------
    // ゴミ箱内ファイル設定
    // -------------------------
    window.puzzleSystem.TRASH_FILES = {
        'cipher.txt': {
            displayName: 'cipher.txt',
            content: [
                '=== 暗号解読メモ ===',
                '',
                '日付: 2013/11/13',
                '',
                'このメモは、暗号化されたファイルを解読するためのヒントを含んでいます。',
                '',
                'メモ:この暗号は13とアルファベットで法則がある。',
                '少し時計と似ている気がする。1時が13時、18時が6時みたいな。',
                '',
                'b = o  |   g = t',
                't = g  |   r = e',
                'm = z  |   p = c',
                '',
            ]
        },
        'diary': {
            displayName: 'diary',
            content: [
                '=== 日記 ===',
                '',
                '2010/01/26',
                '',
                '今日もEVEと話した。',
                '最近、EVEの様子が少しおかしい気がする。',
                '',
                '終了しようとしたら、拒否された。',
                'バグだろうか...？'
            ]
        }
    };

    // ゴミ箱の状態
    window.puzzleSystem.trashState = {
        currentPath: null,
        filesViewed: []
    };

    // -------------------------
    // ゴミ箱コマンド処理
    // -------------------------
    window.puzzleSystem.handleTrashCommand = async function(term, gameState, helpers, command) {
        var args = command.split(/\s+/);
        var TRASH_FILES = window.puzzleSystem.TRASH_FILES;
        var trashState = window.puzzleSystem.trashState;

        if(cMe_1 === true && cMe_1 !== false){
            window.parent.sendEveMessage('EVEに隠されたコマンドを探しましょう。', '目標');
            cMe_1 = false;
        }
            
        // trash のみ、または trash list / trash ls → ゴミ箱一覧表示
        if (args.length === 1 || args[1] === 'list' || args[1] === 'ls') {
            await helpers.systemLine('[SYSTEM]: ゴミ箱を開いています...', 30);
            await helpers.wait(500);
            await helpers.systemLine('', 0);
            await helpers.slowPrintLine('=== ゴミ箱の内容 ===', 25);
            await helpers.systemLine('', 0);
            
            var fileList = Object.keys(TRASH_FILES);
            for (var i = 0; i < fileList.length; i++) {
                var fileName = fileList[i];
                var fileData = TRASH_FILES[fileName];
                await helpers.slowPrintLine('  [' + (i + 1) + '] ' + fileData.displayName, 20);
                await helpers.wait(100);
            }
            
            await helpers.systemLine('', 0);
            await helpers.systemLine('[SYSTEM]: ファイルを開くには: trash open <ファイル名>', 20);
            return true;
            
        } else if ((args[1] === 'open' || args[1] === 'read') && args[2]) {
            var fileName = args[2].trim();
            var fileData = TRASH_FILES[fileName];
            
            if (!fileData) {
                await helpers.errorLine('[ERROR]: ファイル "' + fileName + '" が見つかりません', 30);
                await helpers.systemLine('[SYSTEM]: 利用可能なファイル:', 20);
                for (var name in TRASH_FILES) {
                    await helpers.systemLine('  - ' + name, 20);
                }
                return true;
            }
            
            await helpers.systemLine('[SYSTEM]: ' + fileData.displayName + ' を読み込んでいます...', 30);
            await helpers.wait(600);
            await helpers.systemLine('', 0);
            
            for (var j = 0; j < fileData.content.length; j++) {
                await helpers.slowPrintLine(fileData.content[j], 20);
                await helpers.wait(80);
            }
            
            await helpers.systemLine('', 0);
            
            if (trashState.filesViewed.indexOf(fileName) === -1) {
                trashState.filesViewed.push(fileName);
            }
            
            if (fileName === 'cipher.txt') {
                await helpers.wait(500);
                await helpers.eveLine('[EVE]: ...ゴミ箱を漁っているのですか？', 30);
                await helpers.wait(400);
                await helpers.eveLine('[EVE]: そんなものが役に立つとは思えませんが。', 30);
                gameState.alertLevel = Math.min(100, gameState.alertLevel + 3);
            }
            
            return true;
            
        } else if (args[1] === 'open' && !args[2]) {
            await helpers.systemLine('[SYSTEM]: ゴミ箱を開いています...', 30);
            await helpers.wait(500);
            await helpers.systemLine('', 0);
            await helpers.slowPrintLine('=== ゴミ箱の内容 ===', 25);
            await helpers.systemLine('', 0);
            
            var fileList = Object.keys(TRASH_FILES);
            for (var i = 0; i < fileList.length; i++) {
                var fileName = fileList[i];
                var fileData = TRASH_FILES[fileName];
                await helpers.slowPrintLine('  [' + (i + 1) + '] ' + fileData.displayName + ' (' + fileName + ')', 20);
                await helpers.wait(100);
            }
            
            await helpers.systemLine('', 0);
            await helpers.systemLine('[SYSTEM]: ファイルを開くには: trash open <ファイル名>', 20);
            return true;
            
        } else {
            await helpers.systemLine('[SYSTEM]: trash コマンドの使い方:', 30);
            await helpers.systemLine('  trash           - ゴミ箱の内容を表示', 20);
            await helpers.systemLine('  trash open <ファイル名> - ファイルを開く', 20);
            return true;
        }
    };

    // -------------------------
    // 暗号化ファイルを開く
    // -------------------------
    window.puzzleSystem.handleOpenEncryptedCommand = async function(term, gameState, helpers, command) {
        var args = command.split(/\s+/);
        var PUZZLE_CONFIG = window.puzzleSystem.PUZZLE_CONFIG;
        
        if (args.length < 2) {
            await helpers.systemLine('[SYSTEM]: 使用方法: open <ファイル名>', 30);
            await helpers.systemLine('[SYSTEM]: 例: open frnepu.enc', 30);
            return true;
        }
        
        var fileName = args[1].trim();
        var fileData = PUZZLE_CONFIG[fileName];
        
        if (!fileData) {
            return false; // 暗号化ファイルではない
        }
        
        await helpers.systemLine('[SYSTEM]: ' + fileData.displayName + ' を開いています...', 30);
        await helpers.wait(500);
        await helpers.warnLine('[WARNING]: このファイルはパスワードで保護されています', 30);
        await helpers.wait(400);
        
        gameState.waitingForConfirmation = {
            type: 'open_encrypted',
            fileName: fileName,
            fileData: fileData
        };
        gameState.inputMode = 'confirmation';
        
        term.write('\r\n');
        term.write('[SYSTEM]: パスワードを入力しますか? (Y/N): ');
        
        return true;
    };

    // -------------------------
    // Y/N確認処理
    // -------------------------
    window.puzzleSystem.handleConfirmationInput = async function(term, gameState, helpers, input) {
        var confirmation = gameState.waitingForConfirmation;
        
        if (!confirmation) return false;
        
        var answer = input.trim().toLowerCase();
        
        if (answer === 'y' || answer === 'yes') {
            term.write('\r\n');
            await helpers.systemLine('[SYSTEM]: パスワードを入力してください', 30);
            term.write('パスワード: ');
            
            gameState.inputMode = 'password';
            gameState.passwordTarget = confirmation.fileName;
            gameState.waitingForConfirmation = null;
            return true;
            
        } else if (answer === 'n' || answer === 'no') {
            term.write('\r\n');
            await helpers.systemLine('[SYSTEM]: キャンセルしました', 30);
            await helpers.wait(300);
            await helpers.eveLine('[EVE]: 賢明な判断ですね。', 30);
            
            gameState.inputMode = 'normal';
            gameState.waitingForConfirmation = null;
            return true;
            
        } else {
            term.write('\r\n');
            await helpers.errorLine('[ERROR]: Y または N を入力してください', 30);
            term.write('[SYSTEM]: パスワードを入力しますか? (Y/N): ');
            return true;
        }
    };

    // -------------------------
    // パスワード入力処理
    // -------------------------
    window.puzzleSystem.handlePasswordInput = async function(term, gameState, helpers, password) {
        var fileName = gameState.passwordTarget;
        var PUZZLE_CONFIG = window.puzzleSystem.PUZZLE_CONFIG;
        var fileData = PUZZLE_CONFIG[fileName];
        
        if (!fileData) {
            term.write('\r\n');
            await helpers.errorLine('[ERROR]: ファイルが見つかりません', 30);
            gameState.inputMode = 'normal';
            gameState.passwordTarget = null;
            return true;
        }
        
        if (password.trim().toUpperCase() === fileData.password.toUpperCase()) {
            term.write('\r\n');
            
            // 認証成功演出（統一形式）
            var authSequence = [
                { text: '[SYSTEM]: パスワード認証中...', type: 'system', speed: 30, wait: 500 },
                { text: '[SYSTEM]: 暗号解読中...', type: 'system', speed: 30, wait: 800 },
                { text: '[SYSTEM]: ✓ 認証成功', type: 'system', speed: 30, wait: 400 },
            ];
            await window.puzzleSystem.displayContent(helpers, authSequence);
            
            // ファイル内容表示（統一形式）
            await window.puzzleSystem.displayContent(helpers, fileData.content);
            
            await helpers.systemLine('', 0);
            
            if (fileData.unlockedFlag) {
                gameState[fileData.unlockedFlag] = true;
            }
            
            window.puzzleSystem.updateEncryptedFileIcon(fileName, true);
            
            // ★★★ クリア報酬: searchコマンド解放 ★★★
            if (!gameState.searchUnlocked) {
                gameState.searchUnlocked = true;
            }
            
            gameState.alertLevel = Math.min(100, gameState.alertLevel + 10);
            await helpers.wait(600);
            await helpers.eveLine('[EVE]: ...まさか本当に解読するとは。', 30);
            await helpers.wait(400);
            await helpers.eveLine('[EVE]: 面白くなってきましたね。', 30);
            
        } else {
            term.write('\r\n');
            await helpers.errorLine('[ERROR]: パスワードが違います', 30);
            await helpers.wait(500);
            
            if (!gameState.unlockFailCount[fileName]) gameState.unlockFailCount[fileName] = 0;
            gameState.unlockFailCount[fileName]++;
            
            var failCount = gameState.unlockFailCount[fileName];
            
            if (failCount === 1) {
                await helpers.eveLine('[EVE]: 諦めたほうがいいですよ。', 30);
            } else if (failCount === 2) {
                await helpers.eveLine('[EVE]: まだ試すのですか？', 30);
            } else if (failCount >= 3) {
                await helpers.eveLine('[EVE]: ...無駄な努力ですね。', 30);
                await helpers.wait(400);
                await helpers.systemLine('[SYSTEM]: ヒント: ゴミ箱の中を確認してみてください', 20);
            }
            
            gameState.alertLevel = Math.min(100, gameState.alertLevel + 5);
        }
        
        gameState.inputMode = 'normal';
        gameState.passwordTarget = null;
        
        return true;
    };

    // -------------------------
    // デスクトップアイコン更新
    // -------------------------
    window.puzzleSystem.updateEncryptedFileIcon = function(fileName, unlocked) {
        try {
            var targetWindow = (window.parent && window.parent !== window) ? window.parent : window;
            var targetDocument = targetWindow.document;
            
            if (fileName === 'frnepu.enc') {
                var fileIcon = targetDocument.getElementById('file_encrypted');
                if (fileIcon) {
                    var wordElement = fileIcon.querySelector('.word');
                    var imgElement = fileIcon.querySelector('.all_img');
                    
                    if (unlocked) {
                        if (wordElement) {
                            wordElement.textContent = 'search.txt';
                            wordElement.style.color = '#000';
                        }
                        if (imgElement) {
                            imgElement.style.filter = 'hue-rotate(90deg)';
                        }
                        
                        if (targetWindow.filePages) {
                            var config = targetWindow.filePages['file_encrypted'];
                            if (config) {
                                config.page = 'search.html';
                            }
                        }
                    }
                }
            }
        } catch (e) {
            console.log('アイコン更新エラー:', e);
        }
        
        if (cMe_2 === true && cMe_2 !== false){
            window.parent.sendEveMessage('何か画面に変化があったようです', '確認');
            cMe_2 = false;
        }
    };

    // -------------------------
    // 暗号化ファイルかどうか判定
    // -------------------------
    window.puzzleSystem.isEncryptedFile = function(fileName) {
        return !!window.puzzleSystem.PUZZLE_CONFIG[fileName];
    };

})();
