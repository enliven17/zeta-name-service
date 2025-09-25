"use client";

import styled from 'styled-components';
import { useState } from 'react';
import { Domain, domainService } from '@/lib/supabase';
import { getMarketplaceContract } from '@/lib/marketplaceContract';
import { ethers } from 'ethers';

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const Card = styled.div`
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 16px;
  padding: 20px;
  width: 420px;
`;

const Title = styled.h3`
  color: #fff;
  margin: 0 0 12px 0;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.2);
  background: rgba(255,255,255,0.12);
  color: #fff;
`;

const Row = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 12px;
`;

const Button = styled.button`
  flex: 1;
  padding: 12px;
  border: 0;
  border-radius: 10px;
  color: #fff;
  background: linear-gradient(135deg, #22c55e 0%, #065f46 100%);
  cursor: pointer;
  &:disabled { opacity: .6; cursor: not-allowed; }
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
      
      const mkt = getMarketplaceContract(window.ethereum);
      const txHash = await mkt.list(name, priceWei);

      await marketplaceCreate(domain.id, sellerAddress, price, txHash);
      onListed();
      onClose();
    } catch (e: any) {
      console.error('Listing error:', e);
      setError(e.message || 'Failed to create listing');
    } finally {
      setLoading(false);
    }
  };

  const marketplaceCreate = async (domainId: string, seller: string, priceEth: string, tx?: string) => {
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
        <div style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>Enter price in ETH</div>
        <Input placeholder="e.g. 1500" value={price} onChange={(e) => setPrice(e.target.value)} />
        {error && <div style={{ color: '#ef4444', marginTop: 8 }}>{error}</div>}
        <Row>
          <Button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)' }}>Cancel</Button>
          <Button onClick={submit} disabled={loading}>{loading ? 'Listing...' : 'Create Listing'}</Button>
        </Row>
      </Card>
    </Backdrop>
  );
}


