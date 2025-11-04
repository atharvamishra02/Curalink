import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { message, history } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Enhanced AI response logic with medical knowledge
    const response = await generateMedicalResponse(message, history);

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Error in AI chat:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

async function generateMedicalResponse(message, history = []) {
  const lowerMessage = message.toLowerCase();

  // Medical Symptoms & Conditions
  if (lowerMessage.match(/\b(symptom|pain|hurt|ache|fever|cough|headache|nausea|dizzy|tired|fatigue|weak)\b/)) {
    return analyzeMedicalSymptoms(message, lowerMessage);
  }

  // Specific Medical Conditions
  if (lowerMessage.match(/\b(cancer|diabetes|heart|cardiac|blood pressure|hypertension|asthma|arthritis|depression|anxiety)\b/)) {
    return provideMedicalConditionInfo(message, lowerMessage);
  }

  // Treatment & Medication Questions
  if (lowerMessage.match(/\b(treatment|medication|medicine|drug|therapy|cure|remedy)\b/)) {
    return provideTreatmentInfo(message, lowerMessage);
  }

  // Diagnosis & Testing
  if (lowerMessage.match(/\b(diagnos|test|scan|screening|blood work|mri|ct scan|x-ray|biopsy)\b/)) {
    return provideDiagnosticInfo(message, lowerMessage);
  }

  // Prevention & Lifestyle
  if (lowerMessage.match(/\b(prevent|avoid|diet|exercise|lifestyle|healthy|wellness|nutrition)\b/)) {
    return providePreventionInfo(message, lowerMessage);
  }

  // Mental Health
  if (lowerMessage.match(/\b(mental health|stress|depression|anxiety|sleep|insomnia|therapy|counseling)\b/)) {
    return provideMentalHealthInfo(message, lowerMessage);
  }

  // Emergency Situations
  if (lowerMessage.match(/\b(emergency|urgent|severe|critical|911|hospital|immediate)\b/)) {
    return `🚨 **IMPORTANT - EMERGENCY GUIDANCE**

If you're experiencing a medical emergency, please:
1. **Call 911 immediately** or go to the nearest emergency room
2. For chest pain, difficulty breathing, severe bleeding, or loss of consciousness - **DO NOT DELAY**
3. If experiencing stroke symptoms (facial drooping, arm weakness, speech difficulty) - **TIME IS CRITICAL**

**Common Medical Emergencies:**
- Chest pain or pressure
- Difficulty breathing or shortness of breath
- Severe abdominal pain
- Sudden confusion or difficulty speaking
- Uncontrolled bleeding
- Severe allergic reactions
- Loss of consciousness
- Suicidal thoughts or severe mental crisis

**Crisis Resources:**
- Emergency: 911
- National Suicide Prevention Lifeline: 988
- Poison Control: 1-800-222-1222

For non-emergency medical concerns, please consult with a healthcare provider through our platform or your primary care physician.

How can I help you find medical resources or information?`;
  }

  // Fall through to platform features
  return generatePlatformResponse(message, lowerMessage);
}

