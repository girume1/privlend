import React from 'react';

const Docs = () => {
  const steps = [
    {
      title: "1. Create Credit Profile",
      description: "Users generate a private 'CreditTier' record. Your credit score is verified via ZK-proof, but the score itself never leaves your wallet.",
      icon: "🛡️"
    },
    {
      title: "2. Request Private Loan",
      description: "Submit a loan request. The principal and collateral amounts are encrypted into a private record, visible only to you and the lender.",
      icon: "🔒"
    },
    {
      title: "3. On-Chain Registration",
      description: "A public mapping is updated to track the loan's deadline and status, ensuring the protocol remains trustless without exposing amounts.",
      icon: "🌐"
    },
    {
      title: "4. Secure Repayment",
      description: "Repay the loan privately. Upon verification, the protocol releases your collateral record back to your owner address.",
      icon: "💰"
    }
  ];

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-white">How PrivLend Works</h1>
      <div className="grid gap-6">
        {steps.map((step, index) => (
          <div key={index} className="bg-slate-900 p-6 rounded-xl border border-slate-800">
            <div className="text-3xl mb-2">{step.icon}</div>
            <h2 className="text-xl font-bold text-blue-400 mb-2">{step.title}</h2>
            <p className="text-slate-400 leading-relaxed">{step.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Docs;