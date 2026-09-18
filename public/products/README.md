Product photography goes here as `images.json`, produced by
`scripts/extract-bsn-images.js` (run in the browser on the BSN store).

Shape: { "at": ISO8601, "count": n, "images": { "<bsn product id>": "data:image/webp;base64,..." } }

The app falls back to BSN's live image URL, then to a drawn flat, so this file
is an optimisation and not a requirement.
