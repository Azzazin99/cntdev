/**
 * One-shot: convert project Markdown docs to static HTML.
 * Source of truth: *.md at repo root and under docs/ — HTML is generated output for browsing.
 * Run after editing PRODUCT.md, DESIGN.md, README.md, etc.: node scripts/render-doc-html.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

/** @type {{ input: string; cssHref: string }[]} */
const FILES = [
	{ input: 'README.md', cssHref: 'docs/doc.css' },
	{ input: 'PRODUCT.md', cssHref: 'docs/doc.css' },
	{ input: 'DESIGN.md', cssHref: 'docs/doc.css' },
	{ input: 'docs/tech-stack.md', cssHref: './doc.css' },
	{ input: 'docs/cloudflare-setup.md', cssHref: './doc.css' },
	{ input: 'docs/firebase-storage-setup.md', cssHref: './doc.css' },
	{ input: '.agent/workflows/add_activity_image.md', cssHref: '../../docs/doc.css' }
];

/**
 * @param {string} raw
 * @returns {{ meta: Record<string, string>; body: string }}
 */
function parseFrontmatter(raw) {
	if (!raw.startsWith('---\n')) {
		return { meta: {}, body: raw };
	}
	const end = raw.indexOf('\n---\n', 4);
	if (end === -1) {
		return { meta: {}, body: raw };
	}
	const yaml = raw.slice(4, end);
	const body = raw.slice(end + 5);
	const meta = {};
	for (const line of yaml.split('\n')) {
		const m = line.match(/^([a-zA-Z0-9_-]+):\s*(.+)$/);
		if (m) meta[m[1]] = m[2].replace(/^["']|["']$/g, '');
	}
	return { meta, body };
}

/** @param {string} text */
function rewriteMdLinks(text) {
	return text
		.replace(/\[([^\]]*?)\.md\]\(([^)\s]+?)\.md\)/g, (_, label, href) => `[${label}.html](${href}.html)`)
		.replace(/\]\(([^)\s]+\.md)\)/g, (_, href) => `](${href.replace(/\.md$/, '.html')})`)
		.replace(/`([^`]+\.md)`/g, (_, ref) => `\`${ref.replace(/\.md$/, '.html')}\``);
}

/** @param {string} html */
function rewriteMdLinksInHtml(html) {
	return html.replace(/href="([^"]+\.md)"/g, (_, href) => `href="${href.replace(/\.md$/, '.html')}"`);
}

/** @param {string} body */
function extractTitle(body) {
	const m = body.match(/^#\s+(.+)$/m);
	return m ? m[1].trim() : 'Documentation';
}

/**
 * @param {string} inputRel
 * @param {string} cssHref
 * @param {string} bodyHtml
 * @param {{ meta: Record<string, string>; title: string }} opts
 */
function wrapHtml(inputRel, cssHref, bodyHtml, opts) {
	const desc = opts.meta.description || '';
	const descTag = desc ? `\n  <meta name="description" content="${escapeAttr(desc)}">` : '';
	return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(opts.title)}</title>${descTag}
  <link rel="stylesheet" href="${cssHref}">
</head>
<body>
  <main class="doc">
${bodyHtml}
  </main>
</body>
</html>
`;
}

/** @param {string} s */
function escapeHtml(s) {
	return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** @param {string} s */
function escapeAttr(s) {
	return escapeHtml(s);
}

marked.setOptions({ gfm: true, breaks: false });

for (const { input, cssHref } of FILES) {
	const inputPath = path.join(ROOT, input);
	if (!fs.existsSync(inputPath)) {
		console.error(`Missing: ${input}`);
		process.exitCode = 1;
		continue;
	}

	const raw = fs.readFileSync(inputPath, 'utf8');
	const { meta, body } = parseFrontmatter(raw);
	const md = rewriteMdLinks(body);
	const title = meta.name || extractTitle(body);
	const bodyHtml = rewriteMdLinksInHtml(
		marked
			.parse(md)
			.split('\n')
			.map((line) => (line ? `    ${line}` : ''))
			.join('\n')
	);

	const outPath = inputPath.replace(/\.md$/, '.html');
	fs.writeFileSync(outPath, wrapHtml(input, cssHref, bodyHtml, { meta, title }), 'utf8');
	console.log(`Wrote ${path.relative(ROOT, outPath)}`);
}
