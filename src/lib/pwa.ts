/** Registers the service worker in production builds only (dev reloads would fight the cache). */
export function registerServiceWorker() {
	if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;
	const register = () =>
		navigator.serviceWorker
			.register("/sw.js")
			.catch((err) => console.warn("SW registration failed", err));
	// Register after load so it never competes with the first page render.
	if (document.readyState === "complete") register();
	else window.addEventListener("load", register, { once: true });
}

type InstallEvent = Event & {
	prompt: () => Promise<void>;
	userChoice: Promise<{ outcome: string }>;
};

let deferred: InstallEvent | null = null;
const listeners = new Set<(available: boolean) => void>();

if (typeof window !== "undefined") {
	window.addEventListener("beforeinstallprompt", (e) => {
		e.preventDefault(); // keep the browser's mini-infobar quiet; we show our own button
		deferred = e as InstallEvent;
		for (const l of listeners) l(true);
	});
	window.addEventListener("appinstalled", () => {
		deferred = null;
		for (const l of listeners) l(false);
	});
}

export function onInstallAvailable(cb: (available: boolean) => void) {
	listeners.add(cb);
	cb(deferred !== null);
	return () => listeners.delete(cb);
}

export async function promptInstall() {
	if (!deferred) return false;
	await deferred.prompt();
	const { outcome } = await deferred.userChoice;
	deferred = null;
	for (const l of listeners) l(false);
	return outcome === "accepted";
}
