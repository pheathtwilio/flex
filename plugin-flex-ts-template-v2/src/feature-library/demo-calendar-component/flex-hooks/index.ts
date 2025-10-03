import * as Flex from '@twilio/flex-ui';

import { makeCalendarPanel, makeCalendarDetailsPanel } from './components';

export const hooks = [
  {
    componentHook: (flex: typeof Flex) => {
      flex.AgentDesktopView.Panel1.Content.replace(makeCalendarPanel(), {
        sortOrder: 1000,
      });
      flex.AgentDesktopView.Panel2.Content.replace(makeCalendarDetailsPanel(), {
        sortOrder: 1001,
      });
    },
  },
];