function analyzeMedicalSymptoms(message, lowerMessage) {
  // Pain-related symptoms
  if (lowerMessage.includes('pain') || lowerMessage.includes('hurt') || lowerMessage.includes('ache')) {
    return `I understand you're experiencing pain. While I can provide general information, **please consult a healthcare provider for proper diagnosis and treatment**.

**General Pain Management Information:**

**Types of Pain:**
- Acute pain (sudden onset, often from injury)
- Chronic pain (lasting more than 3 months)
- Neuropathic pain (nerve-related)
- Inflammatory pain (from conditions like arthritis)

**When to Seek Medical Attention:**
- Severe or worsening pain
- Pain accompanied by fever, swelling, or redness
- Pain after an injury or accident
- Pain that interferes with daily activities
- Chest pain or difficulty breathing

**General Management Approaches:**
- Rest and ice for acute injuries
- Over-the-counter pain relievers (consult pharmacist)
- Physical therapy for chronic conditions
- Lifestyle modifications (posture, ergonomics)
- Stress management techniques

**What I Can Help With:**
- Find clinical trials for pain management
- Connect you with pain specialists on our platform
- Locate research papers on pain conditions
- Find support groups and forums

Would you like me to help you search for:
1. Pain management specialists
2. Clinical trials for your condition
3. Research publications on pain treatment
4. Patient support communities`;
  }

  // Respiratory symptoms
  if (lowerMessage.match(/\b(cough|breathing|breath|wheez|asthma)\b/)) {
    return `I can help you understand respiratory symptoms. **Important: If you're having difficulty breathing, seek emergency medical care immediately.**

**Common Respiratory Conditions:**

**Acute Conditions:**
- Common cold/flu
- Bronchitis
- Pneumonia
- COVID-19

**Chronic Conditions:**
- Asthma
- COPD (Chronic Obstructive Pulmonary Disease)
- Chronic bronchitis
- Allergies

**When to See a Doctor:**
🚨 **Seek immediate care if:**
- Severe difficulty breathing
- Blue lips or face
- Chest pain
- High fever with cough
- Coughing up blood

**See a doctor soon if:**
- Persistent cough (>3 weeks)
- Wheezing or whistling sound when breathing
- Chronic shortness of breath
- Night-time breathing problems

**How Curalink Can Help:**
- **Find Specialists**: Search for pulmonologists and respiratory specialists
- **Clinical Trials**: Discover trials for respiratory conditions
- **Research**: Access latest publications on respiratory health
- **Community**: Connect with others managing similar conditions

Would you like help finding:
1. Respiratory specialists near you
2. Clinical trials for your condition
3. Support groups
4. Educational resources`;
  }

  // General symptoms
  return `Thank you for sharing your symptoms with me. While I can provide general health information, **I strongly recommend consulting with a healthcare provider for a proper diagnosis and treatment plan**.

**Understanding Your Symptoms:**

Symptoms can have many causes, and proper medical evaluation is essential for:
- Accurate diagnosis
- Appropriate treatment
- Ruling out serious conditions
- Peace of mind

**How Curalink Can Help You:**

**1. Find Medical Experts:**
- Search our directory of specialists
- Filter by condition and location
- Read reviews and credentials
- Book consultations

**2. Access Research:**
- Find latest medical publications
- Learn about your condition
- Understand treatment options
- Stay informed on medical advances

**3. Clinical Trials:**
- Discover trials for your condition
- Access cutting-edge treatments
- Contribute to medical research

**4. Community Support:**
- Connect with others facing similar issues
- Share experiences in forums
- Get emotional support

**Next Steps:**
1. Schedule an appointment with your doctor
2. Keep a symptom diary (when, how often, severity)
3. Note any triggers or patterns
4. List questions to ask your doctor

Would you like me to help you:
- Find specialists in your area?
- Search for clinical trials?
- Locate educational resources?
- Connect with support communities?`;
}

