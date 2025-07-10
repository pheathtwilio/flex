import * as Flex from '@twilio/flex-ui';

import { addThemeButton, makeThemePanel } from './components';
import { uiReducer } from './reducers';
import ThemeConfigPanel from '../custom-components/ThemeConfigPanel';

export const hooks = [
  { componentHook: addThemeButton },
  { reducerHook: () => ({ ui: uiReducer }) },
  {
    componentHook: (flex: typeof Flex) => {
      flex.AgentDesktopView.Panel2.Content.replace(makeThemePanel(), {
        sortOrder: 1000,
      });
    },
  },
];
