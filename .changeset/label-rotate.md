---
"@caddy-industries/react-zpl": minor
---

`<Label rotate={90 | 180 | 270}>` turns the whole label on the stock: lay it out as it is read (e.g. 5 × 3 in) and it prints on stock fed the other way (3 × 5 in), with every text field, barcode, box and image turned (`^A0R`, `^BCR`, …; QR codes stay upright, as ZPL requires). Barcodes now take an orientation, and the SVG preview draws turned barcodes. Placement checked against Labelary.
