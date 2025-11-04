import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  publications: [],
  clinicalTrials: [],
  experts: [],
  loading: false,
  error: null,
};

const favoritesSlice = createSlice({
  name: 'favorites',
  initialState,
  reducers: {
    setFavorites: (state, action) => {
      const { publications, clinicalTrials, experts } = action.payload;
      state.publications = publications || [];
      state.clinicalTrials = clinicalTrials || [];
      state.experts = experts || [];
      state.loading = false;
    },
    addFavoritePublication: (state, action) => {
      state.publications.push(action.payload);
    },
    removeFavoritePublication: (state, action) => {
      state.publications = state.publications.filter(
        (pub) => pub.id !== action.payload
      );
    },
    addFavoriteTrial: (state, action) => {
      state.clinicalTrials.push(action.payload);
    },
    removeFavoriteTrial: (state, action) => {
      state.clinicalTrials = state.clinicalTrials.filter(
        (trial) => trial.id !== action.payload
      );
    },
    addFavoriteExpert: (state, action) => {
      state.experts.push(action.payload);
    },
    removeFavoriteExpert: (state, action) => {
      state.experts = state.experts.filter(
        (expert) => expert.id !== action.payload
      );
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const {
  setFavorites,
  addFavoritePublication,
  removeFavoritePublication,
  addFavoriteTrial,
  removeFavoriteTrial,
  addFavoriteExpert,
  removeFavoriteExpert,
  setLoading,
  setError,
} = favoritesSlice.actions;

export default favoritesSlice.reducer;
