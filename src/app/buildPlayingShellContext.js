export function buildPlayingShellContext({ actions, selectors, state, ui }) {
  return {
    ...state,
    ...actions,
    ...selectors,
    ...ui,
    actions,
    selectors,
    state,
    ui,
  };
}
