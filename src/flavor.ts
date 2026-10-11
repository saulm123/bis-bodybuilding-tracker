// Build flavour, set at build time with VITE_FLAVOR=foss|play.
// Because these are constants, code behind `if (HAS_CYCLE_LOG)` is removed
// entirely from the Play build rather than just hidden.
export const FLAVOR: 'foss' | 'play' = import.meta.env.VITE_FLAVOR === 'play' ? 'play' : 'foss'
export const HAS_CYCLE_LOG = FLAVOR === 'foss'
export const APP_VERSION: string = __APP_VERSION__
