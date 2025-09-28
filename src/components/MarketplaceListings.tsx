"use client";

import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaEthereum, FaClock, FaGavel, FaTag, FaSearch, FaChevronUp, FaChevronDown, FaGlobe } from 'react-icons/fa';
import { marketplaceService, MarketplaceListing } from '@/lib/marketplace';
import { getOmnichainContract } from '@/lib/contract';
import { useAccount, useChainId } from 'wagmi';
import { getChainConfig } from '@/config/chains';

const MarketplaceContainer = styled.div`
  width: 100%;
`;

const SearchContainer = styled.div`
  margin-bottom: 24px;
  position: relative;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 16px 20px 16px 50px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.08);
  color: white;
  font-size: 1rem;
  outline: none;
  transition: all 0.3s ease;
  
  &:focus {
    border-color: rgba(34, 197, 94, 0.5);
    background: rgba(255, 255, 255, 0.12);
  }
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 18px;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(255, 255, 255, 0.5);
  pointer-events: none;
`;

const ResultsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
`;

const ListingsViewport = styled.div<{ itemCount: number }>`
  height: ${props => Math.min(props.itemCount, 2) * 220 + 20}px; /* Dynamic height + padding for hover */
  overflow: hidden;
  position: relative;
  padding-top: 10px; /* Extra space for hover effect */
`;

const ListingsContainer = styled.div<{ currentIndex: number }>`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  padding: 0;
  transform: translateY(${props => -props.currentIndex * 220}px);
  transition: transform 0.3s ease;
`;

const NavigationControls = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const NavButton = styled.button<{ disabled?: boolean }>`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.3);
  }
  
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const ListingCard = styled.div`
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 16px;
  transition: all 0.3s ease;
  height: 200px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  margin-top: 4px; /* Small margin to prevent clipping */
  
  &:hover {
    border-color: rgba(255, 255, 255, 0.2);
    background: rgba(255, 255, 255, 0.12);
    transform: translateY(-4px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
  }
`;

const CardHeader = styled.div`
  flex-shrink: 0;
`;

const DomainName = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  color: white;
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
  gap: 6px;
  overflow: hidden;
`;

const OmnichainBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 6px;
  background: linear-gradient(135deg, #00d2ff 0%, #0099cc 100%);
  border-radius: 8px;
  font-size: 0.7rem;
  font-weight: 600;
  color: white;
  border: 1px solid rgba(0, 210, 255, 0.3);
  box-shadow: 0 2px 6px rgba(0, 210, 255, 0.2);
  animation: omnichainGlow 2s ease-in-out infinite alternate;
  
  @keyframes omnichainGlow {
    from {
      box-shadow: 0 2px 6px rgba(0, 210, 255, 0.2);
    }
    to {
      box-shadow: 0 3px 12px rgba(0, 210, 255, 0.4);
    }
  }
`;

const NetworkBadge = styled.div<{ color: string }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 6px;
  background: ${props => `linear-gradient(135deg, ${props.color}20 0%, ${props.color}10 100%)`};
  border: 1px solid ${props => `${props.color}40`};
  border-radius: 8px;
  font-size: 0.7rem;
  font-weight: 600;
  color: ${props => props.color};
`;

const DomainNameWithBadge = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const BadgeContainer = styled.div`
  display: flex;
  gap: 6px;
  align-items: center;
  flex-wrap: wrap;
`;

const ListingInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const Price = styled.div`
  font-size: 1.2rem;
  font-weight: 700;
  color: #22c55e;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const ListingType = styled.div<{ type: string }>`
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
  background: ${props => props.type === 'auction' ? 'rgba(255, 193, 7, 0.2)' : 'rgba(34, 197, 94, 0.2)'};
  color: ${props => props.type === 'auction' ? '#ffc107' : '#22c55e'};
  border: 1px solid ${props => props.type === 'auction' ? 'rgba(255, 193, 7, 0.3)' : 'rgba(34, 197, 94, 0.3)'};
  display: flex;
  align-items: center;
  gap: 4px;
`;

const CardContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

const SellerInfo = styled.div`
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const CardFooter = styled.div`
  flex-shrink: 0;
`;

const ActionButton = styled.button`
  width: 100%;
  padding: 10px 0;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, #22c55e 0%, #065f46 100%);
  color: white;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(34, 197, 94, 0.4);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const EmptyState = styled.div`
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
`;

const LoadingState = styled.div`
  grid-column: 1 / -1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 60px 20px;
  color: rgba(255, 255, 255, 0.7);
