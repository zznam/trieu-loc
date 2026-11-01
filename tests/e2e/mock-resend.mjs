// Stand-in for the Resend API during E2E tests. Records every email in memory.
//   POST /emails, POST /emails/batch  → recorded, 200
//   GET  /__log                        → JSON array of recorded emails
//   DELETE /__log                      → clears the log
import http from "node:http";

const PORT = Number(process.env.MOCK_RESEND_PORT ?? 4599);
let log = [];

http
	.createServer((req, res) => {
		let body = "";
		req.on("data", (c) => {
			body += c;
		});
		req.on("end", () => {
			const json = (status, data) => {
				res.writeHead(status, { "content-type": "application/json" });
				res.end(JSON.stringify(data));
			};
			if (req.url === "/__log" && req.method === "GET") return json(200, log);
			if (req.url === "/__log" && req.method === "DELETE") {
				log = [];
				return json(200, { ok: true });
			}
			if (
				req.method === "POST" &&
				(req.url === "/emails" || req.url === "/emails/batch")
			) {
				const parsed = JSON.parse(body || "null");
				const emails = Array.isArray(parsed) ? parsed : [parsed];
				log.push(
					...emails.map((e) => ({ ...e, auth: req.headers.authorization })),
				);
				return json(
					200,
					req.url === "/emails"
						? { id: "mock" }
						: { data: emails.map(() => ({ id: "mock" })) },
				);
			}
			json(404, { message: "not found" });
		});
	})
	.listen(PORT, () => console.log(`mock resend on ${PORT}`));
