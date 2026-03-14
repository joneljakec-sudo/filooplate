import { Recipe } from '../types';

export const RECIPES: Recipe[] = [
  {
    id: '1',
    title: 'Adobong Kangkong',
    description: 'A budget-friendly Filipino vegetable dish made with water spinach, soy sauce, and vinegar.',
    price: 45,
    calories: 120,
    category: 'Budget Meal',
    image: 'https://picsum.photos/seed/kangkong/800/600',
    ingredients: ['Kangkong (Water Spinach)', 'Garlic', 'Soy Sauce', 'Vinegar', 'Onion'],
    instructions: [
      'Sauté garlic and onion.',
      'Add kangkong stalks first, then leaves.',
      'Pour soy sauce and vinegar. Do not stir immediately.',
      'Simmer until cooked.'
    ]
  },
  {
    id: '2',
    title: 'Tortang Talong',
    description: 'Grilled eggplant omelet, a staple Filipino breakfast or side dish.',
    price: 55,
    calories: 180,
    category: 'Budget Meal',
    image: 'https://picsum.photos/seed/eggplant/800/600',
    ingredients: ['Eggplant', 'Eggs', 'Salt', 'Black Pepper', 'Oil'],
    instructions: [
      'Grill the eggplant until skin is charred.',
      'Peel off the skin and flatten the eggplant.',
      'Dip in beaten eggs with salt and pepper.',
      'Pan-fry until golden brown.'
    ]
  },
  {
    id: '3',
    title: 'Chicken Adobo',
    description: 'The unofficial national dish of the Philippines, savory and tangy.',
    price: 95,
    calories: 350,
    category: 'Regular',
    image: 'https://picsum.photos/seed/adobo/800/600',
    ingredients: ['Chicken pieces', 'Soy Sauce', 'Vinegar', 'Garlic', 'Bay leaves', 'Peppercorns'],
    instructions: [
      'Marinate chicken in soy sauce and garlic.',
      'Sear chicken in a pan.',
      'Add marinade, vinegar, bay leaves, and peppercorns.',
      'Simmer until chicken is tender and sauce is reduced.'
    ]
  },
  {
    id: '4',
    title: 'Sinigang na Baboy',
    description: 'Sour tamarind soup with pork and various vegetables.',
    price: 110,
    calories: 420,
    category: 'Regular',
    image: 'https://picsum.photos/seed/sinigang/800/600',
    ingredients: ['Pork belly', 'Tamarind base', 'Radish', 'String beans', 'Eggplant', 'Water spinach'],
    instructions: [
      'Boil pork until tender.',
      'Add tamarind base and vegetables.',
      'Season with fish sauce to taste.',
      'Serve hot with rice.'
    ]
  },
  {
    id: '5',
    title: 'Beef Kare-Kare',
    description: 'Rich peanut-based stew with tender beef and vegetables.',
    price: 220,
    calories: 580,
    category: 'Premium',
    image: 'https://picsum.photos/seed/karekare/800/600',
    ingredients: ['Beef chunks', 'Peanut butter', 'Annatto seeds', 'Bok choy', 'Eggplant', 'Banana blossom'],
    instructions: [
      'Boil beef until very tender.',
      'Add peanut butter and annatto water for color.',
      'Add vegetables and simmer.',
      'Serve with bagoong (shrimp paste) on the side.'
    ]
  },
  {
    id: '6',
    title: 'Crispy Pata',
    description: 'Deep-fried pork leg, a celebratory Filipino favorite.',
    price: 450,
    calories: 850,
    category: 'Premium',
    image: 'https://picsum.photos/seed/crispypata/800/600',
    ingredients: ['Pork leg', 'Garlic', 'Salt', 'Peppercorns', 'Oil for deep frying'],
    instructions: [
      'Boil pork leg with spices until tender.',
      'Air-dry or freeze overnight for extra crispiness.',
      'Deep fry until skin is golden and blistered.',
      'Serve with soy-vinegar dipping sauce.'
    ]
  }
];
