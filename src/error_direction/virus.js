// export class VirusPopupSimulator {
//     constructor(options = {}) {
//         this.options = {
//             count: 40,
//             interval: 200,
//             maxOnScreen: 60,
//             enableGlitch: true,
//             autoCloseTime: 7000,
//             messages: [
//                 'ウイルス検出！',
//                 'システムが危険です',
//                 'データを更新してください',
//                 '緊急対応が必要です',
//                 'クリックして続行',
//                 'アップデート推奨'
//             ],
//             acceleration: 0.95,
//             minInterval: 10,
//             sound: false, // ← ポップアップ音を鳴らすか
//             soundSrc: './alert.wav', // ← 音ファイルパス
//             ...options
//         };
//         this.popups = [];
//     }

//     createPopup(message) {
//         if (this.popups.length >= this.options.maxOnScreen) return;

//         // 音再生
//         if (this.options.sound) {
//             const audio = new Audio(this.options.soundSrc);
//             audio.play().catch(e => console.log('Audio error:', e));
//         }

//         const popup = document.createElement('div');
//         popup.className = 'virus-popup popup-enter';

//         const w = Math.min(300, Math.max(240, window.innerWidth * 0.18));
//         const h = 140;
//         let x = Math.random() * (window.innerWidth - w);
//         let y = Math.random() * (window.innerHeight - h);

//         if (window.innerWidth < 480) {
//             popup.style.left = '50%';
//             popup.style.top = '40%';
//             popup.style.transform = 'translate(-50%, -50%)';
//         } else {
//             popup.style.left = `${x}px`;
//             popup.style.top = `${y}px`;
//         }
//         popup.style.minWidth = `${w}px`;

//         popup.innerHTML = `
//             <div class="virus-popup-handle">⚠️</div>
//             <div class="virus-popup-title">警告</div>
//             <div class="virus-popup-content">${message}</div>
//             <div class="virus-popup-buttons">
//                 <button class="btn-ok">OK</button>
//                 <button class="btn-close">✕</button>
//             </div>
//         `;

//         const btnOk = popup.querySelector('.btn-ok');
//         const btnClose = popup.querySelector('.btn-close');

//         btnOk.addEventListener('click', () => {
//             popup.classList.add('shake');
//             popup.classList.add('popup-exit');
//             setTimeout(() => popup.remove(), 300);
//             this.popups = this.popups.filter(p => p !== popup);
//         });

//         btnClose.addEventListener('click', () => {
//             popup.classList.add('popup-exit');
//             setTimeout(() => popup.remove(), 250);
//             this.popups = this.popups.filter(p => p !== popup);
//         });

//         this.makeDraggable(popup);
//         document.body.appendChild(popup);
//         this.popups.push(popup);

//         setTimeout(() => {
//             if (popup.parentElement) {
//                 popup.classList.add('popup-exit');
//                 setTimeout(() => {
//                     popup.remove();
//                     this.popups = this.popups.filter(p => p !== popup);
//                 }, 250);
//             }
//         }, this.options.autoCloseTime);
//     }

//     makeDraggable(popup) {
//         const handle = popup.querySelector('.virus-popup-handle');
//         let offsetX = 0, offsetY = 0;
//         handle.style.cursor = "grab";

//         handle.addEventListener('mousedown', (e) => {
//             e.preventDefault();
//             offsetX = e.clientX - popup.offsetLeft;
//             offsetY = e.clientY - popup.offsetTop;
//             handle.style.cursor = "grabbing";

//             const onMouseMove = (moveEvent) => {
//                 let x = moveEvent.clientX - offsetX;
//                 let y = moveEvent.clientY - offsetY;
//                 x = Math.max(0, Math.min(window.innerWidth - popup.offsetWidth, x));
//                 y = Math.max(0, Math.min(window.innerHeight - popup.offsetHeight, y));
//                 popup.style.left = `${x}px`;
//                 popup.style.top = `${y}px`;
//             };

//             const onMouseUp = () => {
//                 handle.style.cursor = "grab";
//                 document.removeEventListener('mousemove', onMouseMove);
//                 document.removeEventListener('mouseup', onMouseUp);
//             };

//             document.addEventListener('mousemove', onMouseMove);
//             document.addEventListener('mouseup', onMouseUp);
//         });
//     }

//     startGlitch() {
//         if (!this.options.enableGlitch) return;
//         if (document.getElementById('virus-glitch')) return;

//         const glitch = document.createElement('div');
//         glitch.className = 'virus-screen-glitch';
//         glitch.id = 'virus-glitch';
//         document.body.appendChild(glitch);
//     }

//     stopGlitch() {
//         const glitch = document.getElementById('virus-glitch');
//         if (glitch) glitch.remove();
//     }

//     async start() {
//         this.startGlitch();
//         let interval = this.options.interval;

//         for (let i = 0; i < this.options.count; i++) {
//             const msg = this.options.messages[
//                 Math.floor(Math.random() * this.options.messages.length)
//             ];
//             this.createPopup(msg);

//             await new Promise(resolve => setTimeout(resolve, interval));
//             interval = Math.max(this.options.minInterval, interval * this.options.acceleration);
//         }
//     }

//     clear() {
//         this.popups.forEach(p => {
//             p.classList.add('popup-exit');
//             setTimeout(() => p.remove(), 150);
//         });
//         this.popups = [];
//         this.stopGlitch();
//     }
// }
