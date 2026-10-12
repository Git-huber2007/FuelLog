import type { WorkoutResponse } from '@fuellog/shared';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/apiClient';

// gcTime 0: set inputs keep their own state, so each visit must start from the server's values, never a cached copy from before the edits.
export const useWorkout = (date: string) =>
  useQuery({ queryKey: ['workout', date], queryFn: () => api<WorkoutResponse>(`/workout/${date}`), gcTime: 0, staleTime: 0 });
