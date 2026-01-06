import { useState, useCallback } from 'react';

/**
 * useOptimistic Hook
 * 
 * Provides optimistic UI updates for async operations.
 * Updates the UI immediately, then syncs with the server.
 * On error, automatically rolls back to the previous state.
 * 
 * @param {any} initialState - Initial state value
 * @returns {Object} - { state, setOptimistic, isPending, error }
 */
export const useOptimistic = (initialState) => {
  const [state, setState] = useState(initialState);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState(null);
  const [previousState, setPreviousState] = useState(null);

  /**
   * Execute an optimistic update
   * 
   * @param {any} optimisticValue - The value to show immediately
   * @param {Function} asyncFn - The async function to execute
   * @param {Object} options - { onSuccess, onError, rollbackOnError }
   */
  const setOptimistic = useCallback(async (optimisticValue, asyncFn, options = {}) => {
    const { 
      onSuccess, 
      onError, 
      rollbackOnError = true 
    } = options;

    // Store previous state for potential rollback
    setPreviousState(state);
    setError(null);
    setIsPending(true);

    // Apply optimistic update immediately
    const newValue = typeof optimisticValue === 'function' 
      ? optimisticValue(state) 
      : optimisticValue;
    setState(newValue);

    try {
      // Execute the actual async operation
      const result = await asyncFn();
      
      // Update with real result if provided
      if (result !== undefined) {
        setState(result);
      }
      
      setIsPending(false);
      onSuccess?.(result);
      
      return result;
    } catch (err) {
      setError(err);
      setIsPending(false);
      
      // Rollback to previous state on error
      if (rollbackOnError) {
        setState(previousState);
      }
      
      onError?.(err);
      throw err;
    }
  }, [state, previousState]);

  /**
   * Reset to a specific state
   */
  const reset = useCallback((newState) => {
    setState(newState);
    setError(null);
    setIsPending(false);
    setPreviousState(null);
  }, []);

  return {
    state,
    setState: reset,
    setOptimistic,
    isPending,
    error,
    rollback: () => previousState !== null && setState(previousState),
  };
};

/**
 * useOptimisticAction Hook
 * 
 * A simpler hook for optimistic actions that don't need full state management.
 * Great for toggles, increments, and other quick actions.
 * 
 * @returns {Object} - { execute, isPending, error }
 */
export const useOptimisticAction = () => {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (asyncFn, options = {}) => {
    const { onSuccess, onError } = options;
    
    setIsPending(true);
    setError(null);

    try {
      const result = await asyncFn();
      setIsPending(false);
      onSuccess?.(result);
      return result;
    } catch (err) {
      setError(err);
      setIsPending(false);
      onError?.(err);
      throw err;
    }
  }, []);

  return { execute, isPending, error, clearError: () => setError(null) };
};

/**
 * useOptimisticList Hook
 * 
 * Optimized for list operations (add, remove, update items).
 * 
 * @param {Array} initialList - Initial list
 * @returns {Object} - List operations with optimistic updates
 */
export const useOptimisticList = (initialList = []) => {
  const [list, setList] = useState(initialList);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState(null);

  const addItem = useCallback(async (item, asyncFn, options = {}) => {
    const previousList = [...list];
    setIsPending(true);
    
    // Optimistically add item
    setList(prev => [...prev, item]);

    try {
      const result = await asyncFn();
      // Update with real item if returned
      if (result) {
        setList(prev => prev.map(i => i === item ? result : i));
      }
      setIsPending(false);
      options.onSuccess?.(result);
      return result;
    } catch (err) {
      setList(previousList);
      setError(err);
      setIsPending(false);
      options.onError?.(err);
      throw err;
    }
  }, [list]);

  const removeItem = useCallback(async (predicate, asyncFn, options = {}) => {
    const previousList = [...list];
    setIsPending(true);
    
    // Optimistically remove item
    setList(prev => prev.filter(item => !predicate(item)));

    try {
      const result = await asyncFn();
      setIsPending(false);
      options.onSuccess?.(result);
      return result;
    } catch (err) {
      setList(previousList);
      setError(err);
      setIsPending(false);
      options.onError?.(err);
      throw err;
    }
  }, [list]);

  const updateItem = useCallback(async (predicate, updates, asyncFn, options = {}) => {
    const previousList = [...list];
    setIsPending(true);
    
    // Optimistically update item
    setList(prev => prev.map(item => 
      predicate(item) 
        ? { ...item, ...(typeof updates === 'function' ? updates(item) : updates) }
        : item
    ));

    try {
      const result = await asyncFn();
      setIsPending(false);
      options.onSuccess?.(result);
      return result;
    } catch (err) {
      setList(previousList);
      setError(err);
      setIsPending(false);
      options.onError?.(err);
      throw err;
    }
  }, [list]);

  return {
    list,
    setList,
    addItem,
    removeItem,
    updateItem,
    isPending,
    error,
    clearError: () => setError(null),
  };
};

export default useOptimistic;


