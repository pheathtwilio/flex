import { getFeatureFlags } from '../../utils/configuration';
import DemoCalendarComponentConfig from './types/ServiceConfiguration';

const { enabled = false } = (getFeatureFlags()?.features?.demo_calendar_component as DemoCalendarComponentConfig) || {};

export const isFeatureEnabled = () => {
  return enabled;
};
