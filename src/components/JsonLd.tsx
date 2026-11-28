import { ldJson } from "#/lib/structured-data";

export function JsonLd({
	data,
}: {
	data: Record<string, unknown> | Record<string, unknown>[];
}) {
	return (
		<script
			type="application/ld+json"
			// biome-ignore lint/security/noDangerouslySetInnerHtml: JSON with <, > and & escaped
			dangerouslySetInnerHTML={{ __html: ldJson(data) }}
		/>
	);
}
