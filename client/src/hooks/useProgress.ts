import type { ProgressResponse } from '@fuellog/shared';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/apiClient';

export const useProgress = () => useQuery({ queryKey: ['progress'], queryFn: () => api<ProgressResponse>('/progress') });