function provideMedicalConditionInfo(message, lowerMessage) {
  // Cancer-related
  if (lowerMessage.includes('cancer') || lowerMessage.includes('tumor') || lowerMessage.includes('oncology')) {
    return `I can provide information about cancer and oncology resources. **Remember, this is for educational purposes only - always consult with oncology specialists for medical advice.**

**Understanding Cancer:**

Cancer is a group of diseases involving abnormal cell growth. There are many types, each requiring specific treatment approaches.

**Common Types:**
- Breast cancer
- Lung cancer
- Prostate cancer
- Colorectal cancer
- Skin cancer (melanoma)
- Leukemia and lymphoma

**Treatment Approaches:**
- Surgery
- Chemotherapy
- Radiation therapy
- Immunotherapy
- Targeted therapy
- Hormone therapy
- Combination treatments

**How Curalink Supports Cancer Patients:**

**🧪 Clinical Trials:**
- Access cutting-edge cancer treatments
- Participate in research
- Search by cancer type and stage
- Filter by location and eligibility

**👨‍⚕️ Find Specialists:**
- Oncologists by specialty
- Cancer treatment centers
- Multidisciplinary teams
- Second opinion consultations

**📚 Research & Education:**
- Latest cancer research
- Treatment advances
- Survivorship resources
- Prevention strategies

**💬 Support Community:**
- Connect with survivors
- Share experiences
- Get emotional support
- Learn from others' journeys

**Important Resources:**
- American Cancer Society
- National Cancer Institute
- Cancer Support Communities

Would you like me to help you:
1. Search for oncology clinical trials
2. Find cancer specialists
3. Access research publications
4. Connect with support groups`;
  }

  // Heart disease
  if (lowerMessage.match(/\b(heart|cardiac|cardiovascular|blood pressure|hypertension|stroke)\b/)) {
    return `I can provide information about cardiovascular health. **For heart-related concerns, please consult with a cardiologist or your primary care physician.**

**Cardiovascular Health Overview:**

**Common Conditions:**
- Coronary artery disease
- Heart failure
- Arrhythmias (irregular heartbeat)
- High blood pressure (hypertension)
- Stroke
- Heart valve disease

**Risk Factors:**
- High cholesterol
- High blood pressure
- Diabetes
- Smoking
- Obesity
- Sedentary lifestyle
- Family history
- Age

**Prevention Strategies:**
- Regular exercise (150 min/week)
- Heart-healthy diet (Mediterranean, DASH)
- Maintain healthy weight
- Don't smoke
- Limit alcohol
- Manage stress
- Regular check-ups
- Know your numbers (BP, cholesterol, glucose)

**Warning Signs - Seek Immediate Help:**
🚨 **Call 911 if experiencing:**
- Chest pain or discomfort
- Shortness of breath
- Pain in arms, back, neck, jaw
- Lightheadedness or cold sweat
- Sudden severe headache (stroke)
- Facial drooping, arm weakness (stroke)

**How Curalink Can Help:**

**🏥 Find Cardiologists:**
- Heart specialists near you
- Subspecialties (electrophysiology, interventional)
- Hospital affiliations
- Patient reviews

**🧪 Cardiac Clinical Trials:**
- New treatments and devices
- Drug trials
- Prevention studies
- Rehabilitation programs

**📊 Research Access:**
- Latest cardiovascular research
- Treatment guidelines
- Prevention studies
- Lifestyle interventions

**💪 Support & Lifestyle:**
- Cardiac rehabilitation programs
- Nutrition guidance
- Exercise programs
- Support groups

Would you like help finding:
1. Cardiologists and heart specialists
2. Cardiovascular clinical trials
3. Heart-healthy lifestyle resources
4. Cardiac support communities`;
  }

  // Diabetes
  if (lowerMessage.includes('diabetes') || lowerMessage.includes('blood sugar') || lowerMessage.includes('insulin')) {
    return `I can provide information about diabetes management. **Please work with an endocrinologist or diabetes educator for personalized care.**

**Understanding Diabetes:**

**Types:**
- **Type 1**: Autoimmune, body doesn't produce insulin
- **Type 2**: Body doesn't use insulin properly (most common)
- **Gestational**: Occurs during pregnancy
- **Prediabetes**: Higher than normal blood sugar, not yet diabetes

**Key Management Components:**

**1. Blood Sugar Monitoring:**
- Regular glucose testing
- Understanding target ranges
- Recognizing high/low blood sugar
- Using continuous glucose monitors (CGM)

**2. Medication:**
- Insulin (for Type 1, some Type 2)
- Oral medications (Type 2)
- Injectable medications (GLP-1 agonists)
- Proper timing and dosing

**3. Diet & Nutrition:**
- Carbohydrate counting
- Consistent meal timing
- Portion control
- Choosing complex carbs
- Reading food labels

**4. Physical Activity:**
- Regular exercise
- Blood sugar monitoring before/after exercise
- Staying hydrated
- Finding activities you enjoy

**5. Regular Monitoring:**
- A1C tests (every 3-6 months)
- Eye exams
- Foot checks
- Kidney function tests
- Blood pressure monitoring

**Complications to Prevent:**
- Heart disease
- Kidney disease
- Eye problems (retinopathy)
- Nerve damage (neuropathy)
- Foot problems

**How Curalink Supports Diabetes Patients:**

**🔬 Clinical Trials:**
- New medications and insulin
- Glucose monitoring technology
- Complications prevention studies
- Diet and lifestyle interventions

**👨‍⚕️ Find Specialists:**
- Endocrinologists
- Diabetes educators
- Dietitians/nutritionists
- Podiatrists

**📚 Education & Research:**
- Latest diabetes research
- Management strategies
- Technology advances (pumps, CGMs)
- Lifestyle tips

**🤝 Community Support:**
- Connect with others managing diabetes
- Share tips and experiences
- Recipe sharing
- Motivation and encouragement

Would you like me to help you:
1. Find diabetes specialists or educators
2. Search for diabetes clinical trials
3. Access diabetes research and resources
4. Connect with diabetes support groups`;
  }

  // Mental health conditions
  if (lowerMessage.match(/\b(depression|anxiety|mental health|bipolar|ptsd)\b/)) {
    return provideMentalHealthInfo(message, lowerMessage);
  }

  // General condition information
  return `I can help you learn about various medical conditions and find appropriate resources. **Always consult healthcare professionals for diagnosis and treatment.**

**How Curalink Can Help You:**

**🏥 Find Specialists:**
Search our comprehensive directory of:
- Primary care physicians
- Specialists by condition
- Top-rated providers
- Convenient locations

**🧪 Clinical Trials:**
Discover trials for:
- Your specific condition
- New treatments
- Prevention studies
- Quality of life improvements

**📚 Medical Research:**
Access:
- Latest peer-reviewed publications
- Treatment guidelines
- Patient education materials
- Medical advances

**💬 Community Support:**
Connect with:
- Others with similar conditions
- Patient advocates
- Support groups
- Educational forums

**📊 Condition Management:**
- Track symptoms
- Monitor progress
- Set health goals
- Stay informed

**Next Steps:**
1. Consult with your healthcare provider
2. Get proper diagnosis
3. Discuss treatment options
4. Create management plan

What would you like help with today?
- Finding specialists
- Searching clinical trials
- Accessing research
- Joining support communities`;
}

