import React, { useState } from 'react';
import { Layout, Typography, message, Row, Col, Button, Card } from 'antd';
import { FileSearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { ComparisonResult } from '../types/excel';
import { excelService } from '../services/api';
import FileUpload from '../components/FileUpload';
import { ExcelComparisonPaginated } from '../components/ExcelComparisonPaginated';

const { Header, Content } = Layout;
const { Title } = Typography;

const ComparisonPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
  const [file1, setFile1] = useState<File | null>(null);
  const [file2, setFile2] = useState<File | null>(null);

  const handleFileCompare = async () => {
    if (!file1 || !file2) {
      message.warning('Please select both files to compare');
      return;
    }

    setIsLoading(true);
    try {
      const response = await excelService.compareFiles(file1, file2);
      console.log('Comparison response:', response);
      if (response.success && response.data) {
        setComparisonResult(response.data);
        console.log('Comparison result set:', response.data);
        message.success('Files compared successfully!');
      } else {
        message.error(response.error || 'Failed to compare files');
      }
    } catch (error) {
      console.error('Comparison error:', error);
      message.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFile1(null);
    setFile2(null);
    setComparisonResult(null);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ background: '#fff', padding: '0 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <Title level={2} style={{ margin: '16px 0' }}>Excel File Comparison Tool</Title>
      </Header>
      <Content style={{ padding: '24px' }}>
        <Card style={{ marginBottom: 24 }}>
          <Row gutter={24}>
            <Col span={11}>
              <Title level={4}>File 1</Title>
              <FileUpload 
                onFileSelect={setFile1} 
                label={file1 ? file1.name : 'Select first Excel file'}
              />
            </Col>
            <Col span={2} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileSearchOutlined style={{ fontSize: 24, color: '#1890ff' }} />
            </Col>
            <Col span={11}>
              <Title level={4}>File 2</Title>
              <FileUpload 
                onFileSelect={setFile2} 
                label={file2 ? file2.name : 'Select second Excel file'}
              />
            </Col>
          </Row>
          <Row style={{ marginTop: 24 }} justify="center" gutter={16}>
            <Col>
              <Button 
                type="primary" 
                size="large" 
                icon={<FileSearchOutlined />}
                onClick={handleFileCompare}
                loading={isLoading}
                disabled={!file1 || !file2}
              >
                Compare Files
              </Button>
            </Col>
            <Col>
              <Button 
                size="large" 
                icon={<ReloadOutlined />}
                onClick={handleReset}
                disabled={isLoading}
              >
                Reset
              </Button>
            </Col>
          </Row>
        </Card>

        {comparisonResult ? (
          <ExcelComparisonPaginated comparisonResult={comparisonResult} />
        ) : (
          <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
            {isLoading ? 'Comparing files...' : 'Upload and compare Excel files to see results'}
          </div>
        )}
      </Content>
    </Layout>
  );
};

export default ComparisonPage;