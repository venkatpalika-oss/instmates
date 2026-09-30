# Homepage illustrations (owner-supplied, 2026-09-15)

Two AI-generated decorative illustrations supplied by the owner for the homepage
concept. They are **illustrations, not validated technical diagrams or actual
installations**: nothing on the site may present them as a specific instrument,
a documented case or a real site. No flow, wiring, signal or reading animation
is allowed on them.

| Served files | Source file (owner's copy, not committed) | Source SHA-256 | Source size |
|---|---|---|---|
| `hero-transmitter-analyzer-{640,960,1280,1536}.webp` | `ChatGPT Image Sep 15, 2026, 07_28_29 AM.png` (1536 x 1024 RGB) | b21364bfea6e9292a973be3839ad7502b514d1cdc7e36f224ba7e337da4a783d | 1,907,230 B |
| `sample-conditioning-panel-{480,768,1024}.webp` | `ChatGPT Image Sep 15, 2026, 07_28_41 AM.png` (1536 x 1024 RGB) | a4760e19886b8bac596c3ab0e9ac1b2051b8ff5859754cb051a4fc623c7b1f8d | 1,861,273 B |

Conversion: ffmpeg 9.0.1 (`scale=<w>:-1:flags=lanczos`, `libwebp`, quality 82).
The 1536 px hero variant is the full-resolution source; every variant keeps the
3:2 aspect ratio, so `width="1536" height="1024"` is correct for all of them.

Usage: hero (Image 1) is the LCP candidate on `/` and is never lazy-loaded; the
sample panel (Image 2) illustrates the sampling-systems learning link and is
lazy-loaded. Both use `object-fit: contain` so the equipment silhouettes stay
complete at every breakpoint.

Video thumbnails in `../videos/` are the `maxresdefault.jpg` frames of the three
verified InstMates YouTube uploads (see `public/index.html`, section "Watch &
learn"); they belong to those videos and are served locally, never hotlinked.


## Homepage V2 H1 reuse (2026-09-30)

The approved transmitter/analyzer WebPs remain unchanged. V2 deliberately uses
an inset pale equipment panel inside the navy hero, labelled “Field instruments ·
Decorative illustration”; this is not a refinery photograph or validated diagram.
At ≤768px the decorative panel is hidden to preserve headline/action priority.
The image uses responsive sizing, reserved dimensions and high fetch priority.
CSS hiding does not guarantee that every browser avoids downloading the image;
the smallest existing variant remains only 17,400 bytes. Largest is 69,422 bytes.

Final owner-approved cinematic/refinery artwork remains replaceable. No image
was generated for H1, no new asset was added, and no vendor branding was added.
The sample-conditioning image remains available but is no longer rendered on
the homepage; its verified learning destination stays as a concise text link.
The local video thumbnails are unchanged and lazy-loaded. Social image metadata
now uses the approved optimized 1536px equipment illustration instead of the
legacy 1.25MB hero JPEG.

Simulator spotlight artwork is reused unchanged from `public/assets/images/simulations/`:
`process-vessel.svg`, `smart-transmitter.svg`, `icon-current-loop.svg`,
`analog-input-rack.svg`, `engineering-display.svg`. Visible sequence labels
provide the meaning; these redundant decorative images have empty alternatives.
Do not place simulated numbers or animated flow on the homepage artwork.


## Homepage V2 — approved-concept hero revision (2026-09-30)

This supersedes the H1 inset equipment panel above. The owner rejected that
hero visual and supplied `ChatGPT Image Sep 30, 2026, 10_57_21 PM.png` as the
approved direction. The supplied mockup itself is NOT deployed.

Reference SHA-256: `99074136aa081591a0a5f2a6139c58dd110e65763174679b20494657674df5a7`.
A new clean hero background was generated with the built-in image-generation
tool using that reference. Generated source: 1983 × 793 PNG, SHA-256
`d35a2e690f81704c92bee254b66b6d5b0dcf41a6762781527fb9fa425822fbb1`. The source PNG remains
outside the repository. Only optimized responsive WebPs are production assets.

The scene is an AI-generated decorative illustration, not an actual plant,
validated instrument, installation guide or product screenshot. All text,
logos, navigation, buttons, slogans, floating graphics and readings were
excluded. Instrument display is blank; only the plain back of the tablet is
visible. The site's actual approved logo and shared header remain unchanged.

### Generation prompt (built-in mode)

> Use case: ads-marketing. Create a CLEAN production website hero BACKGROUND inspired by the attached reference, NOT a website screenshot or mockup. Wide cinematic 2.5:1 landscape. Premium realistic industrial instrumentation at blue hour, restrained navy/cyan lighting, subtle warm refinery lights. LEFT 45% almost empty deep navy atmosphere for separate HTML typography, smoothly integrated with scene. RIGHT 55% recognizable generic blue pressure transmitter on stainless process pipe prominent in foreground around x65%, refinery columns behind; engineer secondary at far right seen from behind wearing plain navy workwear, safety glasses and plain white hardhat. Engineer may hold a closed tablet with only its plain back visible. Instrument display blank dark reflective glass, no digits. Preserve refined grounded industrial mood of reference. ABSOLUTELY NO text, words, letters, numbers, logos, branding, watermarks, navigation, buttons, icons, floating UI, charts, holograms, slogans, pathway labels or functional screen graphics anywhere. No vendor branding. No screenshot frame or light panel. Image must blend continuously from quiet dark left to detailed industrial right. Equipment stronger than human presence; no excessive neon or cyberpunk.

### Delivered assets

All under `public/assets/images/home/`; Pillow Lanczos resampling, WebP quality
80 / method 6. No semantic editing of the generated source during encoding.

| File | Dimensions | Bytes |
|---|---|---:|
| hero-industrial-v2-640.webp | 640 × 256 | 20,130 |
| hero-industrial-v2-960.webp | 960 × 384 | 35,390 |
| hero-industrial-v2-1440.webp | 1440 × 576 | 60,710 |
| hero-industrial-v2-1920.webp | 1920 × 768 | 87,180 |

Real HTML H1 remains exactly “A Community for Instrument & Analyzer
Professionals”; its second phrase has a cyan treatment. Real Knowledge and
Simulator CTAs and existing pathway links sit over a controlled navy overlay.
The pathway is nested at the end of the hero text, before the untouched
simulator spotlight. No duplicate raster UI is used. Social image metadata now
references the clean 1440px variant.

Desktop uses approximately 50% text / 50% industrial composition. Tablet uses
a controlled crop and overlay. At ≤600px the decorative image is hidden, with
a simplified navy/purple atmosphere; H1, CTAs and wrapping pathway take
priority. CSS hiding may still fetch the smallest 20KB variant. No tall artwork
block is added. The mobile height check includes the newly nested pathway and
separately bounds the headline/action region. All targets remain ≥44px.

Validation: 104/104 site contracts; 21/21 homepage browser checks; existing
28/28 simulator regression. No new runtime/HTTP/console errors. Checked desktop
and mobile main content plus desktop full-page axe results have zero violations.
Screenshots inspected: 1440 hero/full page, 768 tablet, 430/390/360/320 heroes.
Existing local-only SDK fixtures and equivalent CSS-viewport 200% reflow
limitations remain. No external production services were contacted by tests.
