'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Heart, MapPin, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const MEDICAL_CONDITIONS = [
  'Brain Cancer', 'Glioma', 'Lung Cancer', 'Breast Cancer', 
  'Heart Disease', 'Diabetes', 'Alzheimer\'s', 'Parkinson\'s',
  'Leukemia', 'Lymphoma', 'Prostate Cancer', 'Other'
];

export default function PatientOnboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    symptoms: '',
    conditions: [],
    city: '',
    country: '',
  });
  const [errors, setErrors] = useState({});

  const totalSteps = 3;

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  }, [errors]);

  const toggleCondition = useCallback((condition) => {
    setFormData(prev => ({
      ...prev,
      conditions: prev.conditions.includes(condition)
        ? prev.conditions.filter(c => c !== condition)
        : [...prev.conditions, condition]
    }));
  }, []);

  const validateStep = useCallback(() => {
    const newErrors = {};
    
    if (step === 1) {
      if (!formData.name.trim()) newErrors.name = 'Name is required';
      if (!formData.email.trim()) newErrors.email = 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Invalid email format';
      }
      if (!formData.password) newErrors.password = 'Password is required';
      else if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }
    } else if (step === 2) {
      if (!formData.symptoms.trim() && formData.conditions.length === 0) {
        newErrors.conditions = 'Please describe your condition or select from the list';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [step, formData]);

  const handleNext = useCallback(() => {
    if (validateStep()) {
      if (step < totalSteps) {
        setStep(prev => prev + 1);
      }
    }
  }, [step, validateStep]);

  const handleBack = useCallback(() => {
    if (step > 1) setStep(prev => prev - 1);
  }, [step]);

  const handleSubmit = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          role: 'PATIENT',
        }),
      });

      if (response.ok) {
        router.push('/patient/dashboard');
      } else {
        const data = await response.json();
        setErrors({ submit: data.error || 'Registration failed' });
      }
    } catch (error) {
      setErrors({ submit: 'Something went wrong. Please try again.' });
    } finally {
      setLoading(false);
    }
  }, [formData, router]);

  const progressPercentage = useMemo(() => (step / totalSteps) * 100, [step]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          <div className="flex items-center space-x-2">
            <Heart className="w-6 h-6 text-blue-600" />
            <span className="text-xl font-bold">CuraLink</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-600">Step {step} of {totalSteps}</span>
              <span className="text-sm font-medium text-gray-600">{Math.round(progressPercentage)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.3 }}
                className="h-full bg-gradient-to-r from-blue-600 to-purple-600"
              />
            </div>
          </div>

          {/* Step Content */}
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100"
          >
            <AnimatePresence mode="wait">
              {/* Step 1: Basic Information */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    Welcome to CuraLink
                  </h2>
                  <p className="text-gray-600 mb-8">
                    Let&apos;s start by creating your account
                  </p>

                  <div className="space-y-5">
                    <Input
                      label="Full Name"
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={handleInputChange}
                      error={errors.name}
                      placeholder="John Doe"
                    />
                    <Input
                      label="Email Address"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      error={errors.email}
                      placeholder="john@example.com"
                    />
                    <Input
                      label="Password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      error={errors.password}
                      placeholder="••••••••"
                    />
                  </div>
                </motion.div>
              )}

              {/* Step 2: Medical Information */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    Tell Us About Your Condition
                  </h2>
                  <p className="text-gray-600 mb-8">
                    This helps us personalize your experience
                  </p>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Describe your symptoms or condition
                      </label>
                      <textarea
                        name="symptoms"
                        value={formData.symptoms}
                        onChange={handleInputChange}
                        rows={4}
                        className="block w-full rounded-xl border-2 border-gray-200 py-3 px-4 focus:border-blue-500 focus:ring-blue-500 focus:outline-none focus:ring-2 placeholder:text-gray-400 transition-colors"
                        placeholder="e.g., I have been diagnosed with brain cancer..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Or select from common conditions
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {MEDICAL_CONDITIONS.map((condition) => (
                          <button
                            key={condition}
                            type="button"
                            onClick={() => toggleCondition(condition)}
                            className={`
                              px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all
                              ${formData.conditions.includes(condition)
                                ? 'border-blue-600 bg-blue-50 text-blue-700'
                                : 'border-gray-200 hover:border-gray-300 text-gray-700'
                              }
                            `}
                          >
                            {condition}
                          </button>
                        ))}
                      </div>
                      {errors.conditions && (
                        <p className="mt-2 text-sm text-red-600 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors.conditions}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Location */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    Where Are You Located?
                  </h2>
                  <p className="text-gray-600 mb-8">
                    This helps us find nearby clinical trials and experts
                  </p>

                  <div className="space-y-5">
                    <Input
                      label="City"
                      name="city"
                      type="text"
                      icon={MapPin}
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="New York"
                    />
                    <Input
                      label="Country"
                      name="country"
                      type="text"
                      icon={MapPin}
                      value={formData.country}
                      onChange={handleInputChange}
                      placeholder="United States"
                    />
                  </div>

                  {errors.submit && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                      <p className="text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-2" />
                        {errors.submit}
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 gap-4">
              {step > 1 && (
                <Button
                  variant="secondary"
                  onClick={handleBack}
                  icon={ArrowLeft}
                  className="flex-1"
                >
                  Back
                </Button>
              )}
              <Button
                onClick={step < totalSteps ? handleNext : handleSubmit}
                loading={loading}
                icon={step < totalSteps ? ArrowRight : undefined}
                className={step === 1 ? 'w-full' : 'flex-1'}
              >
                {step < totalSteps ? 'Continue' : 'Complete Setup'}
              </Button>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
