import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '../ui/dialog';
import { Calendar } from '../ui/calendar';
import { Badge } from '../ui/badge';
import { Plus, Calendar as CalendarIcon, TrendingUp, TrendingDown, Wallet, PiggyBank } from 'lucide-react';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ko } from 'date-fns/locale';
import { saveData, getData } from '../../utils/api';

interface Transaction {
  id: string;
  date: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
}

interface Asset {
  id: string;
  name: string;
  type: 'savings' | 'investment' | 'real-estate' | 'other';
  amount: number;
  lastUpdated: string;
}

const expenseCategories = [
  '식비', '교통비', '쇼핑', '의료', '공과금', '통신비', '보험', '여행', '취미', '기타'
];

const incomeCategories = [
  '급여', '부업', '투자수익', '용돈', '기타'
];

const assetTypes = [
  { value: 'savings', label: '예적금' },
  { value: 'investment', label: '투자' },
  { value: 'real-estate', label: '부동산' },
  { value: 'other', label: '기타' }
];

export default function BudgetSection() {
  const [activeTab, setActiveTab] = useState('calendar');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const [isAssetDialogOpen, setIsAssetDialogOpen] = useState(false);
  
  const [newTransaction, setNewTransaction] = useState({
    type: 'expense' as 'income' | 'expense',
    category: '기타',
    amount: 0,
    description: '',
    date: format(new Date(), 'yyyy-MM-dd')
  });

  const [newAsset, setNewAsset] = useState({
    name: '',
    type: 'savings' as 'savings' | 'investment' | 'real-estate' | 'other',
    amount: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [savedTransactions, savedAssets] = await Promise.all([
        getData('budgetTransactions'),
        getData('budgetAssets')
      ]);
      
      if (savedTransactions) {
        setTransactions(savedTransactions);
      }
      if (savedAssets) {
        setAssets(savedAssets);
      }
    } catch (error) {
      console.error('Failed to load budget data:', error);
      // Fallback to localStorage
      const localTransactions = localStorage.getItem('budgetTransactions');
      const localAssets = localStorage.getItem('budgetAssets');
      
      if (localTransactions) {
        setTransactions(JSON.parse(localTransactions));
      }
      if (localAssets) {
        setAssets(JSON.parse(localAssets));
      }
    }
  };

  const saveTransactions = async (updatedTransactions: Transaction[]) => {
    setTransactions(updatedTransactions);
    try {
      await saveData('budgetTransactions', updatedTransactions);
    } catch (error) {
      console.error('Failed to save transactions to server:', error);
      // Fallback to localStorage
      localStorage.setItem('budgetTransactions', JSON.stringify(updatedTransactions));
    }
  };

  const saveAssets = async (updatedAssets: Asset[]) => {
    setAssets(updatedAssets);
    try {
      await saveData('budgetAssets', updatedAssets);
    } catch (error) {
      console.error('Failed to save assets to server:', error);
      // Fallback to localStorage
      localStorage.setItem('budgetAssets', JSON.stringify(updatedAssets));
    }
  };

  const handleTransactionSubmit = async () => {
    if (!newTransaction.category || newTransaction.amount <= 0) return;

    const transaction: Transaction = {
      id: Date.now().toString(),
      ...newTransaction
    };

    const updatedTransactions = [transaction, ...transactions];
    await saveTransactions(updatedTransactions);
    
    setNewTransaction({
      type: 'expense',
      category: '기타',
      amount: 0,
      description: '',
      date: format(new Date(), 'yyyy-MM-dd')
    });
    setIsTransactionDialogOpen(false);
  };

  const handleAssetSubmit = async () => {
    if (!newAsset.name.trim() || newAsset.amount < 0) return;

    const asset: Asset = {
      id: Date.now().toString(),
      ...newAsset,
      lastUpdated: new Date().toLocaleDateString('ko-KR')
    };

    const updatedAssets = [asset, ...assets];
    await saveAssets(updatedAssets);
    
    setNewAsset({
      name: '',
      type: 'savings',
      amount: 0
    });
    setIsAssetDialogOpen(false);
  };

  const getMonthlyTransactions = (date: Date) => {
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    
    return transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return isWithinInterval(transactionDate, { start, end });
    });
  };

  const getDayTransactions = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return transactions.filter(transaction => transaction.date === dateStr);
  };

  const calculateMonthlyTotals = (date: Date) => {
    const monthlyTransactions = getMonthlyTransactions(date);
    const income = monthlyTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    return { income, expense, balance: income - expense };
  };

  const totalAssets = assets.reduce((sum, asset) => sum + asset.amount, 0);
  const currentMonthTotals = calculateMonthlyTotals(selectedDate || new Date());

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3>가계부</h3>
          <p className="text-muted-foreground">우리 가정의 소중한 자산 관리</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            캘린더
          </TabsTrigger>
          <TabsTrigger value="summary" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            월 요약
          </TabsTrigger>
          <TabsTrigger value="assets" className="flex items-center gap-2">
            <PiggyBank className="h-4 w-4" />
            자산
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-4">
          <div className="flex justify-between items-center">
            <h4>가계부 캘린더</h4>
            <Dialog open={isTransactionDialogOpen} onOpenChange={setIsTransactionDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  거래 추가
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[98vw] max-h-[98vh] overflow-y-auto w-[98vw] h-[98vh]">
                <DialogHeader>
                  <DialogTitle>새 거래 추가</DialogTitle>
                  <DialogDescription>
                    수입 또는 지출 내역을 추가해주세요.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Button
                      variant={newTransaction.type === 'expense' ? 'default' : 'outline'}
                      onClick={() => setNewTransaction(prev => ({ ...prev, type: 'expense', category: '기타' }))}
                      size="sm"
                    >
                      <TrendingDown className="h-4 w-4 mr-1" />
                      지출
                    </Button>
                    <Button
                      variant={newTransaction.type === 'income' ? 'default' : 'outline'}
                      onClick={() => setNewTransaction(prev => ({ ...prev, type: 'income', category: '기타' }))}
                      size="sm"
                    >
                      <TrendingUp className="h-4 w-4 mr-1" />
                      수입
                    </Button>
                  </div>

                  <Select 
                    value={newTransaction.category || '기타'} 
                    onValueChange={(value) => setNewTransaction(prev => ({ ...prev, category: value }))}
                    defaultValue="기타"
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="카테고리 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {(newTransaction.type === 'expense' ? expenseCategories : incomeCategories).map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    type="number"
                    placeholder="금액"
                    value={newTransaction.amount}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, amount: Number(e.target.value) }))}
                  />

                  <Input
                    type="date"
                    value={newTransaction.date}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, date: e.target.value }))}
                  />

                  <Textarea
                    placeholder="설명 (선택사항)"
                    value={newTransaction.description}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, description: e.target.value }))}
                    rows={2}
                  />

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsTransactionDialogOpen(false)}>
                      취소
                    </Button>
                    <Button onClick={handleTransactionSubmit} disabled={!newTransaction.category || newTransaction.amount <= 0}>
                      저장
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            <Card className="xl:col-span-3">
              <CardHeader>
                <CardTitle>가계부 캘린더</CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  locale={ko}
                  className="rounded-md border w-full"
                  classNames={{
                    months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                    month: "space-y-4 w-full",
                    caption: "flex justify-center pt-1 relative items-center text-lg font-medium",
                    caption_label: "text-lg font-medium",
                    nav: "space-x-1 flex items-center",
                    nav_button: "h-10 w-10 bg-transparent p-0 opacity-50 hover:opacity-100",
                    nav_button_previous: "absolute left-1",
                    nav_button_next: "absolute right-1",
                    table: "w-full border-collapse space-y-1",
                    head_row: "flex w-full",
                    head_cell: "text-muted-foreground rounded-md w-full font-normal text-base h-12 flex items-center justify-center",
                    row: "flex w-full mt-2",
                    cell: "relative p-0 text-center text-base flex-1 h-16 border border-border/20",
                    day: "h-16 w-full p-1 font-normal hover:bg-accent hover:text-accent-foreground flex items-center justify-center rounded-md text-base",
                    day_selected: "bg-primary text-primary-foreground",
                    day_today: "bg-accent text-accent-foreground font-medium",
                    day_outside: "text-muted-foreground opacity-50",
                    day_disabled: "text-muted-foreground opacity-50",
                    day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                    day_hidden: "invisible",
                  }}
                  components={{
                    DayContent: React.memo(({ date }) => {
                      const dayTransactions = getDayTransactions(date);
                      const dayTotal = dayTransactions.reduce((sum, t) => 
                        sum + (t.type === 'income' ? t.amount : -t.amount), 0
                      );
                      
                      return (
                        <div className="w-full h-full flex flex-col items-center justify-center p-1">
                          <span className="text-base font-medium">{date.getDate()}</span>
                          {dayTransactions.length > 0 && (
                            <div className="flex flex-col items-center mt-1 space-y-1">
                              <div className={`w-3 h-3 rounded-full ${dayTotal > 0 ? 'bg-green-500' : dayTotal < 0 ? 'bg-red-500' : 'bg-gray-500'}`}></div>
                              <span className={`text-xs font-medium ${dayTotal > 0 ? 'text-green-600' : dayTotal < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                                {Math.abs(dayTotal) > 999 ? `${Math.floor(Math.abs(dayTotal)/1000)}k` : Math.abs(dayTotal)}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })
                  }}
                />
              </CardContent>
            </Card>

            <Card className="xl:col-span-1">
              <CardHeader>
                <CardTitle>
                  {selectedDate ? format(selectedDate, 'yyyy년 M월 d일', { locale: ko }) : '오늘'} 거래 내역
                </CardTitle>
              </CardHeader>
              <CardContent className="max-h-96 overflow-y-auto">
                {selectedDate ? (
                  <div className="space-y-2">
                    {getDayTransactions(selectedDate).length === 0 ? (
                      <p className="text-muted-foreground text-sm">거래 내역이 없습니다.</p>
                    ) : (
                      getDayTransactions(selectedDate).map(transaction => (
                        <div key={transaction.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant={transaction.type === 'income' ? 'default' : 'destructive'}>
                                {transaction.category}
                              </Badge>
                            </div>
                            {transaction.description && (
                              <p className="text-sm text-muted-foreground truncate">{transaction.description}</p>
                            )}
                          </div>
                          <div className={`ml-2 font-medium ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                            {transaction.type === 'income' ? '+' : '-'}{transaction.amount.toLocaleString()}원
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">날짜를 선택해주세요.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="summary" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle>이번 달 수입</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-green-600">{currentMonthTotals.income.toLocaleString()}원</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle>이번 달 지출</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-red-600">{currentMonthTotals.expense.toLocaleString()}원</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle>이번 달 수지</CardTitle>
                <Wallet className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className={currentMonthTotals.balance >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {currentMonthTotals.balance.toLocaleString()}원
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>최근 거래 내역</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {transactions.slice(0, 10).map(transaction => (
                  <div key={transaction.id} className="flex justify-between items-center p-2 border rounded">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant={transaction.type === 'income' ? 'default' : 'destructive'}>
                          {transaction.category}
                        </Badge>
                        <span className="text-sm text-muted-foreground">{transaction.date}</span>
                      </div>
                      {transaction.description && (
                        <p className="text-xs text-muted-foreground mt-1">{transaction.description}</p>
                      )}
                    </div>
                    <div className={`${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.type === 'income' ? '+' : '-'}{transaction.amount.toLocaleString()}원
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assets" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h4>자산 관리</h4>
              <p className="text-sm text-muted-foreground">총 자산: {totalAssets.toLocaleString()}원</p>
            </div>
            <Dialog open={isAssetDialogOpen} onOpenChange={setIsAssetDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  자산 추가
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[98vw] max-h-[98vh] overflow-y-auto w-[98vw] h-[98vh]">
                <DialogHeader>
                  <DialogTitle>새 자산 추가</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="자산명"
                    value={newAsset.name}
                    onChange={(e) => setNewAsset(prev => ({ ...prev, name: e.target.value }))}
                  />

                  <Select value={newAsset.type} onValueChange={(value: any) => setNewAsset(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="자산 유형 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {assetTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    type="number"
                    placeholder="금액"
                    value={newAsset.amount}
                    onChange={(e) => setNewAsset(prev => ({ ...prev, amount: Number(e.target.value) }))}
                  />

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsAssetDialogOpen(false)}>
                      취소
                    </Button>
                    <Button onClick={handleAssetSubmit} disabled={!newAsset.name.trim() || newAsset.amount < 0}>
                      저장
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {assets.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <PiggyBank className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">등록된 자산이 없습니다</p>
                  <p className="text-sm text-muted-foreground">첫 번째 자산을 등록해보세요!</p>
                </CardContent>
              </Card>
            ) : (
              assets.map(asset => (
                <Card key={asset.id}>
                  <CardContent className="flex justify-between items-center p-4">
                    <div>
                      <h5>{asset.name}</h5>
                      <p className="text-sm text-muted-foreground">
                        {assetTypes.find(t => t.value === asset.type)?.label} • 마지막 업데이트: {asset.lastUpdated}
                      </p>
                    </div>
                    <div>
                      <span>{asset.amount.toLocaleString()}원</span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}