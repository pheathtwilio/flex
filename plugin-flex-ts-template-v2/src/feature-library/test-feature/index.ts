import { FeatureDefinition } from '../../types/feature-loader';
import { isFeatureEnabled } from './config';
import { hooks } from './flex-hooks';

export const register = (): FeatureDefinition => {
  if (!isFeatureEnabled()) {
    console.log('[test-feature] disabled by config');
    return {};
  }
  console.log('[test-feature] enabled! hooks:', hooks);
  return {
    name: 'test-feature',
    hooks,
  };
};
