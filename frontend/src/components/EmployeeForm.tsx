import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  X, 
  Save, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  DollarSign,
  Calendar,
  Badge,
  AlertCircle,
  Plus,
  Trash2
} from 'lucide-react';
import apiClient from '../services/api';
import toast from 'react-hot-toast';

interface Employee {
  id: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  employeeType: 'permanent' | 'freelance';
  hourlyRate?: number;
  salary?: number;
  currency?: string;
  position: string;
  department: string;
  startDate: string;
  endDate?: string;
  status: 'active' | 'inactive' | 'terminated';
  skills: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface EmployeeForm {
  name: string;
  email: string;
  phone: string;
  address: string;
  employeeType: 'permanent' | 'freelance';
  hourlyRate: number;
  salary: number;
  currency: string;
  position: string;
  department: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'inactive' | 'terminated';
  skills: string[];
  notes: string;
}

interface EmployeeFormProps {
  employee?: Employee | null;
  isOpen: boolean;
  onClose: () => void;
}

const EmployeeForm: React.FC<EmployeeFormProps> = ({ employee, isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<EmployeeForm>({
    name: '',
    email: '',
    phone: '',
    address: '',
    employeeType: 'permanent',
    hourlyRate: 0,
    salary: 0,
    currency: 'INR',
    position: '',
    department: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    status: 'active',
    skills: [],
    notes: '',
  });

  const [errors, setErrors] = useState<Partial<EmployeeForm>>({});
  const [newSkill, setNewSkill] = useState('');

  useEffect(() => {
    if (employee) {
      setFormData({
        name: employee.name,
        email: employee.email,
        phone: employee.phone || '',
        address: employee.address || '',
        employeeType: employee.employeeType,
        hourlyRate: employee.hourlyRate || 0,
        salary: employee.salary || 0,
        currency: employee.currency || 'INR',
        position: employee.position,
        department: employee.department,
        startDate: employee.startDate.split('T')[0],
        endDate: employee.endDate ? employee.endDate.split('T')[0] : '',
        status: employee.status,
        skills: employee.skills || [],
        notes: employee.notes || '',
      });
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        address: '',
        employeeType: 'permanent',
        hourlyRate: 0,
        salary: 0,
        currency: 'INR',
        position: '',
        department: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        status: 'active',
        skills: [],
        notes: '',
      });
    }
  }, [employee]);

  const createEmployeeMutation = useMutation({
    mutationFn: (data: EmployeeForm) => {
      // Convert date strings to ISO datetime strings
      const payload = {
        ...data,
        startDate: data.startDate ? new Date(data.startDate).toISOString() : null,
        endDate: data.endDate ? new Date(data.endDate).toISOString() : null,
      };
      console.log('Sending payload:', payload);
      return apiClient.post('/employees', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Employee created successfully!');
      onClose();
    },
    onError: (error: any) => {
      console.error('Employee creation error:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.error || 'Failed to create employee');
    },
  });

  const updateEmployeeMutation = useMutation({
    mutationFn: (data: EmployeeForm) => {
      // Convert date strings to ISO datetime strings
      const payload = {
        ...data,
        startDate: data.startDate ? new Date(data.startDate).toISOString() : null,
        endDate: data.endDate ? new Date(data.endDate).toISOString() : null,
      };
      console.log('Sending update payload:', payload);
      return apiClient.put(`/employees/${employee?.id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Employee updated successfully!');
      onClose();
    },
    onError: (error: any) => {
      console.error('Employee update error:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.error || 'Failed to update employee');
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'hourlyRate' || name === 'salary' ? parseFloat(value) || 0 : value
    }));
    
    // Clear error when user starts typing
    if (errors[name as keyof EmployeeForm]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }));
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<EmployeeForm> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Employee name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.position.trim()) {
      newErrors.position = 'Position is required';
    }

    if (!formData.department.trim()) {
      newErrors.department = 'Department is required';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (formData.employeeType === 'freelance' && formData.hourlyRate <= 0) {
      newErrors.hourlyRate = 'Hourly rate must be greater than 0 for freelance employees';
    }

    if (formData.employeeType === 'permanent' && formData.salary <= 0) {
      newErrors.salary = 'Salary must be greater than 0 for permanent employees';
    }

    if (formData.startDate && formData.endDate && new Date(formData.startDate) >= new Date(formData.endDate)) {
      newErrors.endDate = 'End date must be after start date';
    }

    setErrors(newErrors);
    
    // Debug: Log validation errors
    if (Object.keys(newErrors).length > 0) {
      console.log('Form validation errors:', newErrors);
      console.log('Form data:', formData);
    }
    
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Form submission attempted with data:', formData);
    
    if (validateForm()) {
      console.log('Form validation passed, submitting...');
      if (employee) {
        updateEmployeeMutation.mutate(formData);
      } else {
        createEmployeeMutation.mutate(formData);
      }
    } else {
      console.log('Form validation failed');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {employee ? 'Edit Employee' : 'Add New Employee'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-primary-500 focus:border-primary-500 ${
                        errors.name ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Enter full name"
                    />
                  </div>
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-primary-500 focus:border-primary-500 ${
                        errors.email ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Enter email address"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Enter address"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Employment Details */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Employment Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Employee Type *
                  </label>
                  <select
                    name="employeeType"
                    value={formData.employeeType}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="permanent">Permanent</option>
                    <option value="freelance">Freelance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Position *
                  </label>
                  <div className="relative">
                    <Badge className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      name="position"
                      value={formData.position}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-primary-500 focus:border-primary-500 ${
                        errors.position ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Enter position"
                    />
                  </div>
                  {errors.position && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.position}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department *
                  </label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-primary-500 focus:border-primary-500 ${
                      errors.department ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter department"
                  />
                  {errors.department && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.department}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="terminated">Terminated</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Compensation */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Compensation</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Currency
                  </label>
                  <select
                    name="currency"
                    value={formData.currency}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="GBP">UK Pound (£)</option>
                  </select>
                </div>

                {formData.employeeType === 'freelance' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hourly Rate *
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="number"
                        name="hourlyRate"
                        value={formData.hourlyRate}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                        className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-primary-500 focus:border-primary-500 ${
                          errors.hourlyRate ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="0.00"
                      />
                    </div>
                    {errors.hourlyRate && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.hourlyRate}
                      </p>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Annual Salary *
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="number"
                        name="salary"
                        value={formData.salary}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                        className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-primary-500 focus:border-primary-500 ${
                          errors.salary ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="0.00"
                      />
                    </div>
                    {errors.salary && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.salary}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Dates */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Employment Dates</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-primary-500 focus:border-primary-500 ${
                        errors.startDate ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  {errors.startDate && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.startDate}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="date"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-primary-500 focus:border-primary-500 ${
                        errors.endDate ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  {errors.endDate && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.endDate}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Skills */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Skills</h3>
              
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Add a skill"
                  />
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                {formData.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill)}
                          className="ml-2 text-primary-600 hover:text-primary-800"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Notes</h3>
              
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                placeholder="Add any additional notes about this employee"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createEmployeeMutation.isPending || updateEmployeeMutation.isPending}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center"
              >
                {(createEmployeeMutation.isPending || updateEmployeeMutation.isPending) ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {employee ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {employee ? 'Update Employee' : 'Create Employee'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EmployeeForm;
