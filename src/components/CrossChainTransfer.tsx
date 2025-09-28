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
  max-width: 500px;
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

const Input = styled.input`
  width: 100%;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  color: white;
  font-size: 16px;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #22c55e;
    box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
`

const ChainSelector = styled.div`
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 15px;
  align-items: center;
  margin-bottom: 20px;
`

const ChainOption = styled.div<{ selected?: boolean; disabled?: boolean }>`
  padding: 15px;
  background: ${props => props.selected ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255, 255, 255, 0.1)'};
  border: 1px solid ${props => props.selected ? '#22c55e' : 'rgba(255, 255, 255, 0.2)'};
  border-radius: 12px;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s ease;
  opacity: ${props => props.disabled ? 0.5 : 1};

  &:hover {
    ${props => !props.disabled && !props.selected && `
      background: rgba(255, 255, 255, 0.15);
      border-color: rgba(255, 255, 255, 0.3);
    `}
  }
`

const ChainName = styled.div`
  color: white;
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 4px;
`

const ChainId = styled.div`
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
`

const ArrowIcon = styled.div`
  color: #22c55e;
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
`

const RouteInfo = styled.div`
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: 12px;
  padding: 15px;
  margin-bottom: 20px;
`

const RouteItem = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  color: white;
  font-size: 14px;
  margin-bottom: 8px;

  &:last-child {
    margin-bottom: 0;
  }
`

const RouteSteps = styled.div`
  margin-top: 10px;
`

const Step = styled.div`
  color: rgba(255, 255, 255, 0.8);
  font-size: 12px;
  margin-bottom: 4px;
  padding-left: 20px;
  position: relative;

  &:before {
    content: '•';
    position: absolute;
    left: 8px;
    color: #22c55e;
  }
`

const Button = styled.button<{ variant?: 'primary' | 'secondary'; disabled?: boolean }>`
  width: 100%;
  padding: 14px 20px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s ease;
  opacity: ${props => props.disabled ? 0.5 : 1};
  
  ${props => props.variant === 'secondary' ? `
    background: rgba(255, 255, 255, 0.1);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.2);
    
    &:hover {
      background: rgba(255, 255, 255, 0.15);
    }
  ` : `
    background: linear-gradient(135deg, #22c55e, #065f46);
    color: white;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 25px rgba(34, 197, 94, 0.3);
    }
  `}
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

interface CrossChainTransferProps {
  isOpen: boolean
  onClose: () => void
  domainName: string
  currentOwner: string
}

