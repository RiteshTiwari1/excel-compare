import * as XLSX from 'xlsx';
import { Difference, ComparisonResult, WorkbookData, SheetData } from '../types';

export class ExcelService {
  static async readExcelFile(filePath: string): Promise<XLSX.WorkBook> {
    try {
      const workbook = XLSX.readFile(filePath);
      return workbook;
    } catch (error) {
      throw new Error(`Failed to read Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async compareWorkbooks(workbook1: XLSX.WorkBook, workbook2: XLSX.WorkBook): Promise<Difference[]> {
    const differences: Difference[] = [];
    
    // Get all sheet names from both workbooks
    const allSheetNames = new Set([...workbook1.SheetNames, ...workbook2.SheetNames]);
    
    for (const sheetName of allSheetNames) {
      const sheet1 = workbook1.Sheets[sheetName];
      const sheet2 = workbook2.Sheets[sheetName];
      
      // Handle sheet additions/removals
      if (!sheet1) {
        differences.push({
          sheet: sheetName,
          type: 'added',
          description: `Sheet "${sheetName}" added in new file`,
          row: 0,
          column: 0,
          cell: 'N/A',
          oldValue: null,
          newValue: null
        });
        continue;
      }
      
      if (!sheet2) {
        differences.push({
          sheet: sheetName,
          type: 'removed',
          description: `Sheet "${sheetName}" removed in new file`,
          row: 0,
          column: 0,
          cell: 'N/A',
          oldValue: null,
          newValue: null
        });
        continue;
      }
      
      // Compare sheets cell by cell
      const range1 = XLSX.utils.decode_range(sheet1['!ref'] || 'A1');
      const range2 = XLSX.utils.decode_range(sheet2['!ref'] || 'A1');
      
      // Get the maximum range to cover all cells in both sheets
      const maxRow = Math.max(range1.e.r, range2.e.r);
      const maxCol = Math.max(range1.e.c, range2.e.c);
      
      for (let row = 0; row <= maxRow; row++) {
        for (let col = 0; col <= maxCol; col++) {
          const cellAddr = XLSX.utils.encode_cell({ r: row, c: col });
          const cell1 = sheet1[cellAddr];
          const cell2 = sheet2[cellAddr];
          
          const value1 = cell1 ? cell1.v : undefined;
          const value2 = cell2 ? cell2.v : undefined;
          
          // Check if values are different
          if (value1 !== value2) {
            if (value1 === undefined && value2 !== undefined) {
              differences.push({
                sheet: sheetName,
                cell: cellAddr,
                row: row + 1,
                column: col + 1,
                type: 'added',
                oldValue: null,
                newValue: value2,
                description: `Cell ${cellAddr} added with value: ${value2}`
              });
            } else if (value1 !== undefined && value2 === undefined) {
              differences.push({
                sheet: sheetName,
                cell: cellAddr,
                row: row + 1,
                column: col + 1,
                type: 'removed',
                oldValue: value1,
                newValue: null,
                description: `Cell ${cellAddr} removed (was: ${value1})`
              });
            } else {
              differences.push({
                sheet: sheetName,
                cell: cellAddr,
                row: row + 1,
                column: col + 1,
                type: 'modified',
                oldValue: value1,
                newValue: value2,
                description: `Cell ${cellAddr} changed from "${value1}" to "${value2}"`
              });
            }
          }
        }
      }
    }
    
    return differences;
  }


  static extractWorkbookData(workbook: XLSX.WorkBook): WorkbookData {
    const sheets: SheetData[] = [];

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      if (!sheet['!ref']) continue;

      const range = XLSX.utils.decode_range(sheet['!ref']);
      const headers: string[] = [];
      const rows: any[][] = [];

      // Extract headers from first row
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddr = XLSX.utils.encode_cell({ r: 0, c: col });
        const cell = sheet[cellAddr];
        headers.push(cell ? String(cell.v) : `Column ${col + 1}`);
      }

      // Extract data rows
      for (let row = 1; row <= range.e.r; row++) {
        const rowData: any[] = [];
        for (let col = range.s.c; col <= range.e.c; col++) {
          const cellAddr = XLSX.utils.encode_cell({ r: row, c: col });
          const cell = sheet[cellAddr];
          rowData.push(cell ? cell.v : '');
        }
        rows.push(rowData);
      }

      sheets.push({
        name: sheetName,
        headers,
        rows
      });
    }

    return { sheets };
  }

  static extractPaginatedData(
    workbook: XLSX.WorkBook, 
    sheetName: string, 
    startRow: number, 
    limit: number
  ): { headers: string[], rows: any[][], totalRows: number, hasMore: boolean } {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet || !sheet['!ref']) {
      return { headers: [], rows: [], totalRows: 0, hasMore: false };
    }

    const range = XLSX.utils.decode_range(sheet['!ref']);
    const headers: string[] = [];
    const rows: any[][] = [];

    // Extract headers from first row
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddr = XLSX.utils.encode_cell({ r: 0, c: col });
      const cell = sheet[cellAddr];
      headers.push(cell ? String(cell.v) : `Column ${col + 1}`);
    }

    // Calculate total data rows (excluding header)
    const totalRows = range.e.r;
    
    // Extract requested rows (add 1 to startRow to skip header)
    const endRow = Math.min(startRow + limit, totalRows);
    for (let row = startRow + 1; row <= endRow; row++) {
      const rowData: any[] = [];
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddr = XLSX.utils.encode_cell({ r: row, c: col });
        const cell = sheet[cellAddr];
        rowData.push(cell ? cell.v : '');
      }
      rows.push(rowData);
    }

    return {
      headers,
      rows,
      totalRows,
      hasMore: endRow < totalRows
    };
  }
}