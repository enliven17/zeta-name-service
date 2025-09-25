"use client";

import styled from 'styled-components';
import { useState } from 'react';
import { FaPaperPlane } from 'react-icons/fa';
import { useAccount } from 'wagmi';
import { domainService, Domain } from '@/lib/supabase';
import { getCreditContract } from '@/lib/contract';

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

export const DomainTransfer: React.FC<DomainTransferProps> = ({
  domain,
  onTransferComplete,
  onClose
}) => {
  const [toAddress, setToAddress] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const { address } = useAccount();

  const validateAddress = (addr: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(addr);
  };



  const handleSignatureTransfer = async () => {
    if (!validateAddress(toAddress)) {
      setErrorMessage('Invalid wallet address');
      return;
    }

    if (toAddress.toLowerCase() === address?.toLowerCase()) {
      setErrorMessage('Cannot transfer to your own address');
      return;
    }

    setIsTransferring(true);
    setErrorMessage('');

    try {
      let transactionHash = '';
      
      // Create on-chain transfer signature (REQUIRED - no fallback)
      if (!window.ethereum) {
        throw new Error('No wallet connected. Please connect your wallet to transfer domains.');
      }

      console.log('🔗 Submitting on-chain transfer...');
      const contract = getCreditContract(window.ethereum);
      const txHash = await contract.transferDomain(domain.name.replace('.ctc', '').replace('.zeta', ''), toAddress);
      transactionHash = txHash;

      console.log('✅ On-chain transfer successful, hash:', txHash);
      console.log('📝 Updating database with sender:', address, 'recipient:', toAddress);

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
          // Update the listing's seller_address to the new owner
          await marketplaceService.updateListingOwnership(activeListing.id, toAddress);
          console.log('✅ Marketplace listing ownership updated');
        }
      } catch (error) {
        console.error('⚠️ Failed to update marketplace listing:', error);
        // Don't fail the transfer if marketplace update fails
      }

      setSuccessMessage('Domain successfully transferred! The domain now appears in the recipient\'s profile.');
      
      // Close modal after success
      setTimeout(() => {
        onTransferComplete();
        onClose();
      }, 2000);

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
          <div style={{ marginBottom: '16px' }}>
            <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.9rem', margin: '0 0 16px 0' }}>
              Sign a transaction to transfer this domain to another wallet. The domain will immediately appear in the recipient's profile.
            </p>
          </div>

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
            onClick={handleSignatureTransfer}
            disabled={isTransferring || !toAddress.trim() || !validateAddress(toAddress)}
          >
            <FaPaperPlane />
            {isTransferring ? 'Processing...' : 'Transfer Domain'}
          </TransferButton>
        </TransferForm>


      </TransferContent>
    </TransferModal>
  );
};