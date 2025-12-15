document.addEventListener('DOMContentLoaded', () => {
    // EVE起動時にfile3の画像差し替えフラグをクリア（毎回リセット）
    localStorage.removeItem('file3_image_replaced');
    
    // 背景の色変化アニメーション
    const style = document.createElement('style');
    style.textContent = `
      @keyframes floatingShapes {
        0% { transform: translateY(0) rotate(0deg); opacity: 1; }
        25% { transform: translateY(-10px) rotate(90deg); opacity: 0.9; }
        50% { transform: translateY(-20px) rotate(180deg); opacity: 0.7; }
        75% { transform: translateY(-10px) rotate(270deg); opacity: 0.9; }
        100% { transform: translateY(0) rotate(360deg); opacity: 1; }
      }

      body {
        background: #1e3c72; /* 固定の背景色 */
        overflow: hidden;
      }

      .floating-shape {
        position: absolute;
        width: 50px;
        height: 50px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 50%;
        animation: floatingShapes 3s infinite ease-in-out;
      }

      @keyframes pulse {
        0%, 100% { transform: translate(-50%, -50%) scale(1); }
        50% { transform: translate(-50%, -50%) scale(1.2); }
      }

      .rotating-circle {
        animation: spin 2s linear infinite, pulse 3s infinite, colorChange 4s infinite;
      }

      @keyframes colorChange {
        0% { border-top-color: #61dafb; }
        25% { border-top-color: #6161ff; }
        50% { border-top-color: #e0ffff; }
        75% { border-top-color: #6161ff; }
        100% { border-top-color: #61dafb; }
      }

      .glow-ring {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 200px;
        height: 200px;
        border: 4px solid rgba(255, 255, 255, 0.5);
        border-radius: 50%;
        transform: translate(-50%, -50%);
        animation: glowPulse 3s infinite;
      }

      @keyframes glowPulse {
        0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.7; }
        50% { transform: translate(-50%, -50%) scale(1.3); opacity: 1; }
      }
    `;
    document.head.appendChild(style);

    // h1要素の文字ごとのフェードインアニメーション
    const heading = document.querySelector('h1.fade-in');
    if (heading) {
      const text = heading.textContent;
      heading.textContent = '';

      text.split('').forEach((char, index) => {
        const span = document.createElement('span');
        span.textContent = char;
        span.style.opacity = '0';
        span.style.display = 'inline-block';
        span.style.transition = `opacity 0.5s ${index * 0.1}s, transform 0.5s ${index * 0.1}s`;
        span.style.transform = 'translateY(20px)';
        heading.appendChild(span);

        requestAnimationFrame(() => {
          span.style.opacity = '1';
          span.style.transform = 'translateY(0)';
        });
      });
    }

    // 光のリングを追加
    const glowRing = document.createElement('div');
    glowRing.classList.add('glow-ring');
    document.body.appendChild(glowRing);

    // 浮遊する形を追加
    for (let i = 0; i < 20; i++) { // Increased the number of shapes
      const shape = document.createElement('div');
      shape.classList.add('floating-shape');
      shape.style.left = `${Math.random() * 100}vw`;
      shape.style.top = `${Math.random() * 100}vh`; // Allow spawning anywhere on the screen
      shape.style.animationDuration = `${Math.random() * 3 + 3}s`; // Faster and more dynamic movement
      document.body.appendChild(shape);
    }
  });
