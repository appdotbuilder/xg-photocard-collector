import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Grid3X3, Heart, Loader2 } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Photocard, UserPhotocardWithDetails } from '../../server/src/schema';

// Import components
import { AddPhotocardForm } from '@/components/AddPhotocardForm';
import { MarketCatalog } from '@/components/MarketCatalog';
import { MyCollection } from '@/components/MyCollection';

function App() {
  const [activeTab, setActiveTab] = useState('add');
  const [isLoading, setIsLoading] = useState(true);
  const [marketPhotocards, setMarketPhotocards] = useState<Photocard[]>([]);
  const [userCollection, setUserCollection] = useState<UserPhotocardWithDetails[]>([]);
  
  // Mock user ID for demo purposes
  const userId = 'demo-user-123';

  const loadMarketPhotocards = useCallback(async () => {
    try {
      const result = await trpc.getPhotocards.query();
      setMarketPhotocards(result);
    } catch (error) {
      console.error('Failed to load market photocards:', error);
    }
  }, []);

  const loadUserCollection = useCallback(async () => {
    try {
      const result = await trpc.getUserCollection.query({ userId });
      setUserCollection(result);
    } catch (error) {
      console.error('Failed to load user collection:', error);
    }
  }, [userId]);

  const loadAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all([loadMarketPhotocards(), loadUserCollection()]);
    } finally {
      setIsLoading(false);
    }
  }, [loadMarketPhotocards, loadUserCollection]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const handlePhotocardAdded = useCallback(() => {
    // Refresh user collection when a new photocard is added
    loadUserCollection();
    // Switch to collection view to see the added card
    setActiveTab('collection');
  }, [loadUserCollection]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          <p className="text-gray-400">Loading XG Photocard Collection...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-black/90 backdrop-blur-sm border-b border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-center bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            ✨ XG Photocard Collection
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 max-w-md">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-900 border border-gray-800">
            <TabsTrigger 
              value="add" 
              className="flex items-center gap-2 data-[state=active]:bg-gray-700 data-[state=active]:text-white text-gray-400"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add</span>
            </TabsTrigger>
            <TabsTrigger 
              value="market" 
              className="flex items-center gap-2 data-[state=active]:bg-gray-700 data-[state=active]:text-white text-gray-400"
            >
              <Grid3X3 className="h-4 w-4" />
              <span className="hidden sm:inline">Market</span>
            </TabsTrigger>
            <TabsTrigger 
              value="collection" 
              className="flex items-center gap-2 data-[state=active]:bg-gray-700 data-[state=active]:text-white text-gray-400"
            >
              <Heart className="h-4 w-4" />
              <span className="hidden sm:inline">Mine</span>
              {userCollection.length > 0 && (
                <span className="ml-1 px-2 py-0.5 text-xs bg-gray-600 text-gray-200 rounded-full">
                  {userCollection.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="add" className="m-0">
              <AddPhotocardForm 
                userId={userId} 
                onPhotocardAdded={handlePhotocardAdded}
              />
            </TabsContent>

            <TabsContent value="market" className="m-0">
              <MarketCatalog photocards={marketPhotocards} />
            </TabsContent>

            <TabsContent value="collection" className="m-0">
              <MyCollection 
                collection={userCollection} 
                onCollectionChange={loadUserCollection}
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}

export default App;