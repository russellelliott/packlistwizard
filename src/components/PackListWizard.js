// PackListWizard.js
import React, { useState } from 'react';
import { useGeminiApi } from '../hooks/useGeminiApi';
import { validateInputs, getMaxBackpackWeight } from '../utils/validation';
import { generatePackLists } from '../utils/listGenerators';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const initialState = {
  age: '',
  weight: '',
  days: '',
};

export default function PackListWizard() {
  const [inputs, setInputs] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [lists, setLists] = useState(null);
  const { fetchGeminiList, loading, error } = useGeminiApi();
  const [step, setStep] = useState(1);

  const handleChange = e => {
    setInputs({ ...inputs, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const validationErrors = validateInputs(inputs);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length) {
      toast.error('Please fix input errors.');
      return;
    }
    toast.info('Generating pack lists...');
    // Generate lists using Gemini API
    const results = await generatePackLists({ fetchGeminiList, params: inputs });
    if (!results) {
      toast.error(error || 'Failed to generate lists.');
      return;
    }
    setLists(results);
    setStep(2);
    toast.success('Pack lists generated!');
  };

  return (
    <div className="packlist-wizard">
      <ToastContainer />
      {step === 1 && (
        <form onSubmit={handleSubmit} className="wizard-form">
          <h2>Pack List Wizard</h2>
          <label>
            Age:
            <input type="number" name="age" value={inputs.age} onChange={handleChange} />
            {errors.age && <span className="error">{errors.age}</span>}
          </label>
          <label>
            Weight (lbs):
            <input type="number" name="weight" value={inputs.weight} onChange={handleChange} />
            {errors.weight && <span className="error">{errors.weight}</span>}
          </label>
          <label>
            Days:
            <input type="number" name="days" value={inputs.days} onChange={handleChange} />
            {errors.days && <span className="error">{errors.days}</span>}
          </label>
          <button type="submit" disabled={loading}>Generate Pack List</button>
          {loading && <div className="loading">Loading...</div>}
        </form>
      )}
      {step === 2 && lists && (
        <div className="results-view">
          <h2>Your Backpacking Pack Lists</h2>
          <div><strong>Max Backpack Weight:</strong> {getMaxBackpackWeight(Number(inputs.age), Number(inputs.weight)).toFixed(1)} lbs</div>
          <h3>Food</h3>
          <ul>{lists.food?.map((item, i) => <li key={i}>{item.name} - {item.quantity} ({item.calories} cal)</li>)}</ul>
          <h3>Clothing</h3>
          <ul>{lists.clothing?.map((item, i) => <li key={i}>{item.item} - {item.quantity}</li>)}</ul>
          <h3>Sleeping</h3>
          <ul>{lists.sleeping?.map((item, i) => <li key={i}>{item.item} - {item.quantity}</li>)}</ul>
          <h3>Cooking</h3>
          <ul>{lists.cooking?.map((item, i) => <li key={i}>{item.item} - {item.quantity}</li>)}</ul>
          <h3>Miscellaneous</h3>
          <ul>{lists.misc?.map((item, i) => <li key={i}>{item.item} - {item.quantity}</li>)}</ul>
          <button onClick={() => { setStep(1); setLists(null); setInputs(initialState); }}>Start Over</button>
        </div>
      )}
    </div>
  );
}
