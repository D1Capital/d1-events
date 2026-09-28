import type {
  EventDetailResponse,
  EventListItemResponse,
  EventMutationResponse,
} from "@/contracts/events";
import type { Event } from "@/db/schema";
import type { EventDetailDto, EventListItem } from "@/server/queries/events";

export function serializeEventListItem(
  event: EventListItem,
): EventListItemResponse {
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    date: event.date,
    time: event.time,
    location: event.location,
    coverUrl: event.coverUrl,
    maxParticipants: event.maxParticipants,
    status: event.status,
    createdBy: event.createdBy,
    createdAt: event.createdAt.toISOString(),
    participantCount: event.participantCount,
  };
}

export function serializeEventMutation(event: Event): EventMutationResponse {
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    date: event.date,
    time: event.time,
    location: event.location,
    coverUrl: event.coverUrl,
    maxParticipants: event.maxParticipants,
    status: event.status,
    createdBy: event.createdBy,
    createdAt: event.createdAt.toISOString(),
  };
}

export function serializeEventDetail(
  event: EventDetailDto,
): EventDetailResponse {
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    date: event.date,
    time: event.time,
    location: event.location,
    coverUrl: event.coverUrl,
    maxParticipants: event.maxParticipants,
    status: event.status,
    createdBy: event.createdBy,
    createdAt: event.createdAt.toISOString(),
    participantCount: event.participantCount,
    participants: event.participants.map((participant) => ({
      id: participant.id,
      firstName: participant.firstName,
      lastName: participant.lastName || "",
      username: participant.username || "",
      photoUrl: participant.photoUrl || "",
      registeredAt: participant.registeredAt.toISOString(),
    })),
  };
}
