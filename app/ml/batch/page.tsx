'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import { useRouter } from 'next/navigation';
import { mlApi, resumeApi, ResumeResponse, BatchResult } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { ArrowLeft, Layers, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function BatchProcessingPage() {
  const { isLoading: authLoading } = useProtectedRoute();
  const router = useRouter();

  const [resumes, setResumes] = useState<ResumeResponse[]>([]);
  const [selectedResumeIds, setSelectedResumeIds] = useState<string[]>([]);
  const [jobDescription, setJobDescription] = useState('');
  const [maxWorkers, setMaxWorkers] = useState(4);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<BatchResult | null>(null);

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

  const deselectAll = () => {
    setSelectedResumeIds([]);
  };

  const handleBatchProcess = async (e: React.FormEvent) => {
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

      const response = await mlApi.batchProcess({
        resumes: resumeData,
        job_description: jobDescription || undefined,
        max_workers: maxWorkers
      });
      
      setResult(response.data);
    } catch (err) {
      setError(getErrorMessage(err) || 'Failed to process batch');
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
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50">
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
              <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                <Layers className="text-teal-600" size={20} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Batch Processing</h1>
                <p className="text-sm text-gray-600">Process 100+ resumes in parallel</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Select Resumes ({selectedResumeIds.length} selected)</h2>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={selectAll}
                    className="text-sm text-teal-600 hover:text-teal-700"
                  >
                    Select All
                  </button>
                  <span className="text-gray-400">|</span>
                  <button
                    type="button"
                    onClick={deselectAll}
                    className="text-sm text-gray-600 hover:text-gray-700"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="max-h-[400px] overflow-y-auto space-y-2">
                {resumes.map((resume) => (
                  <label
                    key={resume.resumeId}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedResumeIds.includes(resume.resumeId.toString())
                        ? 'bg-teal-50 border border-teal-300'
                        : 'bg-gray-50 border border-gray-200 hover:border-teal-200'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedResumeIds.includes(resume.resumeId.toString())}
                      onChange={() => toggleResume(resume.resumeId.toString())}
                      className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{resume.fileName}</p>
                      <p className="text-xs text-gray-500">{new Date(resume.uploadedAt).toLocaleDateString()}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <form onSubmit={handleBatchProcess} className="space-y-6">
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-md">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Description (optional)
                </label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste job description for scoring against..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent min-h-[120px] text-gray-900"
                />

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Worker Threads ({maxWorkers})
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="16"
                    value={maxWorkers}
                    onChange={(e) => setMaxWorkers(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Sequential (1)</span>
                    <span>High Parallelism (16)</span>
                  </div>
                </div>
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
                className="w-full px-6 py-3 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 text-white rounded-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 font-medium"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Processing {selectedResumeIds.length} resumes...
                  </>
                ) : (
                  <>
                    <Layers size={20} />
                    Process Batch
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Results */}
          <div className="space-y-6">
            {result ? (
              <>
                {/* Summary Card */}
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-md">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Batch Processing Results</h2>
                    <CheckCircle2 className="text-green-600" size={24} />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-teal-50 rounded-lg p-4">
                      <p className="text-xs text-teal-700 mb-1">Total Processed</p>
                      <p className="text-2xl font-bold text-teal-900">{result.processed_count}</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-xs text-blue-700 mb-1">Duration</p>
                      <p className="text-2xl font-bold text-blue-900">{(result.duration_ms / 1000).toFixed(2)}s</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                      Throughput: <span className="font-semibold text-gray-900">
                        {(result.processed_count / (result.duration_ms / 1000)).toFixed(1)} resumes/sec
                      </span>
                    </p>
                  </div>
                </div>

                {/* Results Table */}
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-md max-h-[600px] overflow-y-auto">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Individual Results</h3>
                  <div className="space-y-3">
                    {result.results.map((item, idx) => (
                      <div key={idx} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium text-gray-900">Resume ID: {item.id}</p>
                          <p className="text-lg font-bold text-teal-600">{item.score}</p>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-600">
                          {item.confidence && (
                            <span>Confidence: {item.confidence.toFixed(1)}%</span>
                          )}
                          {item.industry && (
                            <span className="px-2 py-1 bg-gray-100 rounded">{item.industry}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-xl p-12 border border-gray-200 shadow-md flex flex-col items-center justify-center min-h-[500px]">
                <div className="mb-6 relative w-full h-64 flex items-center justify-center">
                  <Image
                    src="/batch-processing.jpg"
                    alt="Batch Processing"
                    width={300}
                    height={250}
                    className="object-contain"
                    priority
                  />
                </div>
                <div className="flex items-center gap-2 text-gray-600 text-lg font-medium">
                  <Layers size={18} className="text-teal-600" />
                  <span>Process resumes to see batch results</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  <span>Supports 100+ resumes with parallel processing</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
