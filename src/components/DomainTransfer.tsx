"use client";

import styled from 'styled-components';
import { useState, useEffect } from 'react';
import { FaPaperPlane, FaGlobe, FaArrowRight, FaInfoCircle } from 'react-icons/fa';
import { useAccount, useChainId } from 'wagmi';
import { domainService, Domain } from '@/lib/supabase';
import { getOmnichainContract } from '@/lib/contract';
import { supportedChains, getChainConfig, isCrossChainSupported, getCrossChainRoute, getContractAddresses } from '@/config/chains';

interface DomainTransferProps {
  domain: Domain;
  onTransferComplete: () => void;
  onClose: () => void;
}

const TransferModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const TransferContent = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 32px;
  max-width: 500px;
  width: 90%;
  border: 1px solid rgba(255, 255, 255, 0.2);
  position: relative;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 16px;
  right: 16px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

const TransferTitle = styled.h3`
  color: white;
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 8px 0;
  text-align: center;
`;

const TransferSubtitle = styled.p`
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
  margin: 0 0 24px 0;
  text-align: center;
`;

const DomainInfo = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 24px;
  text-align: center;
`;

const DomainName = styled.div`
  color: white;
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 8px;
`;

const DomainOwner = styled.div`
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.9rem;
`;

const TransferForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  color: white;
  font-size: 0.9rem;
  font-weight: 600;
`;

const AddressInput = styled.input`
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 12px 16px;
  color: white;
  font-size: 1rem;
  outline: none;
  transition: all 0.3s ease;
  
  &:focus {
    border-color: #3b82f6;
    background: rgba(255, 255, 255, 0.15);
  }
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
`;



const TransferButton = styled.button`
  width: 100%;
  padding: 16px 0;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #22c55e 0%, #065f46 100%);
  color: white;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(34, 197, 94, 0.4);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    background: rgba(255, 255, 255, 0.2);
  }
`;



const ErrorMessage = styled.div`
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 12px;
  padding: 12px 16px;
  margin-bottom: 16px;
  color: #ef4444;
  font-size: 0.9rem;
  text-align: center;
`;

const SuccessMessage = styled.div`
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: 12px;
  padding: 12px 16px;
  margin-bottom: 16px;
  color: #22c55e;
  font-size: 0.9rem;
  text-align: center;
`;

const TransferTypeSelector = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
`;

const TransferTypeOption = styled.button<{ active: boolean }>`
  flex: 1;
  padding: 12px 16px;
  border: 2px solid ${props => props.active ? '#00d2ff' : 'rgba(255, 255, 255, 0.2)'};
  border-radius: 12px;
  background: ${props => props.active ? 'rgba(0, 210, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)'};
  color: ${props => props.active ? '#00d2ff' : 'rgba(255, 255, 255, 0.7)'};
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  
  &:hover {
    border-color: ${props => props.active ? '#00d2ff' : 'rgba(255, 255, 255, 0.4)'};
    background: ${props => props.active ? 'rgba(0, 210, 255, 0.15)' : 'rgba(255, 255, 255, 0.1)'};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ChainSelector = styled.div`
  margin-bottom: 16px;
`;

const ChainGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 8px;
  margin-top: 8px;
`;

const ChainOption = styled.button<{ active: boolean; disabled?: boolean }>`
  padding: 12px;
  border: 2px solid ${props => props.active ? '#00d2ff' : 'rgba(255, 255, 255, 0.2)'};
  border-radius: 8px;
  background: ${props => props.active ? 'rgba(0, 210, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)'};
  color: ${props => props.active ? '#00d2ff' : 'white'};
  font-size: 0.85rem;
  font-weight: 500;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.3s ease;
  opacity: ${props => props.disabled ? 0.5 : 1};
  
  &:hover:not(:disabled) {
    border-color: ${props => props.active ? '#00d2ff' : 'rgba(255, 255, 255, 0.4)'};
  }
`;

const CrossChainInfo = styled.div`
  background: rgba(0, 210, 255, 0.1);
  border: 1px solid rgba(0, 210, 255, 0.3);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
`;

const TransferInfo = styled.div`
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 0.9rem;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const InfoLabel = styled.span`
  color: rgba(255, 255, 255, 0.7);
`;

const InfoValue = styled.span`
  color: #00d2ff;
  font-weight: 600;
`;

const DomainTypeInfo = styled.div`
  background: rgba(255, 193, 7, 0.1);
  border: 1px solid rgba(255, 193, 7, 0.3);
  border-radius: 12px;
  padding: 12px 16px;
  margin-bottom: 16px;
  color: #ffc107;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const DomainTransfer: React.FC<DomainTransferProps> = ({
  domain,
  onTransferComplete,
  onClose
}) => {
  const [toAddress, setToAddress] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [transferType, setTransferType] = useState<'same-chain' | 'cross-chain'>('same-chain');
  const [targetChainId, setTargetChainId] = useState<number>(421614);
  const [domainInfo, setDomainInfo] = useState<any>(null);
  const [isLoadingDomainInfo, setIsLoadingDomainInfo] = useState(false);

  const { address } = useAccount();
  const currentChainId = useChainId() || 421614;

  const validateAddress = (addr: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(addr);
  };

  // Check if contract is deployed on a chain
  const isContractDeployed = (chainId: number): boolean => {
    const addresses = getContractAddresses(chainId);
    return !!(addresses?.nameService && addresses.nameService !== '');
  };

  // Load domain info to check if it's omnichain
  useEffect(() => {
    const loadDomainInfo = async () => {
      if (!window.ethereum) return;
      
      setIsLoadingDomainInfo(true);
      try {
        const contract = getOmnichainContract(window.ethereum, currentChainId);
        const info = await contract.getDomainInfo(domain.name.replace('.zeta', ''));
        setDomainInfo(info);
        
        // Set default target chain (different from current, and deployed)
        const deployedChains = supportedChains.filter(chain => 
          chain.id !== currentChainId && isContractDeployed(chain.id)
        );
        if (deployedChains.length > 0) {
          setTargetChainId(deployedChains[0].id);
        }
      } catch (error) {
        console.error('Failed to load domain info:', error);
      } finally {
        setIsLoadingDomainInfo(false);
      }
    };

    loadDomainInfo();
  }, [domain.name, currentChainId]);



  const handleTransfer = async () => {
    if (!validateAddress(toAddress)) {
      setErrorMessage('Invalid wallet address');
      return;
    }

    if (toAddress.toLowerCase() === address?.toLowerCase()) {
      setErrorMessage('Cannot transfer to your own address');
      return;
    }

    // Check if cross-chain transfer is possible
    if (transferType === 'cross-chain') {
      if (!domainInfo?.isOmnichain) {
        setErrorMessage('This domain is not configured for cross-chain transfers');
        return;
      }
      
      if (!isCrossChainSupported(currentChainId, targetChainId)) {
        setErrorMessage(`Cross-chain transfer not supported: ${currentChainId} → ${targetChainId}`);
        return;
      }
    }

    setIsTransferring(true);
    setErrorMessage('');

    try {
      let transactionHash = '';
      
      if (!window.ethereum) {
        throw new Error('No wallet connected. Please connect your wallet to transfer domains.');
      }

      const contract = getOmnichainContract(window.ethereum, currentChainId);
      const domainName = domain.name.replace('.zeta', '');

      if (transferType === 'same-chain') {
        console.log('🔗 Submitting same-chain transfer...');
        transactionHash = await contract.transferDomain(domainName, toAddress);
        console.log('✅ Same-chain transfer successful:', transactionHash);
      } else {
        console.log('🌐 Submitting cross-chain transfer...');
        console.log('Target chain:', targetChainId);
        transactionHash = await contract.crossChainTransfer(domainName, toAddress, targetChainId);
        console.log('✅ Cross-chain transfer initiated:', transactionHash);
      }

      // Update database
      if (!address) throw new Error('Sender address is missing');
      await domainService.directDomainTransfer(domain.id, address, toAddress, transactionHash);
      
      console.log('✅ Database updated successfully');

      // Update marketplace listing ownership if domain is listed
      try {
        const { marketplaceService } = await import('@/lib/marketplace');
        const listings = await marketplaceService.getListingsByDomain(domain.id);
        const activeListing = listings.find(listing => listing.status === 'active');
        
        if (activeListing) {
          console.log('📝 Updating marketplace listing ownership...');
          await marketplaceService.updateListingOwnership(activeListing.id, toAddress);
          console.log('✅ Marketplace listing ownership updated');
        }
      } catch (error) {
        console.error('⚠️ Failed to update marketplace listing:', error);
      }

      const successMsg = transferType === 'cross-chain' 
        ? `Cross-chain transfer initiated! The domain will appear on ${getChainConfig(targetChainId)?.name} in 2-5 minutes.`
        : 'Domain successfully transferred! The domain now appears in the recipient\'s profile.';
        
      setSuccessMessage(successMsg);
      
      // Close modal after success
      setTimeout(() => {
        onTransferComplete();
        onClose();
      }, 3000);

    } catch (error: any) {
      console.error('Transfer failed:', error);
      setErrorMessage(error.message || 'Transfer failed');
    } finally {
      setIsTransferring(false);
    }
  };



  const formatAddress = (addr: string) => {
    if (addr.length <= 12) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-6)}`;
  };

  return (
    <TransferModal onClick={onClose}>
      <TransferContent onClick={(e) => e.stopPropagation()}>
        <CloseButton onClick={onClose}>×</CloseButton>
        
        <TransferTitle>Domain Transfer</TransferTitle>
        <TransferSubtitle>
          Transfer your domain to another wallet
        </TransferSubtitle>

        <DomainInfo>
          <DomainName>{domain.name}</DomainName>
          <DomainOwner>Owner: {formatAddress(domain.owner_address)}</DomainOwner>
        </DomainInfo>

        {errorMessage && (
          <ErrorMessage>{errorMessage}</ErrorMessage>
        )}

        {successMessage && (
          <SuccessMessage>{successMessage}</SuccessMessage>
        )}

        <TransferForm>
          {isLoadingDomainInfo ? (
            <div style={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.7)', padding: '20px' }}>
              Loading domain information...
            </div>
          ) : (
            <>
              {domainInfo && !domainInfo.isOmnichain && (
                <DomainTypeInfo>
                  <FaInfoCircle />
                  This domain is not configured for cross-chain transfers. Only same-chain transfers are available.
                </DomainTypeInfo>
              )}

              <TransferTypeSelector>
                <TransferTypeOption
                  active={transferType === 'same-chain'}
                  onClick={() => setTransferType('same-chain')}
                >
                  <FaPaperPlane />
                  Same Chain
                </TransferTypeOption>
                <TransferTypeOption
                  active={transferType === 'cross-chain'}
                  disabled={!domainInfo?.isOmnichain}
                  onClick={() => domainInfo?.isOmnichain && setTransferType('cross-chain')}
                >
                  <FaGlobe />
                  Cross-Chain
                </TransferTypeOption>
              </TransferTypeSelector>

              {transferType === 'same-chain' && (
                <TransferInfo>
                  <InfoRow>
                    <InfoLabel>Transfer Fee:</InfoLabel>
                    <InfoValue>
                      {(() => {
                        const chainConfig = getChainConfig(currentChainId);
                        return chainConfig ? `${chainConfig.transferFee} ${chainConfig.currency}` : '0.0001 ETH';
                      })()}
                    </InfoValue>
                  </InfoRow>
                  <InfoRow>
                    <InfoLabel>Network:</InfoLabel>
                    <InfoValue>{getChainConfig(currentChainId)?.name || 'Current Network'}</InfoValue>
                  </InfoRow>
                </TransferInfo>
              )}

              {transferType === 'cross-chain' && domainInfo?.isOmnichain && (
                <>
                  <ChainSelector>
                    <Label>Target Blockchain</Label>
                    <ChainGrid>
                      {supportedChains.map((chain) => {
                        const isDeployed = isContractDeployed(chain.id);
                        const isDisabled = chain.id === currentChainId || 
                                         !isCrossChainSupported(currentChainId, chain.id) || 
                                         !isDeployed;
                        
                        return (
                          <ChainOption
                            key={chain.id}
                            active={targetChainId === chain.id}
                            disabled={isDisabled}
                            onClick={() => {
                              if (!isDisabled) {
                                setTargetChainId(chain.id);
                              }
                            }}
                          >
                            {chain.name}
                            {!isDeployed && (
                              <div style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.5)', marginTop: '2px' }}>
                                Coming Soon
                              </div>
                            )}
                          </ChainOption>
                        );
                      })}
                    </ChainGrid>
                  </ChainSelector>

                  {isCrossChainSupported(currentChainId, targetChainId) && (
                    <CrossChainInfo>
                      <InfoRow>
                        <InfoLabel>Estimated Time:</InfoLabel>
                        <InfoValue>{getCrossChainRoute(currentChainId, targetChainId)?.estimatedTime || '2-5 minutes'}</InfoValue>
                      </InfoRow>
                      <InfoRow>
                        <InfoLabel>Cross-Chain Fee:</InfoLabel>
                        <InfoValue>{getCrossChainRoute(currentChainId, targetChainId)?.fee || '0.0001 ETH'}</InfoValue>
                      </InfoRow>
                      <InfoRow>
                        <InfoLabel>Route:</InfoLabel>
                        <InfoValue>
                          {getChainConfig(currentChainId)?.shortName} <FaArrowRight style={{ margin: '0 4px' }} /> {getChainConfig(targetChainId)?.shortName}
                        </InfoValue>
                      </InfoRow>
                    </CrossChainInfo>
                  )}
                </>
              )}

              <InputGroup>
                <Label>Recipient Wallet Address</Label>
                <AddressInput
                  type="text"
                  placeholder="0x..."
                  value={toAddress}
                  onChange={(e) => {
                    setToAddress(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                />
              </InputGroup>

              <TransferButton
                onClick={handleTransfer}
                disabled={
                  isTransferring || 
                  !toAddress.trim() || 
                  !validateAddress(toAddress) ||
                  (transferType === 'cross-chain' && !domainInfo?.isOmnichain)
                }
              >
                <FaPaperPlane />
                {isTransferring 
                  ? (transferType === 'cross-chain' ? 'Initiating Cross-Chain Transfer...' : 'Processing Transfer...') 
                  : (transferType === 'cross-chain' ? 'Start Cross-Chain Transfer' : 'Transfer Domain')
                }
              </TransferButton>
            </>
          )}
        </TransferForm>


      </TransferContent>
    </TransferModal>
  );
};