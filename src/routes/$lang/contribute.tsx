import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { PageHeader } from "#/components/PageHeader";
import {
	errorKey,
	KINDS,
	type Kind,
	kindLabel,
	LIMITS,
	resizeImage,
} from "#/lib/contribute";
import { type Lang, pick, t } from "#/lib/i18n";
import { seo } from "#/lib/seo";
import { submitContribution } from "#/server/contributions";

export const Route = createFileRoute("/$lang/contribute")({
	validateSearch: (s: Record<string, unknown>): { kind?: Kind } =>
		KINDS.includes(s.kind as Kind) ? { kind: s.kind as Kind } : {},
	head: ({ params }) => {
		const lang = params.lang as Lang;
		return seo(
			lang,
			t(lang, "contribute.title"),
			t(lang, "contribute.lead"),
			"/contribute",
		);
	},
	component: ContributePage,
});

type Picked = {
	id: string;
	file: File;
	width: number;
	height: number;
	preview: string;
};

const input =
	"w-full rounded-xl border border-earth-300 bg-card px-4 py-2.5 outline-none focus:border-rice-500 focus:ring-2 focus:ring-rice-300/50";
const label = "mb-1.5 block text-sm font-semibold text-rice-900";

function ContributePage() {
	const lang = Route.useParams().lang as Lang;
	const search = Route.useSearch();
	const [kind, setKind] = useState<Kind>(search.kind ?? "story");
	const [photos, setPhotos] = useState<Picked[]>([]);
	const [status, setStatus] = useState<
		"idle" | "processing" | "sending" | "done"
	>("idle");
	const [error, setError] = useState<string | null>(null);
	const startedAt = useRef(Date.now());
	const form = useRef<HTMLFormElement>(null);

	// Release preview URLs when photos are removed or the page unmounts.
	const photosRef = useRef(photos);
	photosRef.current = photos;
	useEffect(
		() => () => {
			for (const p of photosRef.current) URL.revokeObjectURL(p.preview);
		},
		[],
	);

	async function addPhotos(files: FileList | null) {
		if (!files?.length) return;
		setError(null);
		setStatus("processing");
		try {
			const room = LIMITS.maxPhotos - photos.length;
			const picked: Picked[] = [];
			for (const f of Array.from(files).slice(0, room)) {
				const r = await resizeImage(f);
				picked.push({
					id: crypto.randomUUID(),
					...r,
					preview: URL.createObjectURL(r.file),
				});
			}
			setPhotos((prev) => [...prev, ...picked]);
			if (files.length > room) setError(t(lang, "contribute.err.tooMany"));
		} catch {
			setError(t(lang, "contribute.err.photoRead"));
		} finally {
			setStatus("idle");
		}
	}

	function removePhoto(id: string) {
		setPhotos((prev) => {
			const gone = prev.find((p) => p.id === id);
			if (gone) URL.revokeObjectURL(gone.preview);
			return prev.filter((p) => p.id !== id);
		});
	}

	async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError(null);
		if (kind === "photo" && photos.length === 0) {
			setError(t(lang, "contribute.err.photoRequired"));
			return;
		}
		const fd = new FormData(e.currentTarget);
		fd.delete("photo-picker");
		fd.set("lang", lang);
		fd.set("startedAt", String(startedAt.current));
		fd.set("dims", JSON.stringify(photos.map((p) => [p.width, p.height])));
		for (const p of photos) fd.append("photos", p.file);
		setStatus("sending");
		try {
			const res = await submitContribution({ data: fd });
			if (res.ok) {
				setStatus("done");
				form.current?.reset();
				for (const p of photos) URL.revokeObjectURL(p.preview);
				setPhotos([]);
				window.scrollTo({ top: 0, behavior: "smooth" });
			} else {
				setError(t(lang, errorKey[res.error]));
				setStatus("idle");
			}
		} catch {
			setError(t(lang, "contribute.err.server"));
			setStatus("idle");
		}
	}

	if (status === "done") {
		return (
			<>
				<PageHeader title={t(lang, "contribute.title")} />
				<section className="mx-auto max-w-2xl px-4 py-16 text-center">
					<p className="text-5xl" aria-hidden="true">
						🌾
					</p>
					<h2 className="mt-4 text-3xl font-semibold text-rice-900">
						{t(lang, "contribute.thanks")}
					</h2>
					<p className="mt-3 text-lg text-ink-soft">
						{t(lang, "contribute.thanksBody")}
					</p>
					<button
						type="button"
						onClick={() => {
							startedAt.current = Date.now();
							setStatus("idle");
						}}
						className="mt-8 rounded-full bg-rice-700 px-6 py-3 font-medium text-paper hover:bg-rice-900"
					>
						{t(lang, "contribute.another")}
					</button>
				</section>
			</>
		);
	}

	const busy = status !== "idle";
	const optional = (
		<span className="font-normal text-ink-soft">
			({t(lang, "contribute.optional")})
		</span>
	);

	return (
		<>
			<PageHeader
				title={t(lang, "contribute.title")}
				lead={t(lang, "contribute.lead")}
			/>
			<section className="mx-auto max-w-2xl px-4 py-10">
				<form
					ref={form}
					onSubmit={onSubmit}
					className="space-y-6"
					noValidate={false}
				>
					<fieldset>
						<legend className={label}>{t(lang, "contribute.kind")}</legend>
						<div className="flex flex-wrap gap-2">
							{KINDS.map((k) => (
								<label
									key={k}
									className={`cursor-pointer rounded-full px-4 py-2 text-sm font-medium transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-rice-500 ${
										kind === k
											? "bg-rice-700 text-paper"
											: "border border-earth-300 text-ink-soft hover:bg-rice-100"
									}`}
								>
									<input
										type="radio"
										name="kind"
										value={k}
										checked={kind === k}
										onChange={() => setKind(k)}
										className="sr-only"
									/>
									{pick(lang, kindLabel[k])}
								</label>
							))}
						</div>
					</fieldset>

					<div className="grid gap-6 sm:grid-cols-2">
						<div>
							<label htmlFor="name" className={label}>
								{t(lang, "contribute.name")}
							</label>
							<input
								id="name"
								name="name"
								required
								maxLength={120}
								autoComplete="name"
								className={input}
							/>
						</div>
						<div>
							<label htmlFor="village" className={label}>
								{t(lang, "contribute.village")} {optional}
							</label>
							<input
								id="village"
								name="village"
								maxLength={120}
								className={input}
							/>
						</div>
					</div>

					<div>
						<label htmlFor="contact" className={label}>
							{t(lang, "contribute.contact")} {optional}
						</label>
						<input
							id="contact"
							name="contact"
							maxLength={200}
							autoComplete="email"
							className={input}
							aria-describedby="contact-hint"
						/>
						<p id="contact-hint" className="mt-1 text-xs text-ink-soft">
							{t(lang, "contribute.contactHint")}
						</p>
					</div>

					<div>
						<label htmlFor="title" className={label}>
							{t(lang, "contribute.titleField")}
						</label>
						<input
							id="title"
							name="title"
							required
							maxLength={200}
							className={input}
						/>
					</div>

					<div>
						<label htmlFor="message" className={label}>
							{t(lang, "contribute.message")}
						</label>
						<textarea
							id="message"
							name="message"
							required
							maxLength={5000}
							rows={6}
							className={input}
							aria-describedby="message-hint"
						/>
						<p id="message-hint" className="mt-1 text-xs text-ink-soft">
							{t(lang, "contribute.messageHint")}
						</p>
					</div>

					<div>
						<span className={label}>
							{t(lang, "contribute.photos")} {kind !== "photo" && optional}
						</span>
						<div className="flex flex-wrap gap-3">
							{photos.map((p) => (
								<div key={p.id} className="relative">
									<img
										src={p.preview}
										alt=""
										className="h-24 w-24 rounded-xl object-cover ring-1 ring-earth-300"
									/>
									<button
										type="button"
										onClick={() => removePhoto(p.id)}
										aria-label={t(lang, "contribute.remove")}
										className="absolute -right-2 -top-2 grid h-7 w-7 place-items-center rounded-full bg-ink text-sm text-paper shadow"
									>
										✕
									</button>
								</div>
							))}
							{photos.length < LIMITS.maxPhotos && (
								<label className="grid h-24 w-24 cursor-pointer place-items-center rounded-xl border-2 border-dashed border-earth-300 text-center text-xs font-semibold text-earth-700 hover:bg-rice-100 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-rice-500">
									<span>
										<span className="block text-2xl" aria-hidden="true">
											＋
										</span>
										{t(lang, "contribute.addPhotos")}
									</span>
									<input
										type="file"
										name="photo-picker"
										accept={LIMITS.photoTypes.join(",")}
										multiple
										className="sr-only"
										disabled={busy}
										onChange={(e) => {
											void addPhotos(e.target.files);
											e.target.value = "";
										}}
									/>
								</label>
							)}
						</div>
						<p className="mt-2 text-xs text-ink-soft">
							{t(lang, "contribute.photosHint")}
						</p>
					</div>

					{/* Honeypot: hidden from people and screen readers, tempting for bots. */}
					<div
						aria-hidden="true"
						className="absolute -left-[9999px] h-px w-px overflow-hidden"
					>
						<label>
							Website
							<input
								type="text"
								name="website"
								tabIndex={-1}
								autoComplete="off"
							/>
						</label>
					</div>

					<label className="flex items-start gap-3 text-sm text-ink-soft">
						<input
							type="checkbox"
							name="consent"
							className="mt-1 h-4 w-4 accent-rice-700"
						/>
						<span>{t(lang, "contribute.consent")}</span>
					</label>

					{error && (
						<p
							role="alert"
							className="rounded-xl bg-lotus/15 px-4 py-3 text-sm font-medium text-lotus"
						>
							{error}
						</p>
					)}

					<button
						type="submit"
						disabled={busy}
						className="w-full rounded-full bg-rice-700 px-6 py-3 font-semibold text-paper transition hover:bg-rice-900 disabled:opacity-60 sm:w-auto"
					>
						{status === "processing"
							? t(lang, "contribute.processing")
							: status === "sending"
								? t(lang, "contribute.sending")
								: t(lang, "contribute.submit")}
					</button>
				</form>
			</section>
		</>
	);
}
