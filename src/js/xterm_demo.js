(function(){
  const { Terminal } = window;
  const { FitAddon } = window;
  if (!Terminal) {
    document.getElementById('terminal').innerText = 'xterm not loaded. Check network or CDN.';
    return;
  }

  const term = new Terminal({
    cursorBlink: true,
    fontFamily: 'Courier New, monospace',
    fontSize: 14,
    theme: { background: '#000', foreground: '#ffffffff', cursor: '#ffffffff' }
  });

  const fitAddon = new FitAddon.FitAddon ? new FitAddon.FitAddon() : new FitAddon();
  term.loadAddon(fitAddon);
  term.open(document.getElementById('terminal'));
  fitAddon.fit();

  term.writeln('\x1B[1;36mXTERM Demo Initialized\x1B[0m');
  term.writeln('Type something and press Enter. Type "clear" to clear.');
  term.write('\r\nC:\\Users> ');

  let buffer = '';

  term.onData(data => {
    for (let i = 0; i < data.length; i++) {
      const ch = data[i];
      const code = ch.charCodeAt(0);
      if (code === 13) { // Enter
        term.write('\r\n');
        const cmd = buffer.trim();
        if (cmd === 'clear') {
          term.clear();
        } else if (cmd) {
          term.writeln('You typed: ' + cmd);
        }
        buffer = '';
        term.write('> ');
      } else if (code === 127 || code === 8) { // Backspace
        if (buffer.length > 0) {
          buffer = buffer.slice(0, -1);
          term.write('\b \b');
        }
      } else if (code >= 32) {
        buffer += ch;
        term.write(ch);
      }
    }
  });

  // Resize handling
  window.addEventListener('resize', () => fitAddon.fit());
})();