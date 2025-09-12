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

  // Dados mock para análise de distribuição
  const generateMockEfficiencyDistributionHist = () => [
    { eficiencia: '75-80', frequencia: 3 },
    { eficiencia: '80-85', frequencia: 8 },
    { eficiencia: '85-90', frequencia: 15 },
    { eficiencia: '90-95', frequencia: 25 },
    { eficiencia: '95-100', frequencia: 35 },
    { eficiencia: '100-105', frequencia: 30 },
    { eficiencia: '105-110', frequencia: 20 },
    { eficiencia: '110-115', frequencia: 12 },
    { eficiencia: '115-120', frequencia: 5 }
  ];

  const generateMockEfficiencyByHandler = () => [
    { tratador: 'Luiz Lopez', q1: 92, median: 96, q3: 102, min: 85, max: 115, outliers: [118, 122] },
    { tratador: 'Agustin Lopez', q1: 88, median: 94, q3: 99, min: 82, max: 108, outliers: [112] }
  ];

  const generateMockEfficiencyByDietType = () => [
    { dieta: 'CRECIMIENTO', q1: 90, median: 95, q3: 101, min: 83, max: 112, outliers: [115, 118] },
    { dieta: 'TERMINACION', q1: 88, median: 93, q3: 98, min: 80, max: 110, outliers: [113] },
    { dieta: 'RECRIA FEMEA', q1: 85, median: 90, q3: 96, min: 78, max: 105, outliers: [] }
  ];

  const generateMockRealizadoVsPrevisto = () => {
    const data = [];
    for (let i = 0; i < 50; i++) {
      const previsto = 400 + Math.random() * 200;
      const realizado = previsto * (0.8 + Math.random() * 0.4);
      data.push({ previsto, realizado });
    }
    return data;
  };

  const generateMockDesvioAbsolutoByTrato = () => [
    { trato: 'Trato 1', desvio: 3.2 },
    { trato: 'Trato 2', desvio: 2.1 },
    { trato: 'Trato 3', desvio: 1.8 },
    { trato: 'Trato 4', desvio: 1.2 }
  ];

  const generateMockEfficiencyByTrato = () => [
    { trato: 'Trato 1', eficiencia: 92.5 },
    { trato: 'Trato 2', eficiencia: 96.8 },
    { trato: 'Trato 3', eficiencia: 89.2 },
    { trato: 'Trato 4', eficiencia: 98.1 }
  ];

  const generateMockProductivityByHour = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    return hours.map(hour => ({
      hora: `${hour.toString().padStart(2, '0')}:00`,
      volume: hour >= 6 && hour <= 18 ? 80 + Math.random() * 60 : 20 + Math.random() * 30
    }));
  };

  const generateMockPercentualDeviations = () => [
    { desvio: '-20 a -15', frequencia: 2 },
    { desvio: '-15 a -10', frequencia: 5 },
    { desvio: '-10 a -5', frequencia: 12 },
    { desvio: '-5 a 0', frequencia: 18 },
    { desvio: '0 a 5', frequencia: 25 },
    { desvio: '5 a 10', frequencia: 20 },
    { desvio: '10 a 15', frequencia: 12 },
    { desvio: '15 a 20', frequencia: 6 }
  ];

  const generateMockEfficiencyVsAbsoluteDeviation = () => {
    const data = [];
    for (let i = 0; i < 40; i++) {
      const eficiencia = 80 + Math.random() * 40;
      const desvioAbsoluto = Math.random() * 5;
      data.push({ eficiencia, desvioAbsoluto });
    }
    return data;
  };

  const generateMockProductionByWagon = () => [
    { name: 'BAHMAN', value: 45, fill: '#0088FE' },
    { name: 'Vagão 2', value: 25, fill: '#00C49F' },
    { name: 'Vagão 3', value: 18, fill: '#FFBB28' },
    { name: 'Vagão 4', value: 12, fill: '#FF8042' }
  ];

  const generateMockEfficiencyTimeline = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    return hours.map(hour => ({
      hora: `${hour.toString().padStart(2, '0')}:00`,
      eficiencia: 100 - (hour * 0.8) + (Math.random() * 10 - 5)
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
  
  // Dados para análise de distribuição
  const efficiencyDistributionHist = generateMockEfficiencyDistributionHist();
  const efficiencyByHandler = generateMockEfficiencyByHandler();
  const efficiencyByDietType = generateMockEfficiencyByDietType();
  const realizadoVsPrevisto = generateMockRealizadoVsPrevisto();
  const desvioAbsolutoByTrato = generateMockDesvioAbsolutoByTrato();
  const efficiencyByTrato = generateMockEfficiencyByTrato();
  const productivityByHour = generateMockProductivityByHour();
  const percentualDeviations = generateMockPercentualDeviations();
  const efficiencyVsAbsoluteDeviation = generateMockEfficiencyVsAbsoluteDeviation();
  const productionByWagon = generateMockProductionByWagon();
  const efficiencyTimeline = generateMockEfficiencyTimeline();

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
                              color: 'hsl(var(--foreground))',
                              fontSize: '14px',
                              fontWeight: '500'
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
            
            {/* Chat Button - Fixed position for Distribution section */}
            <div className="fixed bottom-6 right-6 z-50">
              <Button
                className="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center"
                onClick={() => setIsChatOpen(true)}
              >
                <MessageCircle className="h-6 w-6" />
              </Button>
            </div>
            
            {/* Análises Quantitativas Gerais */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-text-primary mb-6">Análises Quantitativas Gerais</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* 1. Distribuição da Eficiência (Histograma) */}
                <Card className="border-border-subtle bg-card-secondary/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">Distribuição da Eficiência (Histograma)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={efficiencyDistributionHist} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="eficiencia" stroke="white" fontSize={12} />
                          <YAxis stroke="white" fontSize={12} label={{ value: 'Frequência', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: 'white' } }} />
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px',
                              color: 'hsl(var(--foreground))'
                            }}
                            formatter={(value) => [`${value}`, 'Frequência']}
                          />
                          <Bar dataKey="frequencia" fill="#0088FE" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* 2. Realizado vs Previsto (Scatter Plot) */}
                <Card className="border-border-subtle bg-card-secondary/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">Realizado vs Previsto (Scatter Plot)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={realizadoVsPrevisto.slice(0, 15)} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="previsto" stroke="white" fontSize={12} label={{ value: 'Previsto (kg)', position: 'insideBottom', offset: -5, style: { textAnchor: 'middle', fill: 'white' } }} />
                          <YAxis stroke="white" fontSize={12} label={{ value: 'Realizado (kg)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: 'white' } }} />
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px',
                              color: 'hsl(var(--foreground))'
                            }}
                            formatter={(value) => [`${Math.round(Number(value))} kg`, '']}
                          />
                          <Bar dataKey="realizado" fill="#00C49F" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* 3. Desvio Absoluto por Trato */}
                <Card className="border-border-subtle bg-card-secondary/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">Desvio Absoluto por Trato</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={desvioAbsolutoByTrato} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="trato" stroke="white" fontSize={12} />
                          <YAxis stroke="white" fontSize={12} label={{ value: 'Desvio Absoluto (kg)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: 'white' } }} />
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px',
                              color: 'hsl(var(--foreground))'
                            }}
                            formatter={(value) => [`${value} kg`, 'Desvio']}
                          />
                          <Bar dataKey="desvio" fill="#FFBB28" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* 4. Eficiência Média por Trato */}
                <Card className="border-border-subtle bg-card-secondary/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">Eficiência Média por Trato</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={efficiencyByTrato} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="trato" stroke="white" fontSize={12} />
                          <YAxis stroke="white" fontSize={12} domain={[80, 110]} label={{ value: 'Eficiência (%)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: 'white' } }} />
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px',
                              color: 'hsl(var(--foreground))'
                            }}
                            formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Eficiência']}
                          />
                          <Bar dataKey="eficiencia" fill="#8884d8" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* 5. Produtividade por Hora */}
                <Card className="border-border-subtle bg-card-secondary/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">Produtividade por Hora</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={productivityByHour} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="hora" stroke="white" fontSize={12} />
                          <YAxis stroke="white" fontSize={12} label={{ value: 'Volume (kg)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: 'white' } }} />
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px',
                              color: 'hsl(var(--foreground))'
                            }}
                            formatter={(value) => [`${Math.round(Number(value))} kg`, 'Volume']}
                          />
                          <Line type="monotone" dataKey="volume" stroke="#82ca9d" strokeWidth={3} dot={{ r: 4 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* 6. Distribuição dos Desvios Percentuais */}
                <Card className="border-border-subtle bg-card-secondary/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">Distribuição dos Desvios Percentuais</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={percentualDeviations} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="desvio" stroke="white" fontSize={12} />
                          <YAxis stroke="white" fontSize={12} label={{ value: 'Frequência', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: 'white' } }} />
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px',
                              color: 'hsl(var(--foreground))'
                            }}
                            formatter={(value) => [`${value}`, 'Frequência']}
                          />
                          <Bar dataKey="frequencia" fill="#FF8042" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* 7. Distribuição da Produção por Vagão */}
                <Card className="border-border-subtle bg-card-secondary/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">Distribuição da Produção por Vagão</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={productionByWagon}
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
                              color: 'hsl(var(--foreground))',
                              fontSize: '14px',
                              fontWeight: '500'
                            }}
                            formatter={(value) => [`${value}%`, 'Participação']}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* 8. Eficiência ao Longo do Tempo */}
                <Card className="border-border-subtle bg-card-secondary/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">Eficiência ao Longo do Tempo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={efficiencyTimeline} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="hora" stroke="white" fontSize={12} />
                          <YAxis stroke="white" fontSize={12} domain={[85, 105]} label={{ value: 'Eficiência (%)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: 'white' } }} />
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px',
                              color: 'hsl(var(--foreground))'
                            }}
                            formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Eficiência']}
                          />
                          <Line type="monotone" dataKey="eficiencia" stroke="#8884d8" strokeWidth={3} dot={{ r: 4 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
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