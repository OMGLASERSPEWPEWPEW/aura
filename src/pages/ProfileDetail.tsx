// src/pages/ProfileDetail.tsx
import { useParams, Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import type { UserIdentity, DateSuggestion, ZodiacCompatibility } from '../lib/db';
import { getDateSuggestions, getZodiacCompatibility, regenerateOpeners, regeneratePromptOpener, searchLocalEvents } from '../lib/ai';
import type { UserContextForMatch } from '../lib/ai';
import { getWeatherByLocation, type WeatherForecast } from '../lib/weather';
import { ArrowLeft, MapPin, Briefcase, GraduationCap, AlertTriangle, Target, Zap, Eye, Heart, Shield, MessageCircle, Send, Copy, Check, Star, AlertCircle, Calendar, Loader2, User, RefreshCw, Sparkles, Cloud, Sun } from 'lucide-react';
import { Download } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function ProfileDetail() {
  const { id } = useParams();
  const profile = useLiveQuery(() => db.profiles.get(Number(id)), [id]);

  // State for copy feedback - must be before any conditional returns (React hooks rule)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isLoadingDates, setIsLoadingDates] = useState(false);
  const [dateSuggestions, setDateSuggestions] = useState<DateSuggestion[] | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);
  const [userIdentity, setUserIdentity] = useState<UserIdentity | undefined>(undefined);

  // Zodiac compatibility state
  const [zodiacCompatibility, setZodiacCompatibility] = useState<ZodiacCompatibility | null>(null);
  const [isLoadingZodiac, setIsLoadingZodiac] = useState(false);
  const [zodiacError, setZodiacError] = useState<string | null>(null);

  // Openers refresh state
  const [isRefreshingOpeners, setIsRefreshingOpeners] = useState(false);
  const [refreshingPromptIndex, setRefreshingPromptIndex] = useState<number | null>(null);

  // Date picker and weather state
  const [targetDate, setTargetDate] = useState<string>('');
  const [weatherForecast, setWeatherForecast] = useState<WeatherForecast | null>(null);
  const [localEvents, setLocalEvents] = useState<string[]>([]);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);

  // Fetch user identity on mount
  useEffect(() => {
    const loadUserIdentity = async () => {
      const identity = await db.userIdentity.get(1);
      setUserIdentity(identity);
    };
    loadUserIdentity();
  }, []);

  // Load existing date suggestions from profile
  useEffect(() => {
    if (profile?.date_suggestions) {
      setDateSuggestions(profile.date_suggestions.ideas);
    }
  }, [profile]);

  // Load existing zodiac compatibility from profile
  useEffect(() => {
    if (profile?.zodiac_compatibility) {
      setZodiacCompatibility(profile.zodiac_compatibility);
    }
  }, [profile]);

  const hasUserProfile = userIdentity?.synthesis !== undefined;
  const userZodiac = userIdentity?.manualEntry?.zodiac_sign;
  const matchZodiac = profile?.analysis?.basics?.zodiac_sign;

  // Build user context for personalized AI calls
  const buildUserContext = (): UserContextForMatch | undefined => {
    if (!userIdentity?.synthesis) return undefined;
    const synthesis = userIdentity.synthesis;
    return {
      goal_type: userIdentity.datingGoals?.type,
      archetype_summary: synthesis.psychological_profile?.archetype_summary,
      communication_style: synthesis.behavioral_insights?.communication_style,
      what_to_look_for: synthesis.dating_strategy?.what_to_look_for,
      what_to_avoid: synthesis.dating_strategy?.what_to_avoid,
      opener_style_recommendations: synthesis.dating_strategy?.opener_style_recommendations,
      location: userIdentity.manualEntry?.location
    };
  };

  if (!profile) return <div className="p-8 text-center">Loading Profile...</div>;

  // Safe access with fallback for the "raw" error case
  const analysis = profile.analysis || {};
  
  // If we have the "raw" error, try to parse it manually here to show SOMETHING
  let displayData = analysis;
  if (analysis.raw && typeof analysis.raw === 'string') {
      try {
          // Try to clean and parse the raw string just for display
          const clean = analysis.raw.replace(/```json\n?|```/g, '').trim();
          displayData = JSON.parse(clean);
      } catch (e) {
          // If it still fails, just keep the raw
      }
  }

  const basics = displayData.basics || {};
  const photos = displayData.photos || [];
  const prompts = displayData.prompts || [];
  const psych = displayData.psychological_profile || {};
  const subtext = psych.subtext_analysis || {};
  const openers = displayData.recommended_openers || [];
  // Fallback for old data format
  const overall = displayData.overall_analysis || {};

  const handleCopyOpener = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Handle zodiac compatibility generation
  const handleGenerateZodiacCompatibility = async () => {
    if (!userZodiac || !matchZodiac || !profile) return;

    setIsLoadingZodiac(true);
    setZodiacError(null);

    try {
      const userArchetype = userIdentity?.synthesis?.psychological_profile?.archetype_summary;
      const matchArchetype = profile.analysis?.psychological_profile?.archetype_summary;

      const compatibility = await getZodiacCompatibility(
        userZodiac,
        matchZodiac,
        userArchetype,
        matchArchetype
      );

      setZodiacCompatibility(compatibility);

      // Save to database
      await db.profiles.update(profile.id, {
        zodiac_compatibility: compatibility
      });
    } catch (error: any) {
      console.error("Zodiac compatibility error:", error);
      setZodiacError(error.message || "Failed to generate zodiac compatibility");
    } finally {
      setIsLoadingZodiac(false);
    }
  };

  // Handle openers refresh
  const handleRefreshOpeners = async () => {
    if (!profile) return;

    setIsRefreshingOpeners(true);

    try {
      const userContext = buildUserContext();
      const newOpeners = await regenerateOpeners(profile.analysis, userContext);

      // Update the profile in database
      const updatedAnalysis = {
        ...profile.analysis,
        recommended_openers: newOpeners
      };

      await db.profiles.update(profile.id, { analysis: updatedAnalysis });
    } catch (error: any) {
      console.error("Refresh openers error:", error);
    } finally {
      setIsRefreshingOpeners(false);
    }
  };

  // Handle per-prompt opener refresh
  const handleRefreshPromptOpener = async (promptIndex: number) => {
    if (!profile) return;

    setRefreshingPromptIndex(promptIndex);

    try {
      const prompt = profile.analysis.prompts[promptIndex];
      const psych = profile.analysis.psychological_profile || {};

      const profileContext = {
        name: profile.analysis.basics?.name || profile.name,
        archetype_summary: psych.archetype_summary || '',
        vulnerability_indicators: psych.subtext_analysis?.vulnerability_indicators || ''
      };

      const userContext = buildUserContext();
      const newOpener = await regeneratePromptOpener(prompt, profileContext, userContext);

      // Update the specific prompt's opener
      const updatedPrompts = [...profile.analysis.prompts];
      updatedPrompts[promptIndex] = {
        ...updatedPrompts[promptIndex],
        suggested_opener: newOpener
      };

      const updatedAnalysis = {
        ...profile.analysis,
        prompts: updatedPrompts
      };

      await db.profiles.update(profile.id, { analysis: updatedAnalysis });
    } catch (error: any) {
      console.error("Refresh prompt opener error:", error);
    } finally {
      setRefreshingPromptIndex(null);
    }
  };

  // Handle date selection and weather fetch
  const handleDateSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateStr = e.target.value;
    setTargetDate(dateStr);

    if (!dateStr) {
      setWeatherForecast(null);
      setLocalEvents([]);
      return;
    }

    const selectedDate = new Date(dateStr + 'T12:00:00');
    const location = basics.location || userIdentity?.manualEntry?.location;

    if (!location) return;

    setIsLoadingWeather(true);

    try {
      // Fetch weather and events in parallel
      const [weather, events] = await Promise.all([
        getWeatherByLocation(location, selectedDate),
        searchLocalEvents(
          location,
          selectedDate,
          profile?.analysis?.photos?.map((p: any) => p.vibe).filter(Boolean) || [],
          userIdentity?.manualEntry?.interests
        )
      ]);

      setWeatherForecast(weather);
      setLocalEvents(events);
    } catch (error) {
      console.error("Weather/events fetch error:", error);
    } finally {
      setIsLoadingWeather(false);
    }
  };

  // Enhanced date ideas handler with weather and events
  const handleGetDateIdeasEnhanced = async () => {
    if (!profile) return;

    setIsLoadingDates(true);
    setDateError(null);

    try {
      const matchLocation = basics.location || 'Unknown';
      const userLocation = userIdentity?.manualEntry?.location || 'Unknown';
      const matchInterests = profile.analysis?.photos?.map((p: any) => p.vibe).filter(Boolean) || [];
      const userGoal = userIdentity?.datingGoals?.type || 'exploring';

      const suggestions = await getDateSuggestions(
        matchLocation,
        userLocation,
        matchInterests,
        userGoal,
        {
          targetDate: targetDate ? new Date(targetDate + 'T12:00:00') : undefined,
          weatherForecast: weatherForecast || undefined,
          localEvents: localEvents.length > 0 ? localEvents : undefined
        }
      );

      setDateSuggestions(suggestions);

      // Save to database with weather info
      await db.profiles.update(profile.id, {
        date_suggestions: {
          ideas: suggestions,
          searched_at: new Date(),
          target_date: targetDate ? new Date(targetDate) : undefined,
          weather_forecast: weatherForecast ? {
            temp_high: weatherForecast.temp_high,
            temp_low: weatherForecast.temp_low,
            condition: weatherForecast.condition
          } : undefined,
          local_events: localEvents
        }
      });
    } catch (error: any) {
      console.error("Date suggestions error:", error);
      setDateError(error.message || "Failed to get date ideas");
    } finally {
      setIsLoadingDates(false);
    }
  };

  const handleDownload = () => {
      // Create a blob from the JSON data
      const jsonString = JSON.stringify(profile, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      
      // Create a temporary link and click it
      const link = document.createElement('a');
      link.href = url;
      link.download = `${basics.name || "profile"}_aura_data.json`;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    };

  return (
    <div className="pb-24 bg-white min-h-screen">
      {/* Header Image */}
      <div className="relative h-64 bg-slate-900">
        {profile.thumbnail ? (
          <img src={profile.thumbnail} className="w-full h-full object-cover opacity-80" alt="Cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-500">
             <div className="text-center">
               <AlertTriangle className="mx-auto mb-2" />
               <p>No Image Saved</p>
             </div>
          </div>
        )}
        
        <Link to="/" className="absolute top-6 left-6 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center text-slate-900 shadow-md z-10">
          <ArrowLeft size={20} />
        </Link>
        
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent text-white">
          <h1 className="text-3xl font-bold">{basics.name || "Unknown Name"}</h1>
          <p className="opacity-90">
            {basics.age ? `${basics.age} • ` : ''} 
            {basics.location || "Location Unknown"}
          </p>
        </div>
      </div>

      <div className="p-6 max-w-lg mx-auto space-y-8">
        {/* Quick Stats */}
        <div className="flex flex-wrap gap-3 text-sm text-slate-600">
          {basics.job && <div className="flex items-center gap-1 bg-slate-100 px-3 py-1 rounded-full"><Briefcase size={14}/> {basics.job}</div>}
          {basics.school && <div className="flex items-center gap-1 bg-slate-100 px-3 py-1 rounded-full"><GraduationCap size={14}/> {basics.school}</div>}
          {basics.hometown && <div className="flex items-center gap-1 bg-slate-100 px-3 py-1 rounded-full"><MapPin size={14}/> {basics.hometown}</div>}
        </div>

        {/* Warning if no user profile */}
        {!hasUserProfile && !profile.compatibility && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-lg flex items-start">
            <User className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0 text-amber-600" />
            <div>
              <p className="text-sm">
                <Link to="/my-profile" className="font-bold underline hover:text-amber-900">
                  Create your profile
                </Link>
                {' '}for personalized compatibility insights.
              </p>
            </div>
          </div>
        )}

        {/* Compatibility Card */}
        {profile.compatibility && (
          <section className="bg-gradient-to-br from-emerald-50 to-teal-50 p-5 rounded-xl border border-emerald-200">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Star size={18} className="text-emerald-600" /> Compatibility
              </h2>
              <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full font-bold text-lg ${
                profile.compatibility.score >= 7
                  ? 'bg-emerald-200 text-emerald-800'
                  : profile.compatibility.score >= 4
                  ? 'bg-amber-200 text-amber-800'
                  : 'bg-red-200 text-red-800'
              }`}>
                {profile.compatibility.score}/10
              </div>
            </div>

            <p className="text-emerald-900 font-medium mb-4">{profile.compatibility.summary}</p>

            {profile.compatibility.goal_alignment && (
              <p className="text-sm text-emerald-700 mb-4 italic">
                {profile.compatibility.goal_alignment}
              </p>
            )}

            {profile.compatibility.strengths && profile.compatibility.strengths.length > 0 && (
              <div className="mb-3">
                <h4 className="text-sm font-bold text-emerald-800 mb-2 flex items-center gap-1">
                  <Check size={14} /> Why this works for you:
                </h4>
                <ul className="space-y-1">
                  {profile.compatibility.strengths.map((s: string, i: number) => (
                    <li key={i} className="text-sm text-emerald-700 flex items-start gap-2">
                      <span className="text-emerald-500 mt-1">•</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {profile.compatibility.concerns && profile.compatibility.concerns.length > 0 && (
              <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                <h4 className="text-sm font-bold text-amber-800 mb-2 flex items-center gap-1">
                  <AlertCircle size={14} /> Watch out for:
                </h4>
                <ul className="space-y-1">
                  {profile.compatibility.concerns.map((c: string, i: number) => (
                    <li key={i} className="text-sm text-amber-700 flex items-start gap-2">
                      <span className="text-amber-500 mt-1">•</span>
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {/* Zodiac Compatibility Section */}
        {userZodiac && matchZodiac && (
          <section className="bg-gradient-to-br from-indigo-50 to-purple-50 p-5 rounded-xl border border-indigo-200">
            <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Sparkles size={18} className="text-indigo-600" /> Zodiac Compatibility
            </h2>

            <p className="text-sm text-indigo-700 mb-4">
              {userZodiac.charAt(0).toUpperCase() + userZodiac.slice(1)} + {matchZodiac.charAt(0).toUpperCase() + matchZodiac.slice(1)}
            </p>

            {!zodiacCompatibility && !isLoadingZodiac && (
              <button
                onClick={handleGenerateZodiacCompatibility}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center"
              >
                <Sparkles className="mr-2" size={18} />
                Generate Compatibility
              </button>
            )}

            {isLoadingZodiac && (
              <div className="flex items-center justify-center py-6 text-indigo-600">
                <Loader2 className="animate-spin mr-2" />
                <span>Reading the stars...</span>
              </div>
            )}

            {zodiacError && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">
                {zodiacError}
              </div>
            )}

            {zodiacCompatibility && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-indigo-800">Cosmic Score</span>
                  <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full font-bold text-lg ${
                    zodiacCompatibility.overall_score >= 7
                      ? 'bg-indigo-200 text-indigo-800'
                      : zodiacCompatibility.overall_score >= 4
                      ? 'bg-amber-200 text-amber-800'
                      : 'bg-red-200 text-red-800'
                  }`}>
                    {zodiacCompatibility.overall_score}/10
                  </div>
                </div>

                <p className="text-indigo-900">{zodiacCompatibility.summary}</p>

                {zodiacCompatibility.strengths && zodiacCompatibility.strengths.length > 0 && (
                  <div>
                    <h4 className="text-sm font-bold text-indigo-800 mb-2 flex items-center gap-1">
                      <Check size={14} /> Cosmic Strengths
                    </h4>
                    <ul className="space-y-1">
                      {zodiacCompatibility.strengths.map((s, i) => (
                        <li key={i} className="text-sm text-indigo-700 flex items-start gap-2">
                          <span className="text-indigo-400 mt-1">•</span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {zodiacCompatibility.challenges && zodiacCompatibility.challenges.length > 0 && (
                  <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                    <h4 className="text-sm font-bold text-amber-800 mb-2 flex items-center gap-1">
                      <AlertCircle size={14} /> Potential Challenges
                    </h4>
                    <ul className="space-y-1">
                      {zodiacCompatibility.challenges.map((c, i) => (
                        <li key={i} className="text-sm text-amber-700 flex items-start gap-2">
                          <span className="text-amber-400 mt-1">•</span>
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {zodiacCompatibility.advice && (
                  <div className="bg-indigo-100 p-3 rounded-lg">
                    <p className="text-sm text-indigo-800 italic">
                      <strong>Advice:</strong> {zodiacCompatibility.advice}
                    </p>
                  </div>
                )}

                <button
                  onClick={handleGenerateZodiacCompatibility}
                  disabled={isLoadingZodiac}
                  className="w-full text-indigo-600 py-2 text-sm font-medium hover:text-indigo-800 transition-colors flex items-center justify-center gap-1"
                >
                  <RefreshCw size={14} />
                  Regenerate
                </button>
              </div>
            )}
          </section>
        )}

        {/* Zodiac hint if only one sign is available */}
        {(!userZodiac || !matchZodiac) && (userZodiac || matchZodiac) && (
          <div className="bg-indigo-50 border border-indigo-200 text-indigo-800 p-4 rounded-lg flex items-start">
            <Sparkles className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0 text-indigo-600" />
            <div className="text-sm">
              {!userZodiac ? (
                <p>
                  <Link to="/my-profile" className="font-bold underline hover:text-indigo-900">
                    Add your zodiac sign
                  </Link>
                  {' '}to see cosmic compatibility with {matchZodiac ? matchZodiac.charAt(0).toUpperCase() + matchZodiac.slice(1) : 'this match'}.
                </p>
              ) : (
                <p>
                  This match's zodiac sign wasn't detected from their profile.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Date Ideas Section */}
        <section className="bg-gradient-to-br from-violet-50 to-purple-50 p-5 rounded-xl border border-violet-200">
          <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Calendar size={18} className="text-violet-600" /> Date Ideas
          </h2>

          {/* Date Picker */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Planning for a specific date? (optional)
            </label>
            <input
              type="date"
              value={targetDate}
              onChange={handleDateSelect}
              min={new Date().toISOString().split('T')[0]}
              max={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
              className="w-full p-2.5 border border-violet-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white"
            />
          </div>

          {/* Weather Display */}
          {isLoadingWeather && (
            <div className="flex items-center gap-2 text-violet-600 text-sm mb-3">
              <Loader2 className="animate-spin" size={14} />
              <span>Fetching weather...</span>
            </div>
          )}

          {weatherForecast && !isLoadingWeather && (
            <div className="bg-blue-50 p-3 rounded-lg mb-4 flex items-center gap-3">
              {weatherForecast.condition.toLowerCase().includes('clear') || weatherForecast.condition.toLowerCase().includes('sunny') ? (
                <Sun className="text-amber-500" size={24} />
              ) : (
                <Cloud className="text-blue-500" size={24} />
              )}
              <div>
                <p className="font-medium text-slate-800">
                  {weatherForecast.temp_high}F / {weatherForecast.temp_low}F
                </p>
                <p className="text-sm text-slate-600">{weatherForecast.condition}</p>
                {weatherForecast.precipitation_probability > 20 && (
                  <p className="text-xs text-blue-600">{weatherForecast.precipitation_probability}% chance of rain</p>
                )}
              </div>
            </div>
          )}

          {/* Local Events */}
          {localEvents.length > 0 && (
            <div className="bg-purple-50 p-3 rounded-lg mb-4">
              <p className="text-sm font-medium text-purple-800 mb-2">Possible local events:</p>
              <ul className="text-sm text-purple-700 space-y-1">
                {localEvents.slice(0, 3).map((event, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-purple-400">•</span>
                    {event}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!dateSuggestions && !isLoadingDates && (
            <button
              onClick={handleGetDateIdeasEnhanced}
              className="w-full bg-violet-600 text-white py-3 rounded-lg font-medium hover:bg-violet-700 transition-colors flex items-center justify-center"
            >
              <Calendar className="mr-2" size={18} />
              Get Date Ideas
            </button>
          )}

          {isLoadingDates && (
            <div className="flex items-center justify-center py-6 text-violet-600">
              <Loader2 className="animate-spin mr-2" />
              <span>Finding perfect date spots...</span>
            </div>
          )}

          {dateError && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">
              {dateError}
            </div>
          )}

          {dateSuggestions && dateSuggestions.length > 0 && (
            <div className="space-y-3">
              {dateSuggestions.map((idea, i) => (
                <div key={i} className="bg-white p-4 rounded-lg shadow-sm border border-violet-100">
                  <div className="flex items-start justify-between mb-1">
                    <h4 className="font-bold text-slate-900">{idea.name}</h4>
                    <div className="flex gap-1">
                      {idea.weather_appropriate && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                          Weather-friendly
                        </span>
                      )}
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                        idea.type === 'coffee' ? 'bg-amber-100 text-amber-700' :
                        idea.type === 'dinner' ? 'bg-rose-100 text-rose-700' :
                        idea.type === 'drinks' ? 'bg-purple-100 text-purple-700' :
                        idea.type === 'outdoor' ? 'bg-green-100 text-green-700' :
                        idea.type === 'cultural' ? 'bg-blue-100 text-blue-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {idea.type}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 flex items-center gap-1 mb-2">
                    <MapPin size={12} /> {idea.location}
                  </p>
                  <p className="text-sm text-violet-700 italic">{idea.why_good_fit}</p>
                  {idea.weather_note && (
                    <p className="text-xs text-blue-600 mt-2 flex items-center gap-1">
                      <Cloud size={12} /> {idea.weather_note}
                    </p>
                  )}
                  {idea.event_tie_in && (
                    <p className="text-xs text-purple-600 mt-1 flex items-center gap-1">
                      <Star size={12} /> {idea.event_tie_in}
                    </p>
                  )}
                </div>
              ))}
              <button
                onClick={handleGetDateIdeasEnhanced}
                disabled={isLoadingDates}
                className="w-full text-violet-600 py-2 text-sm font-medium hover:text-violet-800 transition-colors flex items-center justify-center gap-1"
              >
                <RefreshCw size={14} />
                Refresh Ideas
              </button>
            </div>
          )}
        </section>

        {/* Recommended Openers */}
        {openers.length > 0 && (
          <section className="bg-gradient-to-br from-pink-50 to-purple-50 p-4 rounded-xl border border-pink-200">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Send size={18} className="text-pink-600" /> Recommended Openers
              </h2>
              <button
                onClick={handleRefreshOpeners}
                disabled={isRefreshingOpeners}
                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-pink-600 hover:text-pink-800 hover:bg-pink-100 rounded-lg transition-colors disabled:opacity-50"
              >
                {isRefreshingOpeners ? (
                  <Loader2 className="animate-spin" size={14} />
                ) : (
                  <RefreshCw size={14} />
                )}
                Refresh
              </button>
            </div>
            <div className="space-y-3">
              {openers.map((opener: any, i: number) => (
                <div key={i} className="bg-white p-3 rounded-lg shadow-sm border border-pink-100">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${opener.type === 'like_comment' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                          {opener.type === 'like_comment' ? 'Like Comment' : 'Match Opener'}
                        </span>
                        <span className="text-xs text-purple-600 font-medium">{opener.tactic}</span>
                      </div>
                      <p className="text-sm text-slate-800 font-medium mb-1">"{opener.message}"</p>
                      <p className="text-xs text-slate-500 italic">{opener.why_it_works}</p>
                    </div>
                    <button
                      onClick={() => handleCopyOpener(opener.message, i)}
                      className="flex-shrink-0 p-2 hover:bg-pink-100 rounded-lg transition-colors"
                      title="Copy to clipboard"
                    >
                      {copiedIndex === i ? (
                        <Check size={16} className="text-green-600" />
                      ) : (
                        <Copy size={16} className="text-slate-400" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Photo Analysis (Compact) */}
        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-3">Photo Breakdown</h2>
          <div className="space-y-2">
            {photos.length > 0 ? photos.map((photo: any, i: number) => (
              <div key={i} className="flex items-start gap-3 bg-slate-50 p-3 rounded-lg">
                <span className="text-xs font-bold text-slate-400 mt-0.5">{i+1}</span>
                <div className="flex-1">
                  <span className="inline-block bg-purple-100 text-purple-800 text-xs font-bold px-2 py-0.5 rounded mr-2">{photo.vibe}</span>
                  <span className="text-sm text-slate-600">{photo.subtext}</span>
                </div>
              </div>
            )) : <p className="text-slate-500 italic">No photo analysis found.</p>}
          </div>
        </section>

        {/* Archetype Summary */}
        {psych.archetype_summary && (
          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Eye size={18} className="text-purple-600" /> Psychological Read
            </h2>
            <div className="bg-purple-50 p-4 rounded-xl text-purple-900 border border-purple-100 text-sm leading-relaxed">
              {psych.archetype_summary}
            </div>
          </section>
        )}

        {/* Agendas */}
        {psych.agendas && psych.agendas.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Target size={18} className="text-blue-600" /> What They Want (Agendas)
            </h2>
            <div className="space-y-3">
              {psych.agendas.map((agenda: any, i: number) => (
                <div key={i} className={`p-3 rounded-lg border-l-4 ${agenda.priority === 'primary' ? 'bg-blue-50 border-blue-500' : 'bg-slate-50 border-slate-300'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-bold uppercase ${agenda.priority === 'primary' ? 'text-blue-600' : 'text-slate-500'}`}>
                      {agenda.priority}
                    </span>
                    <span className="text-sm font-medium text-slate-800">{agenda.type}</span>
                  </div>
                  <p className="text-sm text-slate-600">{agenda.evidence}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Tactics */}
        {(psych.presentation_tactics || psych.predicted_tactics) && (
          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Zap size={18} className="text-amber-600" /> How They Operate (Tactics)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {psych.presentation_tactics && (
                <div className="bg-amber-50 p-3 rounded-lg">
                  <h4 className="font-bold text-amber-800 text-sm mb-2">In Their Profile</h4>
                  <div className="flex flex-wrap gap-1">
                    {psych.presentation_tactics.map((t: string, i: number) => (
                      <span key={i} className="bg-amber-200 text-amber-900 text-xs font-medium px-2 py-1 rounded">{t}</span>
                    ))}
                  </div>
                </div>
              )}
              {psych.predicted_tactics && (
                <div className="bg-orange-50 p-3 rounded-lg">
                  <h4 className="font-bold text-orange-800 text-sm mb-2">On Dates (Predicted)</h4>
                  <div className="flex flex-wrap gap-1">
                    {psych.predicted_tactics.map((t: string, i: number) => (
                      <span key={i} className="bg-orange-200 text-orange-900 text-xs font-medium px-2 py-1 rounded">{t}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Deep Subtext Analysis */}
        {(subtext.sexual_signaling || subtext.power_dynamics || subtext.vulnerability_indicators || subtext.disconnect) && (
          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
              <MessageCircle size={18} className="text-rose-600" /> Deep Subtext
            </h2>
            <div className="space-y-3">
              {subtext.sexual_signaling && (
                <div className="bg-rose-50 p-3 rounded-lg border-l-4 border-rose-400">
                  <h4 className="font-bold text-rose-800 text-xs uppercase mb-1 flex items-center gap-1">
                    <Heart size={12} /> Sexual Signaling
                  </h4>
                  <p className="text-sm text-rose-900">{subtext.sexual_signaling}</p>
                </div>
              )}
              {subtext.power_dynamics && (
                <div className="bg-indigo-50 p-3 rounded-lg border-l-4 border-indigo-400">
                  <h4 className="font-bold text-indigo-800 text-xs uppercase mb-1 flex items-center gap-1">
                    <Zap size={12} /> Power Dynamics
                  </h4>
                  <p className="text-sm text-indigo-900">{subtext.power_dynamics}</p>
                </div>
              )}
              {subtext.vulnerability_indicators && (
                <div className="bg-teal-50 p-3 rounded-lg border-l-4 border-teal-400">
                  <h4 className="font-bold text-teal-800 text-xs uppercase mb-1 flex items-center gap-1">
                    <Shield size={12} /> Vulnerability & Wounds
                  </h4>
                  <p className="text-sm text-teal-900">{subtext.vulnerability_indicators}</p>
                </div>
              )}
              {subtext.disconnect && (
                <div className="bg-slate-100 p-3 rounded-lg border-l-4 border-slate-400">
                  <h4 className="font-bold text-slate-700 text-xs uppercase mb-1">Text vs. Subtext</h4>
                  <p className="text-sm text-slate-700">{subtext.disconnect}</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Prompts Analysis */}
        {prompts.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">Prompt Reveals</h2>
            <div className="space-y-3">
              {prompts.map((prompt: any, i: number) => (
                <div key={i} className="bg-slate-50 p-3 rounded-lg">
                  <p className="text-xs text-slate-500 font-medium mb-1">{prompt.question}</p>
                  <p className="text-sm text-slate-800 font-medium mb-2">"{prompt.answer}"</p>
                  <p className="text-xs text-slate-600 italic border-t border-slate-200 pt-2">{prompt.analysis}</p>

                  {/* Per-Prompt Opener */}
                  {prompt.suggested_opener && (
                    <div className="mt-3 bg-gradient-to-r from-pink-50 to-purple-50 p-3 rounded-lg border border-pink-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-purple-600">{prompt.suggested_opener.tactic}</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleCopyOpener(prompt.suggested_opener.message, 100 + i)}
                            className="p-1 hover:bg-pink-100 rounded transition-colors"
                            title="Copy to clipboard"
                          >
                            {copiedIndex === 100 + i ? (
                              <Check size={14} className="text-green-600" />
                            ) : (
                              <Copy size={14} className="text-slate-400" />
                            )}
                          </button>
                          <button
                            onClick={() => handleRefreshPromptOpener(i)}
                            disabled={refreshingPromptIndex === i}
                            className="p-1 hover:bg-pink-100 rounded transition-colors disabled:opacity-50"
                            title="Refresh opener"
                          >
                            {refreshingPromptIndex === i ? (
                              <Loader2 size={14} className="animate-spin text-pink-600" />
                            ) : (
                              <RefreshCw size={14} className="text-slate-400" />
                            )}
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-slate-800 font-medium mb-1">"{prompt.suggested_opener.message}"</p>
                      <p className="text-xs text-slate-500 italic">{prompt.suggested_opener.why_it_works}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Legacy Fallback for old data */}
        {!psych.archetype_summary && overall.summary && (
          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">Vibe Check (Legacy)</h2>
            <div className="bg-blue-50 p-4 rounded-xl text-blue-900 border border-blue-100">
              {overall.summary}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="bg-green-50 p-3 rounded-lg">
                <h4 className="font-bold text-green-800 text-sm mb-1">Green Flags</h4>
                <ul className="text-xs text-green-700 list-disc list-inside">
                  {overall.green_flags?.map((f:string, i:number) => <li key={i}>{f}</li>) || <li>None listed</li>}
                </ul>
              </div>
              <div className="bg-red-50 p-3 rounded-lg">
                <h4 className="font-bold text-red-800 text-sm mb-1">Red Flags</h4>
                <ul className="text-xs text-red-700 list-disc list-inside">
                  {overall.red_flags?.map((f:string, i:number) => <li key={i}>{f}</li>) || <li>None listed</li>}
                </ul>
              </div>
            </div>
          </section>
        )}

        {/* --- DEBUG SECTION --- */}
        <div className="mt-12 bg-slate-900 rounded-lg overflow-hidden">
            <div className="flex justify-between items-center p-3 border-b border-slate-800">
                <span className="text-slate-400 font-mono text-sm">🔧 Database Entry</span>
                <button 
                  onClick={handleDownload}
                  className="text-xs bg-blue-600 text-white px-3 py-1 rounded flex items-center hover:bg-blue-500 font-bold"
                >
                  <Download size={14} className="mr-1" />
                  Download JSON
                </button>
            </div>
            <pre className="p-4 text-xs text-green-400 overflow-x-auto whitespace-pre-wrap font-mono h-48">
                {JSON.stringify(profile, null, 2)}
            </pre>
        </div>
      </div>
    </div>
  );
}
// File length: ~4800 chars