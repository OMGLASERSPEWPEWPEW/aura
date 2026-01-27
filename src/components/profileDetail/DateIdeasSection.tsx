// src/components/profileDetail/DateIdeasSection.tsx
import { Calendar, Loader2, MapPin, Cloud, Sun, Star, RefreshCw } from 'lucide-react';
import type { DateSuggestion } from '../../lib/db';
import type { WeatherForecast } from '../../lib/weather';

interface DateIdeasSectionProps {
  suggestions: DateSuggestion[] | null;
  targetDate: string;
  weatherForecast: WeatherForecast | null;
  localEvents: string[];
  isLoadingWeather: boolean;
  isLoadingDates: boolean;
  error: string | null;
  onDateSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onGenerate: () => void;
}

/**
 * Date ideas section with weather and local events.
 */
export function DateIdeasSection({
  suggestions,
  targetDate,
  weatherForecast,
  localEvents,
  isLoadingWeather,
  isLoadingDates,
  error,
  onDateSelect,
  onGenerate,
}: DateIdeasSectionProps) {
  const today = new Date().toISOString().split('T')[0];
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  const maxDate = new Date(new Date().getTime() + sevenDaysMs).toISOString().split('T')[0];

  return (
    <section className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/30 dark:to-purple-900/30 p-5 rounded-xl border border-violet-200 dark:border-violet-700">
      <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-3 flex items-center gap-2">
        <Calendar size={18} className="text-violet-600 dark:text-violet-400" /> Date Ideas
      </h2>

      {/* Date Picker */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
          Planning for a specific date? (optional)
        </label>
        <input
          type="date"
          value={targetDate}
          onChange={onDateSelect}
          min={today}
          max={maxDate}
          className="w-full p-2.5 border border-violet-200 dark:border-violet-600 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 dark:focus:ring-violet-400 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
        />
      </div>

      {/* Weather Display */}
      {isLoadingWeather && (
        <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400 text-sm mb-3">
          <Loader2 className="animate-spin" size={14} />
          <span>Fetching weather...</span>
        </div>
      )}

      {weatherForecast && !isLoadingWeather && (
        <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg mb-4 flex items-center gap-3">
          {weatherForecast.condition.toLowerCase().includes('clear') ||
          weatherForecast.condition.toLowerCase().includes('sunny') ? (
            <Sun className="text-amber-500 dark:text-amber-400" size={24} />
          ) : (
            <Cloud className="text-blue-500 dark:text-blue-400" size={24} />
          )}
          <div>
            <p className="font-medium text-slate-800 dark:text-slate-200">
              {weatherForecast.temp_high}F / {weatherForecast.temp_low}F
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-300">{weatherForecast.condition}</p>
            {weatherForecast.precipitation_probability > 20 && (
              <p className="text-xs text-blue-600 dark:text-blue-400">{weatherForecast.precipitation_probability}% chance of rain</p>
            )}
          </div>
        </div>
      )}

      {/* Local Events */}
      {localEvents.length > 0 && (
        <div className="bg-purple-50 dark:bg-purple-900/30 p-3 rounded-lg mb-4">
          <p className="text-sm font-medium text-purple-800 dark:text-purple-200 mb-2">Possible local events:</p>
          <ul className="text-sm text-purple-700 dark:text-purple-300 space-y-1">
            {localEvents.slice(0, 3).map((event, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-purple-400 dark:text-purple-500">*</span>
                {event}
              </li>
            ))}
          </ul>
        </div>
      )}

      {!suggestions && !isLoadingDates && (
        <button
          onClick={onGenerate}
          className="w-full bg-violet-600 dark:bg-violet-700 text-white py-3 rounded-lg font-medium hover:bg-violet-700 dark:hover:bg-violet-600 transition-colors flex items-center justify-center"
        >
          <Calendar className="mr-2" size={18} />
          Get Date Ideas
        </button>
      )}

      {isLoadingDates && (
        <div className="flex items-center justify-center py-6 text-violet-600 dark:text-violet-400">
          <Loader2 className="animate-spin mr-2" />
          <span>Finding perfect date spots...</span>
        </div>
      )}

      {error && <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 p-3 rounded-lg text-sm">{error}</div>}

      {suggestions && suggestions.length > 0 && (
        <div className="space-y-3">
          {suggestions.map((idea, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-violet-100 dark:border-violet-700">
              <div className="flex items-start justify-between mb-1">
                <h4 className="font-bold text-slate-900 dark:text-slate-50">{idea.name}</h4>
                <div className="flex gap-1">
                  {idea.weather_appropriate && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200">
                      Weather-friendly
                    </span>
                  )}
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded ${
                      idea.type === 'coffee'
                        ? 'bg-amber-100 dark:bg-amber-800 text-amber-700 dark:text-amber-200'
                        : idea.type === 'dinner'
                        ? 'bg-rose-100 dark:bg-rose-800 text-rose-700 dark:text-rose-200'
                        : idea.type === 'drinks'
                        ? 'bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-200'
                        : idea.type === 'outdoor'
                        ? 'bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-200'
                        : idea.type === 'cultural'
                        ? 'bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {idea.type}
                  </span>
                </div>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 flex items-center gap-1 mb-2">
                <MapPin size={12} /> {idea.location}
              </p>
              <p className="text-sm text-violet-700 dark:text-violet-300 italic">{idea.why_good_fit}</p>
              {idea.weather_note && (
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 flex items-center gap-1">
                  <Cloud size={12} /> {idea.weather_note}
                </p>
              )}
              {idea.event_tie_in && (
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-1 flex items-center gap-1">
                  <Star size={12} /> {idea.event_tie_in}
                </p>
              )}
            </div>
          ))}
          <button
            onClick={onGenerate}
            disabled={isLoadingDates}
            className="w-full text-violet-600 dark:text-violet-400 py-2 text-sm font-medium hover:text-violet-800 dark:hover:text-violet-300 transition-colors flex items-center justify-center gap-1"
          >
            <RefreshCw size={14} />
            Refresh Ideas
          </button>
        </div>
      )}
    </section>
  );
}
