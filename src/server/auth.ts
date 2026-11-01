import { createHmac, timingSafeEqual } from "node:crypto";
import {
	deleteCookie,
	getCookie,
	setCookie,
} from "@tanstack/react-start/server";

const COOKIE = "tl_admin";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export function isAdminConfigured() {
	return Boolean(process.env.ADMIN_PASSWORD);
}

/**
 * The session token is an HMAC derived from ADMIN_PASSWORD, so changing the password
 * in Vercel instantly signs everyone out — no session table needed.
 */
function sessionToken(password: string) {
	return createHmac("sha256", password)
		.update("trieu-loc-admin-session-v1")
		.digest("hex");
}

function safeEqual(a: string, b: string) {
	const ab = Buffer.from(a);
	const bb = Buffer.from(b);
	return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export function checkPassword(candidate: string) {
	const password = process.env.ADMIN_PASSWORD;
	if (!password) return false;
	// Compare HMACs so the comparison is constant-time regardless of input length.
	return safeEqual(sessionToken(candidate), sessionToken(password));
}

export function startSession() {
	const password = process.env.ADMIN_PASSWORD;
	if (!password) throw new Error("ADMIN_PASSWORD is not set");
	setCookie(COOKIE, sessionToken(password), {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		path: "/",
		maxAge: MAX_AGE,
	});
}

export function endSession() {
	deleteCookie(COOKIE, { path: "/" });
}

export function isAdminRequest() {
	const password = process.env.ADMIN_PASSWORD;
	const token = getCookie(COOKIE);
	return Boolean(password && token && safeEqual(token, sessionToken(password)));
}

export function requireAdmin() {
	if (!isAdminRequest()) throw new Error("UNAUTHORIZED");
}
