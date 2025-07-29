export interface CellDifference {
  row: number;
  column: number;
  cell: string;
  sheet: string;
  oldValue: any;
  newValue: any;
  type: 'added' | 'removed' | 'modified';
  description?: string;
}


export interface WorkbookData {
  sheets: SheetData[];
}

export interface SheetData {
  name: string;
  headers: string[];
  rows: any[][];
}

export interface ComparisonResult {
  id: string;
  timestamp: Date;
  file1Name: string;
  file2Name: string;
  differences: CellDifference[];
  file1Data: WorkbookData;
  file2Data: WorkbookData;
}

export interface FileInfo {
  name: string;
  size: number;
  lastModified: Date;
}

export interface ComparisonRequest {
  file1: File;
  file2: File;
}

export interface ComparisonResponse {
  success: boolean;
  data?: ComparisonResult;
  error?: string;
}