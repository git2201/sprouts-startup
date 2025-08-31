import { useState, useEffect } from 'react'
import OnboardingStep from './OnboardingStep'

const OnboardingFlow = ({ onComplete, showProfileUpdateBanner, prefill, isProfileUpdate }) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState(() => prefill ? { ...prefill } : {
    age: '',
    location: {
      city: '',
      state_region: '',
      country: ''
    },
    // Technical Competency Questions
    scaling_experience: '',
    technical_debt_decision: '',
    technology_choice: '',
    ai_ml_experience: '',
    crisis_response: '',
    // Leadership Questions
    team_scaling: '',
    cross_functional_collaboration: '',
    hiring_decision_mistake: '',
    mentoring_impact: '',
    cultural_leadership: '',
    // Strategic Thinking Questions
    technical_roadmap: '',
    build_vs_buy: '',
    technical_risk_communication: '',
    resource_constraints: '',
    cofounder_partnership: ''
  })
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [selectedProfile, setSelectedProfile] = useState(null)

  useEffect(() => {
    if (prefill) {
      setFormData({ ...prefill })
    }
  }, [prefill])

  const onboardingQuestions = [
    // 1. Age (with validation)
    {
      id: 'age',
      prompt: 'How old are you?',
      type: 'age_input',
      validation: {
        min: 16,
        message: 'You must be 16 or older to use this platform'
      }
    },
    // 2. Location
    {
      id: 'location',
      prompt: 'Where are you based?',
      type: 'location_input',
      fields: ['city', 'state_region', 'country']
    },

    // TECHNICAL COMPETENCY ASSESSMENT (Questions 3-7)
    // 3. System Scaling Challenge
    {
      id: 'scaling_experience',
      prompt: 'System Scaling Experience: Have you scaled a system to handle significantly more traffic/data?',
      type: 'single_choice',
      options: [
        'Yes - Led scaling from thousands to millions of users with specific bottlenecks identified',
        'Yes - Scaled systems 5-10x with measurable performance improvements',
        'Yes - Some scaling experience but mostly incremental improvements',
        'Limited - Helped with scaling but wasn\'t the primary technical lead',
        'No - Haven\'t had scaling challenges in my projects yet'
      ],
    },
    // 4. Technical Debt Decision
    {
      id: 'technical_debt_decision',
      prompt: 'Technical Debt Management: How do you handle technical debt vs. business deadlines?',
      type: 'single_choice',
      options: [
        'Strategic approach - I track debt, communicate risks, and plan paydown with measurable business impact',
        'Balanced approach - I take calculated technical debt but prioritize paying it down',
        'Deadline-focused - I take necessary shortcuts but document them for later',
        'Quality-focused - I rarely compromise technical standards for deadlines',
        'Still learning - I haven\'t had to make these strategic trade-offs yet'
      ],
    },
    // 5. Technology Choice Justification
    {
      id: 'technology_choice',
      prompt: 'Strategic Technology Decisions: How do you approach major technology choices?',
      type: 'single_choice',
      options: [
        'Systematic evaluation - I compare alternatives, consider long-term impact, and track outcomes',
        'Research-driven - I evaluate options thoroughly but focus more on current needs',
        'Experience-based - I choose technologies I know well and have confidence in',
        'Team-consensus - I collaborate with others to make technology decisions',
        'Learning-oriented - I often choose technologies that will expand my skills'
      ],
    },
    // 6. AI/ML Integration
    {
      id: 'ai_ml_experience',
      prompt: 'AI/ML Integration: What\'s your experience with AI/ML in production systems?',
      type: 'single_choice',
      options: [
        'Production experience - Built and deployed AI/ML systems with monitoring and optimization',
        'Integration experience - Successfully integrated AI APIs/models into applications',
        'Experimental experience - Built AI/ML prototypes and proof-of-concepts',
        'Learning phase - Currently studying AI/ML but haven\'t deployed production systems',
        'No experience - Haven\'t worked with AI/ML technologies yet'
      ],
    },
    // 7. Crisis Response
    {
      id: 'crisis_response',
      prompt: 'Crisis Management: How do you handle technical emergencies and production incidents?',
      type: 'single_choice',
      options: [
        'Experienced leader - I\'ve led incident response, coordinated teams, and implemented preventive measures',
        'Team contributor - I\'ve been part of incident response teams with some coordination experience',
        'Technical focus - I\'ve solved critical technical issues but less experience with team coordination',
        'Learning from incidents - I\'ve experienced incidents but still developing response processes',
        'Limited exposure - Haven\'t dealt with major production crises yet'
      ],
    },

    // LEADERSHIP AND TEAM MANAGEMENT (Questions 8-12)
    // 8. Team Scaling
    {
      id: 'team_scaling',
      prompt: 'Team Leadership: What\'s your experience managing technical teams through growth?',
      type: 'single_choice',
      options: [
        'Scaled teams - Led technical teams through significant growth (5+ to 15+ people)',
        'Team leadership - Managed small technical teams (2-5 people) through projects',
        'Project leadership - Led technical projects but not permanent team management',
        'Mentoring experience - Guided individual developers but limited team management',
        'Individual contributor - Strong technically but no formal management experience'
      ],
    },
    // 9. Cross-functional Collaboration
    {
      id: 'cross_functional_collaboration',
      prompt: 'Business-Technical Balance: How do you handle conflicts between engineering and business priorities?',
      type: 'single_choice',
      options: [
        'Strategic mediator - I translate between technical and business needs, finding win-win solutions',
        'Technical advocate - I effectively communicate technical constraints while staying collaborative',
        'Compromise-oriented - I find middle ground solutions that satisfy both sides',
        'Business-supportive - I generally adapt technical approaches to meet business needs',
        'Learning to balance - Still developing skills in cross-functional collaboration'
      ],
    },
    // 10. Hiring Decisions
    {
      id: 'hiring_decision_mistake',
      prompt: 'Technical Hiring: What\'s your approach to evaluating and hiring technical talent?',
      type: 'single_choice',
      options: [
        'Experienced hiring - I\'ve made multiple technical hires, learned from mistakes, and refined my process',
        'Some hiring experience - I\'ve participated in technical hiring with mixed results',
        'Interview experience - I\'ve conducted technical interviews but limited hiring responsibility',
        'Team input - I contribute to hiring decisions but rely heavily on team/manager guidance',
        'No hiring experience - Haven\'t been involved in technical hiring decisions yet'
      ],
    },
    // 11. Mentoring Impact
    {
      id: 'mentoring_impact',
      prompt: 'Development Leadership: How do you approach mentoring and developing other engineers?',
      type: 'single_choice',
      options: [
        'Active mentor - I\'ve guided multiple engineers through significant career growth',
        'Supportive colleague - I regularly help teammates learn and develop their skills',
        'Knowledge sharer - I contribute to team learning through code reviews and documentation',
        'Collaborative learner - I learn alongside teammates but less formal mentoring',
        'Individual focus - I\'m still building my own skills before mentoring others'
      ],
    },
    // 12. Cultural Leadership
    {
      id: 'cultural_leadership',
      prompt: 'Change Leadership: How do you lead technical teams through major organizational changes?',
      type: 'single_choice',
      options: [
        'Change champion - I\'ve successfully led teams through pivots, acquisitions, or major strategy shifts',
        'Steady influence - I help maintain team morale and productivity during uncertain times',
        'Adaptation focused - I help teams adjust to new processes, tools, or priorities',
        'Supportive teammate - I contribute positively but rely on others for change leadership',
        'Change recipient - I\'ve experienced changes but haven\'t led others through them'
      ],
    },

    // STRATEGIC THINKING AND BUSINESS ALIGNMENT (Questions 13-17)
    // 13. Technical Vision
    {
      id: 'technical_roadmap',
      prompt: 'Strategic Planning: How would you approach building a technical roadmap for a startup?',
      type: 'single_choice',
      options: [
        'Systematic planner - I balance feature development, scaling needs, and technical debt with clear prioritization frameworks',
        'Business-aligned - I create technical plans that directly support business objectives and timelines',
        'Iterative approach - I prefer shorter planning cycles with regular reassessment and adjustment',
        'Team collaborative - I develop technical direction through extensive team input and consensus',
        'Learning phase - I understand the importance but need to develop strategic planning skills'
      ],
    },
    // 14. Build vs Buy Decisions
    {
      id: 'build_vs_buy',
      prompt: 'Strategic Technology Decisions: How do you evaluate build vs. buy decisions for core systems?',
      type: 'single_choice',
      options: [
        'Framework-driven - I have systematic evaluation criteria including cost, risk, timeline, and strategic value',
        'Experience-based - I draw on past decisions and outcomes to guide similar choices',
        'Resource-conscious - I primarily consider team capacity and timeline constraints',
        'Quality-focused - I emphasize long-term maintainability and system integration',
        'Collaborative approach - I rely heavily on team input and external expertise for major decisions'
      ],
    },
    // 15. Risk Communication
    {
      id: 'technical_risk_communication',
      prompt: 'Executive Communication: How comfortable are you explaining technical risks to non-technical stakeholders?',
      type: 'single_choice',
      options: [
        'Executive communicator - I regularly present technical strategy and risks to C-level and board members',
        'Business translator - I effectively communicate technical concepts in business terms to stakeholders',
        'Clear explainer - I can explain technical issues clearly but have limited executive presentation experience',
        'Technical focus - I\'m more comfortable with technical discussions than business presentations',
        'Developing skill - I understand the importance but need to improve my communication skills'
      ],
    },
    // 16. Resource Constraints
    {
      id: 'resource_constraints',
      prompt: 'Startup Constraints: How do you approach technical challenges with limited resources (time, budget, team)?',
      type: 'single_choice',
      options: [
        'Creative problem solver - I find innovative solutions that maximize impact within constraints',
        'Priority-driven - I ruthlessly prioritize features and technical work based on business impact',
        'MVP-focused - I excel at building minimum viable solutions that can evolve over time',
        'Resource optimizer - I make existing resources more effective through better processes and tools',
        'Quality maintainer - I find ways to maintain technical standards even with limited resources'
      ],
    },
    // 17. Co-founder Partnership
    {
      id: 'cofounder_partnership',
      prompt: 'Co-founder Dynamics: What do you see as the key to successful technical/business co-founder partnerships?',
      type: 'single_choice',
      options: [
        'Partnership veteran - I\'ve successfully navigated co-founder relationships with clear communication and conflict resolution',
        'Collaboration focused - I prioritize open communication, shared decision-making, and mutual respect',
        'Boundary-aware - I believe in clear role definitions while maintaining collaborative problem-solving',
        'Learning-oriented - I\'m committed to developing strong partnership skills and addressing conflicts constructively',
        'Individual strength - I bring strong technical skills and am eager to learn effective co-founder collaboration'
      ],
    }
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
      console.log('Technical co-founder assessment completed! Final data:', updatedFormData)
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 font-poppins">
            Technical Co-founder Assessment
          </h1>
          <p className="text-xl text-gray-600 font-medium">
            Help us understand your technical leadership experience and approach
          </p>
        </div>

        {showProfileUpdateBanner && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 rounded">
            <strong>Enhanced Co-founder Matching!</strong>
            <div>
              Our assessment now includes technical leadership and strategic thinking questions for better matches.
            </div>
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12">
          {/* Progress Bar */}
          <div className="mb-10">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-semibold text-gray-600">
                Question {currentStep + 1} of {onboardingQuestions.length}
              </span>
              <span className="text-sm font-semibold text-green-600">
                {Math.round(((currentStep + 1) / onboardingQuestions.length) * 100)}% Complete
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500 ease-out"
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
            isProfileUpdate={isProfileUpdate}
          />
        </div>
      </div>
    </div>
  )
}

export default OnboardingFlow
