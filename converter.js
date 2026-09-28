// The embed is parsed in an inert document. None of its scripts are executed.
export function convertEmbed(input) {
  let raw = input.trim();
  if (!raw) throw new Error('Спочатку вставте код відео.');
  if (/^&lt;/i.test(raw)) {
    const decoder = document.createElement('textarea');
    decoder.innerHTML = raw;
    raw = decoder.value;
  }
  const doc = new DOMParser().parseFromString(raw, 'text/html');
  const schema = doc.querySelector('script[type="application/ld+json"]');
  const command = [...doc.querySelectorAll('script')].map(s =>
    s.textContent.match(/(?:window\.){1,2}ymVideoEmbedCmd\.push\(\s*(\{[\s\S]*\})\s*\)\s*;?\s*$/)
  ).find(Boolean);
  if (!schema || !command) throw new Error('Потрібен повний код Membrana: відео, опис і налаштування плеєра. Скопіюйте весь embed-код.');
  let metadata, settings;
  try {
    metadata = JSON.parse(schema.textContent);
    settings = JSON.parse(command[1]);
  } catch {
    throw new Error('У коді пошкоджені дані відео. Скопіюйте оригінальний код ще раз.');
  }
  const object = value => value && typeof value === 'object' && !Array.isArray(value);
  if (!object(metadata) || !object(settings) || typeof settings.containerId !== 'string' ||
      !settings.containerId || !object(settings.videoParams) || !object(settings.adParams)) {
    throw new Error('Бракує ідентифікатора або налаштувань відео. Вставте повний embed-код.');
  }
  const video = doc.getElementById(settings.containerId)?.querySelector('video');
  const poster = video?.getAttribute('poster');
  const source = video?.querySelector('source[type="video/mp4"]')?.getAttribute('src');
  if (!poster || !source) throw new Error('Не знайдено обкладинку або MP4 для цього відео. Перевірте повноту коду.');
  const attr = value => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  const json = value => JSON.stringify(value).replaceAll('<', '\\u003c').replaceAll('>', '\\u003e').replaceAll('&', '\\u0026');
  const loader = [...doc.querySelectorAll('script[src]')].find(s => /\/video_embed\.js(?:[?#]|$)/.test(s.getAttribute('src')))?.getAttribute('src');
  if (!loader) throw new Error('Не знайдено скрипт video_embed.js. Вставте повний код плеєра.');
  // Canonical tag/attribute order and no semicolon/space before </script>:
  // these details are required by the existing HostedVideo parser.
  const canonical = `<div id="${attr(settings.containerId)}" style="aspect-ratio: 16 / 9; width: 100%;"><video controls poster="${attr(poster)}" style="height: 100%"><source src="${attr(source)}" type="video/mp4"></video></div>` +
    `<script type="application/ld+json">${json(metadata)}</script>` +
    `<script async src="${attr(loader)}"></script>` +
    `<script defer>window.window.ymVideoEmbedCmd=window.window.ymVideoEmbedCmd||[];window.window.ymVideoEmbedCmd.push(${json(settings)})</script>`;
  return {
    canonical,
    encoded: canonical.replaceAll('<', '&lt;').replaceAll('>', '&gt;'),
    title: String(settings.videoParams.title || metadata.name || 'Відео'),
    id: settings.containerId
  };
}
