import React, { useState, useEffect } from 'react';
import { Input } from '@twilio-paste/core/input';
import { Manager, withTheme, Theme } from '@twilio/flex-ui';

interface Props {
  visible: boolean;
  theme: Theme;
}

const ThemeConfigPanel: React.FC<Props> = ({ visible, theme }) => {
  const manager = Manager.getInstance();
  const initial = manager.configuration.theme?.componentThemeOverrides || {};
  const [overrides, setOverrides] = useState<Record<string, any>>(initial);

  const TOP_LEVEL_THEMES = [
    'MainHeader',
    'SideNav',
    'AgentDesktopView',
    'ChatCanvas',
    'TaskCanvas',
    'MessageBubble',
    'MessageInput',
    'MessageList',
    'Notification',
    'WorkerDirectory',
    'WorkspaceView',
  ] as const;

  type TopLevelThemeKeys = (typeof TOP_LEVEL_THEMES)[number];

  useEffect(() => {
    setOverrides(manager.configuration.theme?.componentThemeOverrides || {});
  }, [theme]);

  const getDeep = <T extends object>(obj: Record<string, any>, path: string[]): T | undefined => {
    let ptr: any = obj;
    for (const key of path) {
      if (ptr === null || typeof ptr !== 'object') {
        return undefined;
      }
      ptr = ptr[key];
    }
    return ptr as T;
  };

  const setDeep = <T extends object>(obj: T, path: string[], value: any): T => {
    if (!path.length) return obj;
    const newObj = { ...obj } as any;
    let ptr: Record<string, any> = newObj;
    for (const key of path.slice(0, -1)) {
      ptr[key] = { ...(ptr[key] ?? {}) };
      ptr = ptr[key];
    }
    ptr[path[path.length - 1]] = value;
    return newObj as T;
  };

  function flattenTheme(obj: any, prefix: string[] = []): Array<[string[], any]> {
    return Object.entries(obj).flatMap(([key, val]) => {
      const path = [...prefix, key];
      if (val && typeof val === 'object') {
        return flattenTheme(val, path);
      }
      return [[path, val]];
    });
  }

  function rgbToHex(rgb: string): string {
    const [r, g, b] = rgb.match(/\d+/g)!.map((x) => parseInt(x, 10));
    const toHex = (n: number) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, '0');

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  const normalizeColor = (input: string): string => {
    const rgbMatch = input.match(/\d+/g);
    if (rgbMatch && rgbMatch.length === 3) {
      const [r, g, b] = rgbMatch.map((n) => Math.max(0, Math.min(255, Number(n))));
      const toHex = (n: number) => n.toString(16).padStart(2, '0');
      return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toLowerCase();
    }
    return /^#([0-9a-f]{6})$/i.test(input) ? input : '#ffffff';
  };

  const handleChange = (path: string[], rawValue: string) => {
    const value = normalizeColor(rawValue);
    const updated = setDeep(overrides, path, value);
    setOverrides(updated);
    manager.updateConfig({
      theme: { componentThemeOverrides: updated },
    });
  };

  // const getOverride = (path: string[], defaultHex = '#ffffff'): string => {
  //   const result = path.reduce<any>((o, key) => (o && o[key] !== null ? o[key] : undefined), overrides);
  //   return /^#([0-9A-Fa-f]{6})$/.test(result) ? result : defaultHex;
  // };

  const entries = flattenTheme(theme);

  const filteredEntries = entries.filter(([path]) => TOP_LEVEL_THEMES.includes(path[0] as TopLevelThemeKeys));

  return (
    <div style={{ overflowY: 'auto', maxHeight: '100%' }}>
      {filteredEntries.map(([path, defaultValue]) => {
        const key = path.join('.');
        const rawOverride = getDeep(overrides, path);
        const defaultStr = String(defaultValue);
        const isColor = /^#|^rgb/.test(defaultStr);
        const currentColor = isColor ? normalizeColor(String(rawOverride ?? defaultStr)) : undefined;

        return (
          <div key={key} style={{ marginBottom: 16 }}>
            <label>
              {key}
              {isColor && (
                <input
                  type="color"
                  value={currentColor}
                  onChange={(e) => handleChange(path, e.target.value)}
                  style={{ marginLeft: 8 }}
                />
              )}
            </label>
            <Input
              type="text"
              value={String(rawOverride ?? '#FFFFFF')}
              placeholder={String(defaultValue)}
              onChange={(e) => handleChange(path, e.target.value)}
            />
          </div>
        );
      })}
    </div>
  );
};

export default withTheme(ThemeConfigPanel);
