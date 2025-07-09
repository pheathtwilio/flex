import * as Flex from '@twilio/flex-ui';

import TestFeatureComponent from '../custom-components/TestFeatureComponent';

export const componentHook = function addTestFeatureComponentToPanel(flex: typeof Flex) {
  flex.AgentDesktopView.Panel2.Content.add(<TestFeatureComponent key="test-feature" />, { sortOrder: 1 });
};
