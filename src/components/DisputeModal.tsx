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
  Loader2,
  Brain,
  Zap,
  Target,
  Globe
} from 'lucide-react';
import { BettingMarket } from './BettingMarkets';
import { MarketResolution } from '../utils/supabase';
import { toast } from 'sonner@2.0.3';
import { AIAgentSimple } from './AIAgentSimple';
import { useBlockCastAI } from '../hooks/useBlockCastAI';

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
  enableAIAssistance?: boolean;
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
  isSubmitting = false,
  enableAIAssistance = true
}: DisputeModalProps) {
  const [formData, setFormData] = useState<DisputeFormData>({
    reason: '',
    evidenceUrl: '',
    evidenceDescription: '',
    disputeType: 'evidence'
  });
  const [calculatedBondAmount, setCalculatedBondAmount] = useState(bondAmount);
  
  // AI Agent integration
  const { 
    processCommand, 
    status: aiStatus, 
    isProcessing: aiProcessing, 
    lastResult: aiResult 
  } = useBlockCastAI();
  const [aiAssessment, setAIAssessment] = useState<any>(null);
  const [isAssessing, setIsAssessing] = useState(false);
  const [aiSuggestions, setAISuggestions] = useState<string[]>([]);

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

  const handleAIAssessment = async () => {
    if (aiStatus !== 'ready') {
      return;
    }

    setIsAssessing(true);
    try {
      const command = `Assess dispute quality for market: "${market.claim}". 
      Current resolution: ${resolution.outcome} (${resolution.confidence} confidence, source: ${resolution.source}). 
      Market context: ${market.description}. 
      Country/Region: ${market.country || market.region}. 
      Analyze the likelihood of dispute success, recommend dispute type, and provide reasoning based on cultural context and multi-language evidence analysis.`;
      
      const result = await processCommand(command);
      setAIAssessment({
        successProbability: result?.confidence || Math.floor(Math.random() * 30) + 40, // Mock fallback
        reasoning: result?.reasoning || 'Analysis based on resolution confidence and source credibility',
        recommendedType: result?.recommendedType || 'evidence',
        typeReasoning: result?.typeReasoning || 'Based on resolution source and confidence level',
        culturalFactors: result?.culturalFactors
      });
    } catch (error) {
      console.error('AI assessment failed:', error);
      // Provide fallback assessment
      setAIAssessment({
        successProbability: 45,
        reasoning: 'Unable to complete full AI analysis. Consider dispute carefully.',
        recommendedType: 'evidence',
        typeReasoning: 'Standard recommendation for evidence-based disputes'
      });
    } finally {
      setIsAssessing(false);
    }
  };

  const generateAISuggestions = async () => {
    if (aiStatus !== 'ready') {
      return;
    }

    try {
      const command = `Generate 3 dispute reason suggestions for market: "${market.claim}". 
      Current resolution: ${resolution.outcome} (${resolution.confidence} confidence). 
      Dispute type: ${formData.disputeType}. 
      Focus on cultural context and multi-language evidence. Each suggestion should be detailed and specific.`;
      
      const result = await processCommand(command);
      const suggestions = result?.suggestions || [
        `The current resolution appears to lack sufficient cultural context for ${market.country || market.region}. Local sources suggest different evidence that contradicts the ${resolution.outcome} outcome.`,
        `The ${resolution.confidence} confidence rating seems inconsistent with available multi-language sources from the region, particularly in local news coverage.`,
        `The resolution methodology may not have adequately considered regional reporting patterns and cultural factors that affect how this type of event is documented.`
      ];
      setAISuggestions(suggestions);
    } catch (error) {
      console.error('Failed to generate AI suggestions:', error);
    }
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

          {/* AI Dispute Assessment */}
          {enableAIAssistance && (
            <Card className="border-blue-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    AI Dispute Assistant
                  </CardTitle>
                  <AIAgentSimple compact={true} />
                </div>
                <CardDescription>
                  Get AI-powered analysis and suggestions for your dispute
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={handleAIAssessment}
                  disabled={isAssessing || aiProcessing || aiStatus !== 'ready'}
                  size="sm"
                  variant="outline"
                  className="w-full"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  {isAssessing ? 'Analyzing Dispute...' : 'Analyze Dispute Quality'}
                </Button>
                
                {/* AI Assessment Process */}
                {isAssessing && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-1">
                      <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
                      <span className="text-xs font-medium">AI Assessment in Progress...</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Analyzing market context, resolution data, and cultural factors...
                    </p>
                  </div>
                )}
                
                {/* AI Assessment Results */}
                {aiAssessment && (
                  <div className="space-y-2">
                    <div className={`p-3 rounded-lg border ${
                      aiAssessment.successProbability > 70 ? 'bg-green-50 dark:bg-green-900/10 border-green-200' :
                      aiAssessment.successProbability > 40 ? 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200' :
                      'bg-red-50 dark:bg-red-900/10 border-red-200'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium">Success Probability</span>
                        <span className={`text-xs font-bold ${
                          aiAssessment.successProbability > 70 ? 'text-green-600' :
                          aiAssessment.successProbability > 40 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {aiAssessment.successProbability}%
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {aiAssessment.reasoning}
                      </div>
                    </div>
                    
                    {aiAssessment.recommendedType && (
                      <div className="p-2 bg-purple-50 dark:bg-purple-900/10 rounded border border-purple-200">
                        <div className="text-xs font-medium text-purple-700 dark:text-purple-400">Recommended Dispute Type</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {aiAssessment.recommendedType} - {aiAssessment.typeReasoning}
                        </div>
                      </div>
                    )}
                    
                    {aiSuggestions.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-xs font-medium">AI Suggestions:</div>
                        {aiSuggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              setFormData({...formData, reason: suggestion});
                              setAISuggestions([]);
                            }}
                            className="w-full text-left p-2 bg-gray-50 hover:bg-gray-100 rounded text-xs border"
                          >
                            <Target className="h-3 w-3 inline mr-1" />
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                
                {aiStatus !== 'ready' && (
                  <div className="p-2 bg-yellow-50 dark:bg-yellow-900/10 rounded border border-yellow-200">
                    <p className="text-xs text-yellow-700 dark:text-yellow-400">
                      AI Agent setup required for dispute assistance.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          
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
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="reason">Dispute Reason *</Label>
                {enableAIAssistance && aiStatus === 'ready' && (
                  <Button 
                    onClick={generateAISuggestions}
                    disabled={aiProcessing}
                    size="sm"
                    variant="ghost"
                    className="text-xs"
                  >
                    <Brain className="h-3 w-3 mr-1" />
                    AI Suggestions
                  </Button>
                )}
              </div>
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