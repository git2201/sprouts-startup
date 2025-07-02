import React, { useState, useEffect } from 'react'

const OnboardingStep = ({ step, onComplete, onBack, canGoBack, isLastStep, formData }) => {
  const [selectedValue, setSelectedValue] = useState(formData[step.id] || (step.type === 'multi_select' ? [] : ''));

  useEffect(() => {
    setSelectedValue(formData[step.id] || (step.type === 'multi_select' ? [] : ''));
  }, [step, formData]);

  const handleOptionSelect = (value) => {
    if (step.type === 'multi_select') {
      let newValue;
      const limit = step.id === 'motivations' ? 3 : undefined;
      if (selectedValue.includes(value)) {
        newValue = selectedValue.filter((v) => v !== value);
      } else if (!limit || selectedValue.length < limit) {
        newValue = [...selectedValue, value];
      } else {
        newValue = selectedValue; // Don't add more than the limit
      }
      setSelectedValue(newValue);
    } else {
      setSelectedValue(value);
      onComplete(step.id, value);
    }
  };

  const handleNext = () => {
    onComplete(step.id, selectedValue);
  };

  const handleLetsSprout = () => {
    onComplete(step.id, selectedValue);
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 font-poppins">
          {step.prompt}
        </h2>
        {step.scaleMinLabel && step.scaleMaxLabel && (
          <div className="flex justify-between text-sm text-gray-500 font-medium mb-2">
            <span>{step.scaleMinLabel}</span>
            <span>{step.scaleMaxLabel}</span>
          </div>
        )}
      </div>

      {/* Render based on type */}
      {step.type === 'scale' && (
        <div className="flex flex-col items-center">
          <input
            type="range"
            min={1}
            max={6}
            step={1}
            value={selectedValue || 3}
            onChange={(e) => setSelectedValue(Number(e.target.value))}
            className="w-2/3"
          />
          <div className="flex justify-between w-2/3 mt-2 text-sm">
            {[1, 2, 3, 4, 5, 6].map((num) => (
              <span key={num} className={selectedValue === num ? 'font-bold text-primary-600' : ''}>{num}</span>
            ))}
          </div>
          <button
            className="btn-primary mt-6"
            onClick={handleNext}
            disabled={selectedValue === ''}
          >
            Next
          </button>
        </div>
      )}

      {step.type === 'single_choice' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {step.options.map((option) => (
            <button
              key={option}
              className={`group bg-white border-2 rounded-2xl p-6 text-left transition-all duration-300 transform ${selectedValue === option ? 'border-primary-400 shadow-xl' : 'border-gray-200 hover:border-primary-400 hover:shadow-xl hover:-translate-y-1'}`}
              onClick={() => handleOptionSelect(option)}
            >
              <div className="flex items-start space-x-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 font-poppins">
                    {option}
                  </h3>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {step.type === 'multi_select' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {step.options.map((option) => (
            <label
              key={option}
              className={`flex items-center bg-white border-2 rounded-2xl p-4 cursor-pointer transition-all duration-300 ${selectedValue.includes(option) ? 'border-primary-400 shadow-xl' : 'border-gray-200 hover:border-primary-400 hover:shadow-xl'}`}
            >
              <input
                type="checkbox"
                checked={selectedValue.includes(option)}
                onChange={() => handleOptionSelect(option)}
                className="mr-3 accent-primary-500"
              />
              <span className="text-lg font-medium">{option}</span>
            </label>
          ))}
          <button
            className="btn-primary mt-6"
            onClick={handleNext}
            disabled={selectedValue.length === 0}
          >
            Next
          </button>
        </div>
      )}

      {/* Let's Sprout! Button - Only show on last step */}
      {isLastStep && (
        <div className="text-center pt-8">
          <button 
            className="bg-[#22c177] text-white text-xl font-bold py-4 px-12 rounded-2xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 hover:bg-[#1ea366]"
            onClick={handleLetsSprout}
          >
            🌱 Let's Sprout! 
          </button>
          <p className="text-sm text-gray-500 mt-4 font-medium">
            Ready to find your perfect cofounder!
          </p>
        </div>
      )}

      <div className="flex justify-between items-center pt-8 border-t border-gray-100">
        {canGoBack && (
          <button 
            className="bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-xl hover:bg-gray-300 transition-colors"
            onClick={onBack}
          >
            ← Back
          </button>
        )}
        <div className="text-center flex-1">
          <p className="text-sm text-gray-500 font-medium">
            {isLastStep ? 'Choose your stage and let\'s get started!' : 'Choose the option that best describes you'}
          </p>
        </div>
        {!canGoBack && <div className="w-20"></div>}
      </div>
    </div>
  )
}

export default OnboardingStep