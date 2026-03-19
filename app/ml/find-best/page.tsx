'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import { useRouter } from 'next/navigation';
import { mlApi, resumeApi, ResumeResponse } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { ArrowLeft, Users, Loader2, AlertCircle, Trophy, Award } from 'lucide-react';

interface BestCandidateResult {
  best_resume_id: string;
  score: number;
}

export default function FindBestCandidatePage() {
  const { isLoading: authLoading } = useProtectedRoute();
  const router = useRouter();

  const [resumes, setResumes] = useState<ResumeResponse[]>([]);
  const [selectedResumeIds, setSelectedResumeIds] = useState<string[]>([]);
  const [jobDescription, setJobDescription] = useState('');
  const [atsWeight, setAtsWeight] = useState(35);
  const [enhancedWeight, setEnhancedWeight] = useState(40);
  const [industryWeight, setIndustryWeight] = useState(25);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<BestCandidateResult | null>(null);

  useEffect(() => {
    if (!authLoading) {
      fetchResumes();
    }
  }, [authLoading]);

  // Auto-adjust weights to sum to 100
  useEffect(() => {
    const total = atsWeight + enhancedWeight + industryWeight;
    if (total !== 100) {
      const scale = 100 / total;
      setAtsWeight(Math.round(atsWeight * scale));
      setEnhancedWeight(Math.round(enhancedWeight * scale));
      setIndustryWeight(100 - Math.round(atsWeight * scale) - Math.round(enhancedWeight * scale));
    }
  }, [atsWeight, enhancedWeight, industryWeight]);

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

  const handleFindBest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedResumeIds.length === 0) {
      setError('Please select at least one resume');
      return;
    }

    if (!jobDescription.trim()) {
      setError('Job description is required');
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

      const response = await mlApi.findBestCandidate(
        resumeData,
        jobDescription,
        {
          ats: atsWeight / 100,
          enhanced: enhancedWeight / 100,
          industry: industryWeight / 100,
        }
      );
      
      setResult(response.data);
    } catch (err) {
      setError(getErrorMessage(err) || 'Failed to find best candidate');
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

  const totalWeight = atsWeight + enhancedWeight + industryWeight;

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-amber-50">
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
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Users className="text-yellow-600" size={20} />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Find Best Candidate</h1>
                <p className="text-sm text-gray-600">Optimal candidate with customizable weights</p>
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
                <h2 className="text-lg font-semibold text-gray-900">Select Candidates ({selectedResumeIds.length})</h2>
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-sm text-yellow-600 hover:text-yellow-700"
                >
                  Select All
                </button>
              </div>

              <div className="max-h-[300px] overflow-y-auto space-y-2">
                {resumes.map((resume) => (
                  <label
                    key={resume.resumeId}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedResumeIds.includes(resume.resumeId.toString())
                        ? 'bg-yellow-50 border border-yellow-300'
                        : 'bg-gray-50 border border-gray-200 hover:border-yellow-200'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedResumeIds.includes(resume.resumeId.toString())}
                      onChange={() => toggleResume(resume.resumeId.toString())}
                      className="w-4 h-4 text-yellow-600 rounded focus:ring-yellow-500"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{resume.fileName}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <form onSubmit={handleFindBest} className="space-y-6">
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-md">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">
                  Scoring Weights {totalWeight !== 100 && (
                    <span className="text-red-600 text-xs ml-2">(Auto-adjusting to 100%)</span>
                  )}
                </h3>

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-700">ATS Match</label>
                      <span className="text-sm font-bold text-blue-600">{atsWeight}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={atsWeight}
                      onChange={(e) => setAtsWeight(parseInt(e.target.value))}
                      className="w-full accent-blue-600"
                    />
                    <p className="text-xs text-gray-500 mt-1">Semantic match with job description</p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-700">Enhanced Score</label>
                      <span className="text-sm font-bold text-green-600">{enhancedWeight}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={enhancedWeight}
                      onChange={(e) => setEnhancedWeight(parseInt(e.target.value))}
                      className="w-full accent-green-600"
                    />
                    <p className="text-xs text-gray-500 mt-1">ML analysis with confidence metrics</p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-700">Industry Fit</label>
                      <span className="text-sm font-bold text-purple-600">{industryWeight}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={industryWeight}
                      onChange={(e) => setIndustryWeight(parseInt(e.target.value))}
                      className="w-full accent-purple-600"
                    />
                    <p className="text-xs text-gray-500 mt-1">Industry-specific scoring</p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700">Total Weight</span>
                    <span className={`font-bold ${totalWeight === 100 ? 'text-green-600' : 'text-red-600'}`}>
                      {totalWeight}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-md">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Description *
                </label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Required for candidate evaluation..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent min-h-[150px] text-gray-900"
                  required
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
                className="w-full px-6 py-3 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 text-white rounded-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 font-medium"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Finding Best Candidate...
                  </>
                ) : (
                  <>
                    <Trophy size={20} />
                    Find Best Candidate
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Results */}
          <div className="order-1 lg:order-2 space-y-6">
            {result ? (
              <>
                {/* Winner Card */}
                <div className="bg-gradient-to-br from-yellow-50 to-amber-100 rounded-xl p-8 border-2 border-yellow-400 shadow-lg">
                  <div className="flex items-center justify-center mb-6">
                    <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center">
                      <Trophy className="text-white" size={32} />
                    </div>
                  </div>
                  
                  <h2 className="text-xl sm:text-2xl font-bold text-center text-gray-900 mb-2">Best Candidate</h2>
                  
                  {(() => {
                    const bestResume = resumes.find(r => r.resumeId.toString() === result.best_resume_id);
                    return (
                      <>
                        <p className="text-xl font-semibold text-center text-yellow-900 mb-4">
                          {bestResume?.fileName || `Resume ${result.best_resume_id}`}
                        </p>
                        
                        <div className="bg-white rounded-lg p-4">
                          <div className="text-center">
                            <p className="text-sm text-gray-600 mb-1">Composite Score</p>
                            <p className="text-3xl sm:text-4xl font-bold text-yellow-600">{result.score.toFixed(1)}</p>
                          </div>
                        </div>

                        {bestResume && (
                          <div className="mt-4 space-y-2 text-sm text-gray-700">
                            <div className="flex items-center justify-between">
                              <span>Uploaded:</span>
                              <span className="font-medium">{new Date(bestResume.uploadedAt).toLocaleDateString()}</span>
                            </div>
                            {bestResume.score && (
                              <>
                                <div className="flex items-center justify-between">
                                  <span>Overall Score:</span>
                                  <span className="font-medium">{bestResume.score.overallScore}</span>
                                </div>
                                {bestResume.score.predictedRole && (
                                  <div className="flex items-center justify-between">
                                    <span>Role:</span>
                                    <span className="font-medium">{bestResume.score.predictedRole}</span>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>

                {/* Scoring Breakdown */}
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-md">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Award size={20} className="text-yellow-600" />
                    Scoring Breakdown
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-600 rounded"></div>
                        <span className="text-sm text-gray-700">ATS Match</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{atsWeight}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-600 rounded"></div>
                        <span className="text-sm text-gray-700">Enhanced Score</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{enhancedWeight}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-purple-600 rounded"></div>
                        <span className="text-sm text-gray-700">Industry Fit</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{industryWeight}%</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-600">
                      The composite score is calculated using a weighted combination of ATS match, enhanced ML analysis, and industry-specific scoring.
                    </p>
                  </div>
                </div>

                {/* All Candidates */}
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-md">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">All Candidates</h3>
                  <div className="space-y-2">
                    {selectedResumeIds.map((id) => {
                      const resume = resumes.find(r => r.resumeId.toString() === id);
                      const isBest = id === result.best_resume_id;
                      return (
                        <div
                          key={id}
                          className={`p-3 rounded-lg border ${
                            isBest
                              ? 'border-yellow-400 bg-yellow-50'
                              : 'border-gray-200 bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {isBest && <Trophy className="text-yellow-600" size={16} />}
                              <p className="text-sm font-medium text-gray-900">
                                {resume?.fileName || `Resume ${id}`}
                              </p>
                            </div>
                            {isBest && (
                              <span className="px-2 py-1 bg-yellow-200 text-yellow-800 text-xs rounded font-medium">
                                BEST
                              </span>
                            )}
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
                    src="/best-candidate.jpg"
                    alt="Find Best Candidate"
                    width={300}
                    height={250}
                    className="object-contain"
                    priority
                  />
                </div>
                <div className="flex items-center gap-2 text-gray-600 text-lg font-medium">
                  <Award size={18} className="text-amber-600" />
                  <span>Configure weights and find the best candidate</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
                  <Trophy size={16} className="text-yellow-600" />
                  <span>Uses composite scoring with customizable criteria</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
