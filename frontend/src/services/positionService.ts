import { apiRequest } from './httpClient';
import {
  Position,
  PositionListResponse,
  CreatePositionData,
  UpdatePositionData,
  PositionFilters,
  PositionStatus,
} from '../types';

class PositionService {
  /**
   * Get all positions with optional filtering
   */
  async getPositions(filters?: PositionFilters): Promise<PositionListResponse> {
    const params = new URLSearchParams();
    
    if (filters) {
      if (filters.status) {
        params.append('status', filters.status);
      }
      if (filters.company) {
        params.append('company', filters.company);
      }
      if (filters.search) {
        params.append('search', filters.search);
      }
      if (filters.date_from) {
        params.append('date_from', filters.date_from);
      }
      if (filters.date_to) {
        params.append('date_to', filters.date_to);
      }
    }

    const queryString = params.toString();
    const url = queryString ? `/positions?${queryString}` : '/positions';
    
    return apiRequest.get<PositionListResponse>(url);
  }

  /**
   * Get a single position by ID
   */
  async getPosition(id: string): Promise<Position> {
    return apiRequest.get<Position>(`/positions/${id}`);
  }

  /**
   * Create a new position
   */
  async createPosition(data: CreatePositionData): Promise<Position> {
    return apiRequest.post<Position>('/positions', data);
  }

  /**
   * Update an existing position
   */
  async updatePosition(id: string, data: UpdatePositionData): Promise<Position> {
    return apiRequest.put<Position>(`/positions/${id}`, data);
  }

  /**
   * Partially update a position (PATCH)
   */
  async patchPosition(id: string, data: Partial<UpdatePositionData>): Promise<Position> {
    return apiRequest.patch<Position>(`/positions/${id}`, data);
  }

  /**
   * Delete a position
   */
  async deletePosition(id: string): Promise<void> {
    return apiRequest.delete<void>(`/positions/${id}`);
  }

  /**
   * Update position status only
   */
  async updatePositionStatus(id: string, status: string): Promise<Position> {
    return apiRequest.patch<Position>(`/positions/${id}`, { status });
  }

  /**
   * Get positions by status
   */
  async getPositionsByStatus(status: string): Promise<Position[]> {
    const response = await this.getPositions({ status: status as any });
    return response.positions;
  }

  /**
   * Search positions by query
   */
  async searchPositions(query: string): Promise<Position[]> {
    const response = await this.getPositions({ search: query });
    return response.positions;
  }

  /**
   * Get positions for a specific company
   */
  async getPositionsByCompany(company: string): Promise<Position[]> {
    const response = await this.getPositions({ company });
    return response.positions;
  }

  /**
   * Get positions within date range
   */
  async getPositionsByDateRange(dateFrom: string, dateTo: string): Promise<Position[]> {
    const response = await this.getPositions({ 
      date_from: dateFrom, 
      date_to: dateTo 
    });
    return response.positions;
  }

  /**
   * Get recent positions (last 30 days)
   */
  async getRecentPositions(): Promise<Position[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const response = await this.getPositions({
      date_from: thirtyDaysAgo.toISOString().split('T')[0] || '',
    });
    
    return response.positions;
  }

  /**
   * Duplicate a position (create copy)
   */
  async duplicatePosition(id: string): Promise<Position> {
    const originalPosition = await this.getPosition(id);
    
    const duplicateData: CreatePositionData = {
      title: `${originalPosition.title} (Copy)`,
      company: originalPosition.company,
      description: originalPosition.description || '',
      location: originalPosition.location || '',
      salary_range: originalPosition.salary_range || '',
      status: PositionStatus.APPLIED, // Reset status for duplicate
      application_date: new Date().toISOString().split('T')[0] || '',
    };

    return this.createPosition(duplicateData);
  }

  /**
   * Archive a position (soft delete by changing status)
   */
  async archivePosition(id: string): Promise<Position> {
    return this.updatePositionStatus(id, 'withdrawn');
  }

  /**
   * Get position summary statistics
   */
  async getPositionSummary(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    recentCount: number;
  }> {
    const [allPositions, recentPositions] = await Promise.all([
      this.getPositions(),
      this.getRecentPositions(),
    ]);

    const byStatus = allPositions.positions.reduce((acc, position) => {
      acc[position.status] = (acc[position.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: allPositions.positions.length,
      byStatus,
      recentCount: recentPositions.length,
    };
  }
}

// Export singleton instance
export const positionService = new PositionService();
export default positionService;