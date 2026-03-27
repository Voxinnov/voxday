import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, AlertCircle } from 'lucide-react';
import apiClient from '../services/api';
import toast from 'react-hot-toast';

interface Role {
  id: number;
  name: string;
  desc?: string;
  _count: {
    users: number;
  };
}

interface RoleForm {
  name: string;
  desc: string;
}

interface RoleFormProps {
  role?: Role | null;
  isOpen: boolean;
  onClose: () => void;
}

const RoleForm: React.FC<RoleFormProps> = ({ role, isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<RoleForm>({
    name: '',
    desc: '',
  });
  const [errors, setErrors] = useState<Partial<RoleForm>>({});

  useEffect(() => {
    if (role) {
      setFormData({
        name: role.name,
        desc: role.desc || '',
      });
    } else {
      setFormData({
        name: '',
        desc: '',
      });
    }
    setErrors({});
  }, [role]);

  const createRoleMutation = useMutation({
    mutationFn: (data: RoleForm) => apiClient.post('/roles', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['role-stats'] });
      toast.success('Role created successfully');
      onClose();
    },
    onError: (error: any) => {
      if (error.response?.data?.details) {
        setErrors(
          error.response.data.details.reduce((acc: any, detail: any) => {
            acc[detail.path[0]] = detail.message;
            return acc;
          }, {})
        );
      } else {
        toast.error(error.response?.data?.error || 'Failed to create role');
      }
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: (data: RoleForm) => apiClient.put(`/roles/${role?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['role-stats'] });
      toast.success('Role updated successfully');
      onClose();
    },
    onError: (error: any) => {
      if (error.response?.data?.details) {
        setErrors(
          error.response.data.details.reduce((acc: any, detail: any) => {
            acc[detail.path[0]] = detail.message;
            return acc;
          }, {})
        );
      } else {
        toast.error(error.response?.data?.error || 'Failed to update role');
      }
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error when user starts typing
    if (errors[name as keyof RoleForm]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    const newErrors: Partial<RoleForm> = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Role name is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (role) {
      updateRoleMutation.mutate(formData);
    } else {
      createRoleMutation.mutate(formData);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {role ? 'Edit Role' : 'Create New Role'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-primary-500 focus:border-primary-500 ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter role name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.name}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="desc"
                value={formData.desc}
                onChange={handleInputChange}
                rows={3}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-primary-500 focus:border-primary-500 ${
                  errors.desc ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter role description (optional)"
              />
              {errors.desc && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.desc}
                </p>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createRoleMutation.isPending || updateRoleMutation.isPending}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createRoleMutation.isPending || updateRoleMutation.isPending
                  ? 'Saving...'
                  : role
                  ? 'Update Role'
                  : 'Create Role'
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RoleForm;

