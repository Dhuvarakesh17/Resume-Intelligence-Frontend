'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { ArrowRight, Upload, BarChart3, Lightbulb, Sparkles, Brain, Target, GitCompare } from 'lucide-react';

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-900 text-xl">Loading...</div>
      </div>
    );
  }

  // Authenticated user landing page
  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="flex items-center justify-center min-h-screen px-4 py-12 sm:px-6 sm:py-20">
          <div className="max-w-5xl mx-auto text-center">
            <div className="mb-8 sm:mb-10">
              <div className="w-16 h-16 sm:w-24 sm:h-24 bg-blue-600 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-xl">
                <Sparkles className="text-white" size={36} />
              </div>
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight mb-4">
                Welcome back!
              </h1>
              <p className="text-base sm:text-xl text-gray-600 mb-8 sm:mb-12 max-w-2xl mx-auto px-2 sm:px-0">
                Your AI-powered resume intelligence platform is ready. Analyze, optimize, and rank resumes with advanced ML algorithms.
              </p>
            </div>

            <button
              onClick={() => router.push('/dashboard')}
              className="w-full sm:w-auto px-8 sm:px-12 py-4 sm:py-5 bg-blue-600 text-white text-base sm:text-lg rounded-xl sm:rounded-2xl font-semibold hover:bg-blue-700 transition-all shadow-2xl hover:shadow-xl inline-flex items-center justify-center gap-3 mb-12 sm:mb-16 hover:scale-[1.02] sm:hover:scale-105 transform"
            >
              Get Started <ArrowRight size={24} />
            </button>

            {/* Feature Preview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-6xl mx-auto">
              <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <Sparkles className="text-blue-600" size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Enhanced Analysis</h3>
                <p className="text-sm text-gray-600">Deep ML scoring with confidence metrics</p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <Brain className="text-purple-600" size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Deep ML Analysis</h3>
                <p className="text-sm text-gray-600">BERT embeddings + spaCy NLP</p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <Target className="text-green-600" size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Industry Detection</h3>
                <p className="text-sm text-gray-600">Auto-detect best-fit industry profiles</p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <GitCompare className="text-orange-600" size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Compare Resumes</h3>
                <p className="text-sm text-gray-600">Side-by-side comparison insights</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="min-h-[75vh] sm:min-h-[90vh] flex items-center justify-center px-4 py-14 sm:px-6 sm:py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-gray-900 tracking-tight mb-5 sm:mb-6 leading-tight">
            AI-Powered Resume Analysis
          </h1>
          <p className="text-base sm:text-xl text-gray-600 mb-8 leading-relaxed max-w-2xl mx-auto px-2 sm:px-0">
            Get instant AI feedback on your resume. Improve ATS compatibility, enhance skills matching, and get actionable recommendations to land your next role.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-10 sm:mb-12">
            <Link
              href="/register"
              className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl inline-flex items-center justify-center gap-2"
            >
              Get Started Free <ArrowRight size={20} />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 bg-gray-100 text-gray-900 rounded-lg font-semibold hover:bg-gray-200 transition-all inline-flex items-center justify-center gap-2"
            >
              Sign In
            </Link>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-10 sm:mb-12 max-w-2xl mx-auto">
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-blue-600">10K+</div>
              <p className="text-gray-600 text-sm mt-1">Resumes Analyzed</p>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-blue-600">85%</div>
              <p className="text-gray-600 text-sm mt-1">Improvement Rate</p>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-blue-600">24/7</div>
              <p className="text-gray-600 text-sm mt-1">Available</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-gray-50 py-14 sm:py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center mb-10 sm:mb-16">How It Works</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-8">
            {/* Step 1 */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                <Upload className="text-blue-600" size={32} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Upload</h3>
              <p className="text-gray-600">
                Simply upload your resume in PDF format. Our system will analyze it instantly.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                <BarChart3 className="text-blue-600" size={32} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Analyze</h3>
              <p className="text-gray-600">
                AI evaluates your resume against industry standards and job requirements.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                <Lightbulb className="text-blue-600" size={32} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Improve</h3>
              <p className="text-gray-600">
                Receive actionable recommendations to boost your resume score and visibility.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-5 sm:mb-6">Ready to Optimize Your Resume?</h2>
          <p className="text-base sm:text-xl text-blue-100 mb-8 sm:mb-10">
            Join thousands of job seekers improving their resumes with AI
          </p>
          <Link
            href="/register"
            className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-50 transition-all inline-flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
          >
            Start Free <ArrowRight size={20} />
          </Link>
        </div>
      </section>
    </div>
  );
}
