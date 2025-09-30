import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Baby, Plane, Camera, Wallet } from 'lucide-react';

// Sub-components
import JamongSection from './marriage/JamongSection';
import TravelSection from './marriage/TravelSection';
import WeddingSection from './marriage/WeddingSection';
import BudgetSection from './marriage/BudgetSection';

export default function MarriageLife() {
  const [activeSubTab, setActiveSubTab] = useState('jamong');

  return (
    <div className="space-y-6">
      <h2>결혼생활</h2>
      
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="jamong" className="flex items-center gap-2">
            <Baby className="h-4 w-4" />
            자몽이
          </TabsTrigger>
          <TabsTrigger value="travel" className="flex items-center gap-2">
            <Plane className="h-4 w-4" />
            여행
          </TabsTrigger>
          <TabsTrigger value="wedding" className="flex items-center gap-2">
            <Camera className="h-4 w-4" />
            결혼식
          </TabsTrigger>
          <TabsTrigger value="budget" className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            가계부
          </TabsTrigger>
        </TabsList>

        <TabsContent value="jamong">
          <JamongSection />
        </TabsContent>

        <TabsContent value="travel">
          <TravelSection />
        </TabsContent>

        <TabsContent value="wedding">
          <WeddingSection />
        </TabsContent>

        <TabsContent value="budget">
          <BudgetSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}