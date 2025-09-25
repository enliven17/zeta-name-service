"use client";

import styled from 'styled-components';
import { FaCheck, FaTimes, FaExclamationTriangle } from 'react-icons/fa';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'info' | 'warning' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
}

const ModalOverlay = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  display: ${props => props.$isOpen ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: fadeIn 0.3s ease-in-out;
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const ModalContent = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 32px;
  max-width: 400px;
  width: 90%;
  border: 1px solid rgba(255, 255, 255, 0.2);
  position: relative;
  animation: slideUp 0.3s ease-in-out;
  
  @keyframes slideUp {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
`;

const ModalIcon = styled.div<{ $type: 'info' | 'warning' | 'danger' }>`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => {
    switch (props.$type) {
      case 'info': return 'rgba(59, 130, 246, 0.2)';
      case 'warning': return 'rgba(255, 193, 7, 0.2)';
      case 'danger': return 'rgba(239, 68, 68, 0.2)';
    }
  }};
  color: ${props => {
    switch (props.$type) {
      case 'info': return '#3b82f6';
      case 'warning': return '#ffc107';
      case 'danger': return '#ef4444';
    }
  }};
  font-size: 1.2rem;
`;

const ModalTitle = styled.h3`
  color: white;
  font-size: 1.3rem;
  font-weight: 600;
  margin: 0;
`;

const ModalMessage = styled.p`
  color: rgba(255, 255, 255, 0.8);
  font-size: 1rem;
  line-height: 1.5;
  margin: 0 0 24px 0;
`;

const ModalActions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
`;

const ModalButton = styled.button<{ $variant: 'primary' | 'secondary' }>`
  padding: 12px 24px;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 80px;
  
  ${props => props.$variant === 'primary' ? `
    background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
    color: white;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4);
    }
  ` : `
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.2);
    
    &:hover {
      background: rgba(255, 255, 255, 0.2);
      color: white;
    }
  `}
`;

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = 'info',
  onConfirm,
  onCancel
}) => {
  const getIcon = () => {
    switch (type) {
      case 'info': return <FaCheck />;
      case 'warning': return <FaExclamationTriangle />;
      case 'danger': return <FaTimes />;
    }
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay $isOpen={isOpen} onClick={onCancel}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalIcon $type={type}>
            {getIcon()}
          </ModalIcon>
          <ModalTitle>{title}</ModalTitle>
        </ModalHeader>
        
        <ModalMessage>{message}</ModalMessage>
        
        <ModalActions>
          <ModalButton $variant="secondary" onClick={onCancel}>
            {cancelText}
          </ModalButton>
          <ModalButton $variant="primary" onClick={onConfirm}>
            {confirmText}
          </ModalButton>
        </ModalActions>
      </ModalContent>
    </ModalOverlay>
  );
};