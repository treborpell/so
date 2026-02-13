'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Query,
  onSnapshot,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
  CollectionReference,
  limit,
  startAfter,
  query,
  getDocs,
  DocumentSnapshot
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/** Utility type to add an 'id' field to a given type T. */
export type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useCollection hook.
 * @template T Type of the document data.
 */
export interface UseCollectionResult<T> {
  data: WithId<T>[] | null; // Document data with ID, or null.
  isLoading: boolean;       // True if loading initial or next pages.
  error: FirestoreError | Error | null; // Error object, or null.
  loadMore?: () => void;    // Function to load the next page.
  hasMore?: boolean;        // True if more data can be loaded.
}

/* Internal implementation of Query:
  https://github.com/firebase/firebase-js-sdk/blob/c5f08a9bc5da0d2b0207802c972d53724ccef055/packages/firestore/src/lite-api/reference.ts#L143
*/
export interface InternalQuery extends Query<DocumentData> {
  _query: {
    path: {
      canonicalString(): string;
      toString(): string;
    }
  }
}

/**
 * React hook to subscribe to a Firestore collection or query with pagination support.
 * 
 * @template T Optional type for document data. Defaults to any.
 * @param {CollectionReference<DocumentData> | Query<DocumentData> | null | undefined} baseQuery -
 * The base Firestore Query. 
 * @param {number} pageSize - Number of documents to fetch per page.
 * @returns {UseCollectionResult<T>} Object with data, isLoading, error, loadMore, hasMore.
 */
export function usePaginatedCollection<T = any>(
    baseQuery: (Query<DocumentData> & {__memo?: boolean}) | null | undefined,
    pageSize: number = 20
): UseCollectionResult<T> {
  const [data, setData] = useState<WithId<T>[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<FirestoreError | Error | null>(null);
  const [lastVisible, setLastVisible] = useState<DocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);

  // Validation
  if(baseQuery && !baseQuery.__memo) {
    throw new Error('baseQuery was not properly memoized using useMemoFirebase');
  }

  // Reset state when query changes
  useEffect(() => {
    setData(null);
    setLastVisible(null);
    setHasMore(true);
    setIsLoading(false);
  }, [baseQuery]);

  const loadMore = useCallback(async () => {
    if (!baseQuery || isLoading || !hasMore) return;

    setIsLoading(true);
    setError(null);

    try {
      const nextQuery = lastVisible 
        ? query(baseQuery, startAfter(lastVisible), limit(pageSize))
        : query(baseQuery, limit(pageSize));

      const snapshot = await getDocs(nextQuery);
      
      const newEntries = snapshot.docs.map(doc => ({
        ...(doc.data() as T),
        id: doc.id
      }));

      setData(prev => prev ? [...prev, ...newEntries] : newEntries);
      setLastVisible(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === pageSize);
    } catch (err: any) {
      setError(err);
      errorEmitter.emit('permission-error', err);
    } finally {
      setIsLoading(false);
    }
  }, [baseQuery, lastVisible, isLoading, hasMore, pageSize]);

  // Initial load
  useEffect(() => {
    if (baseQuery && data === null && !isLoading) {
      loadMore();
    }
  }, [baseQuery, data, isLoading, loadMore]);

  return { data, isLoading, error, loadMore, hasMore };
}

/**
 * Standard useCollection hook (Real-time, non-paginated)
 */
export function useCollection<T = any>(
    memoizedTargetRefOrQuery: ((CollectionReference<DocumentData> | Query<DocumentData>) & {__memo?: boolean})  | null | undefined,
): UseCollectionResult<T> {
  type ResultItemType = WithId<T>;
  type StateDataType = ResultItemType[] | null;

  const [data, setData] = useState<StateDataType>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<FirestoreError | Error | null>(null);

  useEffect(() => {
    if (!memoizedTargetRefOrQuery) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(
      memoizedTargetRefOrQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const results: ResultItemType[] = [];
        for (const doc of snapshot.docs) {
          results.push({ ...(doc.data() as T), id: doc.id });
        }
        setData(results);
        setError(null);
        setIsLoading(false);
      },
      (error: FirestoreError) => {
        const path: string =
          memoizedTargetRefOrQuery.type === 'collection'
            ? (memoizedTargetRefOrQuery as CollectionReference).path
            : (memoizedTargetRefOrQuery as unknown as InternalQuery)._query.path.canonicalString()

        const contextualError = new FirestorePermissionError({
          operation: 'list',
          path,
        })

        setError(contextualError)
        setData(null)
        setIsLoading(false)
        errorEmitter.emit('permission-error', contextualError);
      }
    );

    return () => unsubscribe();
  }, [memoizedTargetRefOrQuery]);

  if(memoizedTargetRefOrQuery && !memoizedTargetRefOrQuery.__memo) {
    throw new Error(memoizedTargetRefOrQuery + ' was not properly memoized using useMemoFirebase');
  }
  return { data, isLoading, error };
}
