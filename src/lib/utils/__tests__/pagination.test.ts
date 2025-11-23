import { describe, it, expect } from 'vitest';
import { getPaginationParams, createPaginationResult, ITEMS_PER_PAGE } from '../pagination';

describe('Pagination Utilities', () => {
  describe('getPaginationParams', () => {
    it('should calculate correct skip and take for first page', () => {
      const { skip, take } = getPaginationParams(1, 50);
      expect(skip).toBe(0);
      expect(take).toBe(50);
    });

    it('should calculate correct skip and take for second page', () => {
      const { skip, take } = getPaginationParams(2, 50);
      expect(skip).toBe(50);
      expect(take).toBe(50);
    });

    it('should calculate correct skip and take for third page', () => {
      const { skip, take } = getPaginationParams(3, 25);
      expect(skip).toBe(50);
      expect(take).toBe(25);
    });

    it('should use default limit when not provided', () => {
      const { skip, take } = getPaginationParams(1);
      expect(skip).toBe(0);
      expect(take).toBe(ITEMS_PER_PAGE);
    });

    it('should handle invalid page numbers by defaulting to 1', () => {
      const { skip, take } = getPaginationParams(0, 50);
      expect(skip).toBe(0);
      expect(take).toBe(50);
    });

    it('should enforce maximum limit of 100', () => {
      const { skip, take } = getPaginationParams(1, 200);
      expect(take).toBe(100);
    });

    it('should enforce minimum limit of 1', () => {
      const { skip, take } = getPaginationParams(1, -5);
      expect(take).toBe(1);
    });
  });

  describe('createPaginationResult', () => {
    it('should create correct pagination result for first page', () => {
      const data = Array.from({ length: 50 }, (_, i) => ({ id: i }));
      const result = createPaginationResult(data, 150, 1, 50);

      expect(result.data).toEqual(data);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(50);
      expect(result.pagination.total).toBe(150);
      expect(result.pagination.totalPages).toBe(3);
      expect(result.pagination.hasMore).toBe(true);
    });

    it('should create correct pagination result for last page', () => {
      const data = Array.from({ length: 50 }, (_, i) => ({ id: i }));
      const result = createPaginationResult(data, 150, 3, 50);

      expect(result.pagination.page).toBe(3);
      expect(result.pagination.totalPages).toBe(3);
      expect(result.pagination.hasMore).toBe(false);
    });

    it('should handle partial last page correctly', () => {
      const data = Array.from({ length: 25 }, (_, i) => ({ id: i }));
      const result = createPaginationResult(data, 125, 3, 50);

      expect(result.data.length).toBe(25);
      expect(result.pagination.totalPages).toBe(3);
      expect(result.pagination.hasMore).toBe(false);
    });

    it('should handle single page correctly', () => {
      const data = Array.from({ length: 10 }, (_, i) => ({ id: i }));
      const result = createPaginationResult(data, 10, 1, 50);

      expect(result.pagination.totalPages).toBe(1);
      expect(result.pagination.hasMore).toBe(false);
    });

    it('should handle empty data correctly', () => {
      const result = createPaginationResult([], 0, 1, 50);

      expect(result.data).toEqual([]);
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.totalPages).toBe(0);
      expect(result.pagination.hasMore).toBe(false);
    });

    it('should use default values when not provided', () => {
      const data = Array.from({ length: 50 }, (_, i) => ({ id: i }));
      const result = createPaginationResult(data, 150);

      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(ITEMS_PER_PAGE);
    });

    it('should enforce maximum limit of 100', () => {
      const data = Array.from({ length: 100 }, (_, i) => ({ id: i }));
      const result = createPaginationResult(data, 200, 1, 200);

      expect(result.pagination.limit).toBe(100);
      expect(result.pagination.totalPages).toBe(2);
    });
  });

  describe('ITEMS_PER_PAGE constant', () => {
    it('should be set to 50 as per requirements', () => {
      expect(ITEMS_PER_PAGE).toBe(50);
    });
  });
});
