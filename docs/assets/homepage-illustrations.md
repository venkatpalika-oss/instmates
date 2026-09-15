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
