// Updated ProfileEdit.jsx - Key changes for profile picture support

import { useState, useEffect } from 'react'
import { updateUserProfile } from '../library/profiles.js'
import { replaceProfilePicture } from '../library/storage.js' // NEW IMPORT
import { Navigate, useNavigate } from 'react-router-dom'
import { supabase } from '../library/supabase.js'
import ProfilePictureUpload from '../components/ProfilePictureUpload.jsx' // NEW IMPORT

const ProfileEdit = ({ user, userProfile, setUserProfile, onLogout }) => {
  const navigate = useNavigate()
  
  // Redirect if no user
  if (!user) {
    return <Navigate to="/" replace />
  }

  // Initialize form data with current profile - INCLUDES AVATAR_URL
  const [formData, setFormData] = useState({
    // Basic Info
    name: userProfile?.name || '',
    email: userProfile?.email || user?.email || '',
    phone: userProfile?.phone || '',
    age: userProfile?.age || '',
    bio: userProfile?.bio || '',
    avatar_url: userProfile?.avatar_url || '', // NEW FIELD
    
    // Handle location as nested object to match OnboardingFlow structure
    location: userProfile?.location && typeof userProfile.location === 'object' ? 
      userProfile.location : 
      {
        city: '',
        state_region: '',
        country: ''
      },
    
    // Core Profile Fields for Matching
    roles: userProfile?.roles || [],
    industries: userProfile?.industries || [],
    motivations: userProfile?.motivations || [],
    availability: userProfile?.availability || '',
    communication_style: userProfile?.communication_style || '',
    work_style_preference: userProfile?.work_style_preference || '',
    
    // Technical fields
    scaling_experience: userProfile?.scaling_experience || '',
    technical_debt_decision: userProfile?.technical_debt_decision || '',
    technology_choice: userProfile?.technology_choice || '',
    ai_ml_experience: userProfile?.ai_ml_experience || '',
    crisis_response: userProfile?.crisis_response || '',
    
    // Leadership fields
    team_scaling: userProfile?.team_scaling || '',
    cross_functional_collaboration: userProfile?.cross_functional_collaboration || '',
    hiring_decision_mistake: userProfile?.hiring_decision_mistake || '',
    mentoring_impact: userProfile?.mentoring_impact || '',
    cultural_leadership: userProfile?.cultural_leadership || '',
    
    // Strategic fields
    technical_roadmap: userProfile?.technical_roadmap || '',
    build_vs_buy: userProfile?.build_vs_buy || '',
    technical_risk_communication: userProfile?.technical_risk_communication || '',
    resource_constraints: userProfile?.resource_constraints || '',
    cofounder_partnership: userProfile?.cofounder_partnership || ''
  })

  const [editingField, setEditingField] = useState(null)
  const [tempValue, setTempValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [error, setError] = useState('')
  const [avatarUploading, setAvatarUploading] = useState(false) // NEW STATE

  // NEW: Handle profile picture upload
  const handleAvatarUpload = async (file) => {
    setAvatarUploading(true)
    setError('')

    try {
      const { avatarUrl, error: uploadError } = await replaceProfilePicture(
        file, 
        user.id, 
        formData.avatar_url
      )

      if (uploadError) {
        setError('Failed to upload profile picture: ' + uploadError.message)
        return
      }

      // Update local state
      const updatedFormData = { ...formData, avatar_url: avatarUrl }
      setFormData(updatedFormData)
      setUserProfile(prev => ({ ...prev, avatar_url: avatarUrl }))
      setSuccessMessage('Profile picture updated successfully!')
      setTimeout(() => setSuccessMessage(''), 3000)

    } catch (err) {
      console.error('Avatar upload error:', err)
      setError('Failed to upload profile picture')
    } finally {
      setAvatarUploading(false)
    }
  }

  // Available options for dropdowns
  const roleOptions = [
    'Technical Co-founder',
    'Business Co-founder',
    'CEO',
    'CTO',
    'Developer',
    'Designer',
    'Product Manager',
    'Marketing',
    'Sales',
    'Operations'
  ]

  const industryOptions = [
    'AI/Machine Learning',
    'SaaS',
    'E-commerce',
    'FinTech',
    'HealthTech',
    'EdTech',
    'Gaming',
    'Blockchain/Crypto',
    'Social Media',
    'Marketplace',
    'Enterprise Software',
    'Consumer Apps',
    'Hardware',
    'Climate Tech',
    'Biotech'
  ]

  const motivationOptions = [
    'Financial Freedom',
    'Solving Important Problems',
    'Building Something Meaningful',
    'Creative Expression',
    'Learning and Growth',
    'Making an Impact',
    'Independence',
    'Building Wealth',
    'Helping Others',
    'Innovation',
    'Recognition',
    'Work-Life Balance'
  ]

  const availabilityOptions = [
    'Full-time (40+ hours/week)',
    'Part-time (20-40 hours/week)',
    'Evenings and weekends',
    'Flexible schedule',
    'Very limited availability'
  ]

  const communicationOptions = [
    'Direct and straightforward',
    'Collaborative and consensus-building',
    'Data-driven and analytical',
    'Supportive and encouraging',
    'Structured and formal'
  ]

  const workStyleOptions = [
    'Fast-paced and aggressive',
    'Steady and methodical',
    'Flexible and adaptive',
    'Structured and planned',
    'Creative and experimental'
  ]

  const technicalOptions = {
    scaling_experience: [
      'Yes - Led scaling from thousands to millions of users with specific bottlenecks identified',
      'Yes - Scaled systems 5-10x with measurable performance improvements',
      'Yes - Some scaling experience but mostly incremental improvements',
      'Limited - Helped with scaling but wasn\'t the primary technical lead',
      'No - Haven\'t had scaling challenges in my projects yet'
    ],
    technical_debt_decision: [
      'Strategic approach - I track debt, communicate risks, and plan paydown with measurable business impact',
      'Balanced approach - I take calculated technical debt but prioritize paying it down',
      'Deadline-focused - I take necessary shortcuts but document them for later',
      'Quality-focused - I rarely compromise technical standards for deadlines',
      'Still learning - I haven\'t had to make these strategic trade-offs yet'
    ],
    technology_choice: [
      'Systematic evaluation - I compare alternatives, consider long-term impact, and track outcomes',
      'Research-driven - I evaluate options thoroughly but focus more on current needs',
      'Experience-based - I choose technologies I know well and have confidence in',
      'Team-consensus - I collaborate with others to make technology decisions',
      'Learning-oriented - I often choose technologies that will expand my skills'
    ],
    ai_ml_experience: [
      'Production experience - Built and deployed AI/ML systems with monitoring and optimization',
      'Integration experience - Successfully integrated AI APIs/models into applications',
      'Experimental experience - Built AI/ML prototypes and proof-of-concepts',
      'Learning phase - Currently studying AI/ML but haven\'t deployed production systems',
      'No experience - Haven\'t worked with AI/ML technologies yet'
    ],
    crisis_response: [
      'Experienced leader - I\'ve led incident response, coordinated teams, and implemented preventive measures',
      'Team contributor - I\'ve been part of incident response teams with some coordination experience',
      'Technical focus - I\'ve solved critical technical issues but less experience with team coordination',
      'Learning from incidents - I\'ve experienced incidents but still developing response processes',
      'Limited exposure - Haven\'t dealt with major production crises yet'
    ]
  }

  const leadershipOptions = {
    team_scaling: [
      'Scaled teams - Led technical teams through significant growth (5+ to 15+ people)',
      'Team leadership - Managed small technical teams (2-5 people) through projects',
      'Project leadership - Led technical projects but not permanent team management',
      'Mentoring experience - Guided individual developers but limited team management',
      'Individual contributor - Strong technically but no formal management experience'
    ],
    cross_functional_collaboration: [
      'Strategic mediator - I translate between technical and business needs, finding win-win solutions',
      'Technical advocate - I effectively communicate technical constraints while staying collaborative',
      'Compromise-oriented - I find middle ground solutions that satisfy both sides',
      'Business-supportive - I generally adapt technical approaches to meet business needs',
      'Learning to balance - Still developing skills in cross-functional collaboration'
    ],
    hiring_decision_mistake: [
      'Experienced hiring - I\'ve made multiple technical hires, learned from mistakes, and refined my process',
      'Some hiring experience - I\'ve participated in technical hiring with mixed results',
      'Interview experience - I\'ve conducted technical interviews but limited hiring responsibility',
      'Team input - I contribute to hiring decisions but rely heavily on team/manager guidance',
      'No hiring experience - Haven\'t been involved in technical hiring decisions yet'
    ],
    mentoring_impact: [
      'Active mentor - I\'ve guided multiple engineers through significant career growth',
      'Supportive colleague - I regularly help teammates learn and develop their skills',
      'Knowledge sharer - I contribute to team learning through code reviews and documentation',
      'Collaborative learner - I learn alongside teammates but less formal mentoring',
      'Individual focus - I\'m still building my own skills before mentoring others'
    ],
    cultural_leadership: [
      'Change champion - I\'ve successfully led teams through pivots, acquisitions, or major strategy shifts',
      'Steady influence - I help maintain team morale and productivity during uncertain times',
      'Adaptation focused - I help teams adjust to new processes, tools, or priorities',
      'Supportive teammate - I contribute positively but rely on others for change leadership',
      'Change recipient - I\'ve experienced changes but haven\'t led others through them'
    ]
  }

  const strategicOptions = {
    technical_roadmap: [
      'Systematic planner - I balance feature development, scaling needs, and technical debt with clear prioritization frameworks',
      'Business-aligned - I create technical plans that directly support business objectives and timelines',
      'Iterative approach - I prefer shorter planning cycles with regular reassessment and adjustment',
      'Team collaborative - I develop technical direction through extensive team input and consensus',
      'Learning phase - I understand the importance but need to develop strategic planning skills'
    ],
    build_vs_buy: [
      'Framework-driven - I have systematic evaluation criteria including cost, risk, timeline, and strategic value',
      'Experience-based - I draw on past decisions and outcomes to guide similar choices',
      'Resource-conscious - I primarily consider team capacity and timeline constraints',
      'Quality-focused - I emphasize long-term maintainability and system integration',
      'Collaborative approach - I rely heavily on team input and external expertise for major decisions'
    ],
    technical_risk_communication: [
      'Executive communicator - I regularly present technical strategy and risks to C-level and board members',
      'Business translator - I effectively communicate technical concepts in business terms to stakeholders',
      'Clear explainer - I can explain technical issues clearly but have limited executive presentation experience',
      'Technical focus - I\'m more comfortable with technical discussions than business presentations',
      'Developing skill - I understand the importance but need to improve my communication skills'
    ],
    resource_constraints: [
      'Creative problem solver - I find innovative solutions that maximize impact within constraints',
      'Priority-driven - I ruthlessly prioritize features and technical work based on business impact',
      'MVP-focused - I excel at building minimum viable solutions that can evolve over time',
      'Resource optimizer - I make existing resources more effective through better processes and tools',
      'Quality maintainer - I find ways to maintain technical standards even with limited resources'
    ],
    cofounder_partnership: [
      'Partnership veteran - I\'ve successfully navigated co-founder relationships with clear communication and conflict resolution',
      'Collaboration focused - I prioritize open communication, shared decision-making, and mutual respect',
      'Boundary-aware - I believe in clear role definitions while maintaining collaborative problem-solving',
      'Learning-oriented - I\'m committed to developing strong partnership skills and addressing conflicts constructively',
      'Individual strength - I bring strong technical skills and am eager to learn effective co-founder collaboration'
    ]
  }

  const startEditing = (field, currentValue) => {
    setEditingField(field)
    setTempValue(currentValue || '')
    setError('')
  }

  const cancelEditing = () => {
    setEditingField(null)
    setTempValue('')
  }

  const saveField = async (field) => {
    setLoading(true)
    setError('')

    try {
      let updateData = {}
      
      // Handle different field types
      if (field.includes('.')) {
        // Handle nested fields like location.city
        const [parent, child] = field.split('.')
        updateData[parent] = {
          ...formData[parent],
          [child]: tempValue.trim()
        }
      } else if (['roles', 'industries', 'motivations'].includes(field)) {
        // Handle array fields - this would need special UI for arrays
        updateData[field] = tempValue
      } else if (field === 'age') {
        const ageValue = parseInt(tempValue)
        updateData[field] = isNaN(ageValue) ? null : ageValue
      } else {
        updateData[field] = tempValue.trim()
      }

      console.log('Updating field:', field, 'with value:', updateData)

      const { error: updateError } = await updateUserProfile(user.id, updateData)

      if (updateError) {
        console.error('Update error:', updateError)
        setError(`Error updating ${field}: ${updateError}`)
      } else {
        // Update local state
        setFormData(prev => ({ ...prev, ...updateData }))
        setUserProfile(prev => ({ ...prev, ...updateData }))
        setEditingField(null)
        setTempValue('')
        setSuccessMessage(`${field.replace(/_/g, ' ')} updated successfully!`)
        setTimeout(() => setSuccessMessage(''), 3000)
      }
    } catch (err) {
      console.error('Unexpected error:', err)
      setError(`Unexpected error updating ${field}: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleArrayChange = (field, value) => {
    const currentArray = formData[field] || []
    let newArray
    
    if (currentArray.includes(value)) {
      newArray = currentArray.filter(item => item !== value)
    } else {
      newArray = [...currentArray, value]
    }
    
    setTempValue(newArray)
  }

  const saveArrayField = async (field) => {
    setLoading(true)
    setError('')

    try {
      const updateData = { [field]: tempValue }
      
      const { error: updateError } = await updateUserProfile(user.id, updateData)

      if (updateError) {
        setError(`Error updating ${field}: ${updateError}`)
      } else {
        setFormData(prev => ({ ...prev, ...updateData }))
        setUserProfile(prev => ({ ...prev, ...updateData }))
        setEditingField(null)
        setTempValue('')
        setSuccessMessage(`${field.replace(/_/g, ' ')} updated successfully!`)
        setTimeout(() => setSuccessMessage(''), 3000)
      }
    } catch (err) {
      setError(`Unexpected error updating ${field}: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const renderField = (fieldKey, label, value, type = 'text', options = null) => {
    const isEditing = editingField === fieldKey
    const displayValue = value || 'Not set'

    return (
      <div className="grid grid-cols-3 gap-4 px-6 py-4 border-b hover:bg-gray-50">
        <div className="font-medium text-gray-900">{label}</div>
        <div className="text-gray-600">
          {type === 'array' ? 
            (Array.isArray(value) && value.length > 0 ? value.join(', ') : 'Not set') :
            (typeof displayValue === 'string' && displayValue.length > 60 ? 
              displayValue.substring(0, 60) + '...' : displayValue)
          }
        </div>
        <div>
          {isEditing ? (
            <div className="space-y-2">
              {type === 'select' ? (
                <select
                  value={tempValue}
                  onChange={(e) => setTempValue(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Select an option...</option>
                  {options.map((option, index) => (
                    <option key={index} value={option}>{option}</option>
                  ))}
                </select>
              ) : type === 'textarea' ? (
                <textarea
                  rows={3}
                  value={tempValue}
                  onChange={(e) => setTempValue(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder={`Enter ${label.toLowerCase()}...`}
                />
              ) : type === 'array' ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {options.map(option => (
                    <label key={option} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={Array.isArray(tempValue) ? tempValue.includes(option) : false}
                        onChange={() => handleArrayChange(fieldKey, option)}
                        className="mr-2 text-green-600"
                      />
                      <span className="text-sm">{option}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <input
                  type={type}
                  value={tempValue}
                  onChange={(e) => setTempValue(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder={`Enter ${label.toLowerCase()}...`}
                />
              )}
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => type === 'array' ? saveArrayField(fieldKey) : saveField(fieldKey)}
                  disabled={loading}
                  className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (type === 'array') {
                  setTempValue(value || [])
                } else {
                  startEditing(fieldKey, value)
                }
                setEditingField(fieldKey)
              }}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
            >
              Edit
            </button>
          )}
        </div>
      </div>
    )
  }

  const renderLocationField = () => {
    const isEditing = editingField === 'location'
    const locationStr = formData.location.city || formData.location.state_region || formData.location.country ? 
      `${formData.location.city || ''}${formData.location.city && (formData.location.state_region || formData.location.country) ? ', ' : ''}${formData.location.state_region || ''}${formData.location.state_region && formData.location.country ? ', ' : ''}${formData.location.country || ''}` : 
      'Not set'

    return (
      <div className="grid grid-cols-3 gap-4 px-6 py-4 border-b hover:bg-gray-50">
        <div className="font-medium text-gray-900">Location</div>
        <div className="text-gray-600">{locationStr}</div>
        <div>
          {isEditing ? (
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  value={tempValue.city || ''}
                  onChange={(e) => setTempValue(prev => ({ ...prev, city: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="City"
                />
                <input
                  type="text"
                  value={tempValue.state_region || ''}
                  onChange={(e) => setTempValue(prev => ({ ...prev, state_region: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="State/Region"
                />
                <input
                  type="text"
                  value={tempValue.country || ''}
                  onChange={(e) => setTempValue(prev => ({ ...prev, country: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Country"
                />
              </div>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => saveField('location')}
                  disabled={loading}
                  className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setEditingField('location')
                setTempValue(formData.location)
              }}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
            >
              Edit
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">🌱</div>
              <h1 className="text-xl font-bold text-gray-900">Edit Profile</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Back to Dashboard
              </button>
              <button
                onClick={onLogout}
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg z-50">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="text-red-400">⚠️</div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content - Spreadsheet Style */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Profile Picture Section */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden mb-6">
          <div className="bg-blue-50 px-6 py-3 border-b">
            <h3 className="font-semibold text-blue-900">Profile Picture</h3>
          </div>
          <div className="p-6">
            <ProfilePictureUpload
              currentImageUrl={formData.avatar_url}
              onImageUpload={handleAvatarUpload}
              loading={avatarUploading}
              size="medium"
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {/* Header Row */}
          <div className="bg-gray-50 border-b px-6 py-4">
            <div className="grid grid-cols-3 gap-4 font-medium text-gray-700">
              <div>Field</div>
              <div>Current Value</div>
              <div>Actions</div>
            </div>
          </div>

          {/* Basic Information Section */}
          <div className="border-b">
            <div className="bg-blue-50 px-6 py-3 border-b">
              <h3 className="font-semibold text-blue-900">Basic Information</h3>
            </div>
            
            {renderField('name', 'Name', formData.name)}
            {renderField('email', 'Email', formData.email, 'email')}
            {renderField('phone', 'Phone', formData.phone, 'tel')}
            {renderField('age', 'Age', formData.age, 'number')}
            {renderLocationField()}
            {renderField('bio', 'Bio', formData.bio, 'textarea')}
          </div>

          {/* Matching Criteria Section */}
          <div className="border-b">
            <div className="bg-green-50 px-6 py-3 border-b">
              <h3 className="font-semibold text-green-900">Matching Criteria</h3>
            </div>

            {renderField('roles', 'Roles', formData.roles, 'array', roleOptions)}
            {renderField('industries', 'Industries', formData.industries, 'array', industryOptions)}
            {renderField('motivations', 'Motivations', formData.motivations, 'array', motivationOptions)}
            {renderField('availability', 'Availability', formData.availability, 'select', availabilityOptions)}
            {renderField('communication_style', 'Communication Style', formData.communication_style, 'select', communicationOptions)}
            {renderField('work_style_preference', 'Work Style Preference', formData.work_style_preference, 'select', workStyleOptions)}
          </div>

          {/* Technical Skills Section */}
          <div className="border-b">
            <div className="bg-purple-50 px-6 py-3 border-b">
              <h3 className="font-semibold text-purple-900">Technical Skills</h3>
            </div>

            {Object.entries(technicalOptions).map(([field, options]) => 
              renderField(field, field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), formData[field], 'select', options)
            )}
          </div>

          {/* Leadership Section */}
          <div className="border-b">
            <div className="bg-orange-50 px-6 py-3 border-b">
              <h3 className="font-semibold text-orange-900">Leadership & Team Management</h3>
            </div>

            {Object.entries(leadershipOptions).map(([field, options]) => 
              renderField(field, field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), formData[field], 'select', options)
            )}
          </div>

          {/* Strategic Thinking Section */}
          <div className="border-b">
            <div className="bg-red-50 px-6 py-3 border-b">
              <h3 className="font-semibold text-red-900">Strategic Thinking & Business Alignment</h3>
            </div>

            {Object.entries(strategicOptions).map(([field, options]) => 
              renderField(field, field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), formData[field], 'select', options)
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-6 bg-gray-50">
            <div className="text-sm text-gray-600 text-center">
              Last updated: {userProfile?.updated_at ? new Date(userProfile.updated_at).toLocaleDateString() : 'Never'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfileEdit
