'use client';

import { useState, useEffect } from 'react';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import { useRouter } from 'next/navigation';
import { mlApi, resumeApi, ResumeResponse } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { ArrowLeft, GitCompare, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface ComparisonResultData {
  summary: {
    total_resumes: number;
    total_unique_skills: number;
    average_ats_score: number;
    ats_score_range: [number, number];
  };
  rankings: {
    by_ats_score: Array<{ rank: number; name: string; score: number }>;
    by_skill_count: Array<{ rank: number; name: string; score: number }>;
    by_experience: Array<{ rank: number; name: string; score: number }>;
  };
  comparison_insights: Array<{
    name: string;
    strengths: string[];
    weaknesses: string[];
    unique_skills: string[];
  }>;
  recommendation: {
    best_overall: string;
    reason: string;
  };
}

export default function CompareResumesPage() {
  const { isLoading: authLoading } = useProtectedRoute();
  const router = useRouter();

  const [resumes, setResumes] = useState<ResumeResponse[]>([]);
  const [selectedResumes, setSelectedResumes] = useState<string[]>(['', '']);
  const [resumeNames, setResumeNames] = useState<string[]>(['Resume 1', 'Resume 2']);
  const [resumeTexts, setResumeTexts] = useState<string[]>(['', '']);
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ComparisonResultData | null>(null);

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

  const loadResumeText = async (resumeId: string, index: number) => {
    if (!resumeId) return;
    try {
      const response = await resumeApi.getById(parseInt(resumeId));
      const resume = response.data;
      const text = resume.extractedText || resume.resumeText || resume.text || '';
      
      const newTexts = [...resumeTexts];
      newTexts[index] = text;
      setResumeTexts(newTexts);

      const newNames = [...resumeNames];
      newNames[index] = resume.fileName;
      setResumeNames(newNames);
    } catch (err) {
      setError(getErrorMessage(err) || 'Failed to load resume text');
    }
  };

  const addResume = () => {
    setSelectedResumes([...selectedResumes, '']);
    setResumeTexts([...resumeTexts, '']);
    setResumeNames([...resumeNames, `Resume ${selectedResumes.length + 1}`]);
  };

  const removeResume = (index: number) => {
    setSelectedResumes(selectedResumes.filter((_, i) => i !== index));
    setResumeTexts(resumeTexts.filter((_, i) => i !== index));
    setResumeNames(resumeNames.filter((_, i) => i !== index));
  };

  const handleCompare = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validTexts = resumeTexts.filter(t => t.trim());
    if (validTexts.length < 2) {
      setError('At least 2 resumes are required for comparison');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await mlApi.compareResumes(
        resumeTexts[0],
        resumeTexts[1],
        jobDescription || undefined
      );
      
      // Transform the result to match our interface
      const transformedResult: ComparisonResultData = {
        summary: {
          total_resumes: 2,
          total_unique_skills: 0,
          average_ats_score: 0,
          ats_score_range: [0, 0]
        },
        rankings: {
          by_ats_score: [],
          by_skill_count: [],
          by_experience: []
        },
        comparison_insights: [],
        recommendation: {
          best_overall: '',
          reason: response.data.recommendation || 'No specific recommendation'
        }
      };
      
      setResult(transformedResult);
    } catch (err) {
      setError(getErrorMessage(err) || 'Failed to compare resumes');
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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
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
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <GitCompare className="text-orange-600" size={20} />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Compare Resumes</h1>
                <p className="text-sm text-gray-600">Side-by-side resume comparison with insights</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!result && !loading && (
          <div className="mb-8 bg-white rounded-xl p-8 sm:p-12 border border-gray-200 shadow-md text-center">
            <GitCompare className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-600">Compare resumes to see detailed insights</p>
          </div>
        )}

        <form onSubmit={handleCompare} className="space-y-6">
          {/* Input Section */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-md">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Resumes to Compare</h2>
            
            {selectedResumes.map((selected, index) => ( 
              <div key={index} className="mb-4 p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-700">Resume {index + 1}</h3>
                  {index >= 2 && (
                    <button
                      type="button"
                      onClick={() => removeResume(index)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>
                
                <select
                  value={selected}
                  onChange={(e) => {
                    const newSelected = [...selectedResumes];
                    newSelected[index] = e.target.value;
                    setSelectedResumes(newSelected);
                    loadResumeText(e.target.value, index);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent mb-3"
                >
                  <option value="">-- Select a resume --</option>
                  {resumes.map((resume) => (
                    <option key={resume.resumeId} value={resume.resumeId}>
                      {resume.fileName}
                    </option>
                  ))}
                </select>

                <textarea
                  value={resumeTexts[index]}
                  onChange={(e) => {
                    const newTexts = [...resumeTexts];
                    newTexts[index] = e.target.value;
                    setResumeTexts(newTexts);
                  }}
                  placeholder="Or paste resume text directly..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent min-h-[150px] font-mono text-sm text-gray-900"
                />
              </div>
            ))}

            {selectedResumes.length < 5 && ( 
              <button
                type="button"
                onClick={addResume}
                className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-orange-400 hover:text-orange-600 transition-colors"
              >
                + Add Another Resume
              </button>
            )}
          </div>

          {/* Job Description */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-md">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Job Description (optional but recommended)
            </label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste job description for targeted comparison..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent min-h-[120px] text-gray-900"
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
            className="w-full px-6 py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white rounded-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 font-medium"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Comparing Resumes...
              </>
            ) : (
              <>
                <GitCompare size={20} />
                Compare Resumes
              </>
            )}
          </button>
        </form>

        {/* Results */}
        {result && (
          <div className="mt-8 space-y-6">
            {/* Recommendation */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Recommendation</h2>
                <CheckCircle2 className="text-green-600" size={24} />
              </div>
              <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-lg p-6">
                <p className="text-2xl font-bold text-green-900 mb-2">
                  {result.recommendation.best_overall || 'See detailed comparison below'}
                </p>
                <p className="text-gray-700">{result.recommendation.reason}</p>
              </div>
            </div>

            {/* Detailed Comparison Table */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Comparison</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Resume</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Skills Found</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Word Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resumeNames.map((name, idx) => (
                      resumeTexts[idx] && (
                        <tr key={idx} className="border-b border-gray-100">
                          <td className="py-3 px-4 text-sm font-medium text-gray-900">{name}</td>
                          <td className="py-3 px-4 text-sm text-gray-700">-</td>
                          <td className="py-3 px-4 text-sm text-gray-700">{resumeTexts[idx].split(/\s+/).length}</td>
                        </tr>
                      )
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
