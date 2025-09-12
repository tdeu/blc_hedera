graph TD
    %% Market Creation Phase
    A[User Submits Market] --> B[Admin Approval]
    B --> C[Smart Contract Deployment]
    C --> D[HTS Mints YES/NO Tokens]
    D --> E[Market Active - Trading Phase]
    
    %% Trading Phase
    E --> F[Users Place Bets]
    F --> G[CAST Tokens Staked]
    G --> H[NFT Bet Receipts Issued]
    H --> I[Community Submits Evidence]
    I --> J[Evidence → IPFS + HCS Topic 0.0.6701034]
    
    %% Market Expiration
    J --> K[Market Expires]
    K --> L[Status: 'resolving']
    L --> M[HCS Event: Market Closed]
    
    %% AI Resolution Phase
    M --> N[AI Fetches All Evidence]
    N --> O[AI Analyzes Data Sources]
    O --> P[AI Proposes Outcome + Confidence]
    P --> Q[AI Decision → HCS Topic 0.0.6701057]
    Q --> R[Supabase: Store AI Outcome]
    
    %% Dispute Window
    R --> S[48h Dispute Window Opens]
    S --> T{Community Disputes?}
    
    %% No Disputes Path
    T -->|No Disputes| U[Auto-Accept AI Decision]
    U --> V[Smart Contract Resolution]
    
    %% Disputes Path
    T -->|Disputes Submitted| W[User Stakes CAST Bond]
    W --> X[Evidence Upload → IPFS]
    X --> Y[Dispute → HCS Topic 0.0.6701064]
    Y --> Z[Supabase: Store Dispute]
    
    %% Admin Review Phase
    Z --> AA[Admin Dashboard Review]
    AA --> BB[Admin Evaluates AI + Disputes]
    BB --> CC{Admin Decision}
    
    %% Admin Confirms AI
    CC -->|Confirm AI| DD[Accept AI Resolution]
    DD --> EE[Valid Disputers Rewarded]
    EE --> FF[Invalid Disputers Slashed]
    
    %% Admin Overrides
    CC -->|Override AI| GG[Admin Sets New Outcome]
    GG --> HH[Dispute Disputers Rewarded 2x]
    HH --> II[AI Supporters Get Participation Bonus]
    
    %% Final Settlement
    FF --> JJ[HTS Distributes Winnings]
    II --> JJ
    V --> JJ
    JJ --> KK[BetNFT Holders Redeem]
    KK --> LL[Protocol Fees → Treasury]
    LL --> MM[Market Status: 'resolved']
    MM --> NN[HCS Final Audit Entry]
    
    %% Styling
    classDef userAction fill:#e1f5fe
    classDef blockchain fill:#f3e5f5
    classDef ai fill:#e8f5e8
    classDef admin fill:#fff3e0
    classDef settlement fill:#fce4ec
    
    class A,F,I,W userAction
    class C,D,G,H,J,M,Q,Y,JJ,KK blockchain
    class N,O,P ai
    class B,AA,BB,CC,DD,GG admin
    class EE,FF,HH,II,JJ,LL,MM,NN settlement