import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
	findPublishedStory,
	listPublished,
	type PublishedItem,
} from "./published-queries";

export type { PublishedItem };

// Only server functions are exported here: their handler bodies (and therefore the
// database imports they use) are stripped from the browser build.
export const getPublishedStories = createServerFn({ method: "GET" }).handler(
	() => listPublished("story", 50),
);
export const getPublishedEvents = createServerFn({ method: "GET" }).handler(
	() => listPublished("event", 100),
);
export const getPublishedBusinesses = createServerFn({ method: "GET" }).handler(
	() => listPublished("business", 200),
);

export const getPublishedStory = createServerFn({ method: "GET" })
	.validator((input: unknown) =>
		z.object({ id: z.number().int().positive() }).parse(input),
	)
	.handler(({ data }) => findPublishedStory(data.id));
