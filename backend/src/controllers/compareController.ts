import { Request, Response } from 'express';
import { ComparisonResult } from '../types';
import { ExcelService } from '../services/excelService';
import { cacheService } from '../services/cacheService';
import fs from 'fs/promises';

export class CompareController {
  static async compareFiles(req: Request, res: Response): Promise<void> {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      if (!files || !files.file1 || !files.file2 || files.file1.length === 0 || files.file2.length === 0) {
        res.status(400).json({
          error: 'Please upload exactly 2 Excel files'
        });
        return;
      }

      const file1 = files.file1[0];
      const file2 = files.file2[0];

      // Read both Excel files
      const workbook1 = await ExcelService.readExcelFile(file1.path);
      const workbook2 = await ExcelService.readExcelFile(file2.path);

      // Compare the workbooks
      const differences = await ExcelService.compareWorkbooks(workbook1, workbook2);


      // Generate unique comparison ID
      const comparisonId = Date.now().toString();

      // Cache the workbooks for pagination
      const file1Data = ExcelService.extractWorkbookData(workbook1);
      const file2Data = ExcelService.extractWorkbookData(workbook2);
      cacheService.set(comparisonId, file1Data, file2Data);

      // For initial response, only send first page of data
      const firstPageFile1 = {
        sheets: file1Data.sheets.map(sheet => ({
          name: sheet.name,
          headers: sheet.headers,
          rows: sheet.rows.slice(0, 25) // Only first 25 rows
        }))
      };

      const firstPageFile2 = {
        sheets: file2Data.sheets.map(sheet => ({
          name: sheet.name,
          headers: sheet.headers,
          rows: sheet.rows.slice(0, 25) // Only first 25 rows
        }))
      };

      // Clean up uploaded files
      await Promise.all([
        fs.unlink(file1.path),
        fs.unlink(file2.path)
      ]);

      const result: ComparisonResult = {
        id: comparisonId,
        file1Name: file1.originalname,
        file2Name: file2.originalname,
        differences,
        file1Data: firstPageFile1,
        file2Data: firstPageFile2,
        timestamp: new Date()
      };

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to compare files',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }


  static async getPaginatedData(req: Request, res: Response): Promise<void> {
    try {
      const { comparisonId, sheet, startRow = '0', limit = '25' } = req.query;

      if (!comparisonId || !sheet) {
        res.status(400).json({
          error: 'Missing required parameters: comparisonId and sheet'
        });
        return;
      }

      // Get cached data
      const cachedData = cacheService.get(String(comparisonId));
      if (!cachedData) {
        res.status(404).json({
          error: 'Comparison data not found. Please re-upload files.'
        });
        return;
      }

      const startRowNum = parseInt(String(startRow));
      const limitNum = parseInt(String(limit));
      const sheetName = String(sheet);

      // Find the requested sheet in both files
      const sheet1 = cachedData.file1Data.sheets.find(s => s.name === sheetName);
      const sheet2 = cachedData.file2Data.sheets.find(s => s.name === sheetName);

      // Prepare paginated response
      const response = {
        comparisonId,
        sheet: sheetName,
        file1: sheet1 ? {
          headers: sheet1.headers,
          rows: sheet1.rows.slice(startRowNum, startRowNum + limitNum),
          totalRows: sheet1.rows.length,
          hasMore: startRowNum + limitNum < sheet1.rows.length
        } : null,
        file2: sheet2 ? {
          headers: sheet2.headers,
          rows: sheet2.rows.slice(startRowNum, startRowNum + limitNum),
          totalRows: sheet2.rows.length,
          hasMore: startRowNum + limitNum < sheet2.rows.length
        } : null,
        startRow: startRowNum,
        limit: limitNum
      };

      res.json({
        success: true,
        data: response
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get paginated data',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}