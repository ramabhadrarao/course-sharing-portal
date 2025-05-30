import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User } from 'lucide-react';

import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { useAuthStore } from '../../stores/authStore';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  role: z.enum(['student', 'faculty']),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register: registerUser, isLoading, error } = useAuthStore();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'student',
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      await registerUser({
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
      });
      navigate('/dashboard');
    } catch (error) {
      // Error is handled by the store
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Create your account</h2>
      
      {error && (
        <div className="bg-error-50 text-error-700 p-3 rounded-md mb-4 animate-fade-in">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Full Name"
          leftIcon={<User className="h-5 w-5 text-gray-400" />}
          error={errors.name?.message}
          fullWidth
          {...register('name')}
        />
        
        <Input
          label="Email Address"
          type="email"
          leftIcon={<Mail className="h-5 w-5 text-gray-400" />}
          error={errors.email?.message}
          fullWidth
          {...register('email')}
        />
        
        <Input
          label="Password"
          type="password"
          leftIcon={<Lock className="h-5 w-5 text-gray-400" />}
          error={errors.password?.message}
          fullWidth
          {...register('password')}
        />
        
        <Input
          label="Confirm Password"
          type="password"
          leftIcon={<Lock className="h-5 w-5 text-gray-400" />}
          error={errors.confirmPassword?.message}
          fullWidth
          {...register('confirmPassword')}
        />
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            I am registering as
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="student"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                {...register('role')}
              />
              <span className="ml-2 text-sm text-gray-700">Student</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="radio"
                value="faculty"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                {...register('role')}
              />
              <span className="ml-2 text-sm text-gray-700">Faculty</span>
            </label>
          </div>
          {errors.role && (
            <p className="mt-1 text-sm text-error-500">{errors.role.message}</p>
          )}
        </div>
        
        <Button
          type="submit"
          className="w-full"
          isLoading={isLoading}
        >
          Sign up
        </Button>
      </form>
      
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;