# InstMates brand assets (canonical)

These two files are the owner-approved InstMates logo, byte-identical copies of
the assets committed to the Flutter application repository
(`InstMates/app/assets/branding/`, commit e5c59e9 "chore(branding): apply
official InstMates branding", 2026-09-04).

| File | Source file | SHA-256 | Size |
|---|---|---|---|
| `instmates-logo.png` | `instmates_logo.png` | d67b4bc53a4a161c5a734a8c66ee460641b6ce503d1262d30fd6f211bed469a7 | 1254 x 1254 RGBA |
| `instmates-icon.png` | `instmates_icon.png` | c7d687715d32aa4f94349750e740bf402dcf6dda3374c4cbbe3f60cf111f1d8a | 1142 x 1142 RGBA |

Rules
- Do not regenerate, recolour, re-proportion, or approximate these files.
- Derived sizes (favicons, PWA icons, social images) must be produced from
  these originals and recorded here with their hashes.
- The site header and PWA manifest icons now use derivatives of these files
  (see below). The social preview image is unchanged.

## Derived icon assets (post-W0 cleanup, 2026-09-06)

All derivatives below were produced from `instmates-icon.png` only
(SHA-256 c7d687715d32aa4f94349750e740bf402dcf6dda3374c4cbbe3f60cf111f1d8a) by a
deterministic local script using sharp 0.34.3 / libvips 8.17.1. Operations:
trim of fully transparent margins (alpha threshold 0; content box 754 x 606),
Lanczos3 resize to the stated content fraction of the canvas, centring, padding,
and, where stated, a flat white background. Nothing was redrawn, recoloured,
re-proportioned or generated. The script was run twice and produced identical
hashes.

| File | Size | Content | Background | SHA-256 |
|---|---|---|---|---|
| `/favicon.ico` (PNG entries 16/32/48) | 16, 32, 48 | 94 / 90 / 88 % | white | ef849173dbb1a44440cc536498328c80b8dd9d3045b6d2589953567a510577b0 |
| `/apple-touch-icon.png` | 180 x 180 | 80 % | white | c6896188ccf70f8c8818eb97edeca6770a63669a8cf8107d4b218b84c85be88a |
| `/assets/icons/instmates-192.png` | 192 x 192 | 84 % | white | 1cdb57cb025bac5aa661ced590396829bb3a3fae867d4eb92fce6fefd95f713a |
| `/assets/icons/instmates-512.png` | 512 x 512 | 84 % | white | b941dc601c006a1057e84e822a24bee5f068ebdfa08eb01c5039a8c9483f75f9 |
| `/assets/icons/instmates-512-maskable.png` | 512 x 512 | 60 % (inside the maskable safe zone) | white | 86dadc59555203a39f6050713f1492790bf5e777e5423f5a1dea472464dd2c50 |
| `/assets/brand/instmates-mark-128.png` (header mark) | 128 x 128 | 92 % | transparent | 09c290c7bdf6cf50ae33648532bb3eda09fad633e705a5b601a120e6c54480ef |

The site header shows `instmates-mark-128.png` on a white card next to the
text "InstMates"; that text is a UI treatment, not a logo asset. The previous
`icon-192.png` / `icon-512.png` artwork was removed; the service-worker cache
moved to `instmates-v4` so returning visitors drop the old files.
