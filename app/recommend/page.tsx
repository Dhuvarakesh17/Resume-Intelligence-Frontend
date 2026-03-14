'use client';

import { useState, useEffect } from 'react';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import { useRouter } from 'next/navigation';
import { resumeApi, ResumeResponse } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { LayoutDashboard, Upload, BarChart3, Target, FileText, Award, MessageSquare, AlertCircle, CheckCircle, Lightbulb, Activity } from 'lucide-react';

type Recommendation = {
  category: string;
  icon: string;
  suggestions: string[];
  priority: 'high' | 'medium' | 'low';
};

export default function RecommendPage() {
  const { isLoading: authLoading } = useProtectedRoute();
  const router = useRouter();
  const [resumes, setResumes] = useState<ResumeResponse[]>([]);
  const [selectedResume, setSelectedResume] = useState<ResumeResponse | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSelection, setIsLoadingSelection] = useState(false);
  const [error, setError] = useState('');

  // Icon mapping function
  const getIconComponent = (iconName: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      'target': <Target className="w-8 h-8" />,
      'award': <Award className="w-8 h-8" />,
      'barChart': <BarChart3 className="w-8 h-8" />,
      'alertCircle': <AlertCircle className="w-8 h-8" />,
      'fileText': <FileText className="w-8 h-8" />,
      'messageSquare': <MessageSquare className="w-8 h-8" />,
      'checkCircle': <CheckCircle className="w-8 h-8" />,
    };
    return iconMap[iconName] || <Lightbulb className="w-8 h-8" />;
  };

  useEffect(() => {
    if (!authLoading) {
      fetchResumes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading]);

  useEffect(() => {
    if (selectedResume) {
      generateRecommendations(selectedResume);
    }
  }, [selectedResume]);

  const fetchResumes = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await resumeApi.getAll();
      setResumes(response.data);
      if (response.data.length > 0) {
        setSelectedResume(response.data[0]);
        void handleSelectResume(response.data[0]);
      }
    } catch (err) {
      setError(getErrorMessage(err) || 'Failed to load resumes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectResume = async (resume: ResumeResponse) => {
    setSelectedResume(resume);
    setIsLoadingSelection(true);

    try {
      const response = await resumeApi.getById(resume.resumeId);
      setSelectedResume(response.data);
    } catch (err) {
      setError(getErrorMessage(err) || 'Failed to load full resume details. Showing summary data.');
      setSelectedResume(resume);
    } finally {
      setIsLoadingSelection(false);
    }
  };

  const generateRecommendations = (resume: ResumeResponse) => {
    const recs: Recommendation[] = [];

    if (!resume.score) {
      setRecommendations([]);
      return;
    }

    const score = resume.score;
    const atsScore = score.atsScore ?? score.overallScore ?? 0;
    const skillScore = score.skillScore ?? 0;
    const experienceScore = score.experienceScore ?? 0;
    const professionalismScore = score.professionalismScore ?? score.textQualityScore ?? 0;
    const overallScore = score.overallScore ?? atsScore;
    const recommendedKeywords =
      'recommendedKeywords' in score ? score.recommendedKeywords || [] : [];

    // ATS Score recommendations
    if (atsScore < 70) {
      recs.push({
        category: 'ATS Optimization',
        icon: 'target',
        priority: 'high',
        suggestions: [
          'Add more industry-specific keywords from job descriptions',
          'Use standard section headers (Experience, Education, Skills)',
          'Avoid complex formatting, tables, and graphics',
          'Include relevant technical skills in a dedicated section',
          'Format dates consistently (MM/YYYY)',
        ],
      });
    }

    // Skills recommendations
    if (skillScore < 75) {
      recs.push({
        category: 'Skills Enhancement',
        icon: 'award',
        priority: 'high',
        suggestions: [
          'Add more relevant technical skills for your target role',
          'Include both hard and soft skills',
          'Quantify your skill proficiency levels',
          'Add certifications and training programs',
          'Match skills to job requirements in your industry',
        ],
      });
    }

    // Experience recommendations
    if (experienceScore < 70) {
      recs.push({
        category: 'Experience Section',
        icon: 'barChart',
        priority: 'medium',
        suggestions: [
          'Use action verbs to start bullet points (Led, Developed, Managed)',
          'Quantify achievements with numbers and percentages',
          'Focus on results and impact, not just responsibilities',
          'Tailor experience descriptions to target roles',
          'Include 3-5 bullet points per role',
        ],
      });
    }

    // Keyword recommendations
    if (recommendedKeywords.length > 5) {
      recs.push({
        category: 'Keyword Optimization',
        icon: 'alertCircle',
        priority: 'high',
        suggestions: [
          'Research and include industry-specific terminology',
          'Mirror language from target job descriptions',
          'Add relevant software, tools, and technologies',
          'Include professional certifications and methodologies',
          'Balance keyword density (aim for 2-3% of content)',
        ],
      });
    }

    // Formatting recommendations
    if (professionalismScore < 75) {
      recs.push({
        category: 'Formatting & Structure',
        icon: 'fileText',
        priority: 'medium',
        suggestions: [
          'Use a clean, professional font (Arial, Calibri, or similar)',
          'Keep margins between 0.5-1 inch',
          'Maintain consistent spacing and alignment',
          'Use bullet points for easy scanning',
          'Keep resume to 1-2 pages maximum',
        ],
      });
    }

    // Overall recommendations
    if (overallScore < 80) {
      recs.push({
        category: 'General Improvements',
        icon: 'messageSquare',
        priority: 'medium',
        suggestions: [
          'Add a compelling professional summary at the top',
          'Include measurable achievements in each role',
          'Proofread for spelling and grammar errors',
          'Update contact information and LinkedIn profile',
          'Customize resume for each job application',
        ],
      });
    }

    // If score is good, add enhancement suggestions
    if (overallScore >= 80) {
      recs.push({
        category: 'Excellence Tips',
        icon: 'checkCircle',
        priority: 'low',
        suggestions: [
          'Consider adding a portfolio link or personal website',
          'Highlight leadership roles and team achievements',
          'Include relevant volunteer work or side projects',
          'Add professional associations and memberships',
          'Keep your resume updated with recent accomplishments',
        ],
      });
    }

    setRecommendations(recs);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-red-500 bg-red-500/10';
      case 'medium':
        return 'border-yellow-500 bg-yellow-500/10';
      case 'low':
        return 'border-green-500 bg-green-500/10';
      default:
        return 'border-gray-500 bg-gray-500/10';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500 text-white';
      case 'medium':
        return 'bg-yellow-500 text-black';
      case 'low':
        return 'bg-green-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getPreviewSrc = (resume: ResumeResponse) => {
    const source = resume.previewUrl || resume.blobUrl;
    if (!source) {
      return '';
    }

    const lowerName = resume.fileName.toLowerCase();
    const fileType = (resume.fileType || '').toLowerCase();
    const isPdf = fileType === 'pdf' || lowerName.endsWith('.pdf');
    const alreadyViewerUrl =
      source.includes('docs.google.com/viewer') || source.includes('docs.google.com/gview');

    // Force an embeddable viewer for PDFs to avoid attachment-style blank iframe behavior.
    if (isPdf && !alreadyViewerUrl) {
      return `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(source)}`;
    }

    return source;
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
              Resume Recommendations
            </h1>
            <div className="flex gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg transition-all shadow-sm flex items-center gap-2"
              >
                <LayoutDashboard size={16} />
                Dashboard
              </button>
              <button
                onClick={() => router.push('/upload')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all shadow-sm flex items-center gap-2"
              >
                <Upload size={16} />
                Upload New
              </button>
              <button
                onClick={() => router.push('/score')}
                className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg transition-all shadow-sm flex items-center gap-2"
              >
                <BarChart3 size={16} />
                View Scores
              </button>
              <button
                onClick={() => router.push('/ml-tools')}
                className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg transition-all shadow-sm flex items-center gap-2"
              >
                <Activity size={16} />
                ML Tools
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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar - Resume Selector */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-md sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Select Resume</h2>
              
              {isLoading ? (
                <div className="text-center py-8 text-gray-600">Loading...</div>
              ) : resumes.length === 0 ? (
                <div className="text-center py-8 text-gray-600 text-sm">
                  No resumes yet. Upload one to get recommendations!
                </div>
              ) : (
                <div className="space-y-3">
                  {resumes.map((resume) => (
                    <div
                      key={resume.resumeId}
                      onClick={() => handleSelectResume(resume)}
                      className={`p-4 rounded-lg cursor-pointer transition-all ${
                        selectedResume?.resumeId === resume.resumeId
                          ? 'bg-purple-50 border-2 border-purple-500'
                          : 'bg-gray-50 border border-gray-200 hover:border-purple-300 hover:shadow-sm'
                      }`}
                    >
                      <p className="text-gray-900 font-medium truncate text-sm">
                        {resume.fileName}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(resume.uploadedAt).toLocaleDateString()}
                      </p>
                      {resume.score && (
                        <div className="mt-2 text-sm">
                          <span className="text-gray-400">Score: </span>
                          <span className="text-purple-400 font-bold">
                            {resume.score.overallScore.toFixed(0)}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Main Content - Resume Preview + Recommendations */}
          <div className="lg:col-span-3">
            {selectedResume ? (
              <>
                {isLoadingSelection && (
                  <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
                    Loading selected resume details...
                  </div>
                )}

                {/* Resume Document Display */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-md mb-8 overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Resume Preview</h3>
                        <p className="text-sm text-gray-600 mt-1">{selectedResume.fileName}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={selectedResume.blobUrl}
                          className="text-xs px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-md font-medium"
                        >
                          Download
                        </a>
                      </div>
                    </div>
                  </div>
                  <div className="aspect-[8.5/11] bg-gray-100 overflow-auto">
                    <iframe
                      src={getPreviewSrc(selectedResume)}
                      className="w-full h-full border-0"
                      title="Resume Preview"
                    />
                  </div>
                </div>

                {selectedResume.score ? (
                  <>
                    {/* Summary Card */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8 border border-blue-200 mb-8 shadow-md">
                      <h2 className="text-2xl font-bold text-gray-900 mb-4">
                        AI-Powered Recommendations for {selectedResume.fileName}
                      </h2>
                      <p className="text-gray-700 mb-4">
                        Based on your current resume score of{' '}
                        <span className="text-blue-600 font-bold text-xl">
                          {selectedResume.score.overallScore.toFixed(0)}
                        </span>
                        , here are personalized suggestions to improve your resume.
                      </p>
                      <div className="flex flex-wrap gap-3">
                        <div className="px-4 py-2 bg-red-100 rounded-full text-red-700 text-sm font-medium">
                          {recommendations.filter(r => r.priority === 'high').length} High Priority
                        </div>
                        <div className="px-4 py-2 bg-yellow-100 rounded-full text-yellow-700 text-sm font-medium">
                          {recommendations.filter(r => r.priority === 'medium').length} Medium Priority
                        </div>
                        <div className="px-4 py-2 bg-green-100 rounded-full text-green-700 text-sm font-medium">
                          {recommendations.filter(r => r.priority === 'low').length} Enhancement Tips
                        </div>
                      </div>
                    </div>

                    {/* Recommendations List */}
                    <div className="space-y-6">
                      {recommendations.map((rec, index) => (
                        <div
                          key={index}
                          className={`rounded-xl p-6 border-2 ${getPriorityColor(rec.priority)} backdrop-blur-sm transition-all hover:shadow-lg`}
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="text-blue-600">{getIconComponent(rec.icon)}</div>
                              <h3 className="text-xl font-bold text-gray-900">{rec.category}</h3>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${getPriorityBadge(rec.priority)}`}>
                              {rec.priority}
                            </span>
                          </div>

                          <ul className="space-y-3">
                            {rec.suggestions.map((suggestion, idx) => (
                              <li key={idx} className="flex items-start gap-3 text-gray-700">
                                <span className="text-blue-500 mt-1">▸</span>
                                <span>{suggestion}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-8 bg-white rounded-xl p-6 border border-gray-200 shadow-md">
                      <h3 className="text-xl font-bold text-gray-900 mb-4">Next Steps</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button
                          onClick={() => router.push('/upload')}
                          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all font-semibold shadow-md hover:shadow-lg"
                        >
                          Upload Revised Resume
                        </button>
                        <button
                          onClick={() => router.push('/score')}
                          className="px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg transition-all font-semibold shadow-sm hover:shadow-md"
                        >
                          View Detailed Scores
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-6">
                    This resume has no AI score yet. Upload with a job description to generate recommendations.
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-xl p-12 border border-gray-200 shadow-md text-center">
                <div className="flex justify-center mb-4">
                  <Lightbulb className="w-16 h-16 text-blue-600" />
                </div>
                <div className="text-gray-600 text-lg mb-2">
                  {isLoading
                    ? 'Loading...'
                    : resumes.length === 0
                    ? 'Upload a resume to get AI-powered recommendations'
                    : 'Select a resume to view recommendations'}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
