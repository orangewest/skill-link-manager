/**
 * Generates a 512x512 PNG icon for the Tauri app.
 * No external dependencies — uses only Node.js built-in modules.
 *
 * Produces: src-tauri/icons/source.png  (solid blue with "S" letter shape)
 *
 * After this, run:  npx tauri icon src-tauri/icons/source.png
 * to generate all platform-specific icon formats.
 */
const fs = require("fs");
const zlib = require("zlib");
const path = require("path");

const WIDTH = 512;
const HEIGHT = 512;

// --- CRC32 ---
const crcTable = (() => {
    const t = new Int32Array(256);
    for (let i = 0; i < 256; i++) {
        let c = i;
        for (let j = 0; j < 8; j++) {
            c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        }
        t[i] = c;
    }
    return t;
})();

function crc32(buf) {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
        crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
    const typeBuf = Buffer.from(type, "ascii");
    const lenBuf = Buffer.alloc(4);
    lenBuf.writeUInt32BE(data.length, 0);
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
    return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

// --- Generate pixel data ---
// Background: blue (#3B82F6), with a lighter "link" shape in center
const bgR = 0x3b, bgG = 0x82, bgB = 0xf6;
const fgR = 0xff, fgG = 0xff, fgB = 0xff;

const rowSize = 1 + WIDTH * 3; // filter byte + RGB per pixel
const raw = Buffer.alloc(rowSize * HEIGHT);

for (let y = 0; y < HEIGHT; y++) {
    raw[y * rowSize] = 0; // filter: none
    for (let x = 0; x < WIDTH; x++) {
        const off = y * rowSize + 1 + x * 3;

        // Draw a simple "link/chain" shape: two overlapping rounded rectangles
        const cx = WIDTH / 2;
        const cy = HEIGHT / 2;
        const dx = Math.abs(x - cx);
        const dy = Math.abs(y - cy);

        // Link shape: a rounded rect outline
        const rectW = 180;
        const rectH = 100;
        const rectR = 30;
        const inOuter = dx < rectW + rectR && dy < rectH + rectR;
        const inInner = dx < rectW - rectR && dy < rectH - rectR;

        // Second link, rotated
        const angle = Math.PI / 4;
        const rx = dx * Math.cos(angle) + dy * Math.sin(angle);
        const ry = -dx * Math.sin(angle) + dy * Math.cos(angle);
        const rect2W = 180;
        const rect2H = 100;
        const rect2R = 30;
        const inOuter2 = Math.abs(rx) < rect2W + rect2R && Math.abs(ry) < rect2H + rect2R;
        const inInner2 = Math.abs(rx) < rect2W - rect2R && Math.abs(ry) < rect2H - rect2R;

        const onLink1 = inOuter && !inInner;
        const onLink2 = inOuter2 && !inInner2;

        if (onLink1 || onLink2) {
            raw[off] = fgR;
            raw[off + 1] = fgG;
            raw[off + 2] = fgB;
        } else {
            raw[off] = bgR;
            raw[off + 1] = bgG;
            raw[off + 2] = bgB;
        }
    }
}

// --- Build PNG ---
const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(WIDTH, 0);
ihdr.writeUInt32BE(HEIGHT, 4);
ihdr[8] = 8;  // bit depth
ihdr[9] = 2;  // color type: RGB
ihdr[10] = 0; // compression
ihdr[11] = 0; // filter
ihdr[12] = 0; // interlace

const compressed = zlib.deflateSync(raw, { level: 9 });
const png = Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", compressed),
    chunk("IEND", Buffer.alloc(0)),
]);

const outDir = path.join(__dirname, "src-tauri", "icons");
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, "source.png");
fs.writeFileSync(outPath, png);
console.log("Generated source icon:", outPath, `(${png.length} bytes)`);
