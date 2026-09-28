import assert from "node:assert/strict";
import test from "node:test";
import type { EventDetailDto, EventListItem } from "@/server/queries/events";
import {
  serializeEventDetail,
  serializeEventListItem,
} from "@/server/serializers/events";

test("event pages use the saved cover after an admin replaces it", () => {
  const event: EventListItem = {
    id: 57,
    title:
      "Дворяне, крестьяне, горожане: ищем корни на примерах из русской литературы",
    description: "",
    date: "2026-10-06",
    time: "",
    location: "",
    coverUrl: "/uploads/replaced-cover.jpg",
    maxParticipants: null,
    status: "open",
    createdBy: null,
    createdAt: new Date("2026-09-28T00:00:00Z"),
    participantCount: 0,
  };

  assert.equal(serializeEventListItem(event).coverUrl, event.coverUrl);
  const detail: EventDetailDto = { ...event, participants: [] };
  assert.equal(serializeEventDetail(detail).coverUrl, event.coverUrl);
});
