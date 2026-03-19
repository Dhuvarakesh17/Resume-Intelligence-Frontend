'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import { useRouter } from 'next/navigation';
import { mlApi, resumeApi, ResumeResponse, RankingResult } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { ArrowLeft, TrendingUp, Loader2, CheckCircle2, AlertCircle, Trophy } from 'lucide-react';

export default function SmartRankingPage() {
  const { isLoading: authLoading } = useProtectedRoute();
  const router = useRouter();

  const [resumes, setResumes] = useState<ResumeResponse[]>([]);
  const [selectedResumeIds, setSelectedResumeIds] = useState<string[]>([]);
  const [jobDescription, setJobDescription] = useState('');
  const [rankBy, setRankBy] = useState<'ats_score' | 'enhanced_score' | 'industry_score'>('ats_score');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<RankingResult | null>(null);

  useEffect(() => {
    if (!authLoading) {
      fetchResumes();
    }
  }, [authLoading]);

  const fetchResumes = async () => {
    try {
      const response = await resumeApi.getAll();
      setResumes(response.data);
    } catch (err) {
      setError(getErrorMessage(err) || 'Failed to load resumes');
    }
  };

  const toggleResume = (resumeId: string) => {
    if (selectedResumeIds.includes(resumeId)) {
      setSelectedResumeIds(selectedResumeIds.filter(id => id !== resumeId));
    } else {
      setSelectedResumeIds([...selectedResumeIds, resumeId]);
    }
  };

  const selectAll = () => {
    setSelectedResumeIds(resumes.map(r => r.resumeId.toString()));
  };

  const handleRank = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedResumeIds.length === 0) {
      setError('Please select at least one resume');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const resumeData = await Promise.all(
        selectedResumeIds.map(async (id) => {
          const response = await resumeApi.getById(parseInt(id));
          const resume = response.data;
          const text = resume.extractedText || resume.resumeText || resume.text || '';
          return { id, text };
        })
      );

      const response = await mlApi.smartRank(
        resumeData,
        jobDescription || undefined,
        rankBy
      );
      
      setResult(response.data);
    } catch (err) {
      setError(getErrorMessage(err) || 'Failed to rank resumes');
    } finally {
      setLoading(false);
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
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-rose-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-700 hover:text-gray-900"
              title="Back to Dashboard"
            >
              <ArrowLeft size={24} className="stroke-2" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="text-red-600" size={20} />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Smart Ranking</h1>
                <p className="text-sm text-gray-600">Rank candidates by custom scoring criteria</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="order-2 lg:order-1 space-y-6">
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Select Resumes ({selectedResumeIds.length})</h2>
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Select All
                </button>
              </div>

              <div className="max-h-[350px] overflow-y-auto space-y-2">
                {resumes.map((resume) => (
                  <label
                    key={resume.resumeId}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedResumeIds.includes(resume.resumeId.toString())
                        ? 'bg-red-50 border border-red-300'
                        : 'bg-gray-50 border border-gray-200 hover:border-red-200'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedResumeIds.includes(resume.resumeId.toString())}
                      onChange={() => toggleResume(resume.resumeId.toString())}
                      className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{resume.fileName}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <form onSubmit={handleRank} className="space-y-6">
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-md">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ranking Criteria
                </label>
                <select
                  value={rankBy}
                  onChange={(e) => setRankBy(e.target.value as 'ats_score' | 'enhanced_score' | 'industry_score')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent mb-4"
                >
                  <option value="ats_score">ATS Score (Semantic Match)</option>
                  <option value="enhanced_score">Enhanced Score (ML + Confidence)</option>
                  <option value="industry_score">Industry Score (Best-Fit Industry)</option>
                </select>

                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Description (optional but recommended)
                </label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste job description..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent min-h-[120px] text-gray-900"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 font-medium"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Ranking...
                  </>
                ) : (
                  <>
                    <TrendingUp size={20} />
                    Rank Resumes
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Results */}
          <div className="order-1 lg:order-2 space-y-6">
            {result ? (
              <>
                {/* Status Card */}
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-md">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Ranked Results</h2>
                    <CheckCircle2 className="text-green-600" size={24} />
                  </div>
                  <p className="text-sm text-gray-600">
                    Ranked by: <span className="font-semibold text-gray-900">{rankBy.replace('_', ' ')}</span>
                  </p>
                </div>

                {/* Ranking List */}
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-md">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Rankings</h3>
                  <div className="space-y-3">
                    {result.ranked_resumes.map((item, idx) => {
                      const resume = resumes.find(r => r.resumeId.toString() === item.id);
                      return (
                        <div
                          key={idx}
                          className={`border-2 rounded-lg p-4 transition-all ${
                            idx === 0 ? 'border-yellow-400 bg-yellow-50' :
                            idx === 1 ? 'border-gray-400 bg-gray-50' :
                            idx === 2 ? 'border-orange-400 bg-orange-50' :
                            'border-gray-200 bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg ${
                              idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                              idx === 1 ? 'bg-gray-200 text-gray-700' :
                              idx === 2 ? 'bg-orange-100 text-orange-700' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {idx === 0 && <Trophy size={24} />}
                              {idx !== 0 && item.rank}
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900">
                                {resume?.fileName || `Resume ${item.id}`}
                              </p>
                              <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                                <span>Score: <strong>{item.score.toFixed(1)}</strong></span>
                                {item.confidence && (
                                  <span>Confidence: {item.confidence.toFixed(1)}%</span>
                                )}
                              </div>
                              {item.industry && (
                                <span className="inline-block mt-2 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                                  {item.industry}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-xl p-8 sm:p-12 border border-gray-200 shadow-md flex flex-col items-center justify-center min-h-[360px] sm:min-h-[500px]">
                <div className="mb-6 relative w-full h-64 flex items-center justify-center">
                  <Image
                    src="/Smart-ranking.jpg"
                    alt="Smart Ranking"
                    width={300}
                    height={250}
                    className="object-contain"
                    priority
                  />
                </div>
                <div className="flex items-center gap-2 text-gray-600 text-lg font-medium">
                  <TrendingUp size={18} className="text-red-600" />
                  <span>Select resumes and rank to see results</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
                  <Trophy size={16} className="text-yellow-600" />
                  <span>Choose from 3 ranking criteria</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
