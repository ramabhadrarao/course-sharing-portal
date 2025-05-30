import React, { useEffect, useState } from 'react';
import { Search, PlusCircle, Edit, Trash, User, Mail, Shield, Calendar, AlertCircle, Check, X } from 'lucide-react';

import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { useAuthStore } from '../../stores/authStore';
import { useUserStore } from '../../stores/userStore';
import { formatDate } from '../../lib/utils';

interface UserFormData {
  name: string;
  email: string;
  password: string;
  role: 'student' | 'faculty' | 'admin';
  profileImage: string;
}

const AdminUsersPage: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const { 
    users, 
    fetchUsers, 
    createUser, 
    updateUser, 
    deleteUser, 
    isLoading, 
    error,
    clearError 
  } = useUserStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  
  const [userForm, setUserForm] = useState<UserFormData>({
    name: '',
    email: '',
    password: '',
    role: 'student',
    profileImage: ''
  });

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      clearError();
      fetchUsers();
    }
  }, [currentUser, fetchUsers, clearError]);

  // Filter users based on search term and role
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createUser(userForm);
      setShowCreateModal(false);
      resetForm();
    } catch (error) {
      console.error('Failed to create user:', error);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    try {
      const { password, ...updateData } = userForm;
      await updateUser(editingUser, updateData);
      setEditingUser(null);
      resetForm();
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteUser(userId);
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  const startEditingUser = (user: any) => {
    setUserForm({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      profileImage: user.profileImageUrl || ''
    });
    setEditingUser(user.id);
  };

  const resetForm = () => {
    setUserForm({
      name: '',
      email: '',
      password: '',
      role: 'student',
      profileImage: ''
    });
  };

  const cancelEdit = () => {
    setEditingUser(null);
    resetForm();
  };

  const cancelCreate = () => {
    setShowCreateModal(false);
    resetForm();
  };

  if (currentUser?.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <Shield className="h-12 w-12 text-error-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
        <p className="text-gray-600">You don't have permission to access this page.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">Manage all users in the system</p>
        </div>
        
        <div className="mt-4 md:mt-0">
          <Button
            onClick={() => setShowCreateModal(true)}
            icon={<PlusCircle className="h-5 w-5" />}
          >
            Create New User
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-error-50 text-error-700 p-3 rounded-md mb-4 flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="md:flex-1">
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search className="h-5 w-5 text-gray-400" />}
            fullWidth
          />
        </div>
        
        <div className="md:w-48">
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">All Roles</option>
            <option value="student">Students</option>
            <option value="faculty">Faculty</option>
            <option value="admin">Admins</option>
          </select>
        </div>
      </div>

      {/* Users List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      ) : filteredUsers.length > 0 ? (
        <div className="grid gap-4">
          {filteredUsers.map((user) => (
            <Card key={user.id} className="transition-shadow hover:shadow-md">
              <CardContent className="p-6">
                {editingUser === user.id ? (
                  <form onSubmit={handleUpdateUser} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Full Name"
                        value={userForm.name}
                        onChange={(e) => setUserForm(prev => ({ ...prev, name: e.target.value }))}
                        required
                        fullWidth
                      />
                      <Input
                        label="Email Address"
                        type="email"
                        value={userForm.email}
                        onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                        required
                        fullWidth
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Role
                        </label>
                        <select
                          value={userForm.role}
                          onChange={(e) => setUserForm(prev => ({ ...prev, role: e.target.value as any }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        >
                          <option value="student">Student</option>
                          <option value="faculty">Faculty</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                      <Input
                        label="Profile Image URL"
                        value={userForm.profileImage}
                        onChange={(e) => setUserForm(prev => ({ ...prev, profileImage: e.target.value }))}
                        fullWidth
                      />
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button type="submit" icon={<Check className="h-4 w-4" />}>
                        Save Changes
                      </Button>
                      <Button type="button" variant="outline" onClick={cancelEdit}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        {user.profileImageUrl ? (
                          <img
                            src={user.profileImageUrl}
                            alt={user.name}
                            className="h-12 w-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center">
                            <User className="h-6 w-6 text-primary-600" />
                          </div>
                        )}
                      </div>
                      
                      <div className="ml-4">
                        <h3 className="text-lg font-medium text-gray-900">{user.name}</h3>
                        <div className="flex items-center text-sm text-gray-500">
                          <Mail className="h-4 w-4 mr-1" />
                          {user.email}
                        </div>
                        <div className="flex items-center mt-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.role === 'admin' 
                              ? 'bg-error-100 text-error-800'
                              : user.role === 'faculty'
                              ? 'bg-secondary-100 text-secondary-800'
                              : 'bg-primary-100 text-primary-800'
                          }`}>
                            {user.role}
                          </span>
                          <span className="ml-4 text-xs text-gray-500 flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            Joined {formatDate(user.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEditingUser(user)}
                        icon={<Edit className="h-4 w-4" />}
                      >
                        Edit
                      </Button>
                      {user.id !== currentUser?.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowDeleteConfirm({ id: user.id, name: user.name })}
                          icon={<Trash className="h-4 w-4" />}
                          className="text-error-600 hover:text-error-700"
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || filterRole !== 'all'
                ? "No users match your search criteria"
                : "No users have been created yet"}
            </p>
            {!searchTerm && filterRole === 'all' && (
              <Button
                onClick={() => setShowCreateModal(true)}
                icon={<PlusCircle className="h-5 w-5" />}
              >
                Create First User
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Create New User</h2>
              <button
                onClick={cancelCreate}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  value={userForm.name}
                  onChange={(e) => setUserForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                  fullWidth
                />
                <Input
                  label="Email Address"
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                  required
                  fullWidth
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Password"
                  type="password"
                  value={userForm.password}
                  onChange={(e) => setUserForm(prev => ({ ...prev, password: e.target.value }))}
                  required
                  fullWidth
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm(prev => ({ ...prev, role: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="student">Student</option>
                    <option value="faculty">Faculty</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              
              <Input
                label="Profile Image URL (Optional)"
                value={userForm.profileImage}
                onChange={(e) => setUserForm(prev => ({ ...prev, profileImage: e.target.value }))}
                fullWidth
              />
              
              <div className="flex space-x-3 justify-end pt-4">
                <Button type="button" variant="outline" onClick={cancelCreate}>
                  Cancel
                </Button>
                <Button type="submit" icon={<PlusCircle className="h-4 w-4" />}>
                  Create User
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center mb-4">
              <AlertCircle className="h-6 w-6 text-error-500 mr-2" />
              <h3 className="text-lg font-semibold">Confirm Deletion</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete user "{showDeleteConfirm.name}"? 
              This action cannot be undone and will remove all associated data.
            </p>
            <div className="flex space-x-3 justify-end">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(null)}>
                Cancel
              </Button>
              <Button 
                variant="danger" 
                onClick={() => handleDeleteUser(showDeleteConfirm.id)}
              >
                Delete User
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;