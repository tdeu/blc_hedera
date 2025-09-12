graph LR
    subgraph Users
        U1[User Wallet]
        U2[Disputer Wallet]
        U3[Winner Wallet]
    end
    
    subgraph Contracts
        PM[PredictionMarket]
        CT[CAST Token]
        DM[DisputeManager]
        TR[Treasury]
        HTS[Hedera Token Service]
    end
    
    subgraph Flows
        F1[Betting Flow]
        F2[Dispute Flow]
        F3[Resolution Flow]
    end
    
    %% Betting Flow
    U1 --> CT
    CT --> PM
    PM --> HTS
    HTS --> U1
    PM --> TR
    
    %% Dispute Flow
    U2 --> DM
    DM --> TR
    TR --> U2
    
    %% Resolution Flow
    PM --> HTS
    HTS --> U3
    
    %% Styling
    classDef userStyle fill:#e3f2fd
    classDef contractStyle fill:#f1f8e9
    classDef flowStyle fill:#fff3e0
    
    class U1,U2,U3 userStyle
    class PM,CT,DM,TR,HTS contractStyle
    class F1,F2,F3 flowStyle