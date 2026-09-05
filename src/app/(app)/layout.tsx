import { AlertProvider } from "@/components/common/AlertProvider";
import PwaInstallCapture from "@/components/common/PwaInstallCapture";
import SiteFooter from "@/components/layout/SiteFooter";
import I18nProvider from "@/i18n/I18nProvider";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
      />
      <I18nProvider>
        <AlertProvider>
          <PwaInstallCapture />
          <div className="min-h-screen flex flex-col">
            <div className="flex-1 flex flex-col">{children}</div>
            <SiteFooter />
          </div>
        </AlertProvider>
      </I18nProvider>
    </>
  );
}
