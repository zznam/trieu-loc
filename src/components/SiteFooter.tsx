import { Link } from "@tanstack/react-router";
import { site } from "#/lib/content";
import { type Lang, pick, t } from "#/lib/i18n";
import { InstallButton } from "./InstallButton";
import { NewsletterSignup } from "./NewsletterSignup";

export function SiteFooter({ lang }: { lang: Lang }) {
	return (
		<footer className="site-footer mt-24 bg-rice-900 text-rice-100">
			<div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2">
				<div>
					<p className="font-serif text-2xl font-semibold text-paper">
						{pick(lang, site.name)}
					</p>
					<p className="mt-1 text-sm text-rice-300">
						{pick(lang, site.province)}
					</p>
					<p className="mt-4 max-w-md text-sm leading-relaxed text-rice-100/80">
						{t(lang, "footer.about")}
					</p>
					<InstallButton lang={lang} />
					<div className="mt-6">
						<NewsletterSignup lang={lang} />
					</div>
				</div>
				<div className="sm:text-right">
					<p className="text-sm font-semibold uppercase tracking-widest text-earth-300">
						{t(lang, "footer.contact")}
					</p>
					<p className="mt-3 text-sm">{pick(lang, site.contact.address)}</p>
					<a
						className="mt-1 block text-sm underline-offset-4 hover:underline"
						href={`mailto:${site.contact.email}`}
					>
						{site.contact.email}
					</a>
					<a
						className="mt-1 block text-sm underline-offset-4 hover:underline"
						href={site.contact.facebook}
						target="_blank"
						rel="noreferrer"
					>
						Facebook
					</a>
					<Link
						to="/$lang/guestbook"
						params={{ lang }}
						className="mt-1 block text-sm underline-offset-4 hover:underline"
					>
						{t(lang, "nav.guestbook")}
					</Link>
					<Link
						to="/$lang/villages"
						params={{ lang }}
						className="mt-1 block text-sm underline-offset-4 hover:underline"
					>
						{t(lang, "nav.villages")}
					</Link>
					<Link
						to="/$lang/info"
						params={{ lang }}
						className="mt-1 block text-sm underline-offset-4 hover:underline"
					>
						{t(lang, "nav.info")}
					</Link>
					<Link
						to="/$lang/contribute"
						params={{ lang }}
						className="mt-4 inline-block rounded-full bg-paper px-4 py-2 text-sm font-semibold text-rice-900 hover:bg-rice-100"
					>
						{t(lang, "contribute.cta")} →
					</Link>
				</div>
			</div>
			<div className="border-t border-rice-700/60">
				<p className="mx-auto max-w-6xl px-4 py-4 text-xs text-rice-300">
					© {new Date().getFullYear()} {pick(lang, site.name)} ·{" "}
					{t(lang, "footer.note")} · Map data © OpenStreetMap contributors
				</p>
			</div>
		</footer>
	);
}
