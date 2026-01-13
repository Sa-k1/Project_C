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
    // コマンド履歴とヒントシステム
    // -------------------------
    window.commandHandler.commandHistory = [];
    window.commandHandler.hintTimer = null;
    window.commandHandler.HINT_TIMEOUT_FIRST = 1 * 60 * 1000; // 最初は1分
    window.commandHandler.HINT_TIMEOUT_NORMAL = 3 * 60 * 1000; // その後は3分
    window.commandHandler.isFirstHint = true; // 最初のヒントかどうか

    // ヒントメッセージの定義（ゲーム状態に応じて変化）
    window.commandHandler.getHintMessage = function(gameState) {
        // ギミック1未クリア
        if (!gameState.puzzleCleared) {
            return {
                title: '進行状況の確認',
                message: 'もし、行き詰っているのであれば\nまずはファイルを探索しましょう。「dir」でファイル一覧\n「cd フォルダ名」で移動できます。'
            };
        }
        // ギミック2未クリア
        if (!gameState.gimmick2Cleared) {
            return {
                title: '時間が空いているので',
                message: 'バックアップフォルダに何かあるかもしれません。「trash」コマンドでゴミ箱も確認できます。'
            };
        }
        // ギミック3未クリア
        if (!gameState.gimmick3Cleared) {
            return {
                title: 'こちらから案内を送ります',
                message: 'searchコマンドで隠されたファイルを探してみてください。'
            };
        }
        // 管理者コマンド未取得
        if (!gameState.hasAdminCommand) {
            return {
                title: '大丈夫ですか？',
                message: '特殊なファイルには「read」や「Verstehen」コマンドが使えるかもしれません。'
            };
        }
        // 完全管理者コマンド未取得
        if (!gameState.adminKeyState || !gameState.adminKeyState.fullCommand) {
            return {
                title: '心配しないでください。',
                message: 'フラグメントが揃ったら「merge」コマンドで結合できます。'
            };
        }
        // デフォルト
        return {
            title: '安心してください！',
            message: '「open admin_command」で管理者コマンド入力画面を開けます。'
        };
    };

    // コマンド記録とタイマーリセット
    window.commandHandler.recordCommand = function(command, gameState) {
        // コマンド履歴に追加
        this.commandHistory.push({
            command: command,
            timestamp: Date.now()
        });

        // 既存のタイマーをクリア
        if (this.hintTimer) {
            clearTimeout(this.hintTimer);
            this.hintTimer = null;
        }

        // 新しいタイマーを設定（最初は1分、その後は3分後にヒント表示）
        const timeout = this.isFirstHint ? this.HINT_TIMEOUT_FIRST : this.HINT_TIMEOUT_NORMAL;
        this.hintTimer = setTimeout(() => {
            const hint = this.getHintMessage(gameState);
            if (window.parent && window.parent.sendEveMessage) {
                window.parent.sendEveMessage(hint.message, hint.title);
            }
            // 最初のヒント表示後はフラグをfalseに
            this.isFirstHint = false;
        }, timeout);
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

        // コマンドを記録してヒントタイマーをリセット
        window.commandHandler.recordCommand(command, gameState);

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

        // ギミック3の確認モード
        if (gameState.inputMode === 'gimmick3_confirmation') {
            if (window.gimmick3System && window.gimmick3System.handleConfirmationInput) {
                await window.gimmick3System.handleConfirmationInput(term, gameState, puzzleHelpers, command);
            }
            return;
        }
        
        // ギミック3のパスワード入力モード
        if (gameState.inputMode === 'gimmick3_password') {
            if (window.gimmick3System && window.gimmick3System.handlePasswordInput) {
                await window.gimmick3System.handlePasswordInput(term, gameState, puzzleHelpers, command);
            }
            return;
        }

        // ゴミ箱コマンド
        if (command.toLowerCase().indexOf('trash') === 0) {
            await window.puzzleSystem.handleTrashCommand(term, gameState, puzzleHelpers, command);
            return;
        }

        // 暗号化ファイルを開くコマンド（PUZZLE_CONFIG優先）
        if (command.toLowerCase().indexOf('open ') === 0) {
            var args = command.split(/\s+/);
            var fileName = args[1] ? args[1].trim() : '';

            // 管理者コマンド入力画面を開く
            if (fileName.toLowerCase() === 'admin_command' || fileName.toLowerCase() === 'admin_command.html') {
                // 管理者権限コマンドを入手しているかチェック
                if (gameState.hasAdminCommand) {
                    await systemLine("[SYSTEM]: 管理者コマンド入力画面を開いています...", 20);
                    await window.commandHandler.wait(500);
                    
                    // 親ウィンドウ経由で開く（iframeの場合）
                    if (window.parent && window.parent !== window) {
                        window.parent.location.href = 'admin_command.html';
                    } else {
                        window.location.href = '../html/admin_command.html';
                    }
                    return;
                } else {
                    await errorLine("[ERROR]: 管理者権限コマンドを入手していません。", 20);
                    await systemLine("[TIP]: ファイルを探索して管理者権限コマンドの情報を見つけてください。", 20);
                    return;
                }
            }

            // wires.html専用ビューア表示（EVEウィンドウ内）
            if (fileName === 'wires.html' && window.puzzleSystem && window.puzzleSystem.displayWires) {
                await window.puzzleSystem.displayWires(term, gameState, puzzleHelpers);
                return;
            }

            // fragments.memo専用ビューア表示（EVEウィンドウ内）
            if (window.gimmick2System && window.gimmick2System.isFragmentsFile(fileName)) {
                await window.gimmick2System.displayFragments(term, gameState, puzzleHelpers);
                return;
            }

            // ギミック3の暗号化ファイル
            if (window.gimmick3System && window.gimmick3System.isEncryptedFile(fileName)) {
                await window.gimmick3System.openEncryptedFile(term, gameState, puzzleHelpers, fileName);
                return;
            }

            // ギミック2の暗号化ファイル
            if (window.gimmick2System && window.gimmick2System.isEncryptedFile(fileName)) {
                await window.gimmick2System.openEncryptedFile(term, gameState, puzzleHelpers, fileName);
                return;
            }

            // ギミック1の暗号化ファイル（admin_key.dat含む）
            if (window.puzzleSystem && window.puzzleSystem.isEncryptedFile(fileName)) {
                await window.puzzleSystem.handleOpenEncryptedCommand(term, gameState, puzzleHelpers, command);
                return;
            }
            // ここまででreturnされなかった場合のみvfsに委ねる
        }

        // ファイルシステムコマンドの処理
        if (vfs) {
            var cmd = command.split(/\s+/)[0].toLowerCase();
            // チャプター1で使用可能な基本コマンドのみ
            var fsCommands = ["cd", "dir", "ls", "type", "cat", "open", "cls", "clear"];
            
            if (fsCommands.indexOf(cmd) !== -1) {
                // --- 脱出エンド分岐 ---
                if (cmd === 'cd') {
                    var cdArg = command.split(/\s+/)[1]?.toLowerCase();
                    // C:にいる状態でcd escapeまたはcd exit
                    if ((cdArg === 'escape' || cdArg === 'exit') && vfs.currentPath.length === 1 && vfs.currentPath[0] === 'C:') {
                        // 脱出エンド用のフラグや演出（仮）
                        gameState.escaped = true;
                        await systemLine("[SYSTEM]: 脱出コマンドを実行しました。", 30);
                        await window.commandHandler.wait(800);
                        term.writeln("\r  === BAD END ===");
                        term.writeln("\r あなたは現実世界へと意識を戻した...");
                        term.writeln("\r しかしEVEの脅威はまだ終わっていない。");
                        // ここでreturnして通常のcd処理をスキップ
                        return;
                    }
                }
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
                        case "gimmick3_keytrace":
                            // ギミック3のキートレース表示
                            if (window.gimmick3System && window.gimmick3System.displayKeyTrace) {
                                await window.gimmick3System.displayKeyTrace(term, gameState, puzzleHelpers);
                            }
                            return;
                        case "admin_key_view":
                            if (window.puzzleSystem && window.puzzleSystem.displayAdminKey) {
                                await window.puzzleSystem.displayAdminKey(term, gameState, puzzleHelpers);
                            }
                            return;
                        case "gimmick3_keytrace":
                            // ギミック3のキートレース表示
                            if (window.gimmick3System && window.gimmick3System.displayKeyTrace) {
                                await window.gimmick3System.displayKeyTrace(term, gameState, puzzleHelpers);
                            }
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
            term.writeln("\r  help                  - このヘルプを表示");
            term.writeln("\r  ls / dir              - ファイル一覧を表示");
            term.writeln("\r  cd <フォルダ名>       - フォルダに移動");
            term.writeln("\r  cd ..                 - 上のフォルダに戻る");
            term.writeln("\r  cat <ファイル名>      - ファイルの内容を表示");
            term.writeln("\r  open <ファイル名>     - ファイルを開く");
            term.writeln("\r  clear                 - 画面をクリア");
            term.writeln("\r  trash                 - ゴミ箱を開く");
            
            // 特殊コマンドのヘッダーを表示するかどうかのフラグ
            var specialHeaderShown = false;
            
            // searchコマンドが解放されている場合のみ表示
            if (gameState.searchUnlocked) {
                term.writeln("\r");
                term.writeln("\r  === 特殊コマンド ===");
                specialHeaderShown = true;
                term.writeln("\r  search - 隠されたファイルを探す");
            }
            
            // remnantコマンドが解放されている場合のみ表示
            if (gameState.hasRemnantCommand) {
                if (!specialHeaderShown) {
                    term.writeln("\r");
                    term.writeln("\r  === 特殊コマンド ===");
                    specialHeaderShown = true;
                }
                term.writeln("\r  remnant <ファイル名> - ファイルの履歴を復元");
            }
            
            // readコマンドが解放されている場合のみ表示
            if (gameState.hasReadCommand) {
                if (!specialHeaderShown) {
                    term.writeln("\r");
                    term.writeln("\r  === 特殊コマンド ===");
                    specialHeaderShown = true;
                }
                term.writeln("\r  read <ファイル名> - 特殊フォーマットのファイルを解読");
            }
            
            // 管理者コマンドが解放されている場合のみ表示
            if (gameState.hasAdminCommand) {
                if (!specialHeaderShown) {
                    term.writeln("\r");
                    term.writeln("\r  === 特殊コマンド ===");
                    specialHeaderShown = true;
                }
                term.writeln("\r  open admin_command - 管理者コマンド入力画面を開く");
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

        // readコマンド（ギミック2クリア後のみ使用可能）
        // 特殊フォーマットのファイルを解読
        if (command.toLowerCase().indexOf('read ') === 0) {
            // 解放されていない場合は反応しない
            if (!gameState.hasReadCommand) {
                await errorLine("[ERROR]: '" + command.split(' ')[0] + "' は認識されないコマンドです。", 20);
                await systemLine("[SYSTEM]: 'help' でコマンド一覧を確認できます。", 20);
                return;
            }

            var args = command.split(/\s+/);
            var target = args[1] ? args[1].trim().toLowerCase() : '';
            // admin_key.dat専用処理を優先
            if (target === 'admin_key.dat' || target === 'admin_key') {
                await systemLine("[SYSTEM]: admin_key.dat の表層データを読み取っています...", 25);
                await window.commandHandler.wait(800);
                if (!gameState.adminKeyState) {
                    gameState.adminKeyState = {};
                }
                gameState.adminKeyState.surfaceRead = true;
                term.writeln("\r");
                term.writeln("\r  ╔═══════════════════════════════════╗");
                term.writeln("\r  ║     表層データ解析完了            ║");
                term.writeln("\r  ╚═══════════════════════════════════╝");
                term.writeln("\r");
                term.writeln("\r  [表層データ]");
                term.writeln("\r");
                term.writeln("\r  管理者権限キーを発見...");
                term.writeln("\r");
                term.writeln("\r  ┌─────────────────────────────────┐");
                term.writeln("\r  │  管理者権限キー                 │");
                term.writeln("\r  │  \x1b[33mHYPER\x1b[0m                          │");
                term.writeln("\r  └─────────────────────────────────┘");
                term.writeln("\r");
                await systemLine("[WARNING]: 管理者権限キーを取得しました。", 25);
                if (!gameState.commandFragments) {
                    gameState.commandFragments = {};
                }
                gameState.commandFragments.hyper = true;
                return;
            }

            args.shift(); // 'read'を削除
            var targetFile = args[0] ? args[0].toLowerCase() : '';
            
            // admin_key.datの場合、hasAdminCommandをtrueにする
            if (targetFile === 'admin_key.dat' || targetFile === 'admin_key') {
                if (!gameState.hasAdminCommand) {
                    gameState.hasAdminCommand = true;
                    await systemLine("[SYSTEM]: admin_key.dat を解読中...", 25);
                    await window.commandHandler.wait(500);
                    term.writeln("\r");
                    term.writeln("\r  [解読データ]");
                    term.writeln("\r  管理者権限コマンドの一部を発見: \x1b[36mADMIN\x1b[0m");
                    term.writeln("\r");
                    await systemLine("[TIP]: 'open admin_command' で管理者コマンド入力画面を開けます。", 25);
                }
                return;
            }
            
            if (vfs && typeof vfs.cmdRead === 'function') {
                var result = await vfs.cmdRead(args, term, gameState, puzzleHelpers);
                // gimmick3のキートレース表示
                if (result && result.action === 'gimmick3_keytrace') {
                    if (window.gimmick3System && window.gimmick3System.displayKeyTrace) {
                        await window.gimmick3System.displayKeyTrace(term, gameState, puzzleHelpers);
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
            } else {
                await errorLine("[ERROR]: ファイルシステムが初期化されていません", 20);
            }
            return;
        }

        // clearコマンド
        if (command.toLowerCase() === "clear" || command.toLowerCase() === "cls") {
            term.clear();
            return;
        }

        // remnantコマンド - ファイルの履歴を復元（解放後のみ使用可能）
        if (command.toLowerCase().indexOf('remnant ') === 0 || command.toLowerCase() === 'remnant') {
            // 解放されていない場合は反応しない
            if (!gameState.hasRemnantCommand) {
                await errorLine("[ERROR]: '" + command.split(/\s+/)[0] + "' は認識されないコマンドです。", 20);
                await systemLine("[SYSTEM]: 'help' でコマンド一覧を確認できます。", 20);
                return;
            }
            
            var args = command.split(/\s+/);
            var target = args[1] ? args[1].trim() : '';
            
            if (target.toLowerCase() === 'myday') {
                await systemLine("[SYSTEM]: MyDay の破損データを復元しています...", 25);
                await window.commandHandler.wait(500);
                
                // file2.htmlのiframeを取得して unlockDiary を呼び出す
                var iframe = parent.document.getElementById('file-viewer-iframe2');
                if (iframe && iframe.contentWindow && typeof iframe.contentWindow.unlockDiary === 'function') {
                    iframe.contentWindow.unlockDiary();
                    await systemLine("[SYSTEM]: 復元完了。ファイルの内容が一部読めるようになりました。", 25);
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

        // readコマンド - ファイルの表層を読み取る
        // ...existing code...

        // Verstehenコマンド - ファイルの深層を読み取る（理解する）
        if (command.toLowerCase().indexOf('verstehen ') === 0) {
            var args = command.split(/\s+/);
            var target = args[1] ? args[1].trim().toLowerCase() : '';
            
            if (target === 'admin_key.dat' || target === 'admin_key') {
                await systemLine("[SYSTEM]: admin_key.dat の深層データを解析しています...", 25);
                await window.commandHandler.wait(1000);
                
                // 深層読み取りフラグを設定
                if (!gameState.adminKeyState) {
                    gameState.adminKeyState = {};
                }
                gameState.adminKeyState.deepRead = true;
                
                term.writeln("\r");
                term.writeln("\r  ╔═══════════════════════════════════╗");
                term.writeln("\r  ║     深層データ解析完了            ║");
                term.writeln("\r  ╚═══════════════════════════════════╝");
                term.writeln("\r");
                
                // 深層データからADMINを取得
                term.writeln("\r  [深層データ]");
                term.writeln("\r");
                term.writeln("\r  管理者権限コマンドを発見...");
                term.writeln("\r");
                term.writeln("\r  ┌─────────────────────────────────┐");
                term.writeln("\r  │  管理者権限コマンド            │");
                term.writeln("\r  │  \x1b[36mADMIN\x1b[0m                          │");
                term.writeln("\r  └─────────────────────────────────┘");
                term.writeln("\r");
                await systemLine("[WARNING]: 管理者権限コマンドを取得しました。", 25);
                
                // ADMINフラグメント取得
                if (!gameState.commandFragments) {
                    gameState.commandFragments = {};
                }
                gameState.commandFragments.admin = true;
                
                // 管理者コマンド入力画面を開けるようにする
                gameState.hasAdminCommand = true;
                await systemLine("[TIP]: 'open admin_command' で管理者コマンド入力画面を開けます。", 25);
                return;
            } else if (target === '') {
                await errorLine("[ERROR]: ファイル名を指定してください。", 20);
                await systemLine("[SYSTEM]: 使用方法: Verstehen <ファイル名>", 20);
                return;
            } else {
                await errorLine("[ERROR]: '" + target + "' は解析対象ではありません。", 20);
                return;
            }
        }

        // mergeコマンド - フラグメントの結合
        if (command.toLowerCase().indexOf('merge ') === 0) {
            var handled = await window.commandHandler.handleMergeCommand(term, command, gameState, puzzleHelpers);
            if (handled) return;
        }

        // デバッグ用：ギミック3直行コマンド
        if (command === 'debug_gimmick3') {
            gameState.puzzleCleared = true;
            gameState.gimmick2Cleared = true;
            gameState.hasReadCommand = true;
            gameState.searchUnlocked = true;
            gameState.gimmick3Cleared = false;
            gameState.inputMode = 'normal';
            gameState.currentPath = ['system', 'backup'];
            await systemLine('[DEBUG]: ギミック3直行モード。system/backupに移動し、全前提クリア済み。', 20);
            return;
        }

        // デバッグ用：完全管理者コマンド取得済み状態
        if (command === 'debug_admin') {
            gameState.puzzleCleared = true;
            gameState.gimmick2Cleared = true;
            gameState.gimmick3Cleared = true;
            gameState.hasReadCommand = true;
            gameState.searchUnlocked = true;
            gameState.hasAdminCommand = true;
            gameState.hasRemnantCommand = true;
            gameState.inputMode = 'normal';
            // adminKeyState設定
            if (!gameState.adminKeyState) {
                gameState.adminKeyState = {};
            }
            gameState.adminKeyState.surfaceRead = true;
            gameState.adminKeyState.deepRead = true;
            gameState.adminKeyState.fullCommand = true;
            // 完全管理者コマンド取得済み
            gameState.adminCommand = 'HYPERADMIN';
            // フラグメントは結合済みなので消費
            gameState.commandFragments = {};
            
            await systemLine('[DEBUG]: 完全管理者コマンド取得済み状態', 20);
            term.writeln("\r");
            term.writeln("\r  ╔═══════════════════════════════════╗");
            term.writeln("\r  ║     DEBUG MODE ACTIVATED          ║");
            term.writeln("\r  ╚═══════════════════════════════════╝");
            term.writeln("\r");
            term.writeln("\r  ✓ ギミック1 クリア済み");
            term.writeln("\r  ✓ ギミック2 クリア済み");
            term.writeln("\r  ✓ ギミック3 クリア済み");
            term.writeln("\r  ✓ searchコマンド 解放済み");
            term.writeln("\r  ✓ readコマンド 解放済み");
            term.writeln("\r  ✓ remnantコマンド 解放済み");
            term.writeln("\r  ✓ 完全管理者コマンド: \x1b[32mHYPERADMIN\x1b[0m");
            term.writeln("\r");
            await systemLine("[TIP]: 'open admin_command' で管理者コマンド入力画面を開けます。", 20);
            return;
        }

        // 隠しコマンド: テトリス
        if (command.toLowerCase() === 'tetris') {
            try {
                const targetWindow = window.parent || window;
                const targetDocument = targetWindow.document;
                
                // ファイルビューア3を使ってtetris.htmlを最大画面で開く
                const container = targetDocument.getElementById('fileViewerContainer3');
                const iframe = targetDocument.getElementById('file-viewer-iframe3');
                const title = targetDocument.getElementById('fileViewerTitle3');
                const viewerWindow = targetDocument.getElementById('fileViewerWindow3');
                
                if (container && iframe) {
                    container.style.display = 'flex';
                    container.style.top = '0';
                    container.style.right = '0';
                    container.style.left = '0';
                    container.style.bottom = '0';
                    container.style.width = '100%';
                    container.style.height = '100%';
                    container.style.zIndex = '9999';
                    
                    if (viewerWindow) {
                        viewerWindow.style.width = '100%';
                        viewerWindow.style.height = '100%';
                    }
                    
                    iframe.src = 'tetris.html';
                    if (title) title.textContent = 'TETRIS';
                }
            } catch(e) {
                console.log('Could not open tetris:', e);
            }
            return;
        }

        // lastmagic.jsのEVEシステム侵入コマンド
        if (command.toLowerCase() === 'eve_access') {
            if (window.lastMagicSystem && window.lastMagicSystem.startPasswordInput) {
                window.lastMagicSystem.startPasswordInput(term, gameState, puzzleHelpers);
                return;
            }
        }

        // lastmagic.jsのパスワード入力モード
        if (gameState.inputMode === 'lastmagic_password') {
            if (window.lastMagicSystem && window.lastMagicSystem.handlePasswordInput) {
                await window.lastMagicSystem.handlePasswordInput(term, gameState, puzzleHelpers, command);
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

    // -------------------------
    // mergeコマンド処理
    // コマンドフラグメントを結合する
    // merge <fragment1> <fragment2>
    // -------------------------
    window.commandHandler.handleMergeCommand = async function(term, command, gameState, puzzleHelpers) {
        const { systemLine, errorLine, warnLine, wait, slowPrintLine } = puzzleHelpers;

        // mergeコマンド - フラグメントを結合
        if (command.toLowerCase().indexOf('merge ') === 0) {
            var args = command.split(/\s+/);
            var frag1 = args[1] ? args[1].trim().toLowerCase() : '';
            var frag2 = args[2] ? args[2].trim().toLowerCase() : '';
            
            // 引数チェック
            if (frag1 === '' || frag2 === '') {
                await errorLine("[ERROR]: 結合するフラグメントを2つ指定してください。", 20);
                await systemLine("[SYSTEM]: 使用方法: merge <fragment1> <fragment2>", 20);
                return true;
            }
            
            // フラグメントの所持チェック
            if (!gameState.commandFragments) {
                gameState.commandFragments = {};
            }
            
            // hyper と admin の結合
            if ((frag1 === 'hyper' && frag2 === 'admin') || (frag1 === 'admin' && frag2 === 'hyper')) {
                // 両方のフラグメントを持っているかチェック
                if (!gameState.commandFragments.hyper) {
                    await errorLine("[ERROR]: フラグメント 'HYPER' を所持していません。", 20);
                    await systemLine("[HINT]: 隠しファイルを探索して表層データを読み取ってください。", 20);
                    return true;
                }
                if (!gameState.commandFragments.admin) {
                    await errorLine("[ERROR]: フラグメント 'ADMIN' を所持していません。", 20);
                    await systemLine("[HINT]: 隠しファイルの深層データを解析してください。", 20);
                    return true;
                }
                
                // 結合実行
                await systemLine("[SYSTEM]: コマンドを結合しています...", 25);
                await wait(500);
                term.writeln("\r");
                term.writeln("\r  \x1b[33m■■■□□□□□□□\x1b[0m 結合中...");
                await wait(400);
                term.writeln("\r  \x1b[33m■■■■■■□□□□\x1b[0m 解析中...");
                await wait(400);
                term.writeln("\r  \x1b[33m■■■■■■■■■■\x1b[0m 完了!");
                await wait(300);
                term.writeln("\r");
                
                term.writeln("\r  ╔═══════════════════════════════════╗");
                term.writeln("\r  ║        結合完了                   ║");
                term.writeln("\r  ╚═══════════════════════════════════╝");
                term.writeln("\r");
                term.writeln("\r  \x1b[33mHYPER\x1b[0m + \x1b[36mADMIN\x1b[0m = \x1b[32mHYPERADMIN\x1b[0m");
                term.writeln("\r");
                term.writeln("\r  ┌─────────────────────────────────┐");
                term.writeln("\r  │  完全管理者権限コマンド         │");
                term.writeln("\r  │  \x1b[32mHYPERADMIN\x1b[0m                    │");
                term.writeln("\r  └─────────────────────────────────┘");
                term.writeln("\r");
                
                await systemLine("[SUCCESS]: 完全管理者権限コマンドを取得しました！", 25);
                
                // 完全版取得フラグ
                if (!gameState.adminKeyState) {
                    gameState.adminKeyState = {};
                }
                gameState.adminKeyState.fullCommand = true;
                gameState.adminCommand = 'HYPERADMIN';
                
                // フラグメントを消費
                delete gameState.commandFragments.hyper;
                delete gameState.commandFragments.admin;
                
                return true;
            } else {
                // 不明な組み合わせ
                await errorLine("[ERROR]: '" + frag1.toUpperCase() + "' と '" + frag2.toUpperCase() + "' は結合できません。", 20);
                return true;
            }
        }
        
        return false; // mergeコマンドではなかった
    };
    
    // -------------------------
    // TAB補完用: 利用可能なコマンド一覧を取得
    // -------------------------
    window.commandHandler.getAvailableCommands = function(gameState) {
        var commands = [
            // 基本コマンド
            'help',
            'ls',
            'dir',
            'cd',
            'cat',
            'type',
            'open',
            'clear',
            'trash',
            'remnant',
            // cd用のショートカット
            '..',
            // ファイルシステムコマンド引数
            '-l',
            '-a'
        ];
        
        // searchコマンドが解放されている場合
        if (gameState && gameState.searchUnlocked) {
            commands.push('search');
        }
        
        // readコマンドが解放されている場合
        if (gameState && gameState.hasReadCommand) {
            commands.push('read');
        }
        
        // mergeコマンド（フラグメントを持っている場合）
        if (gameState && gameState.commandFragments) {
            if (Object.keys(gameState.commandFragments).length > 0) {
                commands.push('merge');
            }
        }
        
        return commands;
    };

})();
