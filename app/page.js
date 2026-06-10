'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Heart, Users, FlaskConical, ArrowRight, Sparkles, 
  Search, BookOpen, MessageSquare, Bell, Video, 
  TrendingUp, Shield, Zap, Globe, Award, CheckCircle,
  FileText, Database, Brain, UserCheck, Stethoscope
} from 'lucide-react';
import { useState } from 'react';

export default function LandingPage() {
  const router = useRouter();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 25, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 15
      },
    },
  };

  return (
    <div className="min-h-screen bg-[#030014] text-slate-100 relative overflow-hidden font-sans selection:bg-indigo-500/30 selection:text-white">
      {/* Background spotlights */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none -z-10 animate-pulse" />
      <div className="absolute top-[20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-purple-500/10 blur-[130px] pointer-events-none -z-10" />
      <div className="absolute bottom-[-10%] left-[20%] w-[50vw] h-[50vw] rounded-full bg-pink-500/10 blur-[120px] pointer-events-none -z-10" />

      {/* Grid Pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none -z-10" />

      {/* Header */}
      <motion.header 
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        className="fixed top-0 w-full bg-[#030014]/65 backdrop-blur-xl z-50 border-b border-white/5"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => router.push('/')}>
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-white via-indigo-200 to-purple-400 bg-clip-text text-transparent tracking-tight">
              CuraLink
            </span>
          </div>
          <div>
            <button 
              onClick={() => router.push('/login')}
              className="px-5 py-2 text-sm font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all duration-300 backdrop-blur-sm"
            >
              Sign In
            </button>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <main className="pt-32 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-6xl mx-auto"
        >
          {/* Main Heading */}
          <motion.div variants={itemVariants} className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full mb-8 animate-float">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span className="text-sm font-medium text-indigo-300">AI-Powered Healthcare Ecosystem</span>
            </div>
            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-extrabold tracking-tight text-white mb-8 leading-[1.05]">
              Connect. Discover.
              <br />
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Transform Healthcare
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed font-light">
              CuraLink bridges the gap between patients and researchers, making it easier to discover 
              clinical trials, medical publications, and health experts tailored to your needs.
            </p>
          </motion.div>

          {/* CTA Cards */}
          <motion.div variants={itemVariants} className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-28">
            {/* Patient Card */}
            <motion.div
              whileHover={{ y: -6, scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="group cursor-pointer"
              onClick={() => router.push('/patient/onboarding')}
            >
              <div className="relative h-full bg-white/[0.02] hover:bg-white/[0.04] rounded-3xl p-8 border border-white/5 hover:border-indigo-500/30 transition-all duration-300 shadow-2xl backdrop-blur-md overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-bl-full filter blur-md opacity-20 group-hover:opacity-40 transition-opacity" />
                
                <div className="w-14 h-14 bg-indigo-500/10 group-hover:bg-indigo-500/20 border border-indigo-500/20 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300">
                  <Heart className="w-6 h-6 text-indigo-400" />
                </div>
                
                <h2 className="text-2xl font-bold text-white mb-3 tracking-tight">
                  I&apos;m a Patient or Caregiver
                </h2>
                
                <p className="text-slate-400 mb-8 leading-relaxed font-light text-sm sm:text-base">
                  Find relevant clinical trials, connect with health experts, and discover the latest medical research personalized to your condition.
                </p>
                
                <div className="flex items-center text-indigo-400 font-semibold group-hover:text-indigo-300 transition-colors">
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1.5 transition-transform" />
                </div>
              </div>
            </motion.div>

            {/* Researcher Card */}
            <motion.div
              whileHover={{ y: -6, scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="group cursor-pointer"
              onClick={() => router.push('/researcher/onboarding')}
            >
              <div className="relative h-full bg-white/[0.02] hover:bg-white/[0.04] rounded-3xl p-8 border border-white/5 hover:border-purple-500/30 transition-all duration-300 shadow-2xl backdrop-blur-md overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-bl-full filter blur-md opacity-20 group-hover:opacity-40 transition-opacity" />
                
                <div className="w-14 h-14 bg-purple-500/10 group-hover:bg-purple-500/20 border border-purple-500/20 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300">
                  <FlaskConical className="w-6 h-6 text-purple-400" />
                </div>
                
                <h2 className="text-2xl font-bold text-white mb-3 tracking-tight">
                  I&apos;m a Researcher
                </h2>
                
                <p className="text-slate-400 mb-8 leading-relaxed font-light text-sm sm:text-base">
                  Collaborate with peers, manage clinical trials, engage with patients, and expand your research network with AI-powered tools.
                </p>
                
                <div className="flex items-center text-purple-400 font-semibold group-hover:text-purple-300 transition-colors">
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1.5 transition-transform" />
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Key Features Grid */}
          <motion.div variants={itemVariants} className="mb-28">
            <h2 className="text-3xl sm:text-4xl font-bold text-center text-white mb-16 tracking-tight">
              Everything You Need in One Platform
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: Search, color: 'text-indigo-400', bg: 'bg-indigo-500/5', title: 'Smart Search', desc: 'Find clinical trials, publications, and researchers from PubMed, arXiv, ORCID, and more.' },
                { icon: Brain, color: 'text-purple-400', bg: 'bg-purple-500/5', title: 'Cura AI Assistant', desc: 'Get instant, simple explanations about complex trials, research details, and medical concepts.' },
                { icon: Users, color: 'text-emerald-400', bg: 'bg-emerald-500/5', title: 'Expert Network', desc: 'Connect with verified researchers, schedule digital meetings, and collaborate seamlessly.' },
                { icon: MessageSquare, color: 'text-pink-400', bg: 'bg-pink-500/5', title: 'Community Forums', desc: 'Engage in moderated discussions, share personal experiences, and find patient support.' },
                { icon: Bell, color: 'text-rose-400', bg: 'bg-rose-500/5', title: 'Real-time Notifications', desc: 'Stay updated on trial phases, replies to your discussions, and breakthroughs in your interest areas.' },
                { icon: BookOpen, color: 'text-cyan-400', bg: 'bg-cyan-500/5', title: 'Research Library', desc: 'Access millions of scientific publications with advanced contextual filtering and AI summaries.' }
              ].map((feature, idx) => (
                <div 
                  key={idx} 
                  className="bg-white/[0.01] hover:bg-white/[0.03] p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-all duration-300 group shadow-md"
                >
                  <div className={`w-12 h-12 ${feature.bg} rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                    <feature.icon className={`w-6 h-6 ${feature.color}`} />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2 tracking-tight">{feature.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed font-light">{feature.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Platform Stats */}
          <motion.div 
            variants={itemVariants} 
            className="mb-28 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent rounded-3xl p-10 sm:p-12 border border-white/5 shadow-2xl relative overflow-hidden group hover:border-indigo-500/20 transition-all duration-500"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center relative z-10">
              {[
                { label: 'Clinical Trials', value: '10K+' },
                { label: 'Publications', value: '5M+' },
                { label: 'Researchers', value: '1K+' },
                { label: 'AI Support', value: '24/7' }
              ].map((stat, idx) => (
                <div key={idx}>
                  <div className="text-4xl sm:text-5xl font-extrabold text-white mb-2 bg-gradient-to-r from-white via-indigo-200 to-purple-300 bg-clip-text text-transparent tracking-tight">
                    {stat.value}
                  </div>
                  <div className="text-xs sm:text-sm text-slate-400 font-light tracking-wide uppercase">{stat.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Detailed Features: Patients & Researchers */}
          <motion.div variants={itemVariants} className="space-y-28 mb-28">
            {/* For Patients */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center space-x-2 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full mb-6 text-xs sm:text-sm text-indigo-300">
                  <Heart className="w-4 h-4 text-indigo-400" />
                  <span>For Patients</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6 tracking-tight">
                  Your Health Journey, Simplified
                </h2>
                <p className="text-slate-400 mb-8 leading-relaxed font-light">
                  CuraLink empowers patients with simple search mechanisms and direct connections to research institutes. Stay updated and feel confident about clinical trial options.
                </p>
                <div className="space-y-5">
                  {[
                    { title: 'Personalized Trial Matching', desc: 'Find ongoing studies matching your specific medical records, preferred locations, and settings.' },
                    { title: 'Direct Researcher Contact', desc: 'Securely message leading specialists, request virtual consultations, and clear doubt factors.' },
                    { title: 'Latest Research Updates', desc: 'Track breakthroughs, journals, and community insights in real-time.' }
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-white tracking-tight">{item.title}</h4>
                        <p className="text-sm text-slate-400 leading-relaxed font-light mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 shadow-2xl backdrop-blur-md relative overflow-hidden group hover:border-indigo-500/10 transition-all duration-300">
                <div className="space-y-4">
                  {[
                    { title: 'Phase 3 Trial', status: 'Recruiting Now', desc: 'Novel targeted immunotherapy for advanced melanoma.', icon: FlaskConical, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
                    { title: 'Dr. Evelyn Martinez', status: 'Oncology Expert', desc: 'Available for digital consults & trial inquiries.', icon: UserCheck, color: 'text-purple-400', bg: 'bg-purple-500/10' },
                    { title: 'New Publication Summary', status: 'PubMed Insight', desc: 'Long-term efficacy data on early-stage CAR-T therapies.', icon: BookOpen, color: 'text-emerald-400', bg: 'bg-emerald-500/10' }
                  ].map((card, idx) => (
                    <div key={idx} className="bg-white/[0.02] hover:bg-white/[0.04] rounded-2xl p-4 border border-white/5 hover:border-white/10 transition-all duration-300 shadow-sm flex items-start space-x-4">
                      <div className={`w-10 h-10 ${card.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                        <card.icon className={`w-5 h-5 ${card.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold text-white text-sm tracking-tight">{card.title}</h4>
                          <span className="text-[10px] font-medium text-slate-400 bg-white/5 px-2 py-0.5 rounded-full">{card.status}</span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed font-light">{card.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* For Researchers */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1 bg-white/[0.02] border border-white/5 rounded-3xl p-8 shadow-2xl backdrop-blur-md relative overflow-hidden group hover:border-purple-500/10 transition-all duration-300">
                <div className="space-y-4">
                  {[
                    { title: 'Global Collaboration Network', status: '15 Active Sites', desc: 'Joint clinical trial dataset sharing across institutions.', icon: Users, color: 'text-purple-400', bg: 'bg-purple-500/10' },
                    { title: 'Trial Enrollment Metrics', status: '85% Target Achieved', desc: 'Real-time patient pre-screening pipelines via Cura AI.', icon: Database, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
                    { title: 'Patient Inquiries Queue', status: '12 New Inquiries', desc: 'Automated categorization and priority flagging.', icon: TrendingUp, color: 'text-pink-400', bg: 'bg-pink-500/10' }
                  ].map((card, idx) => (
                    <div key={idx} className="bg-white/[0.02] hover:bg-white/[0.04] rounded-2xl p-4 border border-white/5 hover:border-white/10 transition-all duration-300 shadow-sm flex items-start space-x-4">
                      <div className={`w-10 h-10 ${card.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                        <card.icon className={`w-5 h-5 ${card.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold text-white text-sm tracking-tight">{card.title}</h4>
                          <span className="text-[10px] font-medium text-slate-400 bg-white/5 px-2 py-0.5 rounded-full">{card.status}</span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed font-light">{card.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="order-1 md:order-2">
                <div className="inline-flex items-center space-x-2 px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-full mb-6 text-xs sm:text-sm text-purple-300">
                  <FlaskConical className="w-4 h-4 text-purple-400" />
                  <span>For Researchers</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6 tracking-tight">
                  Accelerate Scientific Research
                </h2>
                <p className="text-slate-400 mb-8 leading-relaxed font-light">
                  Streamline participant recruitment, coordinate with peers, catalog publications, and harness advanced machine learning summary tools to fast-track discoveries.
                </p>
                <div className="space-y-5">
                  {[
                    { title: 'Centralized Trial Management', desc: 'Monitor active and draft clinical studies, record milestones, and share status reports.' },
                    { title: 'Global Researcher Network', desc: 'Find co-investigators, cross-verify research findings, and publish joint preprints.' },
                    { title: 'AI Patient Recruitment', desc: 'Match with eligible pre-screened patients who voluntarily apply to join research programs.' }
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-white tracking-tight">{item.title}</h4>
                        <p className="text-sm text-slate-400 leading-relaxed font-light mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Trusted Sources */}
          <motion.div variants={itemVariants} className="mb-28 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 tracking-tight">
              Powered by Trusted Sources
            </h2>
            <p className="text-slate-400 mb-12 max-w-2xl mx-auto font-light text-sm sm:text-base">
              We aggregate data from leading global repositories to provide accurate, comprehensive insights.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { title: 'PubMed', detail: '35M+ Articles' },
                { title: 'ClinicalTrials.gov', detail: '450K+ Trials' },
                { title: 'ORCID', detail: '16M+ Researchers' },
                { title: 'arXiv', detail: '2M+ Preprints' }
              ].map((source, idx) => (
                <div 
                  key={idx} 
                  className="bg-white/[0.01] hover:bg-white/[0.03] p-5 rounded-2xl border border-white/5 hover:border-indigo-500/20 transition-all duration-300 group"
                >
                  <div className="font-bold text-white mb-1 tracking-tight text-lg group-hover:text-indigo-300 transition-colors">{source.title}</div>
                  <div className="text-xs text-slate-400 font-light">{source.detail}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Final CTA */}
          <motion.div 
            variants={itemVariants} 
            className="text-center bg-gradient-to-t from-indigo-500/10 via-purple-500/5 to-transparent rounded-3xl p-12 border border-indigo-500/10 shadow-2xl relative overflow-hidden"
          >
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white mb-6 tracking-tight leading-tight">
              Ready to Transform Healthcare?
            </h2>
            <p className="text-slate-400 mb-10 max-w-2xl mx-auto font-light text-base sm:text-lg">
              Join thousands of patients and researchers collaborate to unlock medical solutions together.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => router.push('/patient/onboarding')}
                className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-indigo-500/20 transition-all duration-300 flex items-center justify-center space-x-2"
              >
                <span>Start as Patient</span>
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => router.push('/researcher/onboarding')}
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300 flex items-center justify-center space-x-2"
              >
                <span>Start as Researcher</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-10 relative z-10 bg-[#030014]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-slate-500 text-sm font-light">
          <p>&copy; {new Date().getFullYear()} CuraLink. Connecting patients and researchers with AI and integrity.</p>
        </div>
      </footer>
    </div>
  );
}
