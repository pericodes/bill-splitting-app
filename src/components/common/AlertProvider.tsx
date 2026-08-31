"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useTranslation } from "react-i18next";

type AlertOptions = {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  isDestructive?: boolean;
};

interface AlertContextType {
  showAlert: (options: AlertOptions) => void;
  showConfirm: (options: AlertOptions) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error("useAlert must be used within an AlertProvider");
  }
  return context;
};

export const AlertProvider = ({ children }: { children: ReactNode }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [isConfirm, setIsConfirm] = useState(false);
  const [options, setOptions] = useState<AlertOptions | null>(null);

  const showAlert = (opts: AlertOptions) => {
    setOptions(opts);
    setIsConfirm(false);
    setOpen(true);
  };

  const showConfirm = (opts: AlertOptions) => {
    setOptions(opts);
    setIsConfirm(true);
    setOpen(true);
  };

  const handleConfirm = () => {
    if (options?.onConfirm) options.onConfirm();
    setOpen(false);
  };

  const handleCancel = () => {
    if (options?.onCancel) options.onCancel();
    setOpen(false);
  };

  return (
    <AlertContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity" />
          <Dialog.Content className="fixed left-1/2 top-1/2 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl bg-surface p-6 shadow-lg z-50">
            <Dialog.Title className="text-xl font-bold text-on-surface">
              {options?.title}
            </Dialog.Title>
            <Dialog.Description className="mt-2 text-on-surface-variant">
              {options?.description}
            </Dialog.Description>
            <div className="mt-6 flex justify-end gap-3">
              {isConfirm && (
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 rounded-lg font-semibold text-on-surface-variant hover:bg-surface-container-high transition-colors"
                >
                  {options?.cancelText || t("common.cancel")}
                </button>
              )}
              <button
                onClick={handleConfirm}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  options?.isDestructive
                    ? "bg-error text-on-error hover:bg-error/90"
                    : "bg-primary text-on-primary hover:bg-primary/90"
                }`}
              >
                {options?.confirmText || t("common.accept")}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </AlertContext.Provider>
  );
};
