import { supabase } from './supabase';

// Marketplace Types
export interface MarketplaceListing {
  id: string;
  domain_id: string;
  seller_address: string;
  price: string;
  currency: string;
  status: 'active' | 'sold' | 'cancelled' | 'expired';
  listing_type: 'fixed_price' | 'auction';
  auction_end_time?: string;
  min_bid?: string;
  transaction_hash?: string;
  created_at: string;
  updated_at: string;
  // Relations
  domain?: {
    id: string;
    name: string;
    owner_address: string;
    expiration_date: string;
  };
}

export interface MarketplaceOffer {
  id: string;
  listing_id: string;
  domain_id: string;
  bidder_address: string;
  offer_amount: string;
  currency: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired' | 'withdrawn';
  expires_at?: string;
  signature?: string;
  transaction_hash?: string;
  created_at: string;
  updated_at: string;
  // Relations
  listing?: MarketplaceListing;
  domain?: {
    id: string;
    name: string;
  };
}

export interface MarketplaceSale {
  id: string;
  domain_id: string;
  listing_id?: string;
  offer_id?: string;
  seller_address: string;
  buyer_address: string;
  sale_price: string;
  currency: string;
  sale_type: 'direct_sale' | 'auction' | 'offer_accepted';
  transaction_hash: string;
  block_number?: number;
  gas_used?: string;
  created_at: string;
  // Relations
  domain?: {
    id: string;
    name: string;
  };
}