`;

interface MarketplaceListingsProps {
    onBuyDomain?: (listing: MarketplaceListing) => void;
    onMakeOffer?: (listing: MarketplaceListing) => void;
}

export function MarketplaceListings({ onBuyDomain, onMakeOffer }: MarketplaceListingsProps) {
    const [listings, setListings] = useState<MarketplaceListing[]>([]);
    const [filteredListings, setFilteredListings] = useState<MarketplaceListing[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentListingIndex, setCurrentListingIndex] = useState(0);
    const [domainInfoCache, setDomainInfoCache] = useState<{[key: string]: any}>({});
    const { address } = useAccount();
    const currentChainId = useChainId() || 421614;

    useEffect(() => {
        loadListings();
    }, []);

    // Load domain info from blockchain
    const loadDomainInfo = async (domainName: string) => {
        if (!window.ethereum || domainInfoCache[domainName]) return domainInfoCache[domainName];

        try {
            const contract = getOmnichainContract(window.ethereum, currentChainId);
            const info = await contract.getDomainInfo(domainName.replace('.zeta', ''));
            
            // Cache the result
            setDomainInfoCache(prev => ({
                ...prev,
                [domainName]: info
            }));
            
            return info;
        } catch (error) {
            console.error('Failed to load domain info for', domainName, error);
            return null;
        }
    };

    const loadListings = async () => {
        try {
            setLoading(true);
            const data = await marketplaceService.getActiveListings();
            setListings(data);
            setFilteredListings(data);

            // Load domain info for each listing in background
            data.forEach(listing => {
                if (listing.domain?.name) {
                    loadDomainInfo(`${listing.domain.name}.zeta`);
                }
            });
        } catch (error) {
            console.error('Failed to load marketplace listings:', error);
        } finally {
            setLoading(false);
        }
    };

    // Filter listings based on search term
    useEffect(() => {
        if (!searchTerm.trim()) {
            setFilteredListings(listings);
        } else {
            const filtered = listings.filter(listing => {
                const domainName = listing.domain?.name;
                const fullDomainName = domainName ? `${domainName}.ctc` : '';
                return fullDomainName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       domainName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       listing.seller_address.toLowerCase().includes(searchTerm.toLowerCase());
            });
            setFilteredListings(filtered);
        }
        setCurrentListingIndex(0); // Reset index when filtering
    }, [searchTerm, listings]);

    // Navigation functions
    const goToPreviousListing = () => {
        setCurrentListingIndex(prev => Math.max(0, prev - 1));
    };

    const goToNextListing = () => {
        const maxIndex = Math.max(0, filteredListings.length - 2);
        setCurrentListingIndex(prev => Math.min(maxIndex, prev + 1));
    };

    const formatAddress = (address: string) => {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    const formatPrice = (price: string, currency: string = 'ETH') => {
        return `${price} ${currency}`;
    };

    if (loading) {
        return (
            <MarketplaceContainer>
                <ListingsContainer currentIndex={0}>
                    <LoadingState>
                        <div>Loading marketplace listings...</div>
                    </LoadingState>
                </ListingsContainer>
            </MarketplaceContainer>
        );
    }

    if (listings.length === 0) {
        return (
            <MarketplaceContainer>
                <ListingsContainer currentIndex={0}>
                    <EmptyState>
                        <FaTag size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                        <h3 style={{ marginBottom: '8px', fontSize: '1.2rem' }}>No Listings Available</h3>
                        <p>There are currently no domains listed for sale.</p>
                    </EmptyState>
                </ListingsContainer>
            </MarketplaceContainer>
        );
    }

    return (
        <MarketplaceContainer>
            <SearchContainer>
                <SearchIcon>
                    <FaSearch size={16} />
                </SearchIcon>
                <SearchInput
                    type="text"
                    placeholder="Search domains or seller addresses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </SearchContainer>

            <ResultsHeader>
                <span>
                    {filteredListings.length > 2
                        ? `Showing ${Math.min(2, filteredListings.length - currentListingIndex)} of ${filteredListings.length} listings`
                        : searchTerm
                            ? `${filteredListings.length} of ${listings.length} listings`
                            : `${listings.length} listing${listings.length > 1 ? 's' : ''}`
                    }
                </span>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'rgba(34, 197, 94, 0.8)',
                                cursor: 'pointer',
                                fontSize: '0.9rem'
                            }}
                        >
                            Clear search
                        </button>
                    )}
                    {filteredListings.length > 2 && (
                        <NavigationControls>
                            <NavButton
                                onClick={goToPreviousListing}
                                disabled={currentListingIndex === 0}
                            >
                                <FaChevronUp size={14} />
                            </NavButton>
                            <NavButton
                                onClick={goToNextListing}
                                disabled={currentListingIndex >= Math.max(0, filteredListings.length - 2)}
                            >
                                <FaChevronDown size={14} />
                            </NavButton>
                        </NavigationControls>
                    )}
                </div>
            </ResultsHeader>

            {filteredListings.length === 0 && searchTerm ? (
                <ListingsContainer currentIndex={0}>
                    <EmptyState>
                        <FaSearch size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                        <h3 style={{ marginBottom: '8px', fontSize: '1.2rem' }}>No Results Found</h3>
                        <p>No listings match your search criteria.</p>
                    </EmptyState>
                </ListingsContainer>
            ) : (
                <ListingsViewport itemCount={filteredListings.length}>
                    <ListingsContainer currentIndex={currentListingIndex}>
                        {filteredListings.map((listing) => (
                            <ListingCard key={listing.id}>
                                <CardHeader>
                                    <DomainNameWithBadge>
                                        <DomainName>
                                            <FaEthereum size={18} />
                                            {listing.domain?.name ? `${listing.domain.name}.zeta` : 'Unknown Domain'}
                                        </DomainName>
                                        {listing.domain?.name && (
                                          <BadgeContainer>
                                            {(() => {
                                              const domainInfo = domainInfoCache[`${listing.domain.name}.zeta`];
                                              if (domainInfo?.isOmnichain) {
                                                return (
                                                  <OmnichainBadge>
                                                    <FaGlobe size={8} />
                                                    Omnichain
                                                  </OmnichainBadge>
                                                );
                                              } else if (domainInfo?.sourceChainId) {
                                                const chainConfig = getChainConfig(domainInfo.sourceChainId);
                                                return chainConfig ? (
                                                  <NetworkBadge color={chainConfig.color}>
                                                    <div style={{ 
                                                      width: '6px', 
                                                      height: '6px', 
                                                      borderRadius: '50%', 
                                                      backgroundColor: chainConfig.color 
                                                    }} />
                                                    {chainConfig.shortName}
                                                  </NetworkBadge>
                                                ) : null;
                                              }
                                              return null;
                                            })()}
                                          </BadgeContainer>
                                        )}
                                    </DomainNameWithBadge>

                                    <ListingInfo>
                                        <Price>
                                            <FaEthereum size={14} />
                                            {formatPrice(listing.price, listing.currency)}
                                        </Price>
                                        <ListingType type={listing.listing_type}>
                                            {listing.listing_type === 'auction' ? <FaGavel size={10} /> : <FaTag size={10} />}
                                            {listing.listing_type === 'auction' ? 'Auction' : 'Fixed Price'}
                                        </ListingType>
                                    </ListingInfo>
                                </CardHeader>

                                <CardContent>
                                    <div>
                                        <SellerInfo>
                                            Seller: {formatAddress(listing.seller_address)}
                                        </SellerInfo>

                                        {listing.listing_type === 'auction' && listing.auction_end_time && (
                                            <div style={{
                                                fontSize: '0.8rem',
                                                color: 'rgba(255, 255, 255, 0.6)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                marginBottom: '6px'
                                            }}>
                                                <FaClock size={10} />
                                                Ends: {new Date(listing.auction_end_time).toLocaleDateString()}
                                            </div>
                                        )}
                                    </div>
                                </CardContent>

                                <CardFooter>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        {listing.listing_type === 'fixed_price' && (
                                            <ActionButton
                                                onClick={() => onBuyDomain?.(listing)}
                                                disabled={!address || listing.seller_address.toLowerCase() === address?.toLowerCase()}
                                            >
                                                {!address ? 'Connect Wallet' :
                                                    listing.seller_address.toLowerCase() === address?.toLowerCase() ? 'Your Listing' :
                                                        'Buy Now'}
                                            </ActionButton>
                                        )}

                                        {listing.listing_type === 'auction' && (
                                            <ActionButton
                                                onClick={() => onMakeOffer?.(listing)}
                                                disabled={!address || listing.seller_address.toLowerCase() === address?.toLowerCase()}
                                            >
                                                {!address ? 'Connect Wallet' :
                                                    listing.seller_address.toLowerCase() === address?.toLowerCase() ? 'Your Auction' :
                                                        'Place Bid'}
                                            </ActionButton>
                                        )}
                                    </div>
                                </CardFooter>
                            </ListingCard>
                        ))}
                    </ListingsContainer>
                </ListingsViewport>
            )}
        </MarketplaceContainer>
    );
}