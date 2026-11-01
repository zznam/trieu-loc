import { Link } from "@tanstack/react-router";
import { useState } from "react";
import type { DictKey, Lang } from "#/lib/i18n";
import { t } from "#/lib/i18n";
import type { SubscriptionInfo } from "#/server/newsletter";

/** Confirm / unsubscribe page body. Requires a button press so email link scanners can't trigger it. */
export function SubscriptionAction({
	lang,
	info,
	mode,
	run,
}: {
	lang: Lang;
	info: SubscriptionInfo;
	mode: "confirm" | "unsubscribe";
	run: () => Promise<{ ok: boolean }>;
}) {
	const [state, setState] = useState<"idle" | "busy" | "done" | "error">(
		"idle",
	);
	const k = (confirm: DictKey, unsub: DictKey) =>
		t(lang, mode === "confirm" ? confirm : unsub);

	let body: React.ReactNode;
	if (!info.found)
		body = <p className="text-ink-soft">{t(lang, "newsletter.badLink")}</p>;
	else if (
		state === "done" ||
		(mode === "unsubscribe" && info.status === "unsubscribed")
	)
		body = (
			<p className="text-lg text-rice-900">
				{k("newsletter.confirmed", "newsletter.unsubscribed")}
			</p>
		);
	else if (mode === "confirm" && info.status === "active")
		body = (
			<p className="text-lg text-rice-900">{t(lang, "newsletter.already")}</p>
		);
	else
		body = (
			<>
				<p className="text-ink-soft">
					{k("newsletter.confirmBody", "newsletter.unsubBody")}{" "}
					<strong className="text-ink">{info.email}</strong>.
				</p>
				<button
					type="button"
					disabled={state === "busy"}
					onClick={async () => {
						setState("busy");
						try {
							setState((await run()).ok ? "done" : "error");
						} catch {
							setState("error");
						}
					}}
					className="mt-6 rounded-full bg-rice-700 px-6 py-3 font-semibold text-paper hover:bg-rice-900 disabled:opacity-60"
				>
					{k("newsletter.confirmButton", "newsletter.unsubButton")}
				</button>
				{state === "error" && (
					<p role="alert" className="mt-3 text-sm text-lotus">
						{t(lang, "newsletter.badLink")}
					</p>
				)}
			</>
		);

	return (
		<section className="mx-auto max-w-xl px-4 py-20 text-center">
			<p className="text-5xl" aria-hidden="true">
				✉️
			</p>
			<h1 className="mt-4 text-3xl font-semibold text-rice-900">
				{k("newsletter.confirmTitle", "newsletter.unsubTitle")}
			</h1>
			<div className="mt-4">{body}</div>
			<Link
				to="/$lang"
				params={{ lang }}
				className="mt-10 inline-block text-sm font-semibold text-earth-700 hover:underline"
			>
				← {t(lang, "nav.home")}
			</Link>
		</section>
	);
}
