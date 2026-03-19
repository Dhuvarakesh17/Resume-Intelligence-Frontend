'use client';

import { useState, useEffect, Suspense } from 'react';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import { useRouter, useSearchParams } from 'next/navigation';
import { resumeApi, ResumeResponse, ResumeScoreDetail, ResumeScoreSummary } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import ScoreDisplay from '@/components/ScoreDisplay';
import { LayoutDashboard, Upload, Lightbulb, Activity } from 'lucide-react';

function ScoreContent() {
  const { isLoading: authLoading } = useProtectedRoute();
  const router = useRouter();
  const searchParams = useSearchParams();
  const resumeId = searchParams.get('id');

  const [resumes, setResumes] = useState<ResumeResponse[]>([]);
  const [selectedResume, setSelectedResume] = useState<ResumeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSelection, setIsLoadingSelection] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading) {
      fetchResumes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading]);

  useEffect(() => {
    if (resumeId && resumes.length > 0) {
      const resume = resumes.find(r => r.resumeId.toString() === resumeId);
      if (resume) {
        handleSelectResume(resume);
      }
    }
  }, [resumeId, resumes]);

  const hasRenderableScore = (
    score: ResumeResponse['score']
  ): score is ResumeScoreDetail | ResumeScoreSummary => {
    return Boolean(score && typeof score.atsScore === 'number' && typeof score.overallScore === 'number');
  };

  const handleSelectResume = async (resume: ResumeResponse) => {
    setSelectedResume(resume);
    setIsLoadingSelection(true);

    try {
      const response = await resumeApi.getById(resume.resumeId);
      setSelectedResume(response.data);
    } catch {
      setSelectedResume(resume);
    } finally {
      setIsLoadingSelection(false);
    }
  };

  const fetchResumes = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await resumeApi.getAll();
      setResumes(response.data);
      if (response.data.length > 0 && !resumeId) {
        handleSelectResume(response.data[0]);
      }
    } catch (err) {
      setError(getErrorMessage(err) || 'Failed to load resumes');
    } finally {
      setIsLoading(false);
    }
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
              Resume Scores
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
                onClick={() => router.push('/upload')}
                className="flex-1 md:flex-none px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all shadow-sm inline-flex items-center justify-center gap-2"
              >
                <Upload size={16} />
                Upload New
              </button>
              <button
                onClick={() => router.push('/recommend')}
                className="flex-1 md:flex-none px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg transition-all shadow-sm inline-flex items-center justify-center gap-2"
              >
                <Lightbulb size={16} />
                Get Recommendations
              </button>
              <button
                onClick={() => router.push('/ml-tools')}
                className="flex-1 md:flex-none px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg transition-all shadow-sm inline-flex items-center justify-center gap-2"
              >
                <Activity size={16} />
                ML Tools
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar - Resume List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-5 sm:p-6 border border-gray-200 shadow-md lg:sticky lg:top-24">
              <h2 className="text-xl font-bold text-gray-900 mb-4">My Resumes ({resumes.length})</h2>
              
              {isLoading ? (
                <div className="text-center py-8 text-gray-600">Loading...</div>
              ) : resumes.length === 0 ? (
                <div className="text-center py-8 text-gray-600 text-sm">
                  No resumes yet. Upload one to get started!
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {resumes.map((resume) => (
                    <div
                      key={resume.resumeId}
                      onClick={() => handleSelectResume(resume)}
                      className={`p-4 rounded-lg cursor-pointer transition-all ${
                        selectedResume?.resumeId === resume.resumeId
                          ? 'bg-blue-50 border-2 border-blue-500'
                          : 'bg-gray-50 border border-gray-200 hover:border-blue-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-900 font-medium truncate text-sm">
                            {resume.fileName}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(resume.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                        {resume.score && (
                          <div className="ml-3 text-right">
                            <div className="text-lg font-bold text-blue-400">
                              {resume.score.overallScore.toFixed(0)}
                            </div>
                            {resume.score.detectedIndustry && (
                              <div className="text-[10px] text-gray-500 truncate max-w-[90px]">
                                {resume.score.detectedIndustry}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Main Content - Score Display */}
          <div className="lg:col-span-3">
            {isLoadingSelection ? (
              <div className="bg-white rounded-xl p-8 sm:p-12 border border-gray-200 shadow-md text-center">
                <div className="text-gray-600 text-lg">Loading selected resume details...</div>
              </div>
            ) : selectedResume && hasRenderableScore(selectedResume.score) ? (
              <ScoreDisplay score={selectedResume.score} />
            ) : (
              <div className="bg-white rounded-xl p-8 sm:p-12 border border-gray-200 shadow-md text-center">
                <div className="text-gray-600 text-lg">
                  {isLoading ? 'Loading...' : 'Select a resume with AI analysis to view detailed score insights'}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ScorePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-900 text-xl">Loading...</div>
      </div>
    }>
      <ScoreContent />
    </Suspense>
  );
}
