import React from 'react';
import { withTheme, Theme } from '@twilio/flex-ui';

interface Props {
  visible: boolean;
  theme: Theme;
}

const VideoPanel: React.FC<Props> = () => {
  return (
    <div style={{ padding: '1rem' }}>
      <h2>Video Component</h2>
    </div>
  );
};

export default withTheme(VideoPanel);
