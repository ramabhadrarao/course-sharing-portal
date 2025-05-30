import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BookOpen, Image as ImageIcon, X, AlertCircle, Upload } from 'lucide-react';

import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { useCourseStore } from '../../stores/courseStore';
import { generateAccessCode } from '../../lib/utils';

const courseSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title is too long'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(1000, 'Description is too long'),
  accessCode: z.string().min(4, 'Access code must be at least 4 characters').max(10, 'Access code is too long'),
  coverImage: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
});

type CourseFormValues = z.infer<typeof courseSchema>;

const CreateCoursePage: React.FC = () => {
  const navigate = useNavigate();
  const { createCourse, isLoading, error } = useCourseStore();
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      accessCode: generateAccessCode(),
      coverImage: '',
    },
  });
  
  const coverImageUrl = watch('coverImage');
  
  // Handle form submission
  const onSubmit = async (data: CourseFormValues) => {
    setCreateError(null);
    try {
      console.log('Form data:', data);
      
      const courseData = {
        title: data.title.trim(),
        description: data.description.trim(),
        accessCode: data.accessCode.trim().toUpperCase(),
        coverImage: data.coverImage?.trim() || undefined
      };
      
      console.log('Creating course with data:', courseData);
      
      const newCourse = await createCourse(courseData);
      console.log('Course created successfully:', newCourse);
      
      // Navigate to the new course
      navigate(`/courses/${newCourse.id}`);
    } catch (error: any) {
      console.error('Create course error:', error);
      setCreateError(error.message || 'Failed to create course');
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
  
  // Set image preview
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
  }, [coverImageUrl]);
  
  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create a New Course</h1>
        <p className="text-gray-600 mt-1">
          Create a new course to share with your students
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
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Course Details */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">Course Information</h2>
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
                    placeholder="Provide a description of your course..."
                    {...register('description')}
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-error-500">{errors.description.message}</p>
                  )}
                </div>

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
          </div>
          
          {/* Cover Image */}
          <div>
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">Cover Image</h2>
              </CardHeader>
              <CardContent>
                {coverImagePreview ? (
                  <div className="relative">
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
                  <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
                    <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 mb-2">Choose a cover image</p>
                    <p className="text-xs text-gray-400">Optional but recommended</p>
                  </div>
                )}
                
                <Input
                  label="Image URL"
                  placeholder="https://example.com/image.jpg"
                  error={errors.coverImage?.message}
                  helperText="Enter a direct link to an image"
                  className="mt-4"
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
        <div className="mt-6 flex justify-end space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/courses')}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={isLoading}
            icon={<BookOpen className="h-5 w-5" />}
          >
            Create Course
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateCoursePage;