import { useState } from 'react'
import OnboardingStep from './OnboardingStep'

const OnboardingFlow = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState({
    role: '',
    personality: '',
    workStyle: '',
    motivation: '',
    cofounderPreference: '',
    startupStage: ''
  })

  const onboardingQuestions = [
    // 1. Personality Traits (Big Five)
    {
      id: 'openness',
      prompt: 'I enjoy exploring new ideas, even if they are unconventional.',
      type: 'scale',
      scaleMinLabel: 'Strongly Disagree',
      scaleMaxLabel: 'Strongly Agree',
    },
    {
      id: 'conscientiousness',
      prompt: 'I like to plan ahead and stick to a structured schedule.',
      type: 'scale',
      scaleMinLabel: 'Strongly Disagree',
      scaleMaxLabel: 'Strongly Agree',
    },
    {
      id: 'extraversion',
      prompt: 'I get energy from group conversations and social events.',
      type: 'scale',
      scaleMinLabel: 'Strongly Disagree',
      scaleMaxLabel: 'Strongly Agree',
    },
    {
      id: 'agreeableness',
      prompt: 'I prefer harmony over conflict, even in team discussions.',
      type: 'scale',
      scaleMinLabel: 'Strongly Disagree',
      scaleMaxLabel: 'Strongly Agree',
    },
    {
      id: 'neuroticism',
      prompt: 'I stay calm under pressure, even when things go wrong.',
      type: 'scale',
      scaleMinLabel: 'Strongly Disagree',
      scaleMaxLabel: 'Strongly Agree',
    },
    // 2. Availability & Work Style
    {
      id: 'availability',
      prompt: 'How many hours can you realistically commit each week?',
      type: 'single_choice',
      options: [
        'Nights/weekends only',
        '10–20 hrs/week',
        '20–40 hrs/week',
        'Full-time',
        'Depends on the match',
      ],
    },
    {
      id: 'availability_flexibility',
      prompt: 'How flexible are you with your availability?',
      type: 'single_choice',
      options: ['Very rigid', 'Slightly flexible', 'Very flexible'],
    },
    {
      id: 'chronotype',
      prompt: 'When are you most productive?',
      type: 'single_choice',
      options: ['Early morning (5am–10am)', 'Midday (11am–4pm)', 'Evening/Night (5pm–2am)', 'Flexible throughout the day'],
    },
    // 3. Communication Style
    {
      id: 'communication',
      prompt: "What is your preferred team communication style?",
      type: 'single_choice',
      options: ['Async-first', 'Weekly syncs/check-ins', 'Daily check-ins and active messaging', 'Depends on the team'],
    },
    // 4. Conflict Style
    {
      id: 'conflict_style',
      prompt: 'How do you typically handle conflict in a team?',
      type: 'single_choice',
      options: [
        'I prefer to address it directly and resolve it quickly.',
        'I bring it up gently, usually after thinking it through.',
        'I try to avoid confrontation and hope it resolves.',
        'I usually internalize it unless it becomes urgent.',
      ],
    },
    // 5. Motivation & Values
    {
      id: 'motivations',
      prompt: 'Select up to 3 core motivations.',
      type: 'multi_select',
      options: ['Freedom', 'Impact', 'Wealth', 'Learning Fast', 'Collaboration'],
    },
    {
      id: 'top_motivation',
      prompt: 'Which of those is your #1 motivation?',
      type: 'single_choice',
      options: ['Freedom', 'Impact', 'Wealth', 'Learning Fast', 'Collaboration'],
    },
    {
      id: 'exit_scenario',
      prompt: 'A major company offers you a $5M buyout 2 years in. You:',
      type: 'single_choice',
      options: [
        'Take it — I value the exit.',
        'Consider it only if we have hit our mission.',
        'Decline — I am in for the long-term.',
        'Would want to discuss with my cofounder(s).',
      ],
    },
    // 6. Role & Skills
    {
      id: 'roles',
      prompt: 'Which of these best describe your strengths? (select realistically)',
      type: 'multi_select',
      options: [
        'Visionary',
        'Operator',
        'Technical',
        'Designer/UX',
        'Marketer',
        'Sales',
        'Generalist',
      ],
    },
    {
      id: 'preferred_role',
      prompt: 'What is your preferred founding role?',
      type: 'single_choice',
      options: [
        'I want to lead the vision',
        'I want to build the product',
        'I want to grow the user base',
        'I want to keep the team organized',
        'I am open, depends on the match',
      ],
    },
    // 7. Team Style
    {
      id: 'team_style',
      prompt: 'What kind of team dynamic do you prefer?',
      type: 'single_choice',
      options: [
        'Flat and collaborative',
        'Someone leads, others follow',
        'We define roles clearly and respect boundaries',
        'I am flexible, depends on the people',
      ],
    },
    {
      id: 'cofounder_frustration',
      prompt: 'What would frustrate you the most in a cofounder?',
      type: 'single_choice',
      options: [
        'Someone with low availability',
        'Someone who avoids conflict',
        'Someone disorganized',
        'Someone too controlling',
        'I can adapt to most types',
      ],
    },
  ]

  const handleStepComplete = (stepId, value) => {
    console.log(`Step ${currentStep + 1} completed: ${stepId} = ${value}`)
    
    const updatedFormData = {
      ...formData,
      [stepId]: value
    }
    
    setFormData(updatedFormData)
    
    if (currentStep < onboardingQuestions.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      // This is the final step - complete onboarding
      console.log('🌱 Onboarding completed! Final data:', updatedFormData)
      onComplete(updatedFormData)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const currentStepData = onboardingQuestions[currentStep]

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4"></div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2 font-poppins">
            Let's find your perfect cofounder
          </h1>
          <p className="text-xl text-gray-600 font-medium">
            This will only take a few minutes
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12">
          {/* Progress Bar */}
          <div className="mb-10">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-semibold text-gray-600">
                Step {currentStep + 1} of {onboardingQuestions.length}
              </span>
              <span className="text-sm font-semibold text-primary-600">
                {Math.round(((currentStep + 1) / onboardingQuestions.length) * 100)}% Complete
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-primary-500 to-primary-600 h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${((currentStep + 1) / onboardingQuestions.length) * 100}%` }}
              ></div>
            </div>
          </div>
          
          <OnboardingStep
            step={currentStepData}
            onComplete={handleStepComplete}
            onBack={handleBack}
            canGoBack={currentStep > 0}
            isLastStep={currentStep === onboardingQuestions.length - 1}
            formData={formData}
          />
        </div>
      </div>
    </div>
  )
}

export default OnboardingFlow 