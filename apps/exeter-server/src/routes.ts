export const PATH_HOME = "/";
export const PATH_SIGN_IN = "/auth/sign-in";
export const PATH_DASHBOARD = "/dashboard";
export const PATH_MODELS = "/models";
export const PATH_SURVEYS = "/surveys";
export const PATH_STIMULI = "/stimuli";
export const PATH_PARTICIPANTS = "/participants";
export const PATH_SESSIONS = "/sessions";
export const PATH_EVENTS = "/event";
export const PATH_USERS = "/users";

export const PATH_NEW_MODEL = `${PATH_MODELS}/new`;
export const PATH_NEW_SURVEY = `${PATH_SURVEYS}/new`;
export const PATH_NEW_STIMULUS = `${PATH_STIMULI}/new`;
export const PATH_NEW_USER = `${PATH_USERS}/new`;

export function getUserPath(userId: string): string {
  return `${PATH_USERS}/${encodeURIComponent(userId)}`;
}

export function getModelPath(modelId: string): string {
  return `${PATH_MODELS}/${encodeURIComponent(modelId)}`;
}

export function getSurveyPath(surveyId: string): string {
  return `${PATH_SURVEYS}/${encodeURIComponent(surveyId)}`;
}

export function getStimulusPath(stimulusId: string): string {
  return `${PATH_STIMULI}/${encodeURIComponent(stimulusId)}`;
}

export function getParticipantPath(participantId: string): string {
  return `${PATH_PARTICIPANTS}/${encodeURIComponent(participantId)}`;
}

export function getSessionPath(sessionId: string): string {
  return `${PATH_SESSIONS}/${encodeURIComponent(sessionId)}`;
}

export function getSessionRrwebEventsPath(sessionId: string): string {
  return `${getSessionPath(sessionId)}/rrweb-events`;
}

export function getSessionEventsPath(sessionId: string): string {
  return `${getSessionPath(sessionId)}/events`;
}

export function getEventPath(eventId: string): string {
  return `${PATH_EVENTS}/${encodeURIComponent(eventId)}`;
}
