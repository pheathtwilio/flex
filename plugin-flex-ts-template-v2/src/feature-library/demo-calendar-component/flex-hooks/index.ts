import * as Flex from '@twilio/flex-ui';

import { makeCalendarPanel } from './components';

export const hooks = [
  {
    componentHook: (flex: typeof Flex) => {
      flex.AgentDesktopView.Panel1.Content.replace(makeCalendarPanel(), {
        sortOrder: 1000,
      });
    },
  },
];
