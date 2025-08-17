import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Grid3X3 } from 'lucide-react';
import type { Photocard } from '../../../server/src/schema';

interface MarketCatalogProps {
  photocards: Photocard[];
}

export function MarketCatalog({ photocards }: MarketCatalogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [memberFilter, setMemberFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const filteredPhotocards = photocards.filter((card: Photocard) => {
    const matchesSearch = searchTerm === '' || 
      card.album_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.member.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesMember = memberFilter === 'all' || card.member === memberFilter;
    const matchesCategory = categoryFilter === 'all' || card.category === categoryFilter;

    return matchesSearch && matchesMember && matchesCategory;
  });

  const members = ['JURIN', 'CHISA', 'HINATA', 'HARVEY', 'JURIA', 'MAYA', 'COCONA'];
  const categories = ['ALBUMS', 'EVENTS', 'MERCH', 'FANCLUB', 'SEASON_GREETINGS', 'SHOWCASE'];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-200 flex items-center justify-center gap-2">
          <Grid3X3 className="h-5 w-5" />
          Market Catalog
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          Browse all available XG photocards 🌟
        </p>
      </div>

      {/* Search and Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by album or member..."
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            className="pl-10 bg-gray-900 border-gray-700 text-gray-200 placeholder:text-gray-500"
          />
        </div>

        <div className="flex gap-2">
          <div className="flex-1">
            <Select value={memberFilter} onValueChange={setMemberFilter}>
              <SelectTrigger className="bg-gray-900 border-gray-700 text-gray-200">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <SelectValue placeholder="Member" />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="all">All Members</SelectItem>
                {members.map((member: string) => (
                  <SelectItem key={member} value={member}>
                    {member}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="bg-gray-900 border-gray-700 text-gray-200">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <SelectValue placeholder="Category" />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category: string) => (
                  <SelectItem key={category} value={category}>
                    {category.replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-400 text-center">
        {filteredPhotocards.length === 0 ? (
          <span>No photocards found. Check back later! 📥</span>
        ) : (
          <span>
            Showing {filteredPhotocards.length} photocard{filteredPhotocards.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Photocard Grid */}
      {filteredPhotocards.length === 0 ? (
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-8 text-center">
            <div className="text-gray-400">
              <Grid3X3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No photocards yet</p>
              <p className="text-sm mt-1">
                {searchTerm || memberFilter !== 'all' || categoryFilter !== 'all' 
                  ? 'Try adjusting your filters'
                  : 'Market data will be populated from the GitHub repository'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {filteredPhotocards.map((card: Photocard) => (
            <Card 
              key={card.id} 
              className="bg-gray-900 border-gray-800 hover:bg-gray-800 transition-colors cursor-pointer"
            >
              <CardContent className="p-3">
                <div className="aspect-[3/4] bg-gray-800 rounded-md mb-3 flex items-center justify-center">
                  {card.image_url ? (
                    <img
                      src={card.image_url}
                      alt={`${card.member} - ${card.album_name}`}
                      className="w-full h-full object-cover rounded-md"
                    />
                  ) : (
                    <div className="text-gray-500 text-sm text-center">
                      <Grid3X3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      Image
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-gray-200 line-clamp-2">
                      {card.album_name}
                    </h3>
                    <Badge variant="secondary" className="text-xs bg-gray-700 text-gray-300 shrink-0">
                      {card.member}
                    </Badge>
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline" className="text-xs border-gray-600 text-gray-400">
                      {card.category.replace('_', ' ')}
                    </Badge>
                    {card.store && (
                      <Badge variant="outline" className="text-xs border-gray-600 text-gray-400">
                        {card.store}
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-xs text-gray-500">
                    {card.version} • {card.release_type?.replace('_', ' ')}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}