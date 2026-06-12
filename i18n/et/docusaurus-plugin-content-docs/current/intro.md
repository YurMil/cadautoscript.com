---
sidebar_position: 1
---

# CAD AutoScript ülevaade

CAD AutoScript on dokumentatsioonikeskne keskkond SolidWorks makrodele, tootmiskalkulaatoritele ja QA tööriistadele. See sait on loodud **Docusaurus + MDX** baasil, nii et iga utiliit on dokumenteeritud vahetult selle interaktiivse React komponendi kõrval.

## Mis siin leidub

- **SolidWorks makrod**, mis hõlmavad BOM-eksporti, nimekirja kontrolli ja konfiguratsiooni abimehi.
- **Veebikalkulaatorid**, mis töötavad täielikult Chromiumis (Pipe Cutter, Shell Rolling, QR sildid ja muud).
- **QA generaatorid** PDF-i parsimiseks, seerianumbrite jälgimiseks ja aruannete automatiseerimiseks.
- **Versioonimärkmed ja juhendid**, et insenerid teaksid, kuidas ja millal iga tööriista kasutada.

:::tip Ainult Chromium
Kõik utiliidid on pakendatud staatiliste varadena ja eeldavad Chromium-põhist brauserit (Chrome, Edge, Arc jne), millel on lubatud WebGL 2 ja WebAssembly.
:::

## Kiirjuhend kaastöötajatele

1. **Installi sõltuvused**
   ```bash
   npm install
   ```
2. **Käivita dokumentatsioon lokaalselt**
   ```bash
   npm start
   ```
3. **Muuda sisu**
   - Markdown lehed asuvad kaustas `docs/`
   - React komponendid asuvad kaustas `src/`
   - Eraldiseisvad utiliitide paketid asuvad kaustas `static/utility-apps/`
   - Ühised utiliitide kesta varad asuvad kaustas `static/utilities/`

Docusaurus laadib muudatused koheselt uuesti. Kui oled valmis avaldama, käivita `npm run build` ja laadi `build/` väljund üles GitHub Pages keskkonda.

## Reaalajas utiliitide sisestamine

MDX võimaldab meil importida React komponente või iframe-laadseid utiliite otse dokumentatsiooni lehtedele. Vaata [Kalkulaatorite sisestamine](utilities/embed-calculators.md) juhendit, kuidas mähkida `/utilities/*` rakendusi või luua kohandatud React vidinaid.

## Mis edasi

Sirvi [Utiliitide kataloogi](./utilities/overview.mdx), et näha iga kalkulaatorit koos spetsifikatsioonide, toetatud standardite ja käivituslinkidega. Iga kirje selgitab, millal seda kasutada ja kuidas seda MDX-i sisse panna.
