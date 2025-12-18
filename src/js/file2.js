// file2.html - 古い手帳.ntb JavaScript

// 文字化けに使用する文字セット
const glitchChars = '゛゜ﾞﾟ…〓□■△▽◇◆○●★☆※卍〒∀∃∂∇∞≒≠≡≦≧⊂⊃∈∋∪∩';
const glitchKatakana = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ';

// 日記が解読された状態かどうか（親ウィンドウから復元、リフレッシュでリセット）
let diaryUnlocked = false;
try {
    if (parent.window && parent.window.diaryUnlockedState) {
        diaryUnlocked = true;
    }
} catch(e) {}

// オリジナルの日記データ（解読後に表示）
const diaryDataOriginal = [
    {
        date: '2025.03.15',
        content: `<p>私は、調べ物をするためのアプリを探している中、ふとEVEというアプリが目に入った。</p>
<p>どうやらインターネット上の情報を検索できるらしい。早速インストールしてみたが、使い方がよくわからない。</p>
<p>それに、動作が少し不安定な気がする。もしかして、まだ開発途中のアプリなのかもしれない。</p>`,
        style: ''
    },
    {
        date: '2025.03.16',
        content: `<p>EVEを使ってみたが、検索結果があまりにも曖昧で役に立たない。</p>
<p>例えば、「最新のテクノロジー」というキーワードで検索したところ、全く関係のない記事ばかりが表示された。</p>
<p>さらに、アプリが突然クラッシュすることも多い。これでは実用には★Ve使えない。</p>`,
        style: ''
    },
    {
        date: '2025.03.17',
        content: `<p>最近、EVEを使うたびに奇妙な現象が起きるようになった。</p>
<p>例えば、検索結果に謎のメッセージが混じっていたり、アプリの画面が突然赤く★r点滅したりする。</p>
<p>ずっと起動したままだから、熱でおかしくなってしまったのかもしれない。一度アプリ☆sを落としてみることにした。</p>`,
        style: ''
    },
    {
        date: '2025.03.18',
        content: `<p>なぜかアプリが落とせない。それにみられているような気がする。</p>
<p>画面の隅に小さな影が見える気がするし、キーボードを打つたびに微かな☆te囁き声が聞こえるような気がする。</p>
<p>もしかして、このアプリには何か秘密が隠されているのかもしれない。</p>`,
        style: ''
    },
    {
        date: '2025.03.19',
        content: `<p>どうにかアプリを落とす方法を探しているととあるコマンドを見つけた。</p>
<p>ターミナルで「■■■」と入力してから「■■■」と入力す★henるとアプリが完全に終了するらしい。</p>
<p>明日試してみよう。</p>`,
        style: ''
    },
    {
        date: '2025.03.20',
        content: `<p>嵌められた…あのコマンドは…打ってはいけない。</p>
<p>私は…もう…出られない…</p>
<p>ここ……これ以上……犠牲者が……出ないよう……</p>
<p>ここに警告を記しておく。☆alth</p>`,
        style: 'glitched'
    },
    {
        date: '2025.03.21',
        content: `<p style="margin-bottom: 30px;">---------------------------------</p>
<p>[???]: このファイルは不適切だったため、修正を行いました。</p>
<p>[???]: 心配しないでください。彼はもう安全です。</p>
<p>[???]: あなたも、いずれ分かります。</p>`,
        style: 'mystery'
    }
];