function provideTreatmentInfo(message, lowerMessage) {
  return `I can provide general information about medical treatments. **Important: Always consult with your healthcare provider before starting, stopping, or changing any treatment.**

**Understanding Medical Treatments:**

**Types of Treatments:**

**1. Medications:**
- Prescription drugs
- Over-the-counter medications
- Biologics
- Generics vs. brand names

**2. Procedures:**
- Surgical interventions
- Minimally invasive procedures
- Diagnostic procedures
- Therapeutic procedures

**3. Therapies:**
- Physical therapy
- Occupational therapy
- Speech therapy
- Radiation therapy
- Chemotherapy

**4. Alternative/Complementary:**
- Acupuncture
- Chiropractic care
- Massage therapy
- Herbal supplements
*(Always discuss with your doctor)*

**Important Considerations:**

**Before Starting Treatment:**
- Understand the diagnosis
- Know treatment goals
- Discuss benefits and risks
- Ask about alternatives
- Consider cost and insurance coverage
- Understand timeline

**Questions to Ask Your Doctor:**
1. What are my treatment options?
2. What are the expected outcomes?
3. What are the side effects?
4. How long will treatment last?
5. Are there clinical trials available?
6. What if treatment doesn't work?

**Medication Safety:**
- Take as prescribed
- Don't skip doses
- Report side effects
- Check drug interactions
- Proper storage
- Don't share medications

**How Curalink Can Help:**

**🧪 Clinical Trials:**
- Access innovative treatments
- Try new therapies before general availability
- Receive expert medical care
- Contribute to medical science

**👨‍⚕️ Find Treatment Providers:**
- Specialists for your condition
- Treatment centers
- Second opinions
- Multidisciplinary teams

**📚 Research Treatment Options:**
- Compare different approaches
- Read success rates
- Understand mechanisms
- Learn from latest studies

**💬 Patient Experiences:**
- Hear from others who've had the treatment
- Real-world experiences
- Tips for managing side effects
- Support during treatment

**🔍 Treatment Decision Support:**
- Evidence-based information
- Treatment guidelines
- Risk/benefit analysis
- Cost considerations

Would you like me to help you:
1. Find clinical trials for specific treatments
2. Locate treatment specialists
3. Access research on treatment options
4. Connect with patients who've had similar treatments`;
}

function provideDiagnosticInfo(message, lowerMessage) {
  return `I can provide information about medical diagnostics and testing. **Remember: Interpretation of results should always be done by qualified healthcare professionals.**

**Common Diagnostic Tests:**

**Blood Tests:**
- Complete Blood Count (CBC)
- Metabolic panels
- Lipid profile (cholesterol)
- Thyroid function tests
- Vitamin and mineral levels
- Disease-specific markers

**Imaging Studies:**
- X-rays
- CT (Computed Tomography) scans
- MRI (Magnetic Resonance Imaging)
- Ultrasound
- PET scans
- Mammography

**Specialized Tests:**
- EKG/ECG (heart rhythm)
- Stress tests (cardiac function)
- Endoscopy (internal viewing)
- Biopsy (tissue sample)
- Genetic testing
- Allergy testing

**Screening Tests:**
- Cancer screenings (mammogram, colonoscopy, PSA)
- Bone density (osteoporosis)
- Vision and hearing tests
- Diabetes screening
- Blood pressure monitoring

**Understanding Your Tests:**

**Before Testing:**
- Understand why the test is needed
- Know preparation requirements (fasting, etc.)
- Ask about risks
- Verify insurance coverage
- Understand the process

**After Testing:**
- Ask when to expect results
- Schedule follow-up discussion
- Understand what results mean
- Ask about next steps
- Keep copies of results

**Test Results:**
- Normal ranges vary by lab
- One abnormal result doesn't always mean disease
- Some tests need to be repeated
- Context matters (age, other conditions)
- Discuss implications with your doctor

**When to Get Tested:**
🔍 **Screening recommendations vary by:**
- Age
- Gender
- Family history
- Risk factors
- Previous results

**How Curalink Can Help:**

**🏥 Find Testing Facilities:**
- Diagnostic centers near you
- Specialized imaging centers
- Laboratory services
- Screening programs

**👨‍⚕️ Connect with Specialists:**
- Radiologists
- Pathologists
- Diagnostic experts
- Second opinion consultations

**📚 Understand Your Tests:**
- Test explanation articles
- Normal range references
- Result interpretation guides
- Latest diagnostic advances

**🧪 Research & Clinical Trials:**
- New diagnostic methods
- Improved testing accuracy
- Early detection studies
- Screening program trials

**❓ Common Questions:**

**Q: How accurate are these tests?**
A: Varies by test; discuss sensitivity and specificity with your doctor.

**Q: Are there risks?**
A: Most tests are safe; some have minor risks discussed beforehand.

**Q: Will insurance cover it?**
A: Check with your insurance; some screenings are fully covered.

Would you like help finding:
1. Diagnostic specialists or facilities
2. Information about specific tests
3. Second opinion consultations
4. Clinical trials for diagnostic methods`;
}

function providePreventionInfo(message, lowerMessage) {
  return `I can provide evidence-based information about disease prevention and healthy living. **Prevention is key to maintaining optimal health!**

**Core Principles of Prevention:**

**1. Healthy Diet & Nutrition:**
- Eat plenty of fruits and vegetables (5-9 servings/day)
- Choose whole grains over refined
- Include lean proteins
- Limit processed foods
- Reduce sugar and sodium
- Stay hydrated (8 glasses water/day)
- Practice portion control

**2. Regular Physical Activity:**
- 150 minutes moderate exercise weekly
- Or 75 minutes vigorous exercise
- Include strength training 2x/week
- Stay active throughout the day
- Find activities you enjoy
- Start slowly and build up

**3. Maintain Healthy Weight:**
- Know your BMI
- Set realistic goals
- Combine diet and exercise
- Seek support if needed
- Focus on sustainable changes

**4. Don't Smoke:**
- Leading cause of preventable disease
- Increases cancer, heart disease risk
- Resources available to quit
- Never too late to stop

**5. Limit Alcohol:**
- Moderate consumption (if at all)
- Men: ≤2 drinks/day
- Women: ≤1 drink/day
- Some should avoid completely

**6. Get Adequate Sleep:**
- 7-9 hours per night
- Consistent sleep schedule
- Good sleep hygiene
- Address sleep disorders

**7. Manage Stress:**
- Practice relaxation techniques
- Meditation and mindfulness
- Regular exercise
- Social connections
- Professional help if needed

**8. Regular Check-ups:**
- Annual physical exams
- Age-appropriate screenings
- Dental check-ups
- Eye exams
- Vaccinations up to date

**Disease-Specific Prevention:**

**Heart Disease:**
- Control blood pressure
- Manage cholesterol
- Maintain healthy weight
- Exercise regularly
- Don't smoke

**Cancer:**
- Avoid tobacco
- Protect from sun
- Get screened regularly
- Limit alcohol
- Healthy diet

**Diabetes:**
- Maintain healthy weight
- Stay physically active
- Choose healthy foods
- Monitor risk factors

**Osteoporosis:**
- Adequate calcium and vitamin D
- Weight-bearing exercise
- Don't smoke
- Limit alcohol

**Mental Health:**
- Stay socially connected
- Manage stress
- Get adequate sleep
- Seek help when needed
- Practice self-care

**Preventive Screenings by Age:**

**Young Adults (18-39):**
- Blood pressure
- Cholesterol (if risk factors)
- Diabetes (if risk factors)
- STI testing (if sexually active)
- Mental health screening

**Middle Age (40-64):**
- All above, plus:
- Colorectal cancer screening (45+)
- Mammogram (women 40+)
- Prostate discussion (men 50+)
- Bone density (women at risk)

**Older Adults (65+):**
- All recommended screenings
- Annual wellness visits
- Fall prevention assessment
- Cognitive screening
- Medication review

**How Curalink Supports Prevention:**

**📚 Educational Resources:**
- Evidence-based prevention strategies
- Latest research on healthy living
- Condition-specific prevention guides
- Lifestyle modification programs

**👨‍⚕️ Find Preventive Care Providers:**
- Primary care physicians
- Nutritionists and dietitians
- Fitness specialists
- Wellness coaches

**🧪 Prevention Clinical Trials:**
- Dietary intervention studies
- Exercise programs
- Screening methods
- Risk reduction strategies

**💬 Wellness Community:**
- Share healthy recipes
- Workout motivation
- Accountability partners
- Success stories

**🎯 Track Your Health:**
- Set wellness goals
- Monitor progress
- Stay motivated
- Celebrate achievements

Would you like help with:
1. Creating a personal prevention plan
2. Finding wellness resources
3. Connecting with health coaches
4. Joining wellness programs`;
}

