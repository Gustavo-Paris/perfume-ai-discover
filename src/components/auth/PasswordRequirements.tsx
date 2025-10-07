import { Check, X } from 'lucide-react';

interface PasswordRequirement {
  label: string;
  met: boolean;
}

interface PasswordRequirementsProps {
  password: string;
}

const PasswordRequirements = ({ password }: PasswordRequirementsProps) => {
  const requirements: PasswordRequirement[] = [
    {
      label: 'Mínimo de 8 caracteres',
      met: password.length >= 8
    },
    {
      label: 'Letra maiúscula (A-Z)',
      met: /[A-Z]/.test(password)
    },
    {
      label: 'Letra minúscula (a-z)',
      met: /[a-z]/.test(password)
    },
    {
      label: 'Número (0-9)',
      met: /[0-9]/.test(password)
    },
    {
      label: 'Caractere especial (!@#$%...)',
      met: /[^A-Za-z0-9]/.test(password)
    }
  ];

  return (
    <div className="space-y-2 rounded-md border border-gray-200 bg-gray-50 p-3">
      <p className="text-xs font-medium text-gray-700">Sua senha deve conter:</p>
      <ul className="space-y-1">
        {requirements.map((req, index) => (
          <li key={index} className="flex items-center gap-2 text-xs">
            {req.met ? (
              <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
            ) : (
              <X className="h-4 w-4 text-gray-400 flex-shrink-0" />
            )}
            <span className={req.met ? 'text-green-700' : 'text-gray-600'}>
              {req.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PasswordRequirements;
