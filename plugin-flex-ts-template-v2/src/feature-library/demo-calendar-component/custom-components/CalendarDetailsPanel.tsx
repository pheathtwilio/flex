import React, { useEffect, useState } from 'react';
import { Box } from '@twilio-paste/core/box';
import { Button } from '@twilio-paste/core/button';
import { Text } from '@twilio-paste/core/text';

import { subscribe, getSelection, clearSelection, SlotSelection } from '../types/CalendarSelectionStore';

const formatIso = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const CalendarDetailsPanel: React.FC = () => {
  const [selection, setSelection] = useState<SlotSelection>(getSelection());

  useEffect(() => {
    return subscribe((sel) => setSelection(sel));
  }, []);

  if (!selection) {
    // initially empty per your requirement
    return (
      <aside aria-label="Calendar details" style={{ padding: 12 }}>
        <Box marginBottom="space40">
          <Text as="h3" fontWeight="fontWeightBold">
            Selected slot
          </Text>
        </Box>

        <Box
          padding="space30"
          borderWidth="borderWidth10"
          borderStyle="solid"
          borderColor="colorBorderWeak"
          borderRadius="borderRadius20"
        >
          <Text as="div" color="colorTextWeak">
            No slot selected
          </Text>
          <Text as="div" color="colorTextWeak" marginTop="space30">
            Select a cell in the calendar to see details here.
          </Text>
        </Box>
      </aside>
    );
  }

  const { start, end, events } = selection;

  return (
    <aside aria-label="Calendar details" style={{ padding: 12, overflow: 'auto' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" marginBottom="space40">
        <Box>
          <Text as="h3" fontWeight="fontWeightBold">
            Slot details
          </Text>
          <Text as="div" color="colorTextWeak">
            {formatIso(start)} — {formatIso(end)}
          </Text>
        </Box>
        <Box>
          <Button variant="secondary" onClick={() => clearSelection()}>
            Clear
          </Button>
        </Box>
      </Box>

      <Box marginBottom="space40">
        <Text as="p" color="colorTextWeak">
          Events in slot: <strong>{events.length}</strong>
        </Text>
      </Box>

      <Box display="flex" flexDirection="column">
        {events.length === 0 ? (
          <Box padding="space40">
            <Text as="div">No events in this slot.</Text>
          </Box>
        ) : (
          events.map((ev) => {
            const startIso = ev._start
              ? new Date(ev._start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : '';
            const endIso = ev._end
              ? new Date(ev._end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : '';
            const isAllDay = Boolean(ev.start?.date) && !ev.start?.dateTime;

            return (
              <Box
                key={ev.id}
                padding="space30"
                borderWidth="borderWidth10"
                borderStyle="solid"
                borderColor="colorBorderWeak"
                borderRadius="borderRadius20"
                backgroundColor="colorBackground"
              >
                <Text as="div" fontWeight="fontWeightSemibold">
                  {ev.summary ?? '(No title)'}
                </Text>
                <Text as="div" color="colorTextWeak" marginTop="space10">
                  {isAllDay ? 'All-day' : `${startIso} — ${endIso}`}
                </Text>
                {ev.organizer.email && (
                  <Text as="div" marginTop="space10">
                    Organizer: {ev.organizer.email}
                  </Text>
                )}
                {ev.location && (
                  <Text as="div" color="colorTextWeak" marginTop="space10">
                    Location: {ev.location}
                  </Text>
                )}
                {ev.description && (
                  <Text as="div" marginTop="space20" style={{ whiteSpace: 'pre-wrap' }}>
                    Description: {ev.description}
                  </Text>
                )}
              </Box>
            );
          })
        )}
      </Box>
    </aside>
  );
};

export default CalendarDetailsPanel;
