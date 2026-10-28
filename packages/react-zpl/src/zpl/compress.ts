/** ZPL ASCII hex compression for ^GFA graphics. */

const SMALL = 'GHIJKLMNOPQRSTUVWXY'; // 1..19
const LARGE = 'ghijklmnopqrstuvwxyz'; // 20..400 in steps of 20

function count(n: number): string {
  let out = '';
  if (n >= 20) {
    out += LARGE[Math.floor(n / 20) - 1];
    n %= 20;
  }
  if (n > 0) out += SMALL[n - 1];
  return out;
}

function runs(hex: string): string {
  let out = '';
  let i = 0;
  while (i < hex.length) {
    const ch = hex[i];
    let j = i;
    while (j < hex.length && hex[j] === ch) j++;
    let n = j - i;
    while (n > 0) {
      const chunk = Math.min(n, 419);
      out += chunk === 1 ? ch : count(chunk) + ch;
      n -= chunk;
    }
    i = j;
  }
  return out;
}

export function rowHex(data: Uint8Array, row: number, bytesPerRow: number): string {
  let hex = '';
  for (let i = 0; i < bytesPerRow; i++) hex += data[row * bytesPerRow + i].toString(16).padStart(2, '0').toUpperCase();
  return hex;
}

export function compressGraphic(data: Uint8Array, bytesPerRow: number, rows: number): string {
  let out = '';
  let prev: string | undefined;
  for (let r = 0; r < rows; r++) {
    const hex = rowHex(data, r, bytesPerRow);
    if (hex === prev) {
      out += ':';
      continue;
    }
    prev = hex;
    let body = hex;
    let tail = '';
    const zeros = /0+$/.exec(body);
    const ones = /F+$/.exec(body);
    if (zeros && zeros[0].length > 1) {
      body = body.slice(0, zeros.index);
      tail = ',';
    } else if (ones && ones[0].length > 1) {
      body = body.slice(0, ones.index);
      tail = '!';
    }
    out += runs(body) + tail;
  }
  return out;
}

/** Expands compressed ^GFA data back into bytes (used by the preview). */
export function decompressGraphic(src: string, bytesPerRow: number, totalBytes: number): Uint8Array {
  const out = new Uint8Array(totalBytes);
  const rowLen = bytesPerRow * 2;
  const rows = Math.ceil(totalBytes / bytesPerRow);
  let row = '';
  let prev = '0'.repeat(rowLen);
  let r = 0;
  let n = 0;
  const flush = () => {
    const full = row.padEnd(rowLen, '0').slice(0, rowLen);
    for (let i = 0; i < bytesPerRow && r * bytesPerRow + i < totalBytes; i++) {
      out[r * bytesPerRow + i] = Number.parseInt(full.slice(i * 2, i * 2 + 2), 16) || 0;
    }
    prev = full;
    row = '';
    r++;
  };
  for (const ch of src.replace(/\s+/g, '')) {
    if (r >= rows) break;
    const small = SMALL.indexOf(ch);
    const large = LARGE.indexOf(ch);
    if (small >= 0) n += small + 1;
    else if (large >= 0) n += (large + 1) * 20;
    else if (ch === ',') {
      row = row.padEnd(rowLen, '0');
      flush();
    } else if (ch === '!') {
      row = row.padEnd(rowLen, 'F');
      flush();
    } else if (ch === ':') {
      row = prev;
      flush();
    } else if (/[0-9A-Fa-f]/.test(ch)) {
      row += ch.toUpperCase().repeat(n || 1);
      n = 0;
      while (row.length >= rowLen && r < rows) {
        const rest = row.slice(rowLen);
        row = row.slice(0, rowLen);
        flush();
        row = rest;
      }
    }
  }
  if (row && r < rows) flush();
  return out;
}
