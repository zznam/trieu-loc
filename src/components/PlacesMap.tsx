import "leaflet/dist/leaflet.css";
import { type ComponentProps, useEffect, useState } from "react";
import {
	CircleMarker,
	GeoJSON,
	MapContainer,
	Popup,
	TileLayer,
	useMap,
} from "react-leaflet";
import { type Place, placeCategoryLabel } from "#/lib/content";
import { type Lang, pick, t } from "#/lib/i18n";

type GeoData = ComponentProps<typeof GeoJSON>["data"];

const COLORS = {
	relic: "#c2543f",
	nature: "#6d9440",
	public: "#b5813f",
} as const;

function FlyTo({ target }: { target?: [number, number] }) {
	const map = useMap();
	useEffect(() => {
		if (target) map.flyTo(target, 15, { duration: 0.8 });
	}, [map, target]);
	return null;
}

export default function PlacesMap({
	lang,
	places,
	center,
	focus,
}: {
	lang: Lang;
	places: Place[];
	center: [number, number];
	focus?: [number, number];
}) {
	const [boundary, setBoundary] = useState<GeoData | null>(null);
	useEffect(() => {
		fetch("/data/boundary.geojson")
			.then((r) => (r.ok ? r.json() : null))
			.then(setBoundary)
			.catch(() => setBoundary(null));
	}, []);

	return (
		<MapContainer
			center={center}
			zoom={13}
			scrollWheelZoom={false}
			className="h-[420px] w-full sm:h-[520px]"
		>
			<TileLayer
				attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
				url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
			/>
			{boundary && (
				<GeoJSON
					data={boundary}
					style={{
						color: "#3f5f23",
						weight: 2,
						fillColor: "#a9c77a",
						fillOpacity: 0.12,
						dashArray: "6 4",
					}}
				/>
			)}
			{places.map((p) => (
				<CircleMarker
					key={p.id}
					center={p.coords}
					radius={9}
					pathOptions={{
						color: "#fff",
						weight: 2,
						fillColor: COLORS[p.category],
						fillOpacity: 0.95,
					}}
				>
					<Popup>
						<strong>{pick(lang, p.name)}</strong>
						<br />
						<span>{pick(lang, placeCategoryLabel[p.category])}</span>
						{p.approx && (
							<>
								<br />
								<em>{t(lang, "common.approxLocation")}</em>
							</>
						)}
					</Popup>
				</CircleMarker>
			))}
			<FlyTo target={focus} />
		</MapContainer>
	);
}
