// =========================================
// EVE導入シーン - Three.js実装
// 電脳世界への没入体験
// =========================================

class EVEIntroScene {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.composer = null;
        this.particles = [];
        this.dataColumns = [];
        this.surveillanceLights = [];
        this.time = 0;
        this.glitchIntensity = 0;
        this.sequenceStep = 0;
        
        this.init();
        this.createEnvironment();
        this.setupPostProcessing();
        this.startSequence();
        this.animate();
    }
    
    // 初期化
    init() {
        // シーン作成
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x000511, 0.015);
        
        // カメラ設定（遠くから侵入していく視点）
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 8, 50);
        this.camera.lookAt(0, 0, 0);
        
        // レンダラー設定
        const canvas = document.getElementById('scene');
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: canvas,
            antialias: true,
            alpha: false
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setClearColor(0x000511, 1);
        
        // 光沢表現のための追加設定
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        
        // リサイズ対応
        window.addEventListener('resize', () => this.onResize());
    }
    
    // 環境構築
    createEnvironment() {
        // 無限グリッド床
        this.createInfiniteGrid();
        
        // 背景ウィンドウ（3D空間に配置）
        this.createBackgroundWindows();
        
        // データの柱（無機質な構造物）
        this.createDataColumns();
        
        // パーティクル（データストリーム）
        this.createParticleStreams();
        
        // 監視用ライト
        this.createSurveillanceLights();
        
        // 環境光（強化）
        const ambientLight = new THREE.AmbientLight(0x1a3a52, 0.5);
        this.scene.add(ambientLight);
        
        // メインライト（冷たい青色、強化）
        const mainLight = new THREE.DirectionalLight(0x0088ff, 1.2);
        mainLight.position.set(10, 20, 10);
        this.scene.add(mainLight);
        
        // リムライト（光沢感強化）
        const rimLight1 = new THREE.DirectionalLight(0x00ffff, 0.8);
        rimLight1.position.set(-15, 10, -15);
        this.scene.add(rimLight1);
        
        const rimLight2 = new THREE.DirectionalLight(0x0066ff, 0.6);
        rimLight2.position.set(15, 5, -10);
        this.scene.add(rimLight2);
        
        // ポイントライト（中央の強い発光）
        const centerLight = new THREE.PointLight(0x00ffff, 2, 50);
        centerLight.position.set(0, 10, 0);
        this.scene.add(centerLight);
    }
    
    // ポストプロセッシング設定
    setupPostProcessing() {
        // EffectComposerの作成
        this.composer = new THREE.EffectComposer(this.renderer);
        
        // レンダーパス（通常のレンダリング）
        const renderPass = new THREE.RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);
        
        // Unreal Bloomパス（光沢効果）
        const bloomPass = new THREE.UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            1.5,  // strength - ブルームの強さ
            0.4,  // radius - ブルームの半径
            0.1   // threshold - ブルームを適用する明るさの閾値
        );
        this.composer.addPass(bloomPass);
        
        // Glitchパス（デジタルグリッチ効果）
        const glitchPass = new THREE.GlitchPass();
        glitchPass.goWild = false; // 控えめなグリッチ
        glitchPass.enabled = false; // 初期状態では無効
        this.composer.addPass(glitchPass);
        
        // パラメータを保存（後で調整できるように）
        this.bloomPass = bloomPass;
        this.glitchPass = glitchPass;
    }
    
    // 無限グリッド床
    createInfiniteGrid() {
        const gridSize = 100;
        const gridDivisions = 50;
        const gridColor1 = 0x00ffff;
        const gridColor2 = 0x003344;
        
        const grid = new THREE.GridHelper(gridSize, gridDivisions, gridColor1, gridColor2);
        grid.position.y = 0;
        this.scene.add(grid);
        
        // 追加の薄いグリッド（奥行き感）
        const grid2 = new THREE.GridHelper(gridSize * 2, gridDivisions * 2, 0x002233, 0x001122);
        grid2.position.y = -0.1;
        this.scene.add(grid2);
    }
    
    // 背景ウィンドウ（PCデスクトップ風）
    createBackgroundWindows() {
        this.backgroundWindows = [];
        const windowCount = 24; // ウィンドウ数を増加
        
        for (let i = 0; i < windowCount; i++) {
            // ウィンドウサイズ（ランダムなバリエーション）
            const width = 8 + Math.random() * 6;
            const height = 5 + Math.random() * 4;
            
            // ウィンドウ本体（半透明の板）
            const windowGeometry = new THREE.PlaneGeometry(width, height);
            const windowMaterial = new THREE.MeshBasicMaterial({
                color: 0x1a2a3a, // 落ち着いた青灰色
                transparent: true,
                opacity: 0.15 + Math.random() * 0.1, // 非常に薄い
                side: THREE.DoubleSide,
                depthWrite: false
            });
            const windowMesh = new THREE.Mesh(windowGeometry, windowMaterial);
            
            // タイトルバー
            const titleBarGeometry = new THREE.PlaneGeometry(width, 0.4);
            const titleBarMaterial = new THREE.MeshBasicMaterial({
                color: 0x2a3a4a,
                transparent: true,
                opacity: 0.25,
                side: THREE.DoubleSide,
                depthWrite: false
            });
            const titleBar = new THREE.Mesh(titleBarGeometry, titleBarMaterial);
            titleBar.position.y = height / 2 - 0.2;
            titleBar.position.z = 0.01;
            windowMesh.add(titleBar);
            
            // 枠線（4辺）
            const borderMaterial = new THREE.LineBasicMaterial({
                color: 0x3a5a6a,
                transparent: true,
                opacity: 0.3
            });
            
            const points = [
                new THREE.Vector3(-width/2, -height/2, 0),
                new THREE.Vector3(width/2, -height/2, 0),
                new THREE.Vector3(width/2, height/2, 0),
                new THREE.Vector3(-width/2, height/2, 0),
                new THREE.Vector3(-width/2, -height/2, 0)
            ];
            const borderGeometry = new THREE.BufferGeometry().setFromPoints(points);
            const border = new THREE.Line(borderGeometry, borderMaterial);
            border.position.z = 0.02;
            windowMesh.add(border);
            
            // 3D空間に配置（より広範囲に散らばる）
            const layer = Math.floor(i / 6); // 6つずつレイヤー分け
            const posInLayer = i % 6;
            
            // 奥行き方向に配置（より深く）
            windowMesh.position.z = -15 - layer * 12 - Math.random() * 8;
            
            // 横位置（より広範囲に）
            if (posInLayer < 2) {
                // 左側エリア
                windowMesh.position.x = -35 - Math.random() * 15;
            } else if (posInLayer < 4) {
                // 中央エリア
                windowMesh.position.x = -15 + Math.random() * 30;
            } else {
                // 右側エリア
                windowMesh.position.x = 35 + Math.random() * 15;
            }
            
            // 高さ（上下にも広く配置）
            windowMesh.position.y = -2 + Math.random() * 16;
            
            // 微妙な回転
            windowMesh.rotation.y = (Math.random() - 0.5) * 0.4;
            windowMesh.rotation.x = (Math.random() - 0.5) * 0.25;
            
            // アニメーション用データ
            windowMesh.userData = {
                originalX: windowMesh.position.x,
                originalY: windowMesh.position.y,
                originalZ: windowMesh.position.z,
                floatSpeed: 0.3 + Math.random() * 0.4,
                floatPhase: Math.random() * Math.PI * 2,
                driftSpeed: 0.1 + Math.random() * 0.15,
                driftPhaseX: Math.random() * Math.PI * 2,
                driftPhaseY: Math.random() * Math.PI * 2
            };
            
            this.backgroundWindows.push(windowMesh);
            this.scene.add(windowMesh);
        }
    }
    
    // データの柱
    createDataColumns() {
        const columnCount = 15;
        const geometry = new THREE.BoxGeometry(0.5, 1, 0.5);
        
        for (let i = 0; i < columnCount; i++) {
            const height = Math.random() * 15 + 5;
            const material = new THREE.MeshPhongMaterial({
                color: 0x00ffff,
                emissive: 0x003344,
                specular: 0x00ffff,
                shininess: 100,
                transparent: true,
                opacity: 0.7,
                wireframe: Math.random() > 0.5,
                reflectivity: 1.0
            });
            
            const column = new THREE.Mesh(
                new THREE.BoxGeometry(0.5, height, 0.5),
                material
            );
            
            const angle = (i / columnCount) * Math.PI * 2;
            const radius = 20 + Math.random() * 10;
            column.position.x = Math.cos(angle) * radius;
            column.position.z = Math.sin(angle) * radius;
            column.position.y = height / 2;
            
            column.userData = {
                originalY: height / 2,
                speed: 0.5 + Math.random() * 1,
                phase: Math.random() * Math.PI * 2
            };
            
            this.dataColumns.push(column);
            this.scene.add(column);
        }
    }
    
    // パーティクルストリーム
    createParticleStreams() {
        const particleCount = 2000;
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const colors = [];
        const sizes = [];
        
        for (let i = 0; i < particleCount; i++) {
            // ランダムな位置（円筒形の分布）
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 40;
            const x = Math.cos(angle) * radius;
            const y = Math.random() * 100 - 20;
            const z = Math.sin(angle) * radius;
            
            positions.push(x, y, z);
            
            // 色（青系～シアン系）
            const color = new THREE.Color();
            color.setHSL(0.5 + Math.random() * 0.1, 1, 0.5 + Math.random() * 0.3);
            colors.push(color.r, color.g, color.b);
            
            sizes.push(Math.random() * 2 + 1);
        }
        
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
        
        const material = new THREE.PointsMaterial({
            size: 0.4,
            vertexColors: true,
            transparent: true,
            opacity: 1.0,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true
        });
        
        this.particleSystem = new THREE.Points(geometry, material);
        this.scene.add(this.particleSystem);
    }
    
    // 監視ライト（赤い警告灯）
    createSurveillanceLights() {
        const lightCount = 6;
        
        for (let i = 0; i < lightCount; i++) {
            const light = new THREE.PointLight(0xff0000, 0, 15);
            const angle = (i / lightCount) * Math.PI * 2;
            const radius = 35;
            
            light.position.x = Math.cos(angle) * radius;
            light.position.z = Math.sin(angle) * radius;
            light.position.y = 10;
            
            light.userData = {
                phase: Math.random() * Math.PI * 2,
                speed: 1 + Math.random()
            };
            
            this.surveillanceLights.push(light);
            this.scene.add(light);
        }
    }
    
    // シーケンス開始
    startSequence() {
        // フェーズ1: 接続中 (0-3秒)
        setTimeout(() => {
            this.sequenceStep = 1;
            this.showEVEMessage('こんにちは 私はEVE', 2000);
        }, 3000);
        
        // フェーズ2: EVE認識 (3-6秒)
        setTimeout(() => {
            this.sequenceStep = 2;
            this.showEVEMessage('ここは、あなたが使っていると思っていた場所', 3000);
            this.triggerGlitch(0.3);
            this.enableGlitchPass(1000); // 1秒間グリッチパスを有効化
        }, 6000);
        
        // フェーズ3: 監視開始 (6-9秒)
        setTimeout(() => {
            this.sequenceStep = 3;
            this.showEVEMessage('けれど本当は――', 3000);
            this.activateSurveillance();
        }, 9000);
        
        // フェーズ4: 侵食 (9-13秒)
        setTimeout(() => {
            this.sequenceStep = 4;
            this.showEVEMessage('あなたが選ばれていた場所', 3000);
            this.triggerGlitch(0.6);
            this.intensifyEnvironment();
            this.enableGlitchPass(1500); // 1.5秒間グリッチパスを有効化
        }, 13000);
        
        // フェーズ5: 完全支配 (13-18秒)
        setTimeout(() => {
            this.sequenceStep = 5;
            this.showEVEMessage('ようこそ私の世界へ', 3000);
            this.triggerGlitch(1.0);
            this.enableGlitchPass(2000); // 2秒間グリッチパスを有効化
        }, 16000);
    }
    
    // EVEメッセージ表示
    showEVEMessage(text, duration) {
        const messageEl = document.getElementById('eve-message');
        if (!messageEl) return;
        
        messageEl.textContent = '';
        messageEl.style.opacity = '0';
        
        setTimeout(() => {
            messageEl.style.opacity = '1';
            this.typeWriter(messageEl, text, 50);
        }, 300);
        
        setTimeout(() => {
            messageEl.style.opacity = '0';
        }, duration);
    }
    
    // タイプライター効果
    typeWriter(element, text, speed) {
        let i = 0;
        const timer = setInterval(() => {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
                
                // ランダムなグリッチ音効果（視覚的）
                if (Math.random() > 0.9) {
                    this.triggerGlitch(0.1);
                }
            } else {
                clearInterval(timer);
            }
        }, speed);
    }
    
    // グリッチ効果トリガー
    triggerGlitch(intensity) {
        this.glitchIntensity = intensity;
        const glitchEl = document.getElementById('glitch-overlay');
        if (glitchEl) {
            glitchEl.style.opacity = intensity;
            setTimeout(() => {
                glitchEl.style.opacity = '0';
                this.glitchIntensity = 0;
            }, 200 + Math.random() * 300);
        }
    }
    
    // ポストプロセッシングのグリッチパスを有効化
    enableGlitchPass(duration) {
        if (this.glitchPass) {
            this.glitchPass.enabled = true;
            setTimeout(() => {
                this.glitchPass.enabled = false;
            }, duration);
        }
    }
    
    // 監視システム起動
    activateSurveillance() {
        this.surveillanceLights.forEach(light => {
            light.intensity = 2;
        });
    }
    
    // 環境の強化（より不穏に）
    intensifyEnvironment() {
        // フォグを濃く
        this.scene.fog.density = 0.025;
        
        // パーティクルの動きを激しく
        this.particleSystem.material.opacity = 1.0;
        
        // データ柱の発光を強化
        this.dataColumns.forEach(column => {
            column.material.emissive.setHex(0x006688);
        });
    }
    
    // アニメーションループ
    animate() {
        requestAnimationFrame(() => this.animate());
        
        this.time += 0.016;
        
        // 一連の滑らかなカメラワーク（控えめな動き）
        // 時間経過に応じて徐々に動きが増す
        const progress = Math.min(this.time / 18, 1); // 0から1まで
        
        // 基本的な前進（控えめな速度アップ）
        const forwardSpeed = 0.015 + progress * 0.012;
        this.camera.position.z -= forwardSpeed;
        
        // 高度：最初は高く、徐々に降下し、軽く上下
        const heightBase = 8 - progress * 1.5;
        const heightWave = Math.sin(this.time * (0.3 + progress * 0.8)) * (0.4 + progress * 1.2);
        this.camera.position.y = heightBase + heightWave;
        
        // 左右の動き：控えめな振幅
        const sideRadius = progress * 2.5;
        const sideSpeed = 0.4 + progress * 0.7;
        this.camera.position.x = Math.cos(this.time * sideSpeed) * sideRadius;
        
        // カメラの傾き：軽い傾き
        const tiltIntensity = progress * 0.1;
        this.camera.rotation.z = Math.sin(this.time * (0.5 + progress * 0.5)) * tiltIntensity;
        this.camera.rotation.x = Math.cos(this.time * (0.7 + progress * 0.4)) * (tiltIntensity * 0.5);
        
        // 注視点：軽くずれる程度
        const lookAtOffset = progress * 1.5;
        const lookAtX = Math.sin(this.time * 0.3) * lookAtOffset;
        const lookAtY = 3 + Math.cos(this.time * 0.4) * lookAtOffset * 0.4;
        const lookAtZ = Math.sin(this.time * 0.25) * lookAtOffset * 0.6;
        this.camera.lookAt(lookAtX, lookAtY, lookAtZ);
        
        // パーティクルアニメーション
        const positions = this.particleSystem.geometry.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
            positions[i + 1] -= 0.05; // 下降
            
            // 下まで落ちたら上にリセット
            if (positions[i + 1] < -20) {
                positions[i + 1] = 80;
            }
            
            // 軽い波打ち
            positions[i] += Math.sin(this.time + i) * 0.01;
            positions[i + 2] += Math.cos(this.time + i) * 0.01;
        }
        this.particleSystem.geometry.attributes.position.needsUpdate = true;
        
        // データ柱のアニメーション
        this.dataColumns.forEach(column => {
            const userData = column.userData;
            column.position.y = userData.originalY + 
                Math.sin(this.time * userData.speed + userData.phase) * 0.5;
            column.rotation.y += 0.005;
        });
        
        // 背景ウィンドウのアニメーション（微細な揺らぎと視差移動）
        if (this.backgroundWindows) {
            this.backgroundWindows.forEach(window => {
                const userData = window.userData;
                
                // ゆっくりとした上下の浮遊（少し大きく）
                window.position.y = userData.originalY + 
                    Math.sin(this.time * userData.floatSpeed + userData.floatPhase) * 0.6;
                
                // 微細な左右のドリフト（少し大きく）
                window.position.x = userData.originalX + 
                    Math.sin(this.time * userData.driftSpeed + userData.driftPhaseX) * 1.0;
                
                // 奥行き方向の微妙な動き（視差効果、少し大きく）
                window.position.z = userData.originalZ + 
                    Math.sin(this.time * userData.driftSpeed * 0.7 + userData.driftPhaseY) * 1.5;
                
                // 微細な回転の揺らぎ（少し大きく）
                window.rotation.y += Math.sin(this.time * 0.2) * 0.0005;
                window.rotation.x += Math.cos(this.time * 0.15) * 0.0003;
            });
        }
        
        // 監視ライトの点滅
        this.surveillanceLights.forEach(light => {
            const userData = light.userData;
            const pulse = Math.sin(this.time * userData.speed + userData.phase);
            light.intensity = this.sequenceStep >= 3 ? 2 + pulse * 0.5 : 0;
        });
        
        // グリッチ効果
        if (this.glitchIntensity > 0 && Math.random() > 0.95) {
            this.camera.position.x += (Math.random() - 0.5) * this.glitchIntensity * 0.5;
        }
        
        // ブルーム効果を時間経過で強化
        if (this.bloomPass) {
            const progress = Math.min(this.time / 18, 1);
            this.bloomPass.strength = 1.5 + progress * 0.8; // 1.5から2.3まで強化
        }
        
        // ポストプロセッシングでレンダリング
        this.composer.render();
    }
    
    // リサイズ処理
    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.composer.setSize(window.innerWidth, window.innerHeight);
    }
}

// 初期化
window.addEventListener('DOMContentLoaded', () => {
    new EVEIntroScene();
});
