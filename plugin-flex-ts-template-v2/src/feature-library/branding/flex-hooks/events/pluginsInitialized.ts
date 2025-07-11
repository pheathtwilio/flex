import * as Flex from '@twilio/flex-ui';
import merge from 'lodash/merge';

import { FlexEvent } from '../../../../types/feature-loader';
import { isCustomColorsEnabled, getCustomColors, getComponentThemeOverrides } from '../../config';
// import { Panel1 } from '@twilio/flex-ui/src/components/view/AgentDesktopView/Panel1';

export const eventName = FlexEvent.pluginsInitialized;
export const eventHook = function applyBrandingColors(flex: typeof Flex, manager: Flex.Manager) {
  let componentThemeOverrides = {} as any;
  let apply = false;

  if (isCustomColorsEnabled()) {
    apply = true;
    const colors = getCustomColors();

    if (Boolean(colors.main_header_background)) {
      componentThemeOverrides.MainHeader = {
        ...componentThemeOverrides.MainHeader,
        Container: {
          ...componentThemeOverrides.MainHeader?.Container,
          background: colors.main_header_background,
        },
      };
    }

    if (Boolean(colors.side_nav_background)) {
      componentThemeOverrides.SideNav = {
        ...componentThemeOverrides.SideNav,
        Container: {
          ...componentThemeOverrides.SideNav?.Container,
          background: colors.side_nav_background,
        },
        Button: {
          ...componentThemeOverrides.SideNav?.Container,
          background: colors.side_nav_background,
        },
      };
    }

    if (Boolean(colors.side_nav_border)) {
      componentThemeOverrides.SideNav = {
        ...componentThemeOverrides.SideNav,
        Container: {
          ...componentThemeOverrides.SideNav?.Container,
          borderColor: colors.side_nav_border,
        },
      };
    }

    if (Boolean(colors.side_nav_icon)) {
      componentThemeOverrides.SideNav = {
        ...componentThemeOverrides.SideNav,
        Button: {
          ...componentThemeOverrides.SideNav?.Button,
          color: colors.side_nav_icon,
        },
        Icon: {
          ...componentThemeOverrides.SideNav?.Icon,
          color: colors.side_nav_icon,
        },
      };
    }

    if (Boolean(colors.side_nav_selected_icon)) {
      componentThemeOverrides.SideNav = {
        ...componentThemeOverrides.SideNav,
        SelectedIcon: {
          ...componentThemeOverrides.SideNav?.SelectedIcon,
          color: colors.side_nav_selected_icon,
        },
      };
    }

    if (Boolean(colors.side_nav_hover_background)) {
      componentThemeOverrides.SideNav = {
        ...componentThemeOverrides.SideNav,
        Icon: {
          ...componentThemeOverrides.SideNav?.Icon,
          '&:hover': {
            background: colors.side_nav_hover_background,
          },
        },
      };
    }

    if (Boolean(colors.panel_1)) {
      componentThemeOverrides.AgentDesktopView = {
        ...componentThemeOverrides.AgentDesktopView,
        Panel1: {
          ...componentThemeOverrides.Panel1?.Container,
          background: colors.panel_1,
        },
      };
    }

    if (Boolean(colors.panel_2)) {
      componentThemeOverrides.AgentDesktopView = {
        ...componentThemeOverrides.AgentDesktopView,
        Panel2: {
          ...componentThemeOverrides.Panel1?.Container,
          background: colors.panel_2,
        },
      };
    }
  }

  const customComponentThemeOverrides = getComponentThemeOverrides();
  if (customComponentThemeOverrides && Object.keys(customComponentThemeOverrides).length) {
    apply = true;
    componentThemeOverrides = merge(componentThemeOverrides, customComponentThemeOverrides);
  }

  if (apply) {
    console.log('componentThemeOverrides: ', componentThemeOverrides);
    manager.updateConfig({
      theme: {
        componentThemeOverrides,
      },
    });
  }
};
