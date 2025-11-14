
import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { IconSymbol } from './IconSymbol';
import { useThemedStyles } from '@/hooks/useThemedStyles';

export interface DialogButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'primary' | 'success' | 'cancel' | 'destructive';
  icon?: string;
  loading?: boolean;
}

export interface CustomDialogProps {
  visible: boolean;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  buttons?: DialogButton[];
  onClose?: () => void;
  children?: React.ReactNode;
}

export function CustomDialog({
  visible,
  title,
  message,
  type = 'info',
  buttons = [],
  onClose,
  children,
}: CustomDialogProps) {
  const { colors } = useThemedStyles();

  const styles = StyleSheet.create({
    dialogOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    dialogContainer: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 24,
      width: '100%',
      maxWidth: 400,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.3,
          shadowRadius: 16,
        },
        android: {
          elevation: 8,
        },
      }),
    },
    dialogIconContainer: {
      alignItems: 'center',
      marginBottom: 16,
    },
    dialogTitle: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 12,
    },
    dialogMessage: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: 8,
    },
    dialogButtonsContainer: {
      gap: 10,
      marginTop: 16,
    },
    dialogButton: {
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderRadius: 10,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
    },
    dialogButtonDefault: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },
    dialogButtonPrimary: {
      backgroundColor: colors.primary,
    },
    dialogButtonSuccess: {
      backgroundColor: colors.success,
    },
    dialogButtonCancel: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },
    dialogButtonDestructive: {
      backgroundColor: colors.error,
    },
    dialogButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    dialogButtonTextDefault: {
      color: colors.text,
    },
  });

  const getIconName = () => {
    switch (type) {
      case 'success':
        return 'checkmark.circle.fill';
      case 'error':
        return 'xmark.circle.fill';
      case 'warning':
        return 'exclamationmark.triangle.fill';
      case 'info':
      default:
        return 'info.circle.fill';
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'success':
        return colors.success;
      case 'error':
        return colors.error;
      case 'warning':
        return colors.warning;
      case 'info':
      default:
        return colors.info;
    }
  };

  const getButtonStyle = (buttonStyle?: string) => {
    switch (buttonStyle) {
      case 'primary':
        return styles.dialogButtonPrimary;
      case 'success':
        return styles.dialogButtonSuccess;
      case 'cancel':
        return styles.dialogButtonCancel;
      case 'destructive':
        return styles.dialogButtonDestructive;
      case 'default':
      default:
        return styles.dialogButtonDefault;
    }
  };

  const getButtonTextStyle = (buttonStyle?: string) => {
    if (buttonStyle === 'default' || buttonStyle === 'cancel') {
      return styles.dialogButtonTextDefault;
    }
    return styles.dialogButtonText;
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  // Default buttons if none provided
  const finalButtons = buttons.length > 0 ? buttons : [
    {
      text: 'OK',
      onPress: handleClose,
      style: 'primary' as const,
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <TouchableOpacity
        style={styles.dialogOverlay}
        activeOpacity={1}
        onPress={handleClose}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.dialogContainer}>
            {/* Icon */}
            <View style={styles.dialogIconContainer}>
              <IconSymbol
                name={getIconName()}
                size={64}
                color={getIconColor()}
              />
            </View>

            {/* Title */}
            <Text style={styles.dialogTitle}>{title}</Text>

            {/* Message */}
            <Text style={styles.dialogMessage}>{message}</Text>

            {/* Custom children content */}
            {children}

            {/* Buttons */}
            <View style={styles.dialogButtonsContainer}>
              {finalButtons.map((button, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.dialogButton, getButtonStyle(button.style)]}
                  onPress={() => {
                    if (button.onPress) {
                      button.onPress();
                    } else {
                      handleClose();
                    }
                  }}
                  disabled={button.loading}
                >
                  {button.loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      {button.icon && (
                        <IconSymbol
                          name={button.icon as any}
                          size={20}
                          color={button.style === 'default' || button.style === 'cancel' ? colors.text : '#FFFFFF'}
                        />
                      )}
                      <Text style={[styles.dialogButtonText, getButtonTextStyle(button.style)]}>
                        {button.text}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
