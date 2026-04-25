import React from 'react';
import { Dialog } from 'heroui-native/dialog';
import { View } from 'react-native';

function ModalRoot({ children, isOpen, onClose }: any) {
  return (
    <Dialog isOpen={!!isOpen} onOpenChange={(open) => {
      if (!open) {
        onClose?.();
      }
    }}>
      <Dialog.Portal>
        <Dialog.Overlay />
        {children}
      </Dialog.Portal>
    </Dialog>
  );
}

function ModalContent({ children, ...props }: any) {
  return (
    <Dialog.Content {...props}>
      {children}
    </Dialog.Content>
  );
}

function ModalHeader({ children, ...props }: any) {
  return <Dialog.Title {...props}>{children}</Dialog.Title>;
}

function ModalBody({ children, ...props }: any) {
  return <View {...props}>{children}</View>;
}

function ModalFooter({ children, ...props }: any) {
  return <View {...props}>{children}</View>;
}

function ModalCloseButton() {
  return <Dialog.Close />;
}

export const Modal = Object.assign(ModalRoot, {
  Content: ModalContent,
  Header: ModalHeader,
  Body: ModalBody,
  Footer: ModalFooter,
  CloseButton: ModalCloseButton,
});
