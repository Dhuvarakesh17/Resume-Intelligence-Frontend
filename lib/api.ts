import axios, { AxiosInstance } from 'axios';
import Cookies from 'js-cookie';

let unauthorizedHandler: (() => void) | null = null;

export const setUnauthorizedHandler = (handler: (() => void) | null) => {
  unauthorizedHandler = handler;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add JWT token to all requests
api.interceptors.request.use((config) => {
  const token = Cookies.get('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = String(error.config?.url || '');
    const isAuthEndpoint =
      requestUrl.includes('/api/auth/login') ||
      requestUrl.includes('/api/auth/register') ||
      requestUrl.includes('/api/auth/google');

    if (!isAuthEndpoint && (error.response?.status === 401 || error.response?.status === 403)) {
      // Treat forbidden as expired/invalid auth and force re-login.
      Cookies.remove('token');
      if (unauthorizedHandler) {
        unauthorizedHandler();
      } else if (typeof window !== 'undefined') {
        // Fallback only when the app router is not yet initialized.
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  register: (email: string, password: string) =>
    api.post('/api/auth/register', { email, password }),

  login: (email: string, password: string) =>
    api.post<{ token: string }>('/api/auth/login', { email, password }),

  googleLogin: (payload: { idToken?: string; authorizationCode?: string; redirectUri?: string }) =>
    api.post<{ token: string }>('/api/auth/google', payload),
};

export interface UserProfileResponse {
  userId: number;
  email: string;
  name: string | null;
  role: string;
  phone: string | null;
  location: string | null;
  bio: string | null;
  avatarUrl: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  websiteUrl: string | null;
  createdAt: string;
  updatedAt: string | null;
  totalResumes: number;
  bestScore: number | null;
  averageScore: number | null;
  lastUploadedAt: string | null;
}

export interface UserUpdateRequest {
  name?: string;
  phone?: string;
  location?: string;
  bio?: string;
  avatarUrl?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  websiteUrl?: string;
}

export const userApi = {
  getMe: () => api.get<UserProfileResponse>('/api/users/me'),

  updateMe: (payload: UserUpdateRequest) =>
    api.patch<UserProfileResponse>('/api/users/me', payload),

  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    return api.post<{ avatarUrl?: string; url?: string } | UserProfileResponse>(
      '/api/users/me/avatar',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
  },
};

// ==================== v1.0 & v2.0 Score Fields ====================
export interface ResumeScore {
  // Core scores (backward + forward compatible)
  overallScore: number;
  atsScore: number;
  skillScore: number;
  experienceScore: number;

  // New ATS breakdown fields
  textAtsPrediction?: number;
  backendFormatScore?: number;

  // New detailed breakdown fields
  keywordScore?: number;
  semanticScore?: number;
  textQualityScore?: number;
  quantificationScore?: number;

  // Content fields
  predictedRole?: string;
  missingSkills?: string[];
  criticalMissingSkills?: string[];
  optionalMissingSkills?: string[];
  skillsFound?: string[];
  recommendedKeywords?: string[];
  feedback?: string[];

  // Legacy quality fields
  professionalismScore?: number;
  wordQualityScore?: number;
  weakWordsFound?: number;
  weakVerbsFound?: number;
  genericPhrasesFound?: number;
  wordQualityImprovements?: string[];
  
  // v2.0 Fields
  confidence?: number;           // Prediction confidence % (null if no JD)
  interpretation?: string;       // Human-readable score explanation
  detectedIndustry?: string;    // Auto-detected industry name
  industryScore?: number;       // Industry-specific score (0-100)
}

export interface ResumeScoreSummary {
  overallScore: number;
  atsScore: number;
  skillScore: number;
  experienceScore: number;
  textAtsPrediction?: number;
  backendFormatScore?: number;
  keywordScore?: number;
  semanticScore?: number;
  textQualityScore?: number;
  quantificationScore?: number;
  professionalismScore?: number;
  confidence?: number;
  interpretation?: string;
  detectedIndustry?: string;
  industryScore?: number;
}

export interface ResumeScoreDetail extends ResumeScoreSummary {
  predictedRole?: string;
  missingSkills?: string[];
  criticalMissingSkills?: string[];
  optionalMissingSkills?: string[];
  skillsFound?: string[];
  recommendedKeywords?: string[];
  feedback?: string[];
  wordQualityScore?: number;
  weakWordsFound?: number;
  weakVerbsFound?: number;
  genericPhrasesFound?: number;
  wordQualityImprovements?: string[];
}

export type ResumeFileType = 'pdf' | 'docx' | 'doc';

export interface ResumeResponse {
  resumeId: number;
  fileName: string;
  fileType?: ResumeFileType;
  blobUrl: string;
  previewUrl?: string;
  uploadedAt: string;
  score: ResumeScoreSummary | ResumeScoreDetail | null;
  extractedText?: string;
  resumeText?: string;
  text?: string;
}

// ==================== ML v2.0 DTOs ====================

export interface ComponentScore {
  score: number;
  confidence: number;
  weight: number;
}

export interface IndustryAnalysis {
  best_fit_industry: string;
  industry_score: number;
  missing_key_skills: string[];
}

export interface EnhancedMlResponse {
  status: string;
  final_score: number;
  confidence: number;
  interpretation: string;
  components: {
    semantic: ComponentScore;
    skills: ComponentScore;
    quality: ComponentScore;
  };
  recommendations: string[];
  industry_analysis: IndustryAnalysis;
}

export interface MlAnalyzeRequest {
  resume_text: string;
  job_description?: string;
}

export interface ComparisonResult {
  resume1_id: string;
  resume2_id: string;
  resume1_score: number;
  resume2_score: number;
  skill_overlap: string[];
  unique_to_resume1: string[];
  unique_to_resume2: string[];
  recommendation: string;
}

export interface FilterOptions {
  min_ats_score?: number;
  required_skills?: string[];
  industries?: string[];
  min_confidence?: number;
}

export interface FilterResult {
  matched_count: number;
  matched_resumes: Array<{
    id: string;
    score: number;
    matched_skills: string[];
    industry: string;
  }>;
}

export interface BatchProcessRequest {
  resumes: Array<{
    id: string;
    text: string;
  }>;
  job_description?: string;
  max_workers?: number;
}

export interface BatchResult {
  status: string;
  processed_count: number;
  results: Array<{
    id: string;
    score: number;
    confidence?: number;
    industry?: string;
  }>;
  duration_ms: number;
}

export interface RankingResult {
  status: string;
  ranked_resumes: Array<{
    id: string;
    rank: number;
    score: number;
    confidence?: number;
    industry?: string;
  }>;
}

export interface HealthStatus {
  status: string;
  version: string;
  skills_loaded: number;
  capabilities: string[];
}

export interface IndustryProfile {
  name: string;
  key_skills: string[];
  weight: number;
}

// ==================== Resume API ====================
export const resumeApi = {
  upload: (file: File, jobDescription?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (jobDescription) {
      formData.append('jobDescription', jobDescription);
    }
    return api.post<ResumeResponse>('/api/resumes/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  getAll: () => api.get<ResumeResponse[]>('/api/resumes'),

  getById: (id: number) => api.get<ResumeResponse>(`/api/resumes/${id}`),

  delete: (id: number) => api.delete(`/api/resumes/${id}`),
};

// ==================== ML API v2.0 ====================
export const mlApi = {
  // Info & Health
  health: () => api.get<HealthStatus>('/api/ml/health'),
  
  industries: () => api.get<IndustryProfile[]>('/api/ml/industries'),
  
  stats: () => api.get<{ version: string; capabilities: string[]; model: string }>('/api/ml/stats'),

  // v1.0 Analysis
  analyze: (resumeText: string, jobDescription?: string) =>
    api.post<ResumeScore>('/api/ml/analyze', {
      resume_text: resumeText,
      job_description: jobDescription,
    }),

  wordQuality: (resumeText: string) =>
    api.post<{ score: number; weak_words: number; weak_verbs: number; generic_phrases: number }>(
      '/api/ml/word-quality',
      { resume_text: resumeText }
    ),

  rank: (resumes: Array<{ id: string; text: string }>, jobDescription?: string) =>
    api.post<RankingResult>('/api/ml/rank', {
      resumes,
      job_description: jobDescription,
    }),

  // v2.0 Enhanced Analysis
  analyzeEnhanced: (resumeText: string, jobDescription?: string) =>
    api.post<EnhancedMlResponse>('/api/ml/analyze-enhanced', {
      resume_text: resumeText,
      job_description: jobDescription,
    }),

  analyzeMl: (resumeText: string, jobDescription?: string) =>
    api.post<EnhancedMlResponse>('/api/ml/analyze-ml', {
      resume_text: resumeText,
      job_description: jobDescription,
    }),

  industryScore: (resumeText: string, jobDescription?: string) =>
    api.post<{
      industries: Array<{ name: string; score: number }>;
      best_fit: string;
    }>('/api/ml/industry-score', {
      resume_text: resumeText,
      job_description: jobDescription,
    }),

  // Comparison & Ranking
  compareResumes: (resume1Text: string, resume2Text: string, jobDescription?: string) =>
    api.post<ComparisonResult>('/api/ml/compare-resumes', {
      resume1_text: resume1Text,
      resume2_text: resume2Text,
      job_description: jobDescription,
    }),

  findBestCandidate: (
    resumes: Array<{ id: string; text: string }>,
    jobDescription: string,
    weights?: { ats?: number; enhanced?: number; industry?: number }
  ) =>
    api.post<{ best_resume_id: string; score: number }>(
      '/api/ml/find-best-candidate',
      {
        resumes,
        job_description: jobDescription,
        weights: weights || { ats: 0.35, enhanced: 0.4, industry: 0.25 },
      }
    ),

  smartRank: (
    resumes: Array<{ id: string; text: string }>,
    jobDescription?: string,
    rankBy: 'ats_score' | 'enhanced_score' | 'industry_score' = 'ats_score'
  ) =>
    api.post<RankingResult>('/api/ml/smart-rank', {
      resumes,
      job_description: jobDescription,
      rank_by: rankBy,
    }),

  // Filtering
  filterResumes: (
    resumes: Array<{ id: string; text: string }>,
    jobDescription: string,
    filters: FilterOptions
  ) =>
    api.post<FilterResult>('/api/ml/filter-resumes', {
      resumes,
      job_description: jobDescription,
      filters,
    }),

  // Batch Processing
  batchProcess: (request: BatchProcessRequest) =>
    api.post<BatchResult>('/api/ml/batch-process', request),
};

export default api;
