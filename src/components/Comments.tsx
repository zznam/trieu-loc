import { useEffect, useState } from "react";
import { formatDate, type Lang, t } from "#/lib/i18n";
import {
	getComments,
	getReactions,
	type PublicMessage,
	type ReactionState,
	toggleReaction,
} from "#/server/messages";
import { MessageForm } from "./MessageForm";

/** ❤️ button + approved comments + comment form. Loads after render so pages never wait on it. */
export function Comments({ lang, target }: { lang: Lang; target: string }) {
	const [comments, setComments] = useState<PublicMessage[] | null>(null);
	const [reaction, setReaction] = useState<ReactionState | null>(null);
	const [busy, setBusy] = useState(false);

	useEffect(() => {
		let alive = true;
		getComments({ data: { target } })
			.then((c) => alive && setComments(c))
			.catch(() => alive && setComments([]));
		getReactions({ data: { target } })
			.then((r) => alive && setReaction(r))
			.catch(() => alive && setReaction(null));
		return () => {
			alive = false;
		};
	}, [target]);

	async function toggle() {
		if (!reaction || busy) return;
		setBusy(true);
		// Optimistic update; corrected by the server's answer.
		setReaction({
			...reaction,
			mine: !reaction.mine,
			count: reaction.count + (reaction.mine ? -1 : 1),
		});
		try {
			setReaction(await toggleReaction({ data: { target } }));
		} catch {
			setReaction(reaction);
		} finally {
			setBusy(false);
		}
	}

	return (
		<section
			aria-labelledby="comments-title"
			className="mt-12 border-t border-earth-300/50 pt-8"
		>
			{reaction?.enabled && (
				<button
					type="button"
					onClick={() => void toggle()}
					aria-pressed={reaction.mine}
					aria-label={`${t(lang, reaction.mine ? "comments.unlike" : "comments.like")} (${reaction.count})`}
					className={`mb-8 inline-flex items-center gap-2 rounded-full px-5 py-2.5 font-semibold transition ${
						reaction.mine
							? "bg-lotus text-white"
							: "border border-earth-300 text-ink hover:border-lotus hover:text-lotus"
					}`}
				>
					<span aria-hidden="true">{reaction.mine ? "❤️" : "🤍"}</span>
					<span className="tabular-nums">{reaction.count}</span>
					<span className="text-sm font-medium">
						{t(lang, "comments.likeLabel")}
					</span>
				</button>
			)}

			<h2 id="comments-title" className="text-2xl font-semibold text-rice-900">
				{t(lang, "comments.title")}
				{comments && comments.length > 0 && (
					<span className="ml-2 text-base font-normal text-ink-soft">
						({comments.length})
					</span>
				)}
			</h2>

			{comments === null ? (
				<div
					className="mt-4 h-16 animate-pulse rounded-2xl bg-paper-2"
					aria-busy="true"
				/>
			) : comments.length === 0 ? (
				<p className="mt-3 text-ink-soft">{t(lang, "comments.empty")}</p>
			) : (
				<ol className="mt-4 space-y-4">
					{comments.map((c) => (
						<li key={c.id} className="rounded-2xl bg-paper-2 p-4">
							<p className="text-sm">
								<span className="font-semibold text-rice-900">{c.name}</span>
								{c.place && <span className="text-ink-soft"> · {c.place}</span>}
								<time
									className="ml-2 text-xs text-ink-soft"
									dateTime={c.createdAt}
								>
									{formatDate(lang, c.createdAt.slice(0, 10))}
								</time>
							</p>
							<p className="mt-1 whitespace-pre-line text-ink">{c.message}</p>
						</li>
					))}
				</ol>
			)}

			<div className="mt-6">
				<MessageForm
					lang={lang}
					kind="comment"
					target={target}
					placeholder={t(lang, "comments.placeholder")}
				/>
			</div>
		</section>
	);
}
