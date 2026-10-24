const pacific = 'America/Los_Angeles';
function pacificDate() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: pacific, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}
function prettyDate(s) {
  const [y,m,d] = s.split('-').map(Number);
  return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(y,m-1,d)));
}
function updateClock() {
  const clock = new Intl.DateTimeFormat('en-US', { timeZone: pacific, weekday: 'long', hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date());
  document.getElementById('clock').textContent = `${clock} · California`;
}
function element(tag, cls, content) {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  if (content !== undefined) el.textContent = content;
  return el;
}
function card(r) {
  const a = element('article', `weather-card ${r.slug === 'san-francisco' ? 'sf' : 'la'}`);
  a.append(element('div', 'card-overline', r.slug === 'los-angeles' ? '✦ THE SOUTHERN CALIFORNIA EDITION' : '✦ THE NORTHERN CALIFORNIA EDITION'));
  const head = element('div', 'card-head');
  head.append(element('div', 'city', r.city));
  const temp = element('div', 'temperature', `${r.current_temp}°`);
  head.append(temp); a.append(head);
  a.append(element('div', 'sky', r.current_desc));
  const forecast = element('div', 'forecast');
  const high = element('span'); high.append('HIGH  ', element('strong', '', `${r.today_high}°F`));
  const low = element('span'); low.append('LOW  ', element('strong', '', `${r.today_low}°F`));
  const tomorrow = element('span'); tomorrow.append('TOMORROW  ', element('strong', '', `${r.tomorrow_high}°F`));
  forecast.append(high, low, tomorrow); a.append(forecast);
  a.append(element('div', 'separator'));
  const label = element('div', 'play-caption');
  label.append(element('span', '', '☼ TODAY’S RADIO BROADCAST'),element('span', '', `${Math.round(r.duration)} SEC`));
  a.append(label);
  const player = element('audio');
  player.setAttribute('controls',''); player.setAttribute('preload','none');
  player.setAttribute('aria-label',`Play Good Morning, ${r.city}`);
  const source = element('source'); source.src = r.audio; source.type = 'audio/mpeg';
  player.append(source, 'Your browser does not support audio playback.');
  a.append(player);
  return a;
}
async function load() {
  const container = document.getElementById('broadcasts');
  const status = document.getElementById('status-message');
  try {
    const response = await fetch(`data.json?refresh=${Date.now()}`,{cache:'no-store'});
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data.reports) || data.reports.length !== 2 || !data.date) throw new Error('Incomplete broadcast metadata');
    container.replaceChildren(...data.reports.map(card));
    document.getElementById('edition').textContent = `${prettyDate(data.date)} · Pacific time`;
    if (data.date !== pacificDate()) {
      status.textContent = 'The newest edition is on its way. The players currently contain the previous available broadcast.';
    } else {
      status.textContent = `Freshly generated for ${prettyDate(data.date)} · Original music, free voice synthesis, real local forecasts.`;
    }
  } catch (error) {
    container.replaceChildren(element('article','placeholder','The broadcasts have not been published yet. Please check back after the next generation run.'));
    status.textContent = 'Weather and audio generation run in the cloud. If you manage this site, check GitHub Actions for the latest status.';
  }
}
updateClock();setInterval(updateClock,60_000);load();
