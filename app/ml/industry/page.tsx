'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import { useRouter } from 'next/navigation';
import { mlApi, resumeApi, ResumeResponse } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { ArrowLeft, Target, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface IndustryScoreResult {
  best_fit_industry: {
    industry: string;
    industry_score: number;
    confidence: number;
    skill_coverage: number;
    matching_skills: string[];
    missing_key_skills: string[];
    recommended_certifications: string[];
  };
  all_industry_matches: Array<{
    industry: string;
    confidence: number;
  }>;
  available_industries: string[];
}

export default function IndustryDetectionPage() {
  const { isLoading: authLoading } = useProtectedRoute();
  const router = useRouter();

  const [resumes, setResumes] = useState<ResumeResponse[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<IndustryScoreResult | null>(null);

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

  const loadResumeText = async (resumeId: string) => {
    if (!resumeId) return;
    setError('');
    try {
      const response = await resumeApi.getById(parseInt(resumeId));
      const resume = response.data;
      const text = resume.extractedText || resume.resumeText || resume.text || '';
      if (text) {
        setResumeText(text);
      } else {
        setError('No text content found in resume.');
      }
    } catch (err) {
      setError(getErrorMessage(err) || 'Failed to load resume text');
    }
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resumeText.trim()) {
      setError('Resume text is required');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await mlApi.industryScore(resumeText, jobDescription || undefined);
      setResult(response.data as unknown as IndustryScoreResult);
    } catch (err) {
      setError(getErrorMessage(err) || 'Failed to detect industry');
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
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
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Target className="text-green-600" size={20} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Industry Detection</h1>
                <p className="text-sm text-gray-600">Auto-detect best-fit industry with 8+ profiles</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-md">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Input</h2>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Resume
                </label>
                <select
                  value={selectedResumeId}
                  onChange={(e) => {
                    setSelectedResumeId(e.target.value);
                    loadResumeText(e.target.value);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">-- Select a resume --</option>
                  {resumes.map((resume) => (
                    <option key={resume.resumeId} value={resume.resumeId}>
                      {resume.fileName}
                    </option>
                  ))}
                </select>
              </div>

              <form onSubmit={handleAnalyze} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Resume Text *
                  </label>
                  <textarea
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    placeholder="Paste resume text..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent min-h-[250px] font-mono text-sm text-gray-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Description (optional)
                  </label>
                  <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Optional - provides context for industry matching..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent min-h-[100px] font-mono text-sm text-gray-900"
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
                  className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 font-medium"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Detecting Industry...
                    </>
                  ) : (
                    <>
                      <Target size={20} />
                      Detect Industry
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Results */}
          <div className="space-y-6">
            {result ? (
              <>
                {/* Best Fit Industry */}
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-md">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-gray-900">Best Fit Industry</h2>
                    <CheckCircle2 className="text-green-600" size={24} />
                  </div>
                  
                  <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-lg p-6 mb-6">
                    <p className="text-3xl font-bold text-green-900 mb-2">
                      {result.best_fit_industry.industry}
                    </p>
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="text-green-700">Score</p>
                        <p className="font-semibold text-green-900">{result.best_fit_industry.industry_score.toFixed(1)}</p>
                      </div>
                      <div>
                        <p className="text-green-700">Confidence</p>
                        <p className="font-semibold text-green-900">{result.best_fit_industry.confidence.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-green-700">Skill Coverage</p>
                        <p className="font-semibold text-green-900">{result.best_fit_industry.skill_coverage.toFixed(1)}%</p>
                      </div>
                    </div>
                  </div>

                  {/* Matching Skills */}
                  {result.best_fit_industry.matching_skills.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Matching Skills</p>
                      <div className="flex flex-wrap gap-2">
                        {result.best_fit_industry.matching_skills.map((skill, idx) => (
                          <span key={idx} className="px-3 py-1 bg-green-50 text-green-700 text-sm rounded-full border border-green-200">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Missing Skills */}
                  {result.best_fit_industry.missing_key_skills.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Missing Key Skills</p>
                      <div className="flex flex-wrap gap-2">
                        {result.best_fit_industry.missing_key_skills.map((skill, idx) => (
                          <span key={idx} className="px-3 py-1 bg-red-50 text-red-700 text-sm rounded-full border border-red-200">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommended Certifications */}
                  {result.best_fit_industry.recommended_certifications.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Recommended Certifications</p>
                      <div className="flex flex-wrap gap-2">
                        {result.best_fit_industry.recommended_certifications.map((cert, idx) => (
                          <span key={idx} className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full border border-blue-200">
                            {cert}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* All Industry Matches */}
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-md">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">All Industry Matches</h3>
                  <div className="space-y-3">
                    {result.all_industry_matches
                      .sort((a, b) => b.confidence - a.confidence)
                      .map((match, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                              idx === 0 ? 'bg-green-100 text-green-700' :
                              idx === 1 ? 'bg-blue-100 text-blue-700' :
                              idx === 2 ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {idx + 1}
                            </div>
                            <p className="text-sm font-medium text-gray-900">{match.industry}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <p className="text-sm font-semibold text-gray-900">{match.confidence.toFixed(1)}%</p>
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  idx === 0 ? 'bg-green-600' :
                                  idx === 1 ? 'bg-blue-600' :
                                  idx === 2 ? 'bg-yellow-600' :
                                  'bg-gray-600'
                                }`}
                                style={{ width: `${match.confidence}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Available Industries */}
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-md">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Available Industries ({result.available_industries.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {result.available_industries.map((industry, idx) => (
                      <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                        {industry}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-xl p-12 border border-gray-200 shadow-md flex flex-col items-center justify-center min-h-[500px]">
                <div className="mb-6 relative w-full h-64 flex items-center justify-center">
                  <Image
                    src="/industry-collaboration.jpg"
                    alt="Industry Detection"
                    width={300}
                    height={250}
                    className="object-contain"
                    priority
                  />
                </div>
                <div className="flex items-center gap-2 text-gray-600 text-lg font-medium">
                  <Target size={18} className="text-green-600" />
                  <span>Detect industry to see matching results</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  <span>8+ industry profiles supported</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
