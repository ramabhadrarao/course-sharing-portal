import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BookOpen, Image as ImageIcon, X, AlertCircle, Upload, Plus, Trash } from 'lucide-react';

import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import FileUpload from '../../components/ui/FileUpload';
import { useCourseStore } from '../../stores/courseStore';
import { generateAccessCode } from '../../lib/utils';

const courseSchema = z.object({
  title: z.string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title cannot exceed 200 characters'),
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description cannot exceed 2000 characters'),
  shortDescription: z.string()
    .max(500, 'Short description cannot exceed 500 characters')
    .optional(),
  accessCode: z.string()
    .min(4, 'Access code must be at least 4 characters')
    .max(15, 'Access code cannot exceed 15 characters')
    .regex(/^[A-Z0-9]+$/, 'Access code can only contain letters and numbers'),
  coverImage: z.string().optional(),
  category: z.string().min(1, 'Please select a category'),
  difficulty: z.string().min(1, 'Please select a difficulty level'),
  prerequisites: z.array(z.string().min(1, 'Prerequisite cannot be empty')).optional(),
  learningOutcomes: z.array(z.string().min(1, 'Learning outcome cannot be empty'))
    .min(1, 'At least one learning outcome is required'),
  tags: z.array(z.string().min(1, 'Tag cannot be empty')).optional(),
});

type CourseFormValues = z.infer<typeof courseSchema>;

