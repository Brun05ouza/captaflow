'use client';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="modal-overlay" />
        <Dialog.Content className="modal-content">
          <Dialog.Title className="modal-title">{title}</Dialog.Title>
          <Dialog.Description className="muted">{description}</Dialog.Description>
          <Dialog.Close className="modal-close button button-ghost button-icon" aria-label="Fechar">
            <X size={18} />
          </Dialog.Close>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
