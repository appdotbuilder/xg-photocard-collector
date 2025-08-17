import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Loader2, Camera, Sparkles } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { AddToCollectionInput } from '../../../server/src/schema';

interface AddPhotocardFormProps {
  userId: string;
  onPhotocardAdded: () => void;
}

export function AddPhotocardForm({ userId, onPhotocardAdded }: AddPhotocardFormProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [formData, setFormData] = useState<AddToCollectionInput>({
    user_id: userId,
    photocard_id: 0, // Will be set after creating the master photocard
    user_image_url: '',
    condition: 'MINT',
    acquired_date: new Date(),
    notes: ''
  });
  
  // Parsed details from filename
  const [parsedDetails, setParsedDetails] = useState({
    category: '',
    release_type: '',
    release_structure: '',
    album_name: '',
    store: '',
    version: '',
    member: ''
  });

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create preview
    const reader = new FileReader();
    reader.onload = (event: ProgressEvent<FileReader>) => {
      if (event.target?.result) {
        setImagePreview(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);

    setImageFile(file);
    
    // Parse filename for auto-fill
    if (file.name) {
      setIsParsing(true);
      try {
        const parsed = await trpc.parseFilename.mutate({ filename: file.name });
        setParsedDetails({
          category: parsed.category || '',
          release_type: parsed.release_type || '',
          release_structure: parsed.release_structure || '',
          album_name: parsed.album_name || '',
          store: parsed.store || '',
          version: parsed.version || '',
          member: parsed.member || ''
        });
      } catch (error) {
        console.error('Failed to parse filename:', error);
      } finally {
        setIsParsing(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile) return;

    setIsUploading(true);
    try {
      // In a real app, you would upload the image to a cloud storage service
      // For demo purposes, we'll use a placeholder URL
      const mockImageUrl = URL.createObjectURL(imageFile);
      
      // First create the master photocard entry
      const masterPhotocard = await trpc.createPhotocard.mutate({
        filename: imageFile.name,
        image_url: mockImageUrl,
        category: parsedDetails.category as any,
        release_type: parsedDetails.release_type as any,
        release_structure: parsedDetails.release_structure as any,
        album_name: parsedDetails.album_name,
        store: parsedDetails.store || null,
        version: parsedDetails.version as any,
        member: parsedDetails.member as any
      });

      // Then add to user collection
      await trpc.addToCollection.mutate({
        ...formData,
        photocard_id: masterPhotocard.id,
        user_image_url: mockImageUrl
      });

      // Reset form
      setImageFile(null);
      setImagePreview('');
      setFormData({
        user_id: userId,
        photocard_id: 0,
        user_image_url: '',
        condition: 'MINT',
        acquired_date: new Date(),
        notes: ''
      });
      setParsedDetails({
        category: '',
        release_type: '',
        release_structure: '',
        album_name: '',
        store: '',
        version: '',
        member: ''
      });

      onPhotocardAdded();
    } catch (error) {
      console.error('Failed to add photocard:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-200 flex items-center justify-center gap-2">
          <Camera className="h-5 w-5" />
          Add New Photocard
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          Upload your XG photocard and we'll auto-detect the details ✨
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Image Upload */}
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <div className="space-y-4">
              <Label htmlFor="image" className="text-gray-200">
                Photocard Image
              </Label>
              
              {!imagePreview ? (
                <div className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center hover:border-gray-600 transition-colors">
                  <input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <label 
                    htmlFor="image" 
                    className="cursor-pointer flex flex-col items-center gap-3"
                  >
                    <Upload className="h-10 w-10 text-gray-400" />
                    <div className="text-gray-300">
                      <span className="font-medium">Click to upload</span>
                      <p className="text-sm text-gray-400 mt-1">
                        PNG, JPG up to 10MB
                      </p>
                    </div>
                  </label>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full max-w-sm mx-auto rounded-lg border border-gray-700"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setImagePreview('');
                        setImageFile(null);
                        setParsedDetails({
                          category: '',
                          release_type: '',
                          release_structure: '',
                          album_name: '',
                          store: '',
                          version: '',
                          member: ''
                        });
                      }}
                      className="absolute top-2 right-2 bg-black/80 hover:bg-black border-gray-600"
                    >
                      Change
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Auto-parsed Details */}
        {isParsing ? (
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-center gap-3 text-gray-400">
                <Sparkles className="h-5 w-5 animate-pulse" />
                <span>Parsing filename...</span>
              </div>
            </CardContent>
          </Card>
        ) : parsedDetails.album_name ? (
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-gray-200 flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Auto-detected Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-gray-400">Member</Label>
                  <p className="text-gray-200 font-medium">{parsedDetails.member}</p>
                </div>
                <div>
                  <Label className="text-gray-400">Category</Label>
                  <p className="text-gray-200 font-medium">{parsedDetails.category}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-gray-400">Album</Label>
                  <p className="text-gray-200 font-medium">{parsedDetails.album_name}</p>
                </div>
                {parsedDetails.store && (
                  <div>
                    <Label className="text-gray-400">Store</Label>
                    <p className="text-gray-200 font-medium">{parsedDetails.store}</p>
                  </div>
                )}
                <div>
                  <Label className="text-gray-400">Version</Label>
                  <p className="text-gray-200 font-medium">{parsedDetails.version}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Collection Details */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-gray-200">Collection Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="condition" className="text-gray-200">
                Condition
              </Label>
              <Select 
                value={formData.condition} 
                onValueChange={(value: 'MINT' | 'NEAR_MINT' | 'GOOD' | 'FAIR' | 'POOR') => 
                  setFormData((prev: AddToCollectionInput) => ({ ...prev, condition: value }))
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
              <Label htmlFor="acquired_date" className="text-gray-200">
                Acquired Date
              </Label>
              <Input
                id="acquired_date"
                type="date"
                value={formData.acquired_date ? formData.acquired_date.toISOString().split('T')[0] : ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: AddToCollectionInput) => ({ 
                    ...prev, 
                    acquired_date: e.target.value ? new Date(e.target.value) : null 
                  }))
                }
                className="bg-gray-800 border-gray-700 text-gray-200"
              />
            </div>

            <div>
              <Label htmlFor="notes" className="text-gray-200">
                Notes (Optional)
              </Label>
              <Textarea
                id="notes"
                placeholder="Any special notes about this card..."
                value={formData.notes || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData((prev: AddToCollectionInput) => ({ 
                    ...prev, 
                    notes: e.target.value || null 
                  }))
                }
                className="bg-gray-800 border-gray-700 text-gray-200 resize-none"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Button
          type="submit"
          disabled={!imageFile || isUploading}
          className="w-full bg-white text-black hover:bg-gray-200 font-medium"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Adding to Collection...
            </>
          ) : (
            <>
              <Camera className="h-4 w-4 mr-2" />
              Add to Collection
            </>
          )}
        </Button>
      </form>
    </div>
  );
}