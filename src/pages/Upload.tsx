// src/pages/Upload.tsx
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import VideoUploader from '../components/VideoUploader';
import { extractFramesFromVideo, type FrameExtractionProgress } from '../lib/frameExtraction';
import { analyzeProfileProgressive, scoreMatchVirtues, scoreMatchAspects, type QuickBasicsResult } from '../lib/ai';
import { db } from '../lib/db';
import type { UserIdentity, ProfileAnalysis, VirtueScore, MatchAspectScores } from '../lib/db';
import { buildUserContextForMatch, hasUserProfile as checkHasUserProfile } from '../lib/utils';
import { downloadConsoleLogs } from '../lib/utils/errorExport';
import { Loader2, AlertCircle, Save, CheckCircle, User, Info, X, Download } from 'lucide-react';

// Processing stages for progress feedback
type ProcessingStage =
  | 'idle'
  | 'extracting'
  | 'analyzing'
  | 'scoring-virtues'
  | 'scoring-aspects'
  | 'complete'
  | 'error';

interface StageInfo {
  stage: ProcessingStage;
  message: string;
  detail?: string;
}

export default function Upload() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [frames, setFrames] = useState<string[]>([]);
  const [analysis, setAnalysis] = useState<ProfileAnalysis | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [userIdentity, setUserIdentity] = useState<UserIdentity | undefined>(undefined);
  const [userContextLoaded, setUserContextLoaded] = useState(false);
  const [virtueScores, setVirtueScores] = useState<VirtueScore[]>([]);
  const [virtueStatus, setVirtueStatus] = useState<{
    status: 'pending' | 'scoring' | 'success' | 'skipped' | 'error';
    message?: string;
  }>({ status: 'pending' });
  const [aspectScores, setAspectScores] = useState<MatchAspectScores | undefined>(undefined);
  const [aspectStatus, setAspectStatus] = useState<{
    status: 'pending' | 'scoring' | 'success' | 'skipped' | 'error';
    message?: string;
  }>({ status: 'pending' });

  // Multi-stage progress tracking
  const [stageInfo, setStageInfo] = useState<StageInfo>({ stage: 'idle', message: '' });

  // Track if component is mounted to prevent state updates after unmount
  const isMounted = useRef(true);

  // AbortController for cancellation
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Fetch user identity on mount
  useEffect(() => {
    const loadUserIdentity = async () => {
      const identity = await db.userIdentity.get(1);
      if (isMounted.current) {
        setUserIdentity(identity);
        setUserContextLoaded(true);
      }
    };
    loadUserIdentity();
  }, []);

  const hasUserProfile = checkHasUserProfile(userIdentity);

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setFrames([]);
    setAnalysis(null);
    setErrorMessage(null);
  };

  // Auto-start analysis when file is selected
  useEffect(() => {
    if (file && !isProcessing && !analysis && !errorMessage) {
      startAnalysis();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  const cancelAnalysis = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsProcessing(false);
    setStageInfo({ stage: 'idle', message: 'Analysis cancelled' });
  };

  const startAnalysis = async () => {
    console.log("DEBUG: startAnalysis entry point reached");

    if (!file) {
      return;
    }

    try {
      console.log("DEBUG: Inside outer try block");

      // Create new abort controller for this analysis
      abortControllerRef.current = new AbortController();

      setIsProcessing(true);
      setAnalysis(null);
      setErrorMessage(null);
      setVirtueScores([]);
      setVirtueStatus({ status: 'pending' });
      setAspectScores(undefined);
      setAspectStatus({ status: 'pending' });
      setStageInfo({ stage: 'extracting', message: 'Extracting frames...', detail: 'Loading video...' });

      console.log("DEBUG: State initialized, starting frame extraction");

    try {
      console.log("Upload: Starting frame extraction...");
      const extractedImages = await extractFramesFromVideo(file, {
        intervalSeconds: 2,
        onMetadataLoaded: (info) => {
          if (isMounted.current) {
            console.log("Upload: Metadata loaded, expecting", info.totalFrames, "frames");
            setStageInfo({
              stage: 'extracting',
              message: 'Extracting frames...',
              detail: `Video loaded (${Math.round(info.duration)}s), capturing frames...`,
            });
          }
        },
        onProgress: (progress: FrameExtractionProgress) => {
          if (isMounted.current) {
            setStageInfo({
              stage: 'extracting',
              message: 'Extracting frames...',
              detail: `Frame ${progress.currentFrame} of ${progress.totalFrames}`,
            });
          }
        },
      });

      console.log("Upload: Frame extraction complete, got", extractedImages.length, "frames");

      // DEBUG: Check if this is causing the silent exit
      console.log("Upload: isMounted.current =", isMounted.current);
      if (!isMounted.current) {
        console.warn("Upload: EXITING EARLY - component unmounted during frame extraction!");
        // Don't return - continue anyway since we want to complete the analysis
        // The user is still on this page showing progress
      }
      setFrames(extractedImages);

      if (extractedImages.length === 0) {
        throw new Error("No frames could be extracted from video. Please try a different file.");
      }

      // Update to analyzing stage - sending to AI
      setStageInfo({
        stage: 'analyzing',
        message: 'Sending to AI...',
        detail: `Analyzing ${extractedImages.length} frames`,
      });

      // Pass user context for personalized analysis
      const userContext = buildUserContextForMatch(userIdentity);
      console.log("Upload: Calling AI with userContext =", userContext ? "available" : "undefined");

      // Use progressive analysis for better UX - shows basics quickly while deep analysis runs
      const result = await analyzeProfileProgressive(
        extractedImages,
        userContext,
        {
          signal: abortControllerRef.current?.signal,
          onBasicsReady: (basicResult: QuickBasicsResult) => {
            // Show quick results immediately while deep analysis continues
            if (isMounted.current) {
              setStageInfo({
                stage: 'analyzing',
                message: `Found ${basicResult.basics?.name || 'profile'}`,
                detail: 'Running deep analysis...',
              });
            }
          }
        }
      ) as ProfileAnalysis;

      console.log("Upload: AI analysis complete");
      console.log("Upload: isMounted.current (after AI) =", isMounted.current);
      if (!isMounted.current) {
        console.warn("Upload: Component unmounted during AI analysis - continuing anyway");
      }

      setAnalysis(result);
      setStageInfo({
        stage: 'analyzing',
        message: 'Analysis complete',
        detail: `Found ${result.basics?.name || 'profile'}`,
      });

      // Run virtue and aspect scoring in parallel for better performance
      // Determine which scoring operations can run
      const canScoreVirtues = userIdentity?.synthesis?.partner_virtues &&
                              userIdentity.synthesis.partner_virtues.length > 0;
      const canScoreAspects = userIdentity?.synthesis?.aspect_profile?.scores &&
                              userIdentity.synthesis.aspect_profile.scores.length > 0;

      // Set skip statuses immediately for operations that can't run
      if (!userIdentity?.synthesis) {
        if (isMounted.current) {
          setVirtueStatus({
            status: 'skipped',
            message: 'Create your profile and run synthesis to enable virtue matching'
          });
          setAspectStatus({
            status: 'skipped',
            message: 'Create your profile and run synthesis to enable 23 Aspects matching'
          });
        }
      } else {
        if (!canScoreVirtues) {
          if (isMounted.current) {
            setVirtueStatus({
              status: 'skipped',
              message: 'Re-run synthesis on your profile to generate partner virtues'
            });
          }
        }
        if (!canScoreAspects) {
          if (isMounted.current) {
            setAspectStatus({
              status: 'skipped',
              message: 'Re-run synthesis on your profile to generate aspect scores'
            });
          }
        }
      }

      // Set both to scoring state at the same time if they will run
      if (isMounted.current) {
        if (canScoreVirtues) setVirtueStatus({ status: 'scoring' });
        if (canScoreAspects) setAspectStatus({ status: 'scoring' });

        // Update stage info to show scoring phase
        if (canScoreVirtues || canScoreAspects) {
          setStageInfo({
            stage: 'scoring-virtues',
            message: 'Scoring compatibility...',
            detail: 'Analyzing virtues and aspects',
          });
        }
      }

      // Build promises for parallel execution
      const virtuePromise = canScoreVirtues
        ? (async () => {
            console.log("Scoring match against partner virtues...");
            const scores = await scoreMatchVirtues(result, userIdentity!.synthesis!.partner_virtues!);
            return { type: 'virtue' as const, scores };
          })()
        : null;

      const aspectPromise = canScoreAspects
        ? (async () => {
            console.log("Scoring match against 23 Aspects...");
            const scores = await scoreMatchAspects(result, userIdentity!.synthesis!.aspect_profile!);
            return { type: 'aspect' as const, scores };
          })()
        : null;

      // Run both scoring operations in parallel
      // Track which types are at which index for error handling
      const promiseTypes: ('virtue' | 'aspect')[] = [];
      const promises: Promise<
        { type: 'virtue'; scores: VirtueScore[] } | { type: 'aspect'; scores: MatchAspectScores }
      >[] = [];

      if (virtuePromise) {
        promiseTypes.push('virtue');
        promises.push(virtuePromise);
      }
      if (aspectPromise) {
        promiseTypes.push('aspect');
        promises.push(aspectPromise);
      }

      if (promises.length > 0) {
        const results = await Promise.allSettled(promises);

        console.log("Upload: Scoring complete, isMounted =", isMounted.current);
        if (!isMounted.current) {
          console.warn("Upload: Component unmounted during scoring - continuing anyway");
        }

        // Handle each result independently
        results.forEach((settledResult, index) => {
          const promiseType = promiseTypes[index];

          if (settledResult.status === 'fulfilled') {
            const { scores } = settledResult.value;
            if (promiseType === 'virtue') {
              const virtueResults = scores as VirtueScore[];
              setVirtueScores(virtueResults);
              setVirtueStatus({ status: 'success', message: `Scored ${virtueResults.length} virtues` });
              console.log("Virtue scores:", virtueResults);
            } else {
              const aspectResults = scores as MatchAspectScores;
              setAspectScores(aspectResults);
              setAspectStatus({ status: 'success', message: `Scored ${aspectResults.scores?.length || 0} aspects` });
              console.log("Aspect scores:", aspectResults);
            }
          } else {
            const error = settledResult.reason;
            console.error(`${promiseType} scoring failed:`, error);
            const errorMessage = error instanceof Error ? error.message : 'Scoring failed';

            if (promiseType === 'virtue') {
              setVirtueStatus({ status: 'error', message: errorMessage });
            } else {
              setAspectStatus({ status: 'error', message: errorMessage });
            }
          }
        });
      }

    } catch (error) {
      console.error("Process failed:", error);
      if (isMounted.current) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        // Don't show error if it was an abort
        if (errorMsg !== 'The user aborted a request.') {
          setErrorMessage(errorMsg);
          setStageInfo({ stage: 'error', message: 'Analysis failed', detail: errorMsg });
        }
      }
    } finally {
      abortControllerRef.current = null;
      if (isMounted.current) {
        setIsProcessing(false);
        // Set complete stage only if analysis succeeded
        if (analysis) {
          setStageInfo({ stage: 'complete', message: 'Analysis complete' });
        }
      }
    }
    } catch (outerError) {
      // OUTER catch - catches ANY error including those before frame extraction
      const errMsg = outerError instanceof Error ? outerError.message : String(outerError);
      const errStack = outerError instanceof Error ? outerError.stack : 'no stack';
      console.error("OUTER CATCH - Fatal error:", outerError);
      console.error("OUTER CATCH - Stack:", errStack);
      setErrorMessage("Fatal error: " + errMsg);
      setIsProcessing(false);
    }
  };



  const saveProfile = async () => {
    if (!analysis || frames.length === 0) return;

    setIsSaving(true);
    try {
      // 1. Determine the best thumbnail
      const bestIndex = analysis.meta?.best_photo_index ?? 1;
      const safeIndex = (bestIndex >= 0 && bestIndex < frames.length) ? bestIndex : 0;
      const thumbnailImage = frames[safeIndex];

      // 2. Add to database with compatibility data if available
      const profileId = await db.profiles.add({
        name: analysis.basics?.name || "Unknown Match",
        age: analysis.basics?.age || undefined,
        appName: analysis.meta?.app_name || "Unknown App",
        timestamp: new Date(),
        analysis: analysis,
        thumbnail: thumbnailImage,
        // Include compatibility if user context was used
        compatibility: analysis.compatibility || undefined,
        // Include virtue scores if available
        virtue_scores: virtueScores.length > 0 ? virtueScores : undefined,
        // Include 23 Aspects scores if available
        aspect_scores: aspectScores || undefined
      });

      // 3. Background compatibility scoring if enabled and not already scored
      if (userIdentity?.settings?.autoCompatibility) {
        runBackgroundCompatibilityScoring(profileId);
      }

      navigate('/');
    } catch (error) {
      alert("Failed to save profile: " + error);
      setIsSaving(false);
    }
  };

  // Background scoring - runs after save without blocking navigation
  const runBackgroundCompatibilityScoring = async (profileId: number) => {
    try {
      // Only run if we don't already have scores
      if (virtueScores.length > 0 && aspectScores) {
        return; // Already scored during analysis
      }

      const profile = await db.profiles.get(profileId);
      if (!profile) return;

      const matchAnalysis = profile.analysis as ProfileAnalysis;

      // Score virtues if user has partner_virtues and profile doesn't have scores
      if (
        userIdentity?.synthesis?.partner_virtues?.length &&
        !profile.virtue_scores?.length
      ) {
        const scores = await scoreMatchVirtues(matchAnalysis, userIdentity.synthesis.partner_virtues);
        await db.profiles.update(profileId, { virtue_scores: scores });
        console.log('Background virtue scoring complete:', scores.length, 'virtues');
      }

      // Score aspects if user has aspect_profile and profile doesn't have scores
      if (
        userIdentity?.synthesis?.aspect_profile?.scores?.length &&
        !profile.aspect_scores?.scores?.length
      ) {
        const scores = await scoreMatchAspects(matchAnalysis, userIdentity.synthesis.aspect_profile);
        await db.profiles.update(profileId, { aspect_scores: scores });
        console.log('Background aspect scoring complete:', scores.scores?.length, 'aspects');
      }
    } catch (error) {
      console.error('Background compatibility scoring failed:', error);
      // Don't alert - this is background work, errors are non-critical
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto pb-24">
      <div className="flex justify-between items-center mb-6">
        <Link to="/" className="text-sm text-slate-500 hover:text-blue-600">
          ← Back to Home
        </Link>
        {/* Debug button - TEMPORARY */}
        <button
          onClick={() => downloadConsoleLogs()}
          className="text-xs bg-slate-200 hover:bg-slate-300 text-slate-600 px-3 py-1 rounded flex items-center gap-1"
        >
          <Download size={12} /> Export Debug Logs
        </button>
      </div>

      <h1 className="text-3xl font-bold mb-6 text-slate-800">Upload Recording</h1>

      {/* Warning if no user profile for personalized analysis */}
      {userContextLoaded && !hasUserProfile && !analysis && (
        <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-lg flex items-start">
          <User className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0 text-amber-600" />
          <div>
            <p className="text-sm">
              For personalized compatibility insights,{' '}
              <Link to="/my-profile" className="font-bold underline hover:text-amber-900">
                create your profile first
              </Link>
              . You can still analyze matches without it.
            </p>
          </div>
        </div>
      )}

      {!analysis && (
        <div className="mb-8">
          <VideoUploader onFileSelect={handleFileSelect} />
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-start">
          <AlertCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-bold">Analysis Failed</h3>
            <p className="text-sm mt-1">{errorMessage}</p>
          </div>
        </div>
      )}

      {file && !analysis && (
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
          {isProcessing ? (
            <div className="space-y-4">
              {/* Progress indicator */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Loader2 className="animate-spin mr-3 text-blue-600" size={24} />
                  <div>
                    <p className="font-medium text-slate-800">{stageInfo.message}</p>
                    {stageInfo.detail && (
                      <p className="text-sm text-slate-500">{stageInfo.detail}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={cancelAnalysis}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Cancel analysis"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width:
                      stageInfo.stage === 'extracting' ? '25%' :
                      stageInfo.stage === 'analyzing' ? '50%' :
                      stageInfo.stage === 'scoring-virtues' || stageInfo.stage === 'scoring-aspects' ? '75%' :
                      '100%',
                  }}
                />
              </div>

              {/* Stage indicators */}
              <div className="flex justify-between text-xs text-slate-400">
                <span className={stageInfo.stage === 'extracting' ? 'text-blue-600 font-medium' : ''}>
                  Extract
                </span>
                <span className={stageInfo.stage === 'analyzing' ? 'text-blue-600 font-medium' : ''}>
                  Analyze
                </span>
                <span className={stageInfo.stage === 'scoring-virtues' || stageInfo.stage === 'scoring-aspects' ? 'text-blue-600 font-medium' : ''}>
                  Score
                </span>
                <span className={stageInfo.stage === 'complete' ? 'text-green-600 font-medium' : ''}>
                  Done
                </span>
              </div>

            </div>
          ) : (
            <button
              className="w-full bg-slate-900 text-white py-3 rounded-lg font-medium hover:bg-slate-800 transition-colors flex items-center justify-center disabled:opacity-50"
              onClick={startAnalysis}
            >
              Extract Frames & Analyze
            </button>
          )}
        </div>
      )}

      {/* Analysis Results Display */}
      {analysis && (
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6 animate-fade-in">
          <div className="flex justify-between items-start mb-4">
             <h3 className="text-2xl font-bold text-blue-900">
              {analysis.basics?.name || "Unknown Profile"} 
              {analysis.basics?.age && `, ${analysis.basics.age}`}
            </h3>
            <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center">
                <CheckCircle size={14} className="mr-1"/> Complete
            </div>
          </div>
          
          <p className="text-slate-700 mb-6">{analysis.overall_analysis?.summary}</p>

          {/* Virtue Scoring Status Feedback */}
          {virtueStatus.status === 'skipped' && (
            <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-lg flex items-start text-sm">
              <Info className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-amber-600" />
              <div>
                <p className="font-medium">Virtue scoring skipped</p>
                <p className="text-xs mt-1">{virtueStatus.message}</p>
                <Link to="/my-profile" className="text-xs font-bold underline hover:text-amber-900 mt-1 inline-block">
                  Go to My Profile →
                </Link>
              </div>
            </div>
          )}
          {virtueStatus.status === 'error' && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg flex items-start text-sm">
              <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Virtue scoring failed</p>
                <p className="text-xs mt-1">{virtueStatus.message}</p>
              </div>
            </div>
          )}
          {virtueStatus.status === 'success' && virtueScores.length > 0 && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg flex items-start text-sm">
              <CheckCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Virtue scores calculated</p>
                <p className="text-xs mt-1">{virtueStatus.message}</p>
              </div>
            </div>
          )}

          {/* 23 Aspects Status Feedback */}
          {aspectStatus.status === 'skipped' && (
            <div className="mb-4 bg-violet-50 border border-violet-200 text-violet-800 p-3 rounded-lg flex items-start text-sm">
              <Info className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-violet-600" />
              <div>
                <p className="font-medium">23 Aspects scoring skipped</p>
                <p className="text-xs mt-1">{aspectStatus.message}</p>
                <Link to="/my-profile" className="text-xs font-bold underline hover:text-violet-900 mt-1 inline-block">
                  Go to My Profile →
                </Link>
              </div>
            </div>
          )}
          {aspectStatus.status === 'error' && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg flex items-start text-sm">
              <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">23 Aspects scoring failed</p>
                <p className="text-xs mt-1">{aspectStatus.message}</p>
              </div>
            </div>
          )}
          {aspectStatus.status === 'success' && aspectScores && (
            <div className="mb-4 bg-violet-50 border border-violet-200 text-violet-700 p-3 rounded-lg flex items-start text-sm">
              <CheckCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">23 Aspects compatibility calculated</p>
                <p className="text-xs mt-1">{aspectStatus.message}</p>
              </div>
            </div>
          )}

          <button 
            onClick={saveProfile}
            disabled={isSaving}
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-colors shadow-md flex items-center justify-center"
          >
            {isSaving ? <Loader2 className="animate-spin" /> : <><Save className="mr-2" /> Save to Gallery</>}
          </button>
        </div>
      )}
    </div>
  );
}
// File length: ~3500 chars