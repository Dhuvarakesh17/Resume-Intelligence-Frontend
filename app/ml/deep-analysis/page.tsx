'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import { useRouter } from 'next/navigation';
import { mlApi, resumeApi, ResumeResponse } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { ArrowLeft, Brain, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface MlAnalysisResult {
  status: string;
  ml_analysis: {
    word_quality_score: number;
    professionalism_score: number;
    semantic_alignment: number;
    context_analysis: {
      issues_found: number;
      details: Array<{
        phrase: string;
        word: string;
        replacement: string;
        reasoning: string;
        severity: string;
      }>;
    };
    vocabulary_richness: number;
    industry_alignment: {
      primary_industry: string;
      match_score: number;
      all_industries: Record<string, {
        match_percentage: number;
        matched_terms: string[];
        missing_terms: string[];
      }>;
    };
    verb_strength: {
      score: number;
      strong_verbs: number;
      weak_verbs: number;
      total_verbs: number;
      strong_verb_examples: string[];
      weak_verb_examples: string[];
    };
    quantification_score: number;
    text_features: {
      word_count: number;
      sentence_count: number;
      avg_word_length: number;
      avg_sentence_length: number;
      unique_words: number;
      lexical_diversity: number;
    };
    improvements: string[];
  };
  model_info: {
    type: string;
    features: string[];
  };
}

export default function DeepMlAnalysisPage() {
  const { isLoading: authLoading } = useProtectedRoute();
  const router = useRouter();

  const [resumes, setResumes] = useState<ResumeResponse[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<MlAnalysisResult | null>(null);

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
      const response = await mlApi.analyzeMl(resumeText, jobDescription || undefined);
      setResult(response.data as unknown as MlAnalysisResult);
    } catch (err) {
      setError(getErrorMessage(err) || 'Failed to perform deep ML analysis');
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/90 backdrop-blur-md sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 text-gray-700 hover:text-gray-900 hover:scale-105"
              title="Back to Dashboard"
            >
              <ArrowLeft size={24} className="stroke-2" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <Brain className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Deep ML Scoring
                </h1>
                <p className="text-sm text-gray-600">Deep ML scoring with confidence metrics</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <div className="order-2 lg:order-1 space-y-6">
            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-xl shadow-purple-100/50">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-lg">📄</span>
                </div>
                <h2 className="text-xl font-bold text-gray-900">Select Resume</h2>
              </div>

              <p className="text-sm text-gray-600 mb-4">Choose from uploaded resumes</p>

              <div className="mb-6">
                <select
                  value={selectedResumeId}
                  onChange={(e) => {
                    setSelectedResumeId(e.target.value);
                    loadResumeText(e.target.value);
                  }}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-gray-900 bg-gray-50 hover:bg-white"
                >
                  <option value="">-- Select a resume --</option>
                  {resumes.map((resume) => (
                    <option key={resume.resumeId} value={resume.resumeId}>
                      {resume.fileName}
                    </option>
                  ))}
                </select>
              </div>

              <form onSubmit={handleAnalyze} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1">
                    Resume Text <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    placeholder="Paste resume text here or select from dropdown..."
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all min-h-[200px] font-mono text-sm text-gray-900 bg-gray-50 hover:bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Job Description <span className="text-gray-400 text-xs">(optional)</span>
                  </label>
                  <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste job description for better matching..."
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all min-h-[120px] font-mono text-sm text-gray-900 bg-gray-50 hover:bg-white"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3 animate-shake">
                    <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                    <p className="text-sm text-red-800 font-medium">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !resumeText.trim()}
                  className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:shadow-none flex items-center justify-center gap-3 font-semibold text-base transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={22} />
                      Analyzing Resume...
                    </>
                  ) : (
                    <>
                      <Brain size={22} />
                      Analyze Resume
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Results */}
          <div className="order-1 lg:order-2 space-y-6">
            {result ? (
              <div className="max-h-[calc(100vh-200px)] overflow-y-auto pr-2 space-y-6">
                {/* Overview Scores */}
                <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-xl shadow-purple-100/50">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">ML Analysis Results</h2>
                    <CheckCircle2 className="text-green-600" size={28} />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200 shadow-sm">
                      <p className="text-xs font-semibold text-purple-700 mb-2 uppercase tracking-wide">Word Quality</p>
                      <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-br from-purple-700 to-purple-900 bg-clip-text text-transparent">
                        {result.ml_analysis.word_quality_score.toFixed(1)}
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200 shadow-sm">
                      <p className="text-xs font-semibold text-blue-700 mb-2 uppercase tracking-wide">Professionalism</p>
                      <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-br from-blue-700 to-blue-900 bg-clip-text text-transparent">
                        {result.ml_analysis.professionalism_score.toFixed(1)}
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200 shadow-sm">
                      <p className="text-xs font-semibold text-green-700 mb-2 uppercase tracking-wide">Semantic Alignment</p>
                      <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-br from-green-700 to-green-900 bg-clip-text text-transparent">
                        {result.ml_analysis.semantic_alignment.toFixed(1)}
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200 shadow-sm">
                      <p className="text-xs font-semibold text-amber-700 mb-2 uppercase tracking-wide">Vocabulary Richness</p>
                      <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-br from-amber-700 to-amber-900 bg-clip-text text-transparent">
                        {result.ml_analysis.vocabulary_richness.toFixed(1)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Verb Strength */}
                <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-xl shadow-purple-100/50">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Verb Strength Analysis</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                      <p className="text-sm font-semibold text-gray-700">Overall Score</p>
                      <p className="text-2xl font-bold text-purple-600">{result.ml_analysis.verb_strength.score.toFixed(1)}</p>
                    </div>
                    <div className="flex items-center justify-between text-sm bg-gradient-to-r from-green-50 to-red-50 rounded-lg p-3">
                      <span className="flex items-center gap-2 font-semibold text-green-700">
                        <CheckCircle2 size={16} />
                        Strong: {result.ml_analysis.verb_strength.strong_verbs}
                      </span>
                      <span className="flex items-center gap-2 font-semibold text-red-700">
                        <AlertCircle size={16} />
                        Weak: {result.ml_analysis.verb_strength.weak_verbs}
                      </span>
                    </div>
                    {result.ml_analysis.verb_strength.strong_verb_examples.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Strong Examples:</p>
                        <div className="flex flex-wrap gap-2">
                          {result.ml_analysis.verb_strength.strong_verb_examples.map((verb, idx) => (
                            <span key={idx} className="px-3 py-1.5 bg-green-100 text-green-800 text-sm font-medium rounded-lg border border-green-200 shadow-sm">
                              {verb}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {result.ml_analysis.verb_strength.weak_verb_examples.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Weak Examples:</p>
                        <div className="flex flex-wrap gap-2">
                          {result.ml_analysis.verb_strength.weak_verb_examples.map((verb, idx) => (
                            <span key={idx} className="px-3 py-1.5 bg-red-100 text-red-800 text-sm font-medium rounded-lg border border-red-200 shadow-sm">
                              {verb}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Context Analysis */}
                {result.ml_analysis.context_analysis.issues_found > 0 && (
                  <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-xl shadow-purple-100/50">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">
                      Context Issues Found ({result.ml_analysis.context_analysis.issues_found})
                    </h3>
                    <div className="space-y-3">
                      {result.ml_analysis.context_analysis.details.map((issue, idx) => (
                        <div key={idx} className="border-l-4 border-orange-400 bg-gradient-to-r from-orange-50 to-orange-50/50 p-4 rounded-r-xl shadow-sm">
                          <div className="flex items-center justify-between mb-2">
                            <code className="text-sm font-mono font-semibold text-gray-900 bg-white px-2 py-1 rounded">{issue.phrase}</code>
                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                              issue.severity === 'high' ? 'bg-red-200 text-red-800 ring-2 ring-red-300' :
                              issue.severity === 'medium' ? 'bg-yellow-200 text-yellow-800 ring-2 ring-yellow-300' :
                              'bg-blue-200 text-blue-800 ring-2 ring-blue-300'
                            }`}>
                              {issue.severity.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mb-1">Suggested: <strong className="text-green-700">{issue.replacement}</strong></p>
                          <p className="text-xs text-gray-700">{issue.reasoning}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Industry Alignment */}
                <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-xl shadow-purple-100/50">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Industry Alignment</h3>
                  <div className="mb-6 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-5 border border-purple-200">
                    <p className="text-xs font-semibold text-purple-700 mb-2 uppercase tracking-wide">Primary Industry</p>
                    <p className="text-2xl font-bold text-purple-900 mb-2">{result.ml_analysis.industry_alignment.primary_industry}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-purple-600 to-indigo-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${result.ml_analysis.industry_alignment.match_score}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-bold text-purple-700">{result.ml_analysis.industry_alignment.match_score.toFixed(1)}%</span>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {Object.entries(result.ml_analysis.industry_alignment.all_industries).map(([industry, data]) => (
                      <div key={industry} className="bg-gray-50 rounded-xl p-5 border border-gray-200 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm font-semibold text-gray-900">{industry}</p>
                          <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-sm font-bold rounded-full">
                            {data.match_percentage.toFixed(1)}%
                          </span>
                        </div>
                        {data.matched_terms.length > 0 && (
                          <div className="mb-3">
                            <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Matched Terms:</p>
                            <div className="flex flex-wrap gap-2">
                              {data.matched_terms.slice(0, 5).map((term, idx) => (
                                <span key={idx} className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-lg border border-green-200">
                                  {term}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {data.missing_terms.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Missing Terms:</p>
                            <div className="flex flex-wrap gap-2">
                              {data.missing_terms.slice(0, 5).map((term, idx) => (
                                <span key={idx} className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-lg border border-red-200">
                                  {term}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Text Features */}
                <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-xl shadow-purple-100/50">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Text Statistics</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                      <p className="text-xs font-semibold text-blue-700 mb-1 uppercase tracking-wide">Word Count</p>
                      <p className="text-2xl font-bold text-blue-900">{result.ml_analysis.text_features.word_count}</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                      <p className="text-xs font-semibold text-purple-700 mb-1 uppercase tracking-wide">Sentences</p>
                      <p className="text-2xl font-bold text-purple-900">{result.ml_analysis.text_features.sentence_count}</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                      <p className="text-xs font-semibold text-green-700 mb-1 uppercase tracking-wide">Avg Word Length</p>
                      <p className="text-2xl font-bold text-green-900">{result.ml_analysis.text_features.avg_word_length.toFixed(1)}</p>
                    </div>
                    <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200">
                      <p className="text-xs font-semibold text-amber-700 mb-1 uppercase tracking-wide">Avg Sentence Length</p>
                      <p className="text-2xl font-bold text-amber-900">{result.ml_analysis.text_features.avg_sentence_length.toFixed(1)}</p>
                    </div>
                    <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-4 border border-indigo-200">
                      <p className="text-xs font-semibold text-indigo-700 mb-1 uppercase tracking-wide">Unique Words</p>
                      <p className="text-2xl font-bold text-indigo-900">{result.ml_analysis.text_features.unique_words}</p>
                    </div>
                    <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl p-4 border border-pink-200">
                      <p className="text-xs font-semibold text-pink-700 mb-1 uppercase tracking-wide">Lexical Diversity</p>
                      <p className="text-2xl font-bold text-pink-900">{result.ml_analysis.text_features.lexical_diversity.toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                {/* Improvements */}
                <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-xl shadow-purple-100/50">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Recommended Improvements</h3>
                  <ul className="space-y-3">
                    {result.ml_analysis.improvements.map((imp, idx) => (
                      <li key={idx} className="flex items-start gap-3 bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-xl border border-purple-200">
                        <span className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="text-sm text-gray-800 leading-relaxed">{imp}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Model Info */}
                <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-xl shadow-purple-100/50">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Model Information</h3>
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-5 rounded-xl border border-gray-200 mb-4">
                    <p className="text-sm font-semibold text-gray-900">{result.model_info.type}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {result.model_info.features.map((feature, idx) => (
                      <span key={idx} className="px-4 py-2 bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-800 text-sm font-medium rounded-xl border border-purple-200 shadow-sm">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-8 sm:p-12 border border-gray-100 shadow-xl shadow-purple-100/50 text-center min-h-[360px] sm:min-h-[500px] flex flex-col items-center justify-center">
                <div className="mb-6 relative w-full h-64 flex items-center justify-center">
                  <Image
                    src="/deep-ml-analysis.jpg"
                    alt="Deep ML Analysis"
                    width={300}
                    height={250}
                    className="object-contain"
                    priority
                  />
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">✨</span>
                  <h3 className="text-xl font-bold text-gray-900">Ready to Analyze</h3>
                </div>
                <div className="flex items-center gap-2 text-gray-600 mb-2 max-w-md">
                  <Brain size={18} className="text-purple-600" />
                  <p>Select a resume and click <span className="font-semibold text-purple-600">Analyze Resume</span> to see</p>
                </div>
                <div className="flex items-center gap-2 text-gray-600 max-w-md">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  <p>results</p>
                </div>
                <div className="mt-8 flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-green-500" />
                    <span>ML Scoring</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-green-500" />
                    <span>Deep Analysis</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-green-500" />
                    <span>AI Insights</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
