/** Round portrait; falls back to initials on a warm background when there's no photo. */
export function Avatar({
	name,
	photo,
	size = 96,
}: {
	name: string;
	photo?: string;
	size?: number;
}) {
	if (photo) {
		return (
			<img
				src={photo}
				alt={name}
				width={size}
				height={size}
				loading="lazy"
				className="shrink-0 rounded-full object-cover ring-2 ring-earth-300/60"
				style={{ width: size, height: size }}
			/>
		);
	}
	const initials = name
		.replace(/\(.*?\)/g, "")
		.trim()
		.split(/\s+/)
		.slice(-2)
		.map((w) => w[0])
		.join("")
		.toUpperCase();
	return (
		<span
			aria-hidden="true"
			className="grid shrink-0 place-items-center rounded-full bg-rice-100 font-serif font-semibold text-rice-900 ring-2 ring-earth-300/60"
			style={{ width: size, height: size, fontSize: size * 0.34 }}
		>
			{initials}
		</span>
	);
}
