
import React, { useState, useEffect, useMemo } from 'react';
import { DEFAULT_BOX_TYPES, DEFAULT_MAX_CAPACITY } from './constants';
import { BoxType, BoxQuantities, LoadingAdvice } from './types';
import WeightDisplay from './components/WeightDisplay';
import BoxSelector from './components/BoxSelector';
import { getLoadingAdvice } from './geminiService';

const App: React.FC = () => {
  // Persistence Loading
  const loadInitialData = () => {
    try {
      const savedCustomBoxes = localStorage.getItem('cs_custom_boxes');
      const savedQuantities = localStorage.getItem('cs_quantities');
      const savedCapacity = localStorage.getItem('cs_capacity');
      
      return {
        customBoxes: savedCustomBoxes ? JSON.parse(savedCustomBoxes) : [],
        quantities: savedQuantities ? JSON.parse(savedQuantities) : {},
        capacity: savedCapacity ? parseInt(savedCapacity) : DEFAULT_MAX_CAPACITY
      };
    } catch (e) {
      return { customBoxes: [], quantities: {}, capacity: DEFAULT_MAX_CAPACITY };
    }
  };

  const initialData = loadInitialData();

  const [customBoxes, setCustomBoxes] = useState<BoxType[]>(initialData.customBoxes);
  const [quantities, setQuantities] = useState<BoxQuantities>(initialData.quantities);
  const [maxCapacity, setMaxCapacity] = useState(initialData.capacity);
  const [advice, setAdvice] = useState<LoadingAdvice | null>(null);
  const [isLoadingAdvice, setIsLoadingAdvice] = useState(false);
  
  // Custom Box Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newWeight, setNewWeight] = useState('');

  const allBoxTypes = useMemo(() => [...DEFAULT_BOX_TYPES, ...customBoxes], [customBoxes]);

  const totalWeight = useMemo(() => {
    return allBoxTypes.reduce((total, box) => {
      return total + (quantities[box.id] || 0) * box.weight;
    }, 0);
  }, [quantities, allBoxTypes]);

  // Sync with LocalStorage
  useEffect(() => {
    localStorage.setItem('cs_custom_boxes', JSON.stringify(customBoxes));
  }, [customBoxes]);

  useEffect(() => {
    localStorage.setItem('cs_quantities', JSON.stringify(quantities));
  }, [quantities]);

  useEffect(() => {
    localStorage.setItem('cs_capacity', maxCapacity.toString());
  }, [maxCapacity]);

  const handleQuantityChange = (id: string, newQty: number) => {
    setQuantities(prev => ({ ...prev, [id]: newQty }));
  };

  const handleAddCustomBox = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newWeight) return;

    const weightNum = parseFloat(newWeight);
    if (isNaN(weightNum) || weightNum <= 0) return;

    const newBox: BoxType = {
      id: `custom-${Date.now()}`,
      name: newName,
      weight: weightNum,
      color: 'bg-indigo-500',
      icon: '📦',
      isCustom: true
    };

    setCustomBoxes(prev => [...prev, newBox]);
    setNewName('');
    setNewWeight('');
    setShowAddForm(false);
  };

  const handleDeleteBox = (id: string) => {
    setCustomBoxes(prev => prev.filter(b => b.id !== id));
    setQuantities(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const resetLoading = () => {
    if (confirm('¿Estás seguro de que deseas reiniciar todas las cantidades?')) {
      setQuantities({});
      setAdvice(null);
    }
  };

  // Debounced AI advice request
  useEffect(() => {
    if (totalWeight === 0) {
      setAdvice(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoadingAdvice(true);
      try {
        // Pass allBoxTypes to geminiService to handle custom box metadata
        const result = await getLoadingAdvice(allBoxTypes, quantities, totalWeight, maxCapacity);
        setAdvice(result);
      } catch (e) {
        console.error("Advice error", e);
      } finally {
        setIsLoadingAdvice(false);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [totalWeight, maxCapacity, quantities, allBoxTypes]);

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      {/* Header */}
      <header className="bg-slate-900 text-white py-8 px-4 shadow-lg mb-8">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
              <span className="text-amber-400">🚚</span> CargaSegura
            </h1>
            <p className="text-slate-400 text-sm mt-1">Calculadora inteligente de carga</p>
          </div>
          <button 
            onClick={resetLoading}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-300"
            title="Reiniciar carga"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 space-y-6">
        
        {/* Weight Panel */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <WeightDisplay current={totalWeight} max={maxCapacity} />
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-center">
            <label className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-2 block text-center md:text-left">
              Capacidad Camioneta (kg)
            </label>
            <div className="flex items-center gap-3">
              <input 
                type="number" 
                value={maxCapacity} 
                onChange={(e) => setMaxCapacity(Math.max(1, parseInt(e.target.value) || 0))}
                className="w-full text-2xl font-bold text-center text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-amber-400 outline-none transition-all"
              />
            </div>
          </div>
        </section>

        {/* Selection Area */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                </svg>
                Tipos de Cajas
              </h2>
              <button 
                onClick={() => setShowAddForm(!showAddForm)}
                className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all flex items-center gap-1 ${
                  showAddForm ? 'bg-slate-200 text-slate-600' : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'
                }`}
              >
                {showAddForm ? 'Cancelar' : '+ Añadir Propia'}
              </button>
            </div>

            {showAddForm && (
              <form 
                onSubmit={handleAddCustomBox}
                className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl space-y-3 animate-in fade-in zoom-in duration-200"
              >
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-indigo-400 block mb-1 ml-1">Nombre</label>
                    <input 
                      autoFocus
                      placeholder="Ej: Repuestos"
                      className="w-full px-3 py-2 rounded-lg border border-indigo-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-indigo-400 block mb-1 ml-1">Peso (kg)</label>
                    <input 
                      type="number"
                      step="0.1"
                      placeholder="12.5"
                      className="w-full px-3 py-2 rounded-lg border border-indigo-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      value={newWeight}
                      onChange={e => setNewWeight(e.target.value)}
                    />
                  </div>
                </div>
                <button 
                  type="submit"
                  className="w-full bg-indigo-600 text-white font-bold py-2 rounded-lg text-sm hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  Guardar Nueva Caja
                </button>
              </form>
            )}

            <div className="space-y-3">
              {allBoxTypes.map(box => (
                <BoxSelector 
                  key={box.id} 
                  box={box} 
                  quantity={quantities[box.id] || 0}
                  onChange={handleQuantityChange}
                  onDelete={handleDeleteBox}
                />
              ))}
            </div>
          </div>

          {/* AI Insights */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              Asistente de Seguridad
            </h2>
            
            <div className={`min-h-[220px] rounded-2xl p-6 transition-all duration-300 ${
              !advice ? 'bg-slate-100 border-2 border-dashed border-slate-200 flex items-center justify-center' :
              advice.status === 'safe' ? 'bg-emerald-50 border border-emerald-100' :
              advice.status === 'warning' ? 'bg-amber-50 border border-amber-100' :
              'bg-red-50 border border-red-100'
            }`}>
              {isLoadingAdvice ? (
                <div className="flex flex-col items-center gap-4 text-slate-400">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-slate-300 border-t-slate-600"></div>
                  <p className="text-sm font-medium">Analizando carga con Gemini...</p>
                </div>
              ) : !advice ? (
                <div className="text-center text-slate-400 max-w-[200px]">
                  <p className="text-sm italic">Calculando distribución ideal...</p>
                </div>
              ) : (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`p-2 rounded-lg ${
                      advice.status === 'safe' ? 'bg-emerald-500 text-white' :
                      advice.status === 'warning' ? 'bg-amber-500 text-white' :
                      'bg-red-500 text-white'
                    }`}>
                      {advice.status === 'safe' && '✅'}
                      {advice.status === 'warning' && '⚠️'}
                      {advice.status === 'danger' && '🚨'}
                    </div>
                    <div>
                      <h3 className={`font-bold ${
                        advice.status === 'safe' ? 'text-emerald-800' :
                        advice.status === 'warning' ? 'text-amber-800' :
                        'text-red-800'
                      }`}>
                        {advice.message}
                      </h3>
                    </div>
                  </div>
                  
                  <ul className="space-y-3">
                    {advice.tips.map((tip, idx) => (
                      <li key={idx} className="flex gap-3 text-sm text-slate-600 leading-relaxed">
                        <span className="text-slate-300">•</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Persistent Bottom Bar for Mobile Visibility */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 md:p-6 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)]">
        <div className="flex justify-between items-center max-w-4xl mx-auto">
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">Carga Actual</p>
            <p className={`text-2xl font-black ${totalWeight > maxCapacity ? 'text-red-600' : 'text-slate-900'}`}>
              {totalWeight.toLocaleString()} <span className="text-lg font-normal">kg</span>
            </p>
          </div>
          <div className="text-right">
             <div className={`px-3 py-1 rounded-full text-xs font-bold mb-1 inline-block ${
               totalWeight > maxCapacity ? 'bg-red-100 text-red-600' : 
               (totalWeight/maxCapacity) > 0.8 ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
             }`}>
               {((totalWeight / maxCapacity) * 100).toFixed(1)}% Capacidad
             </div>
             <p className="text-xs text-slate-400 font-medium">Disponible: {Math.max(0, maxCapacity - totalWeight)} kg</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
