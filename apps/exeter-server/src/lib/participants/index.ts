import { PrismaParticipantRepository } from "./prisma-participant-repository";

export const participantRepository = new PrismaParticipantRepository();

export type {
  ParticipantDetail,
  ParticipantStimulus,
  ParticipantListItem,
  ParticipantRepository,
  ParticipantSession,
} from "./participant-repository";
