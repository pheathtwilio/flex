import React from 'react';
import * as Flex from '@twilio/flex-ui';
import { Icon, SideLink } from '@twilio/flex-ui';

import CalendarPanel from '../custom-components/CalendarPanel';
import CalendarDetailsPanel from '../custom-components/CalendarDetailsPanel';

export const addThemeButton = (flex: typeof Flex, manager: Flex.Manager) => {
  const navigateHandler = () => {
    manager.store.dispatch({ type: 'TOGGLE_CALENDAR_PANEL' });
  };

  flex.SideNav.Content.add(
    <SideLink
      showLabel={true}
      icon={<Icon icon="Edit" />}
      iconActive={<Icon icon="Edit" />}
      onClick={navigateHandler}
      isActive={true}
      key="calendar-component"
    ></SideLink>,
    { sortOrder: 101 }, // put it at the bottom
  );
};

export const makeCalendarPanel = (): React.ReactElement => <CalendarPanel key="theme-config-panel" visible={false} />;
export const makeCalendarDetailsPanel = (): React.ReactElement => <CalendarDetailsPanel key="theme-config-panel" />;
