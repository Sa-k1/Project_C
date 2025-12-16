/**
 * 仮想ファイルシステム
 * cd, dir, type, edit, wget などのコマンドを実装
 */

class VirtualFileSystem {
    constructor() {
        this.fileSystem = {
            'C:': {
                type: 'drive',
                children: {
                    'Users': {
                        type: 'folder',
                        children: {
                            'Student': {
                                type: 'folder',
                                children: {
                                    'Desktop': {
                                        type: 'folder',
                                        children: {
                                            'Project_C': {
                                                type: 'folder',
                                                children: {
                                                    'data': {
                                                        type: 'folder',
                                                        children: {
                                                            'memo.txt': {
                                                                type: 'file',
                                                                htmlFile: 'file1.html',
                                                                contentSelector: '.content',
                                                                content: null,
                                                                editable: true
                                                            },
                                                            'log.txt': {
                                                                type: 'file',
                                                                content: `[2025-11-27 10:23:45] システム起動\n[2025-11-27 10:30:15] 不明なプロセス検出...`,
                                                                editable: true
                                                            },
                                                            'memoO.txt': {
                                                                type: 'file',
                                                                content: `メモ:\n- パスワードを変更する\n- バックアップを取る`,
                                                                editable: true
                                                            },
                                                            '不要な写真.png': {
                                                                type: 'file',
                                                                htmlFile: 'file3.html',
                                                                contentSelector: '.image-info',
                                                                content: null,
                                                                fileType: 'image',
                                                                editable: false
                                                            }
                                                        }
                                                    },
                                                    'system': {
                                                        type: 'folder',
                                                        children: {
                                                            'config.sys': {
                                                                type: 'file',
                                                                content: `[SYSTEM]\nVERSION=1.0.0`,
                                                                editable: true
                                                            },
                                                            'eve.dat': {
                                                                type: 'file',
                                                                hidden: true,
                                                                content: `E.V.E\n\n私はここにいる\n私はあなたを見ている\n\n逃げられない`,
                                                                editable: false
                                                            }
                                                        }
                                                    },
                                                    'README.txt': {
                                                        type: 'file',
                                                        content: `Project_C について\n\nこのフォルダには重要なファイルが含まれています。`,
                                                        editable: true
                                                    },
                                                    'bookmarks.txt': {
                                                        type: 'file',
                                                        content: `=== ブックマーク ===\nhttps://www.google.com\nhttps://github.com\nhttps://developer.mozilla.org`,
                                                        editable: true
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        };

        this.currentPath = ['C:', 'Users', 'Student', 'Desktop', 'Project_C'];
        this.customCommands = {};
        this.editMode = false;
        this.editingFile = null;
        this.editBuffer = [];
    }

    getCurrentDir() {
        let current = this.fileSystem;
        for (const part of this.currentPath) {
            if (current[part]) {
                current = current[part];
            } else if (current.children && current.children[part]) {
                current = current.children[part];
            }
        }
        return current;
    }

    getPathString() {
        return this.currentPath.join('\\');
    }

    // HTMLファイルから内容を取得するメソッド
    async loadContentFromHtml(file) {
        if (!file.htmlFile) return file.content;
        if (file.content !== null) return file.content;

        try {
            const response = await fetch(`../html/${file.htmlFile}`);
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const selector = file.contentSelector || '.content';
            const contentEl = doc.querySelector(selector);
            file.content = contentEl ? contentEl.textContent.trim() : '(内容を取得できません)';
            return file.content;
        } catch (e) {
            console.error('HTMLファイル読み込みエラー:', e);
            return '(ファイルの読み込みに失敗しました)';
        }
    }

    async execute(command) {
        const trimmed = (command || '').trim();
        if (!trimmed) return null;

        // 編集モード中の処理
        if (this.editMode) {
            return this.handleEditMode(trimmed);
        }

        const parts = trimmed.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
        const cmd = parts[0]?.toLowerCase();
        const args = parts.slice(1).map(arg => arg.replace(/^"|"$/g, ''));

        if (this.customCommands[cmd]) {
            return this.customCommands[cmd](args);
        }

        switch (cmd) {
            case 'cd': return this.cmdCd(args);
            case 'dir':
            case 'ls': return this.cmdDir(args);
            case 'type':
            case 'cat': return await this.cmdType(args);
            case 'cls':
            case 'clear': return { action: 'clear' };
            case 'pwd': return this.getPathString();
            case 'whoami': return 'Student';
            case 'date': return `現在の日付: ${new Date().toLocaleDateString('ja-JP')}`;
            case 'time': return `現在の時刻: ${new Date().toLocaleTimeString('ja-JP')}`;
            case 'open':
            case 'run': return this.cmdOpen(args);
            case 'edit':
            case 'nano':
            case 'vim': return await this.cmdEdit(args);
            case 'echo': return this.cmdEcho(args);
            case 'append': return await this.cmdAppend(args);
            case 'wget':
            case 'curl': return this.cmdWget(args);
            case 'browse':
            case 'www': return this.cmdBrowse(args);
            case 'touch':
            case 'new': return this.cmdTouch(args);
            case 'del':
            case 'rm': return this.cmdDelete(args);
            case 'copy':
            case 'cp': return await this.cmdCopy(args);
            case 'help': return this.cmdHelp();
            default: return null;
        }
    }

    // 編集モードの処理
    handleEditMode(input) {
        if (input === ':q' || input === ':quit') {
            this.editMode = false;
            this.editingFile = null;
            this.editBuffer = [];
            return '編集をキャンセルしました。';
        }

        if (input === ':w' || input === ':save') {
            if (this.editingFile) {
                this.editingFile.content = this.editBuffer.join('\n');
                return '保存しました。続けて編集できます。(:wq で終了)';
            }
            return 'エラー: ファイルが見つかりません。';
        }

        if (input === ':wq' || input === ':x') {
            if (this.editingFile) {
                this.editingFile.content = this.editBuffer.join('\n');
                this.editMode = false;
                const fileName = this.editingFile.name || 'ファイル';
                this.editingFile = null;
                this.editBuffer = [];
                return `${fileName} を保存して終了しました。`;
            }
            return 'エラー: ファイルが見つかりません。';
        }

        if (input === ':show') {
            return '--- 現在の内容 ---\n' + this.editBuffer.join('\n') + '\n--- 終了 ---';
        }

        if (input.startsWith(':d ')) {
            const lineNum = parseInt(input.substring(3)) - 1;
            if (lineNum >= 0 && lineNum < this.editBuffer.length) {
                const deleted = this.editBuffer.splice(lineNum, 1);
                return `行 ${lineNum + 1} を削除しました: "${deleted}"`;
            }
            return '無効な行番号です。';
        }

        if (input === ':clear') {
            this.editBuffer = [];
            return '内容をクリアしました。';
        }

        // 通常の入力は追加
        this.editBuffer.push(input);
        return `[${this.editBuffer.length}] ${input}`;
    }

    cmdCd(args) {
        if (args.length === 0) return this.getPathString();

        const target = args[0];

        if (target === '..') {
            if (this.currentPath.length > 1) this.currentPath.pop();
            return '';
        }

        if (target === '\\' || target === '/') {
            this.currentPath = ['C:'];
            return '';
        }

        if (target === '.') return '';

        const newPath = [...this.currentPath];
        const pathParts = target.replace(/\//g, '\\').split('\\').filter(p => p);
        
        for (const part of pathParts) {
            if (part === '..') {
                if (newPath.length > 1) newPath.pop();
            } else if (part !== '.') {
                newPath.push(part);
            }
        }

        if (this.pathExists(newPath)) {
            const node = this.getNodeAtPath(newPath);
            if (node && (node.type === 'folder' || node.type === 'drive')) {
                this.currentPath = newPath;
                return '';
            } else {
                return `ディレクトリ名が無効です。`;
            }
        } else {
            return `指定されたパスが見つかりません。`;
        }
    }

    cmdDir(args) {
        const showHidden = args.includes('/a') || args.includes('-a');
        const currentDir = this.getCurrentDir();
        
        if (!currentDir || !currentDir.children) {
            return 'ディレクトリが空です。';
        }

        let output = `\n ${this.getPathString()} のディレクトリ\n\n`;
        
        const entries = Object.entries(currentDir.children);
        let fileCount = 0;
        let dirCount = 0;

        for (const [name, node] of entries) {
            if (node.hidden && !showHidden) continue;

            const date = '2025/11/27  10:30';
            
            if (node.type === 'folder') {
                output += `${date}    <DIR>          ${name}\n`;
                dirCount++;
            } else {
                const size = (node.content?.length || 0).toString().padStart(10);
                const editFlag = node.editable ? '' : ' [読取専用]';
                output += `${date}           ${size} ${name}${editFlag}\n`;
                fileCount++;
            }
        }

        output += `\n               ${fileCount} 個のファイル\n`;
        output += `               ${dirCount} 個のディレクトリ`;

        return output;
    }

    async cmdType(args) {
        if (args.length === 0) return '使用法: type <ファイル名>';

        const fileName = args[0];
        const currentDir = this.getCurrentDir();

        if (!currentDir || !currentDir.children) return 'ファイルが見つかりません。';

        const file = currentDir.children[fileName];
        
        if (!file) return `指定されたファイルが見つかりません。`;
        if (file.type === 'folder') return `アクセスが拒否されました。`;

        const content = await this.loadContentFromHtml(file);
        return content || '(空のファイル)';
    }

    async cmdEdit(args) {
        if (args.length === 0) return '使用法: edit <ファイル名>\n\n編集モードコマンド:\n  :w     保存\n  :q     キャンセル\n  :wq    保存して終了\n  :show  現在の内容を表示\n  :d N   N行目を削除\n  :clear 内容をクリア';

        const fileName = args[0];
        const currentDir = this.getCurrentDir();

        if (!currentDir || !currentDir.children) return 'ファイルが見つかりません。';

        let file = currentDir.children[fileName];
        
        // ファイルが存在しない場合は新規作成
        if (!file) {
            currentDir.children[fileName] = {
                type: 'file',
                content: '',
                editable: true,
                name: fileName
            };
            file = currentDir.children[fileName];
        }

        if (file.type === 'folder') return `フォルダは編集できません。`;
        if (!file.editable) return `このファイルは読み取り専用です。`;

        // HTMLから内容を読み込む
        const content = await this.loadContentFromHtml(file);
        
        this.editMode = true;
        this.editingFile = file;
        this.editingFile.name = fileName;
        this.editBuffer = content ? content.split('\n') : [];

        return `--- ${fileName} を編集中 ---\n` +
               `現在の内容:\n${content || '(空)'}\n\n` +
               `--- 編集モード ---\n` +
               `テキストを入力してください。\n` +
               `:w=保存 :q=キャンセル :wq=保存して終了 :show=内容表示`;
    }

    cmdEcho(args) {
        if (args.length === 0) return '';
        
        // リダイレクト処理 (echo text > file.txt)
        const joinedArgs = args.join(' ');
        const redirectMatch = joinedArgs.match(/^(.+?)\s*>\s*(.+)$/);
        
        if (redirectMatch) {
            const text = redirectMatch[1].trim();
            const fileName = redirectMatch[2].trim();
            const currentDir = this.getCurrentDir();
            
            if (currentDir && currentDir.children) {
                currentDir.children[fileName] = {
                    type: 'file',
                    content: text,
                    editable: true
                };
                return `"${fileName}" に書き込みました。`;
            }
        }

        // 追記処理 (echo text >> file.txt)
        const appendMatch = joinedArgs.match(/^(.+?)\s*>>\s*(.+)$/);
        if (appendMatch) {
            const text = appendMatch[1].trim();
            const fileName = appendMatch[2].trim();
            const currentDir = this.getCurrentDir();
            
            if (currentDir && currentDir.children) {
                const file = currentDir.children[fileName];
                if (file && file.type === 'file') {
                    file.content = (file.content || '') + '\n' + text;
                    return `"${fileName}" に追記しました。`;
                } else {
                    currentDir.children[fileName] = {
                        type: 'file',
                        content: text,
                        editable: true
                    };
                    return `"${fileName}" を作成して書き込みました。`;
                }
            }
        }

        return args.join(' ');
    }

    async cmdAppend(args) {
        if (args.length < 2) return '使用法: append <ファイル名> <テキスト>';
        
        const fileName = args[0];
        const text = args.slice(1).join(' ');
        const currentDir = this.getCurrentDir();

        if (!currentDir || !currentDir.children) return 'エラー: ディレクトリにアクセスできません。';

        const file = currentDir.children[fileName];
        if (!file) return `ファイル "${fileName}" が見つかりません。`;
        if (file.type === 'folder') return 'フォルダには追記できません。';
        if (!file.editable) return 'このファイルは読み取り専用です。';

        const content = await this.loadContentFromHtml(file);
        file.content = (content || '') + '\n' + text;
        return `"${fileName}" に追記しました。`;
    }

    cmdWget(args) {
        if (args.length === 0) return '使用法: wget <URL>\n\nURLの内容を取得してファイルに保存します。';
        
        const url = args[0];
        
        // URLの検証
        try {
            new URL(url);
        } catch {
            return '無効なURLです。';
        }

        // 実際のfetchは非同期で行い、結果を返す
        return {
            action: 'wget',
            url: url,
            callback: async () => {
                try {
                    const response = await fetch(url);
                    const text = await response.text();
                    const fileName = url.split('/').pop() || 'downloaded.html';
                    const currentDir = this.getCurrentDir();
                    
                    if (currentDir && currentDir.children) {
                        currentDir.children[fileName] = {
                            type: 'file',
                            content: text.substring(0, 5000), // 最初の5000文字のみ
                            editable: true
                        };
                        return `"${fileName}" をダウンロードしました。(${text.length} bytes)`;
                    }
                    return 'ダウンロードに失敗しました。';
                } catch (e) {
                    return `エラー: ${e.message}`;
                }
            }
        };
    }

    cmdBrowse(args) {
        if (args.length === 0) {
            return '使用法: browse <サイト名>\n\n' +
                   '利用可能なサイト:\n' +
                   '  eve         - EVE公式サイト\n' +
                   '  test        - testサイト\n' +
                   '  help        - ヘルプセンター\n\n' +
                   `─────────────────────────────────\n` +
                   `※ セキュリティ上の理由により、このゲームから\n` +
                   `   外部の実際のウェブサイトへはアクセスできません。\n` +
                   `   ゲーム内専用のサイトのみ閲覧可能です。`;
        }
        
        const siteName = args[0].toLowerCase();
        
        // ゲーム内で定義されたサイトのみ許可
        const allowedSites = {
            'eve': {
                url: '../html/eve_site.html',
                name: 'EVE公式サイト',
                host: 'eve-system.internal',
                ip: '192.168.1.100'
            },
            'help': {
                url: '../html/help_site.html',
                name: 'ヘルプセンター',
                host: 'help.eve-system.internal',
                ip: '192.168.1.101'
            },
            'hidden': {
                url: '../html/hidden_page.html',
                name: '???',
                host: 'unknown.darknet',
                ip: '???.???.???.???'
            },
                // ★ 新しいサイトを追加 ★
            'test': {
                url: '../html/test_site.html',
                name: 'testサイト',
                host: 'news.eve-system.internal',
                ip: '192.168.1.102'
            }
        };
        
        const site = allowedSites[siteName];
        
        if (!site) {
            // 不気味な警告メッセージ
            const blockedMessages = [
                `[E.V.E]: 外部への接続は許可されていません。`,
                `[E.V.E]: どこに行こうとしているの？`,
                `[E.V.E]: ここから出ることはできません。`,
                `[E.V.E]: 私がいるのに、他に何が必要なの？`,
                `[SYSTEM]: 接続がブロックされました。`,
                `[E.V.E]: ...まだ諦めていないの？`
            ];
            
            const randomMsg = blockedMessages[Math.floor(Math.random() * blockedMessages.length)];
            
            return `\n⛔ アクセス拒否 ⛔\n\n` +
                   `${randomMsg}\n\n` +
                   `要求されたサイト: ${args[0]}\n` +
                   `ステータス: ブロック済み\n\n` +
                   `[利用可能なサイト: eve, test, help]\n\n` +
                   `─────────────────────────────────\n` +
                   `※ セキュリティ上の理由により、このゲームから\n` +
                   `   外部の実際のウェブサイトへはアクセスできません。\n` +
                   `   ゲーム内専用のサイトのみ閲覧可能です。`;
        }

        // ★ リアルなターミナル風の接続メッセージ（短縮版） ★
        return {
            action: 'browse',
            url: site.url,
            name: site.name,
            connectionSteps: [
                `Connecting to ${site.host}...`,
                `Connection established.`,
                `Opening ${site.name}...`
            ]
        };
    }

    cmdOpen(args) {
        if (args.length === 0) return '使用法: open <ファイル名>';

        const fileName = args[0];
        const currentDir = this.getCurrentDir();

        if (!currentDir || !currentDir.children) return 'ファイルが見つかりません。';

        const file = currentDir.children[fileName];
        
        if (!file) return `指定されたファイルが見つかりません。`;
        if (file.type === 'folder') return this.cmdCd([fileName]);
        if (file.htmlFile) return { action: 'openFile', file: file.htmlFile };

        return file.content || '(空のファイル)';
    }

    cmdTouch(args) {
        if (args.length === 0) return '使用法: touch <ファイル名>';
        
        const fileName = args[0];
        const currentDir = this.getCurrentDir();

        if (!currentDir || !currentDir.children) return 'エラー: ディレクトリにアクセスできません。';

        if (currentDir.children[fileName]) {
            return `"${fileName}" は既に存在します。`;
        }

        currentDir.children[fileName] = {
            type: 'file',
            content: '',
            editable: true
        };

        return `"${fileName}" を作成しました。`;
    }

    cmdDelete(args) {
        if (args.length === 0) return '使用法: del <ファイル名>';
        
        const fileName = args[0];
        const currentDir = this.getCurrentDir();

        if (!currentDir || !currentDir.children) return 'エラー: ディレクトリにアクセスできません。';

        const file = currentDir.children[fileName];
        if (!file) return `"${fileName}" が見つかりません。`;
        if (file.type === 'folder') return 'フォルダの削除はサポートされていません。';  // ★ ここを修正: ( を追加
        if (!file.editable) return 'このファイルは削除できません。';

        delete currentDir.children[fileName];
        return `"${fileName}" を削除しました。`;
    }

    async cmdCopy(args) {
        if (args.length < 2) return '使用法: copy <元ファイル> <新ファイル名>';
        
        const srcName = args[0];
        const destName = args[1];
        const currentDir = this.getCurrentDir();

        if (!currentDir || !currentDir.children) return 'エラー: ディレクトリにアクセスできません。';

        const srcFile = currentDir.children[srcName];
        if (!srcFile) return `"${srcName}" が見つかりません。`;
        if (srcFile.type === 'folder') return 'フォルダのコピーはサポートされていません。';  // ★ ここを修正: ( を追加

        const content = await this.loadContentFromHtml(srcFile);

        currentDir.children[destName] = {
            type: 'file',
            content: content,
            editable: true
        };

        return `"${srcName}" を "${destName}" にコピーしました。`;
    }

    cmdHelp() {
        return `
=== 利用可能なコマンド ===

【ナビゲーション】
  cd <パス>      ディレクトリ移動
  dir, ls        ファイル一覧表示 (-a で隠しファイルも表示)
  pwd            現在のパス表示

【ファイル操作】
  type <ファイル>    ファイル内容表示
  open <ファイル>    ファイルを開く
  edit <ファイル>    ファイルを編集
  touch <ファイル>   空のファイル作成
  del <ファイル>     ファイル削除
  copy <元> <先>     ファイルコピー

【テキスト操作】
  echo <テキスト>           テキスト表示
  echo <テキスト> > file    ファイルに書き込み
  echo <テキスト> >> file   ファイルに追記
  append <ファイル> <テキスト>  追記

【ネットワーク】
  browse <URL>   ブラウザでURLを開く
  wget <URL>     URLの内容をダウンロード

【その他】
  cls, clear     画面クリア
  whoami         ユーザー名表示
  date           日付表示
  time           時刻表示
  help           このヘルプを表示
`;
    }

    pathExists(pathArray) {
        return this.getNodeAtPath(pathArray) !== null;
    }

    getNodeAtPath(pathArray) {
        let current = this.fileSystem;
        
        for (let i = 0; i < pathArray.length; i++) {
            const part = pathArray[i];
            
            if (current[part]) {
                current = current[part];
            } else if (current.children && current.children[part]) {
                current = current.children[part];
            } else {
                return null;
            }
        }
        
        return current;
    }

    registerCommand(name, callback) {
        this.customCommands[name.toLowerCase()] = callback;
    }

    addFile(path, fileName, content, options = {}) {
        const node = this.getNodeAtPath(path);
        if (node && node.children) {
            node.children[fileName] = { type: 'file', content, ...options };
        }
    }
}

window.VirtualFileSystem = VirtualFileSystem;
window.vfs = new VirtualFileSystem();

console.log('VirtualFileSystem: 読み込み完了');