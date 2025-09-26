'use client'

import React, { useState } from 'react'
import styled from 'styled-components'
import { FaChevronDown, FaCheck, FaExclamationTriangle, FaGlobe } from 'react-icons/fa'
import { useAccount, useChainId, useSwitchChain } from 'wagmi'
import { supportedChains, getChainConfig, getContractAddresses } from '../config/chains'

const NetworkContainer = styled.div`
  position: relative;
  display: inline-block;
`

const NetworkButton = styled.button<{ $isWrongNetwork?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px;
  background: ${props => props.$isWrongNetwork 
    ? 'rgba(239, 68, 68, 0.1)' 
    : 'rgba(255, 255, 255, 0.1)'};
  border: 2px solid ${props => props.$isWrongNetwork 
    ? 'rgba(239, 68, 68, 0.3)' 
    : 'rgba(255, 255, 255, 0.2)'};
  border-radius: 20px;
  color: ${props => props.$isWrongNetwork ? '#ef4444' : 'white'};
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 140px;
  height: 56px;
  
  &:hover {
    background: ${props => props.$isWrongNetwork 
      ? 'rgba(239, 68, 68, 0.15)' 
      : 'rgba(255, 255, 255, 0.15)'};
    border-color: ${props => props.$isWrongNetwork 
      ? 'rgba(239, 68, 68, 0.5)' 
      : 'rgba(255, 255, 255, 0.3)'};
  }
`

const NetworkDropdown = styled.div<{ $isOpen: boolean }>`
  position: absolute;
  bottom: 100%;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  margin-bottom: 8px;
  z-index: 1000;
  opacity: ${props => props.$isOpen ? 1 : 0};
  visibility: ${props => props.$isOpen ? 'visible' : 'hidden'};
  transform: ${props => props.$isOpen ? 'translateY(0)' : 'translateY(10px)'};
  transition: all 0.3s ease;
  box-shadow: 0 -20px 40px rgba(0, 0, 0, 0.3);
`

const NetworkOption = styled.button<{ $isActive?: boolean; $isDeployed?: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: transparent;
  border: none;
  color: ${props => props.$isActive ? '#00d2ff' : 'white'};
  font-size: 0.9rem;
  font-weight: 500;
  cursor: ${props => props.$isDeployed ? 'pointer' : 'not-allowed'};
  transition: all 0.3s ease;
  opacity: ${props => props.$isDeployed ? 1 : 0.5};
  
  &:hover {
    background: ${props => props.$isDeployed ? 'rgba(255, 255, 255, 0.1)' : 'transparent'};
  }
  
  &:first-child {
    border-radius: 12px 12px 0 0;
  }
  
  &:last-child {
    border-radius: 0 0 12px 12px;
  }
`

const NetworkInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`

const NetworkStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8rem;
`

const StatusDot = styled.div<{ color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => props.color};
`

const ComingSoonBadge = styled.span`
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.5);
  font-style: italic;
`

interface NetworkSwitcherProps {
  className?: string
  style?: React.CSSProperties
}

export default function NetworkSwitcher({ className, style }: NetworkSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChain, isPending } = useSwitchChain()

  const currentChain = supportedChains.find(chain => chain.id === chainId)
  const currentChainConfig = chainId ? getChainConfig(chainId) : null
  
  const isWrongNetwork = isConnected && !currentChain

  const handleNetworkSwitch = async (targetChainId: number) => {
    if (isPending) return
    
    const addresses = getContractAddresses(targetChainId)
    
    if (!addresses?.nameService || addresses.nameService === '') {
      return // Don't switch to undeployed networks
    }

    try {
      await switchChain({ chainId: targetChainId })
      setIsOpen(false)
    } catch (error) {
      console.error('Failed to switch network:', error)
    }
  }

  const isContractDeployed = (chainId: number): boolean => {
    const addresses = getContractAddresses(chainId)
    return !!(addresses?.nameService && addresses.nameService !== '')
  }

  if (!isConnected) {
    return null
  }

  return (
    <NetworkContainer className={className} style={style}>
      <NetworkButton 
        $isWrongNetwork={isWrongNetwork}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isWrongNetwork ? (
          <>
            <FaExclamationTriangle />
            Wrong Network
          </>
        ) : (
          <>
            <StatusDot color={currentChainConfig?.color || '#666'} />
            {currentChainConfig?.shortName || 'Unknown'}
          </>
        )}
        <FaChevronDown 
          style={{ 
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s ease'
          }} 
        />
      </NetworkButton>

      <NetworkDropdown $isOpen={isOpen}>
        {supportedChains.map((chain) => {
          const chainConfig = getChainConfig(chain.id)
          const isActive = chainId === chain.id
          const isDeployed = isContractDeployed(chain.id)
          
          return (
            <NetworkOption
              key={chain.id}
              $isActive={isActive}
              $isDeployed={isDeployed}
              onClick={() => isDeployed && handleNetworkSwitch(chain.id)}
            >
              <NetworkInfo>
                <StatusDot color={chainConfig?.color || '#666'} />
                <span>{chain.name}</span>
                {chainConfig?.isOmnichainHub && (
                  <FaGlobe size={12} style={{ color: '#00d2ff' }} />
                )}
              </NetworkInfo>
              
              <NetworkStatus>
                {isActive && <FaCheck size={12} />}
                {!isDeployed && <ComingSoonBadge>Coming Soon</ComingSoonBadge>}
                {isDeployed && !isActive && (
                  <StatusDot color={chainConfig?.color || '#666'} />
                )}
              </NetworkStatus>
            </NetworkOption>
          )
        })}
      </NetworkDropdown>
    </NetworkContainer>
  )
}

// Click outside to close
if (typeof window !== 'undefined') {
  document.addEventListener('click', (e) => {
    const networkContainers = document.querySelectorAll('[data-network-switcher]')
    networkContainers.forEach(container => {
      if (!container.contains(e.target as Node)) {
        // Close dropdown logic would go here if we had a global state
      }
    })
  })
}