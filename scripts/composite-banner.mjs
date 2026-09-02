/**
 * One-off composite: static header banner with 3 personnel on the original-style layout.
 * Run: node scripts/composite-banner.mjs
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();
const OUT_PATH = path.join(ROOT, 'static/assets/images/banner.png');
const BACKUP_PATH = path.join(ROOT, 'static/assets/images/banner.before-3person.png');

const W = 6063;
const H = 1250;

/** @type {{ name: string; position: string; image: string }[]} */
const PEOPLE = [
	{
		name: 'นายอนุพงษ์ คล้องการ',
		position: 'รองผู้อำนวยการสำนักงานเขตพื้นที่การศึกษาประถมศึกษาชัยนาท',
		image: 'static/assets/images/personnel/1782458086942_glfsco.jpg'
	},
	{
		name: 'นางเจฎษรา ปานพรหม',
		position: 'ผู้อำนวยการกลุ่มพัฒนาครูและบุคลากรทางการศึกษา',
		image: 'static/assets/images/personnel/1782458103908_icj33y.jpg'
	},
	{
		name: 'นางสาวรุ่งรัตน์ พานพรม',
		position: 'นักทรัพยากรบุคคลปฏิบัติการ',
		image: 'static/assets/images/personnel/1782458211496_xhvj1d.jpg'
	}
];

const PEOPLE_ZONE_X = 2920;
const PERSON_W = 920;
const PERSON_H = 980;
const GAP = 48;
const NAMEPLATE_H = 210;

function escapeXml(text) {
	return String(text)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

/** Wrap Thai position text into lines (~22 chars) */
function wrapLines(text, maxChars = 22, maxLines = 3) {
	const words = text.split(' ');
	const lines = [];
	let current = '';
	for (const word of words) {
		const next = current ? `${current} ${word}` : word;
		if (next.length <= maxChars) {
			current = next;
		} else {
			if (current) lines.push(current);
			current = word;
		}
		if (lines.length >= maxLines) break;
	}
	if (lines.length < maxLines && current) lines.push(current);
	return lines.slice(0, maxLines);
}

function nameplateSvg(width, name, positionLines) {
	const h = NAMEPLATE_H;
	const lines = positionLines
		.map(
			(line, i) =>
				`<text x="24" y="${72 + i * 34}" font-size="28" fill="#ffffff" font-family="Sarabun, Thonburi, sans-serif">${escapeXml(line)}</text>`
		)
		.join('');
	return Buffer.from(`<svg width="${width}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="plate" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#7b1fa2"/>
      <stop offset="100%" stop-color="#6a1b9a"/>
    </linearGradient>
  </defs>
  <path d="M0 0 H${width - 36} L${width} ${h} H0 Z" fill="url(#plate)"/>
  <path d="M${width - 36} 0 L${width} ${h} L${width - 8} ${h} L${width - 44} 0 Z" fill="rgba(255,255,255,0.25)"/>
  <text x="24" y="38" font-size="34" font-weight="700" fill="#ffffff" font-family="Sarabun, Thonburi, sans-serif">${escapeXml(name)}</text>
  ${lines}
</svg>`);
}

async function portraitBuffer(imagePath) {
	return sharp(path.join(ROOT, imagePath))
		.resize(PERSON_W, PERSON_H, { fit: 'cover', position: 'top' })
		.png()
		.toBuffer();
}

async function peopleZoneWash() {
	/** Soft purple wash to cover legacy 2-person art before compositing new portraits */
	return sharp({
		create: {
			width: W - PEOPLE_ZONE_X,
			height: H,
			channels: 4,
			background: { r: 0, g: 0, b: 0, alpha: 0 }
		}
	})
		.composite([
			{
				input: Buffer.from(`<svg width="${W - PEOPLE_ZONE_X}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#b39ddb" stop-opacity="0.55"/>
      <stop offset="45%" stop-color="#9575cd" stop-opacity="0.82"/>
      <stop offset="100%" stop-color="#7e57c2" stop-opacity="0.95"/>
    </linearGradient>
    <radialGradient id="burst" cx="85%" cy="40%" r="70%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
  <rect width="100%" height="100%" fill="url(#burst)"/>
</svg>`),
				top: 0,
				left: 0
			}
		])
		.png()
		.toBuffer();
}

async function main() {
	const currentBanner = path.join(ROOT, 'static/assets/images/banner.png');
	try {
		await fs.access(BACKUP_PATH);
	} catch {
		await fs.copyFile(currentBanner, BACKUP_PATH);
		console.log('Backed up original banner → banner.before-3person.png');
	}

	const baseSource = (await fs.access(BACKUP_PATH).then(() => true).catch(() => false))
		? BACKUP_PATH
		: currentBanner;

	const base = sharp(baseSource).ensureAlpha();
	const wash = await peopleZoneWash();

	const composites = [{ input: wash, top: 0, left: PEOPLE_ZONE_X }];

	let x = PEOPLE_ZONE_X + GAP;
	for (const person of PEOPLE) {
		const portrait = await portraitBuffer(person.image);
		const plate = nameplateSvg(PERSON_W, person.name, wrapLines(person.position));
		const topPortrait = H - NAMEPLATE_H - PERSON_H + 40;

		composites.push({ input: portrait, top: topPortrait, left: x });
		composites.push({
			input: plate,
			top: H - NAMEPLATE_H - 20,
			left: x
		});
		x += PERSON_W + GAP;
	}

	let pipeline = base.composite(composites);

	// Prefer JPEG if PNG exceeds admin 5 MB limit
	let outBuffer = await pipeline.jpeg({ quality: 88, mozjpeg: true }).toBuffer();
	if (outBuffer.length > 5 * 1024 * 1024) {
		outBuffer = await sharp(outBuffer).jpeg({ quality: 82, mozjpeg: true }).toBuffer();
	}

	const pngBuffer = await sharp(outBuffer).png({ compressionLevel: 9, palette: false }).toBuffer();
	if (pngBuffer.length <= 5 * 1024 * 1024) {
		await fs.writeFile(OUT_PATH, pngBuffer);
		console.log(`Wrote ${OUT_PATH} (${(pngBuffer.length / 1024 / 1024).toFixed(2)} MB)`);
		return;
	}

	const jpgPath = OUT_PATH.replace(/\.png$/, '.jpg');
	await fs.writeFile(jpgPath, outBuffer);
	console.log(`PNG > 5 MB — wrote ${jpgPath} (${(outBuffer.length / 1024 / 1024).toFixed(2)} MB)`);
	console.log('Update banner_config imageUrl to /assets/images/banner.jpg if using this file.');

	console.log('Done. Review at http://localhost:6395/ then upload via admin if deploying to production.');
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
