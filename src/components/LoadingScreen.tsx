"use client";

import styled, { keyframes } from 'styled-components';

const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const pulse = keyframes`
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
`;

const spin = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

const LoadingContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 99999;
  animation: ${fadeIn} 0.3s ease-in-out;
  opacity: 1;
  visibility: visible;
  transition: opacity 0.3s ease-in-out, visibility 0.3s ease-in-out;
`;

const LogoContainer = styled.div`
  margin-bottom: 40px;
  animation: ${pulse} 2s ease-in-out infinite;
`;

const Logo = styled.img`
  height: 60px;
  width: auto;
  filter: brightness(1.5);
`;

const LoadingSpinner = styled.div`
  width: 50px;
  height: 50px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top: 3px solid #667eea;
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
  margin-bottom: 24px;
`;

const LoadingText = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 8px 0;
  letter-spacing: -0.5px;
`;

const LoadingSubtext = styled.p`
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
  text-align: center;
  max-width: 300px;
`;

const WaveContainer = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100px;
  overflow: hidden;
`;

const Wave = styled.div<{ delay: number }>`
  position: absolute;
  bottom: 0;
  left: 0;
  width: 200%;
  height: 100px;
  background: linear-gradient(90deg, 
    rgba(102, 126, 234, 0.1) 0%, 
    rgba(118, 75, 162, 0.1) 50%, 
    rgba(102, 126, 234, 0.1) 100%
  );
  animation: wave 3s ease-in-out infinite;
  animation-delay: ${props => props.delay}s;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, 
      rgba(102, 126, 234, 0.2) 0%, 
      rgba(118, 75, 162, 0.2) 50%, 
      rgba(102, 126, 234, 0.2) 100%
    );
    border-radius: 50% 50% 0 0;
  }
  
  @keyframes wave {
    0%, 100% {
      transform: translateX(-50%) translateY(0);
    }
    50% {
      transform: translateX(-50%) translateY(-20px);
    }
  }
`;

interface LoadingScreenProps {
  isVisible: boolean;
}

export default function LoadingScreen({ isVisible }: LoadingScreenProps) {
  if (!isVisible) return null;

  return (
    <LoadingContainer id="loading-screen">
      <LogoContainer>
        <Logo src="/soroswap-logo.svg" alt="Soroswap" />
      </LogoContainer>
      
      <LoadingSpinner />
      
      <LoadingText>Soroswap</LoadingText>
      <LoadingSubtext>
        Loading your decentralized exchange experience...
      </LoadingSubtext>
      
      <WaveContainer>
        <Wave delay={0} />
        <Wave delay={1} />
        <Wave delay={2} />
      </WaveContainer>
    </LoadingContainer>
  );
}
