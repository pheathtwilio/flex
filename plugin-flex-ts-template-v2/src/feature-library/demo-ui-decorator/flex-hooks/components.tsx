import React from 'react';
import * as Flex from '@twilio/flex-ui';
import { Icon, SideLink, IconButton } from '@twilio/flex-ui';

import ThemeConfigPanel from '../custom-components/ThemeConfigPanel';

export const addThemeButton = (flex: typeof Flex, manager: Flex.Manager) => {
  const navigateHandler = () => {
    manager.store.dispatch({ type: 'TOGGLE_THEME_PANEL' });
  };

  flex.SideNav.Content.add(
    <SideLink
      showLabel={true}
      icon={<Icon icon="Edit" />}
      iconActive={<Icon icon="Edit" />}
      onClick={navigateHandler}
      isActive={true}
      key="ui-configurator"
    ></SideLink>,
    { sortOrder: 101 }, // put it at the bottom
  );
};

export const makeThemePanel = (): React.ReactElement => <ThemeConfigPanel key="theme-config-panel" visible={false} />;
