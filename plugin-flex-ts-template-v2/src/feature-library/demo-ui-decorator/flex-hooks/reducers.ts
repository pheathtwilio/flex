const initialState = { themePanelVisible: false };

export const uiReducer = (state = initialState, action: any) => {
  if (action.type === 'TOGGLE_THEME_PANEL') {
    console.log(`State ${JSON.stringify(state)} Action: ${JSON.stringify(action)}`);
    return { ...state, themePanelVisible: !state.themePanelVisible };
  }
  return state;
};
