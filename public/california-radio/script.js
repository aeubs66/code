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

const LOCATIONS=[
  {city:'Los Angeles',slug:'los-angeles',lat:34.0522,lon:-118.2437},
  {city:'San Francisco',slug:'san-francisco',lat:37.7749,lon:-122.4194}
];
const SKY={0:'clear skies',1:'mostly clear skies',2:'partly cloudy skies',3:'overcast skies',45:'fog',48:'patchy fog',51:'light drizzle',53:'drizzle',55:'steady drizzle',61:'light rain',63:'rain',65:'heavy rain',80:'a few showers',81:'rain showers',82:'heavy showers',95:'thunderstorms'};
let playing=null;
function rounded(x){if(x===null||x===undefined||!Number.isFinite(Number(x)))throw Error('Missing verified weather value');return Math.round(Number(x));}
async function liveWeather(c) {
  const params=new URLSearchParams({latitude:String(c.lat),longitude:String(c.lon),timezone:'America/Los_Angeles',temperature_unit:'fahrenheit',wind_speed_unit:'mph',forecast_days:'3',current:'temperature_2m,weather_code,wind_speed_10m',daily:'temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max'});
  const response=await fetch('https://api.open-meteo.com/v1/forecast?'+params,{cache:'no-store'});
  if(!response.ok)throw Error('Weather provider HTTP '+response.status);
  const w=await response.json();if(w.error)throw Error(w.reason||'Weather provider error');
  const today=pacificDate(),next=new Date(today+'T12:00:00Z');next.setUTCDate(next.getUTCDate()+1);
  const i=w.daily.time.indexOf(today),j=w.daily.time.indexOf(next.toISOString().slice(0,10));
  if(i===-1||j===-1)throw Error('Weather provider has no forecast for today and tomorrow');
  const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/Los_Angeles',timeZoneName:'shortOffset'}).formatToParts(new Date());
  const offset=Number((parts.find(x=>x.type==='timeZoneName')?.value||'GMT-7').match(/GMT([+-]\d+)/)?.[1]||'-7');
  const observation=new Date(w.current.time+'Z').getTime()-offset*3600*1000;
  if(Math.abs(Date.now()-observation)>5*3600*1000)throw Error('Observation is not fresh');
  const label=code=>SKY[code]||'variable skies';
  return {...c,date:today,current_temp:rounded(w.current.temperature_2m),current_desc:label(w.current.weather_code),today_high:rounded(w.daily.temperature_2m_max[i]),today_low:rounded(w.daily.temperature_2m_min[i]),today_desc:label(w.daily.weather_code[i]),tomorrow_high:rounded(w.daily.temperature_2m_max[j]),tomorrow_low:rounded(w.daily.temperature_2m_min[j]),tomorrow_desc:label(w.daily.weather_code[j]),wind:w.current.wind_speed_10m,rain:w.daily.precipitation_probability_max?.[i]??null};
}
function announcement(r){
  const weekday=new Intl.DateTimeFormat('en-US',{timeZone:'UTC',weekday:'long'}).format(new Date(r.date+'T12:00:00Z'));
  const wind=Number(r.wind)>=12?'Winds are around '+rounded(r.wind)+' miles per hour. ':'';
  const rain=r.rain!==null&&Number(r.rain)>=15?'There is about a '+rounded(r.rain)+' percent chance of precipitation. ':'';
  const closing=r.slug==='los-angeles'?'Wherever this morning finds you, let the city wake up slowly, and enjoy a little sunshine.':'From the waterfront to the quiet hills, may your day start peacefully.';
  return 'Good morning, '+r.city+'. It is '+weekday+', '+prettyDate(r.date)+', and welcome to a little moment of California calm. At the latest weather check, it is '+r.current_temp+' degrees with '+r.current_desc+'. Today brings '+r.today_desc+', with a high near '+r.today_high+' degrees, and a low around '+r.today_low+' tonight. '+wind+rain+'Looking ahead to tomorrow, expect '+r.tomorrow_desc+', a high around '+r.tomorrow_high+', and a nighttime low near '+r.tomorrow_low+'. '+closing+' This is Good Morning, '+r.city+'.';
}
function voiceChoice(){
  const voices=speechSynthesis.getVoices().filter(v=>/^en[-_]/i.test(v.lang));
  for(const candidate of ['Aria','Jenny','Samantha','Ava','Zira','Google US English','Female']){
    const found=voices.find(v=>v.name.toLowerCase().includes(candidate.toLowerCase()));
    if(found)return found;
  }
  return voices.find(v=>/en[-_]US/i.test(v.lang))||voices[0]||null;
}
function startMusic(){
  const A=window.AudioContext||window.webkitAudioContext;if(!A)return null;
  const ctx=new A(),out=ctx.createGain();out.gain.setValueAtTime(.0001,ctx.currentTime);out.gain.exponentialRampToValueAtTime(.015,ctx.currentTime+2);out.connect(ctx.destination);
  const notes=[220,261.63,329.63,392],oscillators=[];
  notes.forEach(f=>{const o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';o.frequency.value=f;g.gain.value=.16;o.connect(g);g.connect(out);o.start();oscillators.push(o);});
  const timer=setInterval(()=>{if(ctx.state==='closed')return;const t=ctx.currentTime,o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';o.frequency.value=notes[Math.floor(t/5)%4]*2;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.06,t+.04);g.gain.exponentialRampToValueAtTime(.0001,t+3);o.connect(g);g.connect(out);o.start(t);o.stop(t+3.05);},4900);
  return ()=>{clearInterval(timer);if(ctx.state==='closed')return;out.gain.setTargetAtTime(.00001,ctx.currentTime,.5);setTimeout(()=>{oscillators.forEach(o=>{try{o.stop()}catch{}});ctx.close().catch(()=>{});},2800);};
}
function stop(){
  if(!playing)return;
  const item=playing;playing=null;
  speechSynthesis.cancel();item.stopMusic?.();
  item.button.textContent='▶ Listen live · free';item.button.setAttribute('aria-pressed','false');
}
function speak(r,button){
  if(playing){const same=playing.button===button;stop();if(same)return;}
  if(!('speechSynthesis' in window)){document.getElementById('status-message').textContent='Your browser does not support speech playback. Try Safari, Chrome or Edge.';return;}
  const u=new SpeechSynthesisUtterance(announcement(r));const voice=voiceChoice();if(voice)u.voice=voice;
  u.lang='en-US';u.rate=.87;u.pitch=1.03;u.volume=1;
  const stopMusic=startMusic();playing={button,stopMusic};button.textContent='■ Stop broadcast';button.setAttribute('aria-pressed','true');
  u.onend=()=>{if(playing?.button===button)stop()};
  u.onerror=e=>{if(playing?.button===button)stop();document.getElementById('status-message').textContent='Speech playback interrupted: '+(e.error||'browser error')};
  speechSynthesis.cancel();speechSynthesis.speak(u);
}
function card(r){
  const a=element('article','weather-card '+(r.slug==='san-francisco'?'sf':'la'));
  a.append(element('div','card-overline',r.slug==='los-angeles'?'✦ THE SOUTHERN CALIFORNIA EDITION':'✦ THE NORTHERN CALIFORNIA EDITION'));
  const head=element('div','card-head');head.append(element('div','city',r.city),element('div','temperature',r.current_temp+'°'));a.append(head);
  a.append(element('div','sky',r.current_desc));
  const fc=element('div','forecast');for(const [name,temp] of [['HIGH',r.today_high],['LOW',r.today_low],['TOMORROW',r.tomorrow_high]]){
    const sp=element('span');sp.append(name+' ',element('strong','',temp+'°F'));fc.append(sp);
  }
  a.append(fc,element('div','separator'));
  const label=element('div','play-caption');label.append(element('span','',r.audio?'☼ RECORDED EDITION':'☼ LIVE EDITION'),element('span','',r.audio?Math.round(r.duration||45)+' SEC':'FREE · ON DEMAND'));a.append(label);
  if(r.audio){const audio=element('audio');audio.controls=true;audio.preload='none';audio.setAttribute('aria-label','Play recorded broadcast for '+r.city);const src=element('source');src.src=r.audio;src.type='audio/mpeg';audio.append(src);a.append(audio);}
  const button=element('button','live-play','▶ Listen live · free');button.type='button';button.setAttribute('aria-label','Play free live radio for '+r.city);button.setAttribute('aria-pressed','false');button.onclick=()=>speak(r,button);a.append(button);
  a.append(element('p','voice-note','Real live weather. Your browser’s American English voice with gentle ambient synth and piano. No subscription or credits.'));
  return a;
}
async function load(){
  const box=document.getElementById('broadcasts'),status=document.getElementById('status-message');
  try{
    const current=await Promise.all(LOCATIONS.map(liveWeather));
    try{
      const response=await fetch('data.json?refresh='+Date.now(),{cache:'no-store'});
      if(response.ok){const data=await response.json();if(data.date===pacificDate()&&Array.isArray(data.reports))current.forEach(r=>{const x=data.reports.find(y=>y.slug===r.slug);if(x?.audio){r.audio=x.audio;r.duration=x.duration}});}
    }catch{}
    box.replaceChildren(...current.map(card));document.getElementById('edition').textContent=prettyDate(pacificDate())+' · Pacific time';
    status.textContent=current.every(r=>r.audio)?'Recorded MP3 editions are ready. Or listen live for the newest conditions.':'Two free live broadcasts are ready. Press Listen live. Automatic MP3 publishing is not yet active.';
  }catch(e){box.replaceChildren(element('article','placeholder','The live weather service is unavailable. No forecast will be invented.'));status.textContent='Unable to verify weather: '+e.message;}
}
const css=document.createElement('style');css.textContent='.live-play{width:100%;border:1px solid #e5bc8b;border-radius:8px;padding:15px;margin-top:13px;background:#e6c49a;color:#1c3030;font-size:12px;letter-spacing:.13em;font-weight:700;cursor:pointer}.live-play[aria-pressed=true]{background:#213a3c;color:#f2ede1}.voice-note{font-size:11px;color:#bdc6bc;line-height:1.6;margin:10px 0 0}';document.head.append(css);
updateClock();setInterval(updateClock,60000);load();
