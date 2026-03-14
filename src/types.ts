export interface Recipe {
  id: string;
  title: string;
  description: string;
  price: number;
  calories: number;
  category: 'Budget Meal' | 'Regular' | 'Premium';
  image: string;
  ingredients: string[];
  instructions: string[];
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  caloriesTarget: number;
  budgetTarget: number;
  role: 'user' | 'admin';
}

export interface HistoryItem {
  id?: string;
  recipeId: string;
  timestamp: any;
  priceAtView: number;
}
