import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, FileImage, Send, AlertCircle, X, AlertTriangle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/lib/supabase';
import { Alert, AlertDescription } from "@/components/ui/alert";
import IncidentList from './IncidentList';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

interface IncidentMedia {
  file: File;
  preview: string;
}

// Create a client for React Query
const queryClient = new QueryClient();

const SatarknityForm: React.FC = () => {
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [media, setMedia] = useState<IncidentMedia[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    // Only allow up to 2 files
    if (media.length + e.target.files.length > 2) {
      toast({
        title: "Too many files",
        description: "You can only upload up to 2 media files",
        variant: "destructive"
      });
      return;
    }

    // Process each file
    const newMedia: IncidentMedia[] = [];
    Array.from(e.target.files).forEach(file => {
      // Check file type
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        toast({
          title: "Invalid file type",
          description: "Only images and videos are allowed",
          variant: "destructive"
        });
        return;
      }

      // Create preview
      const preview = URL.createObjectURL(file);
      newMedia.push({ file, preview });
    });

    setMedia([...media, ...newMedia]);
  };

  const removeMedia = (index: number) => {
    const updatedMedia = [...media];
    URL.revokeObjectURL(updatedMedia[index].preview);
    updatedMedia.splice(index, 1);
    setMedia(updatedMedia);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      toast({
        title: "Configuration Error",
        description: "Supabase is not properly configured. Please set up your environment variables.",
        variant: "destructive"
      });
      return;
    }
    
    // Basic validation
    if (!description.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide a description of the incident",
        variant: "destructive"
      });
      return;
    }

    if (!location.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide the location of the incident",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Get current authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to submit an alert",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }

      // Upload media files if provided
      const mediaUrls: string[] = [];
      
      if (media.length > 0) {
        for (const item of media) {
          const fileExt = item.file.name.split('.').pop();
          const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
          const filePath = `${user.id}/${fileName}`;
          
          const { error: uploadError } = await supabase.storage
            .from('incidentmedia')
            .upload(filePath, item.file);
            
          if (uploadError) {
            throw uploadError;
          }
          
          // Get public URL
          const { data: publicUrlData } = supabase.storage
            .from('incidentmedia')
            .getPublicUrl(filePath);
            
          mediaUrls.push(publicUrlData.publicUrl);
        }
      }

      // Save incident to database
      const { error } = await supabase
        .from('satarknity_incidents')
        .insert({
          user_id: user.id,
          description,
          location,
          media_urls: mediaUrls,
        });

      if (error) throw error;

      // Show success toast
      toast({
        title: "Alert submitted",
        description: "Your community alert has been submitted successfully",
      });

      // Clear form
      setDescription('');
      setLocation('');
      media.forEach(item => URL.revokeObjectURL(item.preview));
      setMedia([]);
      
      // Invalidate incidents query to refetch the list after adding a new one
      queryClient.invalidateQueries({ queryKey: ['incidents'] });

    } catch (error) {
      console.error("Error submitting incident:", error);
      toast({
        title: "Submission failed",
        description: "There was an error submitting your alert. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-satarknity-light shadow-lg bg-gradient-to-br from-white to-satarknity-softGray">
      <CardHeader className="border-b border-satarknity-light/30">
        <div className="flex items-center gap-2 mb-1">
          <AlertCircle className="h-5 w-5 text-satarknity-secondary" />
          <CardTitle className="text-satarknity-dark">Report a Safety Incident</CardTitle>
        </div>
        <CardDescription>
          Share information about safety concerns or incidents in your area
        </CardDescription>
      </CardHeader>
      
      <form onSubmit={handleSubmit}>
        <CardContent className="pt-6 space-y-6">
          {/* Description Input */}
          <div className="space-y-2">
            <Label htmlFor="description" className="flex items-center gap-2">
              <span className="text-satarknity-tertiary">📝</span> Description
            </Label>
            <Textarea 
              id="description"
              placeholder="Describe what happened and any important details..."
              className="min-h-32 border-satarknity-light focus:border-satarknity-primary"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Location Input */}
          <div className="space-y-2">
            <Label htmlFor="location" className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-satarknity-tertiary" /> Location
            </Label>
            <Input
              id="location"
              placeholder="Street address or landmark..."
              className="border-satarknity-light focus:border-satarknity-primary"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          {/* Media Upload */}
          <div className="space-y-2">
            <Label htmlFor="media" className="flex items-center gap-2">
              <FileImage className="h-4 w-4 text-satarknity-tertiary" /> Media (Optional, max 2)
            </Label>
            <div className="flex items-center gap-2">
              <Button 
                type="button" 
                variant="outline"
                className="border-satarknity-light hover:bg-satarknity-softGray"
                onClick={() => document.getElementById('media-upload')?.click()}
                disabled={media.length >= 2}
              >
                {media.length === 0 ? 'Add Photos/Videos' : 'Add Another'}
              </Button>
              <Input
                id="media-upload"
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={handleMediaChange}
                multiple={media.length === 0}
              />
              <span className="text-sm text-muted-foreground">
                {media.length}/2 files added
              </span>
            </div>

            {/* Media Preview */}
            {media.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                {media.map((item, index) => (
                  <div key={index} className="relative rounded-md overflow-hidden border border-satarknity-light h-24">
                    {item.file.type.startsWith('image/') ? (
                      <img 
                        src={item.preview} 
                        alt={`Media preview ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <video 
                        src={item.preview}
                        className="h-full w-full object-cover"
                      />
                    )}
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6 rounded-full"
                      onClick={() => removeMedia(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter>
          <Button 
            type="submit" 
            className="w-full bg-satarknity-primary hover:bg-satarknity-secondary"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>Processing...</>
            ) : (
              <div className="flex items-center gap-2">
                <Send className="h-4 w-4" />
                Submit Safety Alert
              </div>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

const Satarknity: React.FC = () => {
  // Check if Supabase is configured
  const isSupabaseConfigured = () => {
    return !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
  };

  // If Supabase is not configured, show a warning
  if (!isSupabaseConfigured()) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Supabase configuration is missing. Please connect to Supabase to use this feature.
          </AlertDescription>
        </Alert>
        
        <Card className="border-satarknity-light shadow-lg">
          <CardHeader>
            <CardTitle>Community Safety Alert</CardTitle>
            <CardDescription>
              Connect to Supabase to enable community safety alerts
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }
  
  // Regular render with the form and incident list
  return (
    <QueryClientProvider client={queryClient}>
      <div className="max-w-4xl mx-auto p-4">
        <div className="grid grid-cols-1 gap-8 mb-12">
          <SatarknityForm />
          <IncidentList />
        </div>
      </div>
    </QueryClientProvider>
  );
};

export default Satarknity;
