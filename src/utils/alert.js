import { Alert, Platform } from 'react-native';

/**
 * Cross-platform alert that works on iOS, Android, and Web.
 * On web, uses window.alert / window.confirm since RN Alert.alert is not supported.
 */
export function showAlert(title, message, buttons) {
  if (Platform.OS === 'web') {
    if (!buttons || buttons.length <= 1) {
      window.alert(message ? `${title}\n\n${message}` : title);
      const btn = buttons?.[0];
      if (btn?.onPress) btn.onPress();
    } else if (buttons.length === 2) {
      const cancelBtn = buttons.find(b => b.style === 'cancel') || buttons[0];
      const confirmBtn = buttons.find(b => b !== cancelBtn) || buttons[1];
      const result = window.confirm(message ? `${title}\n\n${message}` : title);
      if (result) {
        if (confirmBtn?.onPress) confirmBtn.onPress();
      } else {
        if (cancelBtn?.onPress) cancelBtn.onPress();
      }
    } else {
      const result = window.confirm(message ? `${title}\n\n${message}` : title);
      if (result && buttons[buttons.length - 1]?.onPress) {
        buttons[buttons.length - 1].onPress();
      }
    }
  } else {
    Alert.alert(title, message, buttons);
  }
}
