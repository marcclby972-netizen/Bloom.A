import * as Haptics from 'expo-haptics'

/**
 * Tiny wrappers so the rest of the app doesn't need to import expo-haptics
 * directly. Use these on all important interactions per the UX brief:
 * - tap → light
 * - success / check → success
 * - error / destructive confirm → error
 */
export const tapHaptic = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
export const heavyTap = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
export const successHaptic = () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
export const errorHaptic = () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
export const selectionHaptic = () => Haptics.selectionAsync()
