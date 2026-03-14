/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Menu, 
  X, 
  LayoutDashboard, 
  User, 
  UtensilsCrossed, 
  Heart, 
  History as HistoryIcon,
  LogOut,
  LogIn,
  ChevronRight,
  Search,
  Filter,
  Flame,
  Wallet,
  ArrowLeft,
  Plus
} from 'lucide-react';
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  doc, 
  setDoc, 
  collection, 
  addDoc, 
  serverTimestamp, 
  onSnapshot, 
  query, 
  orderBy, 
  limit,
  getDoc
} from './firebase';
import { Recipe, UserProfile, HistoryItem } from './types';
import { RECIPES } from './data/recipes';

type View = 'Dashboard' | 'Profile' | 'Recipes' | 'Favorites' | 'History';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [currentView, setCurrentView] = useState<View>('Dashboard');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (u) => {
      setUser(u);
      if (u) {
        // Fetch or create profile
        const userDoc = await getDoc(doc(db, 'users', u.uid));
        if (userDoc.exists()) {
          setUserProfile(userDoc.data() as UserProfile);
        } else {
          const newProfile: UserProfile = {
            uid: u.uid,
            email: u.email || '',
            displayName: u.displayName || '',
            photoURL: u.photoURL || '',
            caloriesTarget: 2000,
            budgetTarget: 500,
            role: 'user'
          };
          await setDoc(doc(db, 'users', u.uid), newProfile);
          setUserProfile(newProfile);
        }

        // Listen to history
        const historyQuery = query(
          collection(db, 'users', u.uid, 'history'),
          orderBy('timestamp', 'desc'),
          limit(20)
        );
        const unsubHistory = onSnapshot(historyQuery, (snapshot) => {
          setHistory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HistoryItem)));
        });

        return () => unsubHistory();
      } else {
        setUserProfile(null);
        setHistory([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setSelectedRecipe(null);
    setCurrentView('Dashboard');
  };

  const saveToHistory = async (recipe: Recipe) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'users', user.uid, 'history'), {
        recipeId: recipe.id,
        timestamp: serverTimestamp(),
        priceAtView: recipe.price
      });
    } catch (error) {
      console.error('Error saving history:', error);
    }
  };

  const toggleFavorite = (recipeId: string) => {
    setFavorites(prev => 
      prev.includes(recipeId) ? prev.filter(id => id !== recipeId) : [...prev, recipeId]
    );
  };

  const filteredRecipes = useMemo(() => {
    return RECIPES.filter(r => {
      const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory ? r.category === activeCategory : true;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, activeCategory]);

  const stats = useMemo(() => {
    const todayHistory = history.filter(h => {
      if (!h.timestamp) return false;
      const date = h.timestamp.toDate ? h.timestamp.toDate() : new Date(h.timestamp);
      return date.toDateString() === new Date().toDateString();
    });

    const spent = todayHistory.reduce((acc, h) => acc + h.priceAtView, 0);
    const consumed = todayHistory.reduce((acc, h) => {
      const recipe = RECIPES.find(r => r.id === h.recipeId);
      return acc + (recipe?.calories || 0);
    }, 0);

    return { spent, consumed };
  }, [history]);

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex flex-col items-center justify-center p-6 text-center">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-24 h-24 bg-[#FF6321] rounded-3xl flex items-center justify-center text-white mb-8 shadow-xl"
        >
          <UtensilsCrossed size={48} />
        </motion.div>
        <h1 className="text-4xl font-black tracking-tight mb-4">FiloPlate</h1>
        <p className="text-[#141414]/60 max-w-xs mb-12">
          Your personalized Filipino meal planner. Track calories and budget with every bite.
        </p>
        <button 
          onClick={handleLogin}
          className="flex items-center gap-3 bg-white border border-[#141414]/10 px-8 py-4 rounded-2xl font-bold shadow-sm hover:shadow-md transition-all active:scale-95"
        >
          <LogIn size={20} />
          Sign in with Google
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F0] text-[#141414] font-sans">
      {/* Sidebar/Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 w-full max-w-[280px] bg-white z-50 shadow-2xl flex flex-col"
            >
              <div className="p-8 border-b border-[#141414]/5 flex items-center justify-between">
                <h2 className="text-2xl font-black tracking-tight text-[#FF6321]">FiloPlate</h2>
                <button onClick={() => setIsMenuOpen(false)} className="p-2 hover:bg-[#141414]/5 rounded-full">
                  <X size={24} />
                </button>
              </div>

              <nav className="flex-1 p-4 space-y-2">
                {[
                  { id: 'Dashboard', icon: LayoutDashboard },
                  { id: 'Profile', icon: User },
                  { id: 'Recipes', icon: UtensilsCrossed },
                  { id: 'Favorites', icon: Heart },
                  { id: 'History', icon: HistoryIcon },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentView(item.id as View);
                      setIsMenuOpen(false);
                      setSelectedRecipe(null);
                    }}
                    className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ${
                      currentView === item.id ? 'bg-[#FF6321] text-white shadow-lg' : 'hover:bg-[#141414]/5 text-[#141414]/60'
                    }`}
                  >
                    <item.icon size={20} />
                    {item.id}
                  </button>
                ))}
              </nav>

              <div className="p-8 border-t border-[#141414]/5">
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-red-500 hover:bg-red-50 transition-all"
                >
                  <LogOut size={20} />
                  Sign Out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#F5F5F0]/80 backdrop-blur-md border-b border-[#141414]/5 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMenuOpen(true)} className="p-2 hover:bg-[#141414]/5 rounded-xl transition-colors">
              <Menu size={24} />
            </button>
            <h1 className="text-xl font-black tracking-tight">{currentView}</h1>
          </div>
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm">
            <img src={user.photoURL || 'https://picsum.photos/seed/user/100/100'} alt="User" />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 pb-24">
        <AnimatePresence mode="wait">
          {selectedRecipe ? (
            <motion.div
              key="recipe-detail"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto"
            >
              <button 
                onClick={() => setSelectedRecipe(null)}
                className="flex items-center gap-2 text-[#141414]/60 hover:text-[#141414] mb-6 transition-colors"
              >
                <ArrowLeft size={20} />
                Back to {currentView}
              </button>

              <div className="bg-white rounded-[40px] overflow-hidden shadow-xl border border-[#141414]/5">
                <div className="aspect-video relative">
                  <img src={selectedRecipe.image} alt={selectedRecipe.title} className="w-full h-full object-cover" />
                  <button 
                    onClick={() => toggleFavorite(selectedRecipe.id)}
                    className="absolute top-6 right-6 p-3 bg-white/80 backdrop-blur-md rounded-2xl shadow-lg text-[#FF6321]"
                  >
                    <Heart size={24} fill={favorites.includes(selectedRecipe.id) ? 'currentColor' : 'none'} />
                  </button>
                </div>
                <div className="p-8">
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-4 py-1.5 bg-[#FF6321]/10 text-[#FF6321] text-xs font-bold rounded-full uppercase tracking-widest">
                      {selectedRecipe.category}
                    </span>
                    <div className="flex items-center gap-4 text-sm font-bold">
                      <div className="flex items-center gap-1 text-orange-600">
                        <Flame size={16} />
                        {selectedRecipe.calories} kcal
                      </div>
                      <div className="flex items-center gap-1 text-green-600">
                        <Wallet size={16} />
                        ₱{selectedRecipe.price}
                      </div>
                    </div>
                  </div>
                  <h2 className="text-3xl font-black mb-4 tracking-tight">{selectedRecipe.title}</h2>
                  <p className="text-[#141414]/60 mb-8 leading-relaxed">{selectedRecipe.description}</p>

                  <div className="space-y-8">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-widest text-[#141414]/40 mb-4">Ingredients</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {selectedRecipe.ingredients.map((ing, i) => (
                          <div key={i} className="flex items-center gap-3 p-3 bg-[#F5F5F0] rounded-xl text-sm">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#FF6321]" />
                            {ing}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-widest text-[#141414]/40 mb-4">Instructions</h4>
                      <div className="space-y-6">
                        {selectedRecipe.instructions.map((step, i) => (
                          <div key={i} className="flex gap-4">
                            <span className="text-2xl font-black text-[#141414]/10">{i + 1}</span>
                            <p className="text-[#141414]/80 text-sm leading-relaxed">{step}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={currentView}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
            >
              {currentView === 'Dashboard' && (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-8 rounded-[32px] shadow-sm border border-[#141414]/5">
                      <div className="flex items-center justify-between mb-6">
                        <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center">
                          <Flame size={24} />
                        </div>
                        <span className="text-xs font-bold text-[#141414]/40 uppercase tracking-widest">Daily Calories</span>
                      </div>
                      <div className="flex items-end gap-2 mb-2">
                        <span className="text-4xl font-black">{stats.consumed}</span>
                        <span className="text-[#141414]/40 font-bold mb-1">/ {userProfile?.caloriesTarget} kcal</span>
                      </div>
                      <div className="w-full h-3 bg-[#F5F5F0] rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min((stats.consumed / (userProfile?.caloriesTarget || 2000)) * 100, 100)}%` }}
                          className="h-full bg-orange-500"
                        />
                      </div>
                    </div>

                    <div className="bg-white p-8 rounded-[32px] shadow-sm border border-[#141414]/5">
                      <div className="flex items-center justify-between mb-6">
                        <div className="w-12 h-12 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center">
                          <Wallet size={24} />
                        </div>
                        <span className="text-xs font-bold text-[#141414]/40 uppercase tracking-widest">Daily Budget</span>
                      </div>
                      <div className="flex items-end gap-2 mb-2">
                        <span className="text-4xl font-black">₱{stats.spent}</span>
                        <span className="text-[#141414]/40 font-bold mb-1">/ ₱{userProfile?.budgetTarget}</span>
                      </div>
                      <div className="w-full h-3 bg-[#F5F5F0] rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min((stats.spent / (userProfile?.budgetTarget || 500)) * 100, 100)}%` }}
                          className="h-full bg-green-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-black mb-6 tracking-tight">Recent Activity</h3>
                    <div className="space-y-4">
                      {history.slice(0, 5).map((h, i) => {
                        const recipe = RECIPES.find(r => r.id === h.recipeId);
                        if (!recipe) return null;
                        return (
                          <div key={h.id || i} className="bg-white p-4 rounded-2xl flex items-center gap-4 border border-[#141414]/5">
                            <img src={recipe.image} className="w-16 h-16 rounded-xl object-cover" />
                            <div className="flex-1">
                              <h4 className="font-bold text-sm">{recipe.title}</h4>
                              <p className="text-xs text-[#141414]/40">
                                {h.timestamp?.toDate ? h.timestamp.toDate().toLocaleTimeString() : 'Just now'}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-sm text-green-600">₱{h.priceAtView}</p>
                              <p className="text-[10px] text-[#141414]/40 uppercase font-bold">{recipe.category}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {currentView === 'Recipes' && (
                <div className="space-y-8">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#141414]/40" size={20} />
                      <input 
                        type="text"
                        placeholder="Search Filipino dishes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border border-[#141414]/10 focus:outline-none focus:ring-2 focus:ring-[#FF6321]/20 transition-all"
                      />
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                      {['Budget Meal', 'Regular', 'Premium'].map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                          className={`px-6 py-4 rounded-2xl font-bold whitespace-nowrap transition-all ${
                            activeCategory === cat ? 'bg-[#141414] text-white' : 'bg-white text-[#141414]/60 border border-[#141414]/10'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredRecipes.map((recipe) => (
                      <motion.div
                        key={recipe.id}
                        layoutId={`recipe-${recipe.id}`}
                        onClick={() => {
                          setSelectedRecipe(recipe);
                          saveToHistory(recipe);
                        }}
                        className="group bg-white rounded-[32px] overflow-hidden border border-[#141414]/5 cursor-pointer hover:shadow-xl transition-all duration-300"
                      >
                        <div className="aspect-[4/3] overflow-hidden relative">
                          <img src={recipe.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          <div className="absolute top-4 right-4 px-3 py-1 bg-white/90 backdrop-blur-md rounded-xl text-[10px] font-black uppercase tracking-widest text-[#FF6321]">
                            ₱{recipe.price}
                          </div>
                        </div>
                        <div className="p-6">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] font-bold text-[#141414]/40 uppercase tracking-widest">{recipe.category}</span>
                            <div className="w-1 h-1 rounded-full bg-[#141414]/20" />
                            <span className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">{recipe.calories} kcal</span>
                          </div>
                          <h3 className="text-xl font-black mb-2 group-hover:text-[#FF6321] transition-colors">{recipe.title}</h3>
                          <p className="text-[#141414]/60 text-xs line-clamp-2">{recipe.description}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {currentView === 'Profile' && userProfile && (
                <div className="max-w-md mx-auto space-y-8">
                  <div className="text-center">
                    <div className="w-24 h-24 rounded-[32px] overflow-hidden mx-auto mb-4 border-4 border-white shadow-lg">
                      <img src={userProfile.photoURL || 'https://picsum.photos/seed/user/200/200'} className="w-full h-full object-cover" />
                    </div>
                    <h2 className="text-2xl font-black tracking-tight">{userProfile.displayName}</h2>
                    <p className="text-[#141414]/40 text-sm">{userProfile.email}</p>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-white p-6 rounded-3xl border border-[#141414]/5">
                      <label className="text-xs font-bold uppercase tracking-widest text-[#141414]/40 mb-4 block">Daily Calorie Target</label>
                      <div className="flex items-center gap-4">
                        <input 
                          type="range" 
                          min="1200" 
                          max="4000" 
                          step="50"
                          value={userProfile.caloriesTarget}
                          onChange={async (e) => {
                            const val = parseInt(e.target.value);
                            setUserProfile(prev => prev ? { ...prev, caloriesTarget: val } : null);
                            await setDoc(doc(db, 'users', user.uid), { caloriesTarget: val }, { merge: true });
                          }}
                          className="flex-1 accent-[#FF6321]"
                        />
                        <span className="font-black text-lg w-20 text-right">{userProfile.caloriesTarget}</span>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-[#141414]/5">
                      <label className="text-xs font-bold uppercase tracking-widest text-[#141414]/40 mb-4 block">Daily Budget Target (₱)</label>
                      <div className="flex items-center gap-4">
                        <input 
                          type="range" 
                          min="100" 
                          max="2000" 
                          step="50"
                          value={userProfile.budgetTarget}
                          onChange={async (e) => {
                            const val = parseInt(e.target.value);
                            setUserProfile(prev => prev ? { ...prev, budgetTarget: val } : null);
                            await setDoc(doc(db, 'users', user.uid), { budgetTarget: val }, { merge: true });
                          }}
                          className="flex-1 accent-green-500"
                        />
                        <span className="font-black text-lg w-20 text-right">₱{userProfile.budgetTarget}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentView === 'Favorites' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {RECIPES.filter(r => favorites.includes(r.id)).map((recipe) => (
                    <motion.div
                      key={recipe.id}
                      onClick={() => setSelectedRecipe(recipe)}
                      className="group bg-white rounded-[32px] overflow-hidden border border-[#141414]/5 cursor-pointer"
                    >
                      <div className="aspect-[4/3] overflow-hidden relative">
                        <img src={recipe.image} className="w-full h-full object-cover" />
                        <div className="absolute top-4 right-4 p-2 bg-white rounded-xl text-[#FF6321]">
                          <Heart size={16} fill="currentColor" />
                        </div>
                      </div>
                      <div className="p-6">
                        <h3 className="font-black mb-1">{recipe.title}</h3>
                        <p className="text-[#141414]/40 text-xs">₱{recipe.price} • {recipe.calories} kcal</p>
                      </div>
                    </motion.div>
                  ))}
                  {favorites.length === 0 && (
                    <div className="col-span-full text-center py-20">
                      <Heart size={48} className="mx-auto text-[#141414]/10 mb-4" />
                      <p className="text-[#141414]/40">No favorites yet. Start exploring!</p>
                    </div>
                  )}
                </div>
              )}

              {currentView === 'History' && (
                <div className="space-y-4">
                  {history.map((h, i) => {
                    const recipe = RECIPES.find(r => r.id === h.recipeId);
                    if (!recipe) return null;
                    return (
                      <div 
                        key={h.id || i} 
                        onClick={() => setSelectedRecipe(recipe)}
                        className="bg-white p-6 rounded-3xl flex items-center gap-6 border border-[#141414]/5 cursor-pointer hover:bg-[#F5F5F0] transition-colors"
                      >
                        <img src={recipe.image} className="w-20 h-20 rounded-2xl object-cover" />
                        <div className="flex-1">
                          <h4 className="text-lg font-black tracking-tight">{recipe.title}</h4>
                          <p className="text-sm text-[#141414]/40">
                            Viewed on {h.timestamp?.toDate ? h.timestamp.toDate().toLocaleString() : 'Just now'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-black text-green-600">₱{h.priceAtView}</p>
                          <ChevronRight size={20} className="ml-auto text-[#141414]/20" />
                        </div>
                      </div>
                    );
                  })}
                  {history.length === 0 && (
                    <div className="text-center py-20">
                      <HistoryIcon size={48} className="mx-auto text-[#141414]/10 mb-4" />
                      <p className="text-[#141414]/40">Your viewing history is empty.</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Tab Bar (Mobile Only) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-[#141414]/5 px-6 py-4 flex justify-between items-center z-40">
        {[
          { id: 'Dashboard', icon: LayoutDashboard },
          { id: 'Recipes', icon: UtensilsCrossed },
          { id: 'History', icon: HistoryIcon },
          { id: 'Profile', icon: User },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setCurrentView(item.id as View);
              setSelectedRecipe(null);
            }}
            className={`flex flex-col items-center gap-1 transition-all ${
              currentView === item.id ? 'text-[#FF6321]' : 'text-[#141414]/40'
            }`}
          >
            <item.icon size={20} />
            <span className="text-[10px] font-bold uppercase tracking-widest">{item.id}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
