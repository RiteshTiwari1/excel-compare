// Excel comparison types
export interface ComparisonResult {
  id: string;
  timestamp: Date;
  file1Name: string;
  file2Name: string;
  differences: Difference[];
  file1Data: WorkbookData;
  file2Data: WorkbookData;
}

export interface WorkbookData {
  sheets: SheetData[];
}

export interface SheetData {
  name: string;
  headers: string[];
  rows: any[][];
}

export interface Difference {
  row: number;
  column: number;
  cell: string;
  sheet: string;
  oldValue: any;
  newValue: any;
  type: 'added' | 'removed' | 'modified';
  description?: string;
}


export interface FileUpload {
  filename: string;
  originalname: string;
  path: string;
  size: number;
}