export default function CrossChainTransfer({ isOpen, onClose, domainName, currentOwner }: CrossChainTransferProps) {
  const { address } = useAccount()
  const chainId = useChainId()

  const [recipientAddress, setRecipientAddress] = useState('')
  const [sourceChainId, setSourceChainId] = useState<number>(chainId || 421614)
  const [targetChainId, setTargetChainId] = useState<number>(7001)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [domainInfo, setDomainInfo] = useState<any>(null)
  const [isAddressLoading, setIsAddressLoading] = useState(true)

  useEffect(() => {
    if (chainId) {
      setSourceChainId(chainId)
    }
  }, [chainId])

  useEffect(() => {
    if (address) {
      setIsAddressLoading(false)
    } else {
      setIsAddressLoading(true)
    }
  }, [address])

  useEffect(() => {
    if (isOpen && domainName) {
      loadDomainInfo()
    }
  }, [isOpen, domainName, sourceChainId])

  const loadDomainInfo = async () => {
    try {
      if (!window.ethereum) return
      
      const provider = new ethers.BrowserProvider(window.ethereum)
      const nameService = createOmnichainNameService(provider, sourceChainId)
      const info = await nameService.getDomainInfo(domainName)
      setDomainInfo(info)
    } catch (error) {
      console.error('Failed to load domain info:', error)
    }
  }

  const handleTransfer = async () => {
    if (!address || !recipientAddress || !domainName) {
      setError('Missing required information: address, recipient, or domain name')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // Validate recipient address
      if (!ethers.isAddress(recipientAddress)) {
        throw new Error('Invalid recipient address')
      }

      // Check if cross-chain transfer is supported
      if (!isCrossChainSupported(sourceChainId, targetChainId)) {
        throw new Error(`Cross-chain transfer not supported: ${sourceChainId} -> ${targetChainId}`)
      }

      // Check if we're on the correct chain
      if (chainId !== sourceChainId) {
        throw new Error(`Please switch to chain ${sourceChainId} to perform this transfer`)
      }

      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const nameService = createOmnichainNameService(provider, sourceChainId, signer)

      // Perform cross-chain transfer with fee
      const transferFee = ethers.parseEther("0.0001") // 0.0001 ETH transfer fee
      const tx = await nameService.crossChainTransfer(domainName, recipientAddress, targetChainId)
      
      console.log('Cross-chain transfer initiated:', tx.hash)
      
      // Wait for confirmation
      await tx.wait()
      
      console.log('Cross-chain transfer confirmed')
      onClose()
      
    } catch (error: any) {
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
          <Title>Cross-Chain Transfer</Title>
          <CloseButton onClick={onClose}>
            <FiX />
          </CloseButton>
        </Header>

        {domainInfo && !domainInfo.isOmnichain && (
          <WarningMessage>
            <FiInfo />
            <div>
              This domain is not configured for omnichain transfers. 
              You can only transfer it within the current network.
            </div>
          </WarningMessage>
        )}

        <Section>
          <Label>Domain Name</Label>
          <Input 
            value={`${domainName}.zeta`} 
            disabled 
            style={{ opacity: 0.7 }}
          />
        </Section>

        <Section>
          <Label>Recipient Address</Label>
          <Input
            type="text"
            placeholder="0x..."
            value={recipientAddress}
            onChange={(e) => setRecipientAddress(e.target.value)}
          />
        </Section>

        <Section>
          <Label>Transfer Route</Label>
          <ChainSelector>
            <div>
              <Label style={{ marginBottom: '8px' }}>From</Label>
              {supportedChains.map((chain) => (
                <ChainOption
                  key={chain.id}
                  selected={sourceChainId === chain.id}
                  disabled={chain.id !== sourceChainId}
                  onClick={() => chain.id === sourceChainId && setSourceChainId(chain.id)}
                >
                  <ChainName>{chain.name}</ChainName>
                  <ChainId>Chain ID: {chain.id}</ChainId>
                </ChainOption>
              ))}
            </div>

            <ArrowIcon>
              <FiArrowRight />
            </ArrowIcon>

            <div>
              <Label style={{ marginBottom: '8px' }}>To</Label>
              {supportedChains.map((chain) => (
                <ChainOption
                  key={chain.id}
                  selected={targetChainId === chain.id}
                  disabled={chain.id === sourceChainId || !isCrossChainSupported(sourceChainId, chain.id)}
                  onClick={() => {
                    if (chain.id !== sourceChainId && isCrossChainSupported(sourceChainId, chain.id)) {
                      setTargetChainId(chain.id)
                    }
                  }}
                >
                  <ChainName>{chain.name}</ChainName>
                  <ChainId>Chain ID: {chain.id}</ChainId>
                </ChainOption>
              ))}
            </div>
          </ChainSelector>
        </Section>

        {route && (
          <Section>
            <RouteInfo>
              <RouteItem>
                <FiClock />
                <span>Estimated Time: {route.estimatedTime}</span>
              </RouteItem>
              <RouteItem>
                <FiDollarSign />
                <span>Transfer Fee: {route.fee}</span>
              </RouteItem>
              <RouteSteps>
                {route.steps.map((step, index) => (
                  <Step key={index}>{step}</Step>
                ))}
              </RouteSteps>
            </RouteInfo>
          </Section>
        )}

        {error && (
          <ErrorMessage>
            {error}
          </ErrorMessage>
        )}

        <Button
          onClick={handleTransfer}
          disabled={
            isLoading || 
            isAddressLoading ||
            !address ||
            !recipientAddress || 
            !ethers.isAddress(recipientAddress) ||
            !route ||
            (domainInfo && !domainInfo.isOmnichain && sourceChainId !== targetChainId)
          }
        >
          {isLoading ? 'Processing Transfer...' : 
           isAddressLoading ? 'Loading Address...' : 
           !address ? 'Connect Wallet First' :
           'Initiate Cross-Chain Transfer'}
        </Button>

        {sourceChainId === targetChainId && (
          <Button
            variant="secondary"
            onClick={() => {
              // Handle same-chain transfer
              console.log('Same-chain transfer')
            }}
            style={{ marginTop: '10px' }}
          >
            Transfer on Same Chain
          </Button>
        )}
      </ModalContent>
    </Modal>
  )
}