import type { ProfileInput, ProfileResponse } from '@fuellog/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/apiClient';

export const useProfile = () => useQuery({ queryKey: ['profile'], queryFn: () => api<ProfileResponse>('/profile') });

export function useSaveProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ProfileInput) => api<ProfileResponse>('/profile', { method: 'PUT', body: input }),
    onSuccess: (data) => {
      qc.setQueryData(['profile'], data);
      // Targets depend on the profile, so everything showing a target is stale.
      qc.invalidateQueries({ queryKey: ['day'] });
      qc.invalidateQueries({ queryKey: ['progress'] });
      qc.invalidateQueries({ queryKey: ['workout'] }); // the weekly program is part of the profile
    },
  });
}
