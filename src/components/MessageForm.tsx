import { useRef, useState } from "react";
import { type DictKey, type Lang, t } from "#/lib/i18n";
import { type PostError, postMessage } from "#/server/messages";

const ERRORS: Record<PostError, DictKey> = {
	not_configured: "contribute.err.notConfigured",
	invalid: "message.err.invalid",
	links: "message.err.links",
	rate_limited: "contribute.err.rate",
	server: "contribute.err.server",
};

const input =
	"w-full rounded-xl border border-earth-300 bg-card px-4 py-2.5 outline-none focus:border-rice-500 focus:ring-2 focus:ring-rice-300/50";

/** Shared form for guestbook entries and page comments. Messages are held for moderation. */
export function MessageForm({
	lang,
	kind,
	target,
	placeholder,
}: {
	lang: Lang;
	kind: "guestbook" | "comment";
	target?: string;
	placeholder: string;
}) {
	const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
	const [error, setError] = useState<string | null>(null);
	const startedAt = useRef(Date.now());
	const id = (s: string) => `${kind}-${s}`;

	if (status === "done") {
		return (
			<output className="block rounded-2xl bg-rice-100 p-5 text-rice-900">
				<p className="font-semibold">🌾 {t(lang, "message.thanks")}</p>
				<p className="mt-1 text-sm">{t(lang, "message.pending")}</p>
				<button
					type="button"
					className="mt-3 text-sm font-semibold underline"
					onClick={() => {
						startedAt.current = Date.now();
						setStatus("idle");
					}}
				>
					{t(lang, "message.another")}
				</button>
			</output>
		);
	}

	return (
		<form
			className="space-y-3 rounded-2xl border border-earth-300/50 bg-card/70 p-5"
			onSubmit={async (e) => {
				e.preventDefault();
				const fd = new FormData(e.currentTarget);
				setError(null);
				setStatus("sending");
				try {
					const res = await postMessage({
						data: {
							kind,
							target,
							name: String(fd.get("name") ?? ""),
							place: String(fd.get("place") ?? ""),
							message: String(fd.get("message") ?? ""),
							lang,
							website: String(fd.get("website") ?? ""),
							startedAt: startedAt.current,
						},
					});
					if (res.ok) {
						setStatus("done");
						return;
					}
					setError(t(lang, ERRORS[res.error]));
				} catch {
					setError(t(lang, "contribute.err.server"));
				}
				setStatus("idle");
			}}
		>
			<div className="grid gap-3 sm:grid-cols-2">
				<label htmlFor={id("name")} className="block">
					<span className="mb-1 block text-sm font-semibold text-rice-900">
						{t(lang, "contribute.name")}
					</span>
					<input
						id={id("name")}
						name="name"
						required
						maxLength={80}
						autoComplete="name"
						className={input}
					/>
				</label>
				<label htmlFor={id("place")} className="block">
					<span className="mb-1 block text-sm font-semibold text-rice-900">
						{t(lang, "message.place")}{" "}
						<span className="font-normal text-ink-soft">
							({t(lang, "contribute.optional")})
						</span>
					</span>
					<input
						id={id("place")}
						name="place"
						maxLength={80}
						className={input}
					/>
				</label>
			</div>
			<label htmlFor={id("message")} className="block">
				<span className="mb-1 block text-sm font-semibold text-rice-900">
					{t(lang, "contribute.message")}
				</span>
				<textarea
					id={id("message")}
					name="message"
					required
					minLength={2}
					maxLength={1000}
					rows={4}
					placeholder={placeholder}
					className={input}
				/>
			</label>
			{/* Honeypot: hidden from people and screen readers. */}
			<div
				aria-hidden="true"
				className="absolute -left-[9999px] h-px w-px overflow-hidden"
			>
				<input type="text" name="website" tabIndex={-1} autoComplete="off" />
			</div>
			{error && (
				<p
					role="alert"
					className="rounded-xl bg-lotus/15 px-4 py-2 text-sm font-medium text-lotus"
				>
					{error}
				</p>
			)}
			<div className="flex flex-wrap items-center gap-3">
				<button
					type="submit"
					disabled={status === "sending"}
					className="rounded-full bg-rice-700 px-6 py-2.5 font-semibold text-paper hover:bg-rice-900 disabled:opacity-60"
				>
					{status === "sending"
						? t(lang, "contribute.sending")
						: t(lang, "contribute.submit")}
				</button>
				<span className="text-xs text-ink-soft">
					{t(lang, "message.moderated")}
				</span>
			</div>
		</form>
	);
}
