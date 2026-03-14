'use client';

import { useState, useEffect, type MouseEvent } from 'react';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { mlApi, resumeApi, ResumeResponse, ResumeScoreDetail } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import ResumeUploader from '@/components/ResumeUploader';
import ScoreDisplay from '@/components/ScoreDisplay';
import MagicBento from '@/components/MagicBento';
import { 
  Upload, BarChart3, Lightbulb, LogOut, User, Users,
  Filter, Sparkles, TrendingUp,
  Layers, GitCompare, Brain, Target
} from 'lucide-react';

export default function DashboardPage() {
  const { isLoading: authLoading } = useProtectedRoute();
  const { logout } = useAuth();
  const router = useRouter();
  const [resumes, setResumes] = useState<ResumeResponse[]>([]);
  const [selectedResume, setSelectedResume] = useState<ResumeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isLoadingSelection, setIsLoadingSelection] = useState(false);
  const [mlHealth, setMlHealth] = useState<{ status?: string; skills_loaded?: number } | null>(null);
  const [mlVersion, setMlVersion] = useState<string>('');

  useEffect(() => {
    if (!authLoading) {
      fetchResumes();
      fetchMlStatus();
    }
  }, [authLoading]);

  const fetchResumes = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await resumeApi.getAll();
      setResumes(response.data);
    } catch (err) {
      setError(getErrorMessage(err) || 'Failed to load resumes');
    } finally {
      setIsLoading(false);
    }
  };

  const hasDetailedScore = (score: ResumeResponse['score']): score is ResumeScoreDetail => {
    return Boolean(score && 'predictedRole' in score && 'wordQualityScore' in score);
  };

  const handleUploadSuccess = (newResume: ResumeResponse) => {
    setResumes([newResume, ...resumes]);
    setSelectedResume(newResume);
  };

  const handleSelectResume = async (resume: ResumeResponse) => {
    setSelectedResume(resume);
    setIsLoadingSelection(true);

    try {
      const response = await resumeApi.getById(resume.resumeId);
      setSelectedResume(response.data);
    } catch {
      // Keep fallback list item data if detailed fetch fails.
      setSelectedResume(resume);
    } finally {
      setIsLoadingSelection(false);
    }
  };

  const fetchMlStatus = async () => {
    try {
      const [healthResp, statsResp] = await Promise.all([mlApi.health(), mlApi.stats()]);
      setMlHealth(healthResp.data);
      setMlVersion(statsResp.data.version || 'unknown');
    } catch {
      setMlHealth({ status: 'offline', skills_loaded: 0 });
      setMlVersion('unavailable');
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const navigateFromMlTile = (event: MouseEvent<HTMLButtonElement>, path: string) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const origin = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
      time: Date.now(),
    };
    sessionStorage.setItem('mlTransitionOrigin', JSON.stringify(origin));
    router.push(path);
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
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">
              Resume Intelligence AI
            </h1>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/upload')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all shadow-sm hover:shadow-md flex items-center gap-2"
              >
                <Upload size={16} />
                Upload
              </button>
              <button
                onClick={() => router.push('/score')}
                className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg transition-all shadow-sm hover:shadow-md flex items-center gap-2"
              >
                <BarChart3 size={16} />
                Scores
              </button>
              <button
                onClick={() => router.push('/recommend')}
                className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg transition-all shadow-sm hover:shadow-md flex items-center gap-2"
              >
                <Lightbulb size={16} />
                Recommendations
              </button>
              <button
                onClick={() => router.push('/profile')}
                className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg transition-all shadow-sm hover:shadow-md flex items-center gap-2"
              >
                <User size={16} />
                Profile
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all flex items-center gap-2"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <section className="mb-6 bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">ML Service Status</p>
              <p className="text-base font-semibold text-gray-900">
                {(mlHealth?.status || 'unknown').toUpperCase()} • {mlVersion}
              </p>
            </div>
            <div className="text-sm text-gray-600">Skills Loaded: {mlHealth?.skills_loaded ?? '-'}</div>
          </div>
        </section>

        {/* ML Tools Quick Access */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">ML Analysis Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={(event) => navigateFromMlTile(event, '/ml/analyze')}
              className="bg-white hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 rounded-xl p-5 border border-gray-200 hover:border-blue-300 transition-all shadow-sm hover:shadow-md text-left group"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-100 group-hover:bg-blue-200 rounded-lg flex items-center justify-center transition-colors">
                  <Sparkles className="text-blue-600" size={20} />
                </div>
                <h3 className="font-semibold text-gray-900">Enhanced Analysis</h3>
              </div>
              <p className="text-sm text-gray-600">Deep ML analysis with confidence metrics</p>
            </button>

            <button
              onClick={(event) => navigateFromMlTile(event, '/ml/deep-analysis')}
              className="bg-white hover:bg-gradient-to-br hover:from-purple-50 hover:to-pink-50 rounded-xl p-5 border border-gray-200 hover:border-purple-300 transition-all shadow-sm hover:shadow-md text-left group"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-purple-100 group-hover:bg-purple-200 rounded-lg flex items-center justify-center transition-colors">
                  <Brain className="text-purple-600" size={20} />
                </div>
                <h3 className="font-semibold text-gray-900">Deep ML Analysis</h3>
              </div>
              <p className="text-sm text-gray-600">BERT embeddings + NLP insights</p>
            </button>

            <button
              onClick={(event) => navigateFromMlTile(event, '/ml/industry')}
              className="bg-white hover:bg-gradient-to-br hover:from-green-50 hover:to-emerald-50 rounded-xl p-5 border border-gray-200 hover:border-green-300 transition-all shadow-sm hover:shadow-md text-left group"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-green-100 group-hover:bg-green-200 rounded-lg flex items-center justify-center transition-colors">
                  <Target className="text-green-600" size={20} />
                </div>
                <h3 className="font-semibold text-gray-900">Industry Detection</h3>
              </div>
              <p className="text-sm text-gray-600">Auto-detect best-fit industry</p>
            </button>

            <button
              onClick={(event) => navigateFromMlTile(event, '/ml/compare')}
              className="bg-white hover:bg-gradient-to-br hover:from-orange-50 hover:to-amber-50 rounded-xl p-5 border border-gray-200 hover:border-orange-300 transition-all shadow-sm hover:shadow-md text-left group"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-orange-100 group-hover:bg-orange-200 rounded-lg flex items-center justify-center transition-colors">
                  <GitCompare className="text-orange-600" size={20} />
                </div>
                <h3 className="font-semibold text-gray-900">Compare Resumes</h3>
              </div>
              <p className="text-sm text-gray-600">Side-by-side resume comparison</p>
            </button>

            <button
              onClick={(event) => navigateFromMlTile(event, '/ml/batch')}
              className="bg-white hover:bg-gradient-to-br hover:from-teal-50 hover:to-cyan-50 rounded-xl p-5 border border-gray-200 hover:border-teal-300 transition-all shadow-sm hover:shadow-md text-left group"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-teal-100 group-hover:bg-teal-200 rounded-lg flex items-center justify-center transition-colors">
                  <Layers className="text-teal-600" size={20} />
                </div>
                <h3 className="font-semibold text-gray-900">Batch Processing</h3>
              </div>
              <p className="text-sm text-gray-600">Process 100+ resumes in parallel</p>
            </button>

            <button
              onClick={(event) => navigateFromMlTile(event, '/ml/rank')}
              className="bg-white hover:bg-gradient-to-br hover:from-red-50 hover:to-rose-50 rounded-xl p-5 border border-gray-200 hover:border-red-300 transition-all shadow-sm hover:shadow-md text-left group"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-red-100 group-hover:bg-red-200 rounded-lg flex items-center justify-center transition-colors">
                  <TrendingUp className="text-red-600" size={20} />
                </div>
                <h3 className="font-semibold text-gray-900">Smart Ranking</h3>
              </div>
              <p className="text-sm text-gray-600">Rank candidates by custom criteria</p>
            </button>

            <button
              onClick={(event) => navigateFromMlTile(event, '/ml/filter')}
              className="bg-white hover:bg-gradient-to-br hover:from-violet-50 hover:to-purple-50 rounded-xl p-5 border border-gray-200 hover:border-violet-300 transition-all shadow-sm hover:shadow-md text-left group"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-violet-100 group-hover:bg-violet-200 rounded-lg flex items-center justify-center transition-colors">
                  <Filter className="text-violet-600" size={20} />
                </div>
                <h3 className="font-semibold text-gray-900">Filter Candidates</h3>
              </div>
              <p className="text-sm text-gray-600">Filter by skills & requirements</p>
            </button>

            <button
              onClick={(event) => navigateFromMlTile(event, '/ml/find-best')}
              className="bg-white hover:bg-gradient-to-br hover:from-yellow-50 hover:to-amber-50 rounded-xl p-5 border border-gray-200 hover:border-yellow-300 transition-all shadow-sm hover:shadow-md text-left group"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-yellow-100 group-hover:bg-yellow-200 rounded-lg flex items-center justify-center transition-colors">
                  <Users className="text-yellow-600" size={20} />
                </div>
                <h3 className="font-semibold text-gray-900">Find Best Candidate</h3>
              </div>
              <p className="text-sm text-gray-600">Find optimal candidate with weights</p>
            </button>
          </div>
        </section>

        <section className="mb-8 rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-100">Resume Intelligence Capabilities</h2>
            <p className="text-sm text-slate-400">Interactive overview of what the AI analysis covers.</p>
          </div>
          <MagicBento
            enableSpotlight={false}
            enableStars={true}
            enableTilt={false}
            clickEffect={false}
            glowColor="37, 99, 235"
            enableMagnetism={false}
          />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Sidebar - Upload & Resume List */}
          <div className="lg:col-span-1 space-y-6">
            <ResumeUploader onUploadSuccess={handleUploadSuccess} />

            {/* Resume List */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-md">
              <h2 className="text-xl font-bold text-gray-900 mb-4">My Resumes ({resumes.length})</h2>
              
              {isLoading ? (
                <div className="text-center py-8 text-gray-600">Loading resumes...</div>
              ) : resumes.length === 0 ? (
                <div className="text-center py-8 text-gray-600">
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
                          <p className="text-gray-900 font-medium truncate">
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
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Content - Selected Resume Details */}
          <div className="lg:col-span-2">
            {selectedResume ? (
              <div className="space-y-6">
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-md">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{selectedResume.fileName}</h2>
                      <p className="text-sm text-gray-500 mt-1">
                        Uploaded: {new Date(selectedResume.uploadedAt).toLocaleString()}
                      </p>
                    </div>
                    <a
                      href={selectedResume.blobUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                    >
                      Download Resume
                    </a>
                  </div>
                </div>

                {isLoadingSelection ? (
                  <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-md text-center">
                    <p className="text-gray-600">Loading selected resume details...</p>
                  </div>
                ) : hasDetailedScore(selectedResume.score) ? (
                  <ScoreDisplay score={selectedResume.score} />
                ) : (
                  <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 border border-gray-700 text-center">
                    <div className="text-gray-400">
                      <svg
                        className="mx-auto h-12 w-12 mb-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <p className="text-lg">No AI analysis available</p>
                      <p className="text-sm mt-2">
                        This resume was uploaded without a job description.
                        <br />
                        Upload a new resume with a job description to get AI-powered insights.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-12 border border-gray-700 text-center h-full flex items-center justify-center">
                <div className="text-gray-400">
                  <svg
                    className="mx-auto h-16 w-16 mb-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <p className="text-xl">Select a resume to view details</p>
                  <p className="text-sm mt-2">
                    Choose from your uploaded resumes or upload a new one
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
