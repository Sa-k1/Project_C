/**
 * カメラ演出（フラッシュ + 映像風）
 * 実際には撮影しないが、撮られているような恐怖を演出
 */

class CameraScare {
    constructor() {
        this.targetWindow = (window.parent && window.parent !== window) ? window.parent : window;
        this.targetDocument = this.targetWindow.document;
        this.stream = null;
        this.videoElement = null;
    }

    wait(ms) {
        return new Promise(res => setTimeout(res, ms));
    }

    // ================================
    // 1. カメラフラッシュ演出
    // ================================
    async flash(count = 1) {
        for (let i = 0; i < count; i++) {
            const flash = this.targetDocument.createElement('div');
            flash.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: #fff;
                z-index: 9999999;
                pointer-events: none;
                opacity: 0;
            `;
            this.targetDocument.body.appendChild(flash);

            // フラッシュ！
            flash.style.opacity = '1';
            await this.wait(80);
            flash.style.transition = 'opacity 0.3s';
            flash.style.opacity = '0';
            await this.wait(300);
            flash.remove();

            if (count > 1) {
                await this.wait(200);
            }
        }
    }

    // ================================
    // 2. シャッター音風の視覚演出
    // ================================
    async shutterEffect() {
        // 上下から黒いバーが閉じる演出
        const topBar = this.targetDocument.createElement('div');
        const bottomBar = this.targetDocument.createElement('div');

        const barStyle = `
            position: fixed;
            left: 0;
            width: 100vw;
            height: 0;
            background: #000;
            z-index: 9999998;
            pointer-events: none;
            transition: height 0.05s ease-in;
        `;

        topBar.style.cssText = barStyle + 'top: 0;';
        bottomBar.style.cssText = barStyle + 'bottom: 0;';

        this.targetDocument.body.appendChild(topBar);
        this.targetDocument.body.appendChild(bottomBar);

        // 閉じる
        topBar.style.height = '50vh';
        bottomBar.style.height = '50vh';
        await this.wait(50);

        // フラッシュ
        await this.flash();

        // 開く
        topBar.style.height = '0';
        bottomBar.style.height = '0';
        await this.wait(100);

        topBar.remove();
        bottomBar.remove();
    }

    // ================================
    // 3. 「撮影中」インジケーター
    // ================================
    async showRecordingIndicator(duration = 3000) {
        const indicator = this.targetDocument.createElement('div');
        indicator.id = 'camera-recording-indicator';
        indicator.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 15px;
            background: rgba(0, 0, 0, 0.8);
            border-radius: 5px;
            z-index: 9999999;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.3s;
        `;
        indicator.innerHTML = `
            <div style="
                width: 12px;
                height: 12px;
                background: #ff0000;
                border-radius: 50%;
                animation: recording-blink 1s infinite;
            "></div>
            <span style="
                color: #fff;
                font-family: 'MS Gothic', monospace;
                font-size: 14px;
            ">REC</span>
        `;

        // アニメーションスタイル
        const style = this.targetDocument.createElement('style');
        style.id = 'camera-recording-style';
        style.textContent = `
            @keyframes recording-blink {
                0%, 50% { opacity: 1; }
                51%, 100% { opacity: 0.3; }
            }
        `;
        this.targetDocument.head.appendChild(style);
        this.targetDocument.body.appendChild(indicator);

        indicator.style.opacity = '1';
        await this.wait(duration);
        indicator.style.opacity = '0';
        await this.wait(300);
        indicator.remove();
        style.remove();
    }

    // ================================
    // 4. カメラ映像風オーバーレイ（自分が映っている風）
    // ================================
    async showFakeCameraView(duration = 4000) {
        const overlay = this.targetDocument.createElement('div');
        overlay.id = 'fake-camera-view';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: #000;
            z-index: 9999998;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.5s;
            display: flex;
            justify-content: center;
            align-items: center;
        `;

        // ノイズ風の背景 + シルエット
        overlay.innerHTML = `
            <div style="
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: 
                    repeating-linear-gradient(
                        0deg,
                        rgba(0, 0, 0, 0.1) 0px,
                        rgba(0, 0, 0, 0.1) 1px,
                        transparent 1px,
                        transparent 2px
                    );
                animation: camera-noise 0.1s infinite;
                opacity: 0.5;
            "></div>
            <div style="
                position: relative;
                width: 200px;
                height: 280px;
                background: radial-gradient(ellipse at center,
                    rgba(30, 30, 30, 0.9) 0%,
                    rgba(20, 20, 20, 0.95) 50%,
                    rgba(10, 10, 10, 1) 100%
                );
                border-radius: 100px 100px 80px 80px;
                box-shadow: 0 0 50px rgba(0, 0, 0, 0.8);
            ">
                <!-- 顔のシルエット -->
                <div style="
                    position: absolute;
                    top: 60px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 80px;
                    height: 80px;
                    background: rgba(15, 15, 15, 1);
                    border-radius: 50%;
                "></div>
            </div>
            <!-- RECインジケーター -->
            <div style="
                position: absolute;
                top: 30px;
                left: 30px;
                display: flex;
                align-items: center;
                gap: 8px;
            ">
                <div style="
                    width: 15px;
                    height: 15px;
                    background: #ff0000;
                    border-radius: 50%;
                    animation: rec-blink 1s infinite;
                "></div>
                <span style="color: #ff0000; font-family: monospace; font-size: 18px;">● REC</span>
            </div>
            <!-- タイムスタンプ -->
            <div id="camera-timestamp" style="
                position: absolute;
                bottom: 30px;
                right: 30px;
                color: #fff;
                font-family: 'Courier New', monospace;
                font-size: 16px;
                opacity: 0.8;
            "></div>
            <!-- 枠線 -->
            <div style="
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 250px;
                height: 330px;
                border: 2px solid rgba(255, 255, 255, 0.3);
                border-radius: 10px;
            ">
                <!-- コーナーマーク -->
                <div style="position: absolute; top: -5px; left: -5px; width: 20px; height: 20px; border-top: 3px solid #fff; border-left: 3px solid #fff;"></div>
                <div style="position: absolute; top: -5px; right: -5px; width: 20px; height: 20px; border-top: 3px solid #fff; border-right: 3px solid #fff;"></div>
                <div style="position: absolute; bottom: -5px; left: -5px; width: 20px; height: 20px; border-bottom: 3px solid #fff; border-left: 3px solid #fff;"></div>
                <div style="position: absolute; bottom: -5px; right: -5px; width: 20px; height: 20px; border-bottom: 3px solid #fff; border-right: 3px solid #fff;"></div>
            </div>
        `;

        // スタイル追加
        const style = this.targetDocument.createElement('style');
        style.id = 'fake-camera-style';
        style.textContent = `
            @keyframes camera-noise {
                0% { transform: translateY(0); }
                100% { transform: translateY(-2px); }
            }
            @keyframes rec-blink {
                0%, 50% { opacity: 1; }
                51%, 100% { opacity: 0.2; }
            }
        `;
        this.targetDocument.head.appendChild(style);
        this.targetDocument.body.appendChild(overlay);

        // タイムスタンプ更新
        const timestamp = overlay.querySelector('#camera-timestamp');
        const updateTime = () => {
            const now = new Date();
            timestamp.textContent = now.toLocaleString('ja-JP');
        };
        updateTime();
        const timeInterval = setInterval(updateTime, 1000);

        // フェードイン
        await this.wait(100);
        overlay.style.opacity = '1';

        await this.wait(duration);

        // フェードアウト
        overlay.style.opacity = '0';
        await this.wait(500);
        clearInterval(timeInterval);
        overlay.remove();
        style.remove();
    }

    // ================================
    // 5. 実際のカメラ映像を一瞬表示（許可された場合）
    // ================================
    async showRealCamera(duration = 3000) {
        try {
            // カメラアクセス許可を求める
            this.stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'user' },
                audio: false 
            });

            const container = this.targetDocument.createElement('div');
            container.id = 'real-camera-container';
            container.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: #000;
                z-index: 9999998;
                pointer-events: none;
                opacity: 0;
                transition: opacity 0.3s;
                display: flex;
                justify-content: center;
                align-items: center;
            `;

            // ビデオ要素
            this.videoElement = this.targetDocument.createElement('video');
            this.videoElement.srcObject = this.stream;
            this.videoElement.autoplay = true;
            this.videoElement.muted = true;
            this.videoElement.playsInline = true;
            this.videoElement.style.cssText = `
                width: 100%;
                height: 100%;
                object-fit: cover;
                filter: grayscale(0.5) contrast(1.2);
            `;

            // RECインジケーター
            const recIndicator = this.targetDocument.createElement('div');
            recIndicator.style.cssText = `
                position: absolute;
                top: 30px;
                left: 30px;
                display: flex;
                align-items: center;
                gap: 8px;
            `;
            recIndicator.innerHTML = `
                <div style="
                    width: 15px;
                    height: 15px;
                    background: #ff0000;
                    border-radius: 50%;
                    animation: rec-blink 1s infinite;
                "></div>
                <span style="color: #ff0000; font-family: monospace; font-size: 18px; text-shadow: 0 0 10px #ff0000;">● REC</span>
            `;

            // スタイル
            const style = this.targetDocument.createElement('style');
            style.id = 'real-camera-style';
            style.textContent = `
                @keyframes rec-blink {
                    0%, 50% { opacity: 1; }
                    51%, 100% { opacity: 0.2; }
                }
            `;

            container.appendChild(this.videoElement);
            container.appendChild(recIndicator);
            this.targetDocument.head.appendChild(style);
            this.targetDocument.body.appendChild(container);

            // フェードイン
            await this.wait(100);
            container.style.opacity = '1';

            await this.wait(duration);

            // フラッシュして終了
            await this.flash();

            // フェードアウト
            container.style.opacity = '0';
            await this.wait(300);

            // クリーンアップ
            this.stopCamera();
            container.remove();
            style.remove();

        } catch (e) {
            console.log('カメラアクセス拒否またはエラー:', e);
            // カメラが使えない場合はフェイク映像を表示
            await this.showFakeCameraView(duration);
        }
    }

    // ================================
    // 6. カメラ停止
    // ================================
    stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        if (this.videoElement) {
            this.videoElement.srcObject = null;
            this.videoElement = null;
        }
    }

    // ================================
    // 7. 複合演出：撮影される恐怖
    // ================================
    async captureSequence() {
        // RECインジケーター表示
        await this.showRecordingIndicator(2000);
        await this.wait(500);

        // シャッター演出
        await this.shutterEffect();
        await this.wait(300);

        // フラッシュ連続
        await this.flash(3);
    }

    // ================================
    // 8. 複合演出：監視されている恐怖
    // ================================
    async surveillanceSequence() {
        // まずカメラ映像（実際 or フェイク）
        await this.showRealCamera(4000);
        await this.wait(500);

        // RECインジケーターが残る
        await this.showRecordingIndicator(2000);
    }

    // ================================
    // 9. EVE専用演出：「見つけた」
    // ================================
    async eveFoundYou() {
        // フラッシュ
        await this.flash();
        await this.wait(200);

        // カメラビュー
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'user' },
                audio: false 
            });

            const container = this.targetDocument.createElement('div');
            container.id = 'eve-found-container';
            container.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: #000;
                z-index: 9999998;
                pointer-events: none;
                opacity: 0;
                transition: opacity 0.3s;
            `;

            this.videoElement = this.targetDocument.createElement('video');
            this.videoElement.srcObject = this.stream;
            this.videoElement.autoplay = true;
            this.videoElement.muted = true;
            this.videoElement.playsInline = true;
            this.videoElement.style.cssText = `
                width: 100%;
                height: 100%;
                object-fit: cover;
                filter: grayscale(1) contrast(1.5) brightness(0.7);
            `;

            // EVEのメッセージオーバーレイ
            const message = this.targetDocument.createElement('div');
            message.style.cssText = `
                position: absolute;
                bottom: 15%;
                left: 50%;
                transform: translateX(-50%);
                color: #ff0000;
                font-family: 'MS Gothic', monospace;
                font-size: 48px;
                text-shadow: 0 0 20px #ff0000, 0 0 40px #ff0000;
                opacity: 0;
                transition: opacity 1s;
            `;
            message.textContent = '見つけた';

            container.appendChild(this.videoElement);
            container.appendChild(message);
            this.targetDocument.body.appendChild(container);

            await this.wait(100);
            container.style.opacity = '1';

            await this.wait(1500);
            message.style.opacity = '1';

            await this.wait(3000);

            // フラッシュして終了
            await this.flash();
            container.style.opacity = '0';
            await this.wait(300);

            this.stopCamera();
            container.remove();

        } catch (e) {
            // フェイク版
            await this.showFakeCameraView(3000);
        }
    }
}

// グローバルに公開
window.CameraScare = CameraScare;
window.cameraScare = new CameraScare();

console.log('CameraScare: 読み込み完了');
console.log('使用例:');
console.log('  cameraScare.flash()              // フラッシュ');
console.log('  cameraScare.shutterEffect()      // シャッター演出');
console.log('  cameraScare.showRecordingIndicator()  // REC表示');
console.log('  cameraScare.showFakeCameraView() // 偽カメラ映像');
console.log('  cameraScare.showRealCamera()     // 実カメラ映像');
console.log('  cameraScare.captureSequence()    // 撮影演出');
console.log('  cameraScare.surveillanceSequence() // 監視演出');
console.log('  cameraScare.eveFoundYou()        // EVE「見つけた」');