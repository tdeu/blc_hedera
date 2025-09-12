import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';
import { 
  AlertTriangle, 
  Upload, 
  DollarSign, 
  Calculator,
  Info,
  CheckCircle,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { BettingMarket } from './BettingMarkets';
import { MarketResolution } from '../utils/supabase';
import { toast } from 'sonner@2.0.3';

interface DisputeModalProps {
  isOpen: boolean;
  marketId: string;
  market: BettingMarket;
  resolution: MarketResolution;
  onSubmit: (disputeData: DisputeFormData) => Promise<void>;
  onClose: () => void;
  bondAmount: number;
  userTokenBalance: number;
  htsTokenId: string;
  showBondCalculator?: boolean;
  isSubmitting?: boolean;
}

export interface DisputeFormData {
  reason: string;
  evidenceUrl?: string;
  evidenceDescription?: string;
  disputeType: 'evidence' | 'interpretation' | 'api_error';
}

interface BondCalculatorProps {
  disputeType: 'evidence' | 'interpretation' | 'api_error';
  userReputationScore?: number;
  onBondCalculated: (amount: number) => void;
}

function DisputeBondCalculator({ disputeType, userReputationScore = 50, onBondCalculated }: BondCalculatorProps) {
  const baseAmounts = {
    evidence: 100,
    interpretation: 250,
    api_error: 500
  };

  const baseAmount = baseAmounts[disputeType];
  
  // Calculate reputation multiplier
  let reputationMultiplier = 1.0;
  if (userReputationScore >= 100) {
    reputationMultiplier = 0.7; // 30% discount
  } else if (userReputationScore >= 50) {
    reputationMultiplier = 0.85; // 15% discount
  } else if (userReputationScore < 10) {
    reputationMultiplier = 1.5; // 50% penalty
  }

  const finalAmount = Math.floor(baseAmount * reputationMultiplier);
  
  // Notify parent component
  useEffect(() => {
    onBondCalculated(finalAmount);
  }, [finalAmount, onBondCalculated]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Calculator className="h-4 w-4" />
          Bond Calculation
        </CardTitle>
        <CardDescription>
          Required bond amount for this dispute type
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <Label className="text-xs text-muted-foreground">Base Amount</Label>
            <div className="font-medium">{baseAmount} BCDB</div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Reputation Score</Label>
            <div className="font-medium">{userReputationScore}/100</div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Multiplier</Label>
            <div className="font-medium">
              {reputationMultiplier}x 
              {reputationMultiplier < 1 && <span className="text-green-600 ml-1">(Discount)</span>}
              {reputationMultiplier > 1 && <span className="text-red-600 ml-1">(Penalty)</span>}
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Final Amount</Label>
            <div className="font-bold text-lg">{finalAmount} BCDB</div>
          </div>
        </div>
        
        <div className="bg-muted p-3 rounded-lg">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 mt-0.5 text-blue-500" />
            <div className="text-xs text-muted-foreground">
              <div className="font-medium mb-1">Bond Policy:</div>
              <ul className="space-y-1">
                <li>• Successful disputes: Full refund</li>
                <li>• Failed disputes: 50% refund, 50% slashed</li>
                <li>• Higher reputation = lower bond required</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DisputeModal({
  isOpen,
  marketId,
  market,
  resolution,
  onSubmit,
  onClose,
  bondAmount,
  userTokenBalance,
  htsTokenId,
  showBondCalculator = true,
  isSubmitting = false
}: DisputeModalProps) {
  const [formData, setFormData] = useState<DisputeFormData>({
    reason: '',
    evidenceUrl: '',
    evidenceDescription: '',
    disputeType: 'evidence'
  });
  const [calculatedBondAmount, setCalculatedBondAmount] = useState(bondAmount);

  const disputeTypeOptions = [
    {
      value: 'evidence',
      label: 'Incorrect Evidence',
      description: 'The API data or source information is factually wrong'
    },
    {
      value: 'interpretation',
      label: 'Wrong Interpretation',
      description: 'The outcome interpretation of the data is incorrect'
    },
    {
      value: 'api_error',
      label: 'API/Technical Error',
      description: 'The API source had technical issues or returned invalid data'
    }
  ];

  const handleSubmit = async () => {
    if (!formData.reason.trim()) {
      toast.error('Please provide a reason for the dispute');
      return;
    }

    if (formData.reason.length < 20) {
      toast.error('Dispute reason must be at least 20 characters');
      return;
    }

    if (userTokenBalance < calculatedBondAmount) {
      toast.error(`Insufficient BCDB tokens. You need ${calculatedBondAmount} BCDB but only have ${userTokenBalance} BCDB`);
      return;
    }

    try {
      await onSubmit(formData);
      setFormData({
        reason: '',
        evidenceUrl: '',
        evidenceDescription: '',
        disputeType: 'evidence'
      });
      onClose();
      toast.success('Dispute submitted successfully');
    } catch (error) {
      console.error('Error submitting dispute:', error);
      toast.error('Failed to submit dispute. Please try again.');
    }
  };

  const formatOutcome = (outcome?: string) => {
    if (!outcome) return 'Unknown';
    return outcome.toUpperCase();
  };

  const getConfidenceBadge = (confidence?: string) => {
    if (!confidence) return null;

    const colors = {
      high: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-red-100 text-red-800'
    };

    return (
      <Badge className={colors[confidence as keyof typeof colors]}>
        {confidence.charAt(0).toUpperCase() + confidence.slice(1)} Confidence
      </Badge>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Dispute Market Resolution
          </DialogTitle>
          <DialogDescription>
            Challenge the current resolution for this market. A bond is required to prevent spam.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Market Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Market Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Claim</Label>
                <p className="text-sm font-medium">{market.claim}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Current Outcome</Label>
                  <div className="flex items-center gap-2">
                    <Badge className={resolution.outcome === 'yes' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {formatOutcome(resolution.outcome)}
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <Label className="text-xs text-muted-foreground">Confidence</Label>
                  <div>{getConfidenceBadge(resolution.confidence)}</div>
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Source</Label>
                <p className="text-sm capitalize">{resolution.source}</p>
              </div>
            </CardContent>
          </Card>

          {/* Dispute Form */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="disputeType">Dispute Type *</Label>
              <Select 
                value={formData.disputeType} 
                onValueChange={(value: 'evidence' | 'interpretation' | 'api_error') => 
                  setFormData({ ...formData, disputeType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select dispute type" />
                </SelectTrigger>
                <SelectContent>
                  {disputeTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs text-muted-foreground">{option.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="reason">Dispute Reason *</Label>
              <Textarea
                id="reason"
                placeholder="Explain why you believe this resolution is incorrect. Include specific details and sources if possible. (Minimum 20 characters)"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="min-h-[100px]"
              />
              <div className="text-xs text-muted-foreground mt-1">
                {formData.reason.length}/20 minimum characters
              </div>
            </div>

            <div>
              <Label htmlFor="evidenceUrl">Supporting Evidence URL (Optional)</Label>
              <Input
                id="evidenceUrl"
                placeholder="https://example.com/evidence"
                value={formData.evidenceUrl}
                onChange={(e) => setFormData({ ...formData, evidenceUrl: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="evidenceDescription">Evidence Description (Optional)</Label>
              <Textarea
                id="evidenceDescription"
                placeholder="Describe your evidence and how it supports your dispute"
                value={formData.evidenceDescription}
                onChange={(e) => setFormData({ ...formData, evidenceDescription: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <Separator />

          {/* Bond Calculator */}
          {showBondCalculator && (
            <DisputeBondCalculator
              disputeType={formData.disputeType}
              onBondCalculated={setCalculatedBondAmount}
            />
          )}

          {/* User Balance Check */}
          <Card className={userTokenBalance < calculatedBondAmount ? 'border-red-200' : 'border-green-200'}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">Your BCDB Balance</div>
                  <div className="text-xs text-muted-foreground">Required: {calculatedBondAmount} BCDB</div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-bold ${userTokenBalance >= calculatedBondAmount ? 'text-green-600' : 'text-red-600'}`}>
                    {userTokenBalance} BCDB
                  </div>
                  {userTokenBalance >= calculatedBondAmount ? (
                    <div className="flex items-center text-xs text-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Sufficient balance
                    </div>
                  ) : (
                    <div className="text-xs text-red-600">
                      Need {calculatedBondAmount - userTokenBalance} more BCDB
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* HTS Token Information */}
          {htsTokenId && (
            <div className="bg-muted p-3 rounded-lg">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Bond Token:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono">{htsTokenId}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0"
                    onClick={() => window.open(`https://hashscan.io/testnet/token/${htsTokenId}`, '_blank')}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={
              !formData.reason.trim() || 
              formData.reason.length < 20 || 
              userTokenBalance < calculatedBondAmount ||
              isSubmitting
            }
            className="bg-orange-600 hover:bg-orange-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <DollarSign className="h-4 w-4 mr-2" />
                Submit Dispute ({calculatedBondAmount} BCDB)
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}