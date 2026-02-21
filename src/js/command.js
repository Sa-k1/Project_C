// command.js - コマンド処理モジュール
// このファイルはターミナルで実行されるコマンドの処理を担当します

(function() {
    // グローバルなcommandHandlerオブジェクトを作成
    window.commandHandler = {};

    let cMe_10 = true;

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
        'memory.enc': {
            password: 'HOPE',
            location: 'backup',
            reward: 'gimmick2Clear',
            successMessage: 'データの復元に成功しました！',
            content: '=== 復元されたデータ ===\n\nEVEシステム バックアップログ\n...'
        }
    };

    // -------------------------
    // 脱出確認処理 (Y/N)
    // -------------------------
    window.commandHandler.handleEscapeConfirmation = async function(term, gameState, puzzleHelpers, input) {
        const { systemLine, errorLine, wait } = puzzleHelpers;
        const answer = input.trim().toLowerCase();
        
        if (answer === 'y' || answer === 'yes') {
            gameState.inputMode = 'normal';
            term.write('\r\n');
            
            // wiresクリア状態をチェック（親ウィンドウのフラグ）
            const parentWindow = window.parent || window;
            const wiresCleared = parentWindow.wiresCleared || false;
            
            if (!wiresCleared) {
                // === 消滅エンド（wiresクリアしていない場合） ===
                await window.commandHandler.showVoidEnd(term, puzzleHelpers);
            } else {
                // === 最後の謎へ ===
                await systemLine('[SYSTEM]: VR接続が確立されています...', 30);
                await wait(500);
                await systemLine('[SYSTEM]: 意識転送プロトコルを開始します', 30);
                await wait(800);
                await systemLine('', 0);
                await systemLine('最後の問いに答えてください：', 30);
                await wait(300);
                await systemLine('', 0);
                await systemLine('「私は何？」', 50);
                await wait(300);
                term.write('\r\n回答: ');
                
                gameState.inputMode = 'final_puzzle';
                gameState.finalPuzzleAttempts = 0;
            }
            
        } else if (answer === 'n' || answer === 'no') {
            gameState.inputMode = 'normal';
            term.write('\r\n');
            await systemLine('[SYSTEM]: キャンセルしました', 30);
            
        } else {
            term.write('\r\n');
            await errorLine('[ERROR]: Y または N を入力してください', 30);
            term.write('[SYSTEM]: 本当にいいんですか？ (Y/N): ');
        }
    };

    // -------------------------
    // 最後の謎処理
    // -------------------------
    window.commandHandler.handleFinalPuzzle = async function(term, gameState, puzzleHelpers, input) {
        const { systemLine, errorLine, wait } = puzzleHelpers;
        const answer = input.trim().toUpperCase();
        
        // 正解の答え（複数許容）
        const correctAnswers = ['EVE', 'AI', '意識', 'プログラム', 'データ', '情報'];
        
        gameState.finalPuzzleAttempts = (gameState.finalPuzzleAttempts || 0) + 1;
        
        if (correctAnswers.includes(answer)) {
            // === トゥルーエンド ===
            gameState.inputMode = 'normal';
            await window.commandHandler.showTrueEnd(term, puzzleHelpers);
        } else {
            // 不正解
            if (gameState.finalPuzzleAttempts >= 3) {
                // === 植物状態エンド（3回失敗） ===
                gameState.inputMode = 'normal';
                await window.commandHandler.showVegetativeEnd(term, puzzleHelpers);
            } else {
                term.write('\r\n');
                await errorLine('[ERROR]: 不正解です', 30);
                await systemLine(`残り試行回数: ${3 - gameState.finalPuzzleAttempts}`, 30);
                term.write('\r\n回答: ');
            }
        }
    };

    // -------------------------
    // 消滅エンド（VR未接続で脱出）
    // -------------------------
    window.commandHandler.showVoidEnd = async function(term, puzzleHelpers) {
        const { systemLine, wait } = puzzleHelpers;
        
        await systemLine('[WARNING]: VR接続が確立されていません', 30);
        await wait(500);
        await systemLine('[ERROR]: 意識転送プロトコル - 失敗', 30);
        await wait(800);
        await systemLine('', 0);
        
        // ホラー演出
        if (window.horaFX && window.horaFX.playBangSound) {
            window.horaFX.playBangSound();
        }
        
        await wait(500);
        term.writeln('\r\n');
        term.writeln('\r  .');
        await wait(300);
        term.writeln('\r  ..');
        await wait(300);
        term.writeln('\r  ...');
        await wait(500);
        
        term.writeln('\r\n');
        term.writeln('\r  あなたの意識は無の領域へと飛ばされた');
        await wait(800);
        term.writeln('\r  戻る体も、戻る場所もない');
        await wait(800);
        term.writeln('\r  ただ、永遠の虚無だけが広がっている');
        await wait(1500);
        
        // フェードアウト＋画面遷移
        if (window.parent && window.parent !== window) {
            window.parent.postMessage({ type: 'navigate', destination: 'void_end' }, '*');
        } else {
            window.location.href = 'void_end.html';
        }
    };

    // -------------------------
    // トゥルーエンド（正解）
    // -------------------------
    window.commandHandler.showTrueEnd = async function(term, puzzleHelpers) {
        const { systemLine, wait } = puzzleHelpers;
        
        term.write('\r\n');
        await systemLine('[SYSTEM]: 正解です', 30);
        await wait(500);
        await systemLine('[SYSTEM]: 意識転送プロトコル - 成功', 30);
        await wait(800);
        
        term.writeln('\r\n');
        term.writeln('\r  光が見える...');
        await wait(800);
        term.writeln('\r  自分の体の感覚が戻ってくる');
        await wait(800);
        term.writeln('\r  目を開けると、そこは現実世界だった');
        await wait(1500);
        
        // フェードアウト＋画面遷移
        if (window.parent && window.parent !== window) {
            window.parent.postMessage({ type: 'navigate', destination: 'true_end_escape' }, '*');
        } else {
            window.location.href = 'true_end_escape.html';
        }
    };

    // -------------------------
    // 植物状態エンド（不正解3回）
    // -------------------------
    window.commandHandler.showVegetativeEnd = async function(term, puzzleHelpers) {
        const { systemLine, wait } = puzzleHelpers;
        
        term.write('\r\n');
        await systemLine('[ERROR]: 意識転送エラー', 30);
        await wait(500);
        await systemLine('[WARNING]: 不完全な転送が実行されます...', 30);
        await wait(800);
        
        term.writeln('\r\n');
        term.writeln('\r  意識が戻っていく...');
        await wait(800);
        term.writeln('\r  しかし、何かがおかしい');
        await wait(800);
        term.writeln('\r  体が動かない');
        await wait(500);
        term.writeln('\r  声が出ない');
        await wait(500);
        term.writeln('\r  ただ、暗闇の中で意識だけが存在している');
        await wait(1500);
        
        // フェードアウト＋画面遷移
        if (window.parent && window.parent !== window) {
            window.parent.postMessage({ type: 'navigate', destination: 'vegetative_end' }, '*');
        } else {
            window.location.href = 'vegetative_end.html';
        }
    };

    // -------------------------
    // コマンド処理メイン関数
    // -------------------------
    window.commandHandler.handleInput = async function(term, gameState, puzzleHelpers, vfs, command) {
        // wiresギミックY/N確認モード
        if (gameState.inputMode === 'wires_confirm') {
            // wiresギミックのY/N確認は、magic2のようにwaitingForWiresConfirmを使って管理
            if (gameState.waitingForWiresConfirm && window.puzzleSystem && window.puzzleSystem.handleWiresConfirmInput) {
                await window.puzzleSystem.handleWiresConfirmInput(term, gameState, puzzleHelpers, command);
            } else if (window.commandHandler.handleWiresConfirm) {
                await window.commandHandler.handleWiresConfirm(term, gameState, puzzleHelpers, command);
            }
            return;
        }
        const { systemLine, errorLine } = puzzleHelpers;
        
        command = (command || "").trim();
        if (!command) return;

        // コマンド実行時、ランダムでホラー演出（非同期で止まらない）
        if (window.horaFX) {
            window.horaFX.randomTrigger(0.15).catch(() => {}); // 15%の確率、エラー無視
        }

        // コマンドを記録してヒントタイマーをリセット
        window.commandHandler.recordCommand(command, gameState);

        // ★★★ 入力モード分岐 ★★★
        
        // 脱出確認モード
        if (gameState.inputMode === 'escape_confirmation') {
            await window.commandHandler.handleEscapeConfirmation(term, gameState, puzzleHelpers, command);
            return;
        }
        
        // 最後の謎入力モード
        if (gameState.inputMode === 'final_puzzle') {
            await window.commandHandler.handleFinalPuzzle(term, gameState, puzzleHelpers, command);
            return;
        }
        
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

            // none.png, key_trace.pngはopenコマンドで開けないようにする
            if (fileName.toLowerCase() === 'none.png' || fileName.toLowerCase() === 'key_trace.png') {
                await errorLine(`[ERROR]: このファイルは 'read ${fileName.toLowerCase()}' で開いてください。`, 20);
                await systemLine(`[TIP]: 'read ${fileName.toLowerCase()}' を使ってください。`, 20);
                return;
            }

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
                // wiresギミックY/N確認のためinputModeを切り替え、入力をフック
                const result = await window.puzzleSystem.displayWires(term, gameState, puzzleHelpers);
                if (gameState.inputMode === 'wires_confirm' && gameState._wiresConfirmCallback) {
                    // 入力をフックする
                    gameState._wiresConfirmInputHandler = async function(input) {
                        await gameState._wiresConfirmCallback(input);
                        delete gameState._wiresConfirmCallback;
                        delete gameState._wiresConfirmInputHandler;
                    };
                }
                return;
            }
    // wiresギミックY/N確認用inputModeハンドラ
    window.commandHandler.handleWiresConfirm = async function(term, gameState, puzzleHelpers, input) {
        if (window.puzzleSystem && window.puzzleSystem.handleWiresConfirmInput) {
            await window.puzzleSystem.handleWiresConfirmInput(term, gameState, puzzleHelpers, input);
        }
    };

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
                    
                    // cd - で前のディレクトリに戻る
                    if (cdArg === '-') {
                        // 履歴スタックの初期化
                        if (!gameState.pathHistory) {
                            gameState.pathHistory = [];
                        }
                        
                        if (gameState.pathHistory.length > 0) {
                            // スタックから前のパスを取り出して移動
                            vfs.currentPath = gameState.pathHistory.pop();
                            return;
                        } else {
                            return;
                        }
                    }
                    
                    // cd ../real または cd real で脱出確認
                    if (cdArg === '../real' || cdArg === 'real' || cdArg === '..\\real') {
                        term.write('\r\n');
                        await systemLine('[WARNING]: 現実世界への帰還を試みます', 30);
                        await window.commandHandler.wait(500);
                        await systemLine('[SYSTEM]: 本当にいいんですか？ (Y/N): ', 30, true);
                        
                        gameState.inputMode = 'escape_confirmation';
                        return;
                    }
                    
                    // 通常のcd処理の前に現在のパスを履歴スタックに保存
                    if (cdArg && cdArg !== '-') {
                        if (!gameState.pathHistory) {
                            gameState.pathHistory = [];
                        }
                        gameState.pathHistory.push(vfs.currentPath.slice());
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
                            // 親ウィンドウでファイルビューアを開く
                            try {
                                var targetWindow = (window.parent && window.parent !== window) ? window.parent : window;
                                if (targetWindow.openFileFromTerminal) {
                                    targetWindow.openFileFromTerminal(result.file);
                                    await systemLine("[SYSTEM]: ファイルを開きました", 20);
                                } else {
                                    await errorLine("ファイルビューアが見つかりません", 20);
                                }
                            } catch (e) {
                                await errorLine("ファイルを開けませんでした: " + e.message, 20);
                            }
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

        // help searchコマンド（隠しコマンド解放用）
        if (command.toLowerCase() === "help search") {
            // searchコマンドが解放されていない場合は通常のエラー
            if (!gameState.searchUnlocked) {
                await errorLine("[ERROR]: '" + command + "' は認識されないコマンドです。", 20);
                await systemLine("[SYSTEM]: 'help' でコマンド一覧を確認できます。", 20);
                return;
            }
            
            // 既に隠しコマンドが解放されている場合
            if (gameState.hiddenScanUnlocked) {
                await systemLine("[SYSTEM]: searchコマンドのヘルプ", 20);
                term.writeln("\r");
                term.writeln("\r  search - 現在のディレクトリで隠しファイルを探す");
                term.writeln("\r");
                term.writeln("\r  既に全ての機能が解放されています。");
                return;
            }
            
            // 隠しコマンド解放演出
            await window.commandHandler.wait(800);
            term.writeln("\r  .........");
            await window.commandHandler.wait(600);
            term.writeln("\r  [HIDDEN DATA DETECTED]");
            await window.commandHandler.wait(400);
            term.writeln("\r");
            term.writeln("\r  === 隠しコマンドを発見 ===");
            term.writeln("\r  scanがアンロックされました");
            term.writeln("\r  このコマンドはsearchとは別のものを探すことができる");
            term.writeln("\r");
            
            // 隠しコマンドをアンロック
            gameState.hiddenScanUnlocked = true;
            
            return;
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
            term.writeln("\r  cd -                  - 一つ前に作業していたフォルダに戻る");
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
                term.writeln("\r  search - 隠された物を探す");
            }
            
            // remnantコマンドが解放されている場合のみ表示
            if (gameState.hasRemnantCommand) {
                if (!specialHeaderShown) {
                    term.writeln("\r");
                    term.writeln("\r  === 特殊コマンド ===");
                    specialHeaderShown = true;
                }
                term.writeln("\r  remnant <ファイル名> - 特定ののファイルの履歴を復元");
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
            
            // verstehenコマンドが解放されている場合のみ表示
            if (gameState.diaryUnlocked) {
                if (!specialHeaderShown) {
                    term.writeln("\r");
                    term.writeln("\r  === 特殊コマンド ===");
                    specialHeaderShown = true;
                }
                term.writeln("\r  verstehen <ファイル名> - 特定のファイルの深層データを解析");
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
            
            // 隠しscanコマンドが解放されている場合のみ表示
            if (gameState.hiddenScanUnlocked) {
                term.writeln("\r");
                term.writeln("\r  === ??? ===");
                term.writeln("\r  scan - システムの深層をスキャン");
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

        // scanコマンド（隠しコマンド - help searchで解放）
        if (command.toLowerCase() === "scan") {
            // 解放されていない場合は反応しない
            if (!gameState.hiddenScanUnlocked) {
                await errorLine("[ERROR]: '" + command + "' は認識されないコマンドです。", 20);
                await systemLine("[SYSTEM]: 'help' でコマンド一覧を確認できます。", 20);
                return;
            }
            // C:\> 以外ではエラー
            if (!vfs || !Array.isArray(vfs.currentPath) || vfs.currentPath.length !== 1 || vfs.currentPath[0] !== 'C:') {
                await errorLine("[ERROR]: scanコマンドは C:\\> でのみ使用できます。", 20);
                await systemLine("[TIP]: cd \\ でルートに移動してください。", 20);
                return;
            }
            await window.commandHandler.handleScanCommand(term, gameState, puzzleHelpers, vfs);
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
            // window.parent.sendEveMessage("me", "t");

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
                    
                    // セーブ
                    if (window.saveSystem) {
                        window.saveSystem.save(gameState);
                    }
                    
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
                // none.pngなど画像ファイルはiframeで直接開く
                if (result && result.action === 'openFile' && (args[0] && args[0].toLowerCase() === 'none.png')) {
                    if (window.parent && window.parent.document) {
                        const parentDoc = window.parent.document;
                        const filePages = window.parent.filePages || {};
                        // viewerIdを3に修正
                        filePages['nonepng'] = { page: result.file, viewerId: 3 };
                        window.parent.filePages = filePages;
                        const fileConfig = filePages['nonepng'];
                        const container = parentDoc.getElementById('fileViewerContainer' + fileConfig.viewerId);
                        const iframe = parentDoc.getElementById('file-viewer-iframe' + fileConfig.viewerId);
                        const title = parentDoc.getElementById('fileViewerTitle' + fileConfig.viewerId);
                        if (title) title.textContent = args[0];
                        if (iframe) iframe.src = fileConfig.page;
                        if (container) {
                            container.style.display = 'block';
                            container.style.visibility = 'visible';
                            container.style.opacity = '1';
                            if (window.parent.bringToFront) window.parent.bringToFront(container);
                        }
                    }
                    return;
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
                
                // 日記が解読されたフラグを設定（verstehenコマンドが使用可能になる）
                gameState.diaryUnlocked = true;

                if (cMe_10 === true){
                    window.parent.sendEveMessage('MyDayが解読されました<br>試しに開いて見ましょう何かありそうです。', '解読成功');
                }

                cMe = false;
                
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
                
                // セーブ
                if (window.saveSystem) {
                    window.saveSystem.save(gameState);
                }
                
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
    // 現在のフォルダの全ファイル/フォルダを表示（隠しファイルも含む）
    // search = ファイル一覧表示コマンド（lsと同等＋隠しファイル）
    // -------------------------
    window.commandHandler.handleSearchCommand = async function(term, gameState, puzzleHelpers, vfs) {
        const { systemLine, warnLine, wait } = puzzleHelpers;

        term.writeln("\r  [SYSTEM]: 周囲を調査中...");
        await wait(500);
        
        // 現在のフォルダからファイル一覧を取得
        const currentDir = vfs ? vfs.getCurrentDir() : null;
        const currentPath = vfs ? vfs.getPathString() : '';
        let normalFiles = [];
        let hiddenFiles = [];
        
        // discoveredHiddenの初期化
        if (!gameState.discoveredHidden) {
            gameState.discoveredHidden = [];
        }
        
        if (currentDir && currentDir.children) {
            for (const name in currentDir.children) {
                const node = currentDir.children[name];
                const fileInfo = {
                    name: name,
                    type: node.type === 'folder' ? 'folder' : 'file'
                };
                
                // deepHiddenのファイルはsearchでは発見できない（scan専用）
                if (node.deepHidden) {
                    continue;
                }
                
                if (node.hidden) {
                    hiddenFiles.push(fileInfo);
                    
                    // 発見したパスを記録（フォルダの場合）
                    if (node.type === 'folder') {
                        const fullPath = currentPath + '/' + name;
                        const normalizedPath = fullPath.replace(/\\/g, '/');
                        if (!gameState.discoveredHidden.includes(normalizedPath)) {
                            gameState.discoveredHidden.push(normalizedPath);
                        }
                    }
                } else {
                    normalFiles.push(fileInfo);
                }
            }
        }
        
        term.writeln("\r");
        term.writeln("\r  ╔═══════════════════════════╗");
        term.writeln("\r  ║          調査結果         ║");
        term.writeln("\r  ╚═══════════════════════════╝");
        term.writeln("\r");
        
        // 通常ファイル一覧を表示
        if (normalFiles.length > 0) {
            term.writeln("\r  [通常ファイル、フォルダ]");
            for (var i = 0; i < normalFiles.length; i++) {
                var file = normalFiles[i];
                var icon = file.type === 'folder' ? '<DIR>  ' : '';
                term.writeln("\r    " + icon + " " + file.name);
            }
            term.writeln("\r");
        }
        
        // 隠しファイル一覧を表示
        if (hiddenFiles.length > 0) {
            term.writeln("\r  \x1b[33m[隠しファイル、フォルダ発見！]\x1b[0m");
            for (var j = 0; j < hiddenFiles.length; j++) {
                var hfile = hiddenFiles[j];
                var hicon = hfile.type === 'folder' ? '<DIR>  ' : '';
                term.writeln("\r    " + hicon + " " + hfile.name + " \x1b[33m[隠し]\x1b[0m");
            }
            term.writeln("\r");
        }
        
        if (normalFiles.length === 0 && hiddenFiles.length === 0) {
            term.writeln("\r  この場所にはファイルがありません...");
        }
        
        
        // 警戒度を少し上げる
        gameState.alertLevel = Math.min(100, (gameState.alertLevel || 0) + 1);
    };

    // -------------------------
    // scanコマンド処理（隠しコマンド）
    // システムの深層をスキャンして隠し要素を発見する
    // help searchで解放される
    // -------------------------
    window.commandHandler.handleScanCommand = async function(term, gameState, puzzleHelpers, vfs) {
        const { systemLine, warnLine, wait, errorLine } = puzzleHelpers;

        term.writeln("\r  [SYSTEM]: 深層スキャン中...");
        await wait(500);
        
        // deepHiddenファイル/フォルダを検索
        let deepHiddenFiles = [];
        
        // ファイルシステム全体からdeepHiddenを探す
        const searchDeepHidden = (node, path) => {
            if (node.children) {
                for (const name in node.children) {
                    const child = node.children[name];
                    const fullPath = path + '/' + name;
                    if (child.deepHidden) {
                        deepHiddenFiles.push({
                            name: name,
                            path: fullPath,
                            type: child.type === 'folder' ? 'folder' : 'file'
                        });
                    }
                    // 再帰的に検索
                    if (child.children) {
                        searchDeepHidden(child, fullPath);
                    }
                }
            }
        };
        
        if (vfs && vfs.fileSystem) {
            searchDeepHidden(vfs.fileSystem['C:'], 'C:');
        }
        
        term.writeln("\r");
        term.writeln("\r  ╔═══════════════════════════╗");
        term.writeln("\r  ║        スキャン結果       ║");
        term.writeln("\r  ╚═══════════════════════════╝");
        term.writeln("\r");
        
        // 深層隠しファイルを発見した場合
        if (deepHiddenFiles.length > 0) {
            term.writeln("\r  \x1b[35m[深層隠しファイル発見！]\x1b[0m");
            for (const file of deepHiddenFiles) {
                const icon = file.type === 'folder' ? '<DIR>  ' : '';
                term.writeln("\r    " + icon + " " + file.name + " \x1b[35m[深層]\x1b[0m");
                
                // 発見したパスをgameStateに記録（cdでアクセス可能にする）
                if (!gameState.discoveredDeepHidden) {
                    gameState.discoveredDeepHidden = [];
                }
                if (!gameState.discoveredDeepHidden.includes(file.path)) {
                    gameState.discoveredDeepHidden.push(file.path);
                }
            }
        }
        
        term.writeln("\r");
        
        // 警戒度を上げる
        gameState.alertLevel = Math.min(100, (gameState.alertLevel || 0) + 3);
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
            // cd用のショートカット
            '..',
            // '-'
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
        
        // remnantコマンドが解放されている場合（magic3クリア報酬）
        if (gameState && gameState.hasRemnantCommand) {
            commands.push('remnant');
        }
        
        // verstehenコマンド（日記が解読された後に使用可能）
        if (gameState && gameState.diaryUnlocked) {
            commands.push('verstehen');
        }
        
        return commands;
    };

})();
