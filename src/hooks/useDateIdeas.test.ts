// src/hooks/useDateIdeas.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useDateIdeas } from './useDateIdeas';
import type { Profile, UserIdentity, DateSuggestion } from '../lib/db';
import type { WeatherForecast } from '../lib/weather';

// Mock dependencies
vi.mock('../lib/ai', () => ({
  getDateSuggestions: vi.fn(),
  searchLocalEvents: vi.fn(),
}));

vi.mock('../lib/weather', () => ({
  getWeatherByLocation: vi.fn(),
}));

vi.mock('../lib/db', () => ({
  db: {
    profiles: {
      update: vi.fn().mockResolvedValue(1),
    },
  },
}));

vi.mock('../lib/utils', () => ({
  getUserLocation: vi.fn(),
  getUserInterests: vi.fn(),
  getUserDatingGoal: vi.fn(),
}));

vi.mock('../lib/utils/profileHelpers', () => ({
  getMatchLocation: vi.fn(),
  getMatchInterests: vi.fn(),
  extractAnalysisFields: vi.fn(() => ({
    basics: { location: 'San Francisco' },
    psych: {},
    prompts: [],
  })),
}));

describe('useDateIdeas', () => {
  const mockProfile: Partial<Profile> = {
    id: 1,
    name: 'Test Match',
    analysis: {},
  };

  const mockUserIdentity: Partial<UserIdentity> = {
    id: 1,
    datingGoals: { type: 'long-term' },
    manualInfo: { location: 'Oakland' },
  };

  const mockSuggestions: DateSuggestion[] = [
    {
      name: 'Coffee at Blue Bottle',
      type: 'coffee',
      location: 'Downtown',
      why_good_fit: 'Casual and relaxed',
    },
    {
      name: 'Walk in Golden Gate Park',
      type: 'outdoor',
      location: 'San Francisco',
      why_good_fit: 'Great for conversation',
    },
  ];

  const mockWeather: WeatherForecast = {
    date: '2024-01-15',
    temp_high: 65,
    temp_low: 50,
    condition: 'Sunny',
    precipitation_probability: 10,
  };

  const mockEvents = ['Art Walk Friday', 'Farmers Market'];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() =>
      useDateIdeas(undefined, undefined)
    );

    expect(result.current.suggestions).toBeNull();
    expect(result.current.targetDate).toBe('');
    expect(result.current.weatherForecast).toBeNull();
    expect(result.current.localEvents).toEqual([]);
    expect(result.current.isLoadingWeather).toBe(false);
    expect(result.current.isLoadingDates).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should load existing suggestions from profile', async () => {
    const profileWithSuggestions = {
      ...mockProfile,
      date_suggestions: {
        ideas: mockSuggestions,
        searched_at: new Date(),
      },
    };

    const { result } = renderHook(() =>
      useDateIdeas(profileWithSuggestions as Profile, mockUserIdentity as UserIdentity)
    );

    await waitFor(() => {
      expect(result.current.suggestions).toEqual(mockSuggestions);
    });
  });

  it('should update targetDate when setTargetDate is called', () => {
    const { result } = renderHook(() =>
      useDateIdeas(mockProfile as Profile, mockUserIdentity as UserIdentity)
    );

    act(() => {
      result.current.setTargetDate('2024-01-20');
    });

    expect(result.current.targetDate).toBe('2024-01-20');
  });

  it('should fetch weather and events on date select', async () => {
    const { getWeatherByLocation } = await import('../lib/weather');
    const { searchLocalEvents } = await import('../lib/ai');
    const { getUserLocation } = await import('../lib/utils');

    vi.mocked(getWeatherByLocation).mockResolvedValue(mockWeather);
    vi.mocked(searchLocalEvents).mockResolvedValue(mockEvents);
    vi.mocked(getUserLocation).mockReturnValue('Oakland');

    const { result } = renderHook(() =>
      useDateIdeas(mockProfile as Profile, mockUserIdentity as UserIdentity)
    );

    const mockEvent = {
      target: { value: '2024-01-20' },
    } as React.ChangeEvent<HTMLInputElement>;

    await act(async () => {
      await result.current.handleDateSelect(mockEvent);
    });

    expect(getWeatherByLocation).toHaveBeenCalled();
    expect(searchLocalEvents).toHaveBeenCalled();
    expect(result.current.weatherForecast).toEqual(mockWeather);
    expect(result.current.localEvents).toEqual(mockEvents);
  });

  it('should clear weather and events when date is cleared', async () => {
    const { getWeatherByLocation } = await import('../lib/weather');
    const { searchLocalEvents } = await import('../lib/ai');

    vi.mocked(getWeatherByLocation).mockResolvedValue(mockWeather);
    vi.mocked(searchLocalEvents).mockResolvedValue(mockEvents);

    const { result } = renderHook(() =>
      useDateIdeas(mockProfile as Profile, mockUserIdentity as UserIdentity)
    );

    // First set a date
    await act(async () => {
      await result.current.handleDateSelect({
        target: { value: '2024-01-20' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    // Then clear it
    await act(async () => {
      await result.current.handleDateSelect({
        target: { value: '' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.weatherForecast).toBeNull();
    expect(result.current.localEvents).toEqual([]);
  });

  it('should generate date suggestions', async () => {
    const { getDateSuggestions } = await import('../lib/ai');
    const { getUserLocation, getUserDatingGoal } = await import('../lib/utils');
    const { getMatchInterests } = await import('../lib/utils/profileHelpers');
    const { db } = await import('../lib/db');

    vi.mocked(getDateSuggestions).mockResolvedValue(mockSuggestions);
    vi.mocked(getUserLocation).mockReturnValue('Oakland');
    vi.mocked(getUserDatingGoal).mockReturnValue('long-term');
    vi.mocked(getMatchInterests).mockReturnValue(['hiking', 'coffee']);

    const { result } = renderHook(() =>
      useDateIdeas(mockProfile as Profile, mockUserIdentity as UserIdentity)
    );

    await act(async () => {
      await result.current.generate();
    });

    expect(getDateSuggestions).toHaveBeenCalledWith(
      'San Francisco',
      'Oakland',
      ['hiking', 'coffee'],
      'long-term',
      expect.any(Object)
    );
    expect(result.current.suggestions).toEqual(mockSuggestions);
    expect(db.profiles.update).toHaveBeenCalled();
  });

  it('should set loading state during generation', async () => {
    const { getDateSuggestions } = await import('../lib/ai');

    let resolvePromise: (value: DateSuggestion[]) => void;
    vi.mocked(getDateSuggestions).mockReturnValue(
      new Promise((resolve) => {
        resolvePromise = resolve;
      })
    );

    const { result } = renderHook(() =>
      useDateIdeas(mockProfile as Profile, mockUserIdentity as UserIdentity)
    );

    act(() => {
      result.current.generate();
    });

    expect(result.current.isLoadingDates).toBe(true);

    await act(async () => {
      resolvePromise!(mockSuggestions);
    });

    expect(result.current.isLoadingDates).toBe(false);
  });

  it('should handle generation errors', async () => {
    const { getDateSuggestions } = await import('../lib/ai');
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    vi.mocked(getDateSuggestions).mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(() =>
      useDateIdeas(mockProfile as Profile, mockUserIdentity as UserIdentity)
    );

    await act(async () => {
      await result.current.generate();
    });

    expect(result.current.error).toBe('API Error');
    expect(result.current.isLoadingDates).toBe(false);

    consoleSpy.mockRestore();
  });

  it('should not generate when profile is undefined', async () => {
    const { getDateSuggestions } = await import('../lib/ai');

    const { result } = renderHook(() =>
      useDateIdeas(undefined, mockUserIdentity as UserIdentity)
    );

    await act(async () => {
      await result.current.generate();
    });

    expect(getDateSuggestions).not.toHaveBeenCalled();
  });

  it('should include weather and events in generation when available', async () => {
    const { getDateSuggestions } = await import('../lib/ai');
    const { getWeatherByLocation } = await import('../lib/weather');
    const { searchLocalEvents } = await import('../lib/ai');
    const { getUserLocation } = await import('../lib/utils');

    vi.mocked(getWeatherByLocation).mockResolvedValue(mockWeather);
    vi.mocked(searchLocalEvents).mockResolvedValue(mockEvents);
    vi.mocked(getUserLocation).mockReturnValue('Oakland');
    vi.mocked(getDateSuggestions).mockResolvedValue(mockSuggestions);

    const { result } = renderHook(() =>
      useDateIdeas(mockProfile as Profile, mockUserIdentity as UserIdentity)
    );

    // First select a date to get weather and events
    await act(async () => {
      await result.current.handleDateSelect({
        target: { value: '2024-01-20' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    // Then generate
    await act(async () => {
      await result.current.generate();
    });

    expect(getDateSuggestions).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.any(Array),
      expect.any(String),
      expect.objectContaining({
        weatherForecast: mockWeather,
        localEvents: mockEvents,
      })
    );
  });

  it('should handle weather fetch errors gracefully', async () => {
    const { getWeatherByLocation } = await import('../lib/weather');
    const { searchLocalEvents } = await import('../lib/ai');
    const { getUserLocation } = await import('../lib/utils');
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    vi.mocked(getWeatherByLocation).mockRejectedValue(new Error('Weather API Error'));
    vi.mocked(searchLocalEvents).mockResolvedValue(mockEvents);
    vi.mocked(getUserLocation).mockReturnValue('Oakland');

    const { result } = renderHook(() =>
      useDateIdeas(mockProfile as Profile, mockUserIdentity as UserIdentity)
    );

    await act(async () => {
      await result.current.handleDateSelect({
        target: { value: '2024-01-20' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.isLoadingWeather).toBe(false);
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('should set loading state during weather fetch', async () => {
    const { getWeatherByLocation } = await import('../lib/weather');
    const { searchLocalEvents } = await import('../lib/ai');
    const { getUserLocation } = await import('../lib/utils');

    let resolveWeather: (value: WeatherForecast) => void;
    vi.mocked(getWeatherByLocation).mockReturnValue(
      new Promise((resolve) => {
        resolveWeather = resolve;
      })
    );
    vi.mocked(searchLocalEvents).mockResolvedValue(mockEvents);
    vi.mocked(getUserLocation).mockReturnValue('Oakland');

    const { result } = renderHook(() =>
      useDateIdeas(mockProfile as Profile, mockUserIdentity as UserIdentity)
    );

    act(() => {
      result.current.handleDateSelect({
        target: { value: '2024-01-20' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.isLoadingWeather).toBe(true);

    await act(async () => {
      resolveWeather!(mockWeather);
    });

    expect(result.current.isLoadingWeather).toBe(false);
  });
});
