Refactoring Opportunities Summary                                                                                       
                                                                                                                          
  Zephyr and the exploration agents identified 18 refactoring opportunities. Here's the prioritized table:                
  #: 1                                                                                                                    
  Area: Streaming Hooks                                                                                                   
  Problem: 500+ lines duplicated between useStreamingAnalysis and useUserStreamingAnalysis                                
  Priority: HIGH                                                                                                          
  Effort: Large                                                                                                           
  ────────────────────────────────────────                                                                                
  #: 2                                                                                                                    
  Area: Test Coverage                                                                                                     
  Problem: 4 core hooks have no tests (streaming analysis, auth, chat)                                                    
  Priority: HIGH                                                                                                          
  Effort: Large                                                                                                           
  ────────────────────────────────────────                                                                                
  #: 3                                                                                                                    
  Area: Legacy Systems                                                                                                    
  Problem: THREE virtue systems coexist (11 Virtues, 23 Aspects, 5 Partner Virtues)                                       
  Priority: HIGH                                                                                                          
  Effort: Medium                                                                                                          
  ────────────────────────────────────────                                                                                
  #: 4                                                                                                                    
  Area: Docs Out of Sync                                                                                                  
  Problem: CLAUDE.md says Aspects UI deleted - but files still exist                                                      
  Priority: HIGH                                                                                                          
  Effort: Small                                                                                                           
  ────────────────────────────────────────                                                                                
  #: 5                                                                                                                    
  Area: Error Handling                                                                                                    
  Problem: Same pattern duplicated 12+ times across hooks                                                                 
  Priority: MEDIUM                                                                                                        
  Effort: Small                                                                                                           
  ────────────────────────────────────────                                                                                
  #: 6                                                                                                                    
  Area: Logging                                                                                                           
  Problem: 140 console.log statements, no strategy                                                                        
  Priority: MEDIUM                                                                                                        
  Effort: Medium                                                                                                          
  ────────────────────────────────────────                                                                                
  #: 7                                                                                                                    
  Area: API Patterns                                                                                                      
  Problem: anthropicClient has retry logic; dalleClient doesn't                                                           
  Priority: MEDIUM                                                                                                        
  Effort: Medium                                                                                                          
  ────────────────────────────────────────                                                                                
  #: 8                                                                                                                    
  Area: Type Collision                                                                                                    
  Problem: Two types named VirtueScore with different shapes                                                              
  Priority: MEDIUM                                                                                                        
  Effort: Small                                                                                                           
  ────────────────────────────────────────                                                                                
  #: 9                                                                                                                    
  Area: Generators                                                                                                        
  Problem: essenceGenerator and moodboardGenerator nearly identical                                                       
  Priority: LOW                                                                                                           
  Effort: Small                                                                                                           
  ────────────────────────────────────────                                                                                
  #: 10                                                                                                                   
  Area: Utils Overlap                                                                                                     
  Problem: userContext.ts and profileHelpers.ts overlap                                                                   
  Priority: LOW                                                                                                           
  Effort: Small                                                                                                           
  ────────────────────────────────────────                                                                                
  #: 11                                                                                                                   
  Area: File Size                                                                                                         
  Problem: prompts.ts is 1,630 lines                                                                                      
  Priority: LOW                                                                                                           
  Effort: Medium                                                                                                          
  ────────────────────────────────────────                                                                                
  #: 12                                                                                                                   
  Area: File Size                                                                                                         
  Problem: ai.ts is 1,874 lines                                                                                           
  Priority: LOW                                                                                                           
  Effort: Medium                                                                                                          
  ────────────────────────────────────────                                                                                
  #: 13                                                                                                                   
  Area: Barrel Exports                                                                                                    
  Problem: hooks/index.ts missing 4 exports                                                                               
  Priority: LOW                                                                                                           
  Effort: Small                                                                                                           
  ────────────────────────────────────────                                                                                
  #: 14                                                                                                                   
  Area: Debug Code                                                                                                        
  Problem: DebugSection.tsx always in production bundle                                                                   
  Priority: LOW                                                                                                           
  Effort: Small                                                                                                           
  Key Insight: Documentation vs Reality                                                                                   
                                                                                                                          
  The CLAUDE.md claims the 23 Aspects migration is complete and UI components were fully deleted on January 26, 2026.     
  However, these files still exist:                                                                                       
  - AspectConstellationCard.tsx (204 lines)                                                                               
  - AspectMatchCard.tsx (200+ lines)                                                                                      
  - VirtueScoresCard.tsx (still in profile detail)                                                                        
                                                                                                                          
  Recommended Approach                                                                                                    
                                                                                                                          
  1. Phase 1: Add tests for streaming hooks (safety net)                                                                  
  2. Phase 2: Quick wins (error utility, barrel exports, type fix)                                                        
  3. Phase 3: Remove legacy Aspects code                                                                                  
  4. Phase 4: Merge streaming hooks                                                                                       
  5. Phase 5: Polish (split large files, logging)                                                                         
                                                                                                                          
  Full details written to the plan file.                                                                                  
                                                                                                                          
  ---[timestamp] 2026-01-27 10:47 PST                                                                                     
                                                                                                                          
