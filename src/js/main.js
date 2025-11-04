const mini = document.getElementById('miniWindow');
let offsetX, offsetY, isDragging = false;

mini.addEventListener('mousedown', (e) => {
    isDragging = true;
    offsetX = e.offsetX;
    offsetY = e.offsetY;
});

document.addEventListener('mouseup', () => isDragging = false);

document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    mini.style.left = `${e.pageX - offsetX}px`;
    mini.style.top = `${e.pageY - offsetY}px`;
});