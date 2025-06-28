"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MdCloudUpload, MdCheckCircle, MdError, MdDescription } from 'react-icons/md';
import { ImSpinner2 } from 'react-icons/im';

const DocumentUploadPage = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);
  const router = useRouter();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
      setMessage(null); // Clear previous messages
    } else {
      setSelectedFile(null);
    }
  };

  const handleUpload = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedFile) {
      setMessage({ type: 'error', text: 'Please select a file to upload.' });
      return;
    }

    setLoading(true);
    setMessage({ type: 'info', text: 'Uploading document...' });

    const formData = new FormData();
    formData.append('document', selectedFile);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setMessage({ type: 'success', text: `Document "${selectedFile.name}" uploaded successfully! Document ID: ${result.documentId}` });
        setSelectedFile(null); // Clear selected file

        // Optional: Redirect to a view page if document was processed
        // For a real app, result.documentId would be used to fetch pages
        // setTimeout(() => {
        //   router.push(`/documents/view/${result.documentId}`);
        // }, 2000);

      } else {
        const errorData = await response.json();
        setMessage({ type: 'error', text: `Upload failed: ${errorData.error || 'Unknown error'}` });
      }
    } catch (error) {
      console.error('Error during upload:', error);
      setMessage({ type: 'error', text: 'An unexpected error occurred during upload.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#1F2023] text-white p-8 flex items-center justify-center">
      <div className="max-w-xl w-full bg-[#2D2E30] p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-white mb-6 text-center">Upload New Document</h1>

        {message && (
          <div className={`p-3 mb-4 rounded-md text-sm flex items-center space-x-2
            ${message.type === 'success' ? 'bg-green-500/20 text-green-300' : ''}
            ${message.type === 'error' ? 'bg-red-500/20 text-red-300' : ''}
            ${message.type === 'info' ? 'bg-blue-500/20 text-blue-300' : ''}
          `}>
            {message.type === 'success' && <MdCheckCircle className="text-xl" />}
            {message.type === 'error' && <MdError className="text-xl" />}
            {message.type === 'info' && <ImSpinner2 className="animate-spin text-xl" />}
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleUpload} className="space-y-6">
          <div>
            <label htmlFor="document-upload" className="block text-gray-300 text-sm font-medium mb-2">
              Select Document
            </label>
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="document-upload"
                className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-[#1C1C1D] hover:bg-gray-700 transition-colors"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <MdCloudUpload className="w-12 h-12 text-gray-400" />
                  <p className="mb-2 text-sm text-gray-400">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">PDF, DOCX, XLSX, JPG, PNG, etc.</p>
                </div>
                <input
                  id="document-upload"
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png" // Specify accepted file types
                  disabled={loading}
                />
              </label>
            </div>
            {selectedFile && (
              <p className="mt-2 text-sm text-gray-400 flex items-center space-x-2">
                <MdDescription className="text-md" />
                <span>Selected file: <span className="font-semibold text-white">{selectedFile.name}</span> ({ (selectedFile.size / 1024 / 1024).toFixed(2) } MB)</span>
              </p>
            )}
          </div>

          <div className="flex justify-center">
            <button
              type="submit"
              className={`bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-md flex items-center space-x-3 transition duration-200 shadow-md transform hover:scale-105 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={loading}
            >
              {loading ? (
                <>
                  <ImSpinner2 className="animate-spin text-white text-xl" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <MdCloudUpload className="text-xl" />
                  <span>Upload Document</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DocumentUploadPage;