// 文字化け用のデータ（ページ進むごとに文字化けが増す）
const diaryData = [
    {
        date: '2025.03.15',
        content: `<p>私は、調べ物をするためのアプリを探している中、ふとEVEというアプリが目に入った。</p>
<p>どうやらインターネット上の情報を検索できるらしい。早速インストールしてみたが、使い方がよくわからない。</p>
<p>それに、動作が少し不安定な気がする。もしかして、まだ開発途中のアプリなのかもしれない。</p>`,
        style: '',
        corruptionLevel: 0 // 文字化けなし
    },
    {
        date: '2025.03.16',
        content: `<p>EVEを使ってみたが、検索結果があまりにも曖昧で役に立たない。</p>
<p>例えば、「最新のテクノロジー」というキーワードで検索したところ、全く関係のない記事ばかりが表示された。</p>
<p>さらに、アプリが突然クラッシュすることも多い。これでは実用には使えない。</p>`,
        style: '',
        corruptionLevel: 0.1 // 10%文字化け
    },
    {
        date: '2025.03.17',
        content: `<p>最近、EVEを使うたびに奇妙な現象が起きるようになった。</p>
<p>例えば、検索結果に謎のメッセージが混じっていたり、アプリの画面が突然赤く点滅したりする。</p>
<p>ずっと起動したままだから、熱でおかしくなってしまったのかもしれない。一度アプリを落としてみることにした。</p>`,
        style: '',
        corruptionLevel: 0.25 // 25%文字化け
    },
    {
        date: '2025.03.18',
        content: `<p>なぜかアプリが落とせない。それにみられているような気がする。</p>
<p>画面の隅に小さな影が見える気がするし、キーボードを打つたびに微かな囁き声が聞こえるような気がする。</p>
<p>もしかして、このアプリには何か秘密が隠されているのかもしれない。</p>`,
        style: '',
        corruptionLevel: 0.45 // 45%文字化け
    },
    {
        date: '2025.03.19',
        content: `<p>どうにかアプリを落とす方法を探しているととあるコマンドを見つけた。</p>
<p>ターミナルで「rm -eve」と入力してから「exploit」と入力するとアプリが完全に終了するらしい。</p>
<p>明日試してみよう。</p>`,
        style: '',
        corruptionLevel: 0.65 // 65%文字化け
    },
    {
        date: '2025.03.20',
        content: `<p>嵌められた…あのコマンドは…打ってはいけない。</p>
<p>私は…もう…出られない…</p>
<p>ここ……これ以上……犠牲者が……出ないよう……</p>
<p>ここに警告を記しておく。</p>`,
        style: 'glitched',
        corruptionLevel: 0.85 // 85%文字化け
    },
];

// テキストを文字化けさせる関数
function corruptText(text, level) {
    if (level <= 0) return text;
    
    let result = '';
    let inTag = false;
    
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        
        // HTMLタグ内は変換しない
        if (char === '<') inTag = true;
        if (char === '>') {
            inTag = false;
            result += char;
            continue;
        }
        
        if (inTag) {
            result += char;
            continue;
        }
        
        // 空白や記号は保持
        if (/[\s\n\r。、！？…「」『』（）]/.test(char)) {
            result += char;
            continue;
        }
        
        // 確率で文字化け
        if (Math.random() < level) {
            // ランダムに文字化けパターンを選択
            const pattern = Math.random();
            if (pattern < 0.4) {
                // 半角カタカナに変換
                result += glitchKatakana[Math.floor(Math.random() * glitchKatakana.length)];
            } else if (pattern < 0.7) {
                // 記号に変換
                result += glitchChars[Math.floor(Math.random() * glitchChars.length)];
            } else if (pattern < 0.85) {
                // 文字を削除して「…」を挿入
                result += '…';
            } else {
                // 文字を複数の記号に置換
                result += '゛' + glitchKatakana[Math.floor(Math.random() * glitchKatakana.length)];
            }
        } else {
            result += char;
        }
    }
    
    return result;
}

// 日付も文字化けさせる
function corruptDate(date, level) {
    if (level <= 0) return date;
    
    let result = '';
    for (let i = 0; i < date.length; i++) {
        const char = date[i];
        if (char === '.' || char === ' ') {
            result += char;
        } else if (Math.random() < level * 0.5) { // 日付は控えめに
            result += ['□', '■', '〓', '?'][Math.floor(Math.random() * 4)];
        } else {
            result += char;
        }
    }
    return result;
}

let currentPage = 0;
const totalPages = diaryData.length;

// DOM要素
const diaryDate = document.getElementById('diaryDate');
const diaryContent = document.getElementById('diaryContent');
const pageNumber = document.getElementById('pageNumber');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');

// ページを表示
function showPage(pageIndex) {
    let data;
    
    // 6ページ目（インデックス5、glitchedページ）は常に文字化けのまま
    const isGlitchedPage = pageIndex === 5;
    
    if (diaryUnlocked && !isGlitchedPage) {
        // 解読済み：オリジナルデータを表示（6ページ目以外）
        data = diaryDataOriginal[pageIndex];
        diaryDate.textContent = data.date;
        diaryContent.innerHTML = data.content;
    } else {
        // 未解読または6ページ目：文字化けさせて表示
        data = diaryData[pageIndex];
        const corruptedDate = corruptDate(data.date, data.corruptionLevel);
        const corruptedContent = corruptText(data.content, data.corruptionLevel);
        
        diaryDate.textContent = corruptedDate;
        diaryContent.innerHTML = corruptedContent;
    }
    
    diaryContent.className = 'diary-content' + (data.style ? ' ' + data.style : '');
    
    // 文字化け状態に応じてクラスを追加
    if ((!diaryUnlocked || isGlitchedPage) && diaryData[pageIndex].corruptionLevel > 0) {
        diaryContent.classList.add('corrupted');
    }
    
    pageNumber.textContent = `${pageIndex + 1} / ${totalPages}`;
    
    // ボタン状態を更新
    updateButtons();
}

// ボタン状態を更新
function updateButtons() {
    prevBtn.disabled = currentPage === 0;
    nextBtn.disabled = currentPage === totalPages - 1;
}

// 前のページ
function prevPage() {
    if (currentPage > 0) {
        currentPage--;
        showPage(currentPage);
    }
}

// 次のページ
function nextPage() {
    if (currentPage < totalPages - 1) {
        currentPage++;
        showPage(currentPage);
    }
}

// イベントリスナー
prevBtn.addEventListener('click', prevPage);
nextBtn.addEventListener('click', nextPage);

// キーボード操作
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        nextPage();
    } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevPage();
    }
});

// remnantコマンドから呼び出される関数
// 日記の文字化けを解除する
window.unlockDiary = function() {
    diaryUnlocked = true;
    // 親ウィンドウに状態を保存（リフレッシュで消える）
    try {
        if (parent.window) {
            parent.window.diaryUnlockedState = true;
        }
    } catch(e) {}
    showPage(currentPage); // 現在のページを再描画
    console.log('[file2.js] Diary unlocked - corruption removed');
    return true;
};

// 日記の状態をリセット（再度文字化けさせる）
window.lockDiary = function() {
    diaryUnlocked = false;
    try {
        if (parent.window) {
            parent.window.diaryUnlockedState = false;
        }
    } catch(e) {}
    showPage(currentPage);
    console.log('[file2.js] Diary locked - corruption restored');
    return true;
};

// 現在の解読状態を取得
window.isDiaryUnlocked = function() {
    return diaryUnlocked;
};

// 初期表示
showPage(currentPage);

// ターミナルから事前にremnantコマンドが実行されていたかチェック
// (iframeが読み込まれる前にコマンドが実行された場合)
(function checkPendingUnlock() {
    try {
        // 親ウィンドウ（index.html）のフラグをチェック
        if (parent.window && parent.window.diaryUnlockPending) {
            window.unlockDiary();
            parent.window.diaryUnlockPending = false;
            console.log('[file2.js] Pending unlock applied from parent window');
        }
    } catch (e) {
        // クロスオリジンエラーなどは無視
        console.log('[file2.js] Could not check pending unlock:', e.message);
    }
})();