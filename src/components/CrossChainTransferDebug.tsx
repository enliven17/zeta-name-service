'use client'

import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { FiArrowRight, FiX, FiInfo, FiClock, FiDollarSign } from 'react-icons/fi'
import { ethers } from 'ethers'
import { useAccount, useChainId } from 'wagmi'
import { supportedChains, getChainConfig, getCrossChainRoute, isCrossChainSupported } from '../config/chains'
import { createOmnichainNameService } from '../lib/omnichainContract'

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
`

const ModalContent = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  padding: 30px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
`

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
`

const Title = styled.h2`
  color: white;
  font-size: 24px;
  font-weight: bold;
  margin: 0;
  background: linear-gradient(135deg, #22c55e, #065f46);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`

const CloseButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  padding: 5px;
  border-radius: 50%;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: scale(1.1);
  }
`

const Section = styled.div`
  margin-bottom: 25px;
`

const Label = styled.label`
  display: block;
  color: white;
  font-weight: 600;
  margin-bottom: 8px;
  font-size: 14px;
`

const DebugInfo = styled.div`
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
  font-family: monospace;
  font-size: 12px;
  color: #00ff00;
  white-space: pre-wrap;
`

const ErrorMessage = styled.div`
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  padding: 12px;
  color: #fca5a5;
  font-size: 14px;
  margin-bottom: 15px;
`

const WarningMessage = styled.div`
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 8px;
  padding: 12px;
  color: #fcd34d;
  font-size: 14px;
  margin-bottom: 15px;
  display: flex;
  align-items: flex-start;
  gap: 8px;
`

const SuccessMessage = styled.div`
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: 8px;
  padding: 12px;
  color: #86efac;
  font-size: 14px;
  margin-bottom: 15px;
  display: flex;
  align-items: flex-start;
  gap: 8px;
