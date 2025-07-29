# Excel Comparison Tool

A modern web application for comparing Excel files side-by-side with difference highlighting, built using the MERN stack with TypeScript.

## Features

- 📊 **Side-by-side Excel comparison** - View two Excel files simultaneously
- 🎯 **Difference highlighting** - Color-coded cells (modified, added, removed)
- 📑 **Multi-sheet support** - Navigate between sheets with difference counts
- 🚀 **Large file handling** - Infinite scrolling with pagination
- ⚡ **High performance** - In-memory caching and optimized data loading
- 🎨 **Modern UI** - Clean interface built with Ant Design

## Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd excel-compare
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Install frontend dependencies:
```bash
cd ../frontend
npm install
```

### Running the Application

1. Start the backend server:
```bash
cd backend
npm run dev
```
The backend will run on http://localhost:3000

2. Start the frontend development server:
```bash
cd frontend
npm run dev
```
The frontend will run on http://localhost:5173

3. Open your browser and navigate to http://localhost:5173

## Usage

1. **Upload Files**: Select or drag-and-drop two Excel files to compare
2. **Compare**: Click the "Compare Files" button
3. **View Results**: 
   - See differences highlighted in colors
   - Navigate between differences using Previous/Next buttons
   - Switch between sheets using tabs
   - Scroll to load more rows (for large files)


## Architecture

The application follows a client-server architecture:

- **Frontend**: React + TypeScript + Vite + Ant Design
- **Backend**: Node.js + Express + TypeScript
- **File Processing**: XLSX library for Excel parsing
- **Caching**: In-memory cache with 30-minute TTL

## API Documentation

The backend provides RESTful APIs for file comparison and data pagination.

Key endpoints:
- `POST /api/excel/compare` - Compare two Excel files
- `GET /api/excel/data` - Get paginated data for large files

## Project Structure

```
excel-compare/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   └── types/          # TypeScript types
│   └── package.json
├── backend/                 # Express backend server
│   ├── src/
│   │   ├── controllers/    # Request handlers
│   │   ├── services/       # Business logic
│   │   ├── routes/         # API routes
│   │   └── types/          # TypeScript types
│   └── package.json
└── README.md              # This file
```


## Development

### Backend Development
```bash
cd backend
npm run dev    # Start with hot reload
npm run build  # Build for production
npm start      # Run production build
```

### Frontend Development
```bash
cd frontend
npm run dev    # Start development server
npm run build  # Build for production
npm run preview # Preview production build
```

### TypeScript
Both frontend and backend use TypeScript for type safety:
```bash
npm run type-check  # Check TypeScript errors
```

## Configuration

### Backend Configuration
- Port: 3000 (configurable via PORT env variable)
- Upload limit: 10MB (configurable in routes)
- Cache TTL: 30 minutes (configurable in CacheService)

### Frontend Configuration
- Port: 5173 (Vite default)
- API URL: http://localhost:3000 (configurable in api service)

## Performance Considerations

- **Pagination**: Loads 25 rows at a time for large files
- **Caching**: Results cached for 30 minutes to improve response times
- **File Size**: Maximum 10MB per file (configurable)
- **Memory**: Efficient memory usage through streaming and pagination

## Future Enhancements

- [ ] User authentication and authorization
- [ ] Persistent storage for comparison history
- [ ] Export comparison results to various formats
- [ ] Support for additional file formats (CSV, PDF, DOCX)
- [ ] Real-time collaboration features
- [ ] Advanced filtering and search within differences
- [ ] Batch file comparison

## Troubleshooting

### Common Issues

1. **Port already in use**
   - Backend: Change port in `.env` or use `PORT=3001 npm run dev`
   - Frontend: Vite will automatically try next available port

2. **File upload fails**
   - Check file size (max 10MB)
   - Ensure file is valid Excel format (.xlsx, .xls)

3. **Comparison takes too long**
   - Large files are processed in chunks
   - Check browser console for errors

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Acknowledgments

- Built with [React](https://reactjs.org/)
- UI components from [Ant Design](https://ant.design/)
- Excel parsing by [SheetJS](https://sheetjs.com/)
- Backend powered by [Express](https://expressjs.com/)