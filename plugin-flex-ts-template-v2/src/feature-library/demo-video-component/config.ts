import { getFeatureFlags } from '../../utils/configuration';
import DemoVideoComponentConfig from './types/ServiceConfiguration';

const { enabled = false } = (getFeatureFlags()?.features?.demo_video_component as DemoVideoComponentConfig) || {};

export const isFeatureEnabled = () => {
  return enabled;
};