`

interface CrossChainTransferDebugProps {
  isOpen: boolean
  onClose: () => void
  domainName: string
  currentOwner: string
}

export default function CrossChainTransferDebug({ isOpen, onClose, domainName, currentOwner }: CrossChainTransferDebugProps) {
  const { address } = useAccount()
  const chainId = useChainId()

  const [recipientAddress, setRecipientAddress] = useState('')
  const [sourceChainId, setSourceChainId] = useState<number>(chainId || 421614)
  const [targetChainId, setTargetChainId] = useState<number>(11155111)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [domainInfo, setDomainInfo] = useState<any>(null)
  const [debugLog, setDebugLog] = useState<string[]>([])

  const addDebugLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setDebugLog(prev => [...prev, `[${timestamp}] ${message}`])
  }

  useEffect(() => {
    if (chainId) {
      setSourceChainId(chainId)
    }
  }, [chainId])

  useEffect(() => {
    if (isOpen && domainName) {
      loadDomainInfo()
    }
  }, [isOpen, domainName, sourceChainId])

  const loadDomainInfo = async () => {
    try {
      addDebugLog(`Loading domain info for: ${domainName}`)
      addDebugLog(`Source chain ID: ${sourceChainId}`)
      
      if (!window.ethereum) {
        addDebugLog('ERROR: No window.ethereum found')
        return
      }
      
      const provider = new ethers.BrowserProvider(window.ethereum)
      addDebugLog(`Provider created: ${provider.constructor.name}`)
      
      const nameService = createOmnichainNameService(provider, sourceChainId)
      addDebugLog(`Name service created for chain: ${sourceChainId}`)
      
      const info = await nameService.getDomainInfo(domainName)
      addDebugLog(`Domain info retrieved: ${JSON.stringify(info, null, 2)}`)
      
      setDomainInfo(info)
      
      // Check if domain is omnichain
      if (info.isOmnichain) {
        addDebugLog('✅ Domain is configured for omnichain (cross-chain enabled)')
      } else {
        addDebugLog('❌ Domain is NOT configured for omnichain (cross-chain disabled)')
      }
      
      // Check cross-chain transfer eligibility
      const canTransferCrossChain = info.isOmnichain && 
                                   info.owner !== "0x0000000000000000000000000000000000000000" &&
                                   !info.isExpired
      
      if (canTransferCrossChain) {
        addDebugLog('✅ Domain is eligible for cross-chain transfer')
      } else {
        addDebugLog('❌ Domain is NOT eligible for cross-chain transfer')
        if (!info.isOmnichain) addDebugLog('   - Reason: Domain is not omnichain enabled')
        if (info.owner === "0x0000000000000000000000000000000000000000") addDebugLog('   - Reason: Domain has no owner')
        if (info.isExpired) addDebugLog('   - Reason: Domain has expired')
      }
      
    } catch (error) {
      addDebugLog(`ERROR: Failed to load domain info: ${error}`)
      console.error('Failed to load domain info:', error)
    }
  }

  const handleTransfer = async () => {
    if (!address || !recipientAddress || !domainName) return

    setIsLoading(true)
    setError('')
    addDebugLog(`Starting cross-chain transfer...`)

    try {
      // Validate recipient address
      if (!ethers.isAddress(recipientAddress)) {
        throw new Error('Invalid recipient address')
      }

      // Check if cross-chain transfer is supported
      if (!isCrossChainSupported(sourceChainId, targetChainId)) {
        throw new Error(`Cross-chain transfer not supported: ${sourceChainId} -> ${targetChainId}`)
      }

      addDebugLog(`Cross-chain transfer supported: ${sourceChainId} -> ${targetChainId}`)

      // Check if we're on the correct chain
      if (chainId !== sourceChainId) {
        addDebugLog(`ERROR: Wrong chain. Current: ${chainId}, Required: ${sourceChainId}`)
        throw new Error(`Please switch to chain ${sourceChainId} to perform this transfer`)
      }

      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const nameService = createOmnichainNameService(provider, sourceChainId, signer)

      addDebugLog(`Name service created with signer for chain: ${sourceChainId}`)

      // Perform cross-chain transfer
      addDebugLog(`Calling crossChainTransfer with: ${domainName}, ${recipientAddress}, ${targetChainId}`)
      const tx = await nameService.crossChainTransfer(domainName, recipientAddress, targetChainId)
      
      addDebugLog(`Cross-chain transfer initiated: ${tx.hash}`)
      
      // Wait for confirmation
      await tx.wait()
      
      addDebugLog('Cross-chain transfer confirmed')
      onClose()
      
    } catch (error: any) {
      addDebugLog(`ERROR: Cross-chain transfer failed: ${error.message}`)
      console.error('Cross-chain transfer failed:', error)
      setError(error.message || 'Transfer failed')
    } finally {
      setIsLoading(false)
    }
  }

  const route = getCrossChainRoute(sourceChainId, targetChainId)
  const sourceChainConfig = getChainConfig(sourceChainId)
  const targetChainConfig = getChainConfig(targetChainId)

  if (!isOpen) return null

  return (
    <Modal onClick={(e) => e.target === e.currentTarget && onClose()}>
      <ModalContent>
        <Header>
          <Title>Cross-Chain Transfer Debug</Title>
          <CloseButton onClick={onClose}>
            <FiX />
          </CloseButton>
        </Header>

        <Section>
          <Label>Debug Log</Label>
          <DebugInfo>
            {debugLog.join('\n')}
          </DebugInfo>
        </Section>

        {domainInfo && !domainInfo.isOmnichain && (
          <WarningMessage>
            <FiInfo />
            <div>
              This domain is not configured for omnichain transfers. 
              You can only transfer it within the current network.
            </div>
          </WarningMessage>
        )}

        {domainInfo && domainInfo.isOmnichain && (
          <SuccessMessage>
            <FiInfo />
            <div>
              This domain is configured for omnichain transfers. 
              You can transfer it across multiple blockchains.
            </div>
          </SuccessMessage>
        )}

        <Section>
          <Label>Domain Name</Label>
          <div style={{ color: 'white', padding: '12px 16px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '12px', opacity: 0.7 }}>
            {domainName}.zeta
          </div>
        </Section>

        <Section>
          <Label>Recipient Address</Label>
          <input
            type="text"
            placeholder="0x..."
            value={recipientAddress}
            onChange={(e) => setRecipientAddress(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '12px',
              color: 'white',
              fontSize: '16px'
            }}
          />
        </Section>

        <Section>
          <Label>Transfer Route</Label>
          <div style={{ color: 'white', padding: '12px 16px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '12px' }}>
            {sourceChainConfig?.name} ({sourceChainId}) → {targetChainConfig?.name} ({targetChainId})
          </div>
        </Section>

        {error && (
          <ErrorMessage>
            {error}
          </ErrorMessage>
        )}

        <button
          onClick={handleTransfer}
          disabled={
            isLoading || 
            !recipientAddress || 
            !ethers.isAddress(recipientAddress) ||
            !route ||
            (domainInfo && !domainInfo.isOmnichain && sourceChainId !== targetChainId)
          }
          style={{
            width: '100%',
            padding: '14px 20px',
            border: 'none',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            background: 'linear-gradient(135deg, #22c55e, #065f46)',
            color: 'white',
            opacity: (isLoading || !recipientAddress || !ethers.isAddress(recipientAddress) || !route || (domainInfo && !domainInfo.isOmnichain && sourceChainId !== targetChainId)) ? 0.5 : 1
          }}
        >
          {isLoading ? 'Processing Transfer...' : 'Initiate Cross-Chain Transfer'}
        </button>
      </ModalContent>
    </Modal>
  )
}
