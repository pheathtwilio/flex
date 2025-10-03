import React, { useState, useEffect } from 'react';
import { withTheme, Theme } from '@twilio/flex-ui';
import {
  Box,
  Text,
  Truncate,
  DataGrid,
  DataGridHead,
  DataGridHeader,
  DataGridBody,
  DataGridRow,
  DataGridCell,
} from '@twilio-paste/core/';

import { CalendarEvent, EventTypes } from '../types/CalendarEvents';

interface Props {
  visible: boolean;
  theme: Theme;
}

declare global {
  interface Window {
    google: any;
    gapi: any;
  }
}

const CalendarPanel: React.FC<Props> = ({ visible, theme }) => {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  // const [tokenClient, setTokenClient] = useState<any>(null);

  let tokenClient: any;
  let tokenClientReady: Promise<void> | null = null;
  const CLIENT_ID = '573589505278-sim0ajf18bcdqd31mjlh4h4bt2tpqqc5.apps.googleusercontent.com';
  const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly';

  let gapiLoaded: Promise<void> | null = null;

  // const loadScript = async (src: string): Promise<void> => {
  //   // eslint-disable-next-line consistent-return
  //   return new Promise((resolve, reject) => {
  //     // already present?
  //     const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
  //     if (existing) {
  //       existing.addEventListener('load', () => resolve());
  //       existing.addEventListener('error', (e) => reject(e));
  //       // if it's already loaded, resolve immediately
  //       if ((existing as any).readyState === 'complete') return resolve();
  //       if (window.gapi) return resolve();
  //       // eslint-disable-next-line consistent-return
  //       return;
  //     }

  //     const s = document.createElement('script');
  //     s.src = src;
  //     s.async = true;
  //     s.defer = true;
  //     s.onload = () => resolve();
  //     s.onerror = (e) => reject(e);
  //     document.head.appendChild(s);
  //   });
  // };

  const loadScript = async (src: string): Promise<void> => {
    // eslint-disable-next-line consistent-return
    return new Promise((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
      if (existing) {
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', (e) => reject(e));
        // If already loaded, resolve immediately
        if ((existing as any).readyState === 'complete' || (window.google && window.google.accounts)) {
          return resolve();
        }
        // eslint-disable-next-line consistent-return
        return;
      }
      const s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.defer = true;
      s.onload = () => resolve();
      s.onerror = (e) => reject(e);
      document.head.appendChild(s);
    });
  };

  const ensureGoogleIdentity = async (): Promise<void> => {
    if (typeof window === 'undefined') return; // SSR guard
    if (window.google?.accounts?.oauth2) return;

    await loadScript('https://accounts.google.com/gsi/client');

    // Wait until GIS attaches to window (some environments need a tick)
    const deadline = Date.now() + 10000; // 10s timeout
    while (!window.google?.accounts?.oauth2) {
      if (Date.now() > deadline) throw new Error('GIS failed to initialize');
      await new Promise((r) => setTimeout(r, 10));
    }
  };

  /** Ensure gapi.client is ready to use */
  const ensureGapiClient = async (): Promise<void> => {
    if (typeof window === 'undefined') return; // SSR guard

    if (!gapiLoaded) {
      gapiLoaded = (async () => {
        // 1) Load the gapi script
        await loadScript('https://apis.google.com/js/api.js');

        // 2) Wait for the client module
        // eslint-disable-next-line consistent-return
        await new Promise<void>((resolve, reject) => {
          if (!window.gapi) return reject(new Error('gapi not available after script load'));
          window.gapi.load('client', () => resolve());
        });

        // 3) Init the client (no discovery needed for token-only usage)
        await window.gapi.client.init({});
      })();
    }

    // eslint-disable-next-line consistent-return
    return gapiLoaded;
  };

  const initGapiClient = async () => {
    console.log(`initializing client`);
    await new Promise<void>((resolve) => window.gapi.load('client', () => resolve()));
    await window.gapi.client.init({});
  };

  const ensureTokenClient = async (onToken: (token: string) => void): Promise<void> => {
    if (tokenClient) return;

    if (!tokenClientReady) {
      tokenClientReady = (async () => {
        await ensureGoogleIdentity(); // load GIS script first
        tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: SCOPES,
          // callback will be (re)assigned just before requestAccessToken
          // eslint-disable-next-line no-empty-function
          callback: (_resp: any) => {},
        });
      })();
    }
    await tokenClientReady;

    // Always ensure the latest onToken is used:
    tokenClient.callback = (resp: { access_token?: string; error?: string }) => {
      if (resp?.access_token && !resp.error) onToken(resp.access_token);
    };
  };

  // const initTokenClient = () => {
  //   const client = (window as any).google.accounts.oauth2.initTokenClient({
  //     client_id: CLIENT_ID,
  //     scope: SCOPES,
  //     callback: (tokenResponse: any) => {
  //       if (tokenResponse.access_token) {
  //         setIsSignedIn(true);
  //         listEvents(tokenResponse.access_token);
  //       }
  //     },
  //   });
  //   setTokenClient(client);
  // };

  const initTokenClient = async (onToken: (token: string) => void) => {
    await ensureGoogleIdentity();
    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      // include_granted_scopes is on by default in GIS (grants are merged); no separate flag needed
      callback: (resp: { access_token?: string; error?: string }) => {
        if (resp && !resp.error && resp.access_token) {
          onToken(resp.access_token);
        }
      },
    });
  };

  const trySilentLogin = async (onToken: (t: string) => void) => {
    await initGapiClient();
    await ensureTokenClient(onToken);
    tokenClient!.requestAccessToken({ prompt: '' });
  };

  const interactiveLogin = async (onToken: (t: string) => void) => {
    await ensureTokenClient(onToken);
    tokenClient!.requestAccessToken({ prompt: 'consent' });
  };

  // useEffect(() => {
  //   // Load Google's new Identity Services client
  //   const script = document.createElement('script');
  //   script.src = 'https://accounts.google.com/gsi/client';
  //   script.onload = initTokenClient;
  //   document.body.appendChild(script);

  //   // Load gapi for Calendar API
  //   const gapiScript = document.createElement('script');
  //   gapiScript.src = 'https://apis.google.com/js/api.js';
  //   gapiScript.onload = () => {
  //     (window as any).gapi.load('client', async () => {
  //       await (window as any).gapi.client.init({
  //         discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
  //       });
  //     });
  //   };
  //   document.body.appendChild(gapiScript);
  // }, []);

  useEffect(() => {
    (async () => {
      try {
        await ensureGapiClient();
        trySilentLogin((accessToken) => {
          window.gapi.client.setToken({ access_token: accessToken });
          setIsSignedIn(true);
          listEvents(accessToken);
        });
      } catch (e) {
        console.error('Failed to init gapi client:', e);
      }
    })();
  }, []);

  const handleLogin = () => {
    interactiveLogin((accessToken) => {
      window.gapi.client.setToken({ access_token: accessToken });
      setIsSignedIn(true);
      listEvents(accessToken);
    });
  };

  const handleLogout = () => {
    setIsSignedIn(false);
    setEvents([]);
  };

  // ---- Helpers ----
  const parseGCalDate = (s?: string): Date | null => {
    if (!s) return null;
    const d = new Date(s);
    if (!Number.isNaN(d.getTime())) return d;
    // if it's a date-only "YYYY-MM-DD"
    const parts = s.split('-');
    if (parts.length === 3) {
      const [y, m, day] = parts.map(Number);
      return new Date(y, m - 1, day, 0, 0, 0, 0);
    }
    return null;
  };

  const normalizeEvent = (e: any) => {
    const start = parseGCalDate(e.start?.dateTime ?? e.start?.date);
    let end = parseGCalDate(e.end?.dateTime ?? e.end?.date);

    // Google all-day events: end is exclusive at next-day 00:00 → include the full day
    if (e.start?.date && e.end?.date && end) {
      end = new Date(end.getTime() - 1);
    }
    return { ...e, _start: start!, _end: end! };
  };

  const overlaps = (aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) => aStart < bEnd && bStart < aEnd;

  const ensureCalendarAPI = async (): Promise<void> => {
    await ensureGapiClient();
    // eslint-disable-next-line no-useless-return
    if (window.gapi?.client?.events) return;
    await window.gapi.client.load('https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest');
  };

  const listEvents = async (accessToken: string) => {
    (window as any).gapi.client.setToken({ access_token: accessToken });

    await ensureCalendarAPI();

    const { timeMin, timeMax } = getWeekBounds();

    const items: any[] = [];
    let pageToken: string | undefined = undefined;

    do {
      const response: any = await (window as any).gapi.client.calendar.events.list({
        calendarId: 'primary',
        timeMin,
        timeMax,
        singleEvents: true,
        orderBy: 'startTime',
        maxResults: 2500,
        pageToken,
        showDeleted: false,
      });
      items.push(...(response.result.items || []));
      pageToken = response.result.nextPageToken || undefined;
    } while (pageToken);

    const defaultEvents = items.filter((event: any) => event.eventType === EventTypes.DEFAULT);

    const normalized = defaultEvents
      .map(normalizeEvent)
      .filter((e: CalendarEvent) => e.start && e.end)
      .sort((a: CalendarEvent, b: CalendarEvent) => {
        const aTime = a.start.dateTime ? new Date(a.start.dateTime).getTime() : 0;
        const bTime = b.start.dateTime ? new Date(b.start.dateTime).getTime() : 0;
        return aTime - bTime;
      });

    setEvents(normalized);
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const daysIdx = Array.from({ length: 7 }, (_, i) => i);

  const getWeekStart = (date: Date = new Date()): Date => {
    const d = new Date(date);
    const day = d.getDay(); // 0=Sun
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - day);
    return d;
  };

  const getWeekBounds = (now: Date = new Date()) => {
    const weekStart = getWeekStart();
    const weekend = new Date(weekStart);
    weekend.setDate(weekend.getDate() + 7);
    return { weekStart, weekend, timeMin: weekStart.toISOString(), timeMax: weekend.toISOString() };
  };

  const weekStart = React.useMemo(() => getWeekStart(new Date()), []);
  const dayDates = React.useMemo(() => {
    return daysIdx.map((i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      return d;
    });
  }, [weekStart]);

  const getSlotRange = (dayIndex: number, hour: number) => {
    const start = new Date(weekStart);
    start.setDate(weekStart.getDate() + dayIndex);
    start.setHours(hour, 0, 0, 0);
    const end = new Date(start);
    end.setHours(start.getHours() + 1);
    return { start, end };
  };

  const ROW_HEIGHT = '64px';
  const COL_WIDTH = '72px';

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Google Calendar</h2>
      {!isSignedIn && <button onClick={handleLogin}>Login with Google</button>}
      {isSignedIn && (
        <div>
          <button onClick={handleLogout}>Logout</button>
          <DataGrid aria-label="Time" style={{ tableLayout: 'fixed', width: '100%' }} striped>
            <colgroup>
              <col style={{ width: COL_WIDTH }} />
              {Array.from({ length: 7 }).map((_, i) => (
                <col key={i} />
              ))}
            </colgroup>
            <DataGridHead>
              <DataGridRow>
                {/* <-- This 'Time' header fixes the alignment issue */}
                <DataGridHeader>Time</DataGridHeader>

                {/* Day headers */}
                {dayDates.map((d, idx) => (
                  <DataGridHeader key={idx}>
                    {d.toLocaleDateString(undefined, {
                      weekday: 'short',
                      month: 'numeric',
                      day: 'numeric',
                    })}
                  </DataGridHeader>
                ))}
              </DataGridRow>
            </DataGridHead>
            <DataGridBody>
              {hours.map((h) => (
                <DataGridRow key={h}>
                  {/* Hour label */}
                  <DataGridCell>
                    <Box height={ROW_HEIGHT} display="flex" alignItems="center" width={COL_WIDTH}>
                      {`${h.toString().padStart(2, '0')}:00`}
                    </Box>
                  </DataGridCell>
                  {/* Cells for each day */}
                  {daysIdx.map((dayIdx) => {
                    const { start: slotStart, end: slotEnd } = getSlotRange(dayIdx, h);

                    const cellEvents = events.filter((ev) => overlaps(slotStart, slotEnd, ev._start, ev._end));

                    return (
                      <DataGridCell key={`${dayIdx}-${h}`}>
                        {/* Fixed cell size */}
                        <Box height={ROW_HEIGHT} overflow="hidden" width={COL_WIDTH}>
                          {/* Vertical stack that fills the cell; each event flexes equally */}
                          <Box display="flex" flexDirection="column" height="100%">
                            {cellEvents.length > 0 ? (
                              cellEvents.map((ev) => {
                                const isAllDay = Boolean(ev.start?.date) && !ev.start?.dateTime;
                                return (
                                  <Box
                                    key={ev.id}
                                    flex="1 1 0"
                                    display="flex"
                                    alignItems="center"
                                    justifyContent="center"
                                    padding="space20"
                                    borderWidth="borderWidth10"
                                    borderStyle="solid"
                                    borderColor="colorBorderWeak"
                                    borderRadius="borderRadius20"
                                    backgroundColor="colorBackground"
                                    overflow="hidden"
                                    title={
                                      isAllDay
                                        ? `${ev.summary ?? '(No title)'} — All-day`
                                        : `${ev.summary ?? '(No title)'}`
                                    }
                                  >
                                    {/* Single-line, truncated label so it doesn't overflow */}
                                    <Truncate title={ev.summary ?? '(No title)'}>
                                      <Text as="span" fontSize="fontSize20" fontWeight="fontWeightSemibold">
                                        {ev.summary ?? '(No title)'}
                                      </Text>
                                    </Truncate>
                                  </Box>
                                );
                              })
                            ) : (
                              // Keep an empty flex filler so all rows stay the same height
                              <Box flex="1 1 0" />
                            )}
                          </Box>
                        </Box>
                      </DataGridCell>
                    );
                  })}
                </DataGridRow>
              ))}
            </DataGridBody>
          </DataGrid>
          {/* <ul>
              {events.map((event) => (
                <li key={event.id}>
                  <strong>{event.summary}</strong> <br />
                  {event.start?.dateTime || event.start?.date} → {event.end?.dateTime || event.end?.date}
                </li>
              ))}
            </ul> */}
          {/* </div> */}
        </div>
      )}
    </div>
  );
};

export default withTheme(CalendarPanel);
