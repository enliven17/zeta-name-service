"use client";

import styled from 'styled-components';
import { useState, useEffect } from 'react';
import { FaGlobe, FaInfoCircle } from 'react-icons/fa';
import { Domain, domainService } from '@/lib/supabase';
import { getMarketplaceContract } from '@/lib/marketplaceContract';
import { getOmnichainContract } from '@/lib/contract';
import { supportedChains, getChainConfig, getContractAddresses } from '@/config/chains';
import { useChainId } from 'wagmi';
import { ethers } from 'ethers';

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  backdrop-filter: blur(4px);
`;

const Card = styled.div`
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 16px;
  padding: 24px;
  width: 480px;
  max-width: 90vw;
  max-height: 90vh;
  overflow-y: auto;
`;

const Title = styled.h3`
  color: #fff;
  margin: 0 0 16px 0;
  font-size: 1.25rem;
  font-weight: 600;
`;

const Input = styled.input`
  width: 100%;
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.2);
  background: rgba(255,255,255,0.12);
  color: #fff;
  font-size: 1rem;
  box-sizing: border-box;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
  
  &:focus {
    outline: none;
    border-color: #00d2ff;
    box-shadow: 0 0 0 2px rgba(0, 210, 255, 0.2);
  }
`;

const Row = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 20px;
`;

const Button = styled.button`
  flex: 1;
  padding: 14px 20px;
  border: 0;
  border-radius: 12px;
  color: #fff;
  background: linear-gradient(135deg, #22c55e 0%, #065f46 100%);
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.3s ease;
  
  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
  }
  
  &:disabled { 
    opacity: 0.6; 
    cursor: not-allowed;
    transform: none;
  }
`;

const CrossChainOption = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 16px 0;
  padding: 16px;
  background: rgba(0, 210, 255, 0.1);
  border: 1px solid rgba(0, 210, 255, 0.2);
  border-radius: 12px;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(0, 210, 255, 0.15);
    border-color: rgba(0, 210, 255, 0.3);
  }
`;

const CrossChainCheckbox = styled.input`
  width: 20px;
  height: 20px;
  accent-color: #00d2ff;
  cursor: pointer;
`;

const CrossChainLabel = styled.label`
  color: white;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  flex: 1;
  
  .highlight {
    color: #00d2ff;
    font-weight: 600;
  }
  
  .description {
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.85rem;
    margin-top: 4px;
    display: block;
  }
`;

const DomainTypeInfo = styled.div`
  background: rgba(255, 193, 7, 0.1);
  border: 1px solid rgba(255, 193, 7, 0.3);
  border-radius: 12px;
  padding: 16px;
  margin: 16px 0;
  color: #ffc107;
  font-size: 0.9rem;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  line-height: 1.5;