const CreateCoursePage: React.FC = () => {
  const navigate = useNavigate();
  const { createCourse, isLoading, error } = useCourseStore();
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const categories = [
    'Computer Science', 'Mathematics', 'Physics', 'Chemistry', 'Biology',
    'Engineering', 'Business', 'Arts', 'Language', 'Other'
  ];
  
  const difficulties = ['Beginner', 'Intermediate', 'Advanced'];
  
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      accessCode: generateAccessCode(),
      coverImage: '',
      category: '',
      difficulty: '',
      prerequisites: [],
      learningOutcomes: [''],
      tags: [],
    },
  });
  
  const {
    fields: prerequisiteFields,
    append: appendPrerequisite,
    remove: removePrerequisite,
  } = useFieldArray({
    control,
    name: 'prerequisites',
  });
  
  const {
    fields: outcomeFields,
    append: appendOutcome,
    remove: removeOutcome,
  } = useFieldArray({
    control,
    name: 'learningOutcomes',
  });
  
  const {
    fields: tagFields,
    append: appendTag,
    remove: removeTag,
  } = useFieldArray({
    control,
    name: 'tags',
  });
  
  const coverImageUrl = watch('coverImage');
  
  // Handle form submission
  const onSubmit = async (data: CourseFormValues) => {
    console.log('Form submitted with data:', data);
    console.log('Cover image value:', data.coverImage);
    console.log('Cover image preview:', coverImagePreview);
    setCreateError(null);
    setIsSubmitting(true);
    
    try {
      // Validate required fields
      if (!data.title.trim()) {
        throw new Error('Course title is required');
      }
      if (!data.description.trim()) {
        throw new Error('Course description is required');
      }
      if (!data.accessCode.trim()) {
        throw new Error('Access code is required');
      }
      if (!data.category) {
        throw new Error('Category is required');
      }
      if (!data.difficulty) {
        throw new Error('Difficulty level is required');
      }
      if (!data.learningOutcomes || data.learningOutcomes.filter(o => o.trim()).length === 0) {
        throw new Error('At least one learning outcome is required');
      }

      const courseData = {
        title: data.title.trim(),
        description: data.description.trim(),
        shortDescription: data.shortDescription?.trim() || undefined,
        accessCode: data.accessCode.trim().toUpperCase(),
        coverImage: data.coverImage?.trim() || undefined,
        category: data.category,
        difficulty: data.difficulty,
        prerequisites: data.prerequisites?.filter(p => p.trim()).map(p => p.trim()) || [],
        learningOutcomes: data.learningOutcomes.filter(o => o.trim()).map(o => o.trim()),
        tags: data.tags?.filter(t => t.trim()).map(t => t.trim().toLowerCase()) || [],
      };
      
      console.log('Creating course with processed data:', courseData);
      console.log('Final cover image value:', courseData.coverImage);
      
      const newCourse = await createCourse(courseData);
      console.log('Course created successfully:', newCourse);
      
      // Navigate to the new course
      navigate(`/courses/${newCourse.id}`);
    } catch (error: any) {
      console.error('Create course error:', error);
      setCreateError(error.response?.data?.error || error.message || 'Failed to create course');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Sample cover images
  const sampleImages = [
    'https://images.pexels.com/photos/3861958/pexels-photo-3861958.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    'https://images.pexels.com/photos/546819/pexels-photo-546819.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    'https://images.pexels.com/photos/1181298/pexels-photo-1181298.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    'https://images.pexels.com/photos/1181316/pexels-photo-1181316.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    'https://images.pexels.com/photos/373543/pexels-photo-373543.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    'https://images.pexels.com/photos/270348/pexels-photo-270348.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
  ];
  
  // Handle file upload for cover image - Fixed URL handling
  const handleFileUpload = (fileUrl: string, metadata?: any) => {
    console.log('File uploaded for cover image:', fileUrl, metadata);
    
    // Ensure we have a valid file URL
    if (fileUrl && fileUrl.trim()) {
      setValue('coverImage', fileUrl, { shouldValidate: true });
      setCoverImagePreview(fileUrl);
      console.log('Cover image set to:', fileUrl);
    } else {
      console.error('Invalid file URL received:', fileUrl);
      setCreateError('Failed to get file URL from upload');
    }
  };
  
  // Set image preview from URL
  const handleImageChange = (url: string) => {
    console.log('Setting image URL:', url);
    setValue('coverImage', url, { shouldValidate: true });
    setCoverImagePreview(url);
  };
  
  // Clear image preview
  const clearImage = () => {
    console.log('Clearing image');
    setValue('coverImage', '', { shouldValidate: true });
    setCoverImagePreview(null);
  };

  // Generate new access code
  const generateNewAccessCode = () => {
    const newCode = generateAccessCode();
    setValue('accessCode', newCode, { shouldValidate: true });
  };
  
  // Watch for changes in coverImageUrl input
  React.useEffect(() => {
    if (coverImageUrl && coverImageUrl !== coverImagePreview) {
      setCoverImagePreview(coverImageUrl);
    } else if (!coverImageUrl && coverImagePreview) {
      setCoverImagePreview(null);
    }
  }, [coverImageUrl, coverImagePreview]);

  // Handle navigation back
  const handleCancel = () => {
    navigate('/courses');
  };
  
  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create a New Course</h1>
        <p className="text-gray-600 mt-1">
          Create a comprehensive course to share knowledge with your students
        </p>
      </div>
      
      {/* Display any creation errors */}
      {(error || createError) && (
        <div className="bg-error-50 text-error-700 p-4 rounded-md mb-6 flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Error creating course</p>
            <p className="text-sm mt-1">{error || createError}</p>
          </div>
        </div>
      )}

      {/* Debug info - remove this in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
          <h3 className="text-sm font-medium text-blue-800 mb-2">Debug Info:</h3>
          <div className="text-xs text-blue-700">
            <p><strong>Cover Image (form value):</strong> {coverImageUrl || 'Not set'}</p>
            <p><strong>Cover Image (preview):</strong> {coverImagePreview || 'Not set'}</p>
            <p><strong>Match:</strong> {coverImageUrl === coverImagePreview ? 'Yes' : 'No'}</p>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Course Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">Basic Information</h2>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  label="Course Title"
                  error={errors.title?.message}
                  placeholder="e.g., Introduction to Computer Science"
                  fullWidth
                  {...register('title')}
                />
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Course Description
                  </label>
                  <textarea
                    className={`block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 ${
                      errors.description ? 'border-error-500' : 'border-gray-300'
                    }`}
                    rows={4}
                    placeholder="Provide a detailed description of your course..."
                    {...register('description')}
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-error-500">{errors.description.message}</p>
                  )}
                </div>
                
                <Input
                  label="Short Description (Optional)"
                  error={errors.shortDescription?.message}
                  placeholder="A brief summary for course listings"
                  helperText="This will be shown in course cards and search results"
                  fullWidth
                  {...register('shortDescription')}
                />

                <div className="flex space-x-4">
                  <div className="flex-1">
                    <Input
                      label="Access Code"
                      error={errors.accessCode?.message}
                      placeholder="Course access code"
                      helperText="Students will use this code to join your course"
                      fullWidth
                      {...register('accessCode')}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={generateNewAccessCode}
                      className="mb-4"
                    >
                      Generate New
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Course Settings */}
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">Course Settings</h2>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      {...register('category')}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 ${
                        errors.category ? 'border-error-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select a category</option>
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                    {errors.category && (
                      <p className="mt-1 text-sm text-error-500">{errors.category.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Difficulty Level
                    </label>
                    <select
                      {...register('difficulty')}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 ${
                        errors.difficulty ? 'border-error-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select difficulty</option>
                      {difficulties.map(difficulty => (
                        <option key={difficulty} value={difficulty}>{difficulty}</option>
                      ))}
                    </select>
                    {errors.difficulty && (
                      <p className="mt-1 text-sm text-error-500">{errors.difficulty.message}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Prerequisites */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Prerequisites (Optional)</h2>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => appendPrerequisite('')}
                    icon={<Plus className="h-4 w-4" />}
                  >
                    Add Prerequisite
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {prerequisiteFields.length > 0 ? (
                  <div className="space-y-3">
                    {prerequisiteFields.map((field, index) => (
                      <div key={field.id} className="flex space-x-2">
                        <Input
                          placeholder="e.g., Basic programming knowledge"
                          fullWidth
                          {...register(`prerequisites.${index}`)}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removePrerequisite(index)}
                          icon={<Trash className="h-4 w-4" />}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No prerequisites added yet.</p>
                )}
              </CardContent>
            </Card>
            
            {/* Learning Outcomes */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Learning Outcomes</h2>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => appendOutcome('')}
                    icon={<Plus className="h-4 w-4" />}
                  >
                    Add Outcome
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {outcomeFields.map((field, index) => (
                    <div key={field.id} className="flex space-x-2">
                      <Input
                        placeholder="e.g., Students will be able to write basic programs"
                        fullWidth
                        {...register(`learningOutcomes.${index}`)}
                      />
                      {outcomeFields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeOutcome(index)}
                          icon={<Trash className="h-4 w-4" />}
                        />
                      )}
                    </div>
                  ))}
                </div>
                {errors.learningOutcomes && (
                  <p className="mt-2 text-sm text-error-500">{errors.learningOutcomes.message}</p>
                )}
              </CardContent>
            </Card>
            
            {/* Tags */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Tags (Optional)</h2>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => appendTag('')}
                    icon={<Plus className="h-4 w-4" />}
                  >
                    Add Tag
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {tagFields.length > 0 ? (
                  <div className="space-y-3">
                    {tagFields.map((field, index) => (
                      <div key={field.id} className="flex space-x-2">
                        <Input
                          placeholder="e.g., programming, beginner, web development"
                          fullWidth
                          {...register(`tags.${index}`)}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTag(index)}
                          icon={<Trash className="h-4 w-4" />}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No tags added yet.</p>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Cover Image */}
          <div>
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">Cover Image</h2>
              </CardHeader>
              <CardContent>
                {coverImagePreview ? (
                  <div className="relative mb-4">
                    <img 
                      src={coverImagePreview} 
                      alt="Cover preview" 
                      className="w-full h-40 object-cover rounded-md"
                      onError={(e) => {
                        console.log('Image failed to load:', coverImagePreview);
                        setCoverImagePreview(null);
                        setValue('coverImage', '', { shouldValidate: true });
                      }}
                    />
                    <button
                      type="button"
                      onClick={clearImage}
                      className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-sm hover:bg-gray-100"
                    >
                      <X className="h-4 w-4 text-gray-700" />
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center mb-4">
                    <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 mb-2">Upload or choose a cover image</p>
                    <p className="text-xs text-gray-400">Optional but recommended</p>
                  </div>
                )}
                
                {/* File Upload Component */}
                <div className="mb-4">
                  <FileUpload 
                    onFileUpload={handleFileUpload}
                    accept="image/*"
                    maxSize={10}
                    allowExternalUrl={true}
                    placeholder="Upload image or enter URL"
                  />
                </div>
                
                {/* Manual URL Input */}
                <Input
                  label="Or enter image URL"
                  placeholder="https://example.com/image.jpg"
                  error={errors.coverImage?.message}
                  helperText="Enter a direct link to an image"
                  fullWidth
                  {...register('coverImage')}
                />
              </CardContent>
            </Card>
            
            {/* Sample Images */}
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Sample Cover Images</h3>
              <div className="grid grid-cols-2 gap-2">
                {sampleImages.map((url, index) => (
                  <button
                    key={index}
                    type="button"
                    className="bg-gray-100 rounded-md overflow-hidden h-16 focus:outline-none focus:ring-2 focus:ring-primary-500 hover:opacity-80 transition-opacity"
                    onClick={() => handleImageChange(url)}
                  >
                    <img
                      src={url}
                      alt={`Sample ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Submit Buttons */}
        <div className="mt-8 flex justify-end space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading || isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={isLoading || isSubmitting}
            icon={<BookOpen className="h-5 w-5" />}
            disabled={isLoading || isSubmitting}
          >
            {isSubmitting ? 'Creating Course...' : 'Create Course'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateCoursePage;