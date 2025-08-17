import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Heart, Calendar, FileText, Sparkles, Edit, Trash2 } from 'lucide-react';
import type { UserPhotocardWithDetails } from '../../../server/src/schema';
import { PhotocardDetails } from '@/components/PhotocardDetails';

interface MyCollectionProps {
  collection: UserPhotocardWithDetails[];
  onCollectionChange: () => void;
}

export function MyCollection({ collection, onCollectionChange }: MyCollectionProps) {
  const [selectedCard, setSelectedCard] = useState<UserPhotocardWithDetails | null>(null);

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'MINT': return 'bg-green-600';
      case 'NEAR_MINT': return 'bg-blue-600';
      case 'GOOD': return 'bg-yellow-600';
      case 'FAIR': return 'bg-orange-600';
      case 'POOR': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  const getConditionIcon = (condition: string) => {
    switch (condition) {
      case 'MINT': return '✨';
      case 'NEAR_MINT': return '💎';
      case 'GOOD': return '👍';
      case 'FAIR': return '📝';
      case 'POOR': return '😔';
      default: return '❓';
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-200 flex items-center justify-center gap-2">
          <Heart className="h-5 w-5 text-red-400" />
          My Collection
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          {collection.length === 0 
            ? 'Start building your XG photocard collection! ✨'
            : `${collection.length} photocard${collection.length !== 1 ? 's' : ''} collected`
          }
        </p>
      </div>

      {collection.length === 0 ? (
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-8 text-center">
            <div className="text-gray-400">
              <Heart className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Your collection is empty</p>
              <p className="text-sm mt-1">
                Add your first photocard using the "Add" tab above!
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {collection.map((item: UserPhotocardWithDetails) => (
            <Dialog key={item.id}>
              <DialogTrigger asChild>
                <Card className="bg-gray-900 border-gray-800 hover:bg-gray-800 transition-all duration-200 cursor-pointer hover:scale-[1.02] hover:shadow-lg">
                  <CardContent className="p-3">
                    <div className="aspect-[3/4] bg-gray-800 rounded-md mb-3 relative overflow-hidden">
                      {item.user_image_url ? (
                        <img
                          src={item.user_image_url}
                          alt={`${item.photocard.member} - ${item.photocard.album_name}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500">
                          <Sparkles className="h-8 w-8 opacity-50" />
                        </div>
                      )}
                      
                      {/* Condition Badge */}
                      <div className="absolute top-2 left-2">
                        <Badge className={`text-white text-xs px-2 py-1 ${getConditionColor(item.condition)}`}>
                          {getConditionIcon(item.condition)} {item.condition.replace('_', ' ')}
                        </Badge>
                      </div>
                      
                      {/* 3D Hover Effect Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 opacity-0 hover:opacity-100 transition-opacity duration-200" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-semibold text-gray-200 line-clamp-2">
                          {item.photocard.album_name}
                        </h3>
                        <Badge variant="secondary" className="text-xs bg-gray-700 text-gray-300 shrink-0">
                          {item.photocard.member}
                        </Badge>
                      </div>
                      
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="outline" className="text-xs border-gray-600 text-gray-400">
                          {item.photocard.category.replace('_', ' ')}
                        </Badge>
                        {item.photocard.store && (
                          <Badge variant="outline" className="text-xs border-gray-600 text-gray-400">
                            {item.photocard.store}
                          </Badge>
                        )}
                      </div>
                      
                      {item.acquired_date && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Calendar className="h-3 w-3" />
                          {item.acquired_date.toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </DialogTrigger>
              
              <DialogContent className="bg-gray-900 border-gray-700 text-gray-200 max-w-md mx-4">
                <DialogHeader>
                  <DialogTitle className="text-gray-200">
                    {item.photocard.member} • {item.photocard.album_name}
                  </DialogTitle>
                </DialogHeader>
                
                <PhotocardDetails 
                  userPhotocard={item}
                  onUpdate={onCollectionChange}
                />
              </DialogContent>
            </Dialog>
          ))}
        </div>
      )}
    </div>
  );
}