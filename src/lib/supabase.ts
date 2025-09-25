import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🔍 Environment Debug:', {
  supabaseUrl: supabaseUrl ? 'Found' : 'Missing',
  supabaseAnonKey: supabaseAnonKey ? 'Found' : 'Missing',
  actualUrl: supabaseUrl,
  keyLength: supabaseAnonKey?.length || 0
});

// Create a client with service role key for database operations (bypasses RLS)
export const supabase = supabaseUrl && (supabaseServiceKey || supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey, {
      db: { schema: 'public' },
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        headers: {
          apikey: supabaseServiceKey || supabaseAnonKey,
          Authorization: `Bearer ${supabaseServiceKey || supabaseAnonKey}`,
          Accept: 'application/json'
        }
      }
    })
  : null

// Test connection
if (supabase) {
  console.log('✅ Supabase connected:', supabaseUrl);
} else {
  console.error('❌ Supabase not connected - check environment variables');
  console.error('URL:', supabaseUrl);
  console.error('Key:', supabaseAnonKey ? 'Present' : 'Missing');
}

// Database types
export interface Domain {
  id: string
  name: string
  owner_address: string
  registration_date: string
  expiration_date: string
  price: string
  transaction_hash: string
  created_at: string
  updated_at: string
}

export interface DomainTransfer {
  id: string
  domain_id: string
  from_address: string
  to_address: string
  signature: string
  transaction_hash?: string
  status: 'pending' | 'completed' | 'failed'
  created_at: string
  updated_at: string
}

