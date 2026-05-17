import { useState } from 'react';
import { createInitialModalConfig } from '../game/state/initialState.js';

export function useModalController() {
  const [modalConfig, setModalConfig] = useState(createInitialModalConfig);

  const showAlert = (title, message) => {
    setModalConfig({ isOpen: true, title, message, onConfirm: null });
  };

  const showConfirm = (title, message, action) => {
    setModalConfig({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        action();
      },
    });
  };

  const closeModal = () => {
    setModalConfig(prev => ({ ...prev, isOpen: false }));
  };

  return {
    modalConfig,
    showAlert,
    showConfirm,
    closeModal,
  };
}
