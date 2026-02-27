import React from 'react';

const plans = [
  {
    name: 'PEQUENO',
    description: '0 a 10 equipamentos',
    price: 70,
  },
  {
    name: 'MÉDIO',
    description: '10 a 50 equipamentos',
    price: 130,
  },
  {
    name: 'GRANDE',
    description: '50+ equipamentos',
    price: 170,
  },
];

const Landing = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Planos de Assinatura</h1>
          <p className="text-lg text-gray-600">Escolha o plano ideal para a sua empresa</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className="bg-white rounded-xl shadow-md p-8 flex flex-col items-center text-center border border-gray-200"
            >
              <h2 className="text-xl font-bold text-gray-800 mb-2">{plan.name}</h2>
              <p className="text-gray-500 mb-6">{plan.description}</p>
              <div className="text-4xl font-bold text-blue-600 mb-1">
                R$ {plan.price}
              </div>
              <p className="text-gray-500 text-sm">/mês</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Landing;
