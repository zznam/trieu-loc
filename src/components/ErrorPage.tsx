import {
	type ErrorComponentProps,
	Link,
	useRouter,
} from "@tanstack/react-router";
import { t } from "#/lib/i18n";
import { useLang } from "#/lib/useLang";

/** Shown when a page fails to render or load (bilingual, with a retry). */
export function ErrorPage({ error, reset }: ErrorComponentProps) {
	const lang = useLang();
	const router = useRouter();
	if (import.meta.env.DEV) console.error(error);
	return (
		<div className="mx-auto max-w-xl px-4 py-24 text-center" role="alert">
			<p className="font-serif text-5xl text-earth-500">⚠︎</p>
			<h1 className="mt-4 text-2xl font-semibold text-rice-900">
				{t(lang, "error.title")}
			</h1>
			<p className="mt-2 text-ink-soft">{t(lang, "error.body")}</p>
			<div className="mt-6 flex justify-center gap-2">
				<button
					type="button"
					onClick={() => {
						reset();
						router.invalidate();
					}}
					className="rounded-full bg-rice-700 px-5 py-2 text-paper"
				>
					{t(lang, "error.retry")}
				</button>
				<Link
					to="/$lang"
					params={{ lang }}
					className="rounded-full border border-earth-300 px-5 py-2 text-ink-soft"
				>
					{t(lang, "nav.home")}
				</Link>
			</div>
		</div>
	);
}
