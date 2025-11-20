/**
 * ウイルス演出の設定ファイル
 * 複数ページで使い回せます
 */

window.VIRUS_SIM_OPTIONS = {
    count: 150,                 // ポップアップの生成数
    interval: 200,             // 生成間隔（ミリ秒）
    maxOnScreen: 150,           // 画面上の最大表示数
    enableGlitch: false,       // 画面チラつき効果
    lifetime: 7000,            // ポップアップの生存時間（ms）← 追加推奨
    sound: false,              // 警告音を鳴らすか（後で実装できるようにする）
    
    messages: [
        'ウイルス検出！',
        'セキュリティエラー',
        'ファイルが破損しています',
        'システムスキャン実行中',
        '緊急アップデート推奨',
        'データを復旧してください',
        'クリックして続行'
    ],
};


/* -----------------------------------------
   プリセット：用途別に使い分け
------------------------------------------ */

window.VIRUS_PRESETS = {
    // 軽め（デバッグやPC負荷対策用）
    light: {
        count: 10,
        interval: 300,
        maxOnScreen: 20,
        enableGlitch: false,
        lifetime: 5000
    },

    // 標準（推奨）
    normal: {
        count: 40,
        interval: 120,
        maxOnScreen: 60,
        enableGlitch: true,
        lifetime: 7000
    },

    // 激烈（ゲームの最終演出などで使用）
    intense: {
        count: 100,
        interval: 40,
        maxOnScreen: 150,
        enableGlitch: true,
        lifetime: 8000
    },

    // スマホ向け（軽量・低負荷）
    mobile: {
        count: 20,
        interval: 200,
        maxOnScreen: 30,
        enableGlitch: false,
        lifetime: 6000
    }
};
