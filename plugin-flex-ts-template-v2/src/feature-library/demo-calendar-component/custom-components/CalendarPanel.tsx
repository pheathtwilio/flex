import React, { useState, useEffect } from 'react';
import { withTheme, Theme } from '@twilio/flex-ui';
import {
  Box,
  DataGrid,
  DataGridHead,
  DataGridHeader,
  DataGridBody,
  DataGridRow,
  DataGridCell,
} from '@twilio-paste/core/';

import { setSelection, clearSelection } from '../types/CalendarSelectionStore';
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

const CalendarPanel: React.FC<Props> = () => {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [events, setEvents] = useState<any[]>([]);

  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{
    start: Date;
    end: Date;
    dayIndex: number;
    hour: number;
  } | null>(null);
  const [selectedEvents, setSelectedEvents] = useState<any[]>([]);

  let tokenClient: any;
  let tokenClientReady: Promise<void> | null = null;
  const CLIENT_ID = '573589505278-sim0ajf18bcdqd31mjlh4h4bt2tpqqc5.apps.googleusercontent.com';
  const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly';

  let gapiLoaded: Promise<void> | null = null;

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

  const trySilentLogin = async (onToken: (t: string) => void) => {
    await initGapiClient();
    await ensureTokenClient(onToken);
    tokenClient!.requestAccessToken({ prompt: '' });
  };

  const interactiveLogin = async (onToken: (t: string) => void) => {
    await ensureTokenClient(onToken);
    tokenClient!.requestAccessToken({ prompt: 'consent' });
  };

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
    setIsDetailsOpen(false);
    setSelectedSlot(null);
    setSelectedEvents([]);
    // Clear the details panel
    clearSelection();
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

  const getWeekBounds = () => {
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

  const ROW_HEIGHT = '64px';
  const COL_WIDTH = '72px';

  const ROW_HEIGHT_PX = 64; // numeric px value for calculations
  const DAY_COLUMN_HEIGHT_PX = ROW_HEIGHT_PX * 24;

  const [measuredDayHeight, setMeasuredDayHeight] = React.useState<number>(DAY_COLUMN_HEIGHT_PX);
  const dayColumnRef = React.useRef<HTMLElement | null>(null);

  // measure actual rendered height of a day column (useLayoutEffect for synchronous measurement)
  React.useLayoutEffect(() => {
    const el = dayColumnRef.current;
    if (!el) return;

    // set initial measurement
    setMeasuredDayHeight(el.clientHeight);

    // watch for resizes
    const ro = new ResizeObserver(() => {
      setMeasuredDayHeight(el.clientHeight);
    });
    ro.observe(el);

    // eslint-disable-next-line consistent-return
    return () => ro.disconnect();
  }, []);

  const computeEventPositionForDay = (ev: any, dayStart: Date) => {
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const evStart = ev._start;
    const evEnd = ev._end;

    // if no overlap with this day, return null
    if (evEnd <= dayStart || evStart >= dayEnd) return null;

    // clamp to day boundaries
    const start = evStart < dayStart ? dayStart : evStart;
    const end = evEnd > dayEnd ? dayEnd : evEnd;

    // compute minutes-from-midnight in local time
    const minutesFromDayStart =
      start.getHours() * 60 + start.getMinutes() + start.getSeconds() / 60 + start.getMilliseconds() / 60000;

    const endMinutes = end.getHours() * 60 + end.getMinutes() + end.getSeconds() / 60 + end.getMilliseconds() / 60000;

    const durationMinutes = Math.max(1, endMinutes - minutesFromDayStart);

    // IMPORTANT: use measuredDayHeight (actual DOM height) not the hard-coded constant
    const dayHeightPx = measuredDayHeight || DAY_COLUMN_HEIGHT_PX;

    const hourBlocksPx = dayHeightPx / 24;
    const hourOfEvent = Math.floor(minutesFromDayStart / 60);
    const minuteOfEvent = Math.floor(minutesFromDayStart % 60);

    const topPx = hourOfEvent * hourBlocksPx + Math.ceil(minuteOfEvent / 60) * hourBlocksPx;
    const heightPx = (durationMinutes / 60) * hourBlocksPx;

    return { topPx, heightPx, start, end };
  };

  // --- NEW: compute layout for every day in one top-level useMemo to preserve hook order ---
  const layoutByDay = React.useMemo(() => {
    const result: Array<
      {
        ev: any;
        pos: { topPx: number; heightPx: number; start: Date; end: Date };
        colIndex: number;
        colCount: number;
      }[]
    > = [];

    for (let dayIndex = 0; dayIndex < daysIdx.length; dayIndex++) {
      const dayStart = new Date(weekStart);
      dayStart.setDate(weekStart.getDate() + dayIndex);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const eventsForDay = events
        .filter((ev) => ev._end > dayStart && ev._start < dayEnd)
        .map((ev) => {
          const pos = computeEventPositionForDay(ev, dayStart);
          if (!pos) return null;
          return {
            ev,
            pos,
            startTs: pos.start.getTime(),
            endTs: pos.end.getTime(),
            colIndex: 0,
            colCount: 1,
          } as any;
        })
        .filter(Boolean) as any[];

      // sort by start then longer first
      eventsForDay.sort((a, b) => a.startTs - b.startTs || b.endTs - a.endTs);

      // greedy column placement
      const columnsEndTs: number[] = [];
      for (const it of eventsForDay) {
        let placed = false;
        for (let c = 0; c < columnsEndTs.length; c++) {
          if (it.startTs >= columnsEndTs[c]) {
            it.colIndex = c;
            columnsEndTs[c] = it.endTs;
            placed = true;
            break;
          }
        }
        if (!placed) {
          it.colIndex = columnsEndTs.length;
          columnsEndTs.push(it.endTs);
        }
      }

      // compute colCount for each event (how many columns overlap it)
      for (const it of eventsForDay) {
        const cols = new Set<number>();
        for (const other of eventsForDay) {
          if (other.startTs < it.endTs && other.endTs > it.startTs) {
            cols.add(other.colIndex);
          }
        }
        it.colCount = Math.max(1, cols.size);
      }

      result[dayIndex] = eventsForDay.map((it) => ({
        ev: it.ev,
        pos: it.pos,
        colIndex: it.colIndex,
        colCount: it.colCount,
      }));
    }

    return result;
  }, [events, weekStart, measuredDayHeight]);

  const stripeColor = 'rgba(255, 250, 250, 0.03)'; // tweak opacity to taste
  const hourBlockPx = Math.max(1, Math.round((measuredDayHeight || DAY_COLUMN_HEIGHT_PX) / 24));
  const stripeBg = `linear-gradient(
    to bottom,
    ${stripeColor} 0%,
    ${stripeColor} 50%,
    transparent 50%,
    transparent 100%
  )`;
  const stripeBgSize = `100% ${hourBlockPx}px`;

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
              <DataGridRow>
                {/* Left column: stacked hour labels */}
                <Box as="td" key="hours-col" style={{ verticalAlign: 'top', padding: 0 }}>
                  <Box
                    style={{
                      height: `${DAY_COLUMN_HEIGHT_PX}px`,
                      width: COL_WIDTH,
                      display: 'flex',
                      flexDirection: 'column',
                      paddingTop: 0,
                      margin: 0,
                      boxSizing: 'border-box',
                    }}
                  >
                    {hours.map((h) => (
                      <Box
                        key={`hour-${h}`}
                        style={{
                          height: `${ROW_HEIGHT_PX}px`,
                          display: 'flex',
                          alignItems: 'center',
                          paddingLeft: '8px',
                          boxSizing: 'border-box',
                          fontSize: '12px',
                          color: '#FFF',
                        }}
                      >
                        {`${h.toString().padStart(2, '0')}:00`}
                      </Box>
                    ))}
                  </Box>
                </Box>

                {/* Day columns: one tall column per day with absolutely-positioned events */}
                {daysIdx.map((dayIndex) => {
                  const dayStart = new Date(weekStart);
                  dayStart.setDate(weekStart.getDate() + dayIndex);
                  dayStart.setHours(0, 0, 0, 0);

                  // read precomputed layout for this day
                  const layoutedEvents = layoutByDay[dayIndex] || [];

                  return (
                    <Box as="td" key={`daycol-${dayIndex}`} style={{ verticalAlign: 'top', padding: 0 }}>
                      <Box
                        ref={dayIndex === 0 ? (el) => (dayColumnRef.current = el) : undefined}
                        // the tall container for entire day (24 * ROW_HEIGHT_PX)
                        style={{
                          position: 'relative',
                          height: `${DAY_COLUMN_HEIGHT_PX}px`,
                          width: '100%',
                          overflow: 'hidden',
                        }}
                        onClick={() => {
                          setSelectedSlot(null);
                        }}
                      >
                        {/* Render each event as absolute box positioned using computeEventPositionForDay */}
                        {layoutedEvents.map((item) => {
                          const { ev, pos, colIndex, colCount } = item;

                          // Horizontal spacing: small gap in px
                          const GAP_PX = 6;
                          const widthPercent = 100 / colCount;
                          const leftPercent = colIndex * widthPercent;

                          const style: React.CSSProperties = {
                            position: 'absolute',
                            top: `${pos.topPx}px`,
                            height: `${Math.max(12, pos.heightPx)}px`,
                            left: `${leftPercent}%`,
                            width: `calc(${widthPercent}% - ${GAP_PX}px)`,
                            marginLeft: `${GAP_PX / 2}px`,
                            marginRight: `${GAP_PX / 2}px`,
                            boxSizing: 'border-box',
                            padding: '4px 6px',
                            borderRadius: 6,
                            border: '1px solid rgba(0,0,0,0.08)',
                            backgroundColor: ev.creator?.self ? 'rgba(214, 31, 31, .6)' : 'rgba(255, 231, 71, .6)',
                            overflow: 'hidden',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            zIndex: 2 + colIndex,
                          };

                          const isAllDay = Boolean(ev.start?.date) && !ev.start?.dateTime;

                          return (
                            <div
                              key={ev.id}
                              style={style}
                              title={isAllDay ? `${ev.summary} — All-day` : `${ev.summary}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedEvents([ev]);
                                setIsDetailsOpen(true);
                                setSelection({
                                  start: pos.start.toISOString(),
                                  end: pos.end.toISOString(),
                                  dayIndex,
                                  hour: pos.start.getHours(),
                                  events: [ev],
                                });
                              }}
                            >
                              <div
                                style={{
                                  whiteSpace: 'nowrap',
                                  textOverflow: 'ellipsis',
                                  overflow: 'hidden',
                                  fontSize: 12,
                                  fontWeight: 600,
                                }}
                              >
                                {ev.summary ?? '(No title)'}
                              </div>
                            </div>
                          );
                        })}
                      </Box>
                    </Box>
                  );
                })}
              </DataGridRow>
            </DataGridBody>
          </DataGrid>
        </div>
      )}
    </div>
  );
};

export default withTheme(CalendarPanel);
