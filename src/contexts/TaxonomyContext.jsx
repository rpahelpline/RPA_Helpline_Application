import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { taxonomyApi } from '../services/api';

const TaxonomyContext = createContext(null);

export const TaxonomyProvider = ({ children }) => {
  const [platforms, setPlatforms] = useState([]);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const lastFetchRef = useRef(null);
  const fetchingRef = useRef(false);

  // Cache duration: 5 minutes
  const CACHE_DURATION = 5 * 60 * 1000;

  const fetchTaxonomy = useCallback(async (force = false) => {
    // Prevent concurrent fetches
    if (fetchingRef.current && !force) {
      return;
    }

    // Check if we have cached data and it's still fresh
    if (!force && platforms.length > 0 && skills.length > 0 && lastFetchRef.current) {
      const now = Date.now();
      if (now - lastFetchRef.current < CACHE_DURATION) {
        setLoading(false);
        return; // Use cached data
      }
    }

    fetchingRef.current = true;
    setLoading(true);
    setError(null);
    
    try {
      const [platformsRes, skillsRes] = await Promise.all([
        taxonomyApi.getPlatforms(),
        taxonomyApi.getSkills()
      ]);
      
      setPlatforms(platformsRes.platforms || []);
      setSkills(skillsRes.all_skills || []);
      lastFetchRef.current = Date.now();
    } catch (err) {
      console.error('Failed to fetch taxonomy:', err);
      setError(err);
      // Set empty arrays on error so fallback data can be used
      setPlatforms([]);
      setSkills([]);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [platforms.length, skills.length]);

  // Initial fetch
  useEffect(() => {
    fetchTaxonomy();
  }, [fetchTaxonomy]);

  const value = {
    platforms,
    skills,
    loading,
    error,
    refetch: () => fetchTaxonomy(true),
  };

  return (
    <TaxonomyContext.Provider value={value}>
      {children}
    </TaxonomyContext.Provider>
  );
};

export const useTaxonomy = () => {
  const context = useContext(TaxonomyContext);
  if (!context) {
    // Graceful fallback - return empty data instead of throwing
    console.warn('useTaxonomy used outside TaxonomyProvider, returning empty data');
    return {
      platforms: [],
      skills: [],
      loading: false,
      error: null,
      refetch: () => Promise.resolve(),
    };
  }
  return context;
};

