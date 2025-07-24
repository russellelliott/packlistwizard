import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import FastfoodIcon from '@mui/icons-material/Fastfood';
import CheckroomIcon from '@mui/icons-material/Checkroom';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import HotelIcon from '@mui/icons-material/Hotel';
import MiscellaneousServicesIcon from '@mui/icons-material/MiscellaneousServices';
import CategoryListCard from './CategoryListCard';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import TableContainer from '@mui/material/TableContainer';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
// PackListWizard.js
import React, { useState } from 'react';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import Button from '@mui/material/Button';
import Slider from '@mui/material/Slider';
import { useOpenAIApi } from '../hooks/useOpenAIApi';
import { useGeminiGroundedApi } from '../hooks/useGeminiGroundedApi';
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [drawerOpen, setDrawerOpen] = useState(false);
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
  const { fetchOpenAIList, loading } = useOpenAIApi();
  const [step, setStep] = useState(1);
  const [activePage, setActivePage] = useState('form');
  const tabIndex = activePage === 'form' ? 0 : 1;
  // Add state for pack list tabs
  const [listsTabIndex, setListsTabIndex] = useState(0);
  // State for Gemini links for each list
  const [geminiLinks, setGeminiLinks] = useState({ food: [], clothing: [], cooking: [], sleeping: [], misc: [] });
  const { fetchGeminiGroundedList } = useGeminiGroundedApi();

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

    // Immediately go to list page and disable button
    setActivePage('list');

    // 1. Get pack weight
    const maxWeight = getMaxBackpackWeight(Number(inputs.age), Number(inputs.weight)).toFixed(1);
    const params = { ...inputs, maxWeight };
    toast.info('Step 1: Calculated pack weight.');
    setLists({ food: null, clothing: null, cooking: null, sleeping: null, misc: null });
    setCategoryWeights(null);
    setGeminiLinks({ food: [], clothing: [], cooking: [], sleeping: [], misc: [] });
    setStep(1);

    // 2. Get category weights
    toast.info('Step 2: Getting category weights...');
    const distributionPrompt = `Provide a weight distribution for a ${params.days}-day backpacking list with a total weight as close to, but not exceeding ${maxWeight} pounds. The distribution MUST be in the following format: Clothing: xx pounds\nCooking Equipment: xx pounds\nSleeping: xx pounds\nFood: xx pounds\nMisc: xx pounds. DO NOT include any items in any of the categories in this list.`;
    const distributionResponse = await fetchOpenAIList(distributionPrompt, { description: 'Weight distribution as plain text', exampleJSON: {} });

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
    const clothingPrompt = `List the Clothing items and their weights for a ${params.days}-day backpacking trip. Aim for a total weight near ${clothingWeight} pounds, minimum ${(0.9 * clothingWeight).toFixed(2)} pounds. Elevation: avg ${params.avgElevation} ft, max ${params.maxElevation} ft in ${params.season}. Provide clothing items suitable for average ${params.avgElevation} ft and max ${params.maxElevation} ft elevation in ${params.season}. Include 3 shirts, underwear, and socks, all same type. Exclude gender-specific items like tank tops and sports bras. Output should be in JSON in this format: {"items":[{"item":"","weight":0,"price":0,"quantity":1},...],"totalWeight":0,"totalPrice":0} Each item must include a quantity field (e.g., quantity: 3 for 3 shirts). Do not list the same item multiple times; instead, use the quantity field. Weight MUST be in pounds and price MUST be in $USD. All items need to be in the JSON object. totalWeight and totalPrice is required. String must start with { and end with } Ensure that the price values are represented as numerical values without any currency symbols.`;
    const cookingPrompt = `List cooking items, except pans and spatulas, for dehydrated meals using a camping stove. Recommend a specific burner/stove. Include a collapsible pot, like Jet Boil kit, with consistent details. Avoid vague items like 'camping stove with piezoelectric ignition'. Output should be in JSON in this format: {\"items\":[{\"item\":\"\",\"weight\":0,\"price\":0},...],\"totalWeight\":0,\"totalPrice\":0} Weight MUST be in pounds and price MUST be in $USD. All items need to be in the JSON object. totalWeight and totalPrice is required. String must start with { and end with } Ensure that the price values are represented as numerical values without any currency symbols.`;
    const sleepingPrompt = `Specify a season-suited sleeping bag temperature rating for Sierra Nevada elevations in ${params.season}. Include one sleeping bag, one sleeping pad, and a ${Number(params.tentCapacity) + 1}-person tent. Exclude eye masks and earplugs. Output should be in JSON in this format: {\"items\":[{\"item\":\"\",\"weight\":0,\"price\":0},...],\"totalWeight\":0,\"totalPrice\":0} Weight MUST be in pounds and price MUST be in $USD. All items need to be in the JSON object. totalWeight and totalPrice is required. String must start with { and end with } Ensure that the price values are represented as numerical values without any currency symbols.`;

    console.log('Requesting food list...');
    const foodPromise = fetchOpenAIList(foodPrompt, require('../utils/listGenerators').foodListSchema);
    console.log('Requesting clothing list...');
    const clothingPromise = fetchOpenAIList(clothingPrompt, require('../utils/listGenerators').clothingListSchema);
    console.log('Requesting cooking list...');
    const cookingPromise = fetchOpenAIList(cookingPrompt, require('../utils/listGenerators').cookingListSchema);
    console.log('Requesting sleeping list...');
    const sleepingPromise = fetchOpenAIList(sleepingPrompt, require('../utils/listGenerators').sleepingListSchema);

    const [food, clothing, cooking, sleeping] = await Promise.all([
      foodPromise,
      clothingPromise,
      cookingPromise,
      sleepingPromise
    ]);
    console.log('Received food list:', food);
    console.log('Received clothing list:', clothing);
    console.log('Received cooking list:', cooking);
    console.log('Received sleeping list:', sleeping);

    // Recalculate totals for each list
    function recalcTotals(list, type) {
      if (!list || !Array.isArray(list.items)) return list;
      let totalWeight = 0, totalPrice = 0, totalCalories = 0;
      if (type === 'food') {
        list.items.forEach(dayObj => {
          ['Breakfast', 'Lunch', 'Snack', 'Dinner'].forEach(meal => {
            if (dayObj[meal]) {
              totalWeight += parseFloat(dayObj[meal].Weight) || 0;
              totalPrice += parseFloat(dayObj[meal].Price) || 0;
              totalCalories += parseFloat(dayObj[meal].Calories) || 0;
            }
          });
        });
        return { ...list, totalWeight: Number(totalWeight.toFixed(2)), totalPrice: Number(totalPrice.toFixed(2)), totalCalories: Math.round(totalCalories) };
      } else {
        list.items.forEach(item => {
          const qty = item.quantity !== undefined ? Number(item.quantity) : 1;
          totalWeight += (parseFloat(item.weight ?? item.Weight) || 0) * qty;
          totalPrice += (parseFloat(item.price ?? item.Price) || 0) * qty;
        });
        return { ...list, totalWeight: Number(totalWeight.toFixed(2)), totalPrice: Number(totalPrice.toFixed(2)) };
      }
    }

    setLists(lists => ({
      ...lists,
      food: recalcTotals(food, 'food'),
      clothing: recalcTotals(clothing, 'clothing'),
      cooking: recalcTotals(cooking, 'cooking'),
      sleeping: recalcTotals(sleeping, 'sleeping'),
    }));
    setStep(3);

    // --- Gemini Grounded API for each list ---
    // Helper to get a summary string for each list
    const getListSummary = (list, type) => {
      if (!list) return '';
      if (type === 'food') {
        return list.items?.map(dayObj =>
          ['Breakfast', 'Lunch', 'Snack', 'Dinner'].map(meal => dayObj[meal]?.Item).filter(Boolean).join(', ')
        ).join('; ');
      } else {
        return list.items?.map(item => item.item || item.Item).filter(Boolean).join(', ');
      }
    };
    // For each list, send summary to Gemini with grounding
    const geminiTasks = [
      { key: 'food', title: 'Food', list: food, schema: require('../utils/listGenerators').foodListSchema },
      { key: 'clothing', title: 'Clothing', list: clothing, schema: require('../utils/listGenerators').clothingListSchema },
      { key: 'cooking', title: 'Cooking', list: cooking, schema: require('../utils/listGenerators').cookingListSchema },
      { key: 'sleeping', title: 'Sleeping', list: sleeping, schema: require('../utils/listGenerators').sleepingListSchema },
    ];
    for (const { key, title, list, schema } of geminiTasks) {
      if (!list) continue;
      const summary = getListSummary(list, key);
      const prompt = `Provide authoritative sources and links for the following backpacking ${title} list. List: ${summary}`;
      fetchGeminiGroundedList(prompt, schema).then(({ json, links }) => {
        console.log(`Gemini grounded result for ${key}:`, json);
        setGeminiLinks(prev => ({ ...prev, [key]: links }));
      });
    }

    // 4. Generate misc list
    toast.info('Step 4: Generating miscellaneous list...');
    const miscPrompt = `List additional items for a ${params.days}-day backpacking trip, aiming for weight near ${miscWeight} lbs (min. ${(0.9 * miscWeight).toFixed(2)} lbs). Exclude clothing, cooking, sleeping, and food from previous lists. Output should be in this JSON format: {\"items\":[{\"item\":\"\",\"weight\":0,\"price\":0},...],\"totalWeight\":0,\"totalPrice\":0} Weight MUST be in pounds and price MUST be in $USD.`;
    console.log('Requesting misc list...');
    const misc = await fetchOpenAIList(miscPrompt, require('../utils/listGenerators').miscListSchema);
    console.log('Received misc list:', misc);
    setLists(lists => {
      const recalcTotals = (list, type) => {
        if (!list || !Array.isArray(list.items)) return list;
        let totalWeight = 0, totalPrice = 0, totalCalories = 0;
        if (type === 'food') {
          list.items.forEach(dayObj => {
            ['Breakfast', 'Lunch', 'Snack', 'Dinner'].forEach(meal => {
              if (dayObj[meal]) {
                totalWeight += parseFloat(dayObj[meal].Weight) || 0;
                totalPrice += parseFloat(dayObj[meal].Price) || 0;
                totalCalories += parseFloat(dayObj[meal].Calories) || 0;
              }
            });
          });
          return { ...list, totalWeight: Number(totalWeight.toFixed(2)), totalPrice: Number(totalPrice.toFixed(2)), totalCalories: Math.round(totalCalories) };
        } else {
          list.items.forEach(item => {
            const qty = item.quantity !== undefined ? Number(item.quantity) : 1;
            totalWeight += (parseFloat(item.weight ?? item.Weight) || 0) * qty;
            totalPrice += (parseFloat(item.price ?? item.Price) || 0) * qty;
          });
          return { ...list, totalWeight: Number(totalWeight.toFixed(2)), totalPrice: Number(totalPrice.toFixed(2)) };
        }
      };
      return {
        ...lists,
        misc: recalcTotals(misc, 'misc'),
      };
    });
    // Also run Gemini for misc list
    const miscSummary = misc?.items?.map(item => item.item || item.Item).filter(Boolean).join(', ');
    if (miscSummary) {
      const miscPrompt = `Provide authoritative sources and links for the following backpacking Miscellaneous list. List: ${miscSummary}`;
      fetchGeminiGroundedList(miscPrompt, require('../utils/listGenerators').miscListSchema).then(({ json, links }) => {
        console.log('Gemini grounded result for misc:', json);
        setGeminiLinks(prev => ({ ...prev, misc: links }));
      });
    }
    setStep(4);
    toast.success('Pack lists generated!');
  };

  // --- Recalculate actual totals for each list from items, for summary table and list totals ---
  function recalcTotals(list, type) {
    if (!list || !Array.isArray(list.items)) return { totalWeight: 0, totalPrice: 0, totalCalories: 0, ...list };
    let totalWeight = 0, totalPrice = 0, totalCalories = 0;
    if (type === 'food') {
      list.items.forEach(dayObj => {
        ['Breakfast', 'Lunch', 'Snack', 'Dinner'].forEach(meal => {
          if (dayObj[meal]) {
            totalWeight += parseFloat(dayObj[meal].Weight) || 0;
            totalPrice += parseFloat(dayObj[meal].Price) || 0;
            totalCalories += parseFloat(dayObj[meal].Calories) || 0;
          }
        });
      });
      return { ...list, totalWeight: Number(totalWeight.toFixed(2)), totalPrice: Number(totalPrice.toFixed(2)), totalCalories: Math.round(totalCalories) };
    } else {
      list.items.forEach(item => {
        const qty = item.quantity !== undefined ? Number(item.quantity) : 1;
        totalWeight += (parseFloat(item.weight ?? item.Weight) || 0) * qty;
        totalPrice += (parseFloat(item.price ?? item.Price) || 0) * qty;
      });
      return { ...list, totalWeight: Number(totalWeight.toFixed(2)), totalPrice: Number(totalPrice.toFixed(2)) };
    }
  }

  // Always use recalculated totals for summary table and list totals
  const clothingTotals = recalcTotals(lists.clothing, 'clothing');
  const cookingTotals = recalcTotals(lists.cooking, 'cooking');
  const sleepingTotals = recalcTotals(lists.sleeping, 'sleeping');
  const foodTotals = recalcTotals(lists.food, 'food');
  const miscTotals = recalcTotals(lists.misc, 'misc');

  return (
    <div className="packlist-wizard">
      <ToastContainer />
      <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
        <Tabs
          value={tabIndex}
          onChange={(_, idx) => setActivePage(idx === 0 ? 'form' : 'list')}
          aria-label="Pack List Wizard Tabs"
          centered
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          <Tab label="User Form" />
          <Tab label="Pack Lists" />
        </Tabs>
      </Box>
      {activePage === 'form' && (
        <Box component="form" onSubmit={handleSubmit} className="wizard-form"
          sx={{
            mt: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}>
          <Typography variant="h4" sx={{ mb: 3 }}>Pack List Wizard</Typography>
          <Box sx={{ width: { xs: '100%', sm: '500px', md: '600px' }, maxWidth: '100%' }}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>About You</Typography>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <TextField
                    label="Age"
                    type="number"
                    name="age"
                    value={inputs.age}
                    onChange={handleChange}
                    required
                    error={!!errors.age}
                    helperText={errors.age || 'years'}
                  />
                </FormControl>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <TextField
                    label="Weight (lbs)"
                    type="number"
                    name="weight"
                    value={inputs.weight}
                    onChange={handleChange}
                    required
                    error={!!errors.weight}
                    helperText={errors.weight || 'pounds'}
                  />
                </FormControl>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel id="sex-label">Sex</InputLabel>
                  <Select
                    labelId="sex-label"
                    name="sex"
                    value={inputs.sex}
                    label="Sex"
                    onChange={handleChange}
                    required
                  >
                    <MenuItem value="male">Male</MenuItem>
                    <MenuItem value="female">Female</MenuItem>
                  </Select>
                </FormControl>
              </CardContent>
            </Card>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Your Hike</Typography>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <TextField
                    label="Length of Hike (days)"
                    type="number"
                    name="days"
                    value={inputs.days}
                    onChange={handleChange}
                    required
                    error={!!errors.days}
                    helperText={errors.days || 'days'}
                  />
                </FormControl>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel id="season-label">Season</InputLabel>
                  <Select
                    labelId="season-label"
                    name="season"
                    value={inputs.season}
                    label="Season"
                    onChange={handleChange}
                    required
                  >
                    <MenuItem value="spring">Spring</MenuItem>
                    <MenuItem value="summer">Summer</MenuItem>
                    <MenuItem value="fall">Fall</MenuItem>
                  </Select>
                </FormControl>
                <Box sx={{ mb: 2 }}>
                  <InputLabel shrink>Average Elevation (ft)</InputLabel>
                  <Slider
                    name="avgElevation"
                    min={0}
                    max={15000}
                    step={100}
                    value={inputs.avgElevation}
                    onChange={handleChange}
                    valueLabelDisplay="auto"
                  />
                  <span>{inputs.avgElevation} ft</span>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <InputLabel shrink>Max Elevation (ft)</InputLabel>
                  <Slider
                    name="maxElevation"
                    min={0}
                    max={15000}
                    step={100}
                    value={inputs.maxElevation}
                    onChange={handleChange}
                    valueLabelDisplay="auto"
                  />
                  <span>{inputs.maxElevation} ft</span>
                </Box>
              </CardContent>
            </Card>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Personal Preferences</Typography>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel id="packweight-label">Pack Weight</InputLabel>
                  <Select
                    labelId="packweight-label"
                    name="packweight"
                    value={inputs.packweight}
                    label="Pack Weight"
                    onChange={handleChange}
                    required
                  >
                    <MenuItem value="ultralight">Ultralight</MenuItem>
                    <MenuItem value="light">Light</MenuItem>
                    <MenuItem value="standard">Standard</MenuItem>
                    <MenuItem value="robust">Robust</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel id="diet-label">Diet</InputLabel>
                  <Select
                    labelId="diet-label"
                    name="diet"
                    value={inputs.diet}
                    label="Diet"
                    onChange={handleChange}
                    required
                  >
                    <MenuItem value="flexible">No Restrictions</MenuItem>
                    <MenuItem value="vegetarian">Vegetarian</MenuItem>
                    <MenuItem value="vegan">Vegan</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel id="tentCapacity-label">Tent Capacity</InputLabel>
                  <Select
                    labelId="tentCapacity-label"
                    name="tentCapacity"
                    value={inputs.tentCapacity}
                    label="Tent Capacity"
                    onChange={handleChange}
                    required
                  >
                    {[...Array(6)].map((_, i) => (
                      <MenuItem key={i+1} value={i+1}>{i+1}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </CardContent>
            </Card>
            <Button type="submit" variant="contained" color="primary" disabled={loading} sx={{ mt: 2, width: '100%' }}>
              Generate Pack List
            </Button>
            {loading && <div className="loading">Loading...</div>}
          </Box>
        </Box>
      )}
      {activePage === 'list' && (
        <Box className="results-view" sx={{ mt: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Card sx={{ mb: 3, width: { xs: '100%', sm: '500px', md: '600px' }, maxWidth: '100%' }}>
            <CardContent>
              <Typography variant="h5" sx={{ mb: 2 }}>Pack Weight</Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Max Backpack Weight:</strong> {getMaxBackpackWeight(Number(inputs.age), Number(inputs.weight)).toFixed(1)} lbs
                <span style={{ marginLeft: 24 }}><strong>Total Price:</strong> ${[clothingTotals, cookingTotals, sleepingTotals, foodTotals, miscTotals].reduce((sum, cat) => sum + (cat.totalPrice || 0), 0).toFixed(2)}</span>
              </Typography>
              {categoryWeights && (
                <>
                  <Typography variant="h6" sx={{ mb: 1 }}>Category Weights</Typography>
                  <TableContainer sx={{ mb: 2 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ whiteSpace: 'nowrap', py: 1, px: 2 }}><strong>Category</strong></TableCell>
                          <TableCell align="right" sx={{ whiteSpace: 'nowrap', py: 1, px: 2 }}><strong>Total Weight (lbs)</strong></TableCell>
                          <TableCell align="right" sx={{ whiteSpace: 'nowrap', py: 1, px: 2 }}><strong>Max Weight (lbs)</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <TableRow>
                          <TableCell sx={{ py: 1, px: 2 }}>Clothing</TableCell>
                          <TableCell align="right" sx={{ py: 1, px: 2 }}>{clothingTotals.totalWeight || ''}</TableCell>
                          <TableCell align="right" sx={{ py: 1, px: 2 }}>{categoryWeights.clothingWeight}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ py: 1, px: 2 }}>Cooking Equipment</TableCell>
                          <TableCell align="right" sx={{ py: 1, px: 2 }}>{cookingTotals.totalWeight || ''}</TableCell>
                          <TableCell align="right" sx={{ py: 1, px: 2 }}>{categoryWeights.cookingWeight}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ py: 1, px: 2 }}>Sleeping</TableCell>
                          <TableCell align="right" sx={{ py: 1, px: 2 }}>{sleepingTotals.totalWeight || ''}</TableCell>
                          <TableCell align="right" sx={{ py: 1, px: 2 }}>{categoryWeights.sleepingWeight}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ py: 1, px: 2 }}>Food</TableCell>
                          <TableCell align="right" sx={{ py: 1, px: 2 }}>{foodTotals.totalWeight || ''}</TableCell>
                          <TableCell align="right" sx={{ py: 1, px: 2 }}>{categoryWeights.foodWeight}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ py: 1, px: 2 }}>Misc</TableCell>
                          <TableCell align="right" sx={{ py: 1, px: 2 }}>{miscTotals.totalWeight || ''}</TableCell>
                          <TableCell align="right" sx={{ py: 1, px: 2 }}>{categoryWeights.miscWeight}</TableCell>
                        </TableRow>
                        {/* Total row for all categories */}
                        <TableRow>
                          <TableCell sx={{ py: 1, px: 2, fontWeight: 'bold' }}>Total</TableCell>
                          <TableCell align="right" sx={{ py: 1, px: 2, fontWeight: 'bold' }}>{[clothingTotals, cookingTotals, sleepingTotals, foodTotals, miscTotals].reduce((sum, cat) => sum + (cat.totalWeight || 0), 0).toFixed(2)}</TableCell>
                          <TableCell align="right" sx={{ py: 1, px: 2, fontWeight: 'bold' }}>{getMaxBackpackWeight(Number(inputs.age), Number(inputs.weight)).toFixed(1)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}
            </CardContent>
          </Card>
          {/* Tabs for pack list categories */}
          <Box sx={{ width: { xs: '100%', sm: '650px', md: '900px' }, maxWidth: '100%', mb: 2, display: 'flex', justifyContent: 'center' }}>
            <Tabs
              value={listsTabIndex}
              onChange={(_, idx) => setListsTabIndex(idx)}
              variant="scrollable"
              scrollButtons="auto"
              aria-label="Pack List Category Tabs"
              centered
              sx={{
                mx: 'auto',
                minHeight: isMobile ? 36 : undefined,
                width: isMobile ? '100%' : undefined,
                maxWidth: '100%',
                display: 'flex',
                justifyContent: isMobile ? 'space-between' : 'center',
                '& .MuiTab-root': {
                  minWidth: isMobile ? '20vw' : undefined,
                  flex: isMobile ? '1 1 0' : undefined,
                  minHeight: isMobile ? 36 : undefined,
                  px: isMobile ? 0.5 : 2,
                  py: isMobile ? 0.5 : 1,
                },
                '& .MuiTabs-flexContainer': {
                  width: '100%',
                  justifyContent: isMobile ? 'space-between' : 'center',
                },
                '& .MuiTabs-indicator': {
                  height: isMobile ? 2 : undefined,
                },
              }}
            >
              <Tab icon={<FastfoodIcon />} label={isMobile ? '' : 'Food'} />
              <Tab icon={<CheckroomIcon />} label={isMobile ? '' : 'Clothing'} />
              <Tab icon={<RestaurantMenuIcon />} label={isMobile ? '' : 'Cooking'} />
              <Tab icon={<HotelIcon />} label={isMobile ? '' : 'Sleeping'} />
              <Tab icon={<MiscellaneousServicesIcon />} label={isMobile ? '' : 'Misc'} disabled={step < 4} />
            </Tabs>
          </Box>
          {/* Only show the selected tab's content */}
          {listsTabIndex === 0 && <CategoryListCard title="Food List" list={foodTotals} type="food" cardWidth={{ xs: '100%', sm: '650px', md: '900px' }} links={geminiLinks.food} />}
          {listsTabIndex === 1 && <CategoryListCard title="Clothing List" list={clothingTotals} type="clothing" cardWidth={{ xs: '100%', sm: '650px', md: '900px' }} links={geminiLinks.clothing} />}
          {listsTabIndex === 2 && <CategoryListCard title="Cooking List" list={cookingTotals} cardWidth={{ xs: '100%', sm: '650px', md: '900px' }} links={geminiLinks.cooking} />}
          {listsTabIndex === 3 && <CategoryListCard title="Sleeping List" list={sleepingTotals} cardWidth={{ xs: '100%', sm: '650px', md: '900px' }} links={geminiLinks.sleeping} />}
          {listsTabIndex === 4 && step === 4 && <CategoryListCard title="Miscellaneous List" list={miscTotals} cardWidth={{ xs: '100%', sm: '650px', md: '900px' }} links={geminiLinks.misc} />}
          {/* Start Over button removed as requested */}
        </Box>
      )}
    </div>
  );
}
