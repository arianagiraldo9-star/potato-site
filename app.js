'use strict';

// The dataset stores each nutrient for a 100 g portion.
const DATASET_URL = 'potato_nutrition_dataset.json';
const nutrientLabels = [
  ['energy_kcal', 'Calories', 'kcal'],
  ['carbohydrates_g', 'Carbohydrates', 'g'],
  ['protein_g', 'Protein', 'g'],
  ['fat_g', 'Fat', 'g'],
  ['fiber_g', 'Dietary fiber', 'g'],
  ['sugars_g', 'Sugars', 'g'],
  ['water_g', 'Water', 'g'],
  ['vitamin_c_mg', 'Vitamin C', 'mg'],
  ['vitamin_b6_mg', 'Vitamin B6', 'mg'],
  ['potassium_mg', 'Potassium', 'mg'],
  ['magnesium_mg', 'Magnesium', 'mg'],
  ['phosphorus_mg', 'Phosphorus', 'mg'],
  ['iron_mg', 'Iron', 'mg'],
  ['sodium_mg', 'Sodium', 'mg']
];

const themeButton = document.getElementById('theme-toggle');
const form = document.getElementById('nutrition-form');
const foodSelect = document.getElementById('potato-type');
const gramsInput = document.getElementById('potato-grams');
const statusMessage = document.getElementById('nutrition-status');
const results = document.getElementById('nutrition-results');
const nutrientList = document.getElementById('nutrient-list');
const resultDescription = document.getElementById('result-description');
let foods = [];

// Restore the visitor's theme choice, or follow the device preference.
function setTheme(theme) {
  const isDark = theme === 'dark';
  document.body.dataset.theme = isDark ? 'dark' : 'light';
  themeButton.setAttribute('aria-pressed', String(isDark));
  themeButton.textContent = isDark ? 'Switch to light mode' : 'Switch to dark mode';
}

let savedTheme = null;
try { savedTheme = localStorage.getItem('potato-site-theme'); } catch (error) { /* Storage may be unavailable for local files. */ }
const initialTheme = savedTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
setTheme(initialTheme);

themeButton.addEventListener('click', () => {
  const nextTheme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
  setTheme(nextTheme);
  try { localStorage.setItem('potato-site-theme', nextTheme); } catch (error) { /* Theme still works for this visit. */ }
});

// Load food options from the supplied JSON dataset.
async function loadNutritionData() {
  try {
    const response = await fetch(DATASET_URL);
    if (!response.ok) throw new Error('The nutrition dataset could not be loaded.');
    const data = await response.json();
    if (!Array.isArray(data.foods) || data.foods.length === 0) throw new Error('The nutrition dataset has no food entries.');
    foods = data.foods;
    foodSelect.replaceChildren(new Option('Choose a preparation', ''));
    foods.forEach((food) => foodSelect.add(new Option(food.name, food.id)));
    foodSelect.disabled = false;
    statusMessage.textContent = 'Nutrition data is ready. Choose a preparation and enter an amount.';
  } catch (error) {
    foodSelect.replaceChildren(new Option('Nutrition options unavailable', ''));
    statusMessage.textContent = 'Could not load the nutrition dataset. Open this page through a local web server and confirm potato_nutrition_dataset.json is beside index.html.';
  }
}

// Scale each per-100 g value to the amount entered by the visitor.
function calculateNutrients(event) {
  event.preventDefault();
  results.hidden = true;
  const grams = Number(gramsInput.value);
  const selectedFood = foods.find((food) => food.id === foodSelect.value);

  if (!Number.isFinite(grams) || grams < 1 || grams > 5000) {
    statusMessage.textContent = 'Enter a valid amount from 1 to 5,000 grams.';
    gramsInput.setAttribute('aria-invalid', 'true');
    gramsInput.focus();
    return;
  }
  gramsInput.removeAttribute('aria-invalid');
  if (!selectedFood) {
    statusMessage.textContent = 'Choose a potato preparation to calculate its nutrients.';
    foodSelect.focus();
    return;
  }

  const multiplier = grams / 100;
  const formatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });
  nutrientList.replaceChildren();
  nutrientLabels.forEach(([key, label, unit]) => {
    const per100g = selectedFood.nutrients_per_100g[key];
    if (typeof per100g !== 'number') return;
    const row = document.createElement('div');
    const term = document.createElement('dt');
    const value = document.createElement('dd');
    term.textContent = label;
    value.textContent = `${formatter.format(per100g * multiplier)} ${unit}`;
    row.append(term, value);
    nutrientList.append(row);
  });
  resultDescription.textContent = `Estimated nutrients in ${formatter.format(grams)} g of ${selectedFood.name.toLowerCase()}.`;
  statusMessage.textContent = 'Nutrition estimate updated.';
  results.hidden = false;
}

form.addEventListener('submit', calculateNutrients);
loadNutritionData();
