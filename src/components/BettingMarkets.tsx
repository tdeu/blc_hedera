import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { TrendingUp, TrendingDown, Users, Clock, Target, Star, MessageCircle, Filter, ChevronDown, Share2, Heart, Bookmark, Zap, Globe, Shield, Search } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner@2.0.3';
import { useLanguage } from './LanguageContext';
import ShareModal from './ShareModal';

export interface BettingMarket {
  id: string;
  claim: string;
  claimTranslations?: {
    en: string;
    fr: string;
    sw: string;
  };
  category: string;
  subcategory?: string;
  source: string;
  description: string;
  descriptionTranslations?: {
    en: string;
    fr: string;
    sw: string;
  };
  totalPool: number;
  yesPool: number;
  noPool: number;
  yesOdds: number;
  noOdds: number;
  totalCasters: number;
  expiresAt: Date;
  status: 'active' | 'resolving' | 'resolved';
  resolution?: 'yes' | 'no';
  trending: boolean;
  imageUrl?: string;
  country?: string;
  region?: string;
  marketType: 'present' | 'future';
  confidenceLevel: 'high' | 'medium' | 'low';
}

interface BettingMarketsProps {
  onPlaceBet: (marketId: string, position: 'yes' | 'no', amount: number) => void;
  userBalance: number;
  onMarketSelect?: (market: BettingMarket) => void;
  markets?: BettingMarket[];
}

