import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { BarChart3, ArrowLeft, TruckIcon, MapPin, AlertTriangle, TrendingDown, MessageCircle, CalendarIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie, LineChart, Line } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { format, subDays } from 'date-fns';
import { MetricCard } from "@/components/dashboard/MetricCard";
import { LoadingAgentChat } from "@/components/LoadingAgentChat";
import { cn } from "@/lib/utils";

export default function Analytics() {
  const navigate = useNavigate();
  const [selectedVagao, setSelectedVagao] = useState("vagao-1");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());

  const handleBackToDashboard = () => {
    navigate("/dashboard");
  };

  // Dados mock para diferentes análises
  const generateMockIngredientConsumption = () => [
    { ingrediente: 'Milho', consumo: 420 },
    { ingrediente: 'Soja', consumo: 180 },
    { ingrediente: 'Farelo Trigo', consumo: 150 },
    { ingrediente: 'Vitaminas', consumo: 80 },
    { ingrediente: 'Minerais', consumo: 60 }
  ];

  const generateMockConsumptionShare = () => [
    { name: 'Milho', value: 47, fill: '#0088FE' },
    { name: 'Soja', value: 20, fill: '#00C49F' },
    { name: 'Farelo Trigo', value: 17, fill: '#FFBB28' },
    { name: 'Vitaminas', value: 9, fill: '#FF8042' },
    { name: 'Minerais', value: 7, fill: '#8884d8' }
  ];

  const generateMockPlannedVsActual = () => [
    { ingrediente: 'Milho', previsto: 400, realizado: 420 },
    { ingrediente: 'Soja', previsto: 200, realizado: 180 },
    { ingrediente: 'Farelo Trigo', previsto: 160, realizado: 150 },
    { ingrediente: 'Vitaminas', previsto: 75, realizado: 80 },
    { ingrediente: 'Minerais', previsto: 65, realizado: 60 }
  ];

  const generateMockEfficiencyByLoad = () => [
    { carregamento: 'Carga 1', eficiencia: 95.2 },
    { carregamento: 'Carga 2', eficiencia: 88.7 },
    { carregamento: 'Carga 3', eficiencia: 102.3 },
    { carregamento: 'Carga 4', eficiencia: 91.8 },
    { carregamento: 'Carga 5', eficiencia: 97.1 }
  ];

  const generateMockDeviationByLoadAndWagon = () => [
    { item: 'Carga 1 - V1', desvio: 2.3 },
    { item: 'Carga 1 - V2', desvio: -1.8 },
    { item: 'Carga 2 - V1', desvio: 4.2 },
    { item: 'Carga 2 - V2', desvio: 1.5 },
    { item: 'Carga 3 - V1', desvio: -2.1 }
  ];

  const generateMockEfficiencyDistribution = () => [
    { faixa: '80-85%', quantidade: 5 },
    { faixa: '85-90%', quantidade: 12 },
    { faixa: '90-95%', quantidade: 18 },
    { faixa: '95-100%', quantidade: 22 },
    { faixa: '100-105%', quantidade: 15 },
    { faixa: '105-110%', quantidade: 8 }
  ];

  const generateMockIngredientsByVolume = () => [
    { ingrediente: 'Milho Grão', volume: 1250 },
    { ingrediente: 'Farelo Soja', volume: 890 },
    { ingrediente: 'Farelo Trigo', volume: 670 },
    { ingrediente: 'Núcleo Vitamínico', volume: 340 },
    { ingrediente: 'Calcário', volume: 180 }
  ];

  const generateMockVolumeByDiet = () => [
    { dieta: 'Engorda', volume: 2800 },
    { dieta: 'Crescimento', volume: 1950 },
    { dieta: 'Lactação', volume: 1450 },
    { dieta: 'Gestação', volume: 890 }
  ];

  const generateMockAvgDeviationByIngredient = () => [
    { ingrediente: 'Milho', desvio: 2.1 },
    { ingrediente: 'Soja', desvio: -1.8 },
    { ingrediente: 'Farelo Trigo', desvio: 3.2 },
    { ingrediente: 'Vitaminas', desvio: 0.8 },
    { ingrediente: 'Minerais', desvio: -2.5 }
  ];

  const generateMockVolumeByWagon = () => [
    { name: 'Vagão 1', value: 35, fill: '#0088FE' },
    { name: 'Vagão 2', value: 28, fill: '#00C49F' },
    { name: 'Vagão 3', value: 22, fill: '#FFBB28' },
    { name: 'Vagão 4', value: 15, fill: '#FF8042' }
  ];

  const generateMockEfficiencyOverTime = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    return hours.map(hour => ({
      hora: `${hour.toString().padStart(2, '0')}:00`,
      eficiencia: 85 + Math.random() * 20
    }));
  };

  const generateMockVolumePerHour = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    return hours.map(hour => ({
      hora: `${hour.toString().padStart(2, '0')}:00`,
      volume: Math.round(50 + Math.random() * 100)
    }));
  };

  // Dados mock para distribuição (mantendo compatibilidade)
  const generateMockData = () => {
    const data = [];
    for (let i = 13; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const consumoPrevisto = Math.round(450 + Math.random() * 100);
      const consumoRealizado = Math.round(consumoPrevisto * (0.7 + Math.random() * 0.5));
      
      const eficiencia = (consumoRealizado / consumoPrevisto) * 100;
      let corRealizado = '#ef4444';
      
      if (eficiencia >= 90 && eficiencia <= 110) {
        corRealizado = '#22c55e';
      } else if (eficiencia >= 80 && eficiencia < 90 || eficiencia > 110 && eficiencia <= 120) {
        corRealizado = '#eab308';
      }

      data.push({
        data: format(date, 'dd/MM'),
        consumoPrevisto,
        consumoRealizado,
        corRealizado
      });
    }
    return data;
  };

  const data = generateMockData();
  const ingredientConsumption = generateMockIngredientConsumption();
  const consumptionShare = generateMockConsumptionShare();
  const plannedVsActual = generateMockPlannedVsActual();
  const efficiencyByLoad = generateMockEfficiencyByLoad();
  const deviationByLoadAndWagon = generateMockDeviationByLoadAndWagon();
  const efficiencyDistribution = generateMockEfficiencyDistribution();
  const ingredientsByVolume = generateMockIngredientsByVolume();
  const volumeByDiet = generateMockVolumeByDiet();
  const avgDeviationByIngredient = generateMockAvgDeviationByIngredient();
  const volumeByWagon = generateMockVolumeByWagon();
  const efficiencyOverTime = generateMockEfficiencyOverTime();
  const volumePerHour = generateMockVolumePerHour();

  const CustomBar = (props: any) => {
    const { payload, ...rest } = props;
    return <Bar {...rest} fill={payload?.corRealizado || '#ef4444'} />;
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumbs and Back Button */}
        <div className="flex items-center justify-between mb-6">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Análise de Desvios</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          
          <Button 
            onClick={handleBackToDashboard}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Dashboard
          </Button>
        </div>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">Análise de Desvios</h1>
          <p className="text-text-secondary">Monitore desvios operacionais no carregamento e distribuição de ração</p>
        </div>

        {/* Content Grid - Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Desvios Totais"
            value="12"
            subtitle="↗ +3 vs ontem"
            trend="up"
            icon={<AlertTriangle className="h-6 w-6" />}
          />
          <MetricCard
            title="Desvio Médio"
            value="2.4 kg"
            subtitle="↘ -0.8 kg vs semana"
            trend="down"
            icon={<TrendingDown className="h-6 w-6" />}
          />
          <MetricCard
            title="Carregamentos"
            value="18"
            subtitle="↗ +2 vs ontem"
            trend="up"
            icon={<TruckIcon className="h-6 w-6" />}
          />
          <MetricCard
            title="Distribuições"
            value="24"
            subtitle="→ Estável"
            trend="stable"
            icon={<MapPin className="h-6 w-6" />}
          />
        </div>

        {/* Tabs for Different Analysis Types */}
        <Tabs defaultValue="carregamento" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="carregamento" className="flex items-center gap-2">
              <TruckIcon className="h-4 w-4" />
              Desvios em Carregamento
            </TabsTrigger>
            <TabsTrigger value="distribuicao" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Desvios em Distribuição
            </TabsTrigger>
          </TabsList>

          <TabsContent value="carregamento">
            {/* Date Range Selector */}
            <div className="flex items-center gap-4 mb-8 p-4 bg-card-secondary/30 rounded-lg border border-border-subtle">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-text-primary">Período de análise:</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[140px] justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "dd/MM/yyyy") : <span>Data inicial</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                
                <span className="text-text-secondary">até</span>
                
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[140px] justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "dd/MM/yyyy") : <span>Data final</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                
                <Button variant="secondary" size="sm" className="ml-2">
                  Aplicar Filtro
                </Button>
              </div>
            </div>
            
            {/* Chat Button - Fixed position for this section */}
            <div className="fixed bottom-6 right-6 z-50">
              <Button
                className="w-14 h-14 rounded-full bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center"
                onClick={() => setIsChatOpen(true)}
              >
                <MessageCircle className="h-6 w-6" />
              </Button>
            </div>
            
            {/* Análises Quantitativas */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-text-primary mb-6">Análises Quantitativas</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Consumo por Ingrediente (Realizado) - Barras Horizontais */}
                <Card className="border-border-subtle bg-card-secondary/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">Consumo por Ingrediente (Realizado)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          layout="horizontal"
                          data={ingredientConsumption}
                          margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis type="number" stroke="white" fontSize={12} />
                          <YAxis type="category" dataKey="ingrediente" stroke="white" fontSize={12} />
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px',
                              color: 'hsl(var(--text-primary))'
                            }}
                            formatter={(value) => [`${value} kg`, 'Consumo']}
                          />
                          <Bar dataKey="consumo" fill="#0088FE" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Participação % no Consumo Total - Pizza */}
                <Card className="border-border-subtle bg-card-secondary/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">Participação % no Consumo Total</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={consumptionShare}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          />
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px',
                              color: 'hsl(var(--text-primary))'
                            }}
                            formatter={(value) => [`${value}%`, 'Participação']}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Previsto x Realizado por Ingrediente */}
                <Card className="border-border-subtle bg-card-secondary/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">Previsto x Realizado por Ingrediente</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={plannedVsActual} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="ingrediente" stroke="white" fontSize={12} />
                          <YAxis stroke="white" fontSize={12} />
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px',
                              color: 'hsl(var(--text-primary))'
                            }}
                            formatter={(value, name) => [`${value} kg`, name === 'previsto' ? 'Previsto' : 'Realizado']}
                          />
                          <Legend />
                          <Bar dataKey="previsto" fill="#3b82f6" name="Previsto" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="realizado" fill="#10b981" name="Realizado" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Eficiência Agregada por Carregamento */}
                <Card className="border-border-subtle bg-card-secondary/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between">
                      Eficiência Agregada por Carregamento
                      <Select value={selectedVagao} onValueChange={setSelectedVagao}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="vagao-1">Vagão 1</SelectItem>
                          <SelectItem value="vagao-2">Vagão 2</SelectItem>
                          <SelectItem value="vagao-3">Vagão 3</SelectItem>
                          <SelectItem value="vagao-4">Vagão 4</SelectItem>
                        </SelectContent>
                      </Select>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={efficiencyByLoad} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="carregamento" stroke="white" fontSize={12} />
                          <YAxis stroke="white" fontSize={12} />
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px',
                              color: 'hsl(var(--text-primary))'
                            }}
                            formatter={(value) => [`${value}%`, 'Eficiência']}
                          />
                          <Bar dataKey="eficiencia" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Desvio Agregado por Carregamento e Vagão */}
              <Card className="border-border-subtle bg-card-secondary/50 backdrop-blur-sm mb-8">
                <CardHeader>
                  <CardTitle className="text-lg">Desvio Agregado por Carregamento e Vagão</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={deviationByLoadAndWagon} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="item" stroke="white" fontSize={12} />
                        <YAxis stroke="white" fontSize={12} />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            color: 'hsl(var(--text-primary))'
                          }}
                          formatter={(value) => [`${value} kg`, 'Desvio']}
                        />
                        <Bar dataKey="desvio" radius={[4, 4, 0, 0]}>
                          {deviationByLoadAndWagon.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.desvio >= 0 ? '#ef4444' : '#10b981'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Análises Qualitativas */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-text-primary mb-6">Análises Qualitativas</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Distribuição de Eficiência - Barras Verticais */}
                <Card className="border-border-subtle bg-card-secondary/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">Distribuição de Eficiência</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={efficiencyDistribution} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="faixa" stroke="white" fontSize={12} />
                          <YAxis stroke="white" fontSize={12} />
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px',
                              color: 'hsl(var(--text-primary))'
                            }}
                            formatter={(value) => [`${value}`, 'Quantidade']}
                          />
                          <Bar dataKey="quantidade" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Ingredientes Agrupados por Volume - Barras Horizontais */}
                <Card className="border-border-subtle bg-card-secondary/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">Ingredientes Agrupados por Volume</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          layout="horizontal"
                          data={ingredientsByVolume}
                          margin={{ top: 20, right: 30, left: 60, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis type="number" stroke="white" fontSize={12} />
                          <YAxis type="category" dataKey="ingrediente" stroke="white" fontSize={12} />
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px',
                              color: 'hsl(var(--text-primary))'
                            }}
                            formatter={(value) => [`${value} kg`, 'Volume']}
                          />
                          <Bar dataKey="volume" fill="#06b6d4" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Volume por Dieta - Barras Verticais */}
                <Card className="border-border-subtle bg-card-secondary/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">Volume por Dieta</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={volumeByDiet} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="dieta" stroke="white" fontSize={12} />
                          <YAxis stroke="white" fontSize={12} />
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px',
                              color: 'hsl(var(--text-primary))'
                            }}
                            formatter={(value) => [`${value} kg`, 'Volume']}
                          />
                          <Bar dataKey="volume" fill="#84cc16" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Desvio Médio por Ingrediente - Barras Verticais */}
                <Card className="border-border-subtle bg-card-secondary/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">Desvio Médio por Ingrediente</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={avgDeviationByIngredient} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="ingrediente" stroke="white" fontSize={12} />
                          <YAxis stroke="white" fontSize={12} />
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px',
                              color: 'hsl(var(--text-primary))'
                            }}
                            formatter={(value) => [`${value} kg`, 'Desvio Médio']}
                          />
                          <Bar dataKey="desvio" radius={[4, 4, 0, 0]}>
                            {avgDeviationByIngredient.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.desvio >= 0 ? '#ef4444' : '#10b981'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Volume por Vagão - Pizza */}
              <Card className="border-border-subtle bg-card-secondary/50 backdrop-blur-sm mt-6">
                <CardHeader>
                  <CardTitle className="text-lg">Volume por Vagão</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={volumeByWagon}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            color: 'hsl(var(--text-primary))'
                          }}
                          formatter={(value) => [`${value}%`, 'Volume']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Análise Temporal */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-text-primary mb-6">Análise Temporal</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Eficiência ao Longo do Dia */}
                <Card className="border-border-subtle bg-card-secondary/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">Eficiência ao Longo do Dia</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={efficiencyOverTime} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="hora" stroke="white" fontSize={12} />
                          <YAxis stroke="white" fontSize={12} />
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px',
                              color: 'hsl(var(--text-primary))'
                            }}
                            formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Eficiência']}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="eficiencia" 
                            stroke="#f97316" 
                            strokeWidth={2}
                            dot={{ fill: '#f97316', strokeWidth: 2, r: 4 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Volume Total Carregado por Hora */}
                <Card className="border-border-subtle bg-card-secondary/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">Volume Total Carregado por Hora</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={volumePerHour} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="hora" stroke="white" fontSize={12} />
                          <YAxis stroke="white" fontSize={12} />
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px',
                              color: 'hsl(var(--text-primary))'
                            }}
                            formatter={(value) => [`${value} kg`, 'Volume']}
                          />
                          <Bar dataKey="volume" fill="#ec4899" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="distribuicao">
            <Card className="border-border-subtle bg-card-secondary/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Análise de Desvios em Distribuição - Últimos 14 Dias
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="data"
                        stroke="white"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis 
                        stroke="white"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        label={{ value: 'Peso Distribuído (kg)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: 'white' } }}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          color: 'hsl(var(--text-primary))'
                        }}
                        formatter={(value: number, name: string) => [
                          `${value} kg`,
                          name === 'consumoPrevisto' ? 'Programado' : 'Distribuído'
                        ]}
                      />
                      <Legend 
                        wrapperStyle={{ color: 'hsl(var(--text-secondary))' }}
                        formatter={(value: string) => value === 'consumoPrevisto' ? 'Programado' : 'Distribuído'}
                      />
                      <Bar 
                        dataKey="consumoPrevisto" 
                        fill="#3b82f6"
                        name="Programado"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar 
                        dataKey="consumoRealizado" 
                        name="Distribuído"
                        radius={[4, 4, 0, 0]}
                      >
                        {data.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.corRealizado} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Legenda de cores */}
                <div className="mt-4 flex items-center justify-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                    <span className="text-text-secondary">Desvio Baixo (90-110%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                    <span className="text-text-secondary">Desvio Médio (80-90% | 110-120%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded"></div>
                    <span className="text-text-secondary">Desvio Alto (&lt;80% | &gt;120%)</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Loading Agent Chat */}
      <LoadingAgentChat 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
      />
    </Layout>
  );
}