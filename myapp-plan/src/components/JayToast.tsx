import { StyleSheet, Text, View } from "react-native";

import Toast, { BaseToastProps } from "react-native-toast-message";

type ToastType = "success" | "error" | "info";

const ToastContent = ({
  text1,
  text2,
  type,
}: BaseToastProps & { type: ToastType }) => {
  const config = {
    success: {
      icon: "✓",
      title: "Success",
      iconBackground: "#16A34A",
    },

    error: {
      icon: "✕",
      title: "Error",
      iconBackground: "#DC2626",
    },

    info: {
      icon: "!",
      title: "Information",
      iconBackground: "#2563EB",
    },
  };

  const current = config[type];

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: current.iconBackground,
          },
        ]}
      >
        <Text style={styles.icon}>
          {current.icon}
        </Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>
          {text1 || current.title}
        </Text>

        {text2 ? (
          <Text style={styles.message}>
            {text2}
          </Text>
        ) : null}
      </View>

      <View style={styles.closeContainer}>
        <Text style={styles.close}>
          ×
        </Text>
      </View>
    </View>
  );
};

export const toastConfig = {
  success: (props: BaseToastProps) => (
    <ToastContent
      {...props}
      type="success"
    />
  ),

  error: (props: BaseToastProps) => (
    <ToastContent
      {...props}
      type="error"
    />
  ),

  info: (props: BaseToastProps) => (
    <ToastContent
      {...props}
      type="info"
    />
  ),
};

export const showSuccess = (
  title: string,
  message?: string
) => {
  Toast.show({
    type: "success",
    text1: title,
    text2: message,
    visibilityTime: 2500,
    position: "top",
    topOffset: 60,
  });
};

export const showError = (
  title: string,
  message?: string
) => {
  Toast.show({
    type: "error",
    text1: title,
    text2: message,
    visibilityTime: 3000,
    position: "top",
    topOffset: 60,
  });
};

export const showInfo = (
  title: string,
  message?: string
) => {
  Toast.show({
    type: "info",
    text1: title,
    text2: message,
    visibilityTime: 2500,
    position: "top",
    topOffset: 60,
  });
};

const styles = StyleSheet.create({
  container: {
    width: "92%",
    minHeight: 72,

    backgroundColor: "#FFFFFF",

    borderRadius: 16,

    flexDirection: "row",

    alignItems: "center",

    paddingHorizontal: 15,

    paddingVertical: 12,

    elevation: 8,

    shadowOffset: {
      width: 0,
      height: 4,
    },

    shadowOpacity: 0.18,

    shadowRadius: 8,
  },

  iconContainer: {
    width: 42,

    height: 42,

    borderRadius: 21,

    justifyContent: "center",

    alignItems: "center",

    marginRight: 12,
  },

  icon: {
    color: "#FFFFFF",

    fontSize: 22,

    fontWeight: "bold",
  },

  content: {
    flex: 1,
  },

  title: {
    color: "#111111",

    fontSize: 16,

    fontWeight: "bold",

    marginBottom: 3,
  },

  message: {
    color: "#666666",

    fontSize: 13,

    lineHeight: 18,
  },

  closeContainer: {
    marginLeft: 8,
  },

  close: {
    color: "#999999",

    fontSize: 24,

    fontWeight: "300",
  },
});