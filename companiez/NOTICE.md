# Notice

Companiez is a fork of **Munder Difflin** by Chaitanya Giri
(https://github.com/chaitanyagiri/munder-difflin), used under the MIT License.

- The original copyright and license text are kept unchanged in [`LICENSE`](LICENSE),
  as the MIT License requires. Companiez's changes are released under the same license.
- The pixel-art tilesets are **not** MIT-licensed. They are "Modern Interiors" by
  LimeZu and stay under that author's licence; see [`LICENSE-ASSETS`](LICENSE-ASSETS).
  The credit must stay with the app.
- Companiez is an independent project. It is not affiliated with or endorsed by
  Munder Difflin, HarnessMD, or Chaitanya Giri.

## What Companiez changes

- The name, app identity (`app.companiez.desktop`) and deep-link scheme (`companiez://`).
- The **Company** tab in the Command Center, for company details plus an AI-employee
  team with standing 24/7 work orders.
- 2.5D depth on the office floor and UI: contact shadows, lighting, and raised panels and keys.
- Network features that pointed at the upstream project (auto-update, remote hero copy,
  remote model catalog) are off until `BRAND.repo` in `src/shared/brand.ts` names a
  Companiez repo. Upstream's Pro and Founders' Wall offers are removed.
