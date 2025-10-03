import * as Flex from '@twilio/flex-ui';

// import { uiReducer } from './reducers';
// import VideoPanel from '../custom-components/VideoPanel';

import { makeVideoPanel } from './components';

export const hooks = [
  {
    componentHook: (flex: typeof Flex) => {
      flex.AgentDesktopView.Panel2.Content.replace(makeVideoPanel(), {
        sortOrder: 1000,
      });
    },
  },
];
