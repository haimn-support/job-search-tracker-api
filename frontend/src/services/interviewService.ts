import { apiRequest } from './httpClient';
import {
  Interview,
  InterviewListResponse,
  CreateInterviewData,
  UpdateInterviewData,
  InterviewOutcome,
} from '../types';

class InterviewService {
  /**
   * Get all interviews for a specific position
   */
  async getInterviews(positionId: string): Promise<Interview[]> {
    const response = await apiRequest.get<InterviewListResponse>(`/positions/${positionId}/interviews`);
    return response.interviews;
  }

  /**
   * Get a single interview by ID
   */
  async getInterview(id: string): Promise<Interview> {
    return apiRequest.get<Interview>(`/interviews/${id}`);
  }

  /**
   * Create a new interview
   */
  async createInterview(data: CreateInterviewData): Promise<Interview> {
    return apiRequest.post<Interview>('/interviews', data);
  }

  /**
   * Update an existing interview
   */
  async updateInterview(id: string, data: UpdateInterviewData): Promise<Interview> {
    return apiRequest.put<Interview>(`/interviews/${id}`, data);
  }

  /**
   * Partially update an interview (PATCH)
   */
  async patchInterview(id: string, data: Partial<UpdateInterviewData>): Promise<Interview> {
    return apiRequest.patch<Interview>(`/interviews/${id}`, data);
  }

  /**
   * Delete an interview
   */
  async deleteInterview(id: string): Promise<void> {
    return apiRequest.delete<void>(`/interviews/${id}`);
  }

  /**
   * Quick update a single field of an interview (for inline editing)
   */
  async updateInterviewField(id: string, field: string, value: any): Promise<Interview> {
    const updateData = { [field]: value };
    return apiRequest.patch<Interview>(`/interviews/${id}`, updateData);
  }

  /**
   * Update interview scheduled date only
   */
  async updateInterviewDate(id: string, scheduledDate: string): Promise<Interview> {
    return this.updateInterviewField(id, 'scheduled_date', scheduledDate);
  }

  /**
   * Update interview outcome only
   */
  async updateInterviewOutcome(id: string, outcome: string): Promise<Interview> {
    return this.updateInterviewField(id, 'outcome', outcome);
  }

  /**
   * Update interview notes only
   */
  async updateInterviewNotes(id: string, notes: string): Promise<Interview> {
    return this.updateInterviewField(id, 'notes', notes);
  }

  /**
   * Update interview duration only
   */
  async updateInterviewDuration(id: string, durationMinutes: number): Promise<Interview> {
    return this.updateInterviewField(id, 'duration_minutes', durationMinutes);
  }

  /**
   * Get all interviews for the current user (across all positions)
   */
  async getAllUserInterviews(): Promise<Interview[]> {
    return apiRequest.get<Interview[]>('/interviews');
  }

  /**
   * Get upcoming interviews (scheduled for future dates)
   */
  async getUpcomingInterviews(): Promise<Interview[]> {
    const allInterviews = await this.getAllUserInterviews();
    const now = new Date();
    
    return allInterviews.filter(interview => {
      const scheduledDate = new Date(interview.scheduled_date);
      return scheduledDate > now && interview.outcome === 'pending';
    });
  }

  /**
   * Get past interviews
   */
  async getPastInterviews(): Promise<Interview[]> {
    const allInterviews = await this.getAllUserInterviews();
    const now = new Date();
    
    return allInterviews.filter(interview => {
      const scheduledDate = new Date(interview.scheduled_date);
      return scheduledDate <= now || interview.outcome !== 'pending';
    });
  }

  /**
   * Get interviews by outcome
   */
  async getInterviewsByOutcome(outcome: string): Promise<Interview[]> {
    const allInterviews = await this.getAllUserInterviews();
    return allInterviews.filter(interview => interview.outcome === outcome);
  }

  /**
   * Get interviews by type
   */
  async getInterviewsByType(type: string): Promise<Interview[]> {
    const allInterviews = await this.getAllUserInterviews();
    return allInterviews.filter(interview => interview.type === type);
  }

  /**
   * Get interviews scheduled for today
   */
  async getTodaysInterviews(): Promise<Interview[]> {
    const allInterviews = await this.getAllUserInterviews();
    const today = new Date().toISOString().split('T')[0];
    
    return allInterviews.filter(interview => {
      const interviewDate = interview.scheduled_date.split('T')[0];
      return interviewDate === today && interview.outcome === 'pending';
    });
  }

  /**
   * Get overdue interviews (past scheduled date but still pending)
   */
  async getOverdueInterviews(): Promise<Interview[]> {
    const allInterviews = await this.getAllUserInterviews();
    const now = new Date();
    
    return allInterviews.filter(interview => {
      const scheduledDate = new Date(interview.scheduled_date);
      return scheduledDate < now && interview.outcome === 'pending';
    });
  }

  /**
   * Reschedule an interview
   */
  async rescheduleInterview(id: string, newDate: string, notes?: string): Promise<Interview> {
    const updateData: Partial<UpdateInterviewData> = {
      scheduled_date: newDate,
    };
    
    if (notes) {
      updateData.notes = notes;
    }
    
    return this.patchInterview(id, updateData);
  }

  /**
   * Cancel an interview
   */
  async cancelInterview(id: string, reason?: string): Promise<Interview> {
    const updateData: Partial<UpdateInterviewData> = {
      outcome: InterviewOutcome.CANCELLED,
    };
    
    if (reason) {
      const currentInterview = await this.getInterview(id);
      const existingNotes = currentInterview.notes || '';
      updateData.notes = existingNotes 
        ? `${existingNotes}\n\nCancellation reason: ${reason}`
        : `Cancellation reason: ${reason}`;
    }
    
    return this.patchInterview(id, updateData);
  }

  /**
   * Complete an interview with outcome and notes
   */
  async completeInterview(
    id: string, 
    outcome: InterviewOutcome.PASSED | InterviewOutcome.FAILED, 
    notes?: string
  ): Promise<Interview> {
    const updateData: Partial<UpdateInterviewData> = {
      outcome,
    };
    
    if (notes) {
      updateData.notes = notes;
    }
    
    return this.patchInterview(id, updateData);
  }

  /**
   * Get interview statistics for a position
   */
  async getPositionInterviewStats(positionId: string): Promise<{
    total: number;
    byOutcome: Record<string, number>;
    byType: Record<string, number>;
    upcoming: number;
    completed: number;
  }> {
    const interviews = await this.getInterviews(positionId);
    
    const byOutcome = interviews.reduce((acc, interview) => {
      acc[interview.outcome] = (acc[interview.outcome] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const byType = interviews.reduce((acc, interview) => {
      acc[interview.type] = (acc[interview.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const upcoming = interviews.filter(i => i.outcome === 'pending').length;
    const completed = interviews.filter(i => i.outcome !== 'pending').length;
    
    return {
      total: interviews.length,
      byOutcome,
      byType,
      upcoming,
      completed,
    };
  }

  /**
   * Bulk update multiple interviews
   */
  async bulkUpdateInterviews(
    updates: Array<{ id: string; data: Partial<UpdateInterviewData> }>
  ): Promise<Interview[]> {
    const promises = updates.map(({ id, data }) => this.patchInterview(id, data));
    return Promise.all(promises);
  }
}

// Export singleton instance
export const interviewService = new InterviewService();
export default interviewService;