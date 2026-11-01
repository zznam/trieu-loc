import { useRef, useState } from "react";
import { type Lang, t } from "#/lib/i18n";
import { subscribe } from "#/server/newsletter";

/** Compact newsletter sign-up for the footer (double opt-in: a confirmation email follows). */
export function NewsletterSignup({ lang }: { lang: Lang }) {
	const [state, setState] = useState<"idle" | "sending" | "done">("idle");
	const [error, setError] = useState<string | null>(null);
	const startedAt = useRef(Date.now());

	if (state === "done") {
		return (
			<output className="block rounded-xl bg-paper/10 p-3 text-sm text-paper">
				✉️ {t(lang, "newsletter.checkInbox")}
			</output>
		);
	}

	return (
		<form
			className="max-w-md"
			onSubmit={async (e) => {
				e.preventDefault();
				const fd = new FormData(e.currentTarget);
				setError(null);
				setState("sending");
				try {
					const res = await subscribe({
						data: {
							email: String(fd.get("email") ?? ""),
							lang,
							website: String(fd.get("website") ?? ""),
							startedAt: startedAt.current,
						},
					});
					if (res.ok) return setState("done");
					setError(
						t(
							lang,
							res.error === "invalid"
								? "newsletter.err.invalid"
								: res.error === "not_configured"
									? "newsletter.err.notConfigured"
									: res.error === "rate_limited"
										? "contribute.err.rate"
										: "contribute.err.server",
						),
					);
				} catch {
					setError(t(lang, "contribute.err.server"));
				}
				setState("idle");
			}}
		>
			<p className="font-semibold text-paper">{t(lang, "newsletter.title")}</p>
			<p className="mt-1 text-sm text-rice-100/80">
				{t(lang, "newsletter.lead")}
			</p>
			<div className="mt-3 flex gap-2">
				<label htmlFor="newsletter-email" className="sr-only">
					{t(lang, "newsletter.email")}
				</label>
				<input
					id="newsletter-email"
					name="email"
					type="email"
					required
					autoComplete="email"
					placeholder={t(lang, "newsletter.email")}
					className="min-w-0 flex-1 rounded-full border border-paper/30 bg-paper/10 px-4 py-2 text-sm text-paper placeholder:text-rice-100/60 outline-none focus:border-paper"
				/>
				<div
					aria-hidden="true"
					className="absolute -left-[9999px] h-px w-px overflow-hidden"
				>
					<input type="text" name="website" tabIndex={-1} autoComplete="off" />
				</div>
				<button
					type="submit"
					disabled={state === "sending"}
					className="shrink-0 rounded-full bg-paper px-4 py-2 text-sm font-semibold text-rice-900 hover:bg-rice-100 disabled:opacity-60"
				>
					{t(lang, "newsletter.subscribe")}
				</button>
			</div>
			{error && (
				<p role="alert" className="mt-2 text-sm font-medium text-earth-300">
					{error}
				</p>
			)}
		</form>
	);
}
