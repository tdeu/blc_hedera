import { ethers } from 'ethers';

/**
 * Admin Signer Service
 * Manages the admin wallet for calling smart contract functions
 * Used for: preliminary resolution, final resolution, market management
 */

export interface AdminSignerConfig {
  provider: ethers.JsonRpcProvider;
  signer: ethers.Wallet;
  address: string;
}

class AdminSignerService {
  private config: AdminSignerConfig | null = null;
  private initialized: boolean = false;

  /**
   * Initialize the admin signer with private key from environment
   */
  async initialize(): Promise<AdminSignerConfig> {
    if (this.initialized && this.config) {
      return this.config;
    }

    try {
      // Get admin private key from environment
      const adminPrivateKey = import.meta.env.VITE_ADMIN_PRIVATE_KEY || import.meta.env.VITE_HEDERA_PRIVATE_KEY_EVM;

      if (!adminPrivateKey) {
        throw new Error('Admin private key not found in environment variables. Set VITE_ADMIN_PRIVATE_KEY in .env');
      }

      // Create provider for Hedera testnet
      const provider = new ethers.JsonRpcProvider('https://testnet.hashio.io/api', {
        name: 'hedera-testnet',
        chainId: 296
      });

      // Create wallet from private key
      const signer = new ethers.Wallet(adminPrivateKey, provider);
      const address = await signer.getAddress();

      console.log('✅ Admin signer initialized:', address);

      // Check balance
      const balance = await provider.getBalance(address);
      const hbarBalance = parseFloat(ethers.formatEther(balance));
      console.log('💰 Admin wallet balance:', hbarBalance, 'HBAR');

      if (hbarBalance < 1) {
        console.warn('⚠️ Low admin wallet balance! Transactions may fail. Current balance:', hbarBalance, 'HBAR');
      }

      this.config = { provider, signer, address };
      this.initialized = true;

      return this.config;

    } catch (error) {
      console.error('❌ Failed to initialize admin signer:', error);
      throw error;
    }
  }

  /**
   * Get the admin signer (initializes if needed)
   */
  async getSigner(): Promise<ethers.Wallet> {
    if (!this.config) {
      await this.initialize();
    }
    return this.config!.signer;
  }

  /**
   * Get the admin address
   */
  async getAddress(): Promise<string> {
    if (!this.config) {
      await this.initialize();
    }
    return this.config!.address;
  }

  /**
   * Get the provider
   */
  async getProvider(): Promise<ethers.JsonRpcProvider> {
    if (!this.config) {
      await this.initialize();
    }
    return this.config!.provider;
  }

  /**
   * Check if admin signer is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get admin wallet balance
   */
  async getBalance(): Promise<string> {
    if (!this.config) {
      await this.initialize();
    }
    const balance = await this.config!.provider.getBalance(this.config!.address);
    return ethers.formatEther(balance);
  }

  /**
   * Verify admin has minimum balance for transactions
   */
  async verifyBalance(minimumHbar: number = 1): Promise<boolean> {
    const balance = await this.getBalance();
    const balanceNum = parseFloat(balance);

    if (balanceNum < minimumHbar) {
      console.error(`❌ Insufficient admin balance: ${balanceNum} HBAR (minimum: ${minimumHbar} HBAR)`);
      return false;
    }

    console.log(`✅ Admin balance verified: ${balanceNum} HBAR`);
    return true;
  }
}

// Export singleton instance
export const adminSignerService = new AdminSignerService();

// Export helper to get admin signer for contract calls
export async function getAdminSigner(): Promise<ethers.Wallet> {
  return adminSignerService.getSigner();
}

export async function getAdminAddress(): Promise<string> {
  return adminSignerService.getAddress();
}

export async function getAdminProvider(): Promise<ethers.JsonRpcProvider> {
  return adminSignerService.getProvider();
}
