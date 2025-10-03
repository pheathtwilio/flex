export interface CalendarEvent {
  kind: 'calendar#event';
  etag: string;
  id: string;
  status: string;
  htmlLink: string;
  created: string; // ISO datetime
  updated: string; // ISO datetime
  summary?: string;
  description?: string;
  location?: string;
  colorId?: string;
  creator: EventUser;
  organizer: EventUser;
  start: EventDateTime;
  end: EventDateTime;
  endTimeUnspecified?: boolean;
  recurrence?: string[];
  recurringEventId?: string;
  originalStartTime?: EventDateTime;
  transparency?: string;
  visibility?: string;
  iCalUID: string;
  sequence: number;
  attendees?: EventAttendee[];
  attendeesOmitted?: boolean;
  extendedProperties?: ExtendedProperties;
  hangoutLink?: string;
  conferenceData?: ConferenceData;
  gadget?: EventGadget;
  anyoneCanAddSelf?: boolean;
  guestsCanInviteOthers?: boolean;
  guestsCanModify?: boolean;
  guestsCanSeeOtherGuests?: boolean;
  privateCopy?: boolean;
  locked?: boolean;
  reminders?: EventReminders;
  source?: EventSource;
  workingLocationProperties?: WorkingLocationProperties;
  outOfOfficeProperties?: OutOfOfficeProperties;
  focusTimeProperties?: FocusTimeProperties;
  attachments?: EventAttachment[];
  birthdayProperties?: BirthdayProperties;
  eventType?: string;
}

export interface EventUser {
  id?: string;
  email?: string;
  displayName?: string;
  self?: boolean;
}

export interface EventDateTime {
  date?: string; // YYYY-MM-DD
  dateTime?: string; // ISO datetime
  timeZone?: string;
}

export interface EventAttendee {
  id?: string;
  email?: string;
  displayName?: string;
  organizer?: boolean;
  self?: boolean;
  resource?: boolean;
  optional?: boolean;
  responseStatus?: string;
  comment?: string;
  additionalGuests?: number;
}

export interface ExtendedProperties {
  private?: Record<string, string>;
  shared?: Record<string, string>;
}

export interface ConferenceData {
  createRequest?: {
    requestId: string;
    conferenceSolutionKey: { type: string };
    status: { statusCode: string };
  };
  entryPoints?: ConferenceEntryPoint[];
  conferenceSolution?: {
    key: { type: string };
    name: string;
    iconUri: string;
  };
  conferenceId?: string;
  signature?: string;
  notes?: string;
}

export interface ConferenceEntryPoint {
  entryPointType: string;
  uri?: string;
  label?: string;
  pin?: string;
  accessCode?: string;
  meetingCode?: string;
  passcode?: string;
  password?: string;
}

export interface EventGadget {
  type: string;
  title: string;
  link: string;
  iconLink?: string;
  width?: number;
  height?: number;
  display?: string;
  preferences?: Record<string, string>;
}

export interface EventReminders {
  useDefault: boolean;
  overrides?: { method: string; minutes: number }[];
}

export interface EventSource {
  url: string;
  title: string;
}

export interface WorkingLocationProperties {
  type: string;
  homeOffice?: unknown;
  customLocation?: { label: string };
  officeLocation?: {
    buildingId?: string;
    floorId?: string;
    floorSectionId?: string;
    deskId?: string;
    label?: string;
  };
}

export interface OutOfOfficeProperties {
  autoDeclineMode?: string;
  declineMessage?: string;
}

export interface FocusTimeProperties {
  autoDeclineMode?: string;
  declineMessage?: string;
  chatStatus?: string;
}

export interface EventAttachment {
  fileUrl: string;
  title: string;
  mimeType: string;
  iconLink?: string;
  fileId?: string;
}

export interface BirthdayProperties {
  contact?: string;
  type?: string;
  customTypeName?: string;
}

export const EventTypes = Object.freeze({
  BIRTHDAY: 'birthday',
  DEFAULT: 'default',
  FOCUS_TIME: 'focusTime',
  FROM_GMAIL: 'fromGmail',
  OUT_OF_OFFICE: 'outOfOffice',
  WORKING_LOCATION: 'workingLocation',
});
