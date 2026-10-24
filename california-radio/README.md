# California Morning Weather Radio ☀️ 📻

Two gentle morning broadcasts, made in the cloud **daily at 8:00 AM Los Angeles time**:

- **Good Morning, Los Angeles**
- **Good Morning, San Francisco**

No paid AI API or ElevenLabs credits. Weather is fetched fresh from **Open-Meteo**. Voices come from the open-source **Kokoro-82M** model, using American female voice `af_heart`; an original quiet synth/piano underscore is created in Python. Final MP3s are published to a mobile-friendly site through the existing repository’s Vercel deployment.

## Hosted URL

If the existing Vercel deployment for `aeubs66/code` remains connected, use **`https://code-dusky-kappa.vercel.app/california-radio/index.html`**. Static files are served from the Next.js `public/california-radio/` folder. Confirm this URL after Vercel deploys; it is not proof of an active website until tested.

## Automatic generation

The workflow `.github/workflows/california-morning-radio.yml` uses:

```yaml
schedule:
  - cron: '0 8 * * *'
    timezone: 'America/Los_Angeles'
```

That adjusts automatically for daylight saving time. GitHub scheduled jobs are **not guaranteed to start at the exact minute**, and model loading/generation/deployment takes additional time, so the new daily recordings may appear a little after 8:00 AM. Use the **Actions → California Morning Weather Radio → Run workflow** button for an immediate manual run. Workflows that receive no repository activity for 60 days can be automatically disabled by GitHub; re-enable them in Actions if needed.

## Running the generator manually

Install Python 3.11+, `ffmpeg`, `espeak-ng`, and `pip install -r requirements.txt`, then:

```bash
python -m radio.broadcast --site site
```

Output: `site/audio/los-angeles-YYYY-MM-DD.mp3`, `site/audio/san-francisco-YYYY-MM-DD.mp3`, and `site/data.json`. In GitHub Actions the site output is generated inside the existing Next.js `public/california-radio/` directory, and the resulting audio/metadata are committed automatically. The browser page is static and can be served by Vercel or any static web host after generation.

Use `python -m radio.broadcast --dry-run` to verify live weather without spending compute resources on the voice model.

## Safeguards

- Fails rather than invent weather when the provider is down or current observations are stale.
- Reports always correspond to the current California local date.
- Uses current temperature, actual forecast high/low, sky condition, rain, wind, and tomorrow's forecast.
- Each recording is made fresh; two separate MP3 players. Music bed fades in and out.
- No secrets or keys are stored. The noncommercial Open-Meteo API is free within usage limits.
- Generated website and audio are public. No personal details are included.

## Licenses and attribution

Weather: [Open-Meteo](https://open-meteo.com/) (CC BY 4.0). Speech: [Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M) (Apache 2.0). All sound-bed synthesis is original source code within this project. The generated audio is intended for personal noncommercial listening. GitHub Actions and Vercel hosting usage are subject to their published limits.