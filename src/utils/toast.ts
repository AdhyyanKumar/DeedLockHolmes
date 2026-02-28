export type ToastPayload = {
  message: string;
};

type ToastListener = (payload: ToastPayload) => void;

const listeners = new Set<ToastListener>();

export function subscribeToast(listener: ToastListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function showToast(message: string) {
  listeners.forEach((listener) => listener({ message }));
}
