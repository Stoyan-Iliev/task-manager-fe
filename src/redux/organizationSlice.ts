import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { OrganizationResponse } from '../types/organization.types';
import type { RootState } from './store';

interface OrganizationState {
  currentOrganizationId: number | null;
  organizations: Record<number, OrganizationResponse>; // Cache by ID
}

// Try to load organization from sessionStorage (for page refreshes)
const loadOrganizationFromStorage = (): number | null => {
  try {
    const orgId = sessionStorage.getItem('currentOrganizationId');
    return orgId ? parseInt(orgId, 10) : null;
  } catch {
    return null;
  }
};

const loadOrganizationsFromStorage = (): Record<number, OrganizationResponse> => {
  try {
    const orgsData = sessionStorage.getItem('organizations');
    return orgsData ? JSON.parse(orgsData) : {};
  } catch {
    return {};
  }
};

const initialState: OrganizationState = {
  currentOrganizationId: loadOrganizationFromStorage(),
  organizations: loadOrganizationsFromStorage(),
};

const organizationSlice = createSlice({
  name: 'organization',
  initialState,
  reducers: {
    setCurrentOrganization: (state, action: PayloadAction<number>) => {
      state.currentOrganizationId = action.payload;
      // Persist to sessionStorage
      sessionStorage.setItem('currentOrganizationId', action.payload.toString());
    },

    clearOrganization: (state) => {
      state.currentOrganizationId = null;
      state.organizations = {};
      sessionStorage.removeItem('currentOrganizationId');
      sessionStorage.removeItem('organizations');
    },

    cacheOrganizations: (state, action: PayloadAction<OrganizationResponse[]>) => {
      // Convert array to keyed object for efficient lookup
      const orgsMap = action.payload.reduce((acc, org) => {
        acc[org.id] = org;
        return acc;
      }, {} as Record<number, OrganizationResponse>);

      state.organizations = { ...state.organizations, ...orgsMap };

      // Persist to sessionStorage
      sessionStorage.setItem('organizations', JSON.stringify(state.organizations));
    },

    cacheOrganization: (state, action: PayloadAction<OrganizationResponse>) => {
      state.organizations[action.payload.id] = action.payload;
      // Persist to sessionStorage
      sessionStorage.setItem('organizations', JSON.stringify(state.organizations));
    },

    removeOrganizationFromCache: (state, action: PayloadAction<number>) => {
      delete state.organizations[action.payload];

      // If we're removing the current organization, clear it
      if (state.currentOrganizationId === action.payload) {
        state.currentOrganizationId = null;
        sessionStorage.removeItem('currentOrganizationId');
      }

      // Persist to sessionStorage
      sessionStorage.setItem('organizations', JSON.stringify(state.organizations));
    },
  },
});

// Selectors
export const selectCurrentOrganizationId = (state: RootState) =>
  state.organization.currentOrganizationId;

export const selectCurrentOrganization = (state: RootState): OrganizationResponse | null => {
  const currentId = state.organization.currentOrganizationId;
  return currentId ? state.organization.organizations[currentId] || null : null;
};

export const selectAllOrganizations = (state: RootState): OrganizationResponse[] =>
  Object.values(state.organization.organizations);

export const selectOrganizationById = (orgId: number) => (state: RootState): OrganizationResponse | null =>
  state.organization.organizations[orgId] || null;

export const {
  setCurrentOrganization,
  clearOrganization,
  cacheOrganizations,
  cacheOrganization,
  removeOrganizationFromCache,
} = organizationSlice.actions;

export default organizationSlice.reducer;
