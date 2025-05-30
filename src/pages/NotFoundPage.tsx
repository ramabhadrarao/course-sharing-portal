import React from 'react';
import { Link } from 'react-router-dom';
import { HomeIcon } from 'lucide-react';

import Button from '../components/ui/Button';

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-primary-600">404</h1>
        <h2 className="text-3xl font-bold text-gray-900 mt-4">Page Not Found</h2>
        <p className="text-gray-600 mt-2 max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Button
          as={Link}
          to="/dashboard"
          className="mt-8"
          icon={<HomeIcon className="h-5 w-5" />}
        >
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default NotFoundPage;