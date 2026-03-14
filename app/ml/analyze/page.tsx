'use client';

import { useState, useEffect } from 'react';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { mlApi, resumeApi, ResumeResponse, EnhancedMlResponse } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { ArrowLeft, Sparkles, FileText, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function EnhancedAnalysisPage() {
  const { isLoading: authLoading } = useProtectedRoute();
  const router = useRouter();

  const [resumes, setResumes] = useState<ResumeResponse[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<EnhancedMlResponse | null>(null);

  const formatNumber = (value: unknown, digits = 1, suffix = '') => {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      return 'N/A';
    }
    return `${value.toFixed(digits)}${suffix}`;
  };

  const numberOr = (value: unknown, fallback = 0) => {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      return fallback;
    }
    return value;
  };

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
        setError('No text content found in resume. Backend must expose extractedText field.');
      }
    } catch (err) {
      setError(getErrorMessage(err) || 'Failed to load resume text');
    }
  };

  const handleResumeSelect = (resumeId: string) => {
    setSelectedResumeId(resumeId);
    loadResumeText(resumeId);
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
      const response = await mlApi.analyzeEnhanced(resumeText, jobDescription || undefined);
      setResult(response.data);
    } catch (err) {
      setError(getErrorMessage(err) || 'Failed to analyze resume');
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
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
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Sparkles className="text-blue-600" size={20} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Enhanced Analysis</h1>
                <p className="text-sm text-gray-600">Deep ML scoring with confidence metrics</p>
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
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText size={20} />
                Select Resume
              </h2>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Choose from uploaded resumes
                </label>
                <select
                  value={selectedResumeId}
                  onChange={(e) => handleResumeSelect(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    placeholder="Paste resume text here or select from dropdown..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[200px] text-gray-900"
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
                    placeholder="Paste job description for better matching..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[150px] text-gray-900"
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
                  className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 font-medium"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles size={20} />
                      Analyze Resume
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
                {(() => {
                  const finalScore = numberOr(result.final_score);
                  const confidence = numberOr(result.confidence);
                  const components = result.components ?? { semantic: { score: 0, confidence: 0, weight: 0 }, skills: { score: 0, confidence: 0, weight: 0 }, quality: { score: 0, confidence: 0, weight: 0 } };
                  const industryScore = result.industry_analysis?.industry_score;

                  return (
                    <>
                {/* Overall Score Card */}
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-md">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Analysis Results</h2>
                    <CheckCircle2 className="text-green-600" size={24} />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                      <p className="text-sm text-blue-700 font-medium mb-1">Final Score</p>
                      <p className="text-3xl font-bold text-blue-900">{formatNumber(finalScore)}</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
                      <p className="text-sm text-green-700 font-medium mb-1">Confidence</p>
                      <p className="text-3xl font-bold text-green-900">{formatNumber(confidence, 1, '%')}</p>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-700 mb-1">Interpretation</p>
                    <p className="text-gray-900">{result.interpretation || 'No interpretation available.'}</p>
                  </div>
                </div>

                {/* Component Scores */}
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-md">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Component Breakdown</h3>
                  <div className="space-y-4">
                    {Object.entries(components).map(([key, comp]) => (
                      <div key={key} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium text-gray-700 capitalize">{key}</p>
                          <p className="text-lg font-bold text-gray-900">{formatNumber(comp?.score)}</p>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>Confidence: {formatNumber(comp?.confidence, 1, '%')}</span>
                          <span>Weight: {formatNumber(numberOr(comp?.weight) * 100, 0, '%')}</span>
                        </div>
                        <div className="mt-2 bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-blue-600 h-full transition-all duration-300"
                            style={{ width: `${Math.max(0, Math.min(100, numberOr(comp?.score)))}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Industry Analysis */}
                {result.industry_analysis && (
                  <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-md">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Industry Analysis</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600">Best Fit Industry</p>
                        <p className="font-semibold text-gray-900">{result.industry_analysis.best_fit_industry || 'N/A'}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600">Industry Score</p>
                        <p className="font-semibold text-gray-900">{formatNumber(industryScore)}</p>
                      </div>

                      {result.industry_analysis.missing_key_skills && result.industry_analysis.missing_key_skills.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <p className="text-sm text-gray-600 mb-2">Missing Key Skills:</p>
                          <div className="flex flex-wrap gap-2">
                            {result.industry_analysis.missing_key_skills.map((skill, idx) => (
                              <span key={idx} className="px-2 py-1 bg-red-50 text-red-700 text-xs rounded-full border border-red-200">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {result.recommendations && result.recommendations.length > 0 && (
                  <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-md">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommendations</h3>
                    <ul className="space-y-2">
                      {result.recommendations.map((rec, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="text-blue-600 font-bold">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                    </>
                  );
                })()}
              </>
            ) : (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-12 border border-blue-100 shadow-md flex flex-col items-center justify-center min-h-[600px]">
                <div className="mb-8 relative w-full bg-white/60 backdrop-blur-sm rounded-lg p-8 flex items-center justify-center">
                  <Image
                    src="/Enhanced-analysis.jpg"
                    alt="Enhanced Analysis"
                    width={280}
                    height={220}
                    className="object-contain"
                    priority
                  />
                </div>
                <div className="flex items-center gap-2 text-gray-700 text-center font-medium">
                  <Sparkles size={18} className="text-blue-600" />
                  <span>Upload your resume and analyze it to unlock detailed ML insights</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
