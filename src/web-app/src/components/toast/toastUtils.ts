import { toast } from "sonner";

export const showSuccess = (message: string) =>
  toast.success(message, { dismissible: false });
export const showError = (message: string) =>
  toast.error(message, { dismissible: false });
export const showInfo = (message: string) =>
  toast.info(message, { dismissible: false });
export const showWarning = (message: string) =>
  toast.warning(message, { dismissible: false });

export const showToast = toast;
