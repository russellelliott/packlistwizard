// listGenerators.js
// Functions to generate food, clothing, sleeping, cooking, and miscellaneous lists using Gemini API

// Example JSON schema for Gemini API responses
export const foodListSchema = {
  description: 'Food list as JSON array of objects: [{name: string, quantity: string, calories: number}]',
  exampleJSON: [
    { name: 'Oatmeal', quantity: '2 packs', calories: 300 },
    { name: 'Trail Mix', quantity: '1 bag', calories: 600 }
  ]
};

export const clothingListSchema = {
  description: 'Clothing list as JSON array of objects: [{item: string, quantity: string}]',
  exampleJSON: [
    { item: 'Jacket', quantity: '1' },
    { item: 'Socks', quantity: '3 pairs' }
  ]
};

export const sleepingListSchema = {
  description: 'Sleeping list as JSON array of objects: [{item: string, quantity: string}]',
  exampleJSON: [
    { item: 'Sleeping Bag', quantity: '1' },
    { item: 'Sleeping Pad', quantity: '1' }
  ]
};

export const cookingListSchema = {
  description: 'Cooking list as JSON array of objects: [{item: string, quantity: string}]',
  exampleJSON: [
    { item: 'Stove', quantity: '1' },
    { item: 'Fuel', quantity: '2 canisters' }
  ]
};

export const miscListSchema = {
  description: 'Miscellaneous list as JSON array of objects: [{item: string, quantity: string}]',
  exampleJSON: [
    { item: 'Map', quantity: '1' },
    { item: 'First Aid Kit', quantity: '1' }
  ]
};

// Async function to generate all lists in order
export async function generatePackLists({ fetchGeminiList, params }) {
  // fetchGeminiList: function
  // params: { age, weight, days, season, avgElevation, maxElevation, tentCapacity, diet, maxWeight }
  const { weight, days, season, avgElevation, maxElevation, tentCapacity, diet, maxWeight } = params;
  const results = {};

  // 1. Get weight distribution from Gemini
  const distributionPrompt = `Provide a weight distribution for a ${days}-day backpacking list with a total weight as close to, but not exceeding ${maxWeight} pounds. The distribution MUST be in the following format: Clothing: xx pounds\nCooking Equipment: xx pounds\nSleeping: xx pounds\nFood: xx pounds\nMisc: xx pounds. DO NOT include any items in any of the categories in this list.`;
  const distributionResponse = await fetchGeminiList(distributionPrompt, { description: 'Weight distribution as plain text', exampleJSON: {} });

  // Parse weights from Gemini response
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
  // Fallback to ratios if parsing fails
  if (!clothingWeight) clothingWeight = (weight * 0.15).toFixed(2);
  if (!cookingWeight) cookingWeight = (weight * 0.10).toFixed(2);
  if (!sleepingWeight) sleepingWeight = (weight * 0.20).toFixed(2);
  if (!foodWeight) foodWeight = (1.5 * days).toFixed(2);
  if (!miscWeight) miscWeight = (weight * 0.10).toFixed(2);

  // 2. Generate lists using the suggested weights
  const foodPrompt = `List the Food items and their weights for a ${days}-day backpacking trip. Targeting weight close to ${foodWeight} pounds, allowing ${(foodWeight/days).toFixed(2)} pounds of food daily. Food list must follow a ${diet} diet. Remove refrigeration-dependent items and streamline redundant foods. Output should be in this JSON format: { items:[{day:1,Breakfast:{Item:"",Weight:0,Price:0,Calories:0},Lunch:{Item:"",Weight:0,Price:0,Calories:0},Snack:{Item:"",Weight:0,Price:0,Calories:0},Dinner:{Item:"",Weight:0,Price:0,Calories:0}},...],totalWeight:0,totalPrice:0,totalCalories:0 } Weight MUST be in pounds and price MUST be in $USD. Generate food for ${days} days. String must start with { and end with } Ensure that the price values are represented as numerical values without any currency symbols.`;
  results.food = await fetchGeminiList(foodPrompt, foodListSchema);

  const clothingPrompt = `List the Clothing items and their weights for a ${days}-day backpacking trip. Aim for a total weight near ${clothingWeight} pounds, minimum ${(0.9 * clothingWeight).toFixed(2)} pounds. Elevation: avg ${avgElevation} ft, max ${maxElevation} ft in ${season}. Provide clothing items suitable for average ${avgElevation} ft and max ${maxElevation} ft elevation in ${season}. Include 3 shirts, underwear, and socks, all same type. Exclude gender-specific items like tank tops and sports bras. Output should be in JSON in this format: {"items":[{"item":"","weight":0,"price":0},...],"totalWeight":0,"totalPrice":0} Weight MUST be in pounds and price MUST be in $USD. All items need to be in the JSON object. totalWeight and totalPrice is required. String must start with { and end with } Ensure that the price values are represented as numerical values without any currency symbols.`;
  results.clothing = await fetchGeminiList(clothingPrompt, clothingListSchema);

  const cookingPrompt = `List cooking items, except pans and spatulas, for dehydrated meals using a camping stove. Recommend a specific burner/stove. Include a collapsible pot, like Jet Boil kit, with consistent details. Avoid vague items like 'camping stove with piezoelectric ignition'. Output should be in JSON in this format: {"items":[{"item":"","weight":0,"price":0},...],"totalWeight":0,"totalPrice":0} Weight MUST be in pounds and price MUST be in $USD. All items need to be in the JSON object. totalWeight and totalPrice is required. String must start with { and end with } Ensure that the price values are represented as numerical values without any currency symbols.`;
  results.cooking = await fetchGeminiList(cookingPrompt, cookingListSchema);

  const sleepingPrompt = `Specify a season-suited sleeping bag temperature rating for Sierra Nevada elevations in ${season}. Include one sleeping bag, one sleeping pad, and a ${Number(tentCapacity) + 1}-person tent. Exclude eye masks and earplugs. Output should be in JSON in this format: {"items":[{"item":"","weight":0,"price":0},...],"totalWeight":0,"totalPrice":0} Weight MUST be in pounds and price MUST be in $USD. All items need to be in the JSON object. totalWeight and totalPrice is required. String must start with { and end with } Ensure that the price values are represented as numerical values without any currency symbols.`;
  results.sleeping = await fetchGeminiList(sleepingPrompt, sleepingListSchema);

  const miscPrompt = `List additional items for a ${days}-day backpacking trip, aiming for weight near ${miscWeight} lbs (min. ${(0.9 * miscWeight).toFixed(2)} lbs). Exclude clothing, cooking, sleeping, and food from previous lists. Output should be in this JSON format: {"items":[{"item":"","weight":0,"price":0},...],"totalWeight":0,"totalPrice":0} Weight MUST be in pounds and price MUST be in $USD.`;
  results.misc = await fetchGeminiList(miscPrompt, miscListSchema);

  return results;
}
