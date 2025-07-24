// PackListWizard.js
import React, { useState } from 'react';
import { useGeminiApi } from '../hooks/useGeminiApi';
import { validateInputs, getMaxBackpackWeight } from '../utils/validation';
// ...existing code...
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const initialState = {
  age: '',
  weight: '',
  days: '',
};

export default function PackListWizard() {
  const [inputs, setInputs] = useState({
    age: '',
    weight: '',
    sex: 'male',
    days: '',
    season: 'summer',
    avgElevation: 3500,
    maxElevation: 7500,
    packweight: 'standard',
    diet: 'flexible',
    tentCapacity: 1,
  });
  const [errors, setErrors] = useState({});
  const [lists, setLists] = useState({ food: null, clothing: null, cooking: null, sleeping: null, misc: null });
  const [categoryWeights, setCategoryWeights] = useState(null);
  const { fetchGeminiList, loading } = useGeminiApi();
  const [step, setStep] = useState(1);

  const handleChange = e => {
    const { name, value, type } = e.target;
    setInputs({ ...inputs, [name]: type === 'range' ? Number(value) : value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const validationErrors = validateInputs(inputs);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length) {
      toast.error('Please fix input errors.');
      return;
    }

    // 1. Get pack weight
    const maxWeight = getMaxBackpackWeight(Number(inputs.age), Number(inputs.weight)).toFixed(1);
    const params = { ...inputs, maxWeight };
    toast.info('Step 1: Calculated pack weight.');
    setLists({ food: null, clothing: null, cooking: null, sleeping: null, misc: null });
    setCategoryWeights(null);
    setStep(1);

    // 2. Get category weights
    toast.info('Step 2: Getting category weights...');
    const distributionPrompt = `Provide a weight distribution for a ${params.days}-day backpacking list with a total weight as close to, but not exceeding ${maxWeight} pounds. The distribution MUST be in the following format: Clothing: xx pounds\nCooking Equipment: xx pounds\nSleeping: xx pounds\nFood: xx pounds\nMisc: xx pounds. DO NOT include any items in any of the categories in this list.`;
    const distributionResponse = await fetchGeminiList(distributionPrompt, { description: 'Weight distribution as plain text', exampleJSON: {} });

    let clothingWeight = 0, cookingWeight = 0, sleepingWeight = 0, foodWeight = 0, miscWeight = 0;
    if (distributionResponse && typeof distributionResponse === 'string') {
      const match = distributionResponse.match(/Clothing:\s*(\d+(\.\d+)?)\s*pounds[\s\S]*Cooking Equipment:\s*(\d+(\.\d+)?)\s*pounds[\s\S]*Sleeping:\s*(\d+(\.\d+)?)\s*pounds[\s\S]*Food:\s*(\d+(\.\d+)?)\s*pounds[\s\S]*Misc:\s*(\d+(\.\d+)?)\s*pounds/);
      if (match) {
        clothingWeight = parseFloat(match[1]);
        cookingWeight = parseFloat(match[3]);
        sleepingWeight = parseFloat(match[5]);
        foodWeight = parseFloat(match[7]);
        miscWeight = parseFloat(match[9]);
      }
    }
    // Fallback to ratios if parsing fails (use maxWeight, not body weight)
    if (!clothingWeight) clothingWeight = (maxWeight * 0.15).toFixed(2);
    if (!cookingWeight) cookingWeight = (maxWeight * 0.10).toFixed(2);
    if (!sleepingWeight) sleepingWeight = (maxWeight * 0.20).toFixed(2);
    if (!foodWeight) foodWeight = (maxWeight * 0.40).toFixed(2);
    if (!miscWeight) miscWeight = (maxWeight * 0.15).toFixed(2);

    setCategoryWeights({ clothingWeight, cookingWeight, sleepingWeight, foodWeight, miscWeight });
    setStep(2);

    // 3. Generate 4 main lists in parallel
    toast.info('Step 3: Generating food, clothing, cooking, and sleeping lists...');
    const foodPrompt = `List the Food items and their weights for a ${params.days}-day backpacking trip. Targeting weight close to ${foodWeight} pounds, allowing ${(foodWeight/params.days).toFixed(2)} pounds of food daily. Food list must follow a ${params.diet} diet. Remove refrigeration-dependent items and streamline redundant foods. Output should be in this JSON format: { items:[{day:1,Breakfast:{Item:\"\",Weight:0,Price:0,Calories:0},Lunch:{Item:\"\",Weight:0,Price:0,Calories:0},Snack:{Item:\"\",Weight:0,Price:0,Calories:0},Dinner:{Item:\"\",Weight:0,Price:0,Calories:0}},...],totalWeight:0,totalPrice:0,totalCalories:0 } Weight MUST be in pounds and price MUST be in $USD. Generate food for ${params.days} days. String must start with { and end with } Ensure that the price values are represented as numerical values without any currency symbols.`;
    const clothingPrompt = `List the Clothing items and their weights for a ${params.days}-day backpacking trip. Aim for a total weight near ${clothingWeight} pounds, minimum ${(0.9 * clothingWeight).toFixed(2)} pounds. Elevation: avg ${params.avgElevation} ft, max ${params.maxElevation} ft in ${params.season}. Provide clothing items suitable for average ${params.avgElevation} ft and max ${params.maxElevation} ft elevation in ${params.season}. Include 3 shirts, underwear, and socks, all same type. Exclude gender-specific items like tank tops and sports bras. Output should be in JSON in this format: {\"items\":[{\"item\":\"\",\"weight\":0,\"price\":0},...],\"totalWeight\":0,\"totalPrice\":0} Weight MUST be in pounds and price MUST be in $USD. All items need to be in the JSON object. totalWeight and totalPrice is required. String must start with { and end with } Ensure that the price values are represented as numerical values without any currency symbols.`;
    const cookingPrompt = `List cooking items, except pans and spatulas, for dehydrated meals using a camping stove. Recommend a specific burner/stove. Include a collapsible pot, like Jet Boil kit, with consistent details. Avoid vague items like 'camping stove with piezoelectric ignition'. Output should be in JSON in this format: {\"items\":[{\"item\":\"\",\"weight\":0,\"price\":0},...],\"totalWeight\":0,\"totalPrice\":0} Weight MUST be in pounds and price MUST be in $USD. All items need to be in the JSON object. totalWeight and totalPrice is required. String must start with { and end with } Ensure that the price values are represented as numerical values without any currency symbols.`;
    const sleepingPrompt = `Specify a season-suited sleeping bag temperature rating for Sierra Nevada elevations in ${params.season}. Include one sleeping bag, one sleeping pad, and a ${Number(params.tentCapacity) + 1}-person tent. Exclude eye masks and earplugs. Output should be in JSON in this format: {\"items\":[{\"item\":\"\",\"weight\":0,\"price\":0},...],\"totalWeight\":0,\"totalPrice\":0} Weight MUST be in pounds and price MUST be in $USD. All items need to be in the JSON object. totalWeight and totalPrice is required. String must start with { and end with } Ensure that the price values are represented as numerical values without any currency symbols.`;

    const [food, clothing, cooking, sleeping] = await Promise.all([
      fetchGeminiList(foodPrompt, require('../utils/listGenerators').foodListSchema),
      fetchGeminiList(clothingPrompt, require('../utils/listGenerators').clothingListSchema),
      fetchGeminiList(cookingPrompt, require('../utils/listGenerators').cookingListSchema),
      fetchGeminiList(sleepingPrompt, require('../utils/listGenerators').sleepingListSchema)
    ]);

    setLists(lists => ({ ...lists, food, clothing, cooking, sleeping }));
    setStep(3);

    // 4. Generate misc list
    toast.info('Step 4: Generating miscellaneous list...');
    const miscPrompt = `List additional items for a ${params.days}-day backpacking trip, aiming for weight near ${miscWeight} lbs (min. ${(0.9 * miscWeight).toFixed(2)} lbs). Exclude clothing, cooking, sleeping, and food from previous lists. Output should be in this JSON format: {\"items\":[{\"item\":\"\",\"weight\":0,\"price\":0},...],\"totalWeight\":0,\"totalPrice\":0} Weight MUST be in pounds and price MUST be in $USD.`;
    const misc = await fetchGeminiList(miscPrompt, require('../utils/listGenerators').miscListSchema);
    setLists(lists => ({ ...lists, misc }));
    setStep(4);
    toast.success('Pack lists generated!');
  };

  return (
    <div className="packlist-wizard">
      <ToastContainer />
      {step === 1 && (
        <form onSubmit={handleSubmit} className="wizard-form">
          <h2>Pack List Wizard</h2>
          {/* ...existing input fields... */}
          <fieldset>
            <legend>About You</legend>
            <label>
              Age:
              <input type="number" name="age" value={inputs.age} onChange={handleChange} placeholder="years" required />
              {errors.age && <span className="error">{errors.age}</span>}
            </label>
            <label>
              Weight (lbs):
              <input type="number" name="weight" value={inputs.weight} onChange={handleChange} placeholder="pounds" required />
              {errors.weight && <span className="error">{errors.weight}</span>}
            </label>
            <label>
              Sex:
              <select name="sex" value={inputs.sex} onChange={handleChange} required>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </label>
          </fieldset>
          <fieldset>
            <legend>Your Hike</legend>
            <label>
              Length of Hike (days):
              <input type="number" name="days" value={inputs.days} onChange={handleChange} placeholder="days" required />
              {errors.days && <span className="error">{errors.days}</span>}
            </label>
            <label>
              Season:
              <select name="season" value={inputs.season} onChange={handleChange} required>
                <option value="spring">Spring</option>
                <option value="summer">Summer</option>
                <option value="fall">Fall</option>
              </select>
            </label>
            <label>
              Average Elevation (ft):
              <input type="range" name="avgElevation" min="0" max="15000" step="100" value={inputs.avgElevation} onChange={handleChange} />
              <span>{inputs.avgElevation} ft</span>
            </label>
            <label>
              Max Elevation (ft):
              <input type="range" name="maxElevation" min="0" max="15000" step="100" value={inputs.maxElevation} onChange={handleChange} />
              <span>{inputs.maxElevation} ft</span>
            </label>
          </fieldset>
          <fieldset>
            <legend>Personal Preferences</legend>
            <label>
              Pack Weight:
              <select name="packweight" value={inputs.packweight} onChange={handleChange} required>
                <option value="ultralight">Ultralight</option>
                <option value="light">Light</option>
                <option value="standard">Standard</option>
                <option value="robust">Robust</option>
              </select>
            </label>
            <label>
              Diet:
              <select name="diet" value={inputs.diet} onChange={handleChange} required>
                <option value="flexible">No Restrictions</option>
                <option value="vegetarian">Vegetarian</option>
                <option value="vegan">Vegan</option>
              </select>
            </label>
            <label>
              Tent Capacity:
              <select name="tentCapacity" value={inputs.tentCapacity} onChange={handleChange} required>
                {[...Array(6)].map((_, i) => (
                  <option key={i+1} value={i+1}>{i+1}</option>
                ))}
              </select>
            </label>
          </fieldset>
          <button type="submit" disabled={loading}>Generate Pack List</button>
          {loading && <div className="loading">Loading...</div>}
        </form>
      )}
      {step >= 2 && (
        <div className="results-view">
          <h2>Pack Weight</h2>
          <div><strong>Max Backpack Weight:</strong> {getMaxBackpackWeight(Number(inputs.age), Number(inputs.weight)).toFixed(1)} lbs</div>
          {categoryWeights && (
            <>
              <h3>Category Weights</h3>
              <ul>
                <li>Clothing: {categoryWeights.clothingWeight} lbs</li>
                <li>Cooking Equipment: {categoryWeights.cookingWeight} lbs</li>
                <li>Sleeping: {categoryWeights.sleepingWeight} lbs</li>
                <li>Food: {categoryWeights.foodWeight} lbs</li>
                <li>Misc: {categoryWeights.miscWeight} lbs</li>
              </ul>
            </>
          )}
          {step >= 3 && (
            <>
              <h3>Food List</h3>
              <ul>{lists.food?.items?.map((item, i) => <li key={i}>{JSON.stringify(item)}</li>)}</ul>
              <h3>Clothing List</h3>
              <ul>{lists.clothing?.items?.map((item, i) => <li key={i}>{JSON.stringify(item)}</li>)}</ul>
              <h3>Cooking List</h3>
              <ul>{lists.cooking?.items?.map((item, i) => <li key={i}>{JSON.stringify(item)}</li>)}</ul>
              <h3>Sleeping List</h3>
              <ul>{lists.sleeping?.items?.map((item, i) => <li key={i}>{JSON.stringify(item)}</li>)}</ul>
            </>
          )}
          {step === 4 && (
            <>
              <h3>Miscellaneous List</h3>
              <ul>{lists.misc?.items?.map((item, i) => <li key={i}>{JSON.stringify(item)}</li>)}</ul>
              <button onClick={() => { setStep(1); setLists({ food: null, clothing: null, cooking: null, sleeping: null, misc: null }); setCategoryWeights(null); setInputs(initialState); }}>Start Over</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
