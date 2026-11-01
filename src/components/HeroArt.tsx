/** Hand-drawn style landscape: Mount Tùng, temple roof, rice terraces and the Lèn River. */
export function HeroArt({ className = "" }: { className?: string }) {
	return (
		<svg
			viewBox="0 0 800 420"
			className={className}
			role="img"
			aria-label="Núi Tùng, đền Bà Triệu và cánh đồng lúa"
			preserveAspectRatio="xMidYMid slice"
		>
			<defs>
				<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0" stopColor="#f7e3b5" />
					<stop offset="1" stopColor="#faf6ec" />
				</linearGradient>
				<linearGradient id="river" x1="0" y1="0" x2="1" y2="0">
					<stop offset="0" stopColor="#b9d3cf" />
					<stop offset="1" stopColor="#d7e6df" />
				</linearGradient>
			</defs>
			<rect width="800" height="420" fill="url(#sky)" />
			<circle cx="610" cy="110" r="46" fill="#f0b45b" opacity="0.85" />
			{/* distant hills */}
			<path
				d="M0 230 Q120 170 230 210 T470 200 T800 190 V420 H0Z"
				fill="#c8d6a6"
			/>
			{/* Mount Tùng */}
			<path d="M140 250 Q260 110 330 150 Q390 120 470 240 Z" fill="#7d9b4f" />
			<path d="M200 245 Q270 150 330 175 Q370 160 430 245 Z" fill="#6d9440" />
			{/* temple roof */}
			<g transform="translate(470 222)">
				<rect x="18" y="20" width="74" height="26" fill="#9b5a2c" />
				<path d="M0 22 Q55 -4 110 22 L100 26 Q55 6 10 26 Z" fill="#7a3b1f" />
				<path
					d="M-6 18 Q-2 12 6 14"
					stroke="#7a3b1f"
					strokeWidth="4"
					fill="none"
				/>
				<path
					d="M116 18 Q112 12 104 14"
					stroke="#7a3b1f"
					strokeWidth="4"
					fill="none"
				/>
				<rect x="47" y="30" width="16" height="16" fill="#3a2414" />
			</g>
			{/* fields */}
			<path d="M0 270 Q200 250 400 268 T800 260 V420 H0Z" fill="#a9c77a" />
			<path d="M0 300 Q220 282 420 300 T800 292 V420 H0Z" fill="#e2c46e" />
			<path d="M0 335 Q240 318 440 334 T800 328 V420 H0Z" fill="#c9a94f" />
			{/* river */}
			<path d="M0 372 Q200 356 420 372 T800 362 V420 H0Z" fill="url(#river)" />
			{/* rice rows */}
			<g stroke="#8a7a33" strokeWidth="1.4" opacity="0.45">
				{Array.from({ length: 26 }, (_, i) => i * 32).map((x) => (
					<line key={x} x1={x} y1={306} x2={x + 10} y2={330} />
				))}
			</g>
			{/* birds */}
			<g stroke="#5b5747" strokeWidth="2" fill="none" strokeLinecap="round">
				<path d="M520 70 q8 -8 16 0 q8 -8 16 0" />
				<path d="M570 95 q6 -6 12 0 q6 -6 12 0" />
			</g>
		</svg>
	);
}
