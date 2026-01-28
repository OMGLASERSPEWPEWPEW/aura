// src/hooks/useDateIdeas.ts
import { useState, useEffect, useCallback } from 'react';
import { getDateSuggestions, searchLocalEvents } from '../lib/ai';
import { getWeatherByLocation, type WeatherForecast } from '../lib/weather';
import { db } from '../lib/db';
import type { Profile, DateSuggestion, UserIdentity } from '../lib/db';
import { getUserLocation, getUserInterests, getUserDatingGoal } from '../lib/utils';
import { getMatchLocation, getMatchInterests, extractAnalysisFields } from '../lib/utils/profileHelpers';
import { AuraError, ensureAuraError } from '../lib/errors';
import { useErrorToast } from '../contexts/ToastContext';

interface UseDateIdeasReturn {
  suggestions: DateSuggestion[] | null;
  targetDate: string;
  setTargetDate: (date: string) => void;
  weatherForecast: WeatherForecast | null;
  localEvents: string[];
  isLoadingWeather: boolean;
  isLoadingDates: boolean;
  error: AuraError | null;
  handleDateSelect: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  generate: () => Promise<void>;
}

/**
 * Hook for managing date ideas, weather, and local events.
 */
export function useDateIdeas(
  profile: Profile | undefined,
  userIdentity: UserIdentity | undefined
): UseDateIdeasReturn {
  const [suggestions, setSuggestions] = useState<DateSuggestion[] | null>(null);
  const [targetDate, setTargetDate] = useState<string>('');
  const [weatherForecast, setWeatherForecast] = useState<WeatherForecast | null>(null);
  const [localEvents, setLocalEvents] = useState<string[]>([]);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const [isLoadingDates, setIsLoadingDates] = useState(false);
  const [error, setError] = useState<AuraError | null>(null);
  const showError = useErrorToast();

  // Load existing date suggestions from profile
  useEffect(() => {
    if (profile?.date_suggestions) {
      setSuggestions(profile.date_suggestions.ideas);
    }
  }, [profile]);

  // Handle date selection and fetch weather/events
  const handleDateSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const dateStr = e.target.value;
      setTargetDate(dateStr);

      if (!dateStr) {
        setWeatherForecast(null);
        setLocalEvents([]);
        return;
      }

      const selectedDate = new Date(dateStr + 'T12:00:00');
      const extracted = profile ? extractAnalysisFields(profile.analysis) : null;
      const location = extracted?.basics.location || getUserLocation(userIdentity);

      if (!location) return;

      setIsLoadingWeather(true);

      try {
        // Fetch weather and events in parallel
        const [weather, events] = await Promise.all([
          getWeatherByLocation(location, selectedDate),
          searchLocalEvents(
            location,
            selectedDate,
            profile ? getMatchInterests(profile) : [],
            getUserInterests(userIdentity)
          ),
        ]);

        setWeatherForecast(weather);
        setLocalEvents(events);
      } catch (err) {
        // Non-critical: weather/events are optional, continue without them
        console.log('useDateIdeas: Weather/events fetch failed (non-critical)');
      } finally {
        setIsLoadingWeather(false);
      }
    },
    [profile, userIdentity]
  );

  // Generate date ideas
  const generate = useCallback(async () => {
    if (!profile) return;

    setIsLoadingDates(true);
    setError(null);

    try {
      const { basics } = extractAnalysisFields(profile.analysis);
      const matchLocation = basics.location || getMatchLocation(profile) || 'Unknown';
      const userLocation = getUserLocation(userIdentity) || 'Unknown';
      const matchInterests = getMatchInterests(profile);
      const userGoal = getUserDatingGoal(userIdentity) || 'exploring';

      const result = await getDateSuggestions(matchLocation, userLocation, matchInterests, userGoal, {
        targetDate: targetDate ? new Date(targetDate + 'T12:00:00') : undefined,
        weatherForecast: weatherForecast || undefined,
        localEvents: localEvents.length > 0 ? localEvents : undefined,
      });

      setSuggestions(result);

      // Save to database
      await db.profiles.update(profile.id, {
        date_suggestions: {
          ideas: result,
          searched_at: new Date(),
          target_date: targetDate ? new Date(targetDate) : undefined,
          weather_forecast: weatherForecast
            ? {
                temp_high: weatherForecast.temp_high,
                temp_low: weatherForecast.temp_low,
                condition: weatherForecast.condition,
              }
            : undefined,
          local_events: localEvents,
        },
      });
    } catch (err) {
      const auraError = ensureAuraError(err, 'Failed to get date ideas');
      console.log('useDateIdeas:', auraError.code, auraError.message);
      setError(auraError);
      showError(auraError);
    } finally {
      setIsLoadingDates(false);
    }
  }, [profile, userIdentity, targetDate, weatherForecast, localEvents, showError]);

  return {
    suggestions,
    targetDate,
    setTargetDate,
    weatherForecast,
    localEvents,
    isLoadingWeather,
    isLoadingDates,
    error,
    handleDateSelect,
    generate,
  };
}
