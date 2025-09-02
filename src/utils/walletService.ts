import { ethers } from 'ethers';
import { toast } from 'sonner';

export interface WalletConnection {
  address: string;
  balance: string;
  isConnected: boolean;
  chainId: number;
  provider?: ethers.BrowserProvider;
  signer?: ethers.JsonRpcSigner;
}

declare global {
  interface Window {
    ethereum?: any;
  }
}

export class WalletService {
  private static instance: WalletService;
  private connection: WalletConnection | null = null;

  static getInstance(): WalletService {
    if (!WalletService.instance) {
      WalletService.instance = new WalletService();
    }
    return WalletService.instance;
  }

  async connectMetaMask(): Promise<WalletConnection> {
    if (!window.ethereum) {
      throw new Error('MetaMask not installed. Please install MetaMask to continue.');
    }

    try {
      console.log('🔄 Connecting to MetaMask...');
      
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found. Please unlock MetaMask.');
      }

      console.log('✅ Account access granted:', accounts[0]);

      // Create provider and signer
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      console.log('🔄 Switching to Hedera testnet...');
      
      // Switch to Hedera testnet if not already there
      await this.ensureHederaTestnet();

      console.log('✅ Network switched successfully');

      // Get balance after network switch
      const balance = await provider.getBalance(accounts[0]);
      const chainId = await provider.getNetwork();

      this.connection = {
        address: accounts[0],
        balance: ethers.formatEther(balance),
        isConnected: true,
        chainId: Number(chainId.chainId),
        provider,
        signer
      };

      // Listen for account changes
      this.setupEventListeners();

      console.log('✅ Wallet connected successfully:', {
        address: this.connection.address,
        balance: this.connection.balance,
        chainId: this.connection.chainId
      });

      return this.connection;
    } catch (error: any) {
      console.error('❌ Failed to connect wallet:', error);
      
      // Provide more specific error messages
      if (error.code === 4001) {
        throw new Error('Connection rejected by user');
      } else if (error.code === -32002) {
        throw new Error('Connection request already pending');
      } else if (error.message?.includes('network')) {
        throw new Error('Failed to connect to Hedera Testnet. Please check your internet connection.');
      } else {
        throw new Error(`Failed to connect wallet: ${error.message || 'Unknown error'}`);
      }
    }
  }

  async ensureHederaTestnet(): Promise<void> {
    if (!window.ethereum) return;

    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    const hederaTestnetChainId = '0x128'; // 296 in hex

    if (chainId !== hederaTestnetChainId) {
      try {
        // Try to switch to Hedera Testnet
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: hederaTestnetChainId }],
        });
      } catch (switchError: any) {
        // If the chain is not added, add it
        if (switchError.code === 4902 || switchError.code === -32602) {
          console.log('Adding Hedera Testnet to MetaMask...');
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: hederaTestnetChainId,
              chainName: 'Hedera Testnet',
              nativeCurrency: {
                name: 'HBAR',
                symbol: 'HBAR',
                decimals: 18
              },
              rpcUrls: ['https://testnet.hashio.io/api'],
              blockExplorerUrls: ['https://hashscan.io/testnet/'],
              iconUrls: ['https://s2.coinmarketcap.com/static/img/coins/64x64/4642.png']
            }]
          });
          
          console.log('Hedera Testnet added successfully');
        } else {
          console.error('Failed to switch to Hedera Testnet:', switchError);
          throw switchError;
        }
      }
    }
  }

  private setupEventListeners(): void {
    if (!window.ethereum) return;

    window.ethereum.on('accountsChanged', (accounts: string[]) => {
      if (accounts.length === 0) {
        this.disconnect();
      } else {
        this.refreshConnection();
      }
    });

    window.ethereum.on('chainChanged', () => {
      this.refreshConnection();
    });
  }

  private async refreshConnection(): Promise<void> {
    if (this.connection) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.listAccounts();
        
        if (accounts.length > 0) {
          const balance = await provider.getBalance(accounts[0]);
          const chainId = await provider.getNetwork();
          
          this.connection = {
            ...this.connection,
            address: accounts[0].address,
            balance: ethers.formatEther(balance),
            chainId: Number(chainId.chainId),
            provider,
            signer: await provider.getSigner()
          };
        }
      } catch (error) {
        console.error('Failed to refresh connection:', error);
      }
    }
  }

  disconnect(): void {
    this.connection = null;
    console.log('🔌 Wallet disconnected');
  }

  getConnection(): WalletConnection | null {
    return this.connection;
  }

  isConnected(): boolean {
    return this.connection !== null && this.connection.isConnected;
  }

  async getBalance(): Promise<string> {
    if (!this.connection || !this.connection.provider) {
      return '0';
    }

    try {
      const balance = await this.connection.provider.getBalance(this.connection.address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('Failed to get balance:', error);
      return '0';
    }
  }

  async getCastTokenBalance(): Promise<string> {
    if (!this.connection || !this.connection.provider) {
      return '0';
    }

    try {
      const castTokenAddress = '0xF6CbeE28F6B652b09c18b6aF5ACEC57B4840b54c';
      const erc20ABI = [
        "function balanceOf(address account) external view returns (uint256)",
        "function decimals() external view returns (uint8)"
      ];

      const castToken = new ethers.Contract(castTokenAddress, erc20ABI, this.connection.provider);
      const balance = await castToken.balanceOf(this.connection.address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('Failed to get CastToken balance:', error);
      return '0';
    }
  }

  async checkMetaMaskInstalled(): Promise<boolean> {
    return typeof window.ethereum !== 'undefined';
  }

  async autoConnect(): Promise<WalletConnection | null> {
    if (!window.ethereum) return null;

    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts && accounts.length > 0) {
        return await this.connectMetaMask();
      }
    } catch (error) {
      console.log('No existing connection found');
    }
    
    return null;
  }
}

export const walletService = WalletService.getInstance();