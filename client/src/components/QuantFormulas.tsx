import React from 'react';

export default function QuantFormulas() {
  const formulas = [
    {
      name: "Black-Scholes",
      formula: "C = S₀N(d₁) - Ke⁻ʳᵀN(d₂)"
    },
    {
      name: "Sharpe Ratio",
      formula: "S = (R - Rₚ) / σ"
    },
    {
      name: "GARCH(1,1)",
      formula: "σ²ₜ = ω + α₁ε²ₜ₋₁ + β₁σ²ₜ₋₁"
    }
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="space-y-4">
        {formulas.map((formula, index) => (
          <div key={index} className="text-center">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">{formula.name}</div>
            <div className="font-mono text-lg bg-white/70 dark:bg-gray-800/70 px-4 py-2 rounded shadow-sm">
              {formula.formula}
            </div>
          </div>
        ))}
      </div>
      <div className="text-sm text-gray-600 dark:text-gray-400 mt-4 text-center italic">
        Quantitative Models
      </div>
    </div>
  );
}