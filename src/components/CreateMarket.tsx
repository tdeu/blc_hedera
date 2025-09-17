import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ArrowLeft, Plus, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { BettingMarket } from './BettingMarkets';

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

  const handleSubmit = async () => {
    // For truth markets (future events), expiration date is required
    // For verify truth (past events), expiration date is not required
    const requiresExpirationDate = marketContext === 'truth-markets';

    if (!formData.claim || !formData.description || !formData.category || (requiresExpirationDate && !expirationDate)) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.claim.length < 10) {
      toast.error('Market claim must be at least 10 characters');
      return;
    }

    // Only validate expiration date if it's required (truth markets)
    if (requiresExpirationDate && expirationDate && expirationDate <= new Date()) {
      toast.error('Expiration date must be in the future');
      return;
    }

    setIsCreating(true);

    try {
      const newMarket: Partial<BettingMarket> = {
        ...formData,
        expiresAt: marketContext === 'truth-markets' ? expirationDate : new Date(), // Past events expire immediately
        status: marketContext === 'truth-markets' ? 'active' : 'disputable',  // Verify truth goes to disputable status
        trending: false,
        totalPool: 0,
        yesPool: 0,
        noPool: 0,
        yesOdds: 2.0,
        noOdds: 2.0,
        totalCasters: 0
      };

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
                💡 <strong>Past Event Submission:</strong> This event will be published as 'disputable' for 7 days, allowing the community to provide evidence and challenge the outcome.
                No expiration date is needed since this concerns a past event.
              </p>
            </div>
          )}

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