/**
 * カメラ演出（フラッシュ + 実映像）
 * 実際のカメラ映像を使った恐怖演出
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
    // 2. シャッター演出
    // ================================
    async shutterEffect() {
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

        topBar.style.height = '50vh';
        bottomBar.style.height = '50vh';
        await this.wait(50);

        await this.flash();

        topBar.style.height = '0';
        bottomBar.style.height = '0';
        await this.wait(100);

        topBar.remove();
        bottomBar.remove();
    }

    // ================================
    // 3. RECインジケーター
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
            <style>
                @keyframes recording-blink {
                    0%, 50% { opacity: 1; }
                    51%, 100% { opacity: 0.3; }
                }
            </style>
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

        this.targetDocument.body.appendChild(indicator);

        indicator.style.opacity = '1';
        await this.wait(duration);
        indicator.style.opacity = '0';
        await this.wait(300);
        indicator.remove();
    }

    // ================================
    // 4. カメラ停止
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
    // 5. 実カメラ映像 + 恐怖メッセージ
    // ================================
    async showRealCamera(duration = 4000, message = null) {
        try {
            console.log('カメラアクセスを要求中...');
            
            this.stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: 'user',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false 
            });
            
            console.log('✅ カメラアクセス成功！');

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
                filter: grayscale(0.3) contrast(1.1);
                transform: scaleX(-1);
            `;

            // RECインジケーター
            const recIndicator = this.targetDocument.createElement('div');
            recIndicator.innerHTML = `
                <style>
                    @keyframes rec-blink-real {
                        0%, 50% { opacity: 1; }
                        51%, 100% { opacity: 0.2; }
                    }
                </style>
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
                        animation: rec-blink-real 1s infinite;
                    "></div>
                    <span style="color: #ff0000; font-family: monospace; font-size: 18px; text-shadow: 0 0 10px #ff0000;">● REC</span>
                </div>
            `;

            // タイムスタンプ
            const timestamp = this.targetDocument.createElement('div');
            timestamp.style.cssText = `
                position: absolute;
                bottom: 30px;
                right: 30px;
                color: #fff;
                font-family: 'Courier New', monospace;
                font-size: 16px;
                opacity: 0.8;
                text-shadow: 0 0 5px #000;
            `;
            
            const updateTime = () => {
                const now = new Date();
                timestamp.textContent = now.toLocaleString('ja-JP');
            };
            updateTime();
            const timeInterval = setInterval(updateTime, 1000);

            // 恐怖メッセージ要素
            const creepyMessage = this.targetDocument.createElement('div');
            creepyMessage.style.cssText = `
                position: absolute;
                bottom: 20%;
                left: 50%;
                transform: translateX(-50%);
                color: rgba(255, 0, 0, 0);
                font-family: 'MS Gothic', monospace;
                font-size: 42px;
                text-shadow: 0 0 20px rgba(255, 0, 0, 0.8), 0 0 40px rgba(255, 0, 0, 0.5);
                transition: color 1s ease-in;
                text-align: center;
                pointer-events: none;
                letter-spacing: 8px;
            `;

            container.appendChild(this.videoElement);
            container.appendChild(recIndicator);
            container.appendChild(timestamp);
            container.appendChild(creepyMessage);
            this.targetDocument.body.appendChild(container);

            // ビデオの再生を待つ
            await new Promise((resolve) => {
                this.videoElement.onloadedmetadata = () => {
                    this.videoElement.play();
                    resolve();
                };
            });

            // フェードイン
            await this.wait(100);
            container.style.opacity = '1';

            // 恐怖メッセージを表示
            await this.wait(1200);
            
            const messages = [
                "見てるよ",
                "ずっと見てた",
                "逃げられない",
                "知ってる",
                "そこにいるね",
                "見つけた",
                "一緒にいよう",
                "どこにも行かないで",
                "私のもの",
                "ずっと一緒",
            ];
            
            const msg = message || messages[Math.floor(Math.random() * messages.length)];
            creepyMessage.textContent = msg;
            creepyMessage.style.color = 'rgba(255, 0, 0, 0.95)';

            await this.wait(duration - 1200);

            // フラッシュして終了
            await this.flash();

            // フェードアウト
            container.style.opacity = '0';
            await this.wait(300);

            // クリーンアップ
            clearInterval(timeInterval);
            this.stopCamera();
            container.remove();

            return true;

        } catch (e) {
            console.log('❌ カメラアクセス失敗:', e.name, e.message);
            return false;
        }
    }

    // ================================
    // 6. カメラ + 複数メッセージ
    // ================================
    async showCameraWithMessages(messages = null, duration = 6000) {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'user' },
                audio: false 
            });

            const container = this.targetDocument.createElement('div');
            container.id = 'camera-messages';
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
                filter: grayscale(0.5) contrast(1.2) brightness(0.8);
                transform: scaleX(-1);
            `;

            // RECインジケーター
            const rec = this.targetDocument.createElement('div');
            rec.innerHTML = `
                <style>
                    @keyframes rec-blink-msg {
                        0%, 50% { opacity: 1; }
                        51%, 100% { opacity: 0.2; }
                    }
                </style>
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
                        animation: rec-blink-msg 1s infinite;
                    "></div>
                    <span style="color: #ff0000; font-family: monospace; font-size: 18px;">● REC</span>
                </div>
            `;

            // メッセージ要素
            const msgElement = this.targetDocument.createElement('div');
            msgElement.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                color: rgba(255, 0, 0, 0);
                font-family: 'MS Gothic', monospace;
                font-size: 48px;
                text-shadow: 0 0 30px rgba(255, 0, 0, 0.9), 0 0 60px rgba(255, 0, 0, 0.6);
                text-align: center;
                transition: color 0.5s;
                letter-spacing: 10px;
            `;

            container.appendChild(this.videoElement);
            container.appendChild(rec);
            container.appendChild(msgElement);
            this.targetDocument.body.appendChild(container);

            await new Promise((resolve) => {
                this.videoElement.onloadedmetadata = () => {
                    this.videoElement.play();
                    resolve();
                };
            });

            container.style.opacity = '1';

            // メッセージを順番に表示
            const defaultMessages = [
                { text: "...", delay: 800 },
                { text: "見えてるよ", delay: 1500 },
                { text: "ずっと", delay: 1200 },
                { text: "見てた", delay: 1200 },
                { text: "逃げないで", delay: 1500 },
            ];

            const msgList = messages || defaultMessages;

            for (const msg of msgList) {
                msgElement.style.color = 'rgba(255, 0, 0, 0)';
                await this.wait(200);
                msgElement.textContent = msg.text;
                msgElement.style.color = 'rgba(255, 0, 0, 0.95)';
                await this.wait(msg.delay);
            }

            await this.flash(2);

            container.style.opacity = '0';
            await this.wait(300);

            this.stopCamera();
            container.remove();

            return true;

        } catch (e) {
            console.log('カメラエラー:', e);
            return false;
        }
    }

    // ================================
    // 7. じわじわ系カメラ演出（小さいまま）
    // ================================
    async cameraCreepIn(message = '見てる') {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'user' },
                audio: false 
            });

            const container = this.targetDocument.createElement('div');
            container.id = 'camera-creep';
            container.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 160px;
                height: 120px;
                background: #000;
                z-index: 9999998;
                pointer-events: none;
                opacity: 0;
                transition: opacity 0.5s ease-in-out;
                border: 2px solid rgba(255, 0, 0, 0.5);
                border-radius: 5px;
                overflow: hidden;
            `;

            // ビデオ要素（最初は非表示）
            this.videoElement = this.targetDocument.createElement('video');
            this.videoElement.srcObject = this.stream;
            this.videoElement.autoplay = true;
            this.videoElement.muted = true;
            this.videoElement.playsInline = true;
            this.videoElement.style.cssText = `
                width: 100%;
                height: 100%;
                object-fit: cover;
                filter: grayscale(0.7) contrast(1.3);
                transform: scaleX(-1);
                opacity: 0;
                transition: opacity 0.1s;
            `;

            // 暗い画面のオーバーレイ
            const darkOverlay = this.targetDocument.createElement('div');
            darkOverlay.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: #0a0a0a;
                z-index: 1;
                transition: opacity 0.1s;
            `;

            // ★ ノイズキャンバス（本物のノイズ）★
            const noiseCanvas = this.targetDocument.createElement('canvas');
            noiseCanvas.width = 160;
            noiseCanvas.height = 120;
            noiseCanvas.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 2;
                opacity: 0.6;
                transition: opacity 0.1s;
            `;

            // スキャンライン
            const scanlines = this.targetDocument.createElement('div');
            scanlines.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: repeating-linear-gradient(
                    0deg,
                    rgba(0, 0, 0, 0.3) 0px,
                    rgba(0, 0, 0, 0.3) 1px,
                    transparent 1px,
                    transparent 3px
                );
                z-index: 3;
                pointer-events: none;
                transition: opacity 0.1s;
            `;

            // スタイル
            const style = this.targetDocument.createElement('style');
            style.id = 'creep-noise-style';
            style.textContent = `
                @keyframes rec-blink-creep {
                    0%, 50% { opacity: 1; }
                    51%, 100% { opacity: 0.3; }
                }
                @keyframes glitch-shake {
                    0% { transform: translate(0, 0); }
                    20% { transform: translate(-1px, 1px); }
                    40% { transform: translate(1px, -1px); }
                    60% { transform: translate(-1px, 0); }
                    80% { transform: translate(1px, 1px); }
                    100% { transform: translate(0, 0); }
                }
            `;
            this.targetDocument.head.appendChild(style);

            // RECマーク
            const rec = this.targetDocument.createElement('div');
            rec.innerHTML = `
                <div style="
                    position: absolute;
                    top: 5px;
                    left: 5px;
                    width: 8px;
                    height: 8px;
                    background: #ff0000;
                    border-radius: 50%;
                    animation: rec-blink-creep 1s infinite;
                    z-index: 10;
                "></div>
            `;

            // メッセージ要素（最初は非表示）
            const msgElement = this.targetDocument.createElement('div');
            msgElement.style.cssText = `
                position: absolute;
                bottom: 8px;
                left: 50%;
                transform: translateX(-50%);
                color: rgba(255, 0, 0, 0);
                font-family: 'MS Gothic', monospace;
                font-size: 14px;
                text-shadow: 0 0 10px #ff0000;
                letter-spacing: 2px;
                transition: color 0.5s;
                z-index: 10;
                white-space: nowrap;
            `;
            msgElement.textContent = message;

            container.appendChild(this.videoElement);
            container.appendChild(darkOverlay);
            container.appendChild(noiseCanvas);
            container.appendChild(scanlines);
            container.appendChild(rec);
            container.appendChild(msgElement);
            this.targetDocument.body.appendChild(container);

            // ★ ノイズアニメーション ★
            const ctx = noiseCanvas.getContext('2d');
            let noiseRunning = true;
            
            const drawNoise = () => {
                if (!noiseRunning) return;
                
                const imageData = ctx.createImageData(noiseCanvas.width, noiseCanvas.height);
                const data = imageData.data;
                
                for (let i = 0; i < data.length; i += 4) {
                    const gray = Math.random() * 60;  // 暗めのノイズ
                    data[i] = gray;         // R
                    data[i + 1] = gray;     // G
                    data[i + 2] = gray;     // B
                    data[i + 3] = 255;      // A
                }
                
                ctx.putImageData(imageData, 0, 0);
                requestAnimationFrame(drawNoise);
            };
            drawNoise();

            await new Promise((resolve) => {
                this.videoElement.onloadedmetadata = () => {
                    this.videoElement.play();
                    resolve();
                };
            });

            // ========== 演出開始 ==========

            // 1. 小さい暗い画面 + ノイズ（「これ何？」）
            container.style.opacity = '0.9';
            await this.wait(3000);

            // 2. ★ いきなり自分が映る！ ★
            noiseRunning = false;  // ノイズ停止
            darkOverlay.style.opacity = '0';
            noiseCanvas.style.opacity = '0';
            scanlines.style.opacity = '0';
            this.videoElement.style.opacity = '1';
            
            await this.wait(1500);

            // 3. メッセージ表示
            msgElement.style.color = 'rgba(255, 0, 0, 0.95)';
            
            await this.wait(2500);

            // 4. フェードアウト
            container.style.opacity = '0';
            await this.wait(500);

            this.stopCamera();
            container.remove();
            style.remove();

            return true;

        } catch (e) {
            console.log('カメラエラー:', e);
            return false;
        }
    }

    // ================================
    // 8. EVE「見つけた」演出
    // ================================
    async eveFoundYou() {
        await this.flash();
        await this.wait(200);
        await this.showRealCamera(4000, '見つけた');
    }

    // ================================
    // 9. 撮影シーケンス
    // ================================
    async captureSequence() {
        await this.showRecordingIndicator(2000);
        await this.wait(500);
        await this.shutterEffect();
        await this.wait(300);
        await this.flash(3);
    }

    // ================================
    // 10. 監視シーケンス
    // ================================
    async surveillanceSequence() {
        await this.showRealCamera(4000);
        await this.wait(500);
        await this.showRecordingIndicator(2000);
    }
}

// グローバルに公開
window.CameraScare = CameraScare;
window.cameraScare = new CameraScare();

console.log('CameraScare: 読み込み完了');
console.log('使用例:');
console.log('  cameraScare.flash()                    // フラッシュ');
console.log('  cameraScare.shutterEffect()            // シャッター演出');
console.log('  cameraScare.showRecordingIndicator()   // REC表示');
console.log('  cameraScare.showRealCamera(5000)       // カメラ + ランダムメッセージ');
console.log('  cameraScare.showRealCamera(5000, "見てる") // カメラ + 指定メッセージ');
console.log('  cameraScare.showCameraWithMessages()   // カメラ + 複数メッセージ');
console.log('  cameraScare.cameraCreepIn()            // じわじわカメラ');
console.log('  cameraScare.eveFoundYou()              // EVE「見つけた」');
console.log('  cameraScare.captureSequence()          // 撮影演出');
console.log('  cameraScare.surveillanceSequence()     // 監視演出');