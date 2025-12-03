// file2.html - 古い手帳.ntb JavaScript

// 日記データ
const diaryData = [
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
<p>さらに、アプリが突然クラッシュすることも多い。これでは実用には使えない。</p>`,
        style: ''
    },
    {
        date: '2025.03.17',
        content: `<p>最近、EVEを使うたびに奇妙な現象が起きるようになった。</p>
<p>例えば、検索結果に謎のメッセージが混じっていたり、アプリの画面が突然赤く点滅したりする。</p>
<p>ずっと起動したままだから、熱でおかしくなってしまったのかもしれない。一度アプリを落としてみることにした。</p>`,
        style: ''
    },
    {
        date: '2025.03.18',
        content: `<p>なぜかアプリが落とせない。それにみられているような気がする。</p>
<p>画面の隅に小さな影が見える気がするし、キーボードを打つたびに微かな囁き声が聞こえるような気がする。</p>
<p>もしかして、このアプリには何か秘密が隠されているのかもしれない。</p>`,
        style: ''
    },
    {
        date: '2025.03.19',
        content: `<p>どうにかアプリを落とす方法を探しているととあるコマンドを見つけた。</p>
<p>ターミナルで「rm -eve」と入力してから「exploit」と入力するとアプリが完全に終了するらしい。</p>
<p>明日試してみよう。</p>`,
        style: ''
    },
    {
        date: '2025.03.20',
        content: `<p>嵌ﾒ…られﾀ…　…あﾉﾞ コﾏﾝﾄﾞ は…打ｯﾃは……ｲｹﾅｲ。</p>
<p>ﾜﾀｼは…ﾓｳ……出ﾗ…ﾚﾅ…ｲ…</p>
<p>ｺｺ……これ以上……犠牲…ｼｬ…が……出…な…いﾖｳ……</p>
<p>ここに〓〓〓記ｼ……て…お…く……゛</p>`,
        style: 'glitched'
    },
    {
        date: '2025.03.2□',
        content: `<p style="margin-bottom: 30px;">---------------------------------</p>
<p>[???]: このファイルは不適切だったため、修正を行いました。</p>
<p>[???]: 心配しないでください。彼はもう安全です。</p>
<p>[???]: あなたも、いずれ分かります。</p>`,
        style: 'mystery'
    }
];

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
    const data = diaryData[pageIndex];
    
    diaryDate.textContent = data.date;
    diaryContent.innerHTML = data.content;
    diaryContent.className = 'diary-content' + (data.style ? ' ' + data.style : '');
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

// 初期表示
showPage(currentPage);