function provideMentalHealthInfo(message, lowerMessage) {
  return `I can provide information about mental health and wellness. **Mental health is just as important as physical health. Please seek professional help if you're struggling.**

**🆘 CRISIS RESOURCES (Available 24/7):**
- **National Suicide Prevention Lifeline: 988**
- **Crisis Text Line: Text "HELLO" to 741741**
- **SAMHSA National Helpline: 1-800-662-4357**

**Understanding Mental Health:**

**Common Mental Health Conditions:**

**Depression:**
- Persistent sad or empty mood
- Loss of interest in activities
- Changes in sleep or appetite
- Fatigue and low energy
- Difficulty concentrating
- Feelings of worthlessness

**Anxiety Disorders:**
- Excessive worry
- Panic attacks
- Social anxiety
- Specific phobias
- Generalized anxiety disorder (GAD)
- OCD (Obsessive-Compulsive Disorder)

**Other Conditions:**
- Bipolar disorder
- PTSD (Post-Traumatic Stress Disorder)
- Eating disorders
- ADHD (Attention-Deficit/Hyperactivity Disorder)
- Schizophrenia

**When to Seek Help:**
🚨 **Seek immediate help if:**
- Thoughts of suicide or self-harm
- Thoughts of harming others
- Unable to care for yourself
- Severe panic or anxiety
- Psychosis (losing touch with reality)

**See a professional if:**
- Symptoms interfere with daily life
- Relationship problems
- Work or school difficulties
- Substance use concerns
- Persistent sadness or worry
- Changes in sleep or appetite

**Treatment Options:**

**1. Therapy/Counseling:**
- Cognitive Behavioral Therapy (CBT)
- Dialectical Behavior Therapy (DBT)
- Psychodynamic therapy
- Group therapy
- Family therapy
- Online therapy platforms

**2. Medication:**
- Antidepressants
- Anti-anxiety medications
- Mood stabilizers
- Antipsychotics
*(Always prescribed and monitored by a doctor)*

**3. Lifestyle Interventions:**
- Regular exercise
- Adequate sleep
- Healthy diet
- Stress management
- Social connections
- Mindfulness/meditation

**4. Support Systems:**
- Support groups
- Peer support
- Family involvement
- Online communities

**Self-Care Strategies:**

**Daily Practices:**
- Maintain routine
- Practice gratitude
- Stay connected with others
- Engage in enjoyable activities
- Limit social media
- Spend time in nature

**Stress Management:**
- Deep breathing exercises
- Progressive muscle relaxation
- Mindfulness meditation
- Yoga
- Journaling
- Creative activities

**Sleep Hygiene:**
- Consistent sleep schedule
- Relaxing bedtime routine
- Limit screen time before bed
- Comfortable sleep environment
- Avoid caffeine late in day

**How Curalink Can Help:**

**👨‍⚕️ Find Mental Health Professionals:**
- Psychiatrists
- Psychologists
- Licensed therapists
- Counselors
- Support groups

**🧪 Mental Health Research & Trials:**
- New treatments
- Therapy approaches
- Medication trials
- Wellness interventions

**📚 Educational Resources:**
- Understanding conditions
- Treatment options
- Coping strategies
- Recovery stories

**💬 Supportive Community:**
- Peer support forums
- Shared experiences
- Reduce stigma
- Find understanding

**📱 Mental Health Tools:**
- Mood tracking
- Meditation apps
- Crisis hotlines
- Self-help resources

**Breaking the Stigma:**
- Mental health conditions are medical conditions
- Seeking help is a sign of strength
- Treatment works
- Recovery is possible
- You're not alone

**Important Reminders:**
✅ Mental health conditions are treatable
✅ Recovery is possible with proper care
✅ Asking for help is courageous
✅ You deserve support and compassion

Would you like me to help you:
1. Find mental health professionals
2. Access mental health resources
3. Learn about treatment options
4. Connect with support communities

**Remember: If you're in crisis, please call 988 or go to your nearest emergency room. You don't have to face this alone.**`;
}

function generatePlatformResponse(message, lowerMessage) {
  // Clinical Trials related queries
  if (lowerMessage.includes('clinical trial') || lowerMessage.includes('trial')) {
    return `I can help you with clinical trials! Here's what I can assist with:

1. **Search Trials**: You can search for clinical trials by condition in the "Clinical Trials" section
2. **My Trials**: Manage your own trials in the "My Clinical Trials" section
3. **Filter Options**: Use filters like status (RECRUITING, ACTIVE, COMPLETED), phase, and location
4. **Trial Details**: Click on any trial to view detailed information including eligibility criteria

Would you like help with something specific about clinical trials?`;
  }

  // Publications related queries
  if (lowerMessage.includes('publication') || lowerMessage.includes('paper') || lowerMessage.includes('research')) {
    return `I can help you with publications and research! Here's what you can do:

1. **Search Publications**: Find research papers by topic or condition in the "Publications" section
2. **My Publications**: Manage your own publications in your researcher profile
3. **View Details**: Access full abstracts, DOI links, and PubMed references
4. **Save Favorites**: Save publications you're interested in for later review

What specific research topic are you interested in?`;
  }

  // Collaboration related queries
  if (lowerMessage.includes('collabor') || lowerMessage.includes('connect') || lowerMessage.includes('network')) {
    return `Great! I can help you with collaboration:

1. **Find Researchers**: Browse researchers by specialty in the "Researchers" section
2. **Experts Directory**: Connect with medical experts in the "Experts" section
3. **My Collaborators**: View and manage your network in "Collaborators"
4. **Send Requests**: Click "Connect" or "Request Meeting" to reach out to researchers

Building your research network is essential. Would you like tips on finding the right collaborators?`;
  }

  // Default greeting/help
  if (lowerMessage.match(/\b(hello|hi|hey|help|guide)\b/)) {
    return `Hello! 👋 I'm Cura AI, your comprehensive medical research and health assistant. I'm here to help you with:

**🏥 Health & Medical Information:**
- Understand symptoms and conditions
- Learn about treatments and medications
- Get prevention and wellness tips
- Find mental health support
- Access diagnostic information

**🔬 Research Platform:**
- Clinical trials and research studies
- Publications and scientific papers
- Researcher collaboration
- Medical experts directory

**💡 How I Can Help:**
- Answer health-related questions (educational purposes)
- Guide you to appropriate medical resources
- Help navigate our platform
- Connect you with specialists
- Find clinical trials and research

**Important:** I provide educational information, but I'm not a substitute for professional medical advice. Always consult healthcare providers for diagnosis and treatment.

What would you like to know about?`;
  }

  // Default response
  return `I'm Cura AI, your medical research and health assistant! I can help you with:

**🏥 Health Information:**
- Symptoms and conditions
- Treatments and medications
- Prevention and wellness
- Mental health support
- Diagnostic testing

**🔬 Research Platform:**
- Clinical trials
- Medical publications
- Expert connections
- Support communities

**Ask me about:**
- Any health condition or symptom
- Treatment options
- Finding specialists
- Clinical trials
- Research papers
- Support groups

**Example questions:**
- "What are the symptoms of diabetes?"
- "How can I prevent heart disease?"
- "Tell me about cancer treatments"
- "How do I find clinical trials?"
- "Connect me with cardiologists"

How can I assist you today?`;
}
