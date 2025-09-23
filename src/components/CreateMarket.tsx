import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ArrowLeft, Plus, Sparkles, Upload, X, Image, Lock, DollarSign, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { BettingMarket } from './BettingMarkets';
import { uploadMarketImage } from '../utils/supabase';
import { MARKET_CREATION, CollateralToken, TOKEN_CONFIG, DISPUTE_PERIOD } from '../config/constants';
import TokenService from '../utils/tokenService';

interface CreateMarketProps {
  onBack: () => void;
  onCreateMarket: (market: Partial<BettingMarket>) => void;
  marketContext?: 'truth-markets' | 'verify-truth';
}

export default function CreateMarket({ onBack, onCreateMarket, marketContext = 'truth-markets' }: CreateMarketProps) {
  const [formData, setFormData] = useState({
    claim: '',
    description: '',
    category: '',
    source: '',
    country: '',
    region: '',
    confidenceLevel: 'medium' as 'high' | 'medium' | 'low',
    marketType: 'future' as 'present' | 'future'
  });
  const [expirationDate, setExpirationDate] = useState<Date>();
  const [isCreating, setIsCreating] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Collateral state
  const [collateralToken, setCollateralToken] = useState<CollateralToken>(TokenService.getDisplayTokenSymbol());
  const [collateralAmount, setCollateralAmount] = useState<string>(MARKET_CREATION.DEFAULT_COLLATERAL_AMOUNT);
  const [userBalance, setUserBalance] = useState<string>('100'); // Mock balance for demo

  const categories = [
    'Politics', 'Finance', 'Sports', 'Entertainment', 
    'Technology', 'Health', 'Climate', 'Celebrity Gossip'
  ];

  const countries = [
    'Nigeria', 'Kenya', 'South Africa', 'Ghana', 'Morocco', 
    'Senegal', 'Egypt', 'Tanzania', 'Uganda', 'Ethiopia'
  ];

  const regions = [
    'West Africa', 'East Africa', 'Southern Africa', 
    'North Africa', 'Central Africa', 'Continental Africa'
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Collateral validation helpers
  const getMinCollateral = (token: CollateralToken): string => {
    return token === 'HBAR' ? MARKET_CREATION.MIN_COLLATERAL_HBAR : MARKET_CREATION.MIN_COLLATERAL_CAST;
  };

  const isCollateralValid = (): boolean => {
    const validation = TokenService.validateDisplayAmount(
      collateralAmount,
      getMinCollateral(collateralToken),
      userBalance
    );
    return validation.isValid;
  };

  const getCollateralError = (): string | null => {
    const validation = TokenService.validateDisplayAmount(
      collateralAmount,
      getMinCollateral(collateralToken),
      userBalance
    );
    return validation.error || null;
  };

  // Get conversion info for display
  const conversionInfo = TokenService.getConversionInfo();

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }

      setSelectedImage(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const uploadImageToSupabase = async (imageFile: File): Promise<string | null> => {
    try {
      const result = await uploadMarketImage(imageFile);

      if (result.success && result.url) {
        return result.url;
      } else {
        console.error('Image upload failed:', result.error);
        toast.error('Failed to upload image: ' + result.error);
        return null;
      }
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error('Failed to upload image');
      return null;
    }
  };

  const handleSubmit = async () => {
    // For truth markets (future events), expiration date is required
    // For verify truth (past events), expiration date is not required
    const requiresExpirationDate = marketContext === 'truth-markets';

    if (!formData.claim || !formData.description || !formData.category || (requiresExpirationDate && !expirationDate)) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.claim.length < MARKET_CREATION.MIN_CLAIM_LENGTH) {
      toast.error(`Market claim must be at least ${MARKET_CREATION.MIN_CLAIM_LENGTH} characters`);
      return;
    }

    // Validate collateral
    const collateralError = getCollateralError();
    if (collateralError) {
      toast.error(collateralError);
      return;
    }

    // Only validate expiration date if it's required (truth markets)
    if (requiresExpirationDate && expirationDate && expirationDate <= new Date()) {
      toast.error('Expiration date must be in the future');
      return;
    }

    setIsCreating(true);

    try {
      let imageUrl: string | undefined = undefined;

      // Upload image first if one is selected
      console.log('🔍 DEBUG: selectedImage exists?', !!selectedImage);
      console.log('🔍 DEBUG: selectedImage details:', selectedImage);

      if (selectedImage) {
        console.log('🖼️ Uploading image to Supabase...', selectedImage.name);
        imageUrl = await uploadImageToSupabase(selectedImage);
        if (!imageUrl) {
          // Image upload failed, stop the process
          setIsCreating(false);
          return;
        }
        console.log('✅ Image uploaded successfully:', imageUrl);
      }

      const newMarket: Partial<BettingMarket> = {
        ...formData,
        expiresAt: marketContext === 'truth-markets' ? expirationDate : new Date(), // Past events expire immediately
        status: 'pending_approval', // Markets now require admin approval
        trending: false,
        totalPool: 0,
        yesPool: 0,
        noPool: 0,
        yesOdds: 2.0,
        noOdds: 2.0,
        totalCasters: 0,
        imageUrl: imageUrl, // Include the uploaded image URL
        // Add collateral information
        collateral: {
          displayToken: collateralToken,
          displayAmount: collateralAmount,
          contractToken: TokenService.getContractTokenSymbol(),
          contractAmount: TokenService.toContractAmount(collateralAmount),
          deposited: false // Will be set when actually deposited
        }
      };

      console.log('📤 Creating market with data:', {
        claim: newMarket.claim,
        imageUrl: newMarket.imageUrl,
        hasImage: !!imageUrl
      });

      await onCreateMarket(newMarket);
      onBack();
    } catch (error) {
      toast.error('Failed to create market. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Markets
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            <Plus className="h-6 w-6" />
            {marketContext === 'truth-markets' ? 'Create Truth Market' : 'Submit Past Event'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {marketContext === 'truth-markets'
              ? 'Create a new prediction market for community truth verification'
              : 'Submit a past event for truth verification and community review'
            }
          </p>
        </div>
      </div>

      {/* Create Market Form */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Market Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Market Claim */}
          <div className="space-y-2">
            <Label htmlFor="claim">
              Market Claim <span className="text-red-500">*</span>
            </Label>
            <Input
              id="claim"
              value={formData.claim}
              onChange={(e) => handleInputChange('claim', e.target.value)}
              placeholder="Will [specific event] happen by [date]?"
              className="text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Make it specific and verifiable. Example: "Will Nigeria's GDP growth exceed 5% in 2025?"
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Description <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Provide context and details about this market..."
              className="min-h-[100px] text-sm"
            />
          </div>

          {/* Photo Upload */}
          <div className="space-y-2">
            <Label htmlFor="image-upload">
              Upload Photo (Optional)
            </Label>
            <div className="space-y-3">
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Market preview"
                    className="w-full h-48 object-cover rounded-lg border-2 border-border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={removeImage}
                    className="absolute top-2 right-2"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                  <Input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Label htmlFor="image-upload" className="cursor-pointer">
                    <div className="flex flex-col items-center gap-2">
                      <Image className="h-8 w-8 text-muted-foreground" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Click to upload an image</p>
                        <p className="text-xs text-muted-foreground">
                          PNG, JPG up to 5MB
                        </p>
                      </div>
                    </div>
                  </Label>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              This photo will be visible to admins during validation and displayed on the market card once approved.
            </p>
          </div>

          {/* Category and Source */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>
                Category <span className="text-red-500">*</span>
              </Label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="source">
                Source <span className="text-red-500">*</span>
              </Label>
              <Input
                id="source"
                value={formData.source}
                onChange={(e) => handleInputChange('source', e.target.value)}
                placeholder="Official source or organization"
                className="text-sm"
              />
            </div>
          </div>

          {/* Location and Market Type */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Country (Optional)</Label>
              <Select value={formData.country} onValueChange={(value) => handleInputChange('country', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Region (Optional)</Label>
              <Select value={formData.region} onValueChange={(value) => handleInputChange('region', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  {regions.map((region) => (
                    <SelectItem key={region} value={region}>
                      {region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Market Type</Label>
              <Select value={formData.marketType} onValueChange={(value) => handleInputChange('marketType', value as 'present' | 'future')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="present">Present (Current events)</SelectItem>
                  <SelectItem value="future">Future (Predictions)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Confidence Level and Expiration */}
          <div className={`grid grid-cols-1 gap-4 ${marketContext === 'truth-markets' ? 'md:grid-cols-2' : ''}`}>
            <div className="space-y-2">
              <Label>Confidence Level</Label>
              <Select value={formData.confidenceLevel} onValueChange={(value) => handleInputChange('confidenceLevel', value as 'high' | 'medium' | 'low')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High (Very likely to be verifiable)</SelectItem>
                  <SelectItem value="medium">Medium (Moderately verifiable)</SelectItem>
                  <SelectItem value="low">Low (Speculative)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Only show expiration date for truth markets (future events) */}
            {marketContext === 'truth-markets' && (
              <div className="space-y-2">
                <Label htmlFor="expirationDate">
                  Expiration Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="expirationDate"
                  type="datetime-local"
                  value={expirationDate ? expirationDate.toISOString().slice(0, 16) : ''}
                  onChange={(e) => setExpirationDate(new Date(e.target.value))}
                  min={new Date().toISOString().slice(0, 16)}
                  className="text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  When should this prediction be resolved?
                </p>
              </div>
            )}
          </div>

          {/* Add explanation for verify truth */}
          {marketContext === 'verify-truth' && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                💡 <strong>Past Event Submission:</strong> This event will be published as 'disputable' for {DISPUTE_PERIOD.HOURS} hours, allowing the community to provide evidence and challenge the outcome.
                No expiration date is needed since this concerns a past event.
              </p>
            </div>
          )}

          {/* Collateral Requirements */}
          <div className="space-y-4 p-4 border border-border/50 rounded-lg bg-muted/20">
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-primary">Market Creation Collateral</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Token Selection */}
              <div className="space-y-2">
                <Label htmlFor="collateralToken">Collateral Token</Label>
                <Select value={collateralToken} onValueChange={(value: CollateralToken) => setCollateralToken(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select token" />
                  </SelectTrigger>
                  <SelectContent>
                    {MARKET_CREATION.SUPPORTED_COLLATERAL_TOKENS.map((token) => (
                      <SelectItem key={token} value={token}>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          {token}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Amount Input */}
              <div className="space-y-2">
                <Label htmlFor="collateralAmount">
                  Amount <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="collateralAmount"
                  type="number"
                  value={collateralAmount}
                  onChange={(e) => setCollateralAmount(e.target.value)}
                  placeholder={getMinCollateral(collateralToken)}
                  min={getMinCollateral(collateralToken)}
                  step="0.1"
                  className={getCollateralError() ? 'border-red-500' : ''}
                />
              </div>
            </div>

            {/* Balance and Requirements Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Your Balance:</span>
                <span className="font-medium">{userBalance} {collateralToken}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Minimum Required:</span>
                <span className="font-medium">{getMinCollateral(collateralToken)} {collateralToken}</span>
              </div>
            </div>

            {/* Error Message */}
            {getCollateralError() && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="text-sm text-red-600">{getCollateralError()}</span>
              </div>
            )}

            {/* Token Conversion Info */}
            {conversionInfo.showConversion && (
              <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">Token Conversion</p>
                  <p>UI displays {conversionInfo.displayToken} for ease of use. Contracts use {conversionInfo.contractToken} tokens.</p>
                  <p className="font-mono text-xs mt-1">{conversionInfo.rate}</p>
                </div>
              </div>
            )}

            {/* Info about collateral */}
            <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">Why is collateral required?</p>
                <p>Collateral ensures market creators are committed to quality markets. It will be returned when your market is resolved successfully.</p>
                {conversionInfo.showConversion && (
                  <p className="mt-1 font-mono text-xs">
                    Contract will lock: {TokenService.toContractAmount(collateralAmount)} {conversionInfo.contractToken}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Create Button */}
          <div className="pt-4">
            <Button 
              onClick={handleSubmit}
              disabled={isCreating}
              className="w-full gap-2 bg-primary hover:bg-primary/90"
            >
              {isCreating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating Market...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  {marketContext === 'truth-markets' ? 'Create Truth Market' : 'Submit Past Event'}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}