import { convertEmbed } from './converter.js';

const input = document.querySelector('#input');
const output = document.querySelector('#output');
const status = document.querySelector('#status');
const copyStatus = document.querySelector('#copy-status');
const copy = document.querySelector('#copy');

function resetOutput() {
  output.value = '';
  copy.disabled = true;
  status.textContent = '';
  status.className = 'status';
  copyStatus.textContent = '';
}
input.addEventListener('input', resetOutput);
document.querySelector('#convert').addEventListener('click', () => {
  resetOutput();
  try {
    const result = convertEmbed(input.value);
    output.value = result.encoded;
    copy.disabled = false;
    status.className = 'status success';
    status.textContent = `Готово · ${result.title} · ${result.id}`;
  } catch (error) {
    status.className = 'status error';
    status.textContent = error.message;
  }
});
document.querySelector('#clear').addEventListener('click', () => {
  input.value = '';
  resetOutput();
  input.focus();
});
copy.addEventListener('click', async () => {
  // Include a text/html clipboard representation that survives TinyMCE's
  // text → HTML → text preprocessing, as well as the plain-text fallback.
  const text = output.value;
  const html = `<pre>${text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')}</pre>`;
  try {
    if (navigator.clipboard?.write && typeof ClipboardItem !== 'undefined') {
      await navigator.clipboard.write([new ClipboardItem({
        'text/plain': new Blob([text], { type: 'text/plain' }),
        'text/html': new Blob([html], { type: 'text/html' })
      })]);
    } else {
      await navigator.clipboard.writeText(text);
    }
    copyStatus.textContent = 'Скопійовано. Вставте у HostedVideo через Ctrl + V.';
  } catch {
    output.focus();
    output.select();
    copyStatus.textContent = 'Код виділено. Натисніть Ctrl + C або ⌘ + C, щоб скопіювати.';
  }
});