`;

interface Props {
  domain: Domain;
  sellerAddress: string;
  onClose: () => void;
  onListed: () => void;
}

export default function CreateListingModal({ domain, sellerAddress, onClose, onListed }: Props) {
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [allowCrossChain, setAllowCrossChain] = useState(false);
  const [domainInfo, setDomainInfo] = useState<any>(null);
  const [isLoadingDomainInfo, setIsLoadingDomainInfo] = useState(false);
  
  const currentChainId = useChainId() || 421614;

  // Load domain info to check if it's omnichain
  useEffect(() => {
    const loadDomainInfo = async () => {
      if (!window.ethereum) return;
      
      setIsLoadingDomainInfo(true);
      try {
        const contract = getOmnichainContract(window.ethereum, currentChainId);
        const info = await contract.getDomainInfo(domain.name.replace('.zeta', ''));
        setDomainInfo(info);
      } catch (error) {
        console.error('Failed to load domain info:', error);
      } finally {
        setIsLoadingDomainInfo(false);
      }
    };

    loadDomainInfo();
  }, [domain.name, currentChainId]);

  const submit = async () => {
    setError('');
    if (!price || isNaN(Number(price)) || Number(price) <= 0) {
      setError('Enter a valid price in ETH');
      return;
    }
    if (!window.ethereum) {
      setError('Wallet not found');
      return;
    }
    try {
      setLoading(true);
      const name = domain.name.replace('.ctc', '').replace('.zeta', '');
      const priceWei = ethers.parseEther(price);
      
      // Verify domain ownership before listing
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();
      
      // Check if user owns the domain
      const nsContract = new ethers.Contract(
        process.env.NEXT_PUBLIC_ZETA_CONTRACT_ADDRESS || process.env.NEXT_PUBLIC_CREDIT_CONTRACT_ADDRESS || '',
        ['function ownerOf(string name) view returns (address)', 'function expiresAt(string name) view returns (uint64)'],
        provider
      );
      
      const domainOwner = await nsContract.ownerOf(name);
      const expiresAt = await nsContract.expiresAt(name);
      const isExpired = Number(expiresAt) * 1000 < Date.now();
      
      if (domainOwner === ethers.ZeroAddress) {
        setError('Domain is not registered');
        return;
      }
      
      if (domainOwner.toLowerCase() !== userAddress.toLowerCase()) {
        setError('You do not own this domain');
        return;
      }
      
      if (isExpired) {
        setError('Domain has expired');
        return;
      }
      
      // Check if cross-chain listing is valid
      if (allowCrossChain && !domainInfo?.isOmnichain) {
        setError('This domain is not configured for cross-chain trading');
        return;
      }

      const mkt = getMarketplaceContract(window.ethereum);
      const txHash = await mkt.list(name, priceWei, allowCrossChain);

      await marketplaceCreate(domain.id, sellerAddress, price, txHash, allowCrossChain);
      onListed();
      onClose();
    } catch (e: any) {
      console.error('Listing error:', e);
      setError(e.message || 'Failed to create listing');
    } finally {
      setLoading(false);
    }
  };

  const marketplaceCreate = async (domainId: string, seller: string, priceEth: string, tx?: string, crossChain?: boolean) => {
    await domainService; // keep import used
    console.log('📝 Creating marketplace listing in Supabase...');
    console.log('Domain ID:', domainId);
    console.log('Seller:', seller);
    console.log('Price:', priceEth);
    console.log('Transaction:', tx);
    
    // Use marketplaceService from lib
    const { marketplaceService } = await import('@/lib/marketplace');
    
    try {
      const result = await marketplaceService.createListing(domainId, seller, priceEth, 'fixed_price', undefined, undefined, tx);
      console.log('✅ Listing created successfully:', result);
      return result;
    } catch (error) {
      console.error('❌ Failed to create listing in Supabase:', error);
      throw error;
    }
  };

  return (
    <Backdrop onClick={onClose}>
      <Card onClick={(e) => e.stopPropagation()}>
        <Title>List {domain.name}</Title>
        <div style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 12, fontSize: '0.95rem' }}>
          Enter price in {(() => {
            const chainConfig = getChainConfig(currentChainId);
            return chainConfig?.currency || 'ETH';
          })()}
        </div>
        <Input 
          placeholder={(() => {
            const chainConfig = getChainConfig(currentChainId);
            return `e.g. 0.1 ${chainConfig?.currency || 'ETH'}`;
          })()} 
          value={price} 
          onChange={(e) => setPrice(e.target.value)} 
        />
        
        <div style={{ 
          background: 'rgba(34, 197, 94, 0.1)', 
          border: '1px solid rgba(34, 197, 94, 0.3)', 
          borderRadius: '8px', 
          padding: '12px', 
          margin: '16px 0',
          fontSize: '0.9rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Listing Fee:</span>
            <span style={{ color: '#22c55e', fontWeight: '600' }}>
              {(() => {
                const chainConfig = getChainConfig(currentChainId);
                return chainConfig ? `${chainConfig.listingFee} ${chainConfig.currency}` : '0.0001 ETH';
              })()}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Network:</span>
            <span style={{ color: '#22c55e', fontWeight: '600' }}>
              {(() => {
                const chainConfig = getChainConfig(currentChainId);
                return chainConfig?.name || 'Current Network';
              })()}
            </span>
          </div>
        </div>
        
        {isLoadingDomainInfo ? (
          <div style={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.7)', padding: '20px' }}>
            Loading domain information...
          </div>
        ) : (
          <>
            {domainInfo && !domainInfo.isOmnichain && (
              <DomainTypeInfo>
                <FaInfoCircle />
                This domain is not configured for cross-chain trading. Only same-chain sales are available.
              </DomainTypeInfo>
            )}

            {domainInfo?.isOmnichain && (
              <CrossChainOption>
                <CrossChainCheckbox
                  type="checkbox"
                  id="crosschain-listing"
                  checked={allowCrossChain}
                  onChange={(e) => setAllowCrossChain(e.target.checked)}
                />
                <CrossChainLabel htmlFor="crosschain-listing">
                  <span className="highlight">Enable Cross-Chain Trading</span>
                  <span className="description">
                    Allow buyers from other blockchains to purchase this domain via ZetaChain. 
                    Supports {supportedChains
                      .filter(c => {
                        const addresses = getContractAddresses(c.id);
                        return addresses?.marketplace && addresses.marketplace !== '';
                      })
                      .map(c => getChainConfig(c.id)?.shortName)
                      .filter(Boolean)
                      .join(', ')}.
                  </span>
                </CrossChainLabel>
              </CrossChainOption>
            )}
          </>
        )}

        {error && (
          <div style={{ 
            color: '#ef4444', 
            marginTop: 16, 
            padding: '12px 16px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            fontSize: '0.9rem'
          }}>
            {error}
          </div>
        )}
        <Row>
          <Button 
            onClick={onClose} 
            style={{ 
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.2)'
            }}
          >
            Cancel
          </Button>
          <Button onClick={submit} disabled={loading || isLoadingDomainInfo}>
            {loading ? 'Listing...' : `Create ${allowCrossChain ? 'Cross-Chain ' : ''}Listing`}
          </Button>
        </Row>
      </Card>
    </Backdrop>
  );
}


