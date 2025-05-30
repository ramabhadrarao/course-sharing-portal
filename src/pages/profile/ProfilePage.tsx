import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Mail, Key, Camera } from 'lucide-react';

import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { useAuthStore } from '../../stores/authStore';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  profileImageUrl: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Confirm password is required'),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

const ProfilePage: React.FC = () => {
  const { user, updateProfile, isLoading } = useAuthStore();
  const [isPasswordFormVisible, setIsPasswordFormVisible] = useState(false);
  
  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      profileImageUrl: user?.profileImageUrl || '',
    },
  });
  
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPasswordForm,
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
  });
  
  const onProfileSubmit = async (data: ProfileFormValues) => {
    try {
      await updateProfile(data);
    } catch (error) {
      // Error is handled by the store
    }
  };
  
  const onPasswordSubmit = async (data: PasswordFormValues) => {
    try {
      // In a real application, you would call an API to update the password
      console.log('Password updated:', data);
      resetPasswordForm();
      setIsPasswordFormVisible(false);
    } catch (error) {
      console.error('Failed to update password:', error);
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Your Profile</h1>
        <p className="text-gray-600 mt-1">
          Manage your account settings and preferences
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Information */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Profile Information</h2>
              <p className="text-sm text-gray-500">Update your personal details</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-4">
                <Input
                  label="Full Name"
                  leftIcon={<User className="h-5 w-5 text-gray-400" />}
                  error={profileErrors.name?.message}
                  fullWidth
                  {...registerProfile('name')}
                />
                
                <Input
                  label="Email Address"
                  type="email"
                  leftIcon={<Mail className="h-5 w-5 text-gray-400" />}
                  error={profileErrors.email?.message}
                  fullWidth
                  {...registerProfile('email')}
                />
                
                <Input
                  label="Profile Image URL"
                  leftIcon={<Camera className="h-5 w-5 text-gray-400" />}
                  error={profileErrors.profileImageUrl?.message}
                  helperText="Enter a URL for your profile picture"
                  fullWidth
                  {...registerProfile('profileImageUrl')}
                />
                
                <div className="pt-4">
                  <Button
                    type="submit"
                    isLoading={isLoading}
                  >
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
          
          {/* Password Section */}
          <Card className="mt-6">
            <CardHeader>
              <h2 className="text-xl font-semibold">Password</h2>
              <p className="text-sm text-gray-500">Update your password</p>
            </CardHeader>
            <CardContent>
              {isPasswordFormVisible ? (
                <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
                  <Input
                    label="Current Password"
                    type="password"
                    leftIcon={<Key className="h-5 w-5 text-gray-400" />}
                    error={passwordErrors.currentPassword?.message}
                    fullWidth
                    {...registerPassword('currentPassword')}
                  />
                  
                  <Input
                    label="New Password"
                    type="password"
                    leftIcon={<Key className="h-5 w-5 text-gray-400" />}
                    error={passwordErrors.newPassword?.message}
                    fullWidth
                    {...registerPassword('newPassword')}
                  />
                  
                  <Input
                    label="Confirm New Password"
                    type="password"
                    leftIcon={<Key className="h-5 w-5 text-gray-400" />}
                    error={passwordErrors.confirmPassword?.message}
                    fullWidth
                    {...registerPassword('confirmPassword')}
                  />
                  
                  <div className="pt-4 flex space-x-3">
                    <Button
                      type="submit"
                    >
                      Update Password
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsPasswordFormVisible(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setIsPasswordFormVisible(true)}
                  icon={<Key className="h-5 w-5" />}
                >
                  Change Password
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Profile Preview */}
        <div>
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Profile Preview</h2>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 mb-4">
                {user?.profileImageUrl ? (
                  <img
                    src={user.profileImageUrl}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary-100 text-primary-800 text-4xl font-bold">
                    {user?.name?.charAt(0) || '?'}
                  </div>
                )}
              </div>
              
              <h3 className="text-lg font-medium text-gray-900">{user?.name}</h3>
              <p className="text-gray-500">{user?.email}</p>
              
              <div className="mt-4 bg-gray-100 px-4 py-2 rounded-full text-sm font-medium capitalize">
                {user?.role}
              </div>
              
              <div className="mt-6 w-full border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Account Status</span>
                  <span className="bg-success-100 text-success-700 px-2 py-1 rounded-full text-xs font-medium">
                    Active
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;