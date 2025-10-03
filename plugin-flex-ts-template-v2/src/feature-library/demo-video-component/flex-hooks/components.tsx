import React from 'react';
import * as Flex from '@twilio/flex-ui';
import { Icon, SideLink } from '@twilio/flex-ui';

import VideoPanel from '../custom-components/VideoPanel';

export const addThemeButton = (flex: typeof Flex, manager: Flex.Manager) => {
  const navigateHandler = () => {
    manager.store.dispatch({ type: 'TOGGLE_VIDEO_PANEL' });
  };

  flex.SideNav.Content.add(
    <SideLink
      showLabel={true}
      icon={<Icon icon="Edit" />}
      iconActive={<Icon icon="Edit" />}
      onClick={navigateHandler}
      isActive={true}
      key="video-component"
    ></SideLink>,
    { sortOrder: 101 }, // put it at the bottom
  );
};

export const makeVideoPanel = (): React.ReactElement => <VideoPanel key="theme-config-panel" visible={false} />;
