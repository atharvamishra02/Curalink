'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Heart, Users, FlaskConical, ArrowRight, Sparkles, 
  Search, BookOpen, MessageSquare, Bell, Video, 
  TrendingUp, Shield, Zap, Globe, Award, CheckCircle,
  FileText, Database, Brain, UserCheck
} from 'lucide-react';
import { useState } from 'react';

export default function LandingPage() {
  const router = useRouter();
  const [activeFeature, setActiveFeature] = useState(0);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 100 }}
        className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-100"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              CuraLink
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => router.push('/login')}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              Sign In
            </button>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-6xl mx-auto"
        >
          {/* Main Heading */}
          <motion.div variants={itemVariants} className="text-center mb-12">
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-50 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-600">AI-Powered Healthcare Platform</span>
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Connect. Discover.
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Transform Healthcare
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              CuraLink bridges the gap between patients and researchers, making it easier to discover 
              clinical trials, medical publications, and health experts tailored to your needs.
            </p>
          </motion.div>

          {/* CTA Cards */}
          <motion.div variants={itemVariants} className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Patient Card */}
            <motion.div
              whileHover={{ scale: 1.02, y: -5 }}
              whileTap={{ scale: 0.98 }}
              className="group cursor-pointer"
              onClick={() => router.push('/patient/onboarding')}
            >
              <div className="relative h-full bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400 to-blue-600 rounded-bl-full opacity-10 group-hover:opacity-20 transition-opacity" />
                
                <div className="p-8 relative z-10">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Heart className="w-8 h-8 text-white" />
                  </div>
                  
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">
                    I&apos;m a Patient or Caregiver
                  </h2>
                  
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    Find relevant clinical trials, connect with health experts, and discover the latest medical research personalized to your condition.
                  </p>
                  
                  <div className="flex items-center text-blue-600 font-semibold group-hover:translate-x-2 transition-transform">
                    Get Started
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Researcher Card */}
            <motion.div
              whileHover={{ scale: 1.02, y: -5 }}
              whileTap={{ scale: 0.98 }}
              className="group cursor-pointer"
              onClick={() => router.push('/researcher/onboarding')}
            >
              <div className="relative h-full bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400 to-purple-600 rounded-bl-full opacity-10 group-hover:opacity-20 transition-opacity" />
                
                <div className="p-8 relative z-10">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <FlaskConical className="w-8 h-8 text-white" />
                  </div>
                  
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">
                    I&apos;m a Researcher
                  </h2>
                  
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    Collaborate with peers, manage clinical trials, engage with patients, and expand your research network with AI-powered tools.
                  </p>
                  
                  <div className="flex items-center text-purple-600 font-semibold group-hover:translate-x-2 transition-transform">
                    Get Started
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Key Features Grid */}
          <motion.div variants={itemVariants} className="mt-24">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              Everything You Need in One Platform
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center p-6 rounded-2xl hover:bg-white hover:shadow-lg transition-all">
                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Search className="w-7 h-7 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Smart Search</h3>
                <p className="text-gray-600 text-sm">
                  Find clinical trials, publications, and researchers from PubMed, arXiv, ORCID, and more
                </p>
              </div>
              
              <div className="text-center p-6 rounded-2xl hover:bg-white hover:shadow-lg transition-all">
                <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Brain className="w-7 h-7 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Assistant</h3>
                <p className="text-gray-600 text-sm">
                  Get instant answers about trials, research, and medical information with Cura AI
                </p>
              </div>
              
              <div className="text-center p-6 rounded-2xl hover:bg-white hover:shadow-lg transition-all">
                <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Users className="w-7 h-7 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Expert Network</h3>
                <p className="text-gray-600 text-sm">
                  Connect with verified researchers, schedule meetings, and collaborate seamlessly
                </p>
              </div>
              
              <div className="text-center p-6 rounded-2xl hover:bg-white hover:shadow-lg transition-all">
                <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-7 h-7 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Community Forums</h3>
                <p className="text-gray-600 text-sm">
                  Engage in discussions, share experiences, and get support from the community
                </p>
              </div>
              
              <div className="text-center p-6 rounded-2xl hover:bg-white hover:shadow-lg transition-all">
                <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Bell className="w-7 h-7 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Real-time Notifications</h3>
                <p className="text-gray-600 text-sm">
                  Stay updated on new trials, messages, and research relevant to your interests
                </p>
              </div>
              
              <div className="text-center p-6 rounded-2xl hover:bg-white hover:shadow-lg transition-all">
                <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-7 h-7 text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Research Library</h3>
                <p className="text-gray-600 text-sm">
                  Access millions of publications with advanced filtering and AI summaries
                </p>
              </div>
            </div>
          </motion.div>

          {/* Platform Stats */}
          <motion.div variants={itemVariants} className="mt-24 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 text-white">
            <div className="grid md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold mb-2">10K+</div>
                <div className="text-blue-100">Clinical Trials</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">5M+</div>
                <div className="text-blue-100">Publications</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">1K+</div>
                <div className="text-blue-100">Researchers</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">24/7</div>
                <div className="text-blue-100">AI Support</div>
              </div>
            </div>
          </motion.div>

          {/* For Patients Section */}
          <motion.div variants={itemVariants} className="mt-24">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-50 rounded-full mb-4">
                  <Heart className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-600">For Patients</span>
                </div>
                <h2 className="text-4xl font-bold text-gray-900 mb-6">
                  Your Health Journey, Simplified
                </h2>
                <p className="text-gray-600 mb-8 leading-relaxed">
                  CuraLink empowers patients with tools to discover relevant clinical trials, 
                  connect with expert researchers, and stay informed about the latest medical research.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Personalized Trial Matching</h4>
                      <p className="text-sm text-gray-600">Find trials that match your condition, location, and preferences</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Direct Researcher Contact</h4>
                      <p className="text-sm text-gray-600">Message researchers, request meetings, and get your questions answered</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Latest Research Updates</h4>
                      <p className="text-sm text-gray-600">Stay informed about new publications and breakthroughs in your area</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-8 border border-gray-100">
                <div className="space-y-4">
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FlaskConical className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">Phase 3 Trial</div>
                        <div className="text-sm text-gray-500">Recruiting Now</div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">New treatment for Type 2 Diabetes</div>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <UserCheck className="w-5 h-5 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">Dr. Sarah Johnson</div>
                        <div className="text-sm text-gray-500">Oncology Researcher</div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">Available for consultation</div>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">New Publication</div>
                        <div className="text-sm text-gray-500">PubMed</div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">Breakthrough in immunotherapy</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* For Researchers Section */}
          <motion.div variants={itemVariants} className="mt-24">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1 bg-gradient-to-br from-purple-50 to-blue-50 rounded-3xl p-8 border border-gray-100">
                <div className="space-y-4">
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Users className="w-5 h-5 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">Collaboration Network</div>
                        <div className="text-sm text-gray-500">250+ Connections</div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">Connect with peers worldwide</div>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Database className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">Trial Management</div>
                        <div className="text-sm text-gray-500">12 Active Trials</div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">Manage all your research in one place</div>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">Patient Engagement</div>
                        <div className="text-sm text-gray-500">45 New Inquiries</div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">Direct patient communication</div>
                  </div>
                </div>
              </div>
              <div className="order-1 md:order-2">
                <div className="inline-flex items-center space-x-2 px-4 py-2 bg-purple-50 rounded-full mb-4">
                  <FlaskConical className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-600">For Researchers</span>
                </div>
                <h2 className="text-4xl font-bold text-gray-900 mb-6">
                  Accelerate Your Research
                </h2>
                <p className="text-gray-600 mb-8 leading-relaxed">
                  Streamline your research workflow with powerful tools for collaboration, 
                  trial management, and patient engagement.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Centralized Trial Management</h4>
                      <p className="text-sm text-gray-600">Track all your clinical trials, publications, and collaborations</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Global Researcher Network</h4>
                      <p className="text-sm text-gray-600">Find collaborators, share insights, and expand your network</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Patient Recruitment Tools</h4>
                      <p className="text-sm text-gray-600">Connect with eligible patients interested in your trials</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Data Sources */}
          <motion.div variants={itemVariants} className="mt-24">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
              Powered by Trusted Sources
            </h2>
            <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
              We aggregate data from leading medical and research databases to provide comprehensive, up-to-date information
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center p-6 bg-white rounded-xl border border-gray-100">
                <div className="font-semibold text-gray-900 mb-1">PubMed</div>
                <div className="text-sm text-gray-500">35M+ Articles</div>
              </div>
              <div className="text-center p-6 bg-white rounded-xl border border-gray-100">
                <div className="font-semibold text-gray-900 mb-1">ClinicalTrials.gov</div>
                <div className="text-sm text-gray-500">450K+ Trials</div>
              </div>
              <div className="text-center p-6 bg-white rounded-xl border border-gray-100">
                <div className="font-semibold text-gray-900 mb-1">ORCID</div>
                <div className="text-sm text-gray-500">16M+ Researchers</div>
              </div>
              <div className="text-center p-6 bg-white rounded-xl border border-gray-100">
                <div className="font-semibold text-gray-900 mb-1">arXiv</div>
                <div className="text-sm text-gray-500">2M+ Preprints</div>
              </div>
            </div>
          </motion.div>

          {/* Final CTA */}
          <motion.div variants={itemVariants} className="mt-24 text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Join thousands of patients and researchers transforming healthcare together
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => router.push('/patient/onboarding')}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center space-x-2"
              >
                <span>Start as Patient</span>
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => router.push('/researcher/onboarding')}
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center space-x-2"
              >
                <span>Start as Researcher</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      </main>

      {/* Footer */}
      <motion.footer 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="border-t border-gray-100 py-8"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500 text-sm">
          <p>&copy; 2025 CuraLink. Transforming healthcare through AI and collaboration.</p>
        </div>
      </motion.footer>
    </div>
  );
}
