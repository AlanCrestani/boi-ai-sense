import { Layout } from "@/components/Layout";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from "@/components/ui/breadcrumb";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Truck, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  MapPin,
  Route,
  Calendar,
  Users
} from "lucide-react";

export default function Logistics() {
  const navigate = useNavigate();

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  const logisticsData = [
    {
      id: 1,
      rota: "Rota A - Pasto Norte",
      status: "em_andamento",
      progresso: 75,
      horaInicio: "06:00",
      previsaoTermino: "08:30",
      responsavel: "João Silva",
      equipamento: "Caminhão 001",
      pastos: ["P1", "P2", "P3", "P4"],
      totalAnimais: 450
    },
    {
      id: 2,
      rota: "Rota B - Pasto Sul",
      status: "concluida",
      progresso: 100,
      horaInicio: "07:00",
      previsaoTermino: "09:00",
      responsavel: "Maria Santos",
      equipamento: "Caminhão 002",
      pastos: ["P5", "P6", "P7"],
      totalAnimais: 320
    },
    {
      id: 3,
      rota: "Rota C - Pasto Oeste",
      status: "pendente",
      progresso: 0,
      horaInicio: "08:00",
      previsaoTermino: "10:30",
      responsavel: "Pedro Costa",
      equipamento: "Caminhão 003",
      pastos: ["P8", "P9", "P10", "P11", "P12"],
      totalAnimais: 620
    }
  ];

  const equipmentData = [
    {
      id: "CAM001",
      nome: "Caminhão 001",
      status: "operando",
      capacidade: "5.000 kg",
      localizacao: "Pasto Norte - P3",
      manutencao: "Em dia",
      proximaManutencao: "15 dias"
    },
    {
      id: "CAM002", 
      nome: "Caminhão 002",
      status: "disponivel",
      capacidade: "4.500 kg",
      localizacao: "Base Central",
      manutencao: "Em dia",
      proximaManutencao: "8 dias"
    },
    {
      id: "CAM003",
      nome: "Caminhão 003",
      status: "manutencao",
      capacidade: "5.500 kg",
      localizacao: "Oficina",
      manutencao: "Preventiva",
      proximaManutencao: "Hoje"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "concluida":
      case "operando":
        return "bg-primary/20 text-primary";
      case "em_andamento":
        return "bg-accent/20 text-accent-foreground";
      case "pendente":
        return "bg-muted text-muted-foreground";
      case "disponivel":
        return "bg-secondary/20 text-secondary-foreground";
      case "manutencao":
        return "bg-destructive/20 text-destructive";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "concluida":
        return "Concluída";
      case "em_andamento":
        return "Em Andamento";
      case "pendente":
        return "Pendente";
      case "operando":
        return "Operando";
      case "disponivel":
        return "Disponível";
      case "manutencao":
        return "Manutenção";
      default:
        return status;
    }
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
                <BreadcrumbPage>Logística de Tratos</BreadcrumbPage>
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
          <h1 className="text-3xl font-bold text-text-primary mb-2">Logística de Tratos</h1>
          <p className="text-text-secondary">Gerencie rotas, distribuição e equipamentos de trato</p>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Rotas Ativas"
            value="2"
            subtitle="+1 hoje"
            trend="up"
            icon={<Route className="h-5 w-5" />}
          />
          <MetricCard
            title="Equipamentos Operando"
            value="2/3"
            subtitle="1 em manutenção"
            trend="stable"
            icon={<Truck className="h-5 w-5" />}
          />
          <MetricCard
            title="Eficiência Média"
            value="94%"
            subtitle="+3% esta semana"
            trend="up"
            icon={<CheckCircle className="h-5 w-5" />}
          />
          <MetricCard
            title="Tempo Médio/Rota"
            value="2h 15m"
            subtitle="-15min otimizado"
            trend="down"
            icon={<Clock className="h-5 w-5" />}
          />
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="rotas" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="rotas" className="flex items-center space-x-2">
              <Route className="h-4 w-4" />
              <span>Rotas & Distribuição</span>
            </TabsTrigger>
            <TabsTrigger value="equipamentos" className="flex items-center space-x-2">
              <Truck className="h-4 w-4" />
              <span>Gestão de Equipamentos</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rotas">
            <Card className="tech-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold">Rotas de Distribuição</h3>
                  <p className="text-sm text-muted-foreground">
                    Acompanhamento em tempo real das rotas de alimentação
                  </p>
                </div>
                <Button variant="tech" size="sm">
                  <Calendar className="h-4 w-4 mr-2" />
                  Programar Nova Rota
                </Button>
              </div>

              <div className="space-y-4">
                {logisticsData.map((rota) => (
                  <div key={rota.id} className="border rounded-lg p-4 hover:border-primary/30 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <MapPin className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium">{rota.rota}</h4>
                          <p className="text-sm text-muted-foreground">
                            {rota.responsavel} • {rota.equipamento}
                          </p>
                        </div>
                      </div>
                      <Badge className={getStatusColor(rota.status)}>
                        {getStatusLabel(rota.status)}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Horário</p>
                        <p className="font-medium">{rota.horaInicio} - {rota.previsaoTermino}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Progresso</p>
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary rounded-full h-2 transition-all duration-300"
                              style={{ width: `${rota.progresso}%` }}
                            />
                          </div>
                          <span className="font-medium">{rota.progresso}%</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Pastos</p>
                        <p className="font-medium">{rota.pastos.join(", ")}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Animais</p>
                        <p className="font-medium flex items-center">
                          <Users className="h-3 w-3 mr-1" />
                          {rota.totalAnimais}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="equipamentos">
            <Card className="tech-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold">Gestão de Equipamentos</h3>
                  <p className="text-sm text-muted-foreground">
                    Status e manutenção da frota de distribuição
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Agendar Manutenção
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {equipmentData.map((equipamento) => (
                  <div key={equipamento.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-secondary/10 rounded-lg">
                          <Truck className="h-4 w-4 text-secondary-foreground" />
                        </div>
                        <div>
                          <h4 className="font-medium">{equipamento.nome}</h4>
                          <p className="text-xs text-muted-foreground">{equipamento.id}</p>
                        </div>
                      </div>
                      <Badge className={getStatusColor(equipamento.status)}>
                        {getStatusLabel(equipamento.status)}
                      </Badge>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Capacidade:</span>
                        <span className="font-medium">{equipamento.capacidade}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Localização:</span>
                        <span className="font-medium text-xs">{equipamento.localizacao}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Manutenção:</span>
                        <span className="font-medium">{equipamento.manutencao}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Próxima:</span>
                        <span className={`font-medium text-xs ${equipamento.proximaManutencao === "Hoje" ? "text-destructive" : ""}`}>
                          {equipamento.proximaManutencao}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}