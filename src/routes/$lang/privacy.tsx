import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "#/components/PageHeader";
import { site } from "#/lib/content";
import { formatDate, type Lang, pick, t } from "#/lib/i18n";
import { PRIVACY, PRIVACY_UPDATED } from "#/lib/pages";
import { seo } from "#/lib/seo";

export const Route = createFileRoute("/$lang/privacy")({
	head: ({ params }) => {
		const lang = params.lang as Lang;
		return seo(
			lang,
			t(lang, "privacy.title"),
			t(lang, "privacy.lead"),
			"/privacy",
		);
	},
	component: PrivacyPage,
});

function PrivacyPage() {
	const lang = Route.useParams().lang as Lang;
	return (
		<>
			<PageHeader
				title={t(lang, "privacy.title")}
				lead={t(lang, "privacy.lead")}
			/>
			<section className="mx-auto max-w-3xl space-y-10 px-4 py-10">
				{PRIVACY.map((s) => (
					<div key={s.id} id={s.id} className="scroll-mt-24">
						<h2 className="text-2xl font-semibold text-rice-900">
							{pick(lang, s.title)}
						</h2>
						<ul className="mt-4 list-disc space-y-2 pl-5 text-ink-soft">
							{s.items.map((item) => (
								<li key={item.vi}>{pick(lang, item)}</li>
							))}
						</ul>
					</div>
				))}
				<p className="text-sm text-ink-soft">
					{t(lang, "footer.contact")}:{" "}
					<a
						href={`mailto:${site.contact.email}`}
						className="font-semibold text-rice-700 underline"
					>
						{site.contact.email}
					</a>
					{" · "}
					{t(lang, "privacy.updated")}: {formatDate(lang, PRIVACY_UPDATED)}
				</p>
			</section>
		</>
	);
}
