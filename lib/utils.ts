import type { JSONContent } from "@tiptap/react";
import { getPlainTextFromTiptap } from "./utils/richText";
export const date = (value: string) =>
  new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Europe/Istanbul",
  }).format(new Date(value));
export const readingTime = (content: JSONContent) =>
  Math.max(
    1,
    Math.ceil(
      getPlainTextFromTiptap(content).split(/\s+/).filter(Boolean).length / 200,
    ),
  );
export const initials = (name: string) =>
  name
    .split(" ")
    .map((x) => x[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
