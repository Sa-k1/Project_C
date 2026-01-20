// xterm_demo.js  ブラウザ向け版（ターミナル入出力処理のみ）
// このファイルはブラウザのプレーンな `<script>` タグで読み込むことを想定しています。

(function() {
    const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';
    if (!isBrowser) {
        console.error('xterm_demo.js: not running in a browser environment.');
        return;
    }

    // -------------------------
    // xterm と FitAddon はグローバル変数として利用可能であること
    // -------------------------
    const { Terminal } = window;
    const { FitAddon } = window;
    if (!Terminal) {
        document.getElementById('terminal').innerText = 'xterm not loaded. Check network or CDN.';
        return;
    }

    // ANSI カラーコード
    const COLORS = {
        red: "\x1b[31m",
        yellow: "\x1b[33m",
        cyan: "\x1b[36m",
        gray: "\x1b[38;5;154m",
        reset: "\x1b[0m"
    };

    // ゲーム状態管理
    const gameState = {
        alertLevel: 0,
        inputMode: 'normal',
        waitingForConfirmation: null,
        passwordTarget: null,
        unlockFailCount: {},
        sleepUsed: false,
        sleepCounter: 0,
        helpEnabled: false,
        secretFileUnlocked: false,
        rmEveUsed: false,
        searchUnlocked: false,          // searchコマンドが解放されたか（magic1クリア報酬）
        discoveredHidden: [],           // searchで発見した隠しファイル/フォルダのパス
        hasAdminCommand: false,         // 管理者権限コマンドを入手したか
        hasRemnantCommand: false,       // remnantコマンドが解放されたか（magic3クリア報酬）
        isFirstLaunch: true,            // 初回起動かどうか
        commandHistory: [],             // コマンド履歴
        outputHistory: []               // 出力履歴
    };

    // ゲーム状態をlocalStorageから復元
    function loadGameState() {
        try {
            const saved = localStorage.getItem('eveGameState');
            if (saved) {
                const parsed = JSON.parse(saved);
                // 保存されたデータを現在の状態にマージ
                Object.keys(parsed).forEach(function(key) {
                    gameState[key] = parsed[key];
                });
                gameState.isFirstLaunch = false;
                
                // コマンド履歴を復元（配列であることを確認）
                if (Array.isArray(gameState.commandHistory)) {
                    commandHistory = gameState.commandHistory;
                }
                return true;
            }
        } catch (e) {
            console.error('ゲーム状態の読み込みに失敗:', e);
        }
        return false;
    }

    // ゲーム状態をlocalStorageに保存
    function saveGameState() {
        try {
            // inputModeやwaitingForConfirmationなど、一時的な状態は保存しない
            const stateToSave = Object.assign({}, gameState);
            stateToSave.inputMode = 'normal';
            stateToSave.waitingForConfirmation = null;
            stateToSave.passwordTarget = null;
            // コマンド履歴を保存（最新100件まで）
            stateToSave.commandHistory = commandHistory.slice(-100);
            // 出力履歴を保存（最新200行まで）
            stateToSave.outputHistory = gameState.outputHistory.slice(-200);
            localStorage.setItem('eveGameState', JSON.stringify(stateToSave));
        } catch (e) {
            console.error('ゲーム状態の保存に失敗:', e);
        }
    }

    // より確実なリロード検出：sessionStorageとタイムスタンプを使用
    const lastSessionTime = localStorage.getItem('lastSessionTime');
    const currentTime = Date.now();
    const sessionTimeout = 1000; // 1秒以内なら同じセッション
    
    // localStorageをクリアする条件：
    // 1. lastSessionTimeが存在しない（初回）
    // 2. 前回から1秒以上経過（リロードまたは新規起動）
    if (!lastSessionTime || (currentTime - parseInt(lastSessionTime)) > sessionTimeout) {
        localStorage.removeItem('eveGameState');
        console.log('リロード/新規起動検出: ゲーム状態をリセットしました');
    }
    
    localStorage.setItem('lastSessionTime', currentTime.toString());

    // 保存されたゲーム状態を読み込む
    const hasExistingState = loadGameState();

    // 定期的に自動保存とタイムスタンプ更新
    setInterval(function() {
        saveGameState();
        localStorage.setItem('lastSessionTime', Date.now().toString());
    }, 5000);

    // ページを閉じる前に保存（通常の閉じる操作では保存）
    window.addEventListener('beforeunload', saveGameState);

    if (!window.vfs && window.VirtualFileSystem) {
        window.vfs = new VirtualFileSystem(gameState);
    }

    //  文字
    function getPrompt() {
        if (window.vfs) {
            if(window.vfs.getPathString() === "C:"){
                return window.vfs.getPathString() + "\\> ";                
            }else {
                return window.vfs.getPathString() + "> ";
            }

        }
        return "C:\\Users\\Student\\Downloads\\Project_C> ";
    }

    // -------------------------
    // ターミナル初期化
    // -------------------------

    const term = new Terminal({
        cursorBlink: true,
        fontFamily: "Courier New, monospace",
        fontSize: 14,
        theme: { background: "#000", foreground: "#ffffffff", cursor: "#ffffffff" }
    });

    const fitAddon = (typeof FitAddon === "function" && new FitAddon()) || 
        (FitAddon && new FitAddon.FitAddon ? new FitAddon.FitAddon() : null);
    if (fitAddon) term.loadAddon(fitAddon);
    term.open(document.getElementById("terminal"));
    if (fitAddon && typeof fitAddon.fit === "function") fitAddon.fit();
    


    // -------------------------
    // ユーティリティ関数
    // -------------------------
    function wait(ms) {
        return new Promise(res => setTimeout(res, ms));
    }

    async function slowPrintLine(line, charDelay) {
        if (line == null) line = "";
        else if (typeof line !== "string") line = String(line);
        term.write(line + "\r\n");
        // 出力履歴に記録（ANSIコードを含む）
        if (gameState.outputHistory) {
            gameState.outputHistory.push(line);
        }
    }

    // -------------------------
    // Terminal print helpers (colorized wrappers)
    // -------------------------
    async function systemLine(line, charDelay) {
        await slowPrintLine(COLORS.gray + line + COLORS.reset);
    }

    async function eveLine(line, charDelay) {
        await slowPrintLine(COLORS.cyan + line + COLORS.reset);
    }

    async function errorLine(line, charDelay) {
        await slowPrintLine(COLORS.red + line + COLORS.reset);
    }

    async function warnLine(line, charDelay) {
        await slowPrintLine(COLORS.yellow + line + COLORS.reset);
    }

    // lightweight synchronous system print for startup logs
    function systemPrint(line) {
        if (term && typeof term.write === "function") {
            var output = COLORS.gray + line + COLORS.reset;
            term.write(output + "\r\n");
            // 出力履歴に記録
            if (gameState.outputHistory) {
                gameState.outputHistory.push(output);
            }
        } else {
            console.log(line);
        }
    }

    // -------------------------
    // 全角半角判定用ヘルパー関数
    // -------------------------
    function getCharWidth(char) {
        var code = char.charCodeAt(0);
        // 半角カナ: U+FF61 ～ U+FF9F
        if (code >= 0xFF61 && code <= 0xFF9F) return 1;
        // CJK（日本語中国語韓国語）、全角記号、全角英数字など
        if (code >= 0x1100 && 
            (code <= 0x115F ||
            code === 0x2329 || code === 0x232A ||
            (code >= 0x2E80 && code <= 0xA4CF && code !== 0x303F) ||
            (code >= 0xAC00 && code <= 0xD7A3) ||
            (code >= 0xF900 && code <= 0xFAFF) ||
            (code >= 0xFE10 && code <= 0xFE1F) ||
            (code >= 0xFE30 && code <= 0xFE6F) ||
            (code >= 0xFF00 && code <= 0xFF60) ||
            (code >= 0xFFE0 && code <= 0xFFE6) ||
            (code >= 0x20000 && code <= 0x2FFFF))) {
            return 2;
        }
        // 日本語ひらがなカタカナ (U+3040 ～ U+30FF)
        if (code >= 0x3040 && code <= 0x30FF) return 2;
        // その他（ASCII等）
        return 1;
    }

    function getStringWidth(str) {
        var width = 0;
        for (var i = 0; i < str.length; i++) {
            width += getCharWidth(str[i]);
        }
        return width;
    }

    // 現在の入力行をクリアするヘルパー関数
    function clearCurrentLine() {
        var bufChars = Array.from(buffer);
        // カーソルより後ろの幅を計算
        var afterWidth = 0;
        for (var i = cursorPos; i < bufChars.length; i++) {
            afterWidth += getCharWidth(bufChars[i]);
        }
        // カーソルより前の幅を計算
        var beforeWidth = 0;
        for (var i = 0; i < cursorPos; i++) {
            beforeWidth += getCharWidth(bufChars[i]);
        }
        // まずカーソルを末尾に移動
        for (var i = 0; i < afterWidth; i++) {
            term.write('\x1b[C');
        }
        // 全体を消去
        var totalWidth = beforeWidth + afterWidth;
        for (var i = 0; i < totalWidth; i++) {
            term.write("\b \b");
        }
        cursorPos = 0;
    }

    // -------------------------
    // 謎解きシステム用ヘルパーオブジェクト
    // -------------------------
    var puzzleHelpers = {
        wait: wait,
        slowPrintLine: slowPrintLine,
        systemLine: systemLine,
        eveLine: eveLine,
        errorLine: errorLine,
        warnLine: warnLine
    };

    // -------------------------
    // コマンド処理（command.js に委譲）
    // -------------------------
    async function handleInput(command) {
        if (window.commandHandler) {
            await window.commandHandler.handleInput(term, gameState, puzzleHelpers, window.vfs, command);
        } else {
            await errorLine("[ERROR]: コマンドハンドラが初期化されていません", 20);
        }
    }

    // -------------------------
    // メイン処理
    // -------------------------
    var buffer = "";
    var inputEnabled = true;
    var isComposing = false;
    var composingText = "";
    
    // コマンド履歴
    var commandHistory = [];
    var historyIndex = -1;
    var tempBuffer = ""; // 履歴参照前の入力を一時保存
    
    // カーソル位置（バッファ内の文字インデックス）
    var cursorPos = 0;
    
    // TAB補完用の状態管理
    var completionState = {
        originalPattern: "",    // 元の入力パターン
        wordStart: 0,          // 補完対象の単語の開始位置（文字インデックス）
        wordEnd: 0,            // 補完対象の単語の終了位置（文字インデックス）
        candidates: [],        // マッチした候補リスト
        currentIndex: 0,       // 現在選択中の候補インデックス
        isActive: false        // 補完モードが有効か
    };

    // -------------------------
    // TAB補完ヘルパー関数
    // -------------------------
    
    // カーソル位置の単語を取得
    function getWordAtCursor() {
        var bufChars = Array.from(buffer);
        
        // カーソル位置から前方にスペースを探す
        var start = cursorPos;
        while (start > 0 && bufChars[start - 1] !== ' ') {
            start--;
        }
        
        // カーソル位置から後方にスペースを探す
        var end = cursorPos;
        while (end < bufChars.length && bufChars[end] !== ' ') {
            end++;
        }
        
        return {
            word: bufChars.slice(start, end).join(''),
            start: start,
            end: end
        };
    }
    
    // ワイルドカードを正規表現に変換
    function wildcardToRegex(pattern) {
        var escaped = pattern
            .replace(/[.+^${}()|[\]\\]/g, '\\$&')  // 特殊文字をエスケープ
            .replace(/\*/g, '.*')                   // * → .*
            .replace(/\?/g, '.');                   // ? → .
        return new RegExp('^' + escaped, 'i');      // 大文字小文字を区別しない
    }
    
    // 候補を検索
    function findMatches(pattern) {
        if (!pattern) return [];
        
        try {
            var regex = wildcardToRegex(pattern);
            var candidates = [];
            
            // 入力バッファを分解してコマンドと引数の位置を判定
            var bufChars = Array.from(buffer);
            var beforeCursor = bufChars.slice(0, cursorPos).join('');
            var parts = beforeCursor.trim().split(/\s+/);
            var isFirstWord = parts.length <= 1;
            
            // コマンド候補を取得（常に追加）
            if (window.commandHandler && window.commandHandler.getAvailableCommands) {
                var commands = window.commandHandler.getAvailableCommands(gameState);
                candidates = candidates.concat(commands.filter(function(cmd) {
                    return regex.test(cmd);
                }));
            }
            
            // 第二単語以降（引数）の場合：ファイルとフォルダも候補に追加
            if (!isFirstWord && window.vfs) {
                var currentDir = window.vfs.getCurrentDir();
                var firstCommand = parts[0] ? parts[0].toLowerCase() : '';
                
                // 現在のディレクトリ内のファイルとフォルダを取得
                if (currentDir && currentDir.children) {
                    var entries = Object.keys(currentDir.children);
                    
                    entries.forEach(function(name) {
                        var entry = currentDir.children[name];
                        
                        // 隠しファイル/フォルダは、searchUnlockedでない限りスキップ
                        if (entry.hidden && (!gameState || !gameState.searchUnlocked)) {
                            return;
                        }
                        
                        // パターンにマッチするものを追加
                        if (regex.test(name)) {
                            // フォルダの場合は末尾に / を追加して識別しやすくする
                            if (entry.type === 'folder') {
                                candidates.push(name + '/');
                            } else {
                                candidates.push(name);
                            }
                        }
                    });
                }
                
                // 親ディレクトリへの移動（..）も候補に追加
                if (regex.test('..')) {
                    candidates.push('..');
                }
                
                // ゴミ箱コマンドの場合：ゴミ箱内のファイルを候補に追加（時間軸：最初から利用可能）
                if ((firstCommand === 'trash') && window.puzzleSystem && window.puzzleSystem.TRASH_FILES) {
                    var trashFiles = Object.keys(window.puzzleSystem.TRASH_FILES);
                    trashFiles.forEach(function(fileName) {
                        if (regex.test(fileName)) {
                            candidates.push(fileName);
                        }
                    });
                }
                
                // 暗号化ファイル（magic1）の候補追加（時間軸：最初から利用可能）
                if ((firstCommand === 'open' || firstCommand === 'cat' || firstCommand === 'type') && 
                    window.puzzleSystem && window.puzzleSystem.PUZZLE_CONFIG) {
                    var encryptedFiles = Object.keys(window.puzzleSystem.PUZZLE_CONFIG);
                    encryptedFiles.forEach(function(fileName) {
                        if (regex.test(fileName)) {
                            candidates.push(fileName);
                        }
                    });
                }
            }
            
            // 重複を除去してソート
            // ただし、コマンドを優先し、その後にファイル/フォルダをソート
            candidates = Array.from(new Set(candidates));
            
            // 時間軸を考慮したソート：
            // 1. コマンド（'/'がつかないもの）を先に
            // 2. フォルダ（'/'がつくもの）
            // 3. ファイル
            candidates.sort(function(a, b) {
                var aIsFolder = a.endsWith('/');
                var bIsFolder = b.endsWith('/');
                var aIsCommand = !aIsFolder && (a === '..' || a.startsWith('-') || 
                    (window.commandHandler && window.commandHandler.getAvailableCommands && 
                     window.commandHandler.getAvailableCommands(gameState).indexOf(a) !== -1));
                var bIsCommand = !bIsFolder && (b === '..' || b.startsWith('-') || 
                    (window.commandHandler && window.commandHandler.getAvailableCommands && 
                     window.commandHandler.getAvailableCommands(gameState).indexOf(b) !== -1));
                
                // コマンドを最優先
                if (aIsCommand && !bIsCommand) return -1;
                if (!aIsCommand && bIsCommand) return 1;
                
                // 次にフォルダ
                if (aIsFolder && !bIsFolder) return -1;
                if (!aIsFolder && bIsFolder) return 1;
                
                // 同じタイプの場合はアルファベット順
                return a.toLowerCase().localeCompare(b.toLowerCase());
            });
            
            return candidates;
        } catch (e) {
            console.error("TAB補完エラー:", e);
            return [];
        }
    }
    
    // 補完モードをリセット
    function resetCompletion() {
        completionState.originalPattern = "";
        completionState.wordStart = 0;
        completionState.wordEnd = 0;
        completionState.candidates = [];
        completionState.currentIndex = 0;
        completionState.isActive = false;
    }
    
    // 単語を置き換える
    function replaceWord(newWord) {
        var bufChars = Array.from(buffer);
        
        // カーソル位置の単語を削除
        bufChars.splice(completionState.wordStart, completionState.wordEnd - completionState.wordStart);
        
        // 新しい単語を挿入
        var newWordChars = Array.from(newWord);
        bufChars.splice(completionState.wordStart, 0, ...newWordChars);
        
        // バッファを更新
        buffer = bufChars.join("");
        
        // カーソル位置を更新
        cursorPos = completionState.wordStart + newWordChars.length;
        
        // 単語の終了位置を更新
        completionState.wordEnd = completionState.wordStart + newWordChars.length;
    }
    
    // TABキー処理
    function handleTabCompletion() {
        if (completionState.isActive) {
            // 補完モード中: 次の候補へ
            completionState.currentIndex = (completionState.currentIndex + 1) % completionState.candidates.length;
            
            // 現在行をクリア
            clearCurrentLine();
            
            // 単語を置き換え
            replaceWord(completionState.candidates[completionState.currentIndex]);
            
            // 画面に再描画
            term.write(buffer);
            
            // カーソルを正しい位置に移動
            var bufChars = Array.from(buffer);
            var afterCursorWidth = 0;
            for (var i = cursorPos; i < bufChars.length; i++) {
                afterCursorWidth += getCharWidth(bufChars[i]);
            }
            for (var i = 0; i < afterCursorWidth; i++) {
                term.write('\x1b[D');
            }
        } else {
            // 新しい補完を開始
            var wordInfo = getWordAtCursor();
            
            if (!wordInfo.word) return; // 単語がない場合は何もしない
            
            var matches = findMatches(wordInfo.word);
            
            if (matches.length === 0) {
                // 候補がない場合は何もしない
                return;
            }
            
            // 補完状態を初期化
            completionState.originalPattern = wordInfo.word;
            completionState.wordStart = wordInfo.start;
            completionState.wordEnd = wordInfo.end;
            completionState.candidates = matches;
            completionState.currentIndex = 0;
            completionState.isActive = true;
            
            // 現在行をクリア
            clearCurrentLine();
            
            // 最初の候補に置き換え
            replaceWord(matches[0]);
            
            // 画面に再描画
            term.write(buffer);
            
            // カーソルを正しい位置に移動
            var bufChars = Array.from(buffer);
            var afterCursorWidth = 0;
            for (var i = cursorPos; i < bufChars.length; i++) {
                afterCursorWidth += getCharWidth(bufChars[i]);
            }
            for (var i = 0; i < afterCursorWidth; i++) {
                term.write('\x1b[D');
            }
        }
    }

    // IME入力検知用
    var terminalElement = document.getElementById("terminal");
    if (terminalElement) {
        terminalElement.addEventListener("compositionstart", function() {
            isComposing = true;
            composingText = "";
        });
        terminalElement.addEventListener("compositionupdate", function(e) {
            composingText = e.data || "";
        });
        terminalElement.addEventListener("compositionend", function(e) {
            isComposing = false;
            composingText = "";
        });
        
        
        // 右クリックでペースト
        terminalElement.addEventListener("contextmenu", async function(e) {
            e.preventDefault(); // デフォルトのコンテキストメニューを無効化
            
            if (!inputEnabled) return;
            
            try {
                // クリップボードからテキストを読み取る
                const text = await navigator.clipboard.readText();
                if (!text) return;
                
                // 改行を含む場合は最初の行のみを使用（または空白に置換）
                const pasteText = text.replace(/[\r\n]+/g, ' ');
                
                // 入力幅の上限チェック
                var maxInputWidth = term.cols - getStringWidth(getPrompt()) - 2;
                var currentWidth = getStringWidth(buffer);
                var pasteWidth = getStringWidth(pasteText);
                
                if (currentWidth + pasteWidth > maxInputWidth) {
                    // 上限を超える場合は入力可能な範囲だけ貼り付け
                    var availableWidth = maxInputWidth - currentWidth;
                    if (availableWidth <= 0) return;
                    
                    var trimmedText = "";
                    var width = 0;
                    for (var i = 0; i < pasteText.length; i++) {
                        var charWidth = getCharWidth(pasteText[i]);
                        if (width + charWidth > availableWidth) break;
                        trimmedText += pasteText[i];
                        width += charWidth;
                    }
                    if (!trimmedText) return;
                    
                    // カーソル位置に挿入
                    var bufChars = Array.from(buffer);
                    var pasteChars = Array.from(trimmedText);
                    bufChars.splice(cursorPos, 0, ...pasteChars);
                    buffer = bufChars.join("");
                    
                    // 画面に表示
                    var afterCursor = bufChars.slice(cursorPos + pasteChars.length).join("");
                    var afterWidth = getStringWidth(afterCursor);
                    term.write(trimmedText + afterCursor);
                    
                    // カーソル位置を更新して正しい位置に戻す
                    cursorPos += pasteChars.length;
                    for (var j = 0; j < afterWidth; j++) {
                        term.write('\x1b[D');
                    }
                } else {
                    // カーソル位置に挿入
                    var bufChars = Array.from(buffer);
                    var pasteChars = Array.from(pasteText);
                    bufChars.splice(cursorPos, 0, ...pasteChars);
                    buffer = bufChars.join("");
                    
                    // 画面に表示
                    var afterCursor = bufChars.slice(cursorPos + pasteChars.length).join("");
                    var afterWidth = getStringWidth(afterCursor);
                    term.write(pasteText + afterCursor);
                    
                    // カーソル位置を更新して正しい位置に戻す
                    cursorPos += pasteChars.length;
                    for (var j = 0; j < afterWidth; j++) {
                        term.write('\x1b[D');
                    }
                }
            } catch (err) {
                // クリップボードへのアクセス権限がない場合など
                console.error("Clipboard read failed:", err);
            }
        });
    }


    // 起動メッセージ（初回起動時のみ）
    if (gameState.isFirstLaunch) {
        systemPrint("\x1b[0mEVE-OS [Version 10.0.26]\n");

    } else {
        
        // 出力履歴を復元（最新50行程度を表示）
        if (Array.isArray(gameState.outputHistory) && gameState.outputHistory.length > 0) {
            var historyToRestore = gameState.outputHistory.slice(-50);
            for (var i = 0; i < historyToRestore.length; i++) {
                term.write(historyToRestore[i] + "\r\n");
            }
        }
        
        // 最後のプロンプトを削除して新しいプロンプトを表示
        var lastOutput = gameState.outputHistory[gameState.outputHistory.length - 1];
        if (!lastOutput || !lastOutput.includes(">")) {
            // プロンプトがない場合のみ空行を追加
            term.write("\r\n");
        }
    }
    term.write(getPrompt());

    // 入力処理
    term.onData(async function(data) {
        if (!inputEnabled) return;
        
        // TABキーの検出
        if (data === '\t') {
            handleTabCompletion();
            return;
        }
        
        // 矢印キーのエスケープシーケンス検出
        if (data === '\x1b[A' || data === '\x1bOA') {
            // 上矢印: 履歴を遡る
            resetCompletion(); // 補完モードをリセット
            if (commandHistory.length > 0) {
                if (historyIndex === -1) {
                    tempBuffer = buffer; // 現在の入力を保存
                    historyIndex = commandHistory.length - 1;
                } else if (historyIndex > 0) {
                    historyIndex--;
                }
                // 現在行をクリアして履歴を表示
                clearCurrentLine();
                buffer = commandHistory[historyIndex];
                cursorPos = Array.from(buffer).length;
                term.write(buffer);
            }
            return;
        }
        
        if (data === '\x1b[B' || data === '\x1bOB') {
            // 下矢印: 履歴を進む
            resetCompletion(); // 補完モードをリセット
            if (historyIndex !== -1) {
                if (historyIndex < commandHistory.length - 1) {
                    historyIndex++;
                    clearCurrentLine();
                    buffer = commandHistory[historyIndex];
                    cursorPos = Array.from(buffer).length;
                    term.write(buffer);
                } else {
                    // 最新まで戻ったら元の入力に戻す
                    historyIndex = -1;
                    clearCurrentLine();
                    buffer = tempBuffer;
                    cursorPos = Array.from(buffer).length;
                    term.write(buffer);
                }
            }
            return;
        }
        
        // 右矢印: カーソルを右に移動
        if (data === '\x1b[C' || data === '\x1bOC') {
            resetCompletion(); // 補完モードをリセット
            var bufChars = Array.from(buffer);
            if (cursorPos < bufChars.length) {
                var charWidth = getCharWidth(bufChars[cursorPos]);
                // カーソルを右に移動（全角なら2カラム分）
                for (var j = 0; j < charWidth; j++) {
                    term.write('\x1b[C');
                }
                cursorPos++;
            }
            return;
        }
        
        // 左矢印: カーソルを左に移動
        if (data === '\x1b[D' || data === '\x1bOD') {
            resetCompletion(); // 補完モードをリセット
            if (cursorPos > 0) {
                cursorPos--;
                var bufChars = Array.from(buffer);
                var charWidth = getCharWidth(bufChars[cursorPos]);
                // カーソルを左に移動（全角なら2カラム分）
                for (var j = 0; j < charWidth; j++) {
                    term.write('\x1b[D');
                }
            }
            return;
        }
        
        var chars = Array.from(data);
        
        for (var i = 0; i < chars.length; i++) {
            var ch = chars[i];
            var code = ch.charCodeAt(0);
            
            if (code === 13) { // Enter
                // IME変換中のEnterは無視
                if (isComposing) continue;
                
                resetCompletion(); // 補完モードをリセット
                
                term.write("\r\n");
                var userMessage = buffer.trim();
                buffer = "";
                cursorPos = 0;
                
                // 履歴に追加（空でなく、直前と重複しない場合）
                // ただし、パスワード入力モードや確認モードの場合は履歴に追加しない
                var isPasswordMode = gameState.inputMode && gameState.inputMode.includes('password');
                var isConfirmationMode = gameState.inputMode && gameState.inputMode.includes('confirmation');
                if (userMessage && !isPasswordMode && !isConfirmationMode && (commandHistory.length === 0 || 
                    commandHistory[commandHistory.length - 1] !== userMessage)) {
                    commandHistory.push(userMessage);
                }
                historyIndex = -1;
                tempBuffer = "";
                
                if (userMessage) {
                    inputEnabled = false;
                    await handleInput(userMessage);
                    saveGameState(); // コマンド実行後に状態を保存
                    inputEnabled = true;
                }
                
                // ★ 通常モードの場合のみプロンプト表示 ★
                if (gameState.inputMode === 'normal') {
                    term.write(getPrompt());
                }
            } else if (code === 127 || code === 8) { // Backspace
                resetCompletion(); // 補完モードをリセット
                if (cursorPos > 0) {
                    var bufChars = Array.from(buffer);
                    var delChar = bufChars[cursorPos - 1];
                    var charWidth = getCharWidth(delChar);
                    
                    // カーソル位置の前の文字を削除
                    bufChars.splice(cursorPos - 1, 1);
                    buffer = bufChars.join("");
                    cursorPos--;
                    
                    // カーソルを左に移動
                    for (var j = 0; j < charWidth; j++) {
                        term.write('\x1b[D');
                    }
                    
                    // カーソル位置から後ろを再描画
                    var afterCursor = bufChars.slice(cursorPos).join("");
                    var afterWidth = getStringWidth(afterCursor);
                    term.write(afterCursor);
                    // 削除した文字の分を空白で埋める
                    for (var j = 0; j < charWidth; j++) {
                        term.write(' ');
                    }
                    // カーソルを元の位置に戻す
                    for (var j = 0; j < afterWidth + charWidth; j++) {
                        term.write('\x1b[D');
                    }
                }
            } else if (code >= 32) {
                // 通常の文字入力（IME確定後の文字も含む）
                resetCompletion(); // 補完モードをリセット
                
                // 入力幅の上限チェック（ターミナル幅 - プロンプト幅 - 余白2文字）
                var maxInputWidth = term.cols - getStringWidth(getPrompt()) - 2;
                var currentWidth = getStringWidth(buffer);
                var newCharWidth = getCharWidth(ch);
                
                if (currentWidth + newCharWidth > maxInputWidth) {
                    // 上限を超える場合は入力を無視
                    return;
                }
                
                var bufChars = Array.from(buffer);
                bufChars.splice(cursorPos, 0, ch);
                buffer = bufChars.join("");
                cursorPos++;
                
                // カーソル位置に文字を挿入して後ろを再描画
                var charWidth = getCharWidth(ch);
                var afterCursor = bufChars.slice(cursorPos).join("");
                var afterWidth = getStringWidth(afterCursor);
                term.write(ch + afterCursor);
                // カーソルを正しい位置に戻す
                for (var j = 0; j < afterWidth; j++) {
                    term.write('\x1b[D');
                }
            }
        }
    });

    // ウィンドウリサイズ時にターミナルをリサイズ
    window.addEventListener("resize", function() { 
        if (fitAddon && typeof fitAddon.fit === "function") fitAddon.fit(); 
    });

})();