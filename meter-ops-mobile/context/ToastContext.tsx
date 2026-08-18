import React, { createContext, ReactNode, useContext, useState } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export type AlertButton = {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
};

export type ToastConfig = {
  title: string;
  message?: string;
  type?: ToastType;
};

export type AlertConfig = {
  title: string;
  message?: string;
  type?: ToastType;
  buttons?: AlertButton[];
};

type ToastContextValue = {
  showToast: (config: ToastConfig) => void;
  showAlert: (config: AlertConfig) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  // Toast State
  const [toast, setToast] = useState<ToastConfig | null>(null);
  const [toastAnim] = useState(new Animated.Value(-100));

  // Modal Alert State
  const [alertConfig, setAlertConfig] = useState<AlertConfig | null>(null);

  const showToast = ({ title, message, type = 'success' }: ToastConfig) => {
    setToast({ title, message, type });
    Animated.spring(toastAnim, {
      toValue: insets.top + 10,
      useNativeDriver: true,
      friction: 8,
      tension: 50,
    }).start();

    setTimeout(() => {
      Animated.timing(toastAnim, {
        toValue: -120,
        duration: 250,
        useNativeDriver: true,
      }).start(() => setToast(null));
    }, 3200);
  };

  const showAlert = (config: AlertConfig) => {
    setAlertConfig(config);
  };

  const closeAlert = () => setAlertConfig(null);

  const getIconAndColor = (type: ToastType = 'success') => {
    switch (type) {
      case 'success':
        return { icon: 'check-circle' as const, bg: colors.successSoft, fg: colors.success, border: '#bcf0c4' };
      case 'error':
        return { icon: 'x-circle' as const, bg: '#fde8e8', fg: colors.destructive, border: '#fabebe' };
      case 'warning':
        return { icon: 'alert-triangle' as const, bg: colors.warningSoft, fg: colors.warning, border: '#fed7aa' };
      case 'info':
      default:
        return { icon: 'info' as const, bg: colors.navySoft, fg: colors.primary, border: '#bfdbfe' };
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, showAlert }}>
      {children}

      {/* Floating Top Toast Banner */}
      {toast ? (
        <Animated.View
          style={[
            styles.toastContainer,
            {
              transform: [{ translateY: toastAnim }],
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          {(() => {
            const meta = getIconAndColor(toast.type);
            return (
              <View style={styles.toastContent}>
                <View style={[styles.iconBadge, { backgroundColor: meta.bg }]}>
                  <Feather name={meta.icon} size={20} color={meta.fg} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.toastTitle, { color: colors.foreground }]}>{toast.title}</Text>
                  {toast.message ? (
                    <Text style={[styles.toastMessage, { color: colors.mutedForeground }]}>{toast.message}</Text>
                  ) : null}
                </View>
              </View>
            );
          })()}
        </Animated.View>
      ) : null}

      {/* Custom Modern Center Alert Dialog */}
      {alertConfig ? (
        <Modal transparent animationType="fade" visible={!!alertConfig} onRequestClose={closeAlert}>
          <Pressable style={styles.backdrop} onPress={closeAlert}>
            <Pressable style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {(() => {
                const meta = getIconAndColor(alertConfig.type);
                return (
                  <>
                    <View style={[styles.modalIconRing, { backgroundColor: meta.bg }]}>
                      <Feather name={meta.icon} size={28} color={meta.fg} />
                    </View>

                    <Text style={[styles.modalTitle, { color: colors.foreground }]}>{alertConfig.title}</Text>
                    {alertConfig.message ? (
                      <Text style={[styles.modalMessage, { color: colors.mutedForeground }]}>
                        {alertConfig.message}
                      </Text>
                    ) : null}

                    <View style={styles.buttonRow}>
                      {(
                        alertConfig.buttons && alertConfig.buttons.length > 0
                          ? alertConfig.buttons
                          : ([{ text: 'OK', style: 'default' }] as AlertButton[])
                      ).map((btn, idx) => {
                        const isDestructive = btn.style === 'destructive';
                        const isCancel = btn.style === 'cancel';
                        return (
                          <Pressable
                            key={idx}
                            style={({ pressed }) => [
                              styles.dialogButton,
                              isDestructive
                                ? { backgroundColor: colors.destructive }
                                : isCancel
                                ? { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }
                                : { backgroundColor: colors.primary },
                              pressed && { opacity: 0.8 },
                              { flex: 1 },
                            ]}
                            onPress={() => {
                              closeAlert();
                              if (btn.onPress) btn.onPress();
                            }}
                          >
                            <Text
                              style={[
                                styles.dialogButtonText,
                                isCancel
                                  ? { color: colors.foreground }
                                  : { color: colors.primaryForeground },
                              ]}
                            >
                              {btn.text}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </>
                );
              })()}
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: 0,
    zIndex: 9999,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastTitle: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  toastMessage: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  modalIconRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 19,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 24,
    width: '100%',
  },
  dialogButton: {
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  dialogButtonText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
});