// Domain operations
export const domainService = {
  // Check if domain is available
  async checkAvailability(domainName: string): Promise<boolean> {
    if (!supabase) {
      console.warn('Supabase not configured, using mock data');
      // Mock response for development
      return Math.random() > 0.3; // 70% chance available
    }

    try {
      const { data, error } = await supabase
        .from('domains')
        .select('id')
        .eq('name', domainName.toLowerCase())
        .single()

      if (error && (error.code === 'PGRST116' || (error as any)?.status === 406)) {
        // Domain not found, it's available
        return true
      }

      if (error) {
        console.warn('Supabase returned error during availability check:', error);
        return true; // fail-open as available
      }

      return false
    } catch (error) {
      console.error('Error checking domain availability:', error);
      return true; // Default to available on error
    }
  },

  // Register a new domain
  async registerDomain(
    domainName: string,
    ownerAddress: string,
    price: string,
    transactionHash: string
  ): Promise<Domain> {
    console.log('🔄 Attempting to register domain:', {
      domainName,
      ownerAddress,
      price,
      transactionHash,
      supabaseConnected: !!supabase
    });

    if (!supabase) {
      console.warn('❌ Supabase not configured, using mock data');
      // Mock response for development
      const mockDomain: Domain = {
        id: 'mock-' + Date.now(),
        name: domainName.toLowerCase(),
        owner_address: ownerAddress.toLowerCase(),
        registration_date: new Date().toISOString(),
        expiration_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        price,
        transaction_hash: transactionHash,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      console.log('📝 Mock domain created:', mockDomain);
      return mockDomain;
    }

    try {
      const expirationDate = new Date()
      expirationDate.setFullYear(expirationDate.getFullYear() + 1)

      const insertData = {
        name: domainName.toLowerCase(),
        owner_address: ownerAddress.toLowerCase(),
        registration_date: new Date().toISOString(),
        expiration_date: expirationDate.toISOString(),
        price,
        transaction_hash: transactionHash
      };

      console.log('📤 Sending to Supabase:', insertData);

      const { data, error } = await supabase
        .from('domains')
        .insert(insertData)
        .select()
        .single()

      if (error) {
        console.error('❌ Supabase error:', error);
        throw new Error(`Domain registration failed: ${error.message}`)
      }

      console.log('✅ Domain registered successfully:', data);
      return data
    } catch (error: any) {
      console.error('❌ Error registering domain:', error);
      throw new Error(`Domain registration failed: ${error.message}`);
    }
  },

  // Get domains owned by an address
  async getDomainsByOwner(ownerAddress: string): Promise<Domain[]> {
    if (!supabase) {
      console.warn('Supabase not configured, using mock data');
      // Mock response for development
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('domains')
        .select('*')
        .eq('owner_address', ownerAddress.toLowerCase())
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(`Failed to fetch domains: ${error.message}`)
      }

      return data || []
    } catch (error: any) {
      console.error('Error fetching domains:', error);
      return [];
    }
  },

  // Get domain by name
  async getDomainByName(domainName: string): Promise<Domain | null> {
    if (!supabase) {
      console.warn('Supabase not configured, using mock data');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('domains')
        .select('*')
        .eq('name', domainName.toLowerCase())
        .single()

      if (error && error.code === 'PGRST116') {
        return null
      }

      if (error) {
        throw new Error(`Failed to fetch domain: ${error.message}`)
      }

      return data
    } catch (error: any) {
      console.error('Error fetching domain:', error);
      return null;
    }
  },

  // Transfer domain
  async transferDomain(
    domainId: string,
    fromAddress: string,
    toAddress: string,
    signature: string
  ): Promise<DomainTransfer> {
    if (!supabase) {
      console.warn('Supabase not configured, using mock data');
      // Mock response for development
      const mockTransfer: DomainTransfer = {
        id: 'mock-transfer-' + Date.now(),
        domain_id: domainId,
        from_address: fromAddress.toLowerCase(),
        to_address: toAddress.toLowerCase(),
        signature,
        transaction_hash: null,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      return mockTransfer;
    }

    try {
      const { data, error } = await supabase
        .from('domain_transfers')
        .insert({
          domain_id: domainId,
          from_address: fromAddress.toLowerCase(),
          to_address: toAddress.toLowerCase(),
          signature,
          status: 'pending'
        })
        .select()
        .single()

      if (error) {
        throw new Error(`Domain transfer failed: ${error.message}`)
      }

      return data
    } catch (error: any) {
      console.error('Error creating transfer:', error);
      throw new Error(`Domain transfer failed: ${error.message}`);
    }
  },

  // Complete domain transfer (legacy - for existing transfers)
  async completeDomainTransfer(
    transferId: string,
    transactionHash: string
  ): Promise<void> {
    if (!supabase) {
      console.warn('Supabase not configured, using mock data');
      return;
    }

    try {
      const { error: transferError } = await supabase
        .from('domain_transfers')
        .update({
          transaction_hash: transactionHash,
          status: 'completed'
        })
        .eq('id', transferId)

      if (transferError) {
        throw new Error(`Failed to update transfer: ${transferError.message}`)
      }

      // Get transfer details to update domain owner
      const { data: transfer, error: getError } = await supabase
        .from('domain_transfers')
        .select('domain_id, to_address')
        .eq('id', transferId)
        .single()

      if (getError) {
        throw new Error(`Failed to get transfer details: ${getError.message}`)
      }

      // Update domain owner
      const { error: domainError } = await supabase
        .from('domains')
        .update({
          owner_address: transfer.to_address
        })
        .eq('id', transfer.domain_id)

      if (domainError) {
        throw new Error(`Failed to update domain owner: ${domainError.message}`)
      }
    } catch (error: any) {
      console.error('Error completing transfer:', error);
      throw new Error(`Failed to complete transfer: ${error.message}`);
    }
  },

  // Direct domain transfer (immediate owner change)
  async directDomainTransfer(
    domainId: string,
    fromAddress: string,
    toAddress: string,
    transactionHash: string
  ): Promise<void> {
    if (!supabase) {
      console.warn('Supabase not configured, using mock data');
      return;
    }

    try {
      // Validate inputs to avoid null toLowerCase errors
      if (!fromAddress || !toAddress) {
        throw new Error('Invalid transfer addresses')
      }

      // Update domain owner directly
      const { error: domainError } = await supabase
        .from('domains')
        .update({
          owner_address: toAddress.toLowerCase(),
          updated_at: new Date().toISOString()
        })
        .eq('id', domainId)

      if (domainError) {
        throw new Error(`Failed to update domain owner: ${domainError.message}`)
      }

      // Log the transfer in domain_transfers table for history
      const { error: transferError } = await supabase
        .from('domain_transfers')
        .insert({
          domain_id: domainId,
          from_address: fromAddress.toLowerCase(),
          to_address: toAddress.toLowerCase(),
          signature: transactionHash, // Store transaction hash as signature
          transaction_hash: transactionHash,
          status: 'completed'
        })

      if (transferError) {
        console.warn('Failed to log transfer history:', transferError.message);
        // Don't throw error here, transfer is already completed
      }
    } catch (error: any) {
      console.error('Error completing direct transfer:', error);
      throw new Error(`Failed to complete transfer: ${error.message}`);
    }
  },

  // Get pending transfers for an address
  async getPendingTransfers(address: string): Promise<DomainTransfer[]> {
    if (!supabase) {
      console.warn('Supabase not configured, using mock data');
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('domain_transfers')
        .select(`
          *,
          domains (
            name
          )
        `)
        .eq('to_address', address.toLowerCase())
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(`Failed to fetch pending transfers: ${error.message}`)
      }

      return data || []
    } catch (error: any) {
      console.error('Error fetching pending transfers:', error);
      return [];
    }
  },

  // Get transfer history for an address (both sent and received)
  async getTransferHistory(address: string): Promise<DomainTransfer[]> {
    if (!supabase) {
      console.warn('Supabase not configured, using mock data');
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('domain_transfers')
        .select(`
          *,
          domains (
            name
          )
        `)
        .or(`from_address.eq.${address.toLowerCase()},to_address.eq.${address.toLowerCase()}`)
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(`Failed to fetch transfer history: ${error.message}`)
      }

      return data || []
    } catch (error: any) {
      console.error('Error fetching transfer history:', error);
      return [];
    }
  }
}