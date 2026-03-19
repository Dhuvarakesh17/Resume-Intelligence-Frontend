import { ResumeResponse } from '@/lib/api';
import { ArrowRight } from 'lucide-react';
interface ResumeCardProps {
  resume: ResumeResponse;
  onClick: () => void;
}

export default function ResumeCard({ resume, onClick }: ResumeCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const fileTypeLabel = (resume.fileType || 'pdf').toUpperCase();
  const predictedRole =
    resume.score && 'predictedRole' in resume.score ? resume.score.predictedRole : null;

  return (
    <div
      onClick={onClick}
      className="bg-white backdrop-blur-sm rounded-xl p-6 border border-gray-200 hover:border-blue-500 transition-all cursor-pointer group shadow-md"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate group-hover:text-blue-600 transition">
            {resume.fileName}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {formatDate(resume.uploadedAt)}
          </p>
          <p className="text-xs text-gray-500 mt-1">{fileTypeLabel}</p>
        </div>
        
        {resume.score && (
          <div className="ml-4 flex-shrink-0">
            <div className="text-right">
              <div className={`text-2xl font-bold ${getScoreColor(resume.score.overallScore)}`}>
                {resume.score.overallScore.toFixed(0)}
              </div>
              <div className="text-xs text-gray-600">Overall Score</div>
            </div>
          </div>
        )}
      </div>

      {resume.score ? (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-sm">
            <div>
              <span className="text-gray-600">ATS Score:</span>
              <span className={`ml-2 font-semibold ${getScoreColor(resume.score.atsScore)}`}>
                {resume.score.atsScore.toFixed(0)}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Skill Match:</span>
              <span className={`ml-2 font-semibold ${getScoreColor(resume.score.skillScore)}`}>
                {resume.score.skillScore.toFixed(0)}
              </span>
            </div>
          </div>

          {predictedRole && (
            <div className="pt-3 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Role:</span>
                <span className="text-sm font-medium text-blue-600">{predictedRole}</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-sm text-gray-600 italic">
          No AI analysis (uploaded without job description)
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <a
          href={resume.blobUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-sm text-blue-600 hover:text-blue-700 transition flex items-center gap-1"
        >
          Download {fileTypeLabel} <ArrowRight size={14} />
        </a>
        <button
          onClick={onClick}
          className="text-sm text-gray-600 hover:text-gray-900 transition flex items-center gap-1"
        >
          View Details <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
