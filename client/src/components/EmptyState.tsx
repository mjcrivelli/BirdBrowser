import React from 'react';
import { AlertCircle } from 'lucide-react';

interface EmptyStateProps {
  message?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  message = 'Não foram encontrados registros de aves para exibição.'
}) => {
  return (
    <div className="text-center py-12" role="status" aria-live="polite">
      <AlertCircle className="h-16 w-16 mx-auto text-gray-400 mb-4" />
      <h2 className="text-xl font-montserrat font-semibold">Nenhuma ave encontrada</h2>
      <p className="text-gray-600 mt-2">{message}</p>
    </div>
  );
};

export default EmptyState;
