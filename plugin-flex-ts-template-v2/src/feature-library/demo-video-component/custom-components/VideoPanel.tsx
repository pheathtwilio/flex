import React, { useState, useEffect } from 'react';
import { Spinner } from '@twilio-paste/core/';
import { Manager, withTheme, Theme } from '@twilio/flex-ui';

interface Props {
  visible: boolean;
  theme: Theme;
}

const VideoPanel: React.FC<Props> = ({ visible, theme }) => {
  return (
    <div style={{ padding: '1rem' }}>
      <h2>Video Component</h2>
    </div>
  );
};

export default withTheme(VideoPanel);
