"use client";

import styled, { keyframes } from 'styled-components';
import { useState, useEffect } from 'react';
import { FaCheck, FaTimes, FaExclamationTriangle, FaInfo } from 'react-icons/fa';

interface NotificationProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  onClose: () => void;
}

const slideIn = keyframes`
  from {
    transform: translateX(100%) scale(0.8);
    opacity: 0;
  }
  to {
    transform: translateX(0) scale(1);
    opacity: 1;
  }
`;

const slideOut = keyframes`
  from {
    transform: translateX(0) scale(1);
    opacity: 1;
  }
  to {
    transform: translateX(100%) scale(0.8);
    opacity: 0;
  }
`;

const glow = keyframes`
  0%, 100% {
    box-shadow: 
      0 25px 50px -12px rgba(0, 0, 0, 0.25),
      0 0 0 1px rgba(255, 255, 255, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
  }
  50% {
    box-shadow: 
      0 25px 50px -12px rgba(0, 0, 0, 0.4),
      0 0 20px rgba(255, 255, 255, 0.1),
      0 0 0 1px rgba(255, 255, 255, 0.15),
      inset 0 1px 0 rgba(255, 255, 255, 0.3);
  }
`;

const shimmer = keyframes`
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
`;

const NotificationContainer = styled.div<{ $isClosing: boolean }>`
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 10000;
  animation: ${props => props.$isClosing ? slideOut : slideIn} 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
`;

const NotificationCard = styled.div<{ $type: 'success' | 'error' | 'warning' | 'info' }>`
  background: ${props => {
    switch (props.$type) {
      case 'success': return 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(16, 185, 129, 0.1) 100%)';
      case 'error': return 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 127, 0.1) 100%)';
      case 'warning': return 'linear-gradient(135deg, rgba(255, 193, 7, 0.15) 0%, rgba(245, 158, 11, 0.1) 100%)';
      case 'info': return 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(147, 51, 234, 0.1) 100%)';
    }
  }};
  backdrop-filter: blur(25px) saturate(180%);
  -webkit-backdrop-filter: blur(25px) saturate(180%);
  border-radius: 20px;
  padding: 24px;
  min-width: 340px;
  max-width: 420px;
  position: relative;
  overflow: hidden;
  border: 1px solid ${props => {
    switch (props.$type) {
      case 'success': return 'rgba(34, 197, 94, 0.4)';
      case 'error': return 'rgba(239, 68, 68, 0.4)';
      case 'warning': return 'rgba(255, 193, 7, 0.4)';
      case 'info': return 'rgba(59, 130, 246, 0.4)';
    }
  }};
  animation: ${glow} 3s ease-in-out infinite;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.1),
      transparent
    );
    animation: ${shimmer} 3s ease-in-out infinite;
  }
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: ${props => {
      switch (props.$type) {
        case 'success': return 'radial-gradient(circle at 20% 20%, rgba(34, 197, 94, 0.1) 0%, transparent 50%)';
        case 'error': return 'radial-gradient(circle at 20% 20%, rgba(239, 68, 68, 0.1) 0%, transparent 50%)';
        case 'warning': return 'radial-gradient(circle at 20% 20%, rgba(255, 193, 7, 0.1) 0%, transparent 50%)';
        case 'info': return 'radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)';
      }
    }};
    pointer-events: none;
    border-radius: 20px;
  }
`;

const iconPulse = keyframes`
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
`;

const NotificationHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  position: relative;
  z-index: 1;
`;

const NotificationIcon = styled.div<{ $type: 'success' | 'error' | 'warning' | 'info' }>`
  display: flex;
  align-items: center;
  gap: 12px;
  color: ${props => {
    switch (props.$type) {
      case 'success': return '#10b981';
      case 'error': return '#f87171';
      case 'warning': return '#fbbf24';
      case 'info': return '#60a5fa';
    }
  }};
  font-weight: 700;
  font-size: 1.1rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  
  svg {
    animation: ${iconPulse} 2s ease-in-out infinite;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  }
`;

const CloseButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  width: 32px;
  height: 32px;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  font-weight: bold;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  z-index: 1;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    color: white;
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
  
  &:active {
    transform: scale(0.95);
  }
`;

const NotificationMessage = styled.p`
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.95rem;
  margin: 0;
  line-height: 1.5;
  position: relative;
  z-index: 1;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  font-weight: 500;
`;

const progressGlow = keyframes`
  0%, 100% {
    box-shadow: 0 0 5px currentColor;
  }
  50% {
    box-shadow: 0 0 15px currentColor, 0 0 25px currentColor;
  }
`;

const ProgressBar = styled.div<{ $duration: number; $type: 'success' | 'error' | 'warning' | 'info' }>`
  position: absolute;
  bottom: 0;
  left: 0;
  height: 4px;
  background: ${props => {
    switch (props.$type) {
      case 'success': return 'linear-gradient(90deg, #10b981, #059669)';
      case 'error': return 'linear-gradient(90deg, #f87171, #dc2626)';
      case 'warning': return 'linear-gradient(90deg, #fbbf24, #d97706)';
      case 'info': return 'linear-gradient(90deg, #60a5fa, #2563eb)';
    }
  }};
  border-bottom-left-radius: 20px;
  border-bottom-right-radius: 20px;
  animation: 
    progress ${props => props.$duration}ms linear,
    ${progressGlow} 2s ease-in-out infinite;
  color: ${props => {
    switch (props.$type) {
      case 'success': return '#10b981';
      case 'error': return '#f87171';
      case 'warning': return '#fbbf24';
      case 'info': return '#60a5fa';
    }
  }};
  
  @keyframes progress {
    from { width: 100%; }
    to { width: 0%; }
  }
`;

export const Notification: React.FC<NotificationProps> = ({
  type,
  title,
  message,
  duration = 5000,
  onClose
}) => {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const getIcon = () => {
    switch (type) {
      case 'success': return <FaCheck />;
      case 'error': return <FaTimes />;
      case 'warning': return <FaExclamationTriangle />;
      case 'info': return <FaInfo />;
    }
  };

  return (
    <NotificationContainer $isClosing={isClosing}>
      <NotificationCard $type={type}>
        <NotificationHeader>
          <NotificationIcon $type={type}>
            {getIcon()}
            {title}
          </NotificationIcon>
          <CloseButton onClick={handleClose}>
            ×
          </CloseButton>
        </NotificationHeader>
        <NotificationMessage>{message}</NotificationMessage>
        <ProgressBar $duration={duration} $type={type} />
      </NotificationCard>
    </NotificationContainer>
  );
};

// Notification Manager Hook
export const useNotification = () => {
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    duration?: number;
  }>>([]);

  const showNotification = (
    type: 'success' | 'error' | 'warning' | 'info',
    title: string,
    message: string,
    duration?: number
  ) => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, type, title, message, duration }]);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const NotificationContainer = () => (
    <>
      {notifications.map(notification => (
        <Notification
          key={notification.id}
          type={notification.type}
          title={notification.title}
          message={notification.message}
          duration={notification.duration}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </>
  );

  return {
    showSuccess: (title: string, message: string, duration?: number) => 
      showNotification('success', title, message, duration),
    showError: (title: string, message: string, duration?: number) => 
      showNotification('error', title, message, duration),
    showWarning: (title: string, message: string, duration?: number) => 
      showNotification('warning', title, message, duration),
    showInfo: (title: string, message: string, duration?: number) => 
      showNotification('info', title, message, duration),
    NotificationContainer
  };
};