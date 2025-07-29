import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Table, Tabs, Row, Col, Tag, Spin, message, Space } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { ComparisonResult, CellDifference } from '../types/excel';
import { excelService } from '../services/api';
import './ExcelComparison.css';


interface ExcelComparisonPaginatedProps {
  comparisonResult: ComparisonResult;
}

interface LoadedData {
  file1Rows: any[][];
  file2Rows: any[][];
  file1Total: number;
  file2Total: number;
  hasMoreFile1: boolean;
  hasMoreFile2: boolean;
}

export const ExcelComparisonPaginated: React.FC<ExcelComparisonPaginatedProps> = ({ comparisonResult }) => {
  const [activeSheet, setActiveSheet] = useState('0');
  const [loadingMore, setLoadingMore] = useState(false);
  
  // Data state for infinite scrolling
  const [loadedData, setLoadedData] = useState<LoadedData>({
    file1Rows: [],
    file2Rows: [],
    file1Total: 0,
    file2Total: 0,
    hasMoreFile1: true,
    hasMoreFile2: true
  });

  const leftTableRef = useRef<any>(null);
  const rightTableRef = useRef<any>(null);
  const loadingRef = useRef(false);

  const { differences = [] } = comparisonResult;

  // Get current sheet data safely
  const getCurrentSheetData = () => {
    const sheetIndex = parseInt(activeSheet);
    const sheet1 = comparisonResult?.file1Data?.sheets?.[sheetIndex];
    const sheet2 = comparisonResult?.file2Data?.sheets?.[sheetIndex];
    const sheetName = sheet1?.name || sheet2?.name || 'Sheet1';
    return { sheet1, sheet2, sheetName };
  };

  const { sheet1, sheet2, sheetName: currentSheetName } = getCurrentSheetData();

  // Initialize with first page data
  useEffect(() => {
    setLoadedData({
      file1Rows: sheet1?.rows || [],
      file2Rows: sheet2?.rows || [],
      file1Total: sheet1?.rows?.length || 0,
      file2Total: sheet2?.rows?.length || 0,
      hasMoreFile1: true, // Always assume there might be more data initially
      hasMoreFile2: true
    });
  }, [activeSheet]);

  // Load more data
  const loadMoreData = useCallback(async () => {
    if (loadingRef.current || (!loadedData.hasMoreFile1 && !loadedData.hasMoreFile2)) {
      return;
    }

    loadingRef.current = true;
    setLoadingMore(true);

    try {
      const currentRowCount = Math.max(loadedData.file1Rows.length, loadedData.file2Rows.length);
      const response = await excelService.getPaginatedData(
        comparisonResult.id,
        currentSheetName,
        currentRowCount,
        25
      );

      if (response.success && response.data) {
        const { file1, file2 } = response.data;
        
        setLoadedData(prev => ({
          file1Rows: [...prev.file1Rows, ...(file1?.rows || [])],
          file2Rows: [...prev.file2Rows, ...(file2?.rows || [])],
          file1Total: file1?.totalRows || prev.file1Total,
          file2Total: file2?.totalRows || prev.file2Total,
          hasMoreFile1: file1?.hasMore || false,
          hasMoreFile2: file2?.hasMore || false
        }));
      }
    } catch (error) {
      console.error('Load more error:', error);
      message.error('Failed to load more data');
    } finally {
      loadingRef.current = false;
      setLoadingMore(false);
    }
  }, [comparisonResult.id, currentSheetName, loadedData]);

  // Scroll event handler
  const handleScroll = useCallback((e: any) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;
    
    // Load more when scrolled to 80% of content
    if (scrollPercentage > 0.8 && !loadingRef.current) {
      loadMoreData();
    }
  }, [loadMoreData]);

  // Set up scroll listeners
  useEffect(() => {
    const leftContainer = document.querySelector('.left-excel-table .ant-table-body');
    const rightContainer = document.querySelector('.right-excel-table .ant-table-body');

    if (!leftContainer || !rightContainer) return;

    // Add scroll event listeners
    leftContainer.addEventListener('scroll', handleScroll);
    rightContainer.addEventListener('scroll', handleScroll);

    // Synchronized scrolling
    let isScrolling = false;
    const syncScroll = (source: Element, target: Element) => {
      if (!isScrolling) {
        isScrolling = true;
        target.scrollTop = source.scrollTop;
        target.scrollLeft = source.scrollLeft;
        setTimeout(() => { isScrolling = false; }, 10);
      }
    };

    const handleLeftScroll = () => syncScroll(leftContainer, rightContainer);
    const handleRightScroll = () => syncScroll(rightContainer, leftContainer);

    leftContainer.addEventListener('scroll', handleLeftScroll);
    rightContainer.addEventListener('scroll', handleRightScroll);

    return () => {
      leftContainer.removeEventListener('scroll', handleScroll);
      rightContainer.removeEventListener('scroll', handleScroll);
      leftContainer.removeEventListener('scroll', handleLeftScroll);
      rightContainer.removeEventListener('scroll', handleRightScroll);
    };
  }, [activeSheet, handleScroll]);

  // Get differences for current sheet
  const sheetDifferences = differences.filter(diff => diff.sheet === currentSheetName);

  // Create a map of differences for quick lookup
  const diffMap = new Map<string, CellDifference>();
  differences.forEach(diff => {
    const key = `${diff.sheet}-${diff.row}-${diff.column}`;
    diffMap.set(key, diff);
  });

  // Generate columns for tables
  const generateColumns = (headers: string[], sheetName: string, isFile2: boolean = false) => {
    if (!headers || headers.length === 0) return [];
    
    return headers.map((header, index) => ({
      title: header,
      dataIndex: index.toString(),
      key: index.toString(),
      width: 150,
      render: (value: any, record: any) => {
        const rowIndex = record.rowIndex;
        const cellKey = `${sheetName}-${rowIndex + 2}-${index + 1}`; // +2 because row 1 is headers
        const diff = diffMap.get(cellKey);
        
        let className = '';
        if (diff) {
          if (diff.type === 'modified') className = 'cell-modified';
          else if (diff.type === 'added' && isFile2) className = 'cell-added';
          else if (diff.type === 'removed' && !isFile2) className = 'cell-removed';
        }


        return (
          <div className={className} title={diff?.description}>
            {value !== null && value !== undefined ? String(value) : ''}
          </div>
        );
      },
    }));
  };

  // Prepare data for tables
  const prepareTableData = (rows: any[][]) => {
    if (!rows || !Array.isArray(rows)) return [];
    
    return rows.map((row, index) => {
      const rowData: any = { key: index, rowIndex: index };
      if (Array.isArray(row)) {
        row.forEach((cell, cellIndex) => {
          rowData[cellIndex.toString()] = cell;
        });
      }
      return rowData;
    });
  };




  // Get all sheet names
  const allSheetNames = new Set<string>();
  comparisonResult.file1Data?.sheets?.forEach(s => allSheetNames.add(s.name));
  comparisonResult.file2Data?.sheets?.forEach(s => allSheetNames.add(s.name));

  // Prepare tab items for new Tabs API
  const tabItems = Array.from(allSheetNames).map((sheetName, index) => {
    const sheetDiffs = differences.filter(d => d.sheet === sheetName).length;
    return {
      key: index.toString(),
      label: (
        <span>
          {sheetName}
          {sheetDiffs > 0 && (
            <Tag color="orange" style={{ marginLeft: 8 }}>
              {sheetDiffs}
            </Tag>
          )}
        </span>
      )
    };
  });

  if (!comparisonResult || !comparisonResult.file1Data || !comparisonResult.file2Data) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>No comparison data available</div>;
  }

  return (
    <div className="excel-comparison">

      {/* Sheet Tabs */}
      {tabItems.length > 0 && (
        <Tabs 
          activeKey={activeSheet} 
          onChange={setActiveSheet} 
          className="sheet-tabs"
          items={tabItems}
        />
      )}

      {/* Split View Tables */}
      <div className="tables-wrapper">
        <Row gutter={16}>
          <Col span={12}>
            <h3>
              {comparisonResult.file1Name} 
              <Tag style={{ marginLeft: 8 }}>
                {loadedData.file1Rows.length} / {loadedData.file1Total || '?'} rows loaded
              </Tag>
            </h3>
            {sheet1 ? (
              <Table
                ref={leftTableRef}
                className="left-excel-table"
                columns={generateColumns(sheet1.headers, currentSheetName)}
                dataSource={prepareTableData(loadedData.file1Rows)}
                pagination={false}
                scroll={{ x: true, y: 600 }}
                size="small"
                bordered
                footer={() => loadingMore && loadedData.hasMoreFile1 ? (
                  <div style={{ textAlign: 'center', padding: '10px' }}>
                    <Spin indicator={<LoadingOutlined />} /> Loading more rows...
                  </div>
                ) : !loadedData.hasMoreFile1 && loadedData.file1Rows.length > 0 ? (
                  <div style={{ textAlign: 'center', padding: '10px', color: '#999' }}>
                    All rows loaded
                  </div>
                ) : null}
              />
            ) : (
              <div className="empty-sheet">Sheet not found in this file</div>
            )}
          </Col>
          <Col span={12}>
            <h3>
              {comparisonResult.file2Name}
              <Tag style={{ marginLeft: 8 }}>
                {loadedData.file2Rows.length} / {loadedData.file2Total || '?'} rows loaded
              </Tag>
            </h3>
            {sheet2 ? (
              <Table
                ref={rightTableRef}
                className="right-excel-table"
                columns={generateColumns(sheet2.headers, currentSheetName, true)}
                dataSource={prepareTableData(loadedData.file2Rows)}
                pagination={false}
                scroll={{ x: true, y: 600 }}
                size="small"
                bordered
                footer={() => loadingMore && loadedData.hasMoreFile2 ? (
                  <div style={{ textAlign: 'center', padding: '10px' }}>
                    <Spin indicator={<LoadingOutlined />} /> Loading more rows...
                  </div>
                ) : !loadedData.hasMoreFile2 && loadedData.file2Rows.length > 0 ? (
                  <div style={{ textAlign: 'center', padding: '10px', color: '#999' }}>
                    All rows loaded
                  </div>
                ) : null}
              />
            ) : (
              <div className="empty-sheet">Sheet not found in this file</div>
            )}
          </Col>
        </Row>
      </div>

      {/* Legend */}
      <div className="legend">
        <Space>
          <span>Legend:</span>
          <Tag color="orange">Modified</Tag>
          <Tag color="green">Added</Tag>
          <Tag color="red">Removed</Tag>
          {(loadedData.hasMoreFile1 || loadedData.hasMoreFile2) && (
            <Tag color="blue">Scroll down to load more rows</Tag>
          )}
        </Space>
      </div>
    </div>
  );
};