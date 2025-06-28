// app/documents/page.tsx
"use client"; // This component will be rendered on the client side

import React, { useState } from 'react'; // Only useState needed, no useEffect
import Link from 'next/link';
import {
  MdDescription, // Generic document icon (also for Word/Excel)
  MdDateRange,    // Upload date icon
  MdImage,        // Image file type icon
  MdPictureAsPdf, // PDF file type icon
  MdOutlineInsertDriveFile, // Default file icon for unknown types
  MdOutlineLibraryBooks, // Icon for the main document library title
  MdAddCircleOutline, // Icon for the "Upload New" button
} from 'react-icons/md'; // All necessary icons imported

// Define the Document interface (same as before)
interface Document {
  id: string;
  name: string;
  type: string;
  uploadDate: string;
  thumbnailUrl: string; // Still exists, but not used in UI for now
}

// Hardcoded Dummy Data for Frontend View
const staticDocuments: Document[] = [
  {
    id: 'doc_static_001',
    name: 'Marketing Strategy 2024.pdf',
    type: 'application/pdf',
    uploadDate: '2024-05-20',
    thumbnailUrl: '', // Not used for display in this design
  },
  {
    id: 'doc_static_002',
    name: 'Company Financial Report.docx',
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    uploadDate: '2024-05-18',
    thumbnailUrl: '',
  },
  {
    id: 'doc_static_003',
    name: 'Q2 Sales Performance.xlsx',
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    uploadDate: '2024-05-22',
    thumbnailUrl: '',
  },
  {
    id: 'doc_static_004',
    name: 'Product Mockup.png',
    type: 'image/png',
    uploadDate: '2024-05-15',
    thumbnailUrl: '',
  },
  {
    id: 'doc_static_005',
    name: 'Client Presentation.pptx',
    type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    uploadDate: '2024-05-25',
    thumbnailUrl: '',
  },
  {
    id: 'doc_static_006',
    name: 'Meeting Minutes 2024-05-10.txt',
    type: 'text/plain',
    uploadDate: '2024-05-10',
    thumbnailUrl: '',
  },
];

// Helper function to get a large, prominent icon based on file type
const getLargeFileIcon = (fileType: string) => {
  const iconClass = "text-6xl"; // This class makes the icon large
  if (fileType.includes('pdf')) {
    return <MdPictureAsPdf className={`${iconClass} text-red-500`} />;
  }
  if (fileType.includes('image')) {
    return <MdImage className={`${iconClass} text-blue-400`} />;
  }
  if (fileType.includes('wordprocessingml')) { // .docx
    return <MdDescription className={`${iconClass} text-blue-500`} />;
  }
  if (fileType.includes('spreadsheetml')) { // .xlsx
    return <MdDescription className={`${iconClass} text-green-500`} />;
  }
  // Added a specific icon for PowerPoint for better representation
  if (fileType.includes('presentationml')) { // .pptx
    return <MdDescription className={`${iconClass} text-orange-500`} />; // Orange for PowerPoint
  }
  return <MdOutlineInsertDriveFile className={`${iconClass} text-gray-400`} />; // Default icon
};

const DocumentsPage = () => {
  // Initialize documents directly with static data
  const [documents] = useState<Document[]>(staticDocuments);

  // No loading or error states needed as we are not fetching data

  // If you want to show the "No documents" state for testing,
  // uncomment the line below and comment out `staticDocuments` initialization above.
  // const [documents] = useState<Document[]>([]);

  // --- Main Document List Display ---
  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#1F2023] text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-4xl font-extrabold text-white flex items-center">
            <MdOutlineLibraryBooks className="mr-4 text-blue-400 text-5xl" />
            Your Document Library
          </h1>
          {/* "Upload New" Document Button */}
          <Link href="/documents/upload">
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-5 rounded-md flex items-center space-x-2 transition duration-200 shadow-md transform hover:scale-105">
              <MdAddCircleOutline className="text-xl" />
              <span>Upload New</span>
            </button>
          </Link>
        </div>

        {documents.length === 0 ? (
          // Display "No Documents Found" if the static array is empty (for testing)
          <div className="min-h-[calc(100vh-200px)] bg-[#1F2023] text-gray-400 p-8 flex flex-col items-center justify-center text-center">
            <MdDescription className="text-5xl mb-6" />
            <h2 className="text-2xl font-semibold mb-2">No Documents Found</h2>
            <p className="text-lg">It looks like you haven't uploaded any documents yet.</p>
            <Link href="/documents/upload" className="mt-6 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors transform hover:scale-105">
              <MdAddCircleOutline className="mr-3 -ml-1 h-5 w-5" />
              Upload Your First Document
            </Link>
          </div>
        ) : (
          // Display document grid if documents exist
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-7">
            {documents.map((doc) => (
              <Link key={doc.id} href={`/documents/view/${doc.id}`} className="block">
                <div className="bg-[#2D2E30] rounded-xl shadow-lg border border-gray-700 hover:border-blue-500 hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 overflow-hidden h-full flex flex-col">
                  {/* Icon area */}
                  <div className="w-full h-48 bg-gray-700 flex flex-col items-center justify-center p-4 relative">
                    {getLargeFileIcon(doc.type)}
                    <div className="absolute bottom-2 px-2 py-1 bg-black bg-opacity-60 rounded-md text-white text-xs font-mono">
                      {doc.type.split('/')[1]?.toUpperCase() || 'FILE'}
                    </div>
                  </div>
                  <div className="p-4 flex-grow flex flex-col justify-between">
                    <div>
                      {/* Document Name */}
                      <h2 className="text-lg font-semibold text-white mb-2 line-clamp-2" title={doc.name}>
                        {doc.name}
                      </h2>
                      {/* Upload Date */}
                      <p className="text-sm text-gray-400 flex items-center">
                        <MdDateRange className="mr-2 text-md text-blue-300" />
                        <span className="font-light">Uploaded: {doc.uploadDate}</span>
                      </p>
                    </div>
                  </div>
                  {/* "View Details" Call to Action */}
                  <div className="bg-gray-800 p-3 text-center text-md font-medium text-blue-400 hover:text-blue-300 transition-colors border-t border-gray-700">
                    View Details
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentsPage;