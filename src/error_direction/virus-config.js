/**
 * ウイルス演出の設定ファイル
 * 複数ページで使い回せます
 */

window.VIRUS_SIM_OPTIONS = {
    count: 40,                 // ポップアップの生成数
    interval: 120,             // 生成間隔（ミリ秒）
    maxOnScreen: 60,           // 画面上の最大数
    enableGlitch: false,        // 画面チラつき効果
    messages: [
        'ウイルス検出！',
        'システムスキャン実行中',
        'ファイルが破損しています',
        '緊急アップデート推奨',
        'データを復旧してください',
        'クリックして続行',
        'セキュリティエラー'
    ]
};

// 複数の設定パターンをエクスポート（必要に応じて使い分け）
window.VIRUS_PRESETS = {
    // 軽め（テスト用）
    light: {
        count: 10,
        interval: 300,
        maxOnScreen: 20,
        enableGlitch: false
    },
    // 標準
    normal: {
        count: 40,
        interval: 120,
        maxOnScreen: 60,
        enableGlitch: true
    },
    // 激烈（ゲーム演出用）
    intense: {
        count: 100,
        interval: 50,
        maxOnScreen: 150,
        enableGlitch: true
    }
};