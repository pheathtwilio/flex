import { FeatureDefinition } from '../../types/feature-loader';
import { isFeatureEnabled } from './config';
import { hooks } from './flex-hooks';

export const register = (): FeatureDefinition => {
  if (!isFeatureEnabled()) {
    return {};
  }
  return { name: 'demo-video-component', hooks };
};
