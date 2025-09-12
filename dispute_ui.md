<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BlockCast Dispute Interface Mockups</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>
    <style>
        .gradient-bg { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
        .card-hover { transition: all 0.3s ease; }
        .card-hover:hover { transform: translateY(-2px); box-shadow: 0 10px 25px rgba(0,0,0,0.15); }
    </style>
</head>
<body class="bg-gray-50">
    <!-- Header -->
    <div class="gradient-bg text-white p-6 mb-8">
        <div class="max-w-6xl mx-auto">
            <h1 class="text-3xl font-bold mb-2">BlockCast Dispute System Interface</h1>
            <p class="text-blue-100">Community-driven truth verification with economic incentives</p>
        </div>
    </div>

    <div class="max-w-6xl mx-auto px-4 space-y-8">
        
        <!-- Market Resolution Status Card -->
        <div class="bg-white rounded-xl shadow-lg p-6 card-hover">
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-xl font-bold text-gray-800">Market Resolution Status</h2>
                <span class="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">Resolving</span>
            </div>
            
            <div class="bg-blue-50 rounded-lg p-4 mb-4">
                <h3 class="font-semibold text-gray-800 mb-2">🤖 AI Resolution</h3>
                <p class="text-gray-700 mb-3">"Will Nigeria's inflation rate exceed 20% in Q1 2025?"</p>
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-4">
                        <span class="text-green-600 font-bold text-lg">YES</span>
                        <div class="flex items-center space-x-1">
                            <span class="text-sm text-gray-600">Confidence:</span>
                            <div class="flex items-center">
                                <div class="w-16 h-2 bg-gray-200 rounded-full">
                                    <div class="w-14 h-2 bg-green-500 rounded-full"></div>
                                </div>
                                <span class="ml-2 text-sm font-medium text-green-600">87%</span>
                            </div>
                        </div>
                    </div>
                    <div class="text-sm text-gray-500">
                        <i data-lucide="clock" class="w-4 h-4 inline mr-1"></i>
                        Resolved 2 hours ago
                    </div>
                </div>
            </div>
            
            <!-- Dispute Window Timer -->
            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-2">
                        <i data-lucide="timer" class="w-5 h-5 text-yellow-600"></i>
                        <span class="font-semibold text-yellow-800">Dispute Window Active</span>
                    </div>
                    <div class="text-right">
                        <div class="text-2xl font-bold text-yellow-600">46:23:15</div>
                        <div class="text-sm text-yellow-600">Hours remaining</div>
                    </div>
                </div>
                <div class="mt-3 w-full bg-yellow-200 rounded-full h-2">
                    <div class="bg-yellow-500 h-2 rounded-full" style="width: 4%"></div>
                </div>
                <p class="text-sm text-yellow-700 mt-2">Community can submit disputes until window closes</p>
            </div>
        </div>

        <!-- Submit Dispute Interface -->
        <div class="bg-white rounded-xl shadow-lg p-6 card-hover">
            <h2 class="text-xl font-bold text-gray-800 mb-6 flex items-center">
                <i data-lucide="alert-triangle" class="w-5 h-5 mr-2 text-orange-500"></i>
                Submit Dispute
            </h2>
            
            <!-- Bond Warning -->
            <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div class="flex items-start space-x-3">
                    <i data-lucide="info" class="w-5 h-5 text-red-500 mt-0.5"></i>
                    <div>
                        <h4 class="font-semibold text-red-800">Bond Requirement</h4>
                        <p class="text-red-700 text-sm">Staking <strong>25 CAST tokens</strong> required. You'll lose this bond if your dispute is invalid.</p>
                        <p class="text-red-700 text-sm mt-1">Valid disputes receive <strong>2x bond (50 CAST)</strong> + gas refund + share of slashed bonds.</p>
                    </div>
                </div>
            </div>
            
            <!-- Dispute Form -->
            <form class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Dispute Reason</label>
                    <select class="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500">
                        <option>AI decision contradicts official data</option>
                        <option>AI missed critical evidence</option>
                        <option>AI used unreliable sources</option>
                        <option>Interpretation error in question</option>
                        <option>Other (specify below)</option>
                    </select>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Evidence Description</label>
                    <textarea rows="4" class="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500" 
                              placeholder="Explain why the AI decision is wrong. Be specific and cite your sources...">According to the latest CBN monetary policy report released on Jan 15, 2025, Nigeria's inflation rate for Q1 2025 was 19.8%, which is below the 20% threshold. The AI appears to have used preliminary data from December 2024 rather than the final Q1 figures.</textarea>
                </div>
                
                <!-- Evidence Upload -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Supporting Evidence</label>
                    <div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                        <i data-lucide="upload-cloud" class="w-8 h-8 mx-auto text-gray-400 mb-2"></i>
                        <p class="text-gray-600">Drop files here or <span class="text-blue-500 underline cursor-pointer">browse</span></p>
                        <p class="text-sm text-gray-500 mt-1">PDF, images, documents (max 10MB each)</p>
                    </div>
                    
                    <!-- Uploaded Files Preview -->
                    <div class="mt-4 space-y-2">
                        <div class="flex items-center justify-between bg-green-50 p-3 rounded-lg">
                            <div class="flex items-center space-x-2">
                                <i data-lucide="file-text" class="w-4 h-4 text-green-600"></i>
                                <span class="text-sm text-green-800">CBN_Q1_2025_Inflation_Report.pdf</span>
                                <span class="text-xs text-green-600">(2.3 MB)</span>
                            </div>
                            <button class="text-red-500 hover:text-red-700">
                                <i data-lucide="x" class="w-4 h-4"></i>
                            </button>
                        </div>
                        <div class="flex items-center justify-between bg-green-50 p-3 rounded-lg">
                            <div class="flex items-center space-x-2">
                                <i data-lucide="image" class="w-4 h-4 text-green-600"></i>
                                <span class="text-sm text-green-800">inflation_chart_screenshot.png</span>
                                <span class="text-xs text-green-600">(456 KB)</span>
                            </div>
                            <button class="text-red-500 hover:text-red-700">
                                <i data-lucide="x" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Source Links -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Authoritative Sources</label>
                    <input type="url" class="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 mb-2" 
                           placeholder="https://www.cbn.gov.ng/monetary-policy/2025-q1-report" 
                           value="https://www.cbn.gov.ng/monetary-policy/2025-q1-report">
                    <input type="url" class="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500" 
                           placeholder="Additional source URL (optional)">
                </div>
                
                <!-- Bond Confirmation -->
                <div class="bg-gray-50 rounded-lg p-4">
                    <div class="flex items-center space-x-2 mb-3">
                        <input type="checkbox" id="bondConfirm" class="w-4 h-4 text-blue-600">
                        <label for="bondConfirm" class="text-sm text-gray-700">
                            I understand that I'm staking <strong>25 CAST tokens</strong> and will lose them if my dispute is found invalid
                        </label>
                    </div>
                    <div class="flex items-center justify-between text-sm">
                        <span class="text-gray-600">Your CAST Balance:</span>
                        <span class="font-medium">156 CAST</span>
                    </div>
                    <div class="flex items-center justify-between text-sm">
                        <span class="text-gray-600">Required Bond:</span>
                        <span class="font-medium text-red-600">25 CAST</span>
                    </div>
                    <div class="flex items-center justify-between text-sm font-medium">
                        <span class="text-gray-800">Remaining After Bond:</span>
                        <span class="text-green-600">131 CAST</span>
                    </div>
                </div>
                
                <button type="submit" class="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition-colors">
                    <i data-lucide="shield-alert" class="w-5 h-5 inline mr-2"></i>
                    Submit Dispute & Stake Bond
                </button>
            </form>
        </div>

        <!-- Existing Disputes List -->
        <div class="bg-white rounded-xl shadow-lg p-6 card-hover">
            <h2 class="text-xl font-bold text-gray-800 mb-6 flex items-center">
                <i data-lucide="users" class="w-5 h-5 mr-2 text-blue-500"></i>
                Community Disputes (3)
            </h2>
            
            <div class="space-y-4">
                <!-- Dispute 1 -->
                <div class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div class="flex items-start justify-between mb-3">
                        <div class="flex items-center space-x-2">
                            <span class="text-sm font-medium text-gray-800">0xf2b7...ac91</span>
                            <span class="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">Pending Review</span>
                        </div>
                        <div class="text-right text-sm text-gray-500">
                            <div>2 hours ago</div>
                            <div class="font-medium">25 CAST bonded</div>
                        </div>
                    </div>
                    <p class="text-gray-700 text-sm mb-2"><strong>Reason:</strong> AI decision contradicts official data</p>
                    <p class="text-gray-600 text-sm mb-3">Claims CBN official Q1 report shows 19.8% inflation, not above 20% as AI decided...</p>
                    <div class="flex items-center space-x-4 text-sm">
                        <span class="flex items-center text-green-600">
                            <i data-lucide="paperclip" class="w-3 h-3 mr-1"></i>
                            2 files attached
                        </span>
                        <span class="flex items-center text-blue-600">
                            <i data-lucide="link" class="w-3 h-3 mr-1"></i>
                            1 source cited
                        </span>
                        <span class="flex items-center text-purple-600">
                            <i data-lucide="thumbs-up" class="w-3 h-3 mr-1"></i>
                            4 community upvotes
                        </span>
                    </div>
                </div>
                
                <!-- Dispute 2 -->
                <div class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div class="flex items-start justify-between mb-3">
                        <div class="flex items-center space-x-2">
                            <span class="text-sm font-medium text-gray-800">0x8a3c...1f4e</span>
                            <span class="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">Pending Review</span>
                        </div>
                        <div class="text-right text-sm text-gray-500">
                            <div>4 hours ago</div>
                            <div class="font-medium">25 CAST bonded</div>
                        </div>
                    </div>
                    <p class="text-gray-700 text-sm mb-2"><strong>Reason:</strong> AI missed critical evidence</p>
                    <p class="text-gray-600 text-sm mb-3">AI failed to consider revised methodology announced by CBN in December 2024...</p>
                    <div class="flex items-center space-x-4 text-sm">
                        <span class="flex items-center text-green-600">
                            <i data-lucide="paperclip" class="w-3 h-3 mr-1"></i>
                            1 file attached
                        </span>
                        <span class="flex items-center text-blue-600">
                            <i data-lucide="link" class="w-3 h-3 mr-1"></i>
                            2 sources cited
                        </span>
                        <span class="flex items-center text-purple-600">
                            <i data-lucide="thumbs-up" class="w-3 h-3 mr-1"></i>
                            1 community upvote
                        </span>
                    </div>
                </div>
                
                <!-- Dispute 3 -->
                <div class="border border-red-200 rounded-lg p-4 bg-red-50">
                    <div class="flex items-start justify-between mb-3">
                        <div class="flex items-center space-x-2">
                            <span class="text-sm font-medium text-gray-800">0x9d1b...7c82</span>
                            <span class="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">Likely Invalid</span>
                        </div>
                        <div class="text-right text-sm text-gray-500">
                            <div>6 hours ago</div>
                            <div class="font-medium text-red-600">25 CAST at risk</div>
                        </div>
                    </div>
                    <p class="text-gray-700 text-sm mb-2"><strong>Reason:</strong> Other (specify below)</p>
                    <p class="text-gray-600 text-sm mb-3">AI is biased against Nigeria, this is clearly manipulation...</p>
                    <div class="flex items-center space-x-4 text-sm">
                        <span class="flex items-center text-gray-500">
                            <i data-lucide="paperclip" class="w-3 h-3 mr-1"></i>
                            No files
                        </span>
                        <span class="flex items-center text-gray-500">
                            <i data-lucide="link" class="w-3 h-3 mr-1"></i>
                            No sources
                        </span>
                        <span class="flex items-center text-red-600">
                            <i data-lucide="thumbs-down" class="w-3 h-3 mr-1"></i>
                            2 community downvotes
                        </span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Admin Review Interface (Admin View) -->
        <div class="bg-white rounded-xl shadow-lg p-6 card-hover border-l-4 border-purple-500">
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-xl font-bold text-gray-800 flex items-center">
                    <i data-lucide="shield-check" class="w-5 h-5 mr-2 text-purple-500"></i>
                    Admin Review Panel
                </h2>
                <span class="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">Admin Only</span>
            </div>
            
            <!-- Summary Stats -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div class="bg-blue-50 p-4 rounded-lg text-center">
                    <div class="text-2xl font-bold text-blue-600">87%</div>
                    <div class="text-sm text-blue-600">AI Confidence</div>
                </div>
                <div class="bg-yellow-50 p-4 rounded-lg text-center">
                    <div class="text-2xl font-bold text-yellow-600">3</div>
                    <div class="text-sm text-yellow-600">Total Disputes</div>
                </div>
                <div class="bg-green-50 p-4 rounded-lg text-center">
                    <div class="text-2xl font-bold text-green-600">75</div>
                    <div class="text-sm text-green-600">CAST Bonded</div>
                </div>
                <div class="bg-purple-50 p-4 rounded-lg text-center">
                    <div class="text-2xl font-bold text-purple-600">42h</div>
                    <div class="text-sm text-purple-600">Time Remaining</div>
                </div>
            </div>
            
            <!-- Admin Decision Panel -->
            <div class="bg-gray-50 rounded-lg p-4 mb-4">
                <h3 class="font-semibold text-gray-800 mb-3">Resolution Decision</h3>
                <div class="space-y-3">
                    <label class="flex items-center space-x-2">
                        <input type="radio" name="resolution" value="confirm" class="text-blue-600">
                        <span class="text-sm">Confirm AI Decision (YES - 87% confidence)</span>
                    </label>
                    <label class="flex items-center space-x-2">
                        <input type="radio" name="resolution" value="override_no" class="text-blue-600">
                        <span class="text-sm">Override to NO (Disputes #1 & #2 are valid)</span>
                    </label>
                    <label class="flex items-center space-x-2">
                        <input type="radio" name="resolution" value="invalid" class="text-blue-600">
                        <span class="text-sm">Mark Market Invalid (Unclear question)</span>
                    </label>
                </div>
            </div>
            
            <!-- Dispute Evaluation -->
            <div class="space-y-3 mb-4">
                <h3 class="font-semibold text-gray-800">Dispute Evaluation</h3>
                
                <div class="flex items-center justify-between bg-green-50 p-3 rounded-lg">
                    <span class="text-sm">Dispute #1 (0xf2b7...ac91)</span>
                    <select class="text-sm border border-gray-300 rounded px-2 py-1">
                        <option>Valid - Reward 2x</option>
                        <option selected>Valid - Reward 2x</option>
                        <option>Invalid - Slash bond</option>
                    </select>
                </div>
                
                <div class="flex items-center justify-between bg-green-50 p-3 rounded-lg">
                    <span class="text-sm">Dispute #2 (0x8a3c...1f4e)</span>
                    <select class="text-sm border border-gray-300 rounded px-2 py-1">
                        <option selected>Valid - Reward 2x</option>
                        <option>Invalid - Slash bond</option>
                    </select>
                </div>
                
                <div class="flex items-center justify-between bg-red-50 p-3 rounded-lg">
                    <span class="text-sm">Dispute #3 (0x9d1b...7c82)</span>
                    <select class="text-sm border border-gray-300 rounded px-2 py-1">
                        <option>Valid - Reward 2x</option>
                        <option selected>Invalid - Slash bond</option>
                    </select>
                </div>
            </div>
            
            <!-- Admin Notes -->
            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">Resolution Notes</label>
                <textarea rows="3" class="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-500" 
                          placeholder="Explain your reasoning for this decision...">After reviewing all evidence, disputes #1 and #2 provide compelling evidence from the official CBN Q1 2025 report showing inflation at 19.8%, which contradicts the AI's YES decision. The AI appears to have used preliminary data. Dispute #3 lacks evidence and reasoning. Final resolution: NO</textarea>
            </div>
            
            <!-- Projected Payouts -->
            <div class="bg-blue-50 rounded-lg p-4 mb-4">
                <h3 class="font-semibold text-blue-800 mb-3">Projected Payouts</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                        <h4 class="font-medium text-blue-700 mb-2">Valid Disputers (2)</h4>
                        <div class="space-y-1 text-blue-600">
                            <div>• 0xf2b7...ac91: 50 CAST (2x bond)</div>
                            <div>• 0x8a3c...1f4e: 50 CAST (2x bond)</div>
                            <div>• Gas refunds: ~0.2 HBAR each</div>
                            <div>• Bonus from slashed bond: 12.5 CAST each</div>
                        </div>
                    </div>
                    <div>
                        <h4 class="font-medium text-red-700 mb-2">Slashed (1)</h4>
                        <div class="space-y-1 text-red-600">
                            <div>• 0x9d1b...7c82: -25 CAST (bond)</div>
                            <div>• To treasury: 12.5 CAST</div>
                            <div>• To valid disputers: 12.5 CAST</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Final Actions -->
            <div class="flex space-x-3">
                <button class="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors">
                    <i data-lucide="check" class="w-5 h-5 inline mr-2"></i>
                    Confirm Resolution & Execute Payouts
                </button>
                <button class="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                    <i data-lucide="clock" class="w-5 h-5 inline mr-2"></i>
                    Extend Review Period
                </button>
            </div>
        </div>

        <!-- Resolution History / Completed Dispute Example -->
        <div class="bg-white rounded-xl shadow-lg p-6 card-hover border-l-4 border-green-500">
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-xl font-bold text-gray-800 flex items-center">
                    <i data-lucide="check-circle" class="w-5 h-5 mr-2 text-green-500"></i>
                    Completed Resolution Example
                </h2>
                <span class="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">Resolved</span>
            </div>
            
            <!-- Previous Market Summary -->
            <div class="bg-gray-50 rounded-lg p-4 mb-4">
                <h3 class="font-semibold text-gray-800 mb-2">Market: "Will Bitcoin exceed $100k by end of 2024?"</h3>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                        <span class="text-gray-600">AI Decision:</span>
                        <span class="font-medium text-red-600 ml-2">NO (92% confidence)</span>
                    </div>
                    <div>
                        <span class="text-gray-600">Final Outcome:</span>
                        <span class="font-medium text-red-600 ml-2">NO (Confirmed)</span>
                    </div>
                    <div>
                        <span class="text-gray-600">Total Disputes:</span>
                        <span class="font-medium ml-2">1 (Invalid)</span>
                    </div>
                </div>
            </div>
            
            <!-- Resolution Results -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div class="bg-green-50 p-4 rounded-lg">
                    <h4 class="font-semibold text-green-700 mb-2">✅ Successful Outcomes</h4>
                    <div class="text-sm text-green-600 space-y-1">
                        <div>• AI decision confirmed as correct</div>
                        <div>• NO token holders received payouts</div>
                        <div>• Market creator: +100 CAST bonus</div>
                        <div>• Protocol fees: 234 CAST collected</div>
                    </div>
                </div>
                <div class="bg-red-50 p-4 rounded-lg">
                    <h4 class="font-semibold text-red-700 mb-2">❌ Invalid Dispute</h4>
                    <div class="text-sm text-red-600 space-y-1">
                        <div>• 0x7f2a...bc43: -50 CAST (slashed)</div>
                        <div>• Reason: No evidence provided</div>
                        <div>• Bond distributed to treasury</div>
                        <div>• Account flagged for review</div>
                    </div>
                </div>
            </div>
            
            <!-- Transaction Links -->
            <div class="bg-blue-50 p-4 rounded-lg">
                <h4 class="font-semibold text-blue-700 mb-2">🔗 Blockchain Verification</h4>
                <div class="text-sm space-y-1">
                    <div class="flex items-center justify-between">
                        <span class="text-blue-600">Resolution Transaction:</span>
                        <a href="#" class="text-blue-500 hover:underline font-mono">0x8f3d...a92b</a>
                    </div>
                    <div class="flex items-center justify-between">
                        <span class="text-blue-600">Payout Transaction:</span>
                        <a href="#" class="text-blue-500 hover:underline font-mono">0x1c7e...f48d</a>
                    </div>
                    <div class="flex items-center justify-between">
                        <span class="text-blue-600">HCS Evidence Topic:</span>
                        <a href="#" class="text-blue-500 hover:underline font-mono">0.0.6701064</a>
                    </div>
                    <div class="flex items-center justify-between">
                        <span class="text-blue-600">Resolution Timestamp:</span>
                        <span class="text-gray-600">2025-01-15 14:32:18 UTC</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- User Portfolio Disputes -->
        <div class="bg-white rounded-xl shadow-lg p-6 card-hover">
            <h2 class="text-xl font-bold text-gray-800 mb-6 flex items-center">
                <i data-lucide="user" class="w-5 h-5 mr-2 text-indigo-500"></i>
                Your Dispute History
            </h2>
            
            <!-- Stats Overview -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div class="text-center p-3 bg-green-50 rounded-lg">
                    <div class="text-2xl font-bold text-green-600">7</div>
                    <div class="text-sm text-green-600">Valid Disputes</div>
                </div>
                <div class="text-center p-3 bg-red-50 rounded-lg">
                    <div class="text-2xl font-bold text-red-600">2</div>
                    <div class="text-sm text-red-600">Invalid Disputes</div>
                </div>
                <div class="text-center p-3 bg-blue-50 rounded-lg">
                    <div class="text-2xl font-bold text-blue-600">+340</div>
                    <div class="text-sm text-blue-600">CAST Earned</div>
                </div>
                <div class="text-center p-3 bg-yellow-50 rounded-lg">
                    <div class="text-2xl font-bold text-yellow-600">78%</div>
                    <div class="text-sm text-yellow-600">Success Rate</div>
                </div>
            </div>
            
            <!-- Recent Disputes -->
            <div class="space-y-3">
                <h3 class="font-semibold text-gray-800">Recent Disputes</h3>
                
                <div class="flex items-center justify-between bg-green-50 p-3 rounded-lg">
                    <div>
                        <div class="font-medium text-sm">Nigerian Election Results</div>
                        <div class="text-xs text-gray-600">Disputed AI decision - Provided INEC official results</div>
                    </div>
                    <div class="text-right">
                        <div class="text-green-600 font-bold">+75 CAST</div>
                        <div class="text-xs text-gray-500">3 days ago</div>
                    </div>
                </div>
                
                <div class="flex items-center justify-between bg-green-50 p-3 rounded-lg">
                    <div>
                        <div class="font-medium text-sm">Ghana GDP Growth Q4 2024</div>
                        <div class="text-xs text-gray-600">Challenged incorrect data source</div>
                    </div>
                    <div class="text-right">
                        <div class="text-green-600 font-bold">+50 CAST</div>
                        <div class="text-xs text-gray-500">1 week ago</div>
                    </div>
                </div>
                
                <div class="flex items-center justify-between bg-red-50 p-3 rounded-lg">
                    <div>
                        <div class="font-medium text-sm">South African Rand Exchange Rate</div>
                        <div class="text-xs text-gray-600">Insufficient evidence provided</div>
                    </div>
                    <div class="text-right">
                        <div class="text-red-600 font-bold">-25 CAST</div>
                        <div class="text-xs text-gray-500">2 weeks ago</div>
                    </div>
                </div>
            </div>
            
            <!-- Pending Disputes -->
            <div class="mt-6 bg-yellow-50 p-4 rounded-lg">
                <h4 class="font-semibold text-yellow-800 mb-2">⏳ Pending Reviews</h4>
                <div class="text-sm text-yellow-700">
                    <div>• Nigeria Inflation Rate Q1 2025: 25 CAST bonded, awaiting admin review</div>
                    <div class="text-xs text-yellow-600 mt-1">Submitted 2 hours ago • Review expected within 24 hours</div>
                </div>
            </div>
        </div>

        <!-- Mobile-Responsive Dispute Quick Actions -->
        <div class="bg-white rounded-xl shadow-lg p-6 card-hover md:hidden">
            <h2 class="text-lg font-bold text-gray-800 mb-4">Quick Actions</h2>
            <div class="grid grid-cols-1 gap-3">
                <button class="bg-red-100 hover:bg-red-200 text-red-800 font-medium py-3 px-4 rounded-lg transition-colors">
                    <i data-lucide="alert-triangle" class="w-4 h-4 inline mr-2"></i>
                    Submit New Dispute
                </button>
                <button class="bg-blue-100 hover:bg-blue-200 text-blue-800 font-medium py-3 px-4 rounded-lg transition-colors">
                    <i data-lucide="history" class="w-4 h-4 inline mr-2"></i>
                    View Dispute History
                </button>
                <button class="bg-green-100 hover:bg-green-200 text-green-800 font-medium py-3 px-4 rounded-lg transition-colors">
                    <i data-lucide="trending-up" class="w-4 h-4 inline mr-2"></i>
                    Check Earnings
                </button>
            </div>
        </div>

    </div>

    <!-- Footer -->
    <div class="mt-12 bg-gray-800 text-white p-6">
        <div class="max-w-6xl mx-auto text-center">
            <p class="text-gray-300 mb-2">BlockCast Dispute Resolution System</p>
            <p class="text-sm text-gray-400">
                Powered by Hedera Hashgraph • Community-driven truth verification
            </p>
            <div class="mt-4 flex justify-center space-x-4 text-sm text-gray-400">
                <span>HCS Topics: 0.0.6701034 (Evidence) • 0.0.6701057 (AI) • 0.0.6701064 (Disputes)</span>
            </div>
        </div>
    </div>

    <script>
        // Initialize Lucide icons
        lucide.createIcons();
        
        // Add some interactivity
        document.addEventListener('DOMContentLoaded', function() {
            // Simulate real-time countdown for dispute window
            let timeRemaining = 46 * 3600 + 23 * 60 + 15; // 46:23:15 in seconds
            
            function updateCountdown() {
                const hours = Math.floor(timeRemaining / 3600);
                const minutes = Math.floor((timeRemaining % 3600) / 60);
                const seconds = timeRemaining % 60;
                
                const countdownElement = document.querySelector('.text-2xl.font-bold.text-yellow-600');
                if (countdownElement) {
                    countdownElement.textContent = 
                        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                }
                
                // Update progress bar
                const progressBar = document.querySelector('.bg-yellow-500.h-2');
                if (progressBar) {
                    const totalTime = 48 * 3600; // 48 hours in seconds
                    const elapsed = totalTime - timeRemaining;
                    const percentage = (elapsed / totalTime) * 100;
                    progressBar.style.width = `${Math.min(percentage, 100)}%`;
                }
                
                timeRemaining--;
                if (timeRemaining >= 0) {
                    setTimeout(updateCountdown, 1000);
                }
            }
            
            updateCountdown();
            
            // Add hover effects to cards
            const cards = document.querySelectorAll('.card-hover');
            cards.forEach(card => {
                card.addEventListener('mouseenter', function() {
                    this.style.transform = 'translateY(-2px)';
                });
                card.addEventListener('mouseleave', function() {
                    this.style.transform = 'translateY(0)';
                });
            });
        });
    </script>
</body>
</html>