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
  // params: { age, weight, days, ... }
  const results = {};
  results.food = await fetchGeminiList(
    `Generate a backpacking food list for ${params.days} days for a person aged ${params.age} weighing ${params.weight} lbs.`,
    foodListSchema
  );
  results.clothing = await fetchGeminiList(
    `Generate a clothing list for ${params.days} days for a person aged ${params.age} weighing ${params.weight} lbs.`,
    clothingListSchema
  );
  results.sleeping = await fetchGeminiList(
    `Generate a sleeping gear list for ${params.days} days for a person aged ${params.age} weighing ${params.weight} lbs.`,
    sleepingListSchema
  );
  results.cooking = await fetchGeminiList(
    `Generate a cooking gear list for ${params.days} days for a person aged ${params.age} weighing ${params.weight} lbs.`,
    cookingListSchema
  );
  // Miscellaneous list depends on previous lists
  results.misc = await fetchGeminiList(
    `Generate a miscellaneous gear list for ${params.days} days for a person aged ${params.age} weighing ${params.weight} lbs. Consider food, clothing, sleeping, and cooking items already listed.`,
    miscListSchema
  );
  return results;
}
