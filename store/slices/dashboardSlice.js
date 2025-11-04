import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  publications: [],
  clinicalTrials: [],
  experts: [],
  loading: false,
  error: null,
  pagination: {
    publications: { page: 1, hasMore: true },
    clinicalTrials: { page: 1, hasMore: true },
    experts: { page: 1, hasMore: true },
  },
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    setPublications: (state, action) => {
      state.publications = action.payload;
      state.loading = false;
    },
    appendPublications: (state, action) => {
      state.publications = [...state.publications, ...action.payload];
      state.loading = false;
    },
    setClinicalTrials: (state, action) => {
      state.clinicalTrials = action.payload;
      state.loading = false;
    },
    appendClinicalTrials: (state, action) => {
      state.clinicalTrials = [...state.clinicalTrials, ...action.payload];
      state.loading = false;
    },
    setExperts: (state, action) => {
      state.experts = action.payload;
      state.loading = false;
    },
    appendExperts: (state, action) => {
      state.experts = [...state.experts, ...action.payload];
      state.loading = false;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    updatePagination: (state, action) => {
      const { type, page, hasMore } = action.payload;
      state.pagination[type] = { page, hasMore };
    },
    resetDashboard: () => initialState,
  },
});

export const {
  setPublications,
  appendPublications,
  setClinicalTrials,
  appendClinicalTrials,
  setExperts,
  appendExperts,
  setLoading,
  setError,
  updatePagination,
  resetDashboard,
} = dashboardSlice.actions;

export default dashboardSlice.reducer;
