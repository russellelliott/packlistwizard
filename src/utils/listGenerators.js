// listGenerators.js
// Schema definitions for food, clothing, sleeping, cooking, and miscellaneous lists

// Example JSON schemas for API responses
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
