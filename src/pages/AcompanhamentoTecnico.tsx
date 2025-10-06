import React, { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Scale,
  Beaker,
  Wheat,
  Droplets,
  Package2,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileEdit,
  TrendingUp,
  Activity,
  BarChart3,
  AlertTriangle,
  Info,
  Edit2,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { NovaChecagemDialog } from '@/components/checagem/NovaChecagemDialog';
import { NovaChecagemPennStateDialog } from '@/components/checagem/NovaChecagemPennStateDialog';
import { NovaChecagemGranulometriaDialog } from '@/components/checagem/NovaChecagemGranulometriaDialog';
import { NovaChecagemLimpezaDialog } from '@/components/checagem/NovaChecagemLimpezaDialog';
import { NovaChecagemEnsilagemDialog } from '@/components/checagem/NovaChecagemEnsilagemDialog';
import {
  useAnaliseBalancaoVisor,
  useAnaliseVisorSistema,
  useAnaliseCarregamentoDistribuicao,
  useChecagensPesoVagao,
  useDeleteChecagemPesoVagao
} from '@/hooks/useChecagemPesoVagao';
import {
  usePennStateResumo,
  useDeleteChecagemPennState
} from '@/hooks/useChecagemPennState';
import { useChecagemGranulometria } from '@/hooks/useChecagemGranulometria';
import {
  useAnaliseLimpezaBebedouros,
  useDeleteChecagemLimpezaBebedouros
} from '@/hooks/useChecagemLimpezaBebedouros';
import {
  useEnsilagemResumo,
  useDeleteChecagemEnsilagem
} from '@/hooks/useChecagemProcessoEnsilagem';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface CheckItem {
  id: string;
  data: Date;
  responsavel: string;
  status: 'conforme' | 'nao_conforme' | 'pendente';
  observacoes?: string;
  valor?: number;
  unidade?: string;
}

const mockChecagemQualidade: CheckItem[] = [
  { id: '1', data: new Date(), responsavel: 'Ana Lima', status: 'conforme', observacoes: 'Mistura homogênea, sem grumos' },
  { id: '2', data: new Date(Date.now() - 86400000), responsavel: 'Carlos Souza', status: 'pendente', observacoes: 'Aguardando análise laboratorial' },
];

const mockChecagemGranulometria: CheckItem[] = [
  { id: '1', data: new Date(), responsavel: 'João Silva', status: 'conforme', valor: 3.2, unidade: 'mm', observacoes: 'Granulometria adequada' },
  { id: '2', data: new Date(Date.now() - 86400000), responsavel: 'Maria Santos', status: 'nao_conforme', valor: 4.5, unidade: 'mm', observacoes: 'Grãos muito grossos, ajustar moedor' },
];

const mockChecagemBebedouros: CheckItem[] = [
  { id: '1', data: new Date(), responsavel: 'Pedro Costa', status: 'conforme', observacoes: 'Bebedouros limpos e funcionando' },
  { id: '2', data: new Date(Date.now() - 86400000), responsavel: 'Ana Lima', status: 'nao_conforme', observacoes: 'Bebedouro do curral 15 com vazamento' },
];

const mockChecagemEnsilagem: CheckItem[] = [
  { id: '1', data: new Date(), responsavel: 'Carlos Souza', status: 'conforme', valor: 35, unidade: '%MS', observacoes: 'Matéria seca adequada' },
  { id: '2', data: new Date(Date.now() - 86400000), responsavel: 'João Silva', status: 'pendente', observacoes: 'Aguardando resultado de pH' },
];

export default function AcompanhamentoTecnico() {
  const [activeTab, setActiveTab] = useState('peso-vagao');
  const [subTab, setSubTab] = useState('balancao-visor');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  // Hooks para buscar dados reais - Peso Vagão
  const { data: checagensPesoVagao, isLoading: loadingChecagens } = useChecagensPesoVagao();
  const { data: analiseBalancaoVisor, isLoading: loadingBalancao } = useAnaliseBalancaoVisor();
  const { data: analiseVisorSistema, isLoading: loadingVisor } = useAnaliseVisorSistema();
  const { data: analiseCarregamentoDistribuicao, isLoading: loadingDistribuicao } = useAnaliseCarregamentoDistribuicao();
  const deleteChecagem = useDeleteChecagemPesoVagao();

  // Hooks para buscar dados reais - Penn State
  const { data: pennStateResumo, isLoading: loadingPennState } = usePennStateResumo();
  const deleteChecagemPennState = useDeleteChecagemPennState();

  // Hook para buscar dados reais - Granulometria
  const { data: checagensGranulometria, isLoading: loadingGranulometria } = useChecagemGranulometria();

  // Hook para buscar dados reais - Limpeza Bebedouros
  const { data: analiseLimpezaBebedouros, isLoading: loadingBebedouros } = useAnaliseLimpezaBebedouros();
  const deleteChecagemBebedouro = useDeleteChecagemLimpezaBebedouros();

  // Hook para buscar dados reais - Processo de Ensilagem
  const { data: ensilagemResumo, isLoading: loadingEnsilagem } = useEnsilagemResumo();
  const deleteChecagemEnsilagem = useDeleteChecagemEnsilagem();

  const [deleteType, setDeleteType] = useState<'peso' | 'pennstate' | 'bebedouro' | 'ensilagem'>('peso');

  const handleDelete = (id: string, type: 'peso' | 'pennstate' | 'bebedouro' | 'ensilagem' = 'peso') => {
    setItemToDelete(id);
    setDeleteType(type);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      if (deleteType === 'peso') {
        deleteChecagem.mutate(itemToDelete);
      } else if (deleteType === 'pennstate') {
        deleteChecagemPennState.mutate(itemToDelete);
      } else if (deleteType === 'bebedouro') {
        deleteChecagemBebedouro.mutate(itemToDelete);
      } else if (deleteType === 'ensilagem') {
        deleteChecagemEnsilagem.mutate(itemToDelete);
      }
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  const handleEdit = (id: string) => {
    // TODO: Implementar edição
    console.log('Editar checagem:', id);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'conforme':
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
            <CheckCircle className="w-3 h-3 mr-1" />
            Conforme
          </Badge>
        );
      case 'nao_conforme':
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
            <XCircle className="w-3 h-3 mr-1" />
            Não Conforme
          </Badge>
        );
      case 'pendente':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
            <AlertCircle className="w-3 h-3 mr-1" />
            Pendente
          </Badge>
        );
      default:
        return null;
    }
  };

  const getToleranceBadge = (status: string) => {
    switch (status) {
      case 'verde':
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
            <CheckCircle className="w-3 h-3 mr-1" />
            0-2%
          </Badge>
        );
      case 'amarelo':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
            <AlertCircle className="w-3 h-3 mr-1" />
            2-5%
          </Badge>
        );
      case 'vermelho':
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
            <XCircle className="w-3 h-3 mr-1" />
            5-10%
          </Badge>
        );
      case 'vermelho_escuro':
        return (
          <Badge className="bg-red-900 text-white">
            <AlertTriangle className="w-3 h-3 mr-1" />
            &gt;10%
          </Badge>
        );
      default:
        return null;
    }
  };

  const renderTable = (data: CheckItem[], caption: string, showValue = false) => (
    <Table>
      <TableCaption>{caption}</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Data</TableHead>
          <TableHead>Responsável</TableHead>
          {showValue && <TableHead>Valor</TableHead>}
          <TableHead>Status</TableHead>
          <TableHead>Observações</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((item) => (
          <TableRow key={item.id}>
            <TableCell>
              {format(item.data, "dd/MM/yyyy HH:mm", { locale: ptBR })}
            </TableCell>
            <TableCell>{item.responsavel}</TableCell>
            {showValue && (
              <TableCell>
                {item.valor} {item.unidade}
              </TableCell>
            )}
            <TableCell>{getStatusBadge(item.status)}</TableCell>
            <TableCell className="max-w-md truncate">
              {item.observacoes || '-'}
            </TableCell>
            <TableCell className="text-right">
              <Button variant="ghost" size="sm">
                <FileEdit className="w-4 h-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  const renderAnaliseBalancaoVisor = () => {
    if (loadingBalancao) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      );
    }

    if (!analiseBalancaoVisor || analiseBalancaoVisor.length === 0) {
      return (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Nenhuma checagem encontrada</AlertTitle>
          <AlertDescription>
            Registre uma nova checagem para começar a análise comparativa.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <Table>
        <TableCaption>Análise comparativa entre peso do balancão e visor do vagão</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Data/Hora</TableHead>
            <TableHead>Vagão</TableHead>
            <TableHead className="text-right">Peso Balancão</TableHead>
            <TableHead className="text-right">Peso Visor</TableHead>
            <TableHead className="text-right">Diferença (kg)</TableHead>
            <TableHead className="text-right">Diferença (%)</TableHead>
            <TableHead>Tolerância</TableHead>
            <TableHead>Responsável</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {analiseBalancaoVisor.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                {format(new Date(item.data_checagem + ' ' + item.hora_checagem), "dd/MM/yyyy HH:mm", { locale: ptBR })}
              </TableCell>
              <TableCell>{item.vagao_codigo} - {item.vagao_nome}</TableCell>
              <TableCell className="text-right font-medium">
                {item.peso_liquido_balancao?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} kg
              </TableCell>
              <TableCell className="text-right font-medium">
                {item.peso_visor_balanca_vagao?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} kg
              </TableCell>
              <TableCell className="text-right">
                {item.diferenca_kg?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} kg
              </TableCell>
              <TableCell className="text-right font-bold">
                {item.diferenca_percentual?.toFixed(2)}%
              </TableCell>
              <TableCell>
                {getToleranceBadge(item.status_tolerancia)}
              </TableCell>
              <TableCell>{item.responsavel_nome}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(item.id)}
                    title="Editar checagem"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(item.id)}
                    title="Excluir checagem"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  const renderAnaliseVisorSistema = () => {
    if (loadingVisor) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      );
    }

    if (!analiseVisorSistema || analiseVisorSistema.length === 0) {
      return (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Nenhuma análise disponível</AlertTitle>
          <AlertDescription>
            Esta análise requer que o sistema identifique automaticamente o id_carregamento correspondente.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <Table>
        <TableCaption>Análise comparativa entre peso do visor e sistema (id_carregamento)</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Data/Hora</TableHead>
            <TableHead>Vagão</TableHead>
            <TableHead>ID Carregamento</TableHead>
            <TableHead className="text-right">Peso Visor</TableHead>
            <TableHead className="text-right">Peso Sistema</TableHead>
            <TableHead className="text-right">Diferença (kg)</TableHead>
            <TableHead className="text-right">Diferença (%)</TableHead>
            <TableHead>Tolerância</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {analiseVisorSistema.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                {format(new Date(item.data_checagem + ' ' + item.hora_checagem), "dd/MM/yyyy HH:mm", { locale: ptBR })}
              </TableCell>
              <TableCell>{item.vagao_codigo} - {item.vagao_nome}</TableCell>
              <TableCell className="font-mono">{item.id_carregamento}</TableCell>
              <TableCell className="text-right font-medium">
                {item.peso_visor_balanca_vagao?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} kg
              </TableCell>
              <TableCell className="text-right font-medium">
                {item.peso_sistema?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} kg
              </TableCell>
              <TableCell className="text-right">
                {item.diferenca_kg?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} kg
              </TableCell>
              <TableCell className="text-right font-bold">
                {item.diferenca_percentual?.toFixed(2)}%
              </TableCell>
              <TableCell>
                {getToleranceBadge(item.status_tolerancia)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };
  const renderPennState = () => {
    if (loadingPennState) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      );
    }

    if (!pennStateResumo || pennStateResumo.length === 0) {
      return (
        <Alert>
          <Info className="h-4 h-4" />
          <AlertTitle>Nenhuma análise encontrada</AlertTitle>
          <AlertDescription>
            Registre uma nova análise Penn State para começar o controle de qualidade da mistura.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <div className="space-y-6">
        <Table>
          <TableCaption>Histórico de análises Penn State</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Data/Hora</TableHead>
              <TableHead>Dieta</TableHead>
              <TableHead>Vagão</TableHead>
              <TableHead>19mm</TableHead>
              <TableHead>8mm</TableHead>
              <TableHead>4mm</TableHead>
              <TableHead>Fundo</TableHead>
              <TableHead>CV Máx</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pennStateResumo.map((item) => {
              const cvMax = Math.max(
                item.cv_19mm || 0,
                item.cv_08mm || 0,
                item.cv_04mm || 0,
                item.cv_fundo || 0
              );

              return (
                <TableRow key={item.id}>
                  <TableCell>
                    {format(new Date(item.data_checagem + ' ' + item.hora_checagem), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </TableCell>
                  <TableCell>{item.dieta_nome || '-'}</TableCell>
                  <TableCell>
                    {item.vagao_codigo ? `${item.vagao_codigo} - ${item.vagao_nome}` : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium">{item.media_19mm?.toFixed(2)}%</div>
                      <div className="text-xs text-muted-foreground">
                        CV: {item.cv_19mm?.toFixed(2)}%
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium">{item.media_08mm?.toFixed(2)}%</div>
                      <div className="text-xs text-muted-foreground">
                        CV: {item.cv_08mm?.toFixed(2)}%
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium">{item.media_04mm?.toFixed(2)}%</div>
                      <div className="text-xs text-muted-foreground">
                        CV: {item.cv_04mm?.toFixed(2)}%
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium">{item.media_fundo?.toFixed(2)}%</div>
                      <div className="text-xs text-muted-foreground">
                        CV: {item.cv_fundo?.toFixed(2)}%
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        cvMax < 10
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                          : cvMax < 15
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                      }
                    >
                      {cvMax.toFixed(2)}%
                    </Badge>
                  </TableCell>
                  <TableCell>{item.responsavel_nome}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(item.id)}
                        title="Editar análise"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(item.id, 'pennstate')}
                        title="Excluir análise"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  };

  const renderGranulometriaGraos = () => {
    if (loadingGranulometria) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      );
    }

    if (!checagensGranulometria || checagensGranulometria.length === 0) {
      return (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Nenhuma checagem encontrada</AlertTitle>
          <AlertDescription>
            Registre uma nova checagem de granulometria para começar o controle de qualidade dos grãos.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <Table>
        <TableCaption>Histórico de análises granulométricas</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Data/Hora</TableHead>
            <TableHead>Tipo de Grão</TableHead>
            <TableHead>Equipamento</TableHead>
            <TableHead>DGM (mm)</TableHead>
            <TableHead>Uniformidade</TableHead>
            <TableHead>CV Partículas</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Responsável</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {checagensGranulometria.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                {format(new Date(item.data_checagem + ' ' + item.hora_checagem), "dd/MM/yyyy HH:mm", { locale: ptBR })}
              </TableCell>
              <TableCell className="capitalize">
                {item.tipo_grao === 'outro' ? item.outro_grao : item.tipo_grao}
              </TableCell>
              <TableCell>
                {item.equipamento_moagem?.replace('_', ' ').replace('moinho', 'Moinho')}
              </TableCell>
              <TableCell>
                {item.dgm ? item.dgm.toFixed(2) + ' mm' : '-'}
              </TableCell>
              <TableCell>
                <Badge
                  className={
                    item.uniformidade === 'excelente'
                      ? 'bg-green-100 text-green-800'
                      : item.uniformidade === 'boa'
                      ? 'bg-blue-100 text-blue-800'
                      : item.uniformidade === 'regular'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }
                >
                  {item.uniformidade || 'N/A'}
                </Badge>
              </TableCell>
              <TableCell>
                {item.desvio_padrao_geometrico ? item.desvio_padrao_geometrico.toFixed(2) : '-'}
              </TableCell>
              <TableCell>
                <Badge
                  className={
                    item.dentro_especificacao
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }
                >
                  {item.dentro_especificacao ? 'Dentro Espec.' : 'Fora Espec.'}
                </Badge>
              </TableCell>
              <TableCell>{item.created_by_name || '-'}</TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm">
                  <FileEdit className="w-4 h-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  const renderAnaliseCarregamentoDistribuicao = () => {
    if (loadingDistribuicao) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      );
    }

    if (!analiseCarregamentoDistribuicao || analiseCarregamentoDistribuicao.length === 0) {
      return (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Nenhuma análise disponível</AlertTitle>
          <AlertDescription>
            Esta análise requer dados de distribuição associados ao carregamento.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <Table>
        <TableCaption>Análise de rastreabilidade: carregamento x distribuição</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Data/Hora</TableHead>
            <TableHead>Vagão</TableHead>
            <TableHead>ID Carregamento</TableHead>
            <TableHead className="text-right">Peso Carregado</TableHead>
            <TableHead className="text-right">Peso Distribuído</TableHead>
            <TableHead className="text-right">Diferença (kg)</TableHead>
            <TableHead className="text-right">Diferença (%)</TableHead>
            <TableHead>Tolerância</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {analiseCarregamentoDistribuicao.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                {format(new Date(item.data_checagem + ' ' + item.hora_checagem), "dd/MM/yyyy HH:mm", { locale: ptBR })}
              </TableCell>
              <TableCell>{item.vagao_codigo} - {item.vagao_nome}</TableCell>
              <TableCell className="font-mono">{item.id_carregamento}</TableCell>
              <TableCell className="text-right font-medium">
                {item.peso_carregado?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} kg
              </TableCell>
              <TableCell className="text-right font-medium">
                {item.peso_total_distribuido?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} kg
              </TableCell>
              <TableCell className="text-right">
                {item.diferenca_kg?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} kg
              </TableCell>
              <TableCell className="text-right font-bold">
                {item.diferenca_percentual?.toFixed(2)}%
              </TableCell>
              <TableCell>
                {getToleranceBadge(item.status_tolerancia)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  const renderLimpezaBebedouros = () => {
    if (loadingBebedouros) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      );
    }

    if (!analiseLimpezaBebedouros || analiseLimpezaBebedouros.length === 0) {
      return (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Nenhuma checagem encontrada</AlertTitle>
          <AlertDescription>
            Registre uma nova checagem de limpeza de bebedouros.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <Table>
        <TableCaption>Histórico de checagens de limpeza de bebedouros</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Data/Hora</TableHead>
            <TableHead>Curral</TableHead>
            <TableHead>Bebedouro</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Limpeza</TableHead>
            <TableHead>Água</TableHead>
            <TableHead>Estrutura</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Responsável</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {analiseLimpezaBebedouros.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                {format(new Date(item.data_checagem + ' ' + item.hora_checagem), "dd/MM/yyyy HH:mm", { locale: ptBR })}
              </TableCell>
              <TableCell className="font-medium">{item.curral_numero}</TableCell>
              <TableCell>{item.bebedouro_identificacao || '-'}</TableCell>
              <TableCell>{item.tipo_bebedouro || '-'}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span
                      key={i}
                      className={
                        i < (item.score_limpeza || 0)
                          ? 'text-blue-500'
                          : 'text-gray-300'
                      }
                    >
                      ⭐
                    </span>
                  ))}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span
                      key={i}
                      className={
                        i < (item.score_agua || 0)
                          ? 'text-blue-500'
                          : 'text-gray-300'
                      }
                    >
                      ⭐
                    </span>
                  ))}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span
                      key={i}
                      className={
                        i < (item.score_estrutura || 0)
                          ? 'text-blue-500'
                          : 'text-gray-300'
                      }
                    >
                      ⭐
                    </span>
                  ))}
                </div>
              </TableCell>
              <TableCell>
                <Badge
                  className={
                    item.status_geral === 'aprovado'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                      : item.status_geral === 'aprovado_restricao'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                      : item.status_geral === 'reprovado'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                  }
                >
                  {item.status_geral}
                </Badge>
              </TableCell>
              <TableCell>{item.responsavel_nome}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(item.id)}
                    title="Editar checagem"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(item.id, 'bebedouro')}
                    title="Excluir checagem"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  // Função para renderizar dados de Ensilagem
  const renderEnsilagem = () => {
    if (loadingEnsilagem) {
      return (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      );
    }

    if (!ensilagemResumo || ensilagemResumo.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <Wheat className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Nenhuma análise de ensilagem registrada</p>
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data/Hora</TableHead>
            <TableHead>Tipo Forragem</TableHead>
            <TableHead>Local/Nº Silo</TableHead>
            <TableHead>pH</TableHead>
            <TableHead>MS %</TableHead>
            <TableHead>Temp °C</TableHead>
            <TableHead>Qualidade</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Responsável</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ensilagemResumo.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">
                    {format(new Date(item.data_checagem), 'dd/MM/yyyy', { locale: ptBR })}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {item.hora_checagem}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <span className="capitalize">{item.tipo_forragem || '-'}</span>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="text-sm">{item.local_silo || '-'}</span>
                  <span className="text-xs text-muted-foreground">{item.numero_silo || ''}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-mono">{item.ph ? item.ph.toFixed(2) : '-'}</span>
                  {item.classificacao_ph && (
                    <Badge
                      variant="outline"
                      className={
                        item.classificacao_ph === 'ideal'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                          : item.classificacao_ph === 'aceitavel'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                      }
                    >
                      {item.classificacao_ph}
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-mono">{item.materia_seca_percentual ? `${item.materia_seca_percentual.toFixed(1)}%` : '-'}</span>
                  {item.classificacao_ms && (
                    <Badge
                      variant="outline"
                      className={
                        item.classificacao_ms === 'ideal'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                          : item.classificacao_ms === 'aceitavel'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                      }
                    >
                      {item.classificacao_ms}
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <span className="font-mono">{item.temperatura_celsius ? `${item.temperatura_celsius.toFixed(1)}°C` : '-'}</span>
              </TableCell>
              <TableCell>
                {item.score_qualidade ? (
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span
                        key={i}
                        className={
                          i < (item.score_qualidade || 0)
                            ? 'text-yellow-500'
                            : 'text-gray-300'
                        }
                      >
                        ⭐
                      </span>
                    ))}
                  </div>
                ) : (
                  '-'
                )}
              </TableCell>
              <TableCell>
                <Badge
                  className={
                    item.status_conformidade === 'conforme'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                      : item.status_conformidade === 'nao_conforme'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                      : item.status_conformidade === 'condicional'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                  }
                >
                  {item.status_conformidade === 'conforme' && 'Conforme'}
                  {item.status_conformidade === 'nao_conforme' && 'Não Conforme'}
                  {item.status_conformidade === 'condicional' && 'Condicional'}
                  {item.status_conformidade === 'pendente' && 'Pendente'}
                </Badge>
              </TableCell>
              <TableCell>
                <span className="text-sm">{item.responsavel_nome}</span>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(item.id)}
                    title="Editar checagem"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(item.id, 'ensilagem')}
                    title="Excluir checagem"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <Layout>
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Acompanhamento Técnico</h1>
            <p className="text-muted-foreground mt-2">
              Controle de qualidade e checagens operacionais do confinamento
            </p>
          </div>
          {activeTab === 'peso-vagao' && <NovaChecagemDialog />}
          {activeTab === 'qualidade-mistura' && <NovaChecagemPennStateDialog />}
          {activeTab === 'granulometria' && <NovaChecagemGranulometriaDialog />}
          {activeTab === 'bebedouros' && <NovaChecagemLimpezaDialog />}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="peso-vagao" className="flex items-center gap-2">
              <Scale className="w-4 h-4" />
              <span className="hidden lg:inline">Peso Vagão</span>
            </TabsTrigger>
            <TabsTrigger value="qualidade-mistura" className="flex items-center gap-2">
              <Beaker className="w-4 h-4" />
              <span className="hidden lg:inline">Qualidade Mistura</span>
            </TabsTrigger>
            <TabsTrigger value="granulometria" className="flex items-center gap-2">
              <Wheat className="w-4 h-4" />
              <span className="hidden lg:inline">Granulometria</span>
            </TabsTrigger>
            <TabsTrigger value="bebedouros" className="flex items-center gap-2">
              <Droplets className="w-4 h-4" />
              <span className="hidden lg:inline">Bebedouros</span>
            </TabsTrigger>
            <TabsTrigger value="ensilagem" className="flex items-center gap-2">
              <Package2 className="w-4 h-4" />
              <span className="hidden lg:inline">Ensilagem</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="peso-vagao">
            <Card>
              <CardHeader>
                <CardTitle>Checagem Peso Vagão</CardTitle>
                <CardDescription>
                  Análise comparativa entre balancão, visor do vagão e sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Sub-tabs para as 3 análises */}
                <Tabs value={subTab} onValueChange={setSubTab}>
                  <TabsList className="grid w-full grid-cols-3 mb-4">
                    <TabsTrigger value="balancao-visor" className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      <span className="hidden sm:inline">Balancão x Visor</span>
                    </TabsTrigger>
                    <TabsTrigger value="visor-sistema" className="flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      <span className="hidden sm:inline">Visor x Sistema</span>
                    </TabsTrigger>
                    <TabsTrigger value="carregamento-distribuicao" className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      <span className="hidden sm:inline">Carregamento x Distribuição</span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="balancao-visor">
                    <div className="space-y-4">
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertTitle>Análise 1: Balancão x Visor</AlertTitle>
                        <AlertDescription>
                          Compara o peso líquido do balancão (peso carregado - peso vazio) com o peso mostrado no visor da balança do vagão.
                        </AlertDescription>
                      </Alert>
                      {renderAnaliseBalancaoVisor()}
                    </div>
                  </TabsContent>

                  <TabsContent value="visor-sistema">
                    <div className="space-y-4">
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertTitle>Análise 2: Visor x Sistema</AlertTitle>
                        <AlertDescription>
                          Compara o peso do visor da balança com o peso registrado no sistema (id_carregamento).
                        </AlertDescription>
                      </Alert>
                      {renderAnaliseVisorSistema()}
                    </div>
                  </TabsContent>

                  <TabsContent value="carregamento-distribuicao">
                    <div className="space-y-4">
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertTitle>Análise 3: Carregamento x Distribuição</AlertTitle>
                        <AlertDescription>
                          Rastreabilidade completa: compara o peso carregado com a soma dos pesos distribuídos.
                        </AlertDescription>
                      </Alert>
                      {renderAnaliseCarregamentoDistribuicao()}
                    </div>
                  </TabsContent>
                </Tabs>

                {/* Legenda de Tolerâncias */}
                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Tolerâncias:</h4>
                  <div className="flex flex-wrap gap-2">
                    {getToleranceBadge('verde')}
                    {getToleranceBadge('amarelo')}
                    {getToleranceBadge('vermelho')}
                    {getToleranceBadge('vermelho_escuro')}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="qualidade-mistura">
            <Card>
              <CardHeader>
                <CardTitle>Análise Penn State - Qualidade da Mistura</CardTitle>
                <CardDescription>
                  Análise granulométrica em 3 momentos: Início (7-8t), Meio (3,5-4,5t) e Fim (0-1t)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderPennState()}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="granulometria">
            <Card>
              <CardHeader>
                <CardTitle>Checagem Granulometria dos Grãos</CardTitle>
                <CardDescription>
                  Controle do tamanho de partículas dos grãos processados
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderGranulometriaGraos()}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bebedouros">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Checagem Limpeza dos Bebedouros</span>
                  <NovaChecagemLimpezaDialog />
                </CardTitle>
                <CardDescription>
                  Avaliação de limpeza, qualidade da água e condições estruturais
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderLimpezaBebedouros()}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ensilagem">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Checagem Processo de Ensilagem</span>
                  <NovaChecagemEnsilagemDialog />
                </CardTitle>
                <CardDescription>
                  Controle de qualidade do processo de ensilagem (pH, matéria seca, compactação)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderEnsilagem()}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Diálogo de confirmação de exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta checagem? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setItemToDelete(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}