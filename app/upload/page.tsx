'use client';

import { useState } from 'react';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import { useRouter } from 'next/navigation';
import ResumeUploader from '@/components/ResumeUploader';
import { ResumeResponse } from '@/lib/api';
import { LayoutDashboard, BarChart3, BarChart, Target, Lightbulb, CheckCircle } from 'lucide-react';

export default function UploadPage() {
  const { isLoading: authLoading } = useProtectedRoute();
  const router = useRouter();
  const [uploadedResume, setUploadedResume] = useState<ResumeResponse | null>(null);

  const handleUploadSuccess = (newResume: ResumeResponse) => {
    setUploadedResume(newResume);
    // Redirect to score page after successful upload
    setTimeout(() => {
      router.push(`/score?id=${newResume.resumeId}`);
    }, 1500);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-900 text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center md:text-left">
              Upload Resume
            </h1>
            <div className="flex w-full flex-wrap gap-2 sm:gap-4 md:w-auto">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex-1 md:flex-none px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg transition-all shadow-sm inline-flex items-center justify-center gap-2"
              >
                <LayoutDashboard size={16} />
                Dashboard
              </button>
              <button
                onClick={() => router.push('/score')}
                className="flex-1 md:flex-none px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg transition-all shadow-sm inline-flex items-center justify-center gap-2"
              >
                <BarChart3 size={16} />
                View Scores
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Upload Your Resume
          </h2>
          <p className="text-base sm:text-xl text-gray-600">
            Get instant AI-powered analysis and recommendations
          </p>
        </div>

        <div className="bg-white rounded-xl p-5 sm:p-8 border border-gray-200 shadow-lg">
          <ResumeUploader onUploadSuccess={handleUploadSuccess} />
          
          {uploadedResume && (
            <div className="mt-8 p-4 sm:p-6 bg-green-50 border border-green-200 text-green-700 rounded-lg text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <CheckCircle size={24} />
                <p className="text-lg font-semibold">Upload Successful!</p>
              </div>
              <p className="text-sm mt-2">Redirecting to score page...</p>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="mt-12 sm:mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg p-5 sm:p-6 border border-gray-200 shadow-md">
            <div className="mb-3">
              <BarChart className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-gray-900 font-semibold mb-2">ATS Score Analysis</h3>
            <p className="text-gray-600 text-sm">
              Get detailed scoring on how well your resume performs with ATS systems
            </p>
          </div>
          <div className="bg-white rounded-lg p-5 sm:p-6 border border-gray-200 shadow-md">
            <div className="mb-3">
              <Target className="w-8 h-8 text-indigo-600" />
            </div>
            <h3 className="text-gray-900 font-semibold mb-2">Role Prediction</h3>
            <p className="text-gray-600 text-sm">
              AI identifies the best-fit roles based on your experience and skills
            </p>
          </div>
          <div className="bg-white rounded-lg p-5 sm:p-6 border border-gray-200 shadow-md">
            <div className="mb-3">
              <Lightbulb className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-gray-900 font-semibold mb-2">Smart Recommendations</h3>
            <p className="text-gray-600 text-sm">
              Receive actionable feedback to improve your resume&apos;s effectiveness
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
