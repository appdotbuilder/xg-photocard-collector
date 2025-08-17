import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  Calendar, 
  FileText, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Sparkles,
  Info
} from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { UserPhotocardWithDetails, UpdateUserPhotocardInput } from '../../../server/src/schema';

interface PhotocardDetailsProps {
  userPhotocard: UserPhotocardWithDetails;
  onUpdate: () => void;
}

export function PhotocardDetails({ userPhotocard, onUpdate }: PhotocardDetailsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [formData, setFormData] = useState<UpdateUserPhotocardInput>({
    id: userPhotocard.id,
    user_id: userPhotocard.user_id,
    condition: userPhotocard.condition,
    acquired_date: userPhotocard.acquired_date,
    notes: userPhotocard.notes
  });

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

  const handleSave = async () => {
    setIsUpdating(true);
    try {
      await trpc.updateUserPhotocard.mutate(formData);
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Failed to update photocard:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await trpc.removeFromCollection.mutate({
        id: userPhotocard.id,
        userId: userPhotocard.user_id
      });
      onUpdate();
    } catch (error) {
      console.error('Failed to delete photocard:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      id: userPhotocard.id,
      user_id: userPhotocard.user_id,
      condition: userPhotocard.condition,
      acquired_date: userPhotocard.acquired_date,
      notes: userPhotocard.notes
    });
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Image */}
      <div className="flex justify-center">
        <div className="relative">
          <div className="aspect-[3/4] w-48 bg-gray-800 rounded-lg overflow-hidden">
            {userPhotocard.user_image_url ? (
              <img
                src={userPhotocard.user_image_url}
                alt={`${userPhotocard.photocard.member} - ${userPhotocard.photocard.album_name}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500">
                <Sparkles className="h-12 w-12 opacity-50" />
              </div>
            )}
          </div>
          
          {/* 3D Effect Overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 rounded-lg pointer-events-none" />
        </div>
      </div>

      {/* Photocard Info */}
      <div className="space-y-3">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-200">
            {userPhotocard.photocard.album_name}
          </h3>
          <p className="text-gray-400">{userPhotocard.photocard.member}</p>
        </div>

        <div className="flex flex-wrap gap-2 justify-center">
          <Badge className={`text-white ${getConditionColor(userPhotocard.condition)}`}>
            {getConditionIcon(userPhotocard.condition)} {userPhotocard.condition.replace('_', ' ')}
          </Badge>
          <Badge variant="outline" className="border-gray-600 text-gray-400">
            {userPhotocard.photocard.category.replace('_', ' ')}
          </Badge>
          <Badge variant="outline" className="border-gray-600 text-gray-400">
            {userPhotocard.photocard.version}
          </Badge>
        </div>
      </div>

      <Separator className="bg-gray-700" />

      {/* Details */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Info className="h-4 w-4" />
          <span className="font-medium">Card Details</span>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <Label className="text-gray-400">Release Type</Label>
            <p className="text-gray-200">
              {userPhotocard.photocard.release_type?.replace('_', ' ') || 'N/A'}
            </p>
          </div>
          <div>
            <Label className="text-gray-400">Release Structure</Label>
            <p className="text-gray-200">
              {userPhotocard.photocard.release_structure?.replace('_', ' ') || 'N/A'}
            </p>
          </div>
          {userPhotocard.photocard.store && (
            <div className="col-span-2">
              <Label className="text-gray-400">Store</Label>
              <p className="text-gray-200">{userPhotocard.photocard.store}</p>
            </div>
          )}
        </div>
      </div>

      <Separator className="bg-gray-700" />

      {/* Collection Details */}
      {isEditing ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Edit className="h-4 w-4" />
            <span className="font-medium">Edit Collection Details</span>
          </div>

          <div>
            <Label className="text-gray-200">Condition</Label>
            <Select 
              value={formData.condition} 
              onValueChange={(value: 'MINT' | 'NEAR_MINT' | 'GOOD' | 'FAIR' | 'POOR') => 
                setFormData((prev: UpdateUserPhotocardInput) => ({ ...prev, condition: value }))
              }
            >
              <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="MINT">✨ Mint</SelectItem>
                <SelectItem value="NEAR_MINT">💎 Near Mint</SelectItem>
                <SelectItem value="GOOD">👍 Good</SelectItem>
                <SelectItem value="FAIR">📝 Fair</SelectItem>
                <SelectItem value="POOR">😔 Poor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-gray-200">Acquired Date</Label>
            <Input
              type="date"
              value={formData.acquired_date ? formData.acquired_date.toISOString().split('T')[0] : ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: UpdateUserPhotocardInput) => ({ 
                  ...prev, 
                  acquired_date: e.target.value ? new Date(e.target.value) : null 
                }))
              }
              className="bg-gray-800 border-gray-700 text-gray-200"
            />
          </div>

          <div>
            <Label className="text-gray-200">Notes</Label>
            <Textarea
              value={formData.notes || ''}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setFormData((prev: UpdateUserPhotocardInput) => ({ 
                  ...prev, 
                  notes: e.target.value || null 
                }))
              }
              placeholder="Any special notes..."
              className="bg-gray-800 border-gray-700 text-gray-200 resize-none"
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              disabled={isUpdating}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {isUpdating ? (
                <>
                  <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
            <Button
              onClick={handleCancel}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <FileText className="h-4 w-4" />
            <span className="font-medium">Collection Details</span>
          </div>

          {userPhotocard.acquired_date && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className="text-gray-400">Acquired:</span>
              <span className="text-gray-200">
                {userPhotocard.acquired_date.toLocaleDateString()}
              </span>
            </div>
          )}

          {userPhotocard.notes && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <FileText className="h-4 w-4" />
                <span>Notes:</span>
              </div>
              <p className="text-sm text-gray-300 bg-gray-800 p-3 rounded-md">
                {userPhotocard.notes}
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={() => setIsEditing(true)}
              variant="outline"
              className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Details
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="border-red-600 text-red-400 hover:bg-red-900/20">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-gray-900 border-gray-700">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-gray-200">
                    Remove from Collection
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-gray-400">
                    Are you sure you want to remove this photocard from your collection? 
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="border-gray-600 text-gray-300 hover:bg-gray-800">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {isDeleting ? 'Removing...' : 'Remove'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      )}

      <Separator className="bg-gray-700" />

      {/* Added Date */}
      <div className="text-center text-xs text-gray-500">
        Added to collection on {userPhotocard.created_at.toLocaleDateString()}
      </div>
    </div>
  );
}