// Fails the build if server-only code (database driver, Node crypto, secrets) leaks into
// the browser bundle — e.g. after importing a plain value from a src/server/* module.
import { readdir, readFile } from "node:fs/promises";

const DIR = ".output/public/assets";
const FORBIDDEN = [
	["postgres driver", /allocUnsafe|\bbytea\b/],
	["drizzle-orm", /drizzle-orm|PgDialect/],
	["node:crypto", /timingSafeEqual|createHmac/],
	["Vercel Blob SDK", /vercel\.com\/api\/blob|BlobAccessError/],
];

const files = (await readdir(DIR)).filter((f) => f.endsWith(".js"));
const problems = [];
for (const f of files) {
	const src = await readFile(`${DIR}/${f}`, "utf8");
	for (const [name, re] of FORBIDDEN) if (re.test(src)) problems.push(`${f}: contains ${name}`);
}
if (problems.length) {
	console.error("✗ Server-only code found in the client bundle:\n  " + problems.join("\n  "));
	process.exit(1);
}
console.log(`✓ Client bundle clean (${files.length} files checked)`);
