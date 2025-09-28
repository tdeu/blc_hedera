import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Separator } from './ui/separator';
import {
  ShoppingBag,
  Search,
  Filter,
  ArrowUpDown,
  Clock,
  Tag,
  TrendingUp,
  TrendingDown,
  Eye,
  Image,
  Users,
  BarChart3,
  Target,
  DollarSign
} from 'lucide-react';
import { toast } from 'sonner';
import { PositionNFT, NFTListing, NFTMarketplaceFilters } from '../types/nft';
import { getMockMarketplaceListings } from '../utils/mockNFTData';

interface NFTMarketplaceProps {
  walletConnected?: boolean;
  walletAddress?: string;
  onConnectWallet?: () => void;
}

export default function NFTMarketplace({
  walletConnected = false,
  walletAddress,
  onConnectWallet
}: NFTMarketplaceProps) {
  const [activeTab, setActiveTab] = useState('browse');
  const [listings, setListings] = useState<NFTListing[]>([]);
  const [filteredListings, setFilteredListings] = useState<NFTListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<NFTMarketplaceFilters>({
    position: 'all',
    sortBy: 'price',
    sortOrder: 'asc'
  });

  // Load marketplace listings
  useEffect(() => {
    const loadListings = async () => {
      setIsLoading(true);
      try {
        // For now, use mock data - will be replaced with actual blockchain calls
        const mockListings = getMockMarketplaceListings(walletAddress);
        setListings(mockListings);
        setFilteredListings(mockListings);
      } catch (error) {
        console.error('Failed to load marketplace listings:', error);
        setListings([]);
        setFilteredListings([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadListings();
  }, [walletAddress]);

  // Apply filters and search
  useEffect(() => {
    let filtered = [...listings];

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(listing =>
        listing.nft.marketClaim.toLowerCase().includes(searchQuery.toLowerCase()) ||
        listing.nft.marketCategory?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply position filter
    if (filters.position !== 'all') {
      filtered = filtered.filter(listing => listing.nft.position === filters.position);
    }

    // Apply price range filter
    if (filters.priceRange) {
      filtered = filtered.filter(listing =>
        listing.price >= (filters.priceRange?.min || 0) &&
        listing.price <= (filters.priceRange?.max || Infinity)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: number, bValue: number;

      switch (filters.sortBy) {
        case 'price':
          aValue = a.price;
          bValue = b.price;
          break;
        case 'profit':
          aValue = a.nft.profitLoss || 0;
          bValue = b.nft.profitLoss || 0;
          break;
        case 'expiry':
          aValue = a.nft.marketEndTime.getTime();
          bValue = b.nft.marketEndTime.getTime();
          break;
        default:
          aValue = a.price;
          bValue = b.price;
      }

      return filters.sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

    setFilteredListings(filtered);
  }, [listings, searchQuery, filters]);

  const getPositionBadge = (position: string) => {
    return position === 'yes' ?
      <Badge className="bg-primary/20 text-primary border-primary/30">TRUE</Badge> :
      <Badge className="bg-secondary/20 text-secondary border-secondary/30">FALSE</Badge>;
  };

  const formatTimeUntilExpiry = (date: Date) => {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h left`;
    if (hours > 0) return `${hours}h left`;
    return 'Expires soon';
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return `${minutes}m ago`;
  };

  const handlePurchaseNFT = (listing: NFTListing) => {
    if (!walletConnected) {
      toast.error('Please connect your wallet to purchase NFTs');
      onConnectWallet?.();
      return;
    }

    // For frontend demo
    toast.success(`Successfully purchased NFT #${listing.tokenId} for ${listing.price.toFixed(3)} CAST! (Frontend demo)`);
  };

  const marketStats = {
    totalListings: listings.length,
    averagePrice: listings.length > 0 ? listings.reduce((sum, l) => sum + l.price, 0) / listings.length : 0,
    totalVolume: listings.reduce((sum, l) => sum + l.price, 0),
    uniqueSellers: new Set(listings.map(l => l.seller)).size
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary mb-1 flex items-center gap-2">
            <ShoppingBag className="h-7 w-7" />
            NFT Marketplace
          </h1>
          <p className="text-sm text-muted-foreground">
            Trade betting position NFTs • Discover arbitrage opportunities • Buy and sell positions
          </p>
        </div>

        {/* Wallet Connection */}
        {!walletConnected && (
          <Button onClick={onConnectWallet} className="gap-2">
            <DollarSign className="h-4 w-4" />
            Connect Wallet to Trade
          </Button>
        )}
      </div>

      {/* Market Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <ShoppingBag className="h-5 w-5 text-primary" />
              <span className="font-semibold text-primary">Active Listings</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{marketStats.totalListings}</p>
            <p className="text-sm text-muted-foreground">Available for purchase</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-5 w-5 text-secondary" />
              <span className="font-semibold text-secondary">Avg. Price</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{marketStats.averagePrice.toFixed(3)} CAST</p>
            <p className="text-sm text-muted-foreground">Market average</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-5 w-5 text-green-500" />
              <span className="font-semibold text-green-500">Total Volume</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{marketStats.totalVolume.toFixed(3)} CAST</p>
            <p className="text-sm text-muted-foreground">Listed volume</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-5 w-5 text-yellow-500" />
              <span className="font-semibold text-yellow-500">Active Sellers</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{marketStats.uniqueSellers}</p>
            <p className="text-sm text-muted-foreground">Unique addresses</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="browse" className="gap-2">
            <Search className="h-4 w-4" />
            Browse NFTs ({filteredListings.length})
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Market Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-6">
          {/* Filters */}
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filter & Search
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search markets..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={filters.position} onValueChange={(value: any) => setFilters({...filters, position: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Position" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Positions</SelectItem>
                    <SelectItem value="yes">TRUE Positions</SelectItem>
                    <SelectItem value="no">FALSE Positions</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.sortBy} onValueChange={(value: any) => setFilters({...filters, sortBy: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="price">Price</SelectItem>
                    <SelectItem value="profit">Profit Potential</SelectItem>
                    <SelectItem value="expiry">Time to Expiry</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  onClick={() => setFilters({...filters, sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc'})}
                  className="gap-2"
                >
                  <ArrowUpDown className="h-4 w-4" />
                  {filters.sortOrder === 'asc' ? 'Low to High' : 'High to Low'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Listings */}
          {isLoading ? (
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
              <CardContent className="p-8 text-center">
                <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <ShoppingBag className="h-8 w-8 text-muted-foreground animate-pulse" />
                </div>
                <h3 className="text-lg font-medium mb-2 text-foreground">Loading Marketplace...</h3>
                <p className="text-muted-foreground">
                  Fetching available position NFTs from the blockchain.
                </p>
              </CardContent>
            </Card>
          ) : filteredListings.length === 0 ? (
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
              <CardContent className="p-8 text-center">
                <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <Image className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2 text-foreground">No NFTs Found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || filters.position !== 'all'
                    ? 'No position NFTs match your current filters. Try adjusting your search criteria.'
                    : 'No position NFTs are currently listed for sale. Check back later!'
                  }
                </p>
                {(searchQuery || filters.position !== 'all') && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery('');
                      setFilters({...filters, position: 'all'});
                    }}
                    className="gap-2"
                  >
                    <Filter className="h-4 w-4" />
                    Clear Filters
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredListings.map((listing) => (
                <Card key={`${listing.tokenId}-${listing.seller}`} className="border-border/50 bg-card/80 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2">
                          <Badge className="gap-1">
                            <Tag className="h-3 w-3" />
                            NFT #{listing.tokenId}
                          </Badge>
                          {getPositionBadge(listing.nft.position)}
                          <Badge variant="outline" className="gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTimeUntilExpiry(listing.nft.marketEndTime)}
                          </Badge>
                          <Badge variant="outline" className="gap-1">
                            Listed {formatTimeAgo(listing.createdAt)}
                          </Badge>
                        </div>

                        <h3 className="font-semibold text-foreground leading-tight">
                          {listing.nft.marketClaim}
                        </h3>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Listing Price:</span>
                            <div className="font-semibold text-primary text-lg">{listing.price.toFixed(3)} CAST</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Original Cost:</span>
                            <div className="font-semibold text-foreground">{listing.nft.originalPrice.toFixed(3)} CAST</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Market Price:</span>
                            <div className="font-semibold text-foreground">{listing.nft.currentMarketPrice.toFixed(3)} CAST</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Max Payout:</span>
                            <div className="font-semibold text-green-500">{listing.nft.potentialPayout.toFixed(3)} CAST</div>
                          </div>
                        </div>

                        {/* Price Comparison */}
                        <div className="bg-muted/20 rounded-lg p-3">
                          <div className="flex items-center justify-between text-sm">
                            <span>vs. Direct Betting:</span>
                            <div className="flex items-center gap-2">
                              {listing.price < listing.nft.currentMarketPrice ? (
                                <>
                                  <TrendingDown className="h-4 w-4 text-green-500" />
                                  <span className="font-semibold text-green-500">
                                    Save {(listing.nft.currentMarketPrice - listing.price).toFixed(3)} CAST
                                  </span>
                                </>
                              ) : (
                                <>
                                  <TrendingUp className="h-4 w-4 text-red-500" />
                                  <span className="font-semibold text-red-500">
                                    +{(listing.price - listing.nft.currentMarketPrice).toFixed(3)} CAST premium
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Button
                          onClick={() => handlePurchaseNFT(listing)}
                          className="gap-1"
                          disabled={!walletConnected}
                        >
                          <ShoppingBag className="h-3 w-3" />
                          Buy Now
                        </Button>
                        <Button variant="outline" size="sm" className="gap-1">
                          <Eye className="h-3 w-3" />
                          View Market
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Market Analytics
              </CardTitle>
              <CardDescription>
                NFT trading statistics and market insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <BarChart3 className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2 text-foreground">Analytics Coming Soon</h3>
                <p className="text-muted-foreground">
                  Detailed market analytics, price trends, and trading insights will be available in the next update.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}