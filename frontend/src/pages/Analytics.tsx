import Header from '@/components/Header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { CalendarIcon, TrendingUp, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';

interface AnalyticsData {
  stats: {
    total_violations: number;
    fines_issued: number;
    revenue: number;
    incidents_reviewed: number;
  };
  violations_over_time: Array<{ date: string; violations: number }>;
  hotspots: Array<{ location: string; count: number }>;
  review_stats: Array<{ category: string; count: number }>;
}

const Analytics = () => {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(2025, 0, 1),
    to: new Date(2025, 11, 31),
  });
  const [district, setDistrict] = useState<string>('all');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [newIncidentsCount, setNewIncidentsCount] = useState<number>(0);

  // Fetch analytics data
  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('startDate', format(dateRange.from, 'yyyy-MM-dd'));
      params.append('endDate', format(dateRange.to, 'yyyy-MM-dd'));
      if (district !== 'all') {
        params.append('district', district);
      }

      const response = await fetch(`http://localhost:3000/api/incidents/analytics?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setAnalyticsData(result.data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [dateRange, district]);

  // Fetch new incidents count
  const fetchNewIncidents = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:3000/api/incidents/status/pending');
      const result = await response.json();
      if (result.success) {
        setNewIncidentsCount(result.data.length);
      }
    } catch (error) {
      console.error('Error fetching new incidents:', error);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
    fetchNewIncidents();
  }, [fetchAnalytics, fetchNewIncidents]);

  const applyFilters = () => {
    fetchAnalytics();
  };

  // Add colors to hotspot data
  const hotspotColors = ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16'];
  const hotspotData = analyticsData?.hotspots.map((item, index) => ({
    ...item,
    color: hotspotColors[index % hotspotColors.length]
  })) || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header newIncidentsCount={newIncidentsCount} />
        <main className="flex-1 container mx-auto px-6 py-6 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header newIncidentsCount={newIncidentsCount} />

      <main className="flex-1 container mx-auto px-6 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Reports & Analytics</h1>
          <p className="text-muted-foreground">
            Overview of past parking incidents and related information
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
              <Select value={district} onValueChange={setDistrict}>
                <SelectTrigger>
                  <SelectValue placeholder="Select district" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <SelectItem value="all">All Districts</SelectItem>
                  <SelectItem value="Aradului">Aradului</SelectItem>
                  <SelectItem value="Blașcovici">Blașcovici</SelectItem>
                  <SelectItem value="Braytim">Braytim</SelectItem>
                  <SelectItem value="Centru">Centru</SelectItem>
                  <SelectItem value="Cetate">Cetate</SelectItem>
                  <SelectItem value="Ciarda Roșie">Ciarda Roșie</SelectItem>
                  <SelectItem value="Circumvalațiunii">Circumvalațiunii</SelectItem>
                  <SelectItem value="Complexul Studențesc">Complexul Studențesc</SelectItem>
                  <SelectItem value="Dâmbovița">Dâmbovița</SelectItem>
                  <SelectItem value="Elisabetin">Elisabetin</SelectItem>
                  <SelectItem value="Fabric">Fabric</SelectItem>
                  <SelectItem value="Fratelia">Fratelia</SelectItem>
                  <SelectItem value="Freidorf">Freidorf</SelectItem>
                  <SelectItem value="Ghiroda Nouă">Ghiroda Nouă</SelectItem>
                  <SelectItem value="Girocului">Girocului</SelectItem>
                  <SelectItem value="Iosefin">Iosefin</SelectItem>
                  <SelectItem value="Kuncz">Kuncz</SelectItem>
                  <SelectItem value="Lipovei">Lipovei</SelectItem>
                  <SelectItem value="Martirilor">Martirilor</SelectItem>
                  <SelectItem value="Mehala">Mehala</SelectItem>
                  <SelectItem value="Modern">Modern</SelectItem>
                  <SelectItem value="Odobescu">Odobescu</SelectItem>
                  <SelectItem value="Plopi">Plopi</SelectItem>
                  <SelectItem value="Ronaț">Ronaț</SelectItem>
                  <SelectItem value="Sever Bocu">Sever Bocu</SelectItem>
                  <SelectItem value="Soarelui">Soarelui</SelectItem>
                  <SelectItem value="Steaua">Steaua</SelectItem>
                  <SelectItem value="Șagului">Șagului</SelectItem>
                  <SelectItem value="Tipografilor">Tipografilor</SelectItem>
                  <SelectItem value="Torontalului">Torontalului</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button className="bg-primary text-primary-foreground" onClick={applyFilters}>
              Apply Filters
            </Button>
          </div>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total incidents</p>
                <p className="text-3xl font-bold">{analyticsData?.stats.total_violations || 0}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  This period
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
                <p className="text-3xl font-bold">{analyticsData?.stats.fines_issued || 0}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {analyticsData?.stats.total_violations ?
                    ((analyticsData.stats.fines_issued / analyticsData.stats.total_violations) * 100).toFixed(1)
                    : 0}% confirmation rate
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
                <p className="text-3xl font-bold">{(analyticsData?.stats.revenue || 0).toLocaleString()} RON</p>
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
            <h3 className="font-bold text-lg mb-4">Incidents Over Time</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData?.violations_over_time || []}>
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
            <h3 className="font-bold text-lg mb-4">Incidents Hotspots</h3>
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
              <BarChart data={analyticsData?.review_stats || []}>
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
