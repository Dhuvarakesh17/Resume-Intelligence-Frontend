'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import { useRouter } from 'next/navigation';
import { mlApi, resumeApi, ResumeResponse, FilterResult, FilterOptions } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { ArrowLeft, Filter, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function FilterCandidatesPage() {
  const { isLoading: authLoading } = useProtectedRoute();
  const router = useRouter();

  const [resumes, setResumes] = useState<ResumeResponse[]>([]);
  const [selectedResumeIds, setSelectedResumeIds] = useState<string[]>([]);
  const [jobDescription, setJobDescription] = useState('');
  const [minAtsScore, setMinAtsScore] = useState(60);
  const [requiredSkills, setRequiredSkills] = useState('');
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [minConfidence, setMinConfidence] = useState(70);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<FilterResult | null>(null);

  const industries = [
    'software_engineering',
    'data_science',
    'devops',
    'cybersecurity',
    'frontend',
    'backend',
    'cloud_architecture',
    'product_management'
  ];

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

  const toggleIndustry = (industry: string) => {
    if (selectedIndustries.includes(industry)) {
      setSelectedIndustries(selectedIndustries.filter(i => i !== industry));
    } else {
      setSelectedIndustries([...selectedIndustries, industry]);
    }
  };

  const handleFilter = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedResumeIds.length === 0) {
      setError('Please select at least one resume');
      return;
    }

    if (!jobDescription.trim()) {
      setError('Job description is required for filtering');
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

      const filters: FilterOptions = {
        min_ats_score: minAtsScore,
        min_confidence: minConfidence,
      };

      if (requiredSkills.trim()) {
        filters.required_skills = requiredSkills.split(',').map(s => s.trim()).filter(Boolean);
      }

      if (selectedIndustries.length > 0) {
        filters.industries = selectedIndustries;
      }

      const response = await mlApi.filterResumes(
        resumeData,
        jobDescription,
        filters
      );
      
      setResult(response.data);
    } catch (err) {
      setError(getErrorMessage(err) || 'Failed to filter resumes');
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
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50">
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
              <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                <Filter className="text-violet-600" size={20} />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Filter Candidates</h1>
                <p className="text-sm text-gray-600">Filter by skills, score thresholds & industry</p>
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
                  className="text-sm text-violet-600 hover:text-violet-700"
                >
                  Select All
                </button>
              </div>

              <div className="max-h-[250px] overflow-y-auto space-y-2">
                {resumes.map((resume) => (
                  <label
                    key={resume.resumeId}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedResumeIds.includes(resume.resumeId.toString())
                        ? 'bg-violet-50 border border-violet-300'
                        : 'bg-gray-50 border border-gray-200 hover:border-violet-200'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedResumeIds.includes(resume.resumeId.toString())}
                      onChange={() => toggleResume(resume.resumeId.toString())}
                      className="w-4 h-4 text-violet-600 rounded focus:ring-violet-500"
                    />
                    <p className="text-sm font-medium text-gray-900 truncate flex-1">{resume.fileName}</p>
                  </label>
                ))}
              </div>
            </div>

            <form onSubmit={handleFilter} className="space-y-6">
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-md">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Filter Criteria</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum ATS Score ({minAtsScore})
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={minAtsScore}
                      onChange={(e) => setMinAtsScore(parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Confidence ({minConfidence}%)
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={minConfidence}
                      onChange={(e) => setMinConfidence(parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Required Skills (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={requiredSkills}
                      onChange={(e) => setRequiredSkills(e.target.value)}
                      placeholder="python, aws, docker"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Industries ({selectedIndustries.length} selected)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {industries.map((industry) => (
                        <label
                          key={industry}
                          className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer text-xs ${
                            selectedIndustries.includes(industry)
                              ? 'bg-violet-50 border border-violet-300'
                              : 'bg-gray-50 border border-gray-200 hover:border-violet-200'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedIndustries.includes(industry)}
                            onChange={() => toggleIndustry(industry)}
                            className="w-3 h-3 text-violet-600 rounded"
                          />
                          <span className="truncate">{industry.replace('_', ' ')}</span>
                        </label>
                      ))}
                    </div>
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
                  placeholder="Required for filtering..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent min-h-[120px] text-gray-900"
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
                className="w-full px-6 py-3 bg-violet-600 hover:bg-violet-700 disabled:bg-gray-400 text-white rounded-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 font-medium"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Filtering...
                  </>
                ) : (
                  <>
                    <Filter size={20} />
                    Apply Filters
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Results */}
          <div className="order-1 lg:order-2 space-y-6">
            {result ? (
              <>
                {/* Summary */}
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-md">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Filter Results</h2>
                    <CheckCircle2 className="text-green-600" size={24} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-green-50 rounded-lg p-4">
                      <p className="text-xs text-green-700 mb-1">Passed</p>
                      <p className="text-2xl font-bold text-green-900">{result.matched_count}</p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-4">
                      <p className="text-xs text-red-700 mb-1">Rejected</p>
                      <p className="text-2xl font-bold text-red-900">
                        {selectedResumeIds.length - result.matched_count}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Passed Resumes */}
                {result.matched_resumes && result.matched_resumes.length > 0 && (
                  <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-md">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <CheckCircle2 className="text-green-600" size={20} />
                      Qualified Candidates ({result.matched_resumes.length})
                    </h3>
                    <div className="space-y-3">
                      {result.matched_resumes.map((match) => {
                        const resume = resumes.find(r => r.resumeId.toString() === match.id);
                        return (
                          <div key={match.id} className="border border-green-200 bg-green-50 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <p className="font-semibold text-gray-900">
                                {resume?.fileName || `Resume ${match.id}`}
                              </p>
                              <p className="text-lg font-bold text-green-600">{match.score}</p>
                            </div>
                            {match.matched_skills && match.matched_skills.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {match.matched_skills.map((skill, idx) => (
                                  <span key={idx} className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            )}
                            {match.industry && (
                              <span className="inline-block mt-2 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                                {match.industry}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-xl p-8 sm:p-12 border border-gray-200 shadow-md flex flex-col items-center justify-center min-h-[360px] sm:min-h-[500px]">
                <div className="mb-6 relative w-full h-64 flex items-center justify-center">
                  <Image
                    src="/filtler-candidate.jpg"
                    alt="Filter Candidates"
                    width={300}
                    height={250}
                    className="object-contain"
                    priority
                  />
                </div>
                <div className="flex items-center gap-2 text-gray-600 text-lg font-medium">
                  <Filter size={18} className="text-violet-600" />
                  <span>Configure filters and apply to see results</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  <span>Filter by score, skills, industry & confidence</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
