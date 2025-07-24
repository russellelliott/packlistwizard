// validation.js
// Validation logic for age, weight, days, with error messages

export function validateInputs({ age, weight, days }) {
  const errors = {};
  if (!age || isNaN(age)) {
    errors.age = 'Age is required and must be a number.';
  } else if (age < 10 || age > 80) {
    errors.age = 'Age must be between 10 and 80.';
  }
  if (!weight || isNaN(weight)) {
    errors.weight = 'Weight is required and must be a number.';
  } else if (weight < 20 || weight > 400) {
    errors.weight = 'Weight must be between 20 and 400 lbs.';
  }
  if (!days || isNaN(days)) {
    errors.days = 'Number of days is required and must be a number.';
  } else if (days < 1 || days > 30) {
    errors.days = 'Days must be between 1 and 30.';
  }
  return errors;
}

// Formula for max backpack weight (preserved from plugin)
export function getMaxBackpackWeight(age, weight) {
  // Example formula: maxWeight = weight * 0.25 for adults, less for children/elderly
  if (age < 18) return weight * 0.15;
  if (age > 65) return weight * 0.18;
  return weight * 0.25;
}