──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
 Ready to code?                                                                                                           
                                                                                                                          
 Here is Claude's plan:                                                                                                   
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
 Aura Refactoring Opportunities Analysis                                                                                  
                                                                                                                          
 Executive Summary                                                                                                        
                                                                                                                          
 Analysis identified 18 refactoring opportunities across 6 categories. The most impactful items are:                      
 1. Streaming hooks duplication - 500+ lines of duplicated code                                                           
 2. Missing test coverage - Core streaming logic untested                                                                 
 3. Legacy virtue systems - THREE different systems coexist                                                               
 4. CLAUDE.md documentation out of sync - Claims components removed that still exist                                      
                                                                                                                          
 ---                                                                                                                      
 Prioritized Refactoring Table                                                                                            
 ┌─────┬───────────────┬──────────────────────────────────────────┬─────────────────────────┬──────────┬────────┬───────┐ 
 │  #  │     Area      │                 Problem                  │      Proposed Fix       │ Priority │ Effort │ Files │ 
 ├─────┼───────────────┼──────────────────────────────────────────┼─────────────────────────┼──────────┼────────┼───────┤ 
 │     │               │ useStreamingAnalysis.ts (591 lines) and  │ Extract shared          │          │        │ 2     │ 
 │ 1   │ Hooks         │ useUserStreamingAnalysis.ts (449 lines)  │ streaming core with     │ HIGH     │ Large  │ hooks │ 
 │     │               │ share ~500 lines of identical logic      │ generic type parameter  │          │        │       │ 
 ├─────┼───────────────┼──────────────────────────────────────────┼─────────────────────────┼──────────┼────────┼───────┤ 
 │     │               │ 4 hooks lack test coverage:              │                         │          │        │       │ 
 │ 2   │ Tests         │ useStreamingAnalysis,                    │ Add comprehensive tests │ HIGH     │ Large  │ 4     │ 
 │     │               │ useUserStreamingAnalysis,                │  before refactoring #1  │          │        │ hooks │ 
 │     │               │ useRequireAuth, useAskAboutMatch         │                         │          │        │       │ 
 ├─────┼───────────────┼──────────────────────────────────────────┼─────────────────────────┼──────────┼────────┼───────┤ 
 │     │               │ THREE virtue systems exist: 11 Virtues   │ Remove legacy systems,  │          │        │ 5+    │ 
 │ 3   │ Legacy Code   │ (current), 23 Aspects (deprecated), 5    │ consolidate to 11       │ HIGH     │ Medium │ files │ 
 │     │               │ Partner Virtues (deprecated)             │ Virtues only            │          │        │       │ 
 ├─────┼───────────────┼──────────────────────────────────────────┼─────────────────────────┼──────────┼────────┼───────┤ 
 │     │               │ CLAUDE.md claims                         │                         │          │        │       │ 
 │ 4   │ Documentation │ AspectConstellationCard.tsx and          │ Either delete files or  │ HIGH     │ Small  │ 3     │ 
 │     │               │ AspectMatchCard.tsx removed but they     │ update docs             │          │        │ files │ 
 │     │               │ still exist                              │                         │          │        │       │ 
 ├─────┼───────────────┼──────────────────────────────────────────┼─────────────────────────┼──────────┼────────┼───────┤ 
 │     │ Error         │ Same error conversion pattern duplicated │ Extract                 │          │        │ 12    │ 
 │ 5   │ Handling      │  12+ times across hooks                  │ ensureAuraError()       │ MEDIUM   │ Small  │ hooks │ 
 │     │               │                                          │ utility function        │          │        │       │ 
 ├─────┼───────────────┼──────────────────────────────────────────┼─────────────────────────┼──────────┼────────┼───────┤ 
 │ 6   │ Logging       │ 140 console.log statements across 23 lib │ Implement structured    │ MEDIUM   │ Medium │ 23    │ 
 │     │               │  files, no logging strategy              │ logging utility         │          │        │ files │ 
 ├─────┼───────────────┼──────────────────────────────────────────┼─────────────────────────┼──────────┼────────┼───────┤ 
 │     │               │ anthropicClient.ts has sophisticated     │ Standardize API client  │          │        │ 2     │ 
 │ 7   │ API Patterns  │ retry/timeout; dalleClient.ts has basic  │ patterns                │ MEDIUM   │ Medium │ files │ 
 │     │               │ error handling                           │                         │          │        │       │ 
 ├─────┼───────────────┼──────────────────────────────────────────┼─────────────────────────┼──────────┼────────┼───────┤ 
 │ 8   │ Type          │ Two types named VirtueScore with         │ Rename or consolidate   │ MEDIUM   │ Small  │ 1     │ 
 │     │ Collision     │ different shapes in db.ts                │ types                   │          │        │ file  │ 
 ├─────┼───────────────┼──────────────────────────────────────────┼─────────────────────────┼──────────┼────────┼───────┤ 
 │     │               │ essenceGenerator.ts and                  │ Extract shared image    │          │        │ 2     │ 
 │ 9   │ Generators    │ moodboardGenerator.ts have nearly        │ generation              │ LOW      │ Small  │ files │ 
 │     │               │ identical structure                      │ orchestration           │          │        │       │ 
 ├─────┼───────────────┼──────────────────────────────────────────┼─────────────────────────┼──────────┼────────┼───────┤ 
 │ 10  │ Utils Overlap │ userContext.ts and profileHelpers.ts     │ Consolidate or clearly  │ LOW      │ Small  │ 2     │ 
 │     │               │ have overlapping responsibilities        │ separate                │          │        │ files │ 
 ├─────┼───────────────┼──────────────────────────────────────────┼─────────────────────────┼──────────┼────────┼───────┤ 
 │ 11  │ File Size     │ prompts.ts is 1,630 lines with 15+       │ Split into              │ LOW      │ Medium │ 1     │ 
 │     │               │ prompts mixed together                   │ feature-based modules   │          │        │ file  │ 
 ├─────┼───────────────┼──────────────────────────────────────────┼─────────────────────────┼──────────┼────────┼───────┤ 
 │ 12  │ File Size     │ ai.ts is 1,874 lines with similar        │ Extract common scoring  │ LOW      │ Medium │ 1     │ 
 │     │               │ scoring functions                        │ orchestration           │          │        │ file  │ 
 ├─────┼───────────────┼──────────────────────────────────────────┼─────────────────────────┼──────────┼────────┼───────┤ 
 │     │               │ hooks/index.ts missing 4 hooks:          │                         │          │        │       │ 
 │ 13  │ Barrel        │ useStreamingAnalysis,                    │ Add missing exports     │ LOW      │ Small  │ 1     │ 
 │     │ Exports       │ useUserStreamingAnalysis,                │                         │          │        │ file  │ 
 │     │               │ useRequireAuth, useTheme                 │                         │          │        │       │ 
 ├─────┼───────────────┼──────────────────────────────────────────┼─────────────────────────┼──────────┼────────┼───────┤ 
 │ 14  │ Debug         │ DebugSection.tsx always compiled in      │ Add feature flag or     │ LOW      │ Small  │ 1     │ 
 │     │ Components    │ production                               │ environment check       │          │        │ file  │ 
 └─────┴───────────────┴──────────────────────────────────────────┴─────────────────────────┴──────────┴────────┴───────┘ 
 ---                                                                                                                      
 Detailed Analysis by Category                                                                                            
                                                                                                                          
 1. HIGH PRIORITY: Streaming Hooks Duplication                                                                            
                                                                                                                          
 Current State:                                                                                                           
 - src/hooks/useStreamingAnalysis.ts (591 lines) - For match profiles                                                     
 - src/hooks/useUserStreamingAnalysis.ts (449 lines) - For user profiles                                                  
 - ~500 lines of shared logic: state machine, frame extraction, quality scoring, thumbnail selection                      
                                                                                                                          
 Problems:                                                                                                                
 - Bug fixes must be applied twice                                                                                        
 - State machine logic not tested                                                                                         
 - Divergence risk as code evolves                                                                                        
                                                                                                                          
 Proposed Solution:                                                                                                       
 // Create shared base hook                                                                                               
 function useStreamingAnalysisCore<T extends BaseProfile>(options: StreamingOptions<T>) {                                 
   // Shared state machine, frame extraction, quality scoring                                                             
 }                                                                                                                        
                                                                                                                          
 // Thin wrappers                                                                                                         
 useStreamingAnalysis = () => useStreamingAnalysisCore<MatchProfile>({ ... })                                             
 useUserStreamingAnalysis = () => useStreamingAnalysisCore<UserProfile>({ ... })                                          
                                                                                                                          
 ---                                                                                                                      
 2. HIGH PRIORITY: Missing Hook Tests                                                                                     
                                                                                                                          
 Hooks without tests:                                                                                                     
 ┌──────────────────────────┬───────┬────────────────────┐                                                                
 │           Hook           │ Lines │        Risk        │                                                                
 ├──────────────────────────┼───────┼────────────────────┤                                                                
 │ useStreamingAnalysis     │ 591   │ Core analysis flow │                                                                
 ├──────────────────────────┼───────┼────────────────────┤                                                                
 │ useUserStreamingAnalysis │ 449   │ Core user flow     │                                                                
 ├──────────────────────────┼───────┼────────────────────┤                                                                
 │ useRequireAuth           │ 45    │ Auth protection    │                                                                
 ├──────────────────────────┼───────┼────────────────────┤                                                                
 │ useAskAboutMatch         │ 189   │ AI chat feature    │                                                                
 └──────────────────────────┴───────┴────────────────────┘                                                                
 Recommendation: Add tests BEFORE refactoring streaming hooks to catch regressions.                                       
                                                                                                                          
 ---                                                                                                                      
 3. HIGH PRIORITY: Legacy Virtue Systems                                                                                  
                                                                                                                          
 Three systems coexist:                                                                                                   
 ┌──────────────────┬─────────────────────────────────────────────────────────────────────┬─────────────────────────────┐ 
 │      System      │                                Files                                │           Status            │ 
 ├──────────────────┼─────────────────────────────────────────────────────────────────────┼─────────────────────────────┤ 
 │ 11 Virtues       │ virtues/virtues.ts, VirtueCompatibilityCard.tsx                     │ Current, active             │ 
 ├──────────────────┼─────────────────────────────────────────────────────────────────────┼─────────────────────────────┤ 
 │ 23 Aspects       │ virtues/aspects.ts, AspectConstellationCard.tsx,                    │ Deprecated, still in UI     │ 
 │                  │ AspectMatchCard.tsx                                                 │                             │ 
 ├──────────────────┼─────────────────────────────────────────────────────────────────────┼─────────────────────────────┤ 
 │ 5 Partner        │ VirtueScoresCard.tsx                                                │ Deprecated, still           │ 
 │ Virtues          │                                                                     │ referenced                  │ 
 └──────────────────┴─────────────────────────────────────────────────────────────────────┴─────────────────────────────┘ 
 Files to remove or migrate:                                                                                              
 - src/lib/virtues/aspects.ts - Marked @deprecated                                                                        
 - src/components/profile/AspectConstellationCard.tsx - Still displayed                                                   
 - src/components/profileDetail/AspectMatchCard.tsx - Still displayed                                                     
 - src/components/profileDetail/VirtueScoresCard.tsx - Old 5-virtue UI                                                    
 - src/pages/MyProfile.tsx - Still calls extractUserAspects                                                               
                                                                                                                          
 ---                                                                                                                      
 4. HIGH PRIORITY: Documentation Sync                                                                                     
                                                                                                                          
 CLAUDE.md states:                                                                                                        
 "Old 23 Aspects UI components fully deleted (January 26, 2026)"                                                          
                                                                                                                          
 Reality: These files still exist:                                                                                        
 - AspectConstellationCard.tsx (204 lines)                                                                                
 - AspectMatchCard.tsx (200+ lines)                                                                                       
 - VirtueScoresCard.tsx (still in profile detail)                                                                         
                                                                                                                          
 Action: Either delete the components or correct the documentation.                                                       
                                                                                                                          
 ---                                                                                                                      
 5. MEDIUM: Error Handling Duplication                                                                                    
                                                                                                                          
 Pattern repeated 12+ times:                                                                                              
 const auraError = err instanceof AuraError                                                                               
   ? err                                                                                                                  
   : new ApiError(err instanceof Error ? err.message : 'Failed to X', { cause: err instanceof Error ? err : undefined }); 
                                                                                                                          
 Solution:                                                                                                                
 // src/lib/errors/utils.ts                                                                                               
 export function ensureAuraError(err: unknown, defaultMessage: string): AuraError {                                       
   if (err instanceof AuraError) return err;                                                                              
   return new ApiError(                                                                                                   
     err instanceof Error ? err.message : defaultMessage,                                                                 
     { cause: err instanceof Error ? err : undefined }                                                                    
   );                                                                                                                     
 }                                                                                                                        
                                                                                                                          
 ---                                                                                                                      
 Recommended Sequencing                                                                                                   
                                                                                                                          
 Phase 1: Safety Net (1-2 days)                                                                                           
 ├── Add tests for useStreamingAnalysis                                                                                   
 ├── Add tests for useUserStreamingAnalysis                                                                               
 └── Fix CLAUDE.md documentation                                                                                          
                                                                                                                          
 Phase 2: Quick Wins (1 day)                                                                                              
 ├── Extract ensureAuraError() utility                                                                                    
 ├── Add missing barrel exports                                                                                           
 └── Resolve VirtueScore type collision                                                                                   
                                                                                                                          
 Phase 3: Legacy Cleanup (2-3 days)                                                                                       
 ├── Remove AspectConstellationCard.tsx                                                                                   
 ├── Remove AspectMatchCard.tsx                                                                                           
 ├── Remove VirtueScoresCard.tsx                                                                                          
 ├── Remove/deprecate aspects.ts exports                                                                                  
 └── Update MyProfile.tsx to use 11 Virtues                                                                               
                                                                                                                          
 Phase 4: Major Refactoring (3-5 days)                                                                                    
 ├── Extract useStreamingAnalysisCore hook                                                                                
 ├── Refactor useStreamingAnalysis to use core                                                                            
 ├── Refactor useUserStreamingAnalysis to use core                                                                        
 └── Standardize API client patterns                                                                                      
                                                                                                                          
 Phase 5: Polish (2-3 days)                                                                                               
 ├── Split prompts.ts into modules                                                                                        
 ├── Extract ai.ts scoring orchestration                                                                                  
 ├── Implement structured logging                                                                                         
 └── Add feature flags for debug components                                                                               
                                                                                                                          
 ---                                                                                                                      
 Verification Plan                                                                                                        
                                                                                                                          
 After each phase:                                                                                                        
 1. Run npm run test:run - All 1049 unit tests pass                                                                       
 2. Run npm run test:e2e - All 362 E2E tests pass                                                                         
 3. Run npm run build - Production build succeeds                                                                         
 4. Manual smoke test: Upload video, verify streaming analysis works                                                      
                                                                                                                          
 ---                                                                                                                      
 Risks & Considerations                                                                                                   
 ┌─────────────────────────────┬───────────────────────────────────────────────────┐                                      
 │            Risk             │                    Mitigation                     │                                      
 ├─────────────────────────────┼───────────────────────────────────────────────────┤                                      
 │ Breaking streaming analysis │ Add tests first (Phase 1)                         │                                      
 ├─────────────────────────────┼───────────────────────────────────────────────────┤                                      
 │ Legacy profiles break       │ Migration function already exists in migration.ts │                                      
 ├─────────────────────────────┼───────────────────────────────────────────────────┤                                      
 │ API call failures           │ Keep current clients working until tests pass     │                                      
 ├─────────────────────────────┼───────────────────────────────────────────────────┤                                      
 │ Large diff reviews          │ Split into small, focused PRs per phase           │                                      
 └─────────────────────────────┴───────────────────────────────────────────────────┘                                      
 ---Generated by Zephyr (Master Product Manager) + Explore agents                                                         
 [timestamp] 2026-01-27 10:45 PST                                                                                  