import { createFileRoute } from "@tanstack/react-router";
import { MessageForm } from "#/components/MessageForm";
import { PageHeader } from "#/components/PageHeader";
import { formatDate, type Lang, t } from "#/lib/i18n";
import { seo } from "#/lib/seo";
import { getGuestbook } from "#/server/messages";

export const Route = createFileRoute("/$lang/guestbook")({
	head: ({ params }) => {
		const lang = params.lang as Lang;
		return seo(
			lang,
			t(lang, "guestbook.title"),
			t(lang, "guestbook.lead"),
			"/guestbook",
			"people",
		);
	},
	loader: () => getGuestbook(),
	component: GuestbookPage,
});

// A few warm accent colours so the postcards don't all look the same.
const STAMPS = ["bg-lotus", "bg-earth-500", "bg-rice-500", "bg-rice-700"];

function GuestbookPage() {
	const lang = Route.useParams().lang as Lang;
	const entries = Route.useLoaderData();
	return (
		<>
			<PageHeader
				title={t(lang, "guestbook.title")}
				lead={t(lang, "guestbook.lead")}
			/>
			<section className="mx-auto max-w-3xl px-4 pt-10">
				<h2 className="mb-4 text-xl font-semibold text-rice-900">
					{t(lang, "guestbook.write")}
				</h2>
				<MessageForm
					lang={lang}
					kind="guestbook"
					placeholder={t(lang, "guestbook.placeholder")}
				/>
			</section>
			<section className="mx-auto max-w-6xl px-4 py-12">
				<p className="mb-6 text-sm font-semibold uppercase tracking-widest text-earth-700">
					{entries.length} {t(lang, "guestbook.count")}
				</p>
				{entries.length === 0 ? (
					<p className="rounded-2xl bg-paper-2 p-8 text-center text-ink-soft">
						{t(lang, "guestbook.empty")}
					</p>
				) : (
					<ul className="columns-1 gap-5 sm:columns-2 lg:columns-3">
						{entries.map((e) => (
							<li
								key={e.id}
								className="relative mb-5 break-inside-avoid overflow-hidden rounded-2xl border border-earth-300/60 bg-card p-5 shadow-sm"
							>
								<span
									aria-hidden="true"
									className={`absolute right-4 top-4 h-8 w-7 rounded-sm opacity-80 ${STAMPS[e.id % STAMPS.length]}`}
								/>
								<p className="whitespace-pre-line pr-8 font-serif text-lg leading-relaxed text-ink">
									“{e.message}”
								</p>
								<p className="mt-4 border-t border-dashed border-earth-300 pt-3 text-sm">
									<span className="font-semibold text-rice-900">{e.name}</span>
									{e.place && (
										<span className="text-ink-soft"> · {e.place}</span>
									)}
									<time
										className="block text-xs text-ink-soft"
										dateTime={e.createdAt}
									>
										{formatDate(lang, e.createdAt.slice(0, 10))}
									</time>
								</p>
							</li>
						))}
					</ul>
				)}
			</section>
		</>
	);
}