// Comprehensive 25+ markets with clear category classification
export const realTimeMarkets: BettingMarket[] = [
  // ENTERTAINMENT CATEGORY (4 markets)
  {
    id: 'ent-nollywood-2025',
    claim: 'Will Nollywood produce over 2,500 films in 2025?',
    claimTranslations: {
      en: 'Will Nollywood produce over 2,500 films in 2025?',
      fr: 'Nollywood produira-t-il plus de 2 500 films en 2025?',
      sw: 'Je, Nollywood itazalisha filamu zaidi ya 2,500 mnamo 2025?'
    },
    category: 'Entertainment',
    subcategory: 'Film Industry',
    source: 'Nigerian Film Corporation',
    description: 'Truth verification on Nollywood\'s ambitious production targets amid growing digital streaming demand and international recognition.',
    totalPool: 1850000,
    yesPool: 1110000,
    noPool: 740000,
    yesOdds: 1.67,
    noOdds: 2.50,
    totalCasters: 14230,
    expiresAt: new Date('2025-12-31'),
    status: 'active',
    trending: true,
    country: 'Nigeria',
    region: 'West Africa',
    marketType: 'future',
    confidenceLevel: 'high',
    imageUrl: 'https://images.unsplash.com/photo-1547573874-513e5ddbc0ab?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxub2xseXdvb2QlMjBmaWxtJTIwcHJvZHVjdGlvbiUyMG5pZ2VyaWF8ZW58MXx8fHwxNzU1Nzg3NjUzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
  },
  {
    id: 'ent-grammy-african-2025',
    claim: 'Will an African artist win a Grammy in the Global Music category in 2025?',
    category: 'Entertainment',
    subcategory: 'Music Awards',
    source: 'Recording Academy',
    description: 'Community truth verification on African music\'s global recognition at the Grammy Awards 2025.',
    totalPool: 2340000,
    yesPool: 1638000,
    noPool: 702000,
    yesOdds: 1.43,
    noOdds: 3.33,
    totalCasters: 18940,
    expiresAt: new Date('2025-02-02'),
    status: 'active',
    trending: true,
    region: 'Continental Africa',
    marketType: 'future',
    confidenceLevel: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1714738045959-3bd0634bdce2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwbXVzaWMlMjBhcnRpc3QlMjBwZXJmb3JtYW5jZXxlbnwxfHx8fDE3NTU3ODc2NTZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
  },
  {
    id: 'ent-afcon-viewership-2025',
    claim: 'Will AFCON 2025 achieve over 1 billion global viewers?',
    category: 'Entertainment',
    subcategory: 'Sports Broadcasting',
    source: 'CAF Broadcasting',
    description: 'Verification of projected viewership numbers for the Africa Cup of Nations 2025 tournament.',
    totalPool: 1420000,
    yesPool: 852000,
    noPool: 568000,
    yesOdds: 1.67,
    noOdds: 2.50,
    totalCasters: 11560,
    expiresAt: new Date('2025-07-31'),
    status: 'active',
    trending: false,
    region: 'Continental Africa',
    marketType: 'future',
    confidenceLevel: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1506185386801-3d7bc0ddd2bf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2ElMjBjdXAlMjBuYXRpb25zJTIwZm9vdGJhbGx8ZW58MXx8fHwxNzU1Nzg3NjYwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
  },
  {
    id: 'ent-amapiano-global-2025',
    claim: 'Will Amapiano music reach #1 on Billboard Global 200 in 2025?',
    category: 'Entertainment',
    subcategory: 'Music Charts',
    source: 'Billboard',
    description: 'Tracking the global rise of South African Amapiano genre and its potential chart dominance.',
    totalPool: 980000,
    yesPool: 294000,
    noPool: 686000,
    yesOdds: 3.33,
    noOdds: 1.43,
    totalCasters: 8920,
    expiresAt: new Date('2025-12-31'),
    status: 'active',
    trending: false,
    country: 'South Africa',
    region: 'Southern Africa',
    marketType: 'future',
    confidenceLevel: 'low',
    imageUrl: 'https://images.unsplash.com/photo-1721470551297-2016fde7673b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhbWFwaWFubyUyMHNvdXRoJTIwYWZyaWNhbiUyMG11c2ljfGVufDF8fHx8MTc1NTc4NzY2NHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
  },

  // CELEBRITY GOSSIP CATEGORY (3 markets)
  {
    id: 'celeb-wizkid-collab-2025',
    claim: 'Will Wizkid announce a collaboration with a major Hollywood artist in 2025?',
    category: 'Celebrity Gossip',
    subcategory: 'Music Collaborations',
    source: 'Entertainment Weekly Africa',
    description: 'Truth market on African music star Wizkid\'s potential international collaborations.',
    totalPool: 1670000,
    yesPool: 1002000,
    noPool: 668000,
    yesOdds: 1.67,
    noOdds: 2.50,
    totalCasters: 12580,
    expiresAt: new Date('2025-12-31'),
    status: 'active',
    trending: false,
    country: 'Nigeria',
    region: 'West Africa',
    marketType: 'future',
    confidenceLevel: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1682358061383-ee32b66f9c8e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuaWdlcmlhbiUyMG11c2ljJTIwYXJ0aXN0JTIwcmVjb3JkaW5nfGVufDF8fHx8MTc1NTc4NzY2N3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
  },
  {
    id: 'celeb-lupita-marvel-2025',
    claim: 'Will Lupita Nyong\'o star in a major Marvel or DC project announcement in 2025?',
    category: 'Celebrity Gossip',
    subcategory: 'Film Casting',
    source: 'Variety Entertainment',
    description: 'Community verification on Kenyan-Mexican actress Lupita Nyong\'o\'s potential superhero roles.',
    totalPool: 1920000,
    yesPool: 960000,
    noPool: 960000,
    yesOdds: 2.00,
    noOdds: 2.00,
    totalCasters: 15670,
    expiresAt: new Date('2025-12-31'),
    status: 'active',
    trending: true,
    country: 'Kenya',
    region: 'East Africa',
    marketType: 'future',
    confidenceLevel: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1635418914759-90f2bd6d2e79?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwYWN0cmVzcyUyMGhvbGx5d29vZCUyMGZpbG18ZW58MXx8fHwxNzU1Nzg3NjcwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
  },
  {
    id: 'celeb-black-panther-3-2025',
    claim: 'Will Black Panther 3 be officially announced with an African director in 2025?',
    category: 'Celebrity Gossip',
    subcategory: 'Film Announcements',
    source: 'Marvel Studios',
    description: 'Speculation on the continuation of the Black Panther franchise with African representation.',
    totalPool: 2100000,
    yesPool: 1470000,
    noPool: 630000,
    yesOdds: 1.43,
    noOdds: 3.33,
    totalCasters: 17890,
    expiresAt: new Date('2025-12-31'),
    status: 'active',
    trending: true,
    region: 'Continental Africa',
    marketType: 'future',
    confidenceLevel: 'low',
    imageUrl: 'https://images.unsplash.com/photo-1631387019069-2ff599943f9a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdXBlcmhlcm8lMjBtb3ZpZSUyMGZpbG1pbmclMjBwcm9kdWN0aW9ufGVufDF8fHx8MTc1NTc4NzY3NHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
  },

  // FINANCE CATEGORY (4 markets)
  {
    id: 'fin-nigeria-crypto-adoption-2025',
    claim: 'Will cryptocurrency adoption in Nigeria exceed 40% of adults by end of 2025?',
    category: 'Finance',
    subcategory: 'Cryptocurrency',
    source: 'Central Bank of Nigeria',
    description: 'Truth verification on Nigeria\'s digital currency adoption amid regulatory changes.',
    totalPool: 3450000,
    yesPool: 2415000,
    noPool: 1035000,
    yesOdds: 1.43,
    noOdds: 3.33,
    totalCasters: 22870,
    expiresAt: new Date('2025-12-31'),
    status: 'active',
    trending: true,
    country: 'Nigeria',
    region: 'West Africa',
    marketType: 'future',
    confidenceLevel: 'high',
    imageUrl: 'https://images.unsplash.com/photo-1629193382974-f478714dba26?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiaXRjb2luJTIwY3J5cHRvY3VycmVuY3klMjBuaWdlcmlhfGVufDF8fHx8MTc1NTc4NzY4Mnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
  },
  {
    id: 'fin-jse-record-high-2025',
    claim: 'Will the Johannesburg Stock Exchange reach a new all-time high in 2025?',
    category: 'Finance',
    subcategory: 'Stock Markets',
    source: 'Johannesburg Stock Exchange',
    description: 'Market truth verification on JSE performance amid South African economic recovery.',
    totalPool: 2890000,
    yesPool: 1445000,
    noPool: 1445000,
    yesOdds: 2.00,
    noOdds: 2.00,
    totalCasters: 17340,
    expiresAt: new Date('2025-12-31'),
    status: 'active',
    trending: false,
    country: 'South Africa',
    region: 'Southern Africa',
    marketType: 'future',
    confidenceLevel: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1682796085204-a1edd2cd9ed9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxqb2hhbm5lc2J1cmclMjBzdG9jayUyMGV4Y2hhbmdlJTIwdHJhZGluZ3xlbnwxfHx8fDE3NTU3ODc2ODZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
  },
  {
    id: 'fin-afdb-funding-2025',
    claim: 'Will the African Development Bank approve over $50 billion in project funding in 2025?',
    category: 'Finance',
    subcategory: 'Development Finance',
    source: 'African Development Bank',
    description: 'Tracking continental development funding commitments for infrastructure and economic growth.',
    totalPool: 1890000,
    yesPool: 1323000,
    noPool: 567000,
    yesOdds: 1.43,
    noOdds: 3.33,
    totalCasters: 14670,
    expiresAt: new Date('2025-12-31'),
    status: 'active',
    trending: false,
    region: 'Continental Africa',
    marketType: 'future',
    confidenceLevel: 'high',
    imageUrl: 'https://images.unsplash.com/photo-1678693362793-e2fffac536d0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwZGV2ZWxvcG1lbnQlMjBiYW5rJTIwZnVuZGluZ3xlbnwxfHx8fDE3NTU3ODc2OTF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
  },
  {
    id: 'fin-morocco-gdp-growth-2025',
    claim: 'Will Morocco\'s GDP growth exceed 5% in 2025?',
    category: 'Finance',
    subcategory: 'Economic Growth',
    source: 'Bank Al-Maghrib',
    description: 'Economic truth verification on Morocco\'s growth targets amid global market conditions.',
    totalPool: 1450000,
    yesPool: 870000,
    noPool: 580000,
    yesOdds: 1.67,
    noOdds: 2.50,
    totalCasters: 11230,
    expiresAt: new Date('2025-12-31'),
    status: 'active',
    trending: false,
    country: 'Morocco',
    region: 'North Africa',
    marketType: 'future',
    confidenceLevel: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1617259945518-9ca4253a1e34?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb3JvY2NvJTIwZWNvbm9taWMlMjBncm93dGglMjBidXNpbmVzc3xlbnwxfHx8fDE3NTU3ODc2OTV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
  },

  // POLITICS CATEGORY (4 markets)
  {
    id: 'pol-ghana-early-elections-2025',
    claim: 'Will Ghana hold early elections before the scheduled 2028 date?',
    category: 'Politics',
    subcategory: 'Elections',
    source: 'Electoral Commission of Ghana',
    description: 'Political truth verification on Ghana\'s electoral timeline amid governance challenges.',
    totalPool: 2100000,
    yesPool: 630000,
    noPool: 1470000,
    yesOdds: 3.33,
    noOdds: 1.43,
    totalCasters: 16890,
    expiresAt: new Date('2025-12-31'),
    status: 'active',
    trending: false,
    country: 'Ghana',
    region: 'West Africa',
    marketType: 'future',
    confidenceLevel: 'low',
    imageUrl: 'https://images.unsplash.com/photo-1551190128-5de006042750?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnaGFuYSUyMGVsZWN0aW9ucyUyMHZvdGluZyUyMGRlbW9jcmFjeXxlbnwxfHx8fDE3NTU3ODc3MDB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
  },
  {
    id: 'pol-au-currency-initiative-2025',
    claim: 'Will the African Union announce a new continental currency initiative in 2025?',
    category: 'Politics',
    subcategory: 'Continental Integration',
    source: 'African Union Commission',
    description: 'Continental truth verification on AU monetary integration plans and implementation timeline.',
    totalPool: 4200000,
    yesPool: 1260000,
    noPool: 2940000,
    yesOdds: 3.33,
    noOdds: 1.43,
    totalCasters: 28450,
    expiresAt: new Date('2025-12-31'),
    status: 'active',
    trending: true,
    region: 'Continental Africa',
    marketType: 'future',
    confidenceLevel: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1742996111692-2d924f12a058?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwdW5pb24lMjBtZWV0aW5nJTIwY29uZmVyZW5jZXxlbnwxfHx8fDE3NTU3ODc3MDd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
  },
  {
    id: 'pol-south-africa-energy-crisis-2025',
    claim: 'Will South Africa end load-shedding permanently by end of 2025?',
    category: 'Politics',
    subcategory: 'Energy Policy',
    source: 'Eskom Holdings',
    description: 'Verification of South Africa\'s commitment to solving its electricity crisis through renewable energy.',
    totalPool: 3100000,
    yesPool: 930000,
    noPool: 2170000,
    yesOdds: 3.33,
    noOdds: 1.43,
    totalCasters: 21450,
    expiresAt: new Date('2025-12-31'),
    status: 'active',
    trending: true,
    country: 'South Africa',
    region: 'Southern Africa',
    marketType: 'future',
    confidenceLevel: 'low',
    imageUrl: 'https://images.unsplash.com/photo-1719256383688-305c0c00d179?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzb3V0aCUyMGFmcmljYSUyMGVuZXJneSUyMHNvbGFyJTIwcG93ZXJ8ZW58MXx8fHwxNzU1Nzg3NzEyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
  },
  {
    id: 'pol-kenya-constitutional-reform-2025',
    claim: 'Will Kenya pass major constitutional reforms regarding devolution in 2025?',
    category: 'Politics',
    subcategory: 'Constitutional Law',
    source: 'Parliament of Kenya',
    description: 'Truth verification on proposed constitutional changes affecting county governments.',
    totalPool: 1650000,
    yesPool: 990000,
    noPool: 660000,
    yesOdds: 1.67,
    noOdds: 2.50,
    totalCasters: 13450,
    expiresAt: new Date('2025-12-31'),
    status: 'active',
    trending: false,
    country: 'Kenya',
    region: 'East Africa',
    marketType: 'future',
    confidenceLevel: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1735886161697-b868f22f7dcd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxrZW55YSUyMHBhcmxpYW1lbnQlMjBjb25zdGl0dXRpb25hbCUyMHJlZm9ybXxlbnwxfHx8fDE3NTU3ODc3MTd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
  },

  // SPORTS CATEGORY (4 markets)
  {
    id: 'sport-afcon-morocco-host-2025',
    claim: 'Will Morocco host the Africa Cup of Nations finals in 2025?',
    category: 'Sports',
    subcategory: 'Football Tournaments',
    source: 'Confederation of African Football',
    description: 'Sports truth verification on AFCON 2025 hosting arrangements and Morocco\'s readiness.',
    totalPool: 2750000,
    yesPool: 1925000,
    noPool: 825000,
    yesOdds: 1.43,
    noOdds: 3.33,
    totalCasters: 19870,
    expiresAt: new Date('2025-06-30'),
    status: 'active',
    trending: true,
    country: 'Morocco',
    region: 'North Africa',
    marketType: 'future',
    confidenceLevel: 'high',
    imageUrl: 'https://images.unsplash.com/photo-1560805004-334414e8f2c0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb3JvY2NvJTIwZm9vdGJhbGwlMjBzdGFkaXVtJTIwc3BvcnRzfGVufDF8fHx8MTc1NTc4NzcyMXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
  },
  {
    id: 'sport-sadio-mane-goals-2025',
    claim: 'Will Sadio Mané score over 25 goals across all competitions in 2025?',
    category: 'Sports',
    subcategory: 'Player Performance',
    source: 'CAF Sports Analytics',
    description: 'Player performance truth verification on Senegalese football star Sadio Mané\'s scoring prospects.',
    totalPool: 1890000,
    yesPool: 1323000,
    noPool: 567000,
    yesOdds: 1.43,
    noOdds: 3.33,
    totalCasters: 14670,
    expiresAt: new Date('2025-12-31'),
    status: 'active',
    trending: false,
    country: 'Senegal',
    region: 'West Africa',
    marketType: 'future',
    confidenceLevel: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1506185386801-3d7bc0ddd2bf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwZm9vdGJhbGwlMjBwbGF5ZXIlMjBjZWxlYnJhdGlvbnxlbnwxfHx8fDE3NTU3ODc3Mjl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
  },
  {
    id: 'sport-nigeria-world-cup-qualifier-2025',
    claim: 'Will Nigeria qualify for the 2026 FIFA World Cup without losing a match?',
    category: 'Sports',
    subcategory: 'World Cup Qualifiers',
    source: 'FIFA',
    description: 'Truth verification on Nigeria\'s perfect qualification campaign for the 2026 World Cup.',
    totalPool: 2200000,
    yesPool: 660000,
    noPool: 1540000,
    yesOdds: 3.33,
    noOdds: 1.43,
    totalCasters: 16780,
    expiresAt: new Date('2025-11-30'),
    status: 'active',
    trending: false,
    country: 'Nigeria',
    region: 'West Africa',
    marketType: 'future',
    confidenceLevel: 'low',
    imageUrl: 'https://images.unsplash.com/photo-1604212563354-546134b8004f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuaWdlcmlhJTIwZm9vdGJhbGwlMjB0ZWFtJTIwd29ybGQlMjBjdXB8ZW58MXx8fHwxNzU1Nzg3NzM0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
  },
  {
    id: 'sport-south-africa-rugby-championship-2025',
    claim: 'Will South Africa win the Rugby Championship in 2025?',
    category: 'Sports',
    subcategory: 'Rugby',
    source: 'SANZAAR',
    description: 'Truth verification on South Africa\'s Springboks winning the Rugby Championship title.',
    totalPool: 1560000,
    yesPool: 1092000,
    noPool: 468000,
    yesOdds: 1.43,
    noOdds: 3.33,
    totalCasters: 12340,
    expiresAt: new Date('2025-09-30'),
    status: 'active',
    trending: false,
    country: 'South Africa',
    region: 'Southern Africa',
    marketType: 'future',
    confidenceLevel: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1613332237072-172e05bf1b3e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzb3V0aCUyMGFmcmljYSUyMHJ1Z2J5JTIwY2hhbXBpb25zaGlwfGVufDF8fHx8MTc1NTc4NzczOHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
  },

  // TECHNOLOGY CATEGORY (3 markets)
  {
    id: 'tech-starlink-africa-expansion-2025',
    claim: 'Will Starlink be available in over 30 African countries by end of 2025?',
    category: 'Technology',
    subcategory: 'Satellite Internet',
    source: 'SpaceX Communications',
    description: 'Tech truth verification on satellite internet expansion across Africa and regulatory approvals.',
    totalPool: 3200000,
    yesPool: 2240000,
    noPool: 960000,
    yesOdds: 1.43,
    noOdds: 3.33,
    totalCasters: 21450,
    expiresAt: new Date('2025-12-31'),
    status: 'active',
    trending: true,
    region: 'Continental Africa',
    marketType: 'future',
    confidenceLevel: 'high',
    imageUrl: 'https://images.unsplash.com/photo-1679068008949-12852e5fca5a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzYXRlbGxpdGUlMjBpbnRlcm5ldCUyMHRlY2hub2xvZ3klMjBhZnJpY2F8ZW58MXx8fHwxNzU1Nzg3NzQ0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
  },
  {
    id: 'tech-mpesa-expansion-2025',
    claim: 'Will M-Pesa expand to 5 new African countries in 2025?',
    category: 'Technology',
    subcategory: 'Mobile Payments',
    source: 'Safaricom PLC',
    description: 'Mobile payment truth verification on M-Pesa\'s continental expansion strategy.',
    totalPool: 2450000,
    yesPool: 1715000,
    noPool: 735000,
    yesOdds: 1.43,
    noOdds: 3.33,
    totalCasters: 18920,
    expiresAt: new Date('2025-12-31'),
    status: 'active',
    trending: false,
    country: 'Kenya',
    region: 'East Africa',
    marketType: 'future',
    confidenceLevel: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1576814547952-f8531781d7ef?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHw1ZyUyMG5ldHdvcmslMjB0b3dlciUyMG5pZ2VyaWF8ZW58MXx8fHwxNzU1Nzg3NzUyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
  },
  {
    id: 'tech-nigeria-5g-coverage-2025',
    claim: 'Will Nigeria achieve 50% 5G network coverage by end of 2025?',
    category: 'Technology',
    subcategory: '5G Networks',
    source: 'Nigerian Communications Commission',
    description: 'Verification of Nigeria\'s ambitious 5G rollout targets and infrastructure development.',
    totalPool: 1780000,
    yesPool: 534000,
    noPool: 1246000,
    yesOdds: 3.33,
    noOdds: 1.43,
    totalCasters: 14560,
    expiresAt: new Date('2025-12-31'),
    status: 'active',
    trending: false,
    country: 'Nigeria',
    region: 'West Africa',
    marketType: 'future',
    confidenceLevel: 'low',
    imageUrl: 'https://images.unsplash.com/photo-1738197266189-6f0994d55960?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHw1ZyUyMG5ldHdvcmslMjB0b3dlciUyMG5pZ2VyaWF8ZW58MXx8fHwxNzU1Nzg3NzUyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
  },

  // CLIMATE CATEGORY (2 markets)
  {
    id: 'climate-great-green-wall-2025',
    claim: 'Will the Great Green Wall project plant 10 million trees in 2025?',
    category: 'Climate',
    subcategory: 'Reforestation',
    source: 'African Union Great Green Wall',
    description: 'Environmental truth verification on Africa\'s massive reforestation project progress.',
    totalPool: 2890000,
    yesPool: 2023000,
    noPool: 867000,
    yesOdds: 1.43,
    noOdds: 3.33,
    totalCasters: 20340,
    expiresAt: new Date('2025-12-31'),
    status: 'active',
    trending: true,
    region: 'Sahel Region',
    marketType: 'future',
    confidenceLevel: 'high',
    imageUrl: 'https://images.unsplash.com/photo-1584133554595-b8748fd1ce47?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cmVlJTIwcGxhbnRpbmclMjByZWZvcmVzdGF0aW9uJTIwYWZyaWNhfGVufDF8fHx8MTc1NTc4Nzc1Nnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
  },
  {
    id: 'climate-cop30-africa-commitments-2025',
    claim: 'Will African nations commit to 50% renewable energy by 2030 at COP30?',
    category: 'Climate',
    subcategory: 'Climate Policy',
    source: 'UN Climate Change',
    description: 'Truth verification on African countries\' renewable energy commitments at COP30.',
    totalPool: 2100000,
    yesPool: 1470000,
    noPool: 630000,
    yesOdds: 1.43,
    noOdds: 3.33,
    totalCasters: 17890,
    expiresAt: new Date('2025-11-30'),
    status: 'active',
    trending: false,
    region: 'Continental Africa',
    marketType: 'future',
    confidenceLevel: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1719256383688-305c0c00d179?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZW5ld2FibGUlMjBlbmVyZ3klMjBzb2xhciUyMHBhbmVscyUyMGFmcmljYXxlbnwxfHx8fDE3NTU3ODc3NjF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
  },

  // HEALTH CATEGORY (3 markets)
  {
    id: 'health-malaria-reduction-2025',
    claim: 'Will malaria cases in sub-Saharan Africa decrease by 15% in 2025?',
    category: 'Health',
    subcategory: 'Disease Control',
    source: 'World Health Organization Africa',
    description: 'Public health truth verification on malaria reduction efforts and new prevention technologies.',
    totalPool: 1950000,
    yesPool: 1365000,
    noPool: 585000,
    yesOdds: 1.43,
    noOdds: 3.33,
    totalCasters: 16780,
    expiresAt: new Date('2025-12-31'),
    status: 'active',
    trending: false,
    region: 'Sub-Saharan Africa',
    marketType: 'future',
    confidenceLevel: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1634710664586-fe890319a9fb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwaGVhbHRoY2FyZSUyMG1hbGFyaWElMjBwcmV2ZW50aW9ufGVufDF8fHx8MTc1NTc4Nzc2NXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
  },
  {
    id: 'health-covid-vaccination-africa-2025',
    claim: 'Will African countries achieve 80% COVID-19 vaccination rate by end of 2025?',
    category: 'Health',
    subcategory: 'Vaccination Programs',
    source: 'Africa CDC',
    description: 'Truth verification on continental vaccination targets and healthcare infrastructure capacity.',
    totalPool: 2340000,
    yesPool: 702000,
    noPool: 1638000,
    yesOdds: 3.33,
    noOdds: 1.43,
    totalCasters: 18940,
    expiresAt: new Date('2025-12-31'),
    status: 'active',
    trending: false,
    region: 'Continental Africa',
    marketType: 'future',
    confidenceLevel: 'low',
    imageUrl: 'https://images.unsplash.com/photo-1646457414481-60c356d88021?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3ZpZCUyMHZhY2NpbmF0aW9uJTIwYWZyaWNhJTIwaGVhbHRoY2FyZXxlbnwxfHx8fDE3NTU3ODc3Njl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
  },
  {
    id: 'health-maternal-mortality-reduction-2025',
    claim: 'Will maternal mortality rates in West Africa decrease by 20% in 2025?',
    category: 'Health',
    subcategory: 'Maternal Health',
    source: 'World Health Organization Africa',
    description: 'Truth verification on maternal health improvements through better healthcare access and education.',
    totalPool: 1450000,
    yesPool: 1015000,
    noPool: 435000,
    yesOdds: 1.43,
    noOdds: 3.33,
    totalCasters: 12890,
    expiresAt: new Date('2025-12-31'),
    status: 'active',
    trending: false,
    region: 'West Africa',
    marketType: 'future',
    confidenceLevel: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1584433615985-a5b7e04b0e96?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYXRlcm5hbCUyMGhlYWx0aCUyMGFmcmljYSUyMGNhcmV8ZW58MXx8fHwxNzU1Nzg3Nzc4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
  }
];

