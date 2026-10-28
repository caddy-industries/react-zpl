/**
 * Printer behaviours that layout and preview must account for.
 * Measured against Labelary, which emulates Zebra firmware.
 */

/** ^BQ draws QR codes this many dots below the ^FO position. */
export const QR_TOP_OFFSET = 10;

/** EAN-13 and UPC-A guard bars extend this many dots below the other bars. */
export const RETAIL_GUARD_EXTENSION = 13;
