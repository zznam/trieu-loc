import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "#/components/PageHeader";
import { site } from "#/lib/content";
import {
	type EventCategory,
	eventCategoryLabel,
	googleCalendarUrl,
	type Occurrence,
	upcomingEvents,
} from "#/lib/events";
import { type Lang, pick, t } from "#/lib/i18n";
import { solarToLunar, todayInVietnam, yearName } from "#/lib/lunar";
import { seo } from "#/lib/seo";

export const Route = createFileRoute("/$lang/events")({
	head: ({ params }) => {
		const lang = params.lang as Lang;
		return seo(
			lang,
			t(lang, "events.title"),
			t(lang, "events.lead"),
			"/events",
			"events",
		);
	},
	component: EventsPage,
});

const CATEGORIES: (EventCategory | "all")[] = [
	"all",
	"festival",
	"holiday",
	"community",
];
const DOT: Record<EventCategory, string> = {
	festival: "bg-lotus",
	holiday: "bg-earth-500",
	community: "bg-rice-500",
};

function monthLabel(lang: Lang, o: Occurrence) {
	return new Date(
		Date.UTC(o.start.year, o.start.month - 1, 1),
	).toLocaleDateString(lang === "vi" ? "vi-VN" : "en-GB", {
		month: "long",
		year: "numeric",
		timeZone: "UTC",
	});
}

function weekday(lang: Lang, o: Occurrence) {
	return new Date(
		Date.UTC(o.start.year, o.start.month - 1, o.start.day),
	).toLocaleDateString(lang === "vi" ? "vi-VN" : "en-GB", {
		weekday: "short",
		timeZone: "UTC",
	});
}

function lunarText(lang: Lang, o: Occurrence) {
	const fmt = (l: { day: number; month: number; leap: boolean }) =>
		`${l.day}/${l.month}${l.leap ? ` ${t(lang, "events.leap")}` : ""}`;
	const end = solarToLunar(o.end);
	const range =
		o.startsAt + 86_400_000 < o.endsAt
			? `${fmt(o.lunar)} – ${fmt(end)}`
			: fmt(o.lunar);
	return `${range} ${t(lang, "events.lunarDate")}`;
}

function EventsPage() {
	const lang = Route.useParams().lang as Lang;
	const [cat, setCat] = useState<EventCategory | "all">("all");
	// Re-evaluate "now" on the client so a cached page never shows finished events as upcoming.
	const [now, setNow] = useState(() => new Date());
	useEffect(() => setNow(new Date()), []);

	const today = todayInVietnam(now);
	const todayLunar = solarToLunar(today);
	const occurrences = useMemo(() => upcomingEvents(now), [now]);
	const shown = occurrences.filter(
		(o) => cat === "all" || o.event.category === cat,
	);

	const groups: { label: string; items: Occurrence[] }[] = [];
	for (const o of shown) {
		const label = monthLabel(lang, o);
		const last = groups.at(-1);
		if (last?.label === label) last.items.push(o);
		else groups.push({ label, items: [o] });
	}

	return (
		<>
			<PageHeader
				title={t(lang, "events.title")}
				lead={t(lang, "events.lead")}
			/>
			<section className="mx-auto max-w-4xl px-4 py-10">
				<p className="mb-6 inline-flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl bg-paper-2 px-4 py-3 text-sm text-ink-soft">
					<span className="font-semibold text-rice-900">
						{t(lang, "events.today")}:
					</span>
					<span suppressHydrationWarning>
						{today.day}/{today.month}/{today.year}
					</span>
					<span aria-hidden="true">·</span>
					<span suppressHydrationWarning>
						{todayLunar.day}/{todayLunar.month}
						{todayLunar.leap ? ` ${t(lang, "events.leap")}` : ""}{" "}
						{t(lang, "events.lunarDate")}, {t(lang, "events.year")}{" "}
						{yearName(todayLunar.year)}
					</span>
				</p>

				<div className="mb-8 flex flex-wrap gap-2">
					{CATEGORIES.map((c) => (
						<button
							key={c}
							type="button"
							aria-pressed={cat === c}
							onClick={() => setCat(c)}
							className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
								cat === c
									? "bg-rice-700 text-paper"
									: "border border-earth-300 text-ink-soft hover:bg-rice-100"
							}`}
						>
							{c !== "all" && (
								<span className={`h-2 w-2 rounded-full ${DOT[c]}`} />
							)}
							{c === "all"
								? t(lang, "places.filter.all")
								: pick(lang, eventCategoryLabel[c])}
						</button>
					))}
				</div>

				{groups.map((g) => (
					<div key={g.label} className="mb-10">
						<h2 className="mb-4 text-xl font-semibold capitalize text-rice-900">
							{g.label}
						</h2>
						<ol className="space-y-4">
							{g.items.map((o) => {
								const ongoing =
									now.getTime() >= o.startsAt && now.getTime() < o.endsAt;
								return (
									<li
										key={`${o.event.id}-${o.start.year}`}
										className="flex gap-4 rounded-2xl border border-earth-300/50 bg-card/70 p-4 sm:p-5"
									>
										<div className="w-16 shrink-0 rounded-xl bg-paper-2 py-2 text-center">
											<span className="block text-[11px] font-semibold uppercase text-earth-700">
												{weekday(lang, o)}
											</span>
											<span className="block font-serif text-3xl font-semibold leading-none text-rice-900">
												{o.start.day}
											</span>
											<span className="mt-1 block text-[11px] text-ink-soft">
												{t(lang, "events.month")} {o.start.month}
											</span>
										</div>
										<div className="min-w-0 flex-1">
											<div className="flex flex-wrap items-center gap-2">
												<span
													className={`h-2 w-2 rounded-full ${DOT[o.event.category]}`}
													aria-hidden="true"
												/>
												<span className="text-xs font-semibold uppercase tracking-widest text-earth-700">
													{pick(lang, eventCategoryLabel[o.event.category])}
												</span>
												{ongoing && (
													<span className="rounded-full bg-lotus px-2 py-0.5 text-xs font-semibold text-white">
														{t(lang, "events.ongoing")}
													</span>
												)}
											</div>
											<h3 className="mt-1 text-lg font-semibold text-rice-900">
												{pick(lang, o.event.title)}
											</h3>
											<p className="mt-1 text-sm text-ink-soft">
												{lunarText(lang, o)}
												{" · "}
												{pick(lang, o.event.location)}
											</p>
											<p className="mt-2 text-ink-soft">
												{pick(lang, o.event.body)}
											</p>
											<div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-soft">
												{!o.event.date.year && (
													<span>
														↻{" "}
														{o.event.date.calendar === "lunar"
															? t(lang, "events.repeatsLunar")
															: t(lang, "events.repeatsSolar")}
													</span>
												)}
												<a
													href={googleCalendarUrl(
														o,
														pick(lang, o.event.title),
														pick(lang, o.event.body),
														pick(lang, o.event.location),
													)}
													target="_blank"
													rel="noreferrer"
													className="font-semibold text-rice-700 hover:underline"
												>
													📅 {t(lang, "events.add")}
												</a>
											</div>
										</div>
									</li>
								);
							})}
						</ol>
					</div>
				))}

				<p className="mt-4 rounded-2xl bg-rice-700 p-6 text-paper">
					{t(lang, "events.suggest")}{" "}
					<a
						className="font-semibold underline"
						href={`mailto:${site.contact.email}`}
					>
						{site.contact.email}
					</a>
				</p>
			</section>
		</>
	);
}
