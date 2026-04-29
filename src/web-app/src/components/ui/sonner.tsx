import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--success-bg": "var(--success)",
          "--success-text": "var(--success-foreground)",
          "--error-bg": "var(--destructive)",
          "--error-text": "var(--destructive-foreground)",
          "--warning-bg": "var(--warning)",
          "--warning-text": "var(--warning-foreground)",
          "--info-bg": "var(--info)",
          "--info-text": "var(--info-foreground)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