// Marketplace Service
export const marketplaceService = {
  // Listings
  async createListing(
    domainId: string,
    sellerAddress: string,
    price: string,
    listingType: 'fixed_price' | 'auction' = 'fixed_price',
    auctionEndTime?: string,
    minBid?: string,
    transactionHash?: string
  ): Promise<MarketplaceListing> {
    const { data, error } = await supabase
      .from('marketplace_listings')
      .insert({
        domain_id: domainId,
        seller_address: sellerAddress.toLowerCase(),
        price,
        listing_type: listingType,
        auction_end_time: auctionEndTime,
        min_bid: minBid,
        transaction_hash: transactionHash,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getActiveListings(): Promise<MarketplaceListing[]> {
    const { data, error } = await supabase
      .from('marketplace_listings')
      .select(`
        *,
        domain:domains(id, name, owner_address, expiration_date)
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getListingsByDomain(domainId: string): Promise<MarketplaceListing[]> {
    const { data, error } = await supabase
      .from('marketplace_listings')
      .select(`
        *,
        domain:domains(id, name, owner_address, expiration_date)
      `)
      .eq('domain_id', domainId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getListingsBySeller(sellerAddress: string): Promise<MarketplaceListing[]> {
    console.log('🔍 Fetching listings for seller:', sellerAddress.toLowerCase());
    
    const { data, error } = await supabase
      .from('marketplace_listings')
      .select(`
        *,
        domain:domains(id, name, owner_address, expiration_date)
      `)
      .eq('seller_address', sellerAddress.toLowerCase())
      .order('created_at', { ascending: false });

    console.log('📊 Marketplace listings query result:', { data, error });
    
    if (error) {
      console.error('❌ Error fetching listings:', error);
      throw error;
    }
    
    console.log('✅ Found listings:', data?.length || 0);
    return data || [];
  },

  async updateListingStatus(
    listingId: string,
    status: 'active' | 'sold' | 'cancelled' | 'expired',
    transactionHash?: string
  ): Promise<MarketplaceListing> {
    const updateData: any = { status };
    if (transactionHash) {
      updateData.transaction_hash = transactionHash;
    }

    const { data, error } = await supabase
      .from('marketplace_listings')
      .update(updateData)
      .eq('id', listingId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateListingOwnership(
    listingId: string,
    newOwnerAddress: string
  ): Promise<MarketplaceListing> {
    console.log(`Updating listing ${listingId} ownership to ${newOwnerAddress}`);
    
    const { data, error } = await supabase
      .from('marketplace_listings')
      .update({ 
        seller_address: newOwnerAddress.toLowerCase(),
        updated_at: new Date().toISOString()
      })
      .eq('id', listingId)
      .select()
      .single();

    if (error) {
      console.error('Error updating listing ownership:', error);
      throw error;
    }
    
    console.log('Listing ownership updated successfully:', data);
    return data;
  },

  // Offers
  async createOffer(
    listingId: string,
    domainId: string,
    bidderAddress: string,
    offerAmount: string,
    expiresAt?: string,
    signature?: string
  ): Promise<MarketplaceOffer> {
    const { data, error } = await supabase
      .from('marketplace_offers')
      .insert({
        listing_id: listingId,
        domain_id: domainId,
        bidder_address: bidderAddress.toLowerCase(),
        offer_amount: offerAmount,
        expires_at: expiresAt,
        signature,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getOffersByListing(listingId: string): Promise<MarketplaceOffer[]> {
    const { data, error } = await supabase
      .from('marketplace_offers')
      .select(`
        *,
        listing:marketplace_listings(*),
        domain:domains(id, name)
      `)
      .eq('listing_id', listingId)
      .order('offer_amount', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getOffersByBidder(bidderAddress: string): Promise<MarketplaceOffer[]> {
    const { data, error } = await supabase
      .from('marketplace_offers')
      .select(`
        *,
        listing:marketplace_listings(*),
        domain:domains(id, name)
      `)
      .eq('bidder_address', bidderAddress.toLowerCase())
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async updateOfferStatus(
    offerId: string,
    status: 'pending' | 'accepted' | 'rejected' | 'expired' | 'withdrawn',
    transactionHash?: string
  ): Promise<MarketplaceOffer> {
    const updateData: any = { status };
    if (transactionHash) {
      updateData.transaction_hash = transactionHash;
    }

    const { data, error } = await supabase
      .from('marketplace_offers')
      .update(updateData)
      .eq('id', offerId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Sales
  async recordSale(
    domainId: string,
    sellerAddress: string,
    buyerAddress: string,
    salePrice: string,
    saleType: 'direct_sale' | 'auction' | 'offer_accepted',
    transactionHash: string,
    listingId?: string,
    offerId?: string,
    blockNumber?: number,
    gasUsed?: string
  ): Promise<MarketplaceSale> {
    const { data, error } = await supabase
      .from('marketplace_sales')
      .insert({
        domain_id: domainId,
        listing_id: listingId,
        offer_id: offerId,
        seller_address: sellerAddress.toLowerCase(),
        buyer_address: buyerAddress.toLowerCase(),
        sale_price: salePrice,
        sale_type: saleType,
        transaction_hash: transactionHash,
        block_number: blockNumber,
        gas_used: gasUsed,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getSalesByDomain(domainId: string): Promise<MarketplaceSale[]> {
    const { data, error } = await supabase
      .from('marketplace_sales')
      .select(`
        *,
        domain:domains(id, name)
      `)
      .eq('domain_id', domainId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getRecentSales(limit: number = 10): Promise<MarketplaceSale[]> {
    const { data, error } = await supabase
      .from('marketplace_sales')
      .select(`
        *,
        domain:domains(id, name)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  async getSalesByUser(userAddress: string): Promise<MarketplaceSale[]> {
    const { data, error } = await supabase
      .from('marketplace_sales')
      .select(`
        *,
        domain:domains(id, name)
      `)
      .or(`seller_address.eq.${userAddress.toLowerCase()},buyer_address.eq.${userAddress.toLowerCase()}`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Statistics
  async getMarketplaceStats() {
    const [activeListings, totalSales, recentSales] = await Promise.all([
      supabase
        .from('marketplace_listings')
        .select('id', { count: 'exact' })
        .eq('status', 'active'),
      
      supabase
        .from('marketplace_sales')
        .select('id', { count: 'exact' }),
      
      supabase
        .from('marketplace_sales')
        .select('sale_price')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    ]);

    const totalVolume = recentSales.data?.reduce((sum, sale) => {
      return sum + parseFloat(sale.sale_price || '0');
    }, 0) || 0;

    return {
      activeListings: activeListings.count || 0,
      totalSales: totalSales.count || 0,
      weeklyVolume: totalVolume.toString(),
    };
  }
};