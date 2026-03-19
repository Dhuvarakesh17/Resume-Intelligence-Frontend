'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import { useRouter } from 'next/navigation';
import { mlApi, resumeApi, ComparisonResult, EnhancedMlResponse, ResumeResponse } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { LayoutDashboard, RefreshCw, FlaskConical } from 'lucide-react';

export default function MlToolsPage() {
  const { isLoading: authLoading } = useProtectedRoute();
  const router = useRouter();

  const [health, setHealth] = useState<{ status?: string; version?: string; skills_loaded?: number } | null>(null);
  const [industries, setIndustries] = useState<Array<{ name: string }>>([]);
  const [stats, setStats] = useState<{ version?: string; capabilities?: string[]; model?: string } | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resumes, setResumes] = useState<ResumeResponse[]>([]);
  const [selectedResumeA, setSelectedResumeA] = useState('');
  const [selectedResumeB, setSelectedResumeB] = useState('');
  const [resumeLoadHint, setResumeLoadHint] = useState('');

  const [resumeText, setResumeText] = useState('');
  const [resumeTextB, setResumeTextB] = useState('');
  const [jobDescription, setJobDescription] = useState('');

  const [enhancedResult, setEnhancedResult] = useState<EnhancedMlResponse | null>(null);
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);

  useEffect(() => {
    if (!authLoading) {
      fetchMeta();
      fetchResumes();
    }
  }, [authLoading]);

  const fetchMeta = async () => {
    setError('');
    try {
      const [healthResp, industriesResp, statsResp] = await Promise.all([
        mlApi.health(),
        mlApi.industries(),
        mlApi.stats(),
      ]);
      setHealth(healthResp.data);
      setIndustries(industriesResp.data || []);
      setStats(statsResp.data);
    } catch (err) {
      setError(getErrorMessage(err) || 'Failed to load ML metadata');
    }
  };

  const getTextFromResumePayload = (resume: Partial<ResumeResponse> & Record<string, unknown>) => {
    const textCandidate = resume.extractedText || resume.resumeText || resume.text || resume.content;
    return typeof textCandidate === 'string' ? textCandidate : '';
  };

  const fetchResumes = async () => {
    try {
      const response = await resumeApi.getAll();
      setResumes(response.data || []);
    } catch (err) {
      setError(getErrorMessage(err) || 'Failed to load resumes for ML tools');
    }
  };

  const loadResumeTextById = async (resumeId: string, target: 'A' | 'B') => {
    if (!resumeId) {
      return;
    }

    try {
      const response = await resumeApi.getById(Number(resumeId));
      const payload = response.data as Partial<ResumeResponse> & Record<string, unknown>;
      const extracted = getTextFromResumePayload(payload);

      if (extracted) {
        if (target === 'A') {
          setResumeText(extracted);
        } else {
          setResumeTextB(extracted);
        }
        setResumeLoadHint('Selected resume text loaded successfully.');
      } else {
        setResumeLoadHint('Resume selected, but backend did not return extracted text. Paste text manually or expose extractedText in /api/resumes/{id}.');
      }
    } catch (err) {
      setError(getErrorMessage(err) || 'Failed to load selected resume details');
    }
  };

  const onAnalyzeEnhanced = async (e: FormEvent) => {
    e.preventDefault();
    if (!resumeText.trim()) {
      setError('Resume text is required for enhanced analysis.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await mlApi.analyzeEnhanced(resumeText, jobDescription || undefined);
      setEnhancedResult(response.data);
    } catch (err) {
      setError(getErrorMessage(err) || 'Enhanced analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const onCompareResumes = async (e: FormEvent) => {
    e.preventDefault();
    if (!resumeText.trim() || !resumeTextB.trim()) {
      setError('Both resume text fields are required for comparison.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await mlApi.compareResumes(resumeText, resumeTextB, jobDescription || undefined);
      setComparisonResult(response.data);
    } catch (err) {
      setError(getErrorMessage(err) || 'Resume comparison failed');
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
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center md:text-left">ML Tools</h1>
            <div className="flex w-full gap-2 sm:gap-3 md:w-auto">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex-1 md:flex-none px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg transition-all shadow-sm inline-flex items-center justify-center gap-2"
              >
                <LayoutDashboard size={16} />
                Dashboard
              </button>
              <button
                onClick={fetchMeta}
                className="flex-1 md:flex-none px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all shadow-sm inline-flex items-center justify-center gap-2"
              >
                <RefreshCw size={16} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <section className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Select Resume To Apply</h2>
          <p className="text-sm text-gray-600 mb-4">
            Choose a resume and its extracted text will be applied to the ML input fields when available.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Resume A (Analyze + Compare)</label>
              <select
                value={selectedResumeA}
                onChange={(e) => {
                  const value = e.target.value;
                  setSelectedResumeA(value);
                  loadResumeTextById(value, 'A');
                }}
                className="w-full rounded-lg border border-gray-300 p-3 text-sm"
              >
                <option value="">Select a resume</option>
                {resumes.map((resume) => (
                  <option key={resume.resumeId} value={resume.resumeId}>
                    {resume.fileName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Resume B (Compare)</label>
              <select
                value={selectedResumeB}
                onChange={(e) => {
                  const value = e.target.value;
                  setSelectedResumeB(value);
                  loadResumeTextById(value, 'B');
                }}
                className="w-full rounded-lg border border-gray-300 p-3 text-sm"
              >
                <option value="">Select a resume</option>
                {resumes.map((resume) => (
                  <option key={resume.resumeId} value={resume.resumeId}>
                    {resume.fileName}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {resumeLoadHint && (
            <p className="mt-3 text-sm text-blue-700 bg-blue-50 border border-blue-200 px-3 py-2 rounded-lg">
              {resumeLoadHint}
            </p>
          )}
        </section>

        <section className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <FlaskConical className="text-blue-600" size={18} />
            <h2 className="text-xl font-semibold text-gray-900">Service Overview</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="rounded-lg bg-gray-50 p-4 border border-gray-200">
              <p className="text-gray-500">Health</p>
              <p className="font-semibold text-gray-900 mt-1">{(health?.status || 'unknown').toUpperCase()}</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-4 border border-gray-200">
              <p className="text-gray-500">Version</p>
              <p className="font-semibold text-gray-900 mt-1">{stats?.version || health?.version || 'N/A'}</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-4 border border-gray-200">
              <p className="text-gray-500">Skills Loaded</p>
              <p className="font-semibold text-gray-900 mt-1">{health?.skills_loaded ?? 'N/A'}</p>
            </div>
          </div>

          {industries.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Industries</p>
              <div className="flex flex-wrap gap-2">
                {industries.map((industry, idx) => (
                  <span key={idx} className="px-3 py-1 text-xs rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    {industry.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Analyze Enhanced</h2>
          <form onSubmit={onAnalyzeEnhanced} className="space-y-3">
            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              className="w-full min-h-[140px] rounded-lg border border-gray-300 p-3 text-sm"
              placeholder="Paste resume text"
            />
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="w-full min-h-[120px] rounded-lg border border-gray-300 p-3 text-sm"
              placeholder="Paste job description (optional)"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-60"
            >
              {loading ? 'Analyzing...' : 'Run /api/ml/analyze-enhanced'}
            </button>
          </form>

          {enhancedResult && (
            <pre className="mt-4 bg-gray-900 text-gray-100 text-xs p-3 sm:p-4 rounded-lg overflow-auto">
{JSON.stringify(enhancedResult, null, 2)}
            </pre>
          )}
        </section>

        <section className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Compare Resumes</h2>
          <form onSubmit={onCompareResumes} className="space-y-3">
            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              className="w-full min-h-[120px] rounded-lg border border-gray-300 p-3 text-sm"
              placeholder="Resume A text"
            />
            <textarea
              value={resumeTextB}
              onChange={(e) => setResumeTextB(e.target.value)}
              className="w-full min-h-[120px] rounded-lg border border-gray-300 p-3 text-sm"
              placeholder="Resume B text"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg disabled:opacity-60"
            >
              {loading ? 'Comparing...' : 'Run /api/ml/compare-resumes'}
            </button>
          </form>

          {comparisonResult && (
            <pre className="mt-4 bg-gray-900 text-gray-100 text-xs p-3 sm:p-4 rounded-lg overflow-auto">
{JSON.stringify(comparisonResult, null, 2)}
            </pre>
          )}
        </section>
      </main>
    </div>
  );
}
