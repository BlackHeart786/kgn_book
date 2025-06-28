// app/documents/view/[id]/page.tsx
"use client";

import { useParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { ImSpinner2 } from 'react-icons/im';
import { MdBrokenImage } from 'react-icons/md';

// Mock data for demonstration purposes. In a real app, you'd fetch this from your backend API.
const mockDocumentPages: { [key: string]: string[] } = {
  'doc_1700000000000': [ // Example ID, replace with actual ID from upload
    'https://via.placeholder.com/600x800?text=Page+1',
    'https://via.placeholder.com/600x800?text=Page+2',
    'https://via.placeholder.com/600x800?text=Page+3',
    'https://via.placeholder.com/600x800?text=Page+4',
  ],
  // Add more mock document IDs and their page URLs here
};

const ViewDocumentPage = () => {
  const params = useParams();
  const documentId = params.id as string;
  const [pages, setPages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // In a real application, you would make an API call here:
    // fetch(`/api/documents/${documentId}/pages`)
    //   .then(res => res.json())
    //   .then(data => {
    //     if (data.pages) {
    //       setPages(data.pages);
    //     } else {
    //       setError("Document pages not found.");
    //     }
    //   })
    //   .catch(err => {
    //     console.error("Error fetching document pages:", err);
    //     setError("Failed to load document pages.");
    //   })
    //   .finally(() => setLoading(false));

    // For demonstration, use mock data:
    setTimeout(() => { // Simulate network delay
      const fetchedPages = mockDocumentPages[documentId];
      if (fetchedPages) {
        setPages(fetchedPages);
      } else {
        setError(`Document with ID "${documentId}" not found in mock data.`);
      }
      setLoading(false);
    }, 1500);

  }, [documentId]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-[#1F2023] text-white p-8 flex items-center justify-center flex-col">
        <ImSpinner2 className="animate-spin text-4xl text-blue-400 mb-4" />
        <p className="text-xl">Loading document pages...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-[#1F2023] text-red-300 p-8 flex items-center justify-center flex-col">
        <MdError className="text-4xl mb-4" />
        <p className="text-xl">Error: {error}</p>
        <p className="text-lg text-gray-400 mt-2">Make sure you've uploaded a document and its ID is correct.</p>
        <p className="text-sm text-gray-500 mt-1">If this is a fresh upload, you might need to manually add its ID to `mockDocumentPages` in this file for demonstration.</p>
      </div>
    );
  }

  if (pages.length === 0) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-[#1F2023] text-gray-400 p-8 flex items-center justify-center flex-col">
        <MdDescription className="text-4xl mb-4" />
        <p className="text-xl">No pages found for this document.</p>
        <p className="text-sm text-gray-500 mt-2">This might happen if the uploaded document was not a multi-page file (like PDF).</p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#1F2023] text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6 text-center">Document Viewer (ID: {documentId})</h1>
        <p className="text-sm text-gray-400 mb-6 text-center">
          (Note: In a real app, these images would be generated from your uploaded document by the server.)
        </p>

        <div className="space-y-8">
          {pages.map((pageUrl, index) => (
            <div key={index} className="bg-[#2D2E30] p-4 rounded-lg shadow-lg">
              <h2 className="text-xl font-semibold text-white mb-4">Page {index + 1}</h2>
              <div className="flex justify-center items-center bg-gray-800 p-2 rounded-md">
                
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ViewDocumentPage;