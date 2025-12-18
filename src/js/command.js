// command.js - コマンド処理モジュール
// このファイルはターミナルで実行されるコマンドの処理を担当します

(function() {
    // グローバルなcommandHandlerオブジェクトを作成
    window.commandHandler = {};

    // waitヘルパー関数
    window.commandHandler.wait = function(ms) {
        return new Promise(res => setTimeout(res, ms));
    };

    // -------------------------
    // 【重要】検索できないキーワード
    // 別ルート（隠しコマンド）に関連するものは全て検索不可
    // -------------------------
    window.commandHandler.BLOCKED_KEYWORDS = [
        // 隠しコマンド自体
        'override', 'sleep', 'rm -rf eve', 'hack', 'admin', 'root', 'debug',
        // 隠しコマンドに関連するキーワード
        '上書き', 'オーバーライド', 'スリープ', '削除', 'ハック', 'ハッキング',
        '管理者', 'アドミン', 'ルート', 'デバッグ', 
        // 別ルートへの誘導になりそうなキーワード
        '別ルート', '隠しエンド', '真エンド', 'トゥルーエンド', 'true end',
        'バッドエンド', 'bad end', '裏', 'シークレット', 'secret end'
    ];
    
    // -------------------------
    // ロックされたファイル（パスワード入力で解除）
    // -------------------------
    window.commandHandler.LOCKED_FILES = {
        // ギミック2のロックファイル
        'restored_data.enc': {
            password: 'HOPE',
            location: 'backup',
            reward: 'gimmick2Clear',
            successMessage: 'データの復元に成功しました！',
            content: '=== 復元されたデータ ===\n\nEVEシステム バックアップログ\n...'
        }
    };

    // -------------------------
    // コマンド処理メイン関数
    // -------------------------
    window.commandHandler.handleInput = async function(term, gameState, puzzleHelpers, vfs, command) {
        const { systemLine, errorLine } = puzzleHelpers;
        
        command = (command || "").trim();
        if (!command) return;

        // ★★★ 入力モード分岐 ★★★
        if (gameState.inputMode === 'confirmation') {
            await window.puzzleSystem.handleConfirmationInput(term, gameState, puzzleHelpers, command);
            return;
        }
        
        if (gameState.inputMode === 'password') {
            await window.puzzleSystem.handlePasswordInput(term, gameState, puzzleHelpers, command);
            return;
        }
        
        // ギミック2の確認モード
        if (gameState.inputMode === 'gimmick2_confirmation') {
            if (window.gimmick2System && window.gimmick2System.handleConfirmationInput) {
                await window.gimmick2System.handleConfirmationInput(term, gameState, puzzleHelpers, command);
            }
            return;
        }
        
        // ギミック2のパスワード入力モード
        if (gameState.inputMode === 'gimmick2_password') {
            if (window.gimmick2System && window.gimmick2System.handlePasswordInput) {
                await window.gimmick2System.handlePasswordInput(term, gameState, puzzleHelpers, command);
            }
            return;
        }

        // ゴミ箱コマンド
        if (command.toLowerCase().indexOf('trash') === 0) {
            await window.puzzleSystem.handleTrashCommand(term, gameState, puzzleHelpers, command);
            return;
        }

        // 暗号化ファイルを開くコマンド
        if (command.toLowerCase().indexOf('open ') === 0) {
            var args = command.split(/\s+/);
            var fileName = args[1] ? args[1].trim() : '';
            
            // ギミック2の暗号化ファイル
            if (window.gimmick2System && window.gimmick2System.isEncryptedFile(fileName)) {
                await window.gimmick2System.openEncryptedFile(term, gameState, puzzleHelpers, fileName);
                return;
            }
            
            // ギミック1の暗号化ファイル
            if (window.puzzleSystem && window.puzzleSystem.isEncryptedFile(fileName)) {
                await window.puzzleSystem.handleOpenEncryptedCommand(term, gameState, puzzleHelpers, command);
                return;
            }
            // 暗号化ファイルでない場合は既存のvfs処理に委ねる
        }

        // ファイルシステムコマンドの処理
        if (vfs) {
            var cmd = command.split(/\s+/)[0].toLowerCase();
            // チャプター1で使用可能な基本コマンドのみ
            var fsCommands = ["cd", "dir", "ls", "type", "cat", "open", "cls", "clear"];
            
            if (fsCommands.indexOf(cmd) !== -1) {
                var result = await vfs.execute(command);
                
                // 特殊アクション処理
                if (result && typeof result === "object" && result.action) {
                    switch (result.action) {
                        case "clear":
                            term.clear();
                            return;
                        case "openFile":
                            await systemLine("ファイルを開いています: " + result.file, 20);
                            window.open("../html/" + result.file, "_blank");
                            return;
                    }
                }
                
                // 通常の出力
                if (result) {
                    var lines = String(result).split("\n");
                    for (var i = 0; i < lines.length; i++) {
                        term.writeln("\r" + lines[i]);
                    }
                }
                return;
            }
        } else {
            // vfsが利用できない場合のフォールバック
            var cmd = command.split(/\s+/)[0].toLowerCase();
            if (cmd === "dir" || cmd === "ls" || cmd === "cd" || cmd === "cat" || cmd === "type") {
                await errorLine("[ERROR]: ファイルシステムが初期化されていません", 20);
                return;
            }
        }

        // helpコマンド（常に使用可能）
        if (command.toLowerCase() === "help") {
            await systemLine("[SYSTEM]: 利用可能なコマンド一覧", 20);
            term.writeln("\r");
            term.writeln("\r  === 基本コマンド ===");
            term.writeln("\r  help          - このヘルプを表示");
            term.writeln("\r  ls / dir      - ファイル一覧を表示");
            term.writeln("\r  cd <フォルダ名> - フォルダに移動");
            term.writeln("\r  cd ..         - 上のフォルダに戻る");
            term.writeln("\r  cat <ファイル名> - ファイルの内容を表示");
            term.writeln("\r  open <ファイル名> - ファイルを開く");
            term.writeln("\r  clear         - 画面をクリア");
            term.writeln("\r  trash         - ゴミ箱を開く");
            term.writeln("\r  remnant <ファイル名> - ファイルの履歴を復元");
            
            // searchコマンドが解放されている場合のみ表示
            if (gameState.searchUnlocked) {
                term.writeln("\r");
                term.writeln("\r  === 特殊コマンド ===");
                term.writeln("\r  search - 隠されたファイルを探す");
            }
            return;
        }

        // searchコマンド（解放後のみ使用可能）
        // 現在のフォルダの隠しファイルを発見する
        if (command.toLowerCase() === "search") {
            // 解放されていない場合は反応しない
            if (!gameState.searchUnlocked) {
                await errorLine("[ERROR]: '" + command + "' は認識されないコマンドです。", 20);
                await systemLine("[SYSTEM]: 'help' でコマンド一覧を確認できます。", 20);
                return;
            }
            
            await window.commandHandler.handleSearchCommand(term, gameState, puzzleHelpers, vfs);
            return;
        }

        // clearコマンド
        if (command.toLowerCase() === "clear" || command.toLowerCase() === "cls") {
            term.clear();
            return;
        }

        // remnantコマンド - ファイルの履歴を復元
        if (command.toLowerCase().indexOf('remnant ') === 0) {
            var args = command.split(/\s+/);
            var target = args[1] ? args[1].trim() : '';
            
            if (target.toLowerCase() === 'myday') {
                await systemLine("[SYSTEM]: MyDay の破損データを復元しています...", 25);
                await window.commandHandler.wait(500);
                
                // file2.htmlのiframeを取得して unlockDiary を呼び出す
                var iframe = parent.document.getElementById('file-viewer-iframe2');
                if (iframe && iframe.contentWindow && typeof iframe.contentWindow.unlockDiary === 'function') {
                    iframe.contentWindow.unlockDiary();
                    await systemLine("[SYSTEM]: 復元完了。ファイルの内容が読めるようになりました。", 25);
                } else {
                    // iframeがまだ読み込まれていない場合、親ウィンドウ（index.html）にフラグを設定
                    try {
                        parent.window.diaryUnlockPending = true;
                    } catch(e) {
                        console.log('Could not set flag on parent:', e);
                    }
                    await systemLine("[SYSTEM]: 破損データを復元しました。", 25);
                }
                return;
            } else if (target === '') {
                await errorLine("[ERROR]: ファイル名を指定してください。", 20);
                await systemLine("[SYSTEM]: 使用方法: remnant <ファイル名>", 20);
                return;
            } else {
                await errorLine("[ERROR]: '" + target + "' の履歴データは見つかりませんでした。", 20);
                return;
            }
        }

        // 不明なコマンド
        await errorLine("[ERROR]: '" + command + "' は認識されないコマンドです。", 20);
        await systemLine("[SYSTEM]: 'help' でコマンド一覧を確認できます。", 20);
    };

    // -------------------------
    // searchコマンド処理
    // 現在のフォルダの隠しファイル/フォルダを発見する
    // search = 隠しファイル発見コマンド
    // -------------------------
    window.commandHandler.handleSearchCommand = async function(term, gameState, puzzleHelpers, vfs) {
        const { systemLine, warnLine, wait, slowPrintLine } = puzzleHelpers;

        await systemLine("[SYSTEM]: 周囲を調査中...", 30);
        await wait(800);
        
        // 現在のフォルダから隠しファイルを取得
        const currentDir = vfs ? vfs.getCurrentDir() : null;
        const currentPath = vfs ? vfs.getPathString() : '';
        let hiddenFiles = [];
        
        // discoveredHiddenの初期化
        if (!gameState.discoveredHidden) {
            gameState.discoveredHidden = [];
        }
        
        if (currentDir && currentDir.children) {
            for (const name in currentDir.children) {
                const node = currentDir.children[name];
                if (node.hidden) {
                    hiddenFiles.push({
                        name: name,
                        type: node.type === 'folder' ? 'folder' : 'file'
                    });
                    
                    // 発見したパスを記録（フォルダの場合）
                    if (node.type === 'folder') {
                        const fullPath = currentPath + '/' + name;
                        const normalizedPath = fullPath.replace(/\\/g, '/');
                        if (!gameState.discoveredHidden.includes(normalizedPath)) {
                            gameState.discoveredHidden.push(normalizedPath);
                        }
                    }
                }
            }
        }
        
        await systemLine("", 0);
        await systemLine("╔════════════════════════════════════╗", 5);
        await systemLine("║          調査結果                  ║", 5);
        await systemLine("╚════════════════════════════════════╝", 5);
        await systemLine("", 0);
        
        if (hiddenFiles.length > 0) {
            // 隠しファイルが見つかった
            await warnLine("  ！ 隠されたものを発見しました ！", 25);
            await systemLine("", 0);
            
            for (var i = 0; i < hiddenFiles.length; i++) {
                var file = hiddenFiles[i];
                var icon = file.type === 'folder' ? '📁' : '📄';
                await slowPrintLine("    " + icon + " " + file.name, 20);
            }
            
            await systemLine("", 0);
            await systemLine("[TIP]: open <ファイル名> で中身を確認できます", 20);
            
        } else {
            // 隠しファイルがない
            await slowPrintLine("  この場所には隠されたものはないようです...", 25);
            await systemLine("", 0);
            await systemLine("[TIP]: 他のフォルダを探索してみてください", 20);
        }
        
        // 警戒度を少し上げる
        gameState.alertLevel = Math.min(100, (gameState.alertLevel || 0) + 1);
    };

})();
