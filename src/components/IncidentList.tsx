
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, MapPin, Clock, Image, Video } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';

interface Incident {
  id: number;
  description: string;
  location: string;
  created_at: string;
  media_urls: string[];
}

const IncidentList: React.FC = () => {
  const { toast } = useToast();

  const fetchIncidents = async (): Promise<Incident[]> => {
    const { data, error } = await supabase
      .from('satarknity_incidents')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    return data || [];
  };

  const { data: incidents, isLoading, error } = useQuery({
    queryKey: ['incidents'],
    queryFn: fetchIncidents,
  });

  if (error) {
    console.error('Error fetching incidents:', error);
    toast({
      title: "Error loading incidents",
      description: "Could not load incident reports. Please try again later.",
      variant: "destructive"
    });
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy • h:mm a');
    } catch (e) {
      return dateString;
    }
  };

  const renderMediaPreview = (url: string, index: number) => {
    const isImage = url.match(/\.(jpeg|jpg|gif|png)$/i);
    const isVideo = url.match(/\.(mp4|webm|ogg|mov)$/i);

    if (isImage) {
      return (
        <div key={index} className="relative rounded-md overflow-hidden h-40 bg-satarknity-softGray">
          <img 
            src={url} 
            alt="Incident media" 
            className="h-full w-full object-cover"
            onError={(e) => {
              e.currentTarget.src = "https://via.placeholder.com/150?text=Image+Error";
              e.currentTarget.alt = "Image failed to load";
            }}
          />
        </div>
      );
    } else if (isVideo) {
      return (
        <div key={index} className="relative rounded-md overflow-hidden h-40 bg-satarknity-softGray">
          <video 
            src={url}
            controls
            className="h-full w-full object-cover"
            onError={(e) => {
              e.currentTarget.parentElement!.innerHTML = 
                '<div class="flex items-center justify-center h-full bg-gray-200 text-gray-500"><Video class="h-6 w-6 mr-2" />Video unavailable</div>';
            }}
          />
        </div>
      );
    } else {
      return (
        <div key={index} className="flex items-center justify-center h-40 bg-satarknity-softGray rounded-md text-satarknity-dark">
          <AlertCircle className="h-6 w-6 mr-2" />
          <span>Unsupported media</span>
        </div>
      );
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-semibold text-satarknity-dark flex items-center gap-2">
        <AlertCircle className="h-5 w-5 text-satarknity-secondary" />
        Recent Community Alerts
      </h2>

      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-satarknity-light/30">
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full mb-4" />
                <div className="grid grid-cols-2 gap-2">
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && incidents && incidents.length === 0 && (
        <Card className="border-satarknity-light shadow bg-gradient-to-br from-white to-satarknity-softGray text-center p-8">
          <div className="flex flex-col items-center justify-center text-satarknity-dark">
            <AlertCircle className="h-12 w-12 text-satarknity-light mb-4" />
            <h3 className="text-xl font-medium mb-2">No incidents reported yet</h3>
            <p className="text-muted-foreground">
              When community members report safety incidents, they will appear here.
            </p>
          </div>
        </Card>
      )}

      {!isLoading && incidents && incidents.length > 0 && (
        <div className="space-y-6">
          {incidents.map((incident) => (
            <Card 
              key={incident.id} 
              className="border-satarknity-light/30 hover:shadow-md transition-shadow duration-300"
            >
              <CardHeader className="border-b border-satarknity-light/20 pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg font-medium text-satarknity-dark">
                    Safety Alert #{incident.id}
                  </CardTitle>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="h-3.5 w-3.5 mr-1" />
                    {formatDate(incident.created_at)}
                  </div>
                </div>
                <div className="flex items-center text-sm text-satarknity-tertiary mt-1">
                  <MapPin className="h-3.5 w-3.5 mr-1" />
                  {incident.location}
                </div>
              </CardHeader>

              <CardContent className="pt-4 space-y-4">
                <p className="text-satarknity-dark whitespace-pre-wrap">
                  {incident.description}
                </p>

                {incident.media_urls && incident.media_urls.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                    {incident.media_urls.map((url, index) => renderMediaPreview(url, index))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default IncidentList;
