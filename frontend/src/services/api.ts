import axios from 'axios';
import { ComparisonResponse } from '../types/excel';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 1 minute timeout for large files
});

export const excelService = {
  compareFiles: async (file1: File, file2: File): Promise<ComparisonResponse> => {
    const formData = new FormData();
    formData.append('file1', file1);
    formData.append('file2', file2);

    try {
      const response = await api.post<ComparisonResponse>('/excel/compare', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          error: error.response?.data?.error || error.message,
        };
      }
      return {
        success: false,
        error: 'An unexpected error occurred',
      };
    }
  },

  getPaginatedData: async (
    comparisonId: string,
    sheet: string,
    startRow: number,
    limit: number = 25
  ): Promise<any> => {
    try {
      const response = await api.get('/excel/data', {
        params: { comparisonId, sheet, startRow, limit }
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error || error.message);
      }
      throw error;
    }
  },
};

export default api;