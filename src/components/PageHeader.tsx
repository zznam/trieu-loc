export function PageHeader({
	title,
	lead,
	kicker,
}: {
	title: string;
	lead?: string;
	kicker?: string;
}) {
	return (
		<header className="grain border-b border-earth-300/40 bg-paper-2">
			<div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
				{kicker && (
					<p className="mb-2 text-sm font-semibold uppercase tracking-widest text-earth-700">
						{kicker}
					</p>
				)}
				<h1 className="text-3xl font-semibold text-rice-900 sm:text-5xl">
					{title}
				</h1>
				{lead && <p className="mt-4 max-w-2xl text-lg text-ink-soft">{lead}</p>}
			</div>
		</header>
	);
}

export function SampleNote({ children }: { children: string }) {
	return (
		<p className="inline-flex items-center gap-2 rounded-full bg-earth-300/30 px-3 py-1 text-xs font-medium text-earth-700">
			<span aria-hidden="true">✎</span>
			{children}
		</p>
	);
}
