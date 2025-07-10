import { getFeatureFlags } from '../../utils/configuration';
import DemoUiDecoratorConfig from './types/ServiceConfiguration';

const { enabled = false } = (getFeatureFlags()?.features?.demo_ui_decorator as DemoUiDecoratorConfig) || {};

export const isFeatureEnabled = () => {
  return enabled;
};
