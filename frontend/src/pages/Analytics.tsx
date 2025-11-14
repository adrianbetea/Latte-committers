import Header from '@/components/Header';
import { mockIncidents } from '@/types/incident';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { CalendarIcon, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { format } from 'date-fns';

const Analytics = () => {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(2025, 0, 1),
    to: new Date(),
  });
  
  const newIncidents = mockIncidents.filter(i => i.status === 'new');

  // Mock data for charts
  const violationsOverTime = [
    { date: 'Jan 1', violations: 12 },
    { date: 'Jan 2', violations: 19 },
    { date: 'Jan 3', violations: 15 },
    { date: 'Jan 4', violations: 22 },
    { date: 'Jan 5', violations: 18 },
    { date: 'Jan 6', violations: 25 },
    { date: 'Jan 7', violations: 21 },
  ];

  const hotspotData = [
    { location: 'Bulevardul Revoluției', count: 45, color: '#ef4444' },
    { location: 'Piața Victoriei', count: 38, color: '#f97316' },
    { location: 'Strada Eminescu', count: 32, color: '#f59e0b' },
    { location: 'Bulevardul Liviu Rebreanu', count: 28, color: '#eab308' },
    { location: 'Strada Alba Iulia', count: 24, color: '#84cc16' },
  ];

  const reviewStats = [
    { category: 'Fines Issued', count: 156 },
    { category: 'Incidents Reviewed', count: 189 },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header newIncidentsCount={newIncidents.length} />
      
      <main className="flex-1 container mx-auto px-6 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Reports & Analytics</h1>
          <p className="text-muted-foreground">
            Historical violation data and enforcement statistics
          </p>
        </div>

        {/* Filters */}
        <Card className="p-6 mb-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <Label className="mb-2 block">Date Range</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from && dateRange.to
                      ? `${format(dateRange.from, 'PP')} - ${format(dateRange.to, 'PP')}`
                      : 'Select date range'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateRange.from}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex-1 min-w-[200px]">
              <Label className="mb-2 block">District</Label>
              <Select defaultValue="all">
                <SelectTrigger>
                  <SelectValue placeholder="Select district" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Districts</SelectItem>
                  <SelectItem value="centru">Centru</SelectItem>
                  <SelectItem value="cetate">Cetate</SelectItem>
                  <SelectItem value="fabric">Fabric</SelectItem>
                  <SelectItem value="iosefin">Iosefin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button className="bg-primary text-primary-foreground">
              Apply Filters
            </Button>
          </div>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Violations</p>
                <p className="text-3xl font-bold">189</p>
                <p className="text-sm text-success mt-2 flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" />
                  +12% from last week
                </p>
              </div>
              <div className="p-3 bg-alert/10 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-alert" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Fines Issued</p>
                <p className="text-3xl font-bold">156</p>
                <p className="text-sm text-muted-foreground mt-2">
                  82.5% confirmation rate
                </p>
              </div>
              <div className="p-3 bg-success/10 rounded-lg">
                <CheckCircle className="h-6 w-6 text-success" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Revenue Generated</p>
                <p className="text-3xl font-bold">31,200 RON</p>
                <p className="text-sm text-muted-foreground mt-2">
                  This period
                </p>
              </div>
              <div className="p-3 bg-primary/10 rounded-lg">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
            </div>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Line Chart - Violations Over Time */}
          <Card className="p-6">
            <h3 className="font-bold text-lg mb-4">Violations Over Time</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={violationsOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="violations" 
                  stroke="hsl(var(--alert))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--alert))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Bar Chart - Hotspots */}
          <Card className="p-6">
            <h3 className="font-bold text-lg mb-4">Violation Hotspots</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={hotspotData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                <YAxis 
                  dataKey="location" 
                  type="category" 
                  width={150}
                  stroke="hsl(var(--muted-foreground))"
                  style={{ fontSize: '12px' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                  }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {hotspotData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Bar Chart - Review Stats */}
          <Card className="p-6 lg:col-span-2">
            <h3 className="font-bold text-lg mb-4">Fines Issued vs Incidents Reviewed</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reviewStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="category" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                  }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Analytics;
