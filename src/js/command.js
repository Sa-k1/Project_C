// command.js - コマンド処理モジュール
// このファイルはターミナルで実行されるコマンドの処理を担当します

(function() {
    const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';
    if (!isBrowser) {
        console.error('command.js: not running in a browser environment.');
        return;
    }

    // コマンドハンドラオブジェクト
    const commandHandler = {
        // -------------------------
        // コマンド処理メイン関数
        // -------------------------
        async handleInput(term, gameState, puzzleHelpers, vfs, command) {
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

            // ゴミ箱コマンド
            if (command.toLowerCase().indexOf('trash') === 0) {
                await window.puzzleSystem.handleTrashCommand(term, gameState, puzzleHelpers, command);
                return;
            }

            // 暗号化ファイルを開くコマンド
            if (command.toLowerCase().indexOf('open ') === 0) {
                var args = command.split(/\s+/);
                var fileName = args[1] ? args[1].trim() : '';
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
                term.writeln("\r  dir / ls      - ディレクトリの内容を表示");
                term.writeln("\r  cd <フォルダ名> - フォルダに移動");
                term.writeln("\r  cd ..         - 上のフォルダに戻る");
                term.writeln("\r  cat <ファイル名> - ファイルの内容を表示");
                term.writeln("\r  open <ファイル名> - ファイルを開く");
                term.writeln("\r  clear         - 画面をクリア");
                term.writeln("\r  trash         - ゴミ箱を開く");
                return;
            }

            // clearコマンド
            if (command.toLowerCase() === "clear" || command.toLowerCase() === "cls") {
                term.clear();
                return;
            }

            // 不明なコマンド
            await errorLine("[ERROR]: '" + command + "' は認識されないコマンドです。", 20);
            await systemLine("[SYSTEM]: 'help' でコマンド一覧を確認できます。", 20);
        }
    };

    // グローバルに公開
    window.commandHandler = commandHandler;

})();
