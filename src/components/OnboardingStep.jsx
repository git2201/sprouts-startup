import React, { useState, useEffect } from 'react'
import { supabase } from "../library/supabase"

const OnboardingStep = ({ step, onComplete, onBack, canGoBack, isLastStep, formData, isProfileUpdate }) => {
  console.log('OnboardingStep.jsx: isProfileUpdate', isProfileUpdate, 'isLastStep', isLastStep, 'step.id', step.id);
  
  // Initialize selectedValue based on step type
  const getInitialValue = () => {
    const savedValue = formData[step.id];
    
    if (step.type === 'location_input') {
      return savedValue || { city: '', state_region: '', country: '' };
    } else if (step.type === 'multi_select') {
      return Array.isArray(savedValue) ? savedValue : [];
    } else if (step.type === 'scale') {
      return savedValue || 3;
    } else {
      return savedValue || '';
    }
  };

  const [selectedValue, setSelectedValue] = useState(getInitialValue);
  const [ageError, setAgeError] = useState(false);

  useEffect(() => {
    const newValue = getInitialValue();
    setSelectedValue(newValue);
    setAgeError(false);
  }, [step, formData]);

  const handleOptionSelect = (value) => {
    if (step.type === 'multi_select') {
      // Ensure selectedValue is always an array for multi_select
      const currentSelection = Array.isArray(selectedValue) ? selectedValue : [];
      let newValue;
      const limit = step.id === 'motivations' ? 3 : undefined;
      
      if (currentSelection.includes(value)) {
        newValue = currentSelection.filter((v) => v !== value);
      } else if (!limit || currentSelection.length < limit) {
        newValue = [...currentSelection, value];
      } else {
        newValue = currentSelection; // Don't add more than the limit
      }
      setSelectedValue(newValue);
    } else if (isLastStep && step.type === 'single_choice') {
      setSelectedValue(value); // Only select, do not auto-continue
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

  const handleAgeInput = (value) => {
    setSelectedValue(value);
    const age = Number(value);
    
    if (value === '' || isNaN(age)) {
      setAgeError(false);
      return;
    }
    
    if (age < 16) {
      setAgeError(true);
    } else {
      setAgeError(false);
    }
  };

  const handleAgeNext = () => {
    const age = Number(selectedValue);
    if (age >= 16 && !isNaN(age) && selectedValue !== '') {
      onComplete(step.id, selectedValue);
    }
  };

  const handleLocationInput = (field, value) => {
    const newLocation = {
      ...selectedValue,
      [field]: value
    };
    setSelectedValue(newLocation);
  };

  const handleLocationNext = () => {
    const { city, state_region, country } = selectedValue || {};
    if (city && city.trim() && state_region && state_region.trim() && country && country.trim()) {
      onComplete(step.id, selectedValue);
    }
  };

  const isLocationComplete = () => {
    if (step.type !== 'location_input') return true;
    const { city, state_region, country } = selectedValue || {};
    return city && city.trim() && state_region && state_region.trim() && country && country.trim();
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

      {/* Age Input */}
      {step.type === 'age_input' && (
        <div className="flex flex-col items-center">
          <input
            type="number"
            min={16}
            max={80}
            value={selectedValue}
            onChange={e => handleAgeInput(e.target.value)}
            placeholder="Enter your age"
            className={`w-1/2 p-3 border-2 rounded-xl text-center text-2xl font-bold focus:outline-none transition-colors ${
              ageError 
                ? 'border-red-500 bg-red-50 text-red-700' 
                : 'border-gray-200 focus:border-green-400'
            }`}
          />
          {ageError && (
            <div className="mt-3 text-red-600 font-semibold text-center">
              {step.validation?.message || 'You must be 16 or older to use this platform'}
            </div>
          )}
          <button
            className={`mt-6 px-8 py-3 rounded-xl font-semibold text-lg transition-all ${
              selectedValue === '' || isNaN(Number(selectedValue)) || Number(selectedValue) < 16
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-xl'
            }`}
            onClick={handleAgeNext}
            disabled={selectedValue === '' || isNaN(Number(selectedValue)) || Number(selectedValue) < 16}
          >
            Next
          </button>
        </div>
      )}

      {/* Location Input */}
      {step.type === 'location_input' && (
        <div className="flex flex-col items-center space-y-6">
          <div className="w-full max-w-2xl space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
              <input
                type="text"
                value={selectedValue?.city || ''}
                onChange={e => handleLocationInput('city', e.target.value)}
                placeholder="e.g., San Francisco"
                className="w-full p-3 border-2 border-gray-200 rounded-xl text-lg focus:border-green-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">State/Region</label>
              <input
                type="text"
                value={selectedValue?.state_region || ''}
                onChange={e => handleLocationInput('state_region', e.target.value)}
                placeholder="e.g., California"
                className="w-full p-3 border-2 border-gray-200 rounded-xl text-lg focus:border-green-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Country</label>
              <input
                type="text"
                value={selectedValue?.country || ''}
                onChange={e => handleLocationInput('country', e.target.value)}
                placeholder="e.g., United States"
                className="w-full p-3 border-2 border-gray-200 rounded-xl text-lg focus:border-green-400 focus:outline-none"
              />
            </div>
          </div>
          <button
            className={`px-8 py-3 rounded-xl font-semibold text-lg transition-all ${
              !isLocationComplete()
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-xl'
            }`}
            onClick={handleLocationNext}
            disabled={!isLocationComplete()}
          >
            Next
          </button>
        </div>
      )}

      {/* Scale Input */}
      {step.type === 'scale' && (
        <div className="flex flex-col items-center">
          <input
            type="range"
            min={1}
            max={6}
            step={1}
            value={selectedValue}
            onChange={(e) => setSelectedValue(Number(e.target.value))}
            className="w-2/3 accent-green-500"
          />
          <div className="flex justify-between w-2/3 mt-2 text-sm">
            {[1, 2, 3, 4, 5, 6].map((num) => (
              <span key={num} className={selectedValue === num ? 'font-bold text-green-600' : ''}>{num}</span>
            ))}
          </div>
          <button
            className="bg-green-600 text-white px-8 py-3 rounded-xl font-semibold text-lg hover:bg-green-700 shadow-lg hover:shadow-xl mt-6"
            onClick={handleNext}
            disabled={selectedValue === ''}
          >
            Next
          </button>
        </div>
      )}

      {/* Single Choice */}
      {step.type === 'single_choice' && (
        // I've changed the line below from a grid to a flex column layout
        <div className="flex flex-col gap-4">
          {step.options.map((option) => (
            <button
              key={option}
              className={`group bg-white border-2 rounded-2xl p-6 text-left transition-all duration-300 transform w-full ${
                selectedValue === option 
                  ? 'border-green-400 shadow-xl' 
                  : 'border-gray-200 hover:border-green-400 hover:shadow-xl hover:-translate-y-1'
              }`}
              onClick={() => handleOptionSelect(option)}
              type="button"
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

      {/* Multi Select */}
      {step.type === 'multi_select' && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {step.options.map((option) => {
              const currentSelection = Array.isArray(selectedValue) ? selectedValue : [];
              return (
                <label
                  key={option}
                  className={`flex items-center bg-white border-2 rounded-2xl p-4 cursor-pointer transition-all duration-300 ${
                    currentSelection.includes(option) 
                      ? 'border-green-400 shadow-xl' 
                      : 'border-gray-200 hover:border-green-400 hover:shadow-xl'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={currentSelection.includes(option)}
                    onChange={() => handleOptionSelect(option)}
                    className="mr-3 accent-green-500"
                  />
                  <span className="text-lg font-medium">{option}</span>
                </label>
              );
            })}
          </div>
          <div className="text-center">
            <button
              className={`px-8 py-3 rounded-xl font-semibold text-lg transition-all ${
                (!Array.isArray(selectedValue) || selectedValue.length === 0)
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-xl'
              }`}
              onClick={handleNext}
              disabled={!Array.isArray(selectedValue) || selectedValue.length === 0}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Final Step Button */}
      {isLastStep && (
        <div className="text-center pt-8">
          <button 
            className="bg-[#22c177] text-white text-xl font-bold py-4 px-12 rounded-2xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 hover:bg-[#1ea366]"
            onClick={handleLetsSprout}
            disabled={
              selectedValue === '' || 
              (step.type === 'multi_select' && (!Array.isArray(selectedValue) || selectedValue.length === 0))
            }
          >
            {isProfileUpdate ? 'Update Technical Profile' : 'Complete Technical Assessment'}
          </button>
          <p className="text-sm text-gray-500 mt-4 font-medium">
            {isProfileUpdate ? 'Update your technical profile to get matched with the best technical cofounders!' : 'Ready to find your perfect technical co-founder!'}
          </p>
        </div>
      )}

      {/* Navigation */}
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
            {isLastStep ? 'Complete your technical assessment!' : 'Choose the option that best describes your technical background'}
          </p>
        </div>
        {!canGoBack && <div className="w-20"></div>}
      </div>
    </div>
  )
}

export default OnboardingStep
