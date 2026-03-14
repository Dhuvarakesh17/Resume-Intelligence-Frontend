import { ResumeScoreDetail, ResumeScoreSummary } from '@/lib/api';

interface ScoreCardProps {
  title: string;
  score?: number;
  max?: number;
  color?: 'blue' | 'green' | 'purple' | 'orange';
}

function ScoreCard({ title, score, max = 100, color = 'blue' }: ScoreCardProps) {
  if (typeof score !== 'number') {
    return null;
  }

  const percentage = (score / max) * 100;
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-emerald-500',
    purple: 'bg-indigo-500',
    orange: 'bg-amber-500',
  };

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-md">
      <h3 className="text-sm font-medium text-gray-600 mb-2">{title}</h3>
      <div className="flex items-end gap-2">
        <span className="text-3xl font-bold text-gray-900">{score.toFixed(1)}</span>
        <span className="text-lg text-gray-500 mb-1">/ {max}</span>
      </div>
      <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${colorClasses[color]} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

interface ScoreDisplayProps {
  score: ResumeScoreDetail | ResumeScoreSummary;
}

export default function ScoreDisplay({ score }: ScoreDisplayProps) {
  const skillsFound = score.skillsFound ?? [];
  const criticalMissingSkills = score.criticalMissingSkills ?? [];
  const optionalMissingSkills = score.optionalMissingSkills ?? [];
  const missingSkillsFallback = score.missingSkills ?? [];
  const missingSkills =
    criticalMissingSkills.length || optionalMissingSkills.length
      ? []
      : missingSkillsFallback;
  const recommendedKeywords = score.recommendedKeywords ?? [];
  const feedback = score.feedback ?? [];
  const wordQualityImprovements = score.wordQualityImprovements ?? [];

  const finalAtsScore = score.atsScore;
  const formatContribution = score.backendFormatScore;
  const textAtsPrediction = score.textAtsPrediction;

  const hasWordQualityBlock =
    typeof score.wordQualityScore === 'number' ||
    typeof score.professionalismScore === 'number' ||
    typeof score.weakWordsFound === 'number' ||
    typeof score.weakVerbsFound === 'number' ||
    typeof score.genericPhrasesFound === 'number';

  return (
    <div className="space-y-6">
      {/* Score Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <ScoreCard title="Overall Score" score={score.overallScore} color="blue" />
        <ScoreCard title="ATS Score" score={finalAtsScore} color="green" />
        <ScoreCard title="ML Text ATS" score={textAtsPrediction} color="blue" />
        <ScoreCard title="Format Contribution" score={formatContribution} color="orange" />
        <ScoreCard title="Skill Match" score={score.skillScore} color="purple" />
        <ScoreCard title="Experience" score={score.experienceScore} color="orange" />
        <ScoreCard title="Keyword Score" score={score.keywordScore} color="green" />
        <ScoreCard title="Semantic Score" score={score.semanticScore} color="blue" />
        <ScoreCard title="Text Quality" score={score.textQualityScore} color="purple" />
        <ScoreCard title="Quantification" score={score.quantificationScore} color="orange" />
        {typeof score.confidence === 'number' && (
          <ScoreCard title="Confidence" score={score.confidence} color="green" />
        )}
        {typeof score.industryScore === 'number' && (
          <ScoreCard title="Industry Score" score={score.industryScore} color="blue" />
        )}
      </div>

      {(score.detectedIndustry || score.interpretation || typeof score.confidence === 'number') && (
        <div className="bg-white border border-cyan-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-medium text-cyan-700 mb-3">ML v2.0 Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-500">Detected Industry</p>
              <p className="text-lg font-semibold text-gray-900">{score.detectedIndustry || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Confidence</p>
              <p className="text-lg font-semibold text-gray-900">
                {typeof score.confidence === 'number' ? `${score.confidence.toFixed(1)}%` : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Interpretation</p>
              <p className="text-sm text-gray-700">{score.interpretation || 'No interpretation available.'}</p>
            </div>
          </div>
        </div>
      )}

      {score.predictedRole && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-medium text-blue-700 mb-2">Predicted Role</h3>
          <p className="text-2xl font-bold text-gray-900">{score.predictedRole}</p>
        </div>
      )}

      {/* Word Quality */}
      {hasWordQualityBlock && (
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Word Quality Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {typeof score.wordQualityScore === 'number' && (
              <div>
                <p className="text-sm text-gray-600">Overall Quality</p>
                <p className="text-2xl font-bold text-gray-900">{score.wordQualityScore}/100</p>
              </div>
            )}
            {typeof score.professionalismScore === 'number' && (
              <div>
                <p className="text-sm text-gray-600">Professionalism</p>
                <p className="text-2xl font-bold text-gray-900">{score.professionalismScore.toFixed(1)}/100</p>
              </div>
            )}
            {typeof score.weakWordsFound === 'number' && (
              <div>
                <p className="text-sm text-gray-600">Weak Words</p>
                <p className="text-xl font-semibold text-orange-600">{score.weakWordsFound}</p>
              </div>
            )}
            {typeof score.weakVerbsFound === 'number' && (
              <div>
                <p className="text-sm text-gray-600">Weak Verbs</p>
                <p className="text-xl font-semibold text-orange-600">{score.weakVerbsFound}</p>
              </div>
            )}
            {typeof score.genericPhrasesFound === 'number' && (
              <div>
                <p className="text-sm text-gray-600">Generic Phrases</p>
                <p className="text-xl font-semibold text-orange-600">{score.genericPhrasesFound}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Skills Found */}
      {skillsFound.length > 0 && (
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills Found</h3>
          <div className="flex flex-wrap gap-2">
            {skillsFound.map((skill, idx) => (
              <span
                key={idx}
                className="px-3 py-1 bg-green-100 border border-green-200 text-green-700 rounded-full text-sm"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Missing Skill Buckets */}
      {(criticalMissingSkills.length > 0 || optionalMissingSkills.length > 0) && (
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm space-y-5">
          <h3 className="text-lg font-semibold text-gray-900">Missing Skills</h3>

          {criticalMissingSkills.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-red-700 mb-2">Critical Missing Skills</h4>
              <div className="flex flex-wrap gap-2">
                {criticalMissingSkills.map((skill, idx) => (
                  <span
                    key={`critical-${idx}`}
                    className="px-3 py-1 bg-red-100 border border-red-200 text-red-700 rounded-full text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {optionalMissingSkills.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-amber-700 mb-2">Optional Missing Skills</h4>
              <div className="flex flex-wrap gap-2">
                {optionalMissingSkills.map((skill, idx) => (
                  <span
                    key={`optional-${idx}`}
                    className="px-3 py-1 bg-amber-100 border border-amber-200 text-amber-700 rounded-full text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Missing Skills */}
      {missingSkills.length > 0 && (
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Missing Skills</h3>
          <div className="flex flex-wrap gap-2">
            {missingSkills.map((skill, idx) => (
              <span
                key={idx}
                className="px-3 py-1 bg-red-100 border border-red-200 text-red-700 rounded-full text-sm"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recommended Keywords */}
      {recommendedKeywords.length > 0 && (
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommended Keywords</h3>
          <div className="flex flex-wrap gap-2">
            {recommendedKeywords.map((keyword, idx) => (
              <span
                key={idx}
                className="px-3 py-1 bg-blue-100 border border-blue-200 text-blue-700 rounded-full text-sm"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Feedback */}
      {feedback.length > 0 && (
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Improvement Feedback</h3>
          <ul className="space-y-2">
            {feedback.map((item, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <span className="text-blue-600 mt-1">•</span>
                <span className="text-gray-700">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Word Quality Improvements */}
      {wordQualityImprovements.length > 0 && (
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Word Quality Improvements</h3>
          <ul className="space-y-2">
            {wordQualityImprovements.map((item, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <span className="text-orange-600 mt-1">•</span>
                <span className="text-gray-700">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