export default function BettingMarkets({ onPlaceBet, userBalance, onMarketSelect, markets = realTimeMarkets }: BettingMarketsProps) {
  const [showBetDialog, setShowBetDialog] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState<BettingMarket | null>(null);
  const [betPosition, setBetPosition] = useState<'yes' | 'no'>('yes');
  const [betAmount, setBetAmount] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [selectedConfidence, setSelectedConfidence] = useState('all');
  const { language } = useLanguage();

  // Filter markets
  const filteredMarkets = markets.filter(market => {
    const matchesSearch = market.claim.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         market.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         market.source.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || market.category === selectedCategory;
    const matchesCountry = selectedCountry === 'all' || market.country === selectedCountry || market.region === selectedCountry;
    const matchesConfidence = selectedConfidence === 'all' || market.confidenceLevel === selectedConfidence;
    
    return matchesSearch && matchesCategory && matchesCountry && matchesConfidence;
  });

  // Sort markets (trending first, then by total pool)
  const sortedMarkets = [...filteredMarkets].sort((a, b) => {
    if (a.trending && !b.trending) return -1;
    if (!a.trending && b.trending) return 1;
    return b.totalPool - a.totalPool;
  });

  // Get unique categories and countries for filters
  const categories = ['all', ...Array.from(new Set(markets.map(m => m.category)))];
  const countries = ['all', ...Array.from(new Set(markets.map(m => m.country || m.region).filter(Boolean)))];

  const handleOpenBetDialog = (market: BettingMarket, position: 'yes' | 'no') => {
    setSelectedMarket(market);
    setBetPosition(position);
    setBetAmount('');
    setShowBetDialog(true);
  };

  const handlePlaceBet = async () => {
    if (!selectedMarket || !betAmount) return;
    
    const amount = parseFloat(betAmount);
    if (amount <= 0 || amount > userBalance) {
      toast.error('Invalid amount or insufficient balance');
      return;
    }

    try {
      await onPlaceBet(selectedMarket.id, betPosition, amount);
      setShowBetDialog(false);
      toast.success(`Truth position cast successfully on: ${selectedMarket.claim.substring(0, 50)}...`);
    } catch (error) {
      toast.error('Failed to cast position. Please try again.');
    }
  };

  const handleShareMarket = (market: BettingMarket) => {
    setSelectedMarket(market);
    setShowShareModal(true);
  };

  const formatTimeRemaining = (expiresAt: Date): string => {
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

  const formatCurrency = (amount: number): string => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}K`;
    }
    return amount.toString();
  };

  const getClaimText = (market: BettingMarket): string => {
    if (language !== 'en' && market.claimTranslations) {
      return market.claimTranslations[language] || market.claim;
    }
    return market.claim;
  };

  return (
    <div className="space-y-6">
      {/* Hero Section - Enhanced Mobile Layout */}
      <div className="bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 rounded-xl p-4 md:p-6 lg:p-8 border border-primary/30">
        <div className="text-center mb-4 md:mb-6">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-2">
            Truth Markets
          </h1>
          <p className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto">
            Verify truth and cast positions on trending African news. Join the community fighting misinformation.
          </p>
        </div>

        {/* Search and Filters - Horizontal Layout Matching Image */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Search Bar - Left Side */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search markets, categories, or sources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 md:h-12 bg-background/50 border-primary/30 focus:border-primary text-sm md:text-base"
              />
            </div>
          </div>

          {/* Filter Dropdowns - Center */}
          <div className="flex items-center gap-4">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-40 h-11 bg-background/50 border-primary/30 text-sm">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value="trending" onValueChange={() => {}}>
              <SelectTrigger className="w-32 h-11 bg-background/50 border-primary/30 text-sm">
                <SelectValue placeholder="Trending" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="trending">Trending</SelectItem>
                <SelectItem value="recent">Recent</SelectItem>
                <SelectItem value="popular">Popular</SelectItem>
              </SelectContent>
            </Select>

            <Select value="all" onValueChange={() => {}}>
              <SelectTrigger className="w-32 h-11 bg-background/50 border-primary/30 text-sm">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="present">Present</SelectItem>
                <SelectItem value="future">Future</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Active Markets Counter - Right Side */}
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-muted-foreground">
              31 Active Markets
            </span>
          </div>
        </div>
      </div>

      {/* Markets Grid - Responsive */}
      {sortedMarkets.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No markets found</h3>
          <p className="text-muted-foreground">Try adjusting your search criteria or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {sortedMarkets.map((market) => (
            <Card 
              key={market.id} 
              className={`relative overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group border-border hover:border-primary/50 ${
                market.trending ? 'trending-corner' : ''
              }`}
              onClick={() => onMarketSelect && onMarketSelect(market)}
            >
              {market.trending && (
                <div className="absolute top-0 left-0 z-10">
                  <div className="bg-gradient-to-r from-primary to-secondary text-primary-foreground px-2 py-1 text-xs font-bold transform -rotate-45 translate-x-[-8px] translate-y-[10px] shadow-lg">
                    TRENDING
                  </div>
                </div>
              )}

              {market.imageUrl && (
                <div className="aspect-video relative overflow-hidden">
                  <img 
                    src={market.imageUrl} 
                    alt={market.claim}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  
                  {/* Confidence Badge */}
                  <Badge 
                    className={`absolute top-2 right-2 text-xs px-2 py-1 ${
                      market.confidenceLevel === 'high' ? 'bg-green-500/90 text-white' :
                      market.confidenceLevel === 'medium' ? 'bg-yellow-500/90 text-white' :
                      'bg-red-500/90 text-white'
                    }`}
                  >
                    {market.confidenceLevel.toUpperCase()}
                  </Badge>

                  {/* Country/Region Badge */}
                  {(market.country || market.region) && (
                    <Badge variant="secondary" className="absolute top-2 left-2 text-xs bg-background/90 text-foreground">
                      {market.country || market.region}
                    </Badge>
                  )}
                </div>
              )}

              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <Badge variant="outline" className="text-xs shrink-0">
                    {market.category}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShareMarket(market);
                    }}
                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <CardTitle className="text-sm md:text-base leading-tight line-clamp-3 group-hover:text-primary transition-colors">
                  {getClaimText(market)}
                </CardTitle>
                
                <CardDescription className="text-xs text-muted-foreground line-clamp-2">
                  Source: {market.source}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Pool Information */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Total Pool</span>
                    <span className="font-semibold">{formatCurrency(market.totalPool)} ETH</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span className="text-muted-foreground">{formatCurrency(market.totalCasters)} verifiers</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span className="text-muted-foreground">{formatTimeRemaining(market.expiresAt)}</span>
                    </div>
                  </div>

                  {/* Pool Distribution */}
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-500"
                      style={{ width: `${(market.yesPool / market.totalPool) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>True: {((market.yesPool / market.totalPool) * 100).toFixed(1)}%</span>
                    <span>False: {((market.noPool / market.totalPool) * 100).toFixed(1)}%</span>
                  </div>
                </div>

                {/* Betting Buttons - Mobile Optimized */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenBetDialog(market, 'yes');
                    }}
                    className="flex-1 bg-green-500/10 border-green-500/30 hover:bg-green-500/20 text-green-400 hover:text-green-300 h-9 text-xs md:text-sm"
                  >
                    <TrendingUp className="h-3 w-3 mr-1" />
                    True {market.yesOdds.toFixed(2)}x
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenBetDialog(market, 'no');
                    }}
                    className="flex-1 bg-red-500/10 border-red-500/30 hover:bg-red-500/20 text-red-400 hover:text-red-300 h-9 text-xs md:text-sm"
                  >
                    <TrendingDown className="h-3 w-3 mr-1" />
                    False {market.noOdds.toFixed(2)}x
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Bet Dialog */}
      <AlertDialog open={showBetDialog} onOpenChange={setShowBetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cast Your Truth Position</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium">{selectedMarket?.claim}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Source: {selectedMarket?.source}
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant={betPosition === 'yes' ? 'default' : 'outline'}
                    onClick={() => setBetPosition('yes')}
                    className="h-auto p-3 flex-col gap-1"
                  >
                    <span className="text-lg">True</span>
                    <span className="text-sm opacity-80">
                      {selectedMarket?.yesOdds.toFixed(2)}x odds
                    </span>
                  </Button>
                  <Button
                    variant={betPosition === 'no' ? 'default' : 'outline'}
                    onClick={() => setBetPosition('no')}
                    className="h-auto p-3 flex-col gap-1"
                  >
                    <span className="text-lg">False</span>
                    <span className="text-sm opacity-80">
                      {selectedMarket?.noOdds.toFixed(2)}x odds
                    </span>
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="betAmount">Amount (ETH)</Label>
                  <Input
                    id="betAmount"
                    type="number"
                    step="0.001"
                    min="0.001"
                    max={userBalance}
                    value={betAmount}
                    onChange={(e) => setBetAmount(e.target.value)}
                    placeholder="Enter amount..."
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Balance: {userBalance.toFixed(3)} ETH</span>
                    {betAmount && selectedMarket && (
                      <span>
                        Potential win: {(parseFloat(betAmount) * (betPosition === 'yes' ? selectedMarket.yesOdds : selectedMarket.noOdds)).toFixed(3)} ETH
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePlaceBet}>
              Cast Position
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Share Modal */}
      {showShareModal && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => {
            setShowShareModal(false);
            setSelectedMarket(null);
          }}
          market={selectedMarket}
        />
      )}
    </div>
  );
}