// Short vibrations for feedback. Android needs the VIBRATE permission (in the manifest).
export const haptic = {
  tap: () => navigator.vibrate?.(15),
  success: () => navigator.vibrate?.([30, 60, 30, 60, 120]),
